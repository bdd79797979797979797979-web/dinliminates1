import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 180000 });

const FOOD_NAME = 'QA Test Taco Bowl';
const FOOD_EDITED = 'QA Test Taco Bowl Edited';
const ADDRESS = '801 Iron Workers Rd, Clarksville, TN 37043';

function dataPhoto(label, bg='e8d9c6') {
  return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="#'+bg+'"/><text x="160" y="125" text-anchor="middle" font-family="Arial" font-size="24" fill="#18382c">'+label+'</text></svg>');
}

async function waitUi(page, ms=120) { await page.waitForTimeout(ms); }

async function fresh(page) {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4173', { waitUntil:'domcontentloaded' });
  await expect(page.locator('#startBtn')).toBeVisible();
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('dinliminate')) localStorage.removeItem(k);
    }
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#startBtn')).toBeVisible();
}

async function openHomeMenu(page) {
  await page.locator('#homeMenuBtn').click();
  await expect(page.locator('#drawer')).toBeVisible();
}

async function closeOverlay(page, selector) {
  const x = page.locator(selector);
  if (await x.count() && await x.isVisible().catch(()=>false)) {
    const close = x.locator('.icon-btn, [data-close], #closeSettingsBtn, #closeLibraryBtn, #closeDetailsBtn').first();
    if (await close.count()) await close.click();
  }
}

function errorWatch(page) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: '+String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: '+m.text()); });
  return errors;
}

async function passAllCurrent(page, holdSelector, doneSelector, max=20) {
  for (let i=0;i<max;i++) {
    if (await page.locator(doneSelector).count() && await page.locator(doneSelector).isVisible().catch(()=>false)) return;
    const b=page.locator(holdSelector);
    await expect(b).toBeVisible({timeout:10000});
    await b.click();
    await waitUi(page, 270);
  }
  throw new Error('Pass Around did not reach the expected transition within '+max+' votes.');
}

test('full simulated user journey — home, food, custom food, hidden choices, saved/history/settings/restore', async ({ page }) => {
  const errors = errorWatch(page);
  await page.setViewportSize({width:390,height:844});
  await fresh(page);

  // HOME / MENU / ABOUT / IPHONE HELP
  await expect(page.locator('#homePanel')).toBeVisible();
  await expect(page.locator('h1')).toContainText('what sounds good tonight?');
  await openHomeMenu(page);
  await expect(page.locator('#aboutMenuBtn')).toBeVisible();
  await page.locator('#aboutMenuBtn').click();
  await expect(page.locator('#infoBackdrop')).toBeVisible();
  await expect(page.locator('#infoBody')).toContainText('Made by Brian Dunn for Devona Dunn');
  await page.locator('#closeInfoBtn').click();
  await openHomeMenu(page);
  await page.locator('#phoneHelpBtn').click();
  await expect(page.locator('#infoBackdrop')).toContainText('Add to Home Screen');
  await page.locator('#closeInfoBtn').click();

  // FOOD START + CUT/MAYBE/BACK
  await page.locator('#startBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  const startCount=Number(await page.locator('#gameTopCount').textContent());
  expect(startCount).toBeGreaterThan(5);
  await page.locator('#cutBtn').click();
  await waitUi(page,300);
  expect(Number(await page.locator('#gameTopCount').textContent())).toBe(startCount-1);
  await page.locator('#backBtn').click();
  await waitUi(page,100);
  expect(Number(await page.locator('#gameTopCount').textContent())).toBe(startCount);
  await page.locator('#holdBtn').click();
  await waitUi(page,300);
  expect(Number(await page.locator('#gameTopCount').textContent())).toBe(startCount-1);
  await page.locator('#backBtn').click();
  await waitUi(page,100);

  // FOOD QUICK CUT HIDE + RESTORE
  const burgerQC=page.locator('#quickCutsBar .quick-cut').filter({hasText:'Burgers'}).first();
  await expect(burgerQC).toBeVisible();
  const beforeQC=Number(await page.locator('#gameTopCount').textContent());
  await burgerQC.click(); await waitUi(page,150);
  const hiddenQC=page.locator('#quickCutsBar .quick-cut').filter({hasText:'Burgers'}).first();
  await expect(hiddenQC).toHaveAttribute('aria-pressed','true');
  expect(Number(await page.locator('#gameTopCount').textContent())).toBeLessThan(beforeQC);
  await hiddenQC.click(); await waitUi(page,150);
  await expect(page.locator('#quickCutsBar .quick-cut').filter({hasText:'Burgers'}).first()).toHaveAttribute('aria-pressed','false');

  // ADD CUSTOM FOOD + PHOTO + TAG + NOTE + RECIPE
  await page.locator('#addDuringBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await page.locator('#newName').fill(FOOD_NAME);
  await page.locator('#newCategory').selectOption('Dinner');
  await page.locator('#newNotes').fill('QA note');
  await page.locator('#newRecipe').fill('QA recipe');
  await page.locator('[data-add-tag="mexican"]').click();
  const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
  await page.locator('#newPhoto').setInputFiles({name:'qa.png',mimeType:'image/png',buffer:pixel});
  await expect(page.locator('#newPhotoPreview')).toHaveClass(/show/, {timeout:5000});
  await page.locator('#saveBtn').click();
  await waitUi(page,250);
  await expect(page.locator('#gamePanel')).toBeVisible();
  await expect(page.locator('#stage .stack-card.active')).toContainText(FOOD_NAME);
  const customImg=page.locator('#stage .stack-card.active .card-photo img');
  await expect(customImg).toBeVisible();
  expect((await customImg.getAttribute('src')) || '').toMatch(/^data:image\//);

  // CUSTOM FOOD DETAILS + SAVE + EDIT
  await page.locator('#stage .stack-card.active [data-card-action="details"]').click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await expect(page.locator('#detailTitle')).toHaveText(FOOD_NAME);
  await expect(page.locator('#detailGrid')).toContainText('QA recipe');
  await page.locator('#detailSaveBtn').click();
  await expect(page.locator('#detailSaveBtn')).toHaveText('♥ Saved');
  await page.locator('#editCardBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await page.locator('#newName').fill(FOOD_EDITED);
  await page.locator('#saveBtn').click(); await waitUi(page,250);
  await expect(page.locator('#stage .stack-card.active')).toContainText(FOOD_EDITED);

  // DELETE CUSTOM FOOD: CANCEL THEN CONFIRM
  await page.locator('#stage .stack-card.active [data-card-action="details"]').click();
  await page.locator('#deleteCardBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await page.locator('#confirmCancelBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeHidden();
  await page.locator('#deleteCardBtn').click();
  await page.locator('#confirmCutBtn').click();
  await waitUi(page,200);
  expect(await page.locator('text='+JSON.stringify(FOOD_EDITED)).count()).toBe(0);

  // HIDE BUILT-IN: CANCEL THEN CONFIRM, THEN UNHIDE IN SETTINGS
  const builtIn=page.locator('#stage .stack-card.active').first();
  const builtInName=(await builtIn.locator('.card-name').textContent()).trim();
  await page.locator('#hideBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await page.locator('#confirmCancelBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeHidden();
  await page.locator('#hideBtn').click();
  await page.locator('#confirmCutBtn').click(); await waitUi(page,250);
  await page.evaluate(()=>window.openSettings());
  await expect(page.locator('#settingsBackdrop')).toBeVisible();
  await expect(page.locator('#hiddenFoodList')).toContainText(builtInName);
  const row=page.locator('#hiddenFoodList .hidden-choice-row').filter({hasText:builtInName}).first;
  await row.locator('[data-unhide]').click();
  await waitUi(page,180);
  await expect(page.locator('#hiddenFoodList')).not.toContainText(builtInName);

  // SETTINGS TOGGLES + EXPORT
  const hideToggle=page.locator('#hideToggle');
  const beforeHide=await hideToggle.getAttribute('aria-pressed');
  await hideToggle.click();
  expect(await hideToggle.getAttribute('aria-pressed')).not.toBe(beforeHide);
  await hideToggle.click();
  const quickBefore=await page.locator('#prefQuick').getAttribute('aria-pressed');
  await page.locator('#prefQuick').click();
  expect(await page.locator('#prefQuick').getAttribute('aria-pressed')).not.toBe(quickBefore);
  await page.locator('#prefQuick').click();
  const comfortBefore=await page.locator('#prefComfort').getAttribute('aria-pressed');
  await page.locator('#prefComfort').click();
  expect(await page.locator('#prefComfort').getAttribute('aria-pressed')).not.toBe(comfortBefore);
  await page.locator('#prefComfort').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportDataBtn').click();
  await downloadPromise;
  await page.locator('#closeSettingsBtn').click();

  // SAVE A BUILT-IN + WINNER + HISTORY CALENDAR + X-OUT
  const saveCandidate=page.locator('#stage .stack-card.active').first;
  const savedName=(await saveCandidate.locator('.card-name').textContent()).trim();
  await saveCandidate.locator('[data-card-action="details"]').click();
  await page.locator('#detailSaveBtn').click();
  await expect(page.locator('#detailSaveBtn')).toHaveText('♥ Saved');
  await page.locator('#closeDetailsBtn').click();
  await page.locator('#stage .stack-card.active [data-card-action="choose"]').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await expect(page.locator('#winnerName')).toHaveText(savedName);
  await openHomeMenu(page);
  await page.locator('#historyMenuBtn').click();
  await expect(page.locator('#libraryBackdrop')).toBeVisible();
  await expect(page.locator('.history-calendar-grid')).toBeVisible();
  await expect(page.locator('.history-event-main img').first()).toBeVisible();
  const historyCount=await page.locator('.history-event').count();
  expect(historyCount).toBeGreaterThan(0);
  await page.locator('.history-event-x').first().click();
  await waitUi(page,80);
  expect(await page.locator('.history-event').count()).toBe(historyCount-1);
  await page.locator('#closeLibraryBtn').click();

  // SAVED TAB + REMOVE
  await openHomeMenu(page);
  await page.locator('#historyMenuBtn').click();
  await page.locator('[data-library-tab="saved"]').click();
  await expect(page.locator('#libraryList')).toContainText(savedName);
  await page.locator('[data-lib-remove]').first().click();
  await expect(page.locator('#libraryList')).not.toContainText(savedName);
  await page.locator('#closeLibraryBtn').click();

  // SYSTEM RESTORE CANCEL THEN CONFIRM; custom/hidden/saved/history should be cleared
  await openHomeMenu(page);
  await page.locator('#settingsBtn').click();
  await page.locator('#systemRestoreBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeVisible();
  await page.locator('#restoreCancelBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeHidden();
  await page.locator('#systemRestoreBtn').click();
  await page.locator('#restoreConfirmBtn').click();
  await waitUi(page,350);
  const restored=await page.evaluate(()=>({
    custom:JSON.parse(localStorage.getItem('dinliminateCustom')||'[]'),
    hidden:JSON.parse(localStorage.getItem('dinliminateHidden')||'[]'),
    saved:JSON.parse(localStorage.getItem('dinliminateSaved')||'[]'),
    history:JSON.parse(localStorage.getItem('dinliminateHistory')||'[]')
  }));
  expect(restored.custom).toEqual([]);
  expect(restored.hidden).toEqual([]);
  expect(restored.saved).toEqual([]);
  expect(restored.history).toEqual([]);

  // RESTAURANT FLOW — MOCK PROVIDER DATA, BUT EXERCISE REAL UI CODE
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4173', {waitUntil:'domcontentloaded'});
  await page.locator('#homeRestaurantQuick').click();
  await waitUi(page,120);
  await expect(page.locator('#restaurantPanel')).toBeVisible();
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({latitude:36.4426778,longitude:-87.1784093});
  await page.locator('#restaurantUseLocationBtn').click();
  await waitUi(page,300);
  await page.locator('#restaurantRadiusFilter').selectOption('1');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('1 mi');
  await page.locator('#restaurantRadiusFilter').selectOption('100');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('100 mi');

  const location=page.locator('#restaurantLocationInput');
  await location.fill(ADDRESS);
  await expect(page.locator('.restaurant-address-suggestion').first()).toBeVisible();
  await page.locator('.restaurant-address-suggestion').first().click();
  await waitUi(page,250);
  await expect(page.locator('.restaurant-card-v240')).toBeVisible({timeout:15000});
  await expect(page.locator('#restaurantStage')).toContainText("McDonald's");
  await expect(page.locator('#restaurantStage')).toContainText("Waffle House");
  const rImg=page.locator('#restaurantStage .restaurant-photo-v240 img').first();
  await expect(rImg).toBeVisible();
  const rSrc=await rImg.getAttribute('src');
  expect(rSrc).toMatch(/^data:image\//);

  // HOURS TOGGLE
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText(/Open \/ Unknown/);
  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText('Closed');
  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText(/Open \/ Unknown/);

  // INLINE RESTAURANT SEARCH
  await page.locator('#restaurantSearchBtn').click();
  await expect(page.locator('#restaurantInlineSearch')).toBeVisible();
  await page.locator('#restaurantInlineSearchInput').fill('Burger King');
  await waitUi(page,100);
  await expect(page.locator('#restaurantStage')).toContainText('Burger King');
  await page.locator('#restaurantInlineSearchInput').fill('');
  await waitUi(page,100);

  // QUICK CUTS ALL HIDE/RESTORE
  for (const label of ['Fast Food','American','Pasta','Healthy','Southern','Potato','Soup / Stew']) {
    const btn=page.locator('#restaurantQuickCuts button').filter({hasText:label}).first;
    await expect(btn).toBeVisible();
    await btn.click(); await expect(btn).toHaveAttribute('aria-pressed','true');
    await btn.click(); await expect(btn).toHaveAttribute('aria-pressed','false');
  }

  // RESTAURANT CUT + BACK + MAYBE + BACK
  const rCount=Number(await page.locator('#restaurantTopCount').textContent());
  await page.locator('#restaurantCutBtn').click(); await waitUi(page,320);
  expect(Number(await page.locator('#restaurantTopCount').textContent())).toBeLessThan(rCount);
  await page.locator('#restaurantBackAction').click(); await waitUi(page,100);
  expect(Number(await page.locator('#restaurantTopCount').textContent())).toBe(rCount);
  await page.locator('#restaurantKeepBtn').click(); await waitUi(page,320);
  expect(Number(await page.locator('#restaurantTopCount').textContent())).toBe(rCount-1);
  await page.locator('#restaurantBackAction').click(); await waitUi(page,100);
  expect(Number(await page.locator('#restaurantTopCount').textContent())).toBe(rCount);

  // RESTAURANT DETAILS + SAVE + REPORT
  await page.locator('#restaurantStage .restaurant-card-v240 [data-rest-action="details"]').click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await expect(page.locator('#detailKicker')).toHaveText('RESTAURANT DETAILS');
  await expect(page.locator('#detailGrid')).toContainText('Open/Unknown Hours');
  await page.locator('#detailSaveBtn').click();
  await expect(page.locator('#detailSaveBtn')).toHaveText('♥ Saved');
  await page.locator('#detailReportBtn').click();
  await expect(page.locator('#closeDetailsBtn')).toBeVisible();
  await page.locator('#closeDetailsBtn').click();

  // RESTAURANT HIDE + UNHIDE
  const restName=(await page.locator('#restaurantStage .restaurant-name-v240').first.textContent()).trim();
  await page.locator('#restaurantHideBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await page.locator('#confirmCancelBtn').click();
  await page.locator('#restaurantHideBtn').click();
  await page.locator('#confirmCutBtn').click();
  await waitUi(page,260);
  await page.evaluate(()=>window.openSettings());
  await expect(page.locator('#hiddenFoodList')).toContainText(restName);
  const rHidden=page.locator('#hiddenFoodList .hidden-choice-row').filter({hasText:restName}).first;
  await rHidden.locator('[data-unhide]').click();
  await waitUi(page,180);
  await page.locator('#closeSettingsBtn').click();

  // RESTAURANT PASS AROUND — 2 PEOPLE, BOTH KEEP ALL, THEN PICK A FINALIST
  await page.locator('#restaurantPassAroundBtn').click();
  await expect(page.locator('#passSetupBackdrop')).toBeVisible();
  await page.locator('[data-pass-n="2"]').click();
  await expect(page.locator('#passStatus')).toContainText('Person 1 of 2');
  await passAllCurrent(page,'#restaurantKeepBtn','[data-pass-start]',10);
  await expect(page.locator('#passHandoffBackdrop')).toBeVisible();
  await page.locator('[data-pass-start]').click();
  await expect(page.locator('#passStatus')).toContainText('Person 2 of 2');
  await passAllCurrent(page,'#restaurantKeepBtn','#passNoFinalistsBackdrop',10);
  if (await page.locator('#passNoFinalistsBackdrop').count()) {
    // The fixture uses keep semantics to produce finalists; reaching here would be a regression.
    await page.locator('[data-pass-end]').click();
    throw new Error('Restaurant Pass Around unexpectedly produced no finalists.');
  }
  await expect(page.locator('#restaurantStage .restaurant-card-v240')).toBeVisible();
  await page.locator('#restaurantChooseBtn').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await expect(page.locator('#winnerModeKicker')).toContainText('RESTAURANT');
  expect(errors).toEqual([]);
});
