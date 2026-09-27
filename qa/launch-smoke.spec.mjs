import { test, expect } from '@playwright/test';

const BASE = process.env.DINLIMINATE_BASE_URL || 'https://dinliminates1.vercel.app';
const TEST_ADDRESS = '1 Titans Way, Nashville, TN 37213';

test.describe.configure({ timeout: 120000 });

async function swipe(page, selector, dx) {
  const card = page.locator(selector).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  const box = await card.boundingBox();
  if (!box) throw new Error('Could not measure swipe card.');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 10 });
  await page.mouse.up();
}

test('production HTML and search API are healthy', async ({ request }) => {
  const html = await request.get(BASE + '/');
  expect(html.ok()).toBeTruthy();
  const body = await html.text();
  expect(body).toContain('Dinliminate');
  expect(body).toContain('p681-launch-version');
  expect(body).toContain('restaurantOpenUnknownBtn');
  expect(body).toContain('restaurantPassAroundBtn');

  const health = await request.get(BASE + '/api/restaurant-search?mode=health');
  expect(health.ok()).toBeTruthy();
  const h = await health.json();
  expect(h.ok).toBeTruthy();

  const suggest = await request.get(BASE + '/api/restaurant-search?mode=suggest&q=' + encodeURIComponent('1 Titans Way Nashville'));
  expect(suggest.ok()).toBeTruthy();
  const suggestions = await suggest.json();
  expect(Array.isArray(suggestions.results)).toBeTruthy();
  expect(suggestions.results.length).toBeGreaterThan(0);

  const resolve = await request.get(BASE + '/api/restaurant-search?mode=resolve&q=' + encodeURIComponent(TEST_ADDRESS));
  expect(resolve.ok()).toBeTruthy();
  const resolved = await resolve.json();
  expect(Number.isFinite(Number(resolved.location?.lat))).toBeTruthy();
  expect(Number.isFinite(Number(resolved.location?.lon))).toBeTruthy();

  const search = await request.get(BASE + '/api/restaurant-search?mode=search&lat=36.1661&lon=-86.7716&radius=5&limit=100');
  expect(search.ok()).toBeTruthy();
  const data = await search.json();
  expect(Array.isArray(data.results)).toBeTruthy();
  expect(data.results.length).toBeGreaterThan(0);
  expect(Number(data.fastFoodCount)).toBeGreaterThan(0);
  for (const row of data.results.slice(0, 100)) expect(Number(row.distanceMiles)).toBeLessThanOrEqual(5.001);
});

test('food, pass around, swipe, maybe, winner and settings controls work', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#startBtn')).toBeVisible();
  await page.locator('#startBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  await expect(page.locator('#cutBtn')).toBeVisible();
  await expect(page.locator('#holdBtn')).toBeVisible();
  await expect(page.locator('#foodPassAroundBtn')).toBeVisible();

  const initial = Number(await page.locator('#gameTopCount').textContent());
  await swipe(page, '#stage .stack-card.active', -140);
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBeLessThan(initial);

  await swipe(page, '#stage .stack-card.active', 140);
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBeLessThanOrEqual(initial);

  await page.locator('#foodPassAroundBtn').click();
  await expect(page.locator('#passSetupBackdrop')).toBeVisible();
  await page.locator('[data-pass-n="2"]').click();
  await expect(page.locator('#passStatus')).toBeVisible();
  await page.locator('#passEndBtn').click();
  await expect(page.locator('#passStatus')).toHaveCount(0);
  await expect(page.locator('#gamePanel')).toBeVisible();

  await page.evaluate(() => window.openSettings?.());
  await expect(page.locator('#dinliminatePrivacyBtn')).toBeVisible();
  await expect(page.locator('#dinliminateReportBtn')).toBeVisible();
  await page.locator('#dinliminatePrivacyBtn').click();
  await expect(page.locator('#dinliminateLaunchSheet')).toBeVisible();
  await page.locator('.launch-sheet-close').click();
  await page.locator('#dinliminateReportBtn').click();
  await expect(page.locator('.launch-diagnostics')).toBeVisible();
  await page.locator('.launch-sheet-close').click();
  await page.locator('#closeSettingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toBeHidden();

  await page.evaluate(() => { document.querySelector('#stage .stack-card.active [data-card-action="choose"]')?.click(); });
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#shareBtn').click();
  await page.waitForTimeout(300);
  expect(pageErrors).toEqual([]);
});

test('restaurant location, autocomplete, hours toggle, quick cuts, swipe and pass around work', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#homeRestaurantQuick').click();
  await expect(page.locator('#restaurantPanel')).toBeVisible();
  await expect(page.locator('#restaurantLocationInput')).toBeVisible();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toBeVisible();

  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 36.16655, longitude: -86.77135 });
  await page.locator('#restaurantUseLocationBtn').click();
  await expect(page.locator('#restaurantLocationLabel')).toContainText(/Nashville|location/i, { timeout: 20000 });
  await expect(page.locator('#restaurantPassAroundBtn')).toBeVisible();

  await page.locator('#restaurantRadiusFilter').selectOption('1');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('1 mi');
  await page.locator('#restaurantRadiusFilter').selectOption('100');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('100 mi');

  const location = page.locator('#restaurantLocationInput');
  await location.fill(TEST_ADDRESS);
  await expect(page.locator('.restaurant-address-suggestion').first()).toBeVisible({ timeout: 20000 });
  await page.locator('.restaurant-address-suggestion').first().click();
  await expect(page.locator('.restaurant-card-v240')).toBeVisible({ timeout: 70000 });

  const hours = page.locator('#restaurantOpenUnknownBtn');
  await expect(hours).toHaveText(/Open \/ Unknown/);
  await hours.click();
  await expect(hours).toHaveText('Closed');
  await hours.click();
  await expect(hours).toHaveText(/Open \/ Unknown/);

  for (const label of ['Fast Food','American','Pasta','Healthy','Southern','Potato','Soup / Stew']) {
    const btn = page.locator('#restaurantQuickCuts button').filter({ hasText: label }).first();
    await expect(btn).toBeVisible();
    const before = await btn.getAttribute('aria-pressed');
    if (before === 'true') {
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed','false');
    } else {
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed','true');
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed','false');
    }
  }

  const firstCount = Number(await page.locator('#restaurantTopCount').textContent());
  await swipe(page, '#restaurantStage .restaurant-card.active', -140);
  await expect.poll(async () => Number(await page.locator('#restaurantTopCount').textContent())).toBeLessThan(firstCount);

  await page.locator('#restaurantPassAroundBtn').click();
  await expect(page.locator('#passSetupBackdrop')).toBeVisible();
  await page.locator('[data-pass-n="2"]').click();
  await expect(page.locator('#passStatus')).toBeVisible();
  await page.locator('#passEndBtn').click();
  await expect(page.locator('#passStatus')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
test('iPhone viewport has no horizontal overflow and keeps primary controls visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    startVisible: !!document.querySelector('#startBtn'),
    restaurantVisible: !!document.querySelector('#homeRestaurantQuick')
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.startVisible).toBeTruthy();
  expect(metrics.restaurantVisible).toBeTruthy();
  console.log('iPhone viewport metrics', JSON.stringify(metrics));

  await expect(page.locator('#startBtn')).toBeVisible({ timeout: 10000 });
  await page.locator('#startBtn').click({ force: true });
  await expect(page.locator('#gamePanel')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#cutBtn')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#holdBtn')).toBeVisible({ timeout: 10000 });
  const foodRect = await page.locator('#stage .stack-card.active').boundingBox();
  expect(foodRect).toBeTruthy();
  expect(foodRect.x).toBeGreaterThanOrEqual(-1);
  expect(foodRect.x + foodRect.width).toBeLessThanOrEqual(391);
});

test('deep whole-app lifecycle: menu, add/edit/delete food, hide, quick cuts, save, winner and history', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homePanel')).toBeVisible();

  // Home menu + About + exact attribution.
  await page.locator('#homeMenuTopBtn').click();
  await expect(page.locator('#drawer')).toBeVisible();
  await page.locator('#aboutMenuBtn').click();
  await expect(page.locator('#infoBackdrop')).toBeVisible();
  await expect(page.locator('#infoBackdrop')).toContainText('Made by Brian Dunn for Devona Dunn.');
  await page.locator('#closeInfoBtn').click();
  await expect(page.locator('#infoBackdrop')).toBeHidden();

  // Add a custom food with metadata, tag, recipe, and an uploaded photo.
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#addMenuBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await page.locator('#newName').fill('QA Test Dinner');
  await page.locator('#newCategory').selectOption({ label: 'Dinner' });
  await page.locator('[data-add-tag="southern"]').click();
  await page.locator('#newNotes').fill('QA lifecycle note');
  await page.locator('#newRecipe').fill('QA recipe line 1\\nQA recipe line 2');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  await page.locator('#newPhoto').setInputFiles({ name: 'qa-test.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('#newPhotoPreview')).toHaveClass(/show/);
  await page.locator('#saveBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.DinliminateDiagnostics.customCount())).toBe(1);

  // Deterministically open the newly-added custom food's normal Details surface.
  await page.evaluate(() => {
    const items = JSON.parse(localStorage.getItem('dinliminateCustom') || '[]');
    const item = items.find(x => x.name === 'QA Test Dinner');
    if (!item) throw new Error('Custom food not present in persisted custom deck.');
    window.openDetails?.(item);
  });
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await expect(page.locator('#detailBackdrop')).toContainText('QA Test Dinner');
  await page.locator('#detailSaveBtn').click();
  await expect(page.locator('#detailSaveBtn')).toHaveText(/Saved/);
  await page.locator('#detailSaveBtn').click();
  await expect(page.locator('#detailSaveBtn')).toHaveText(/Save/);
  await page.locator('#editCardBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await expect(page.locator('#newName')).toHaveValue('QA Test Dinner');
  await page.locator('#newName').fill('QA Test Dinner Edited');
  await expect(page.locator('#deleteRecipeBtn')).toBeVisible();
  await page.locator('#deleteRecipeBtn').click();
  await expect(page.locator('#newRecipe')).toHaveValue('');
  await page.locator('#saveBtn').click();
  await expect.poll(() => page.evaluate(() => window.DinliminateDiagnostics.customCount())).toBe(1);

  // Permanently delete the edited custom food with its confirmation.
  await page.evaluate(() => {
    const items = JSON.parse(localStorage.getItem('dinliminateCustom') || '[]');
    const item = items.find(x => x.name === 'QA Test Dinner Edited');
    if (!item) throw new Error('Edited custom food not present in persisted custom deck.');
    window.openDetails?.(item);
  });
  await expect(page.locator('#deleteCardBtn')).toBeVisible();
  await page.locator('#deleteCardBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await expect(page.locator('#confirmCutBtn')).toHaveText(/Delete permanently/);
  const deleteButtonCovered = await page.evaluate(() => {
    const b = document.querySelector('#confirmCutBtn');
    if (!b) return true;
    const r = b.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    return document.elementFromPoint(x, y) !== b && !b.contains(document.elementFromPoint(x, y));
  });
  console.log('custom delete confirmation covered by another overlay:', deleteButtonCovered);
  await page.evaluate(() => window.closeDetails?.());
  await page.locator('#confirmCutBtn').click();
  await expect.poll(() => page.evaluate(() => window.DinliminateDiagnostics.customCount())).toBe(0);

  // Start a clean food round; test Maybe/Back and a Quick Cut hide/restore.
  await page.evaluate(() => window.DinliminateBackToStart?.());
  await expect(page.locator('#homePanel')).toBeVisible();
  await page.locator('#startBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  const beforeMaybe = Number(await page.locator('#gameTopCount').textContent());
  await page.locator('#holdBtn').click();
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBe(beforeMaybe - 1);
  await page.locator('#backBtn').click();
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBe(beforeMaybe);

  const qc = page.locator('#quickCutsBar [data-launch-quick]').filter({ hasText: /Burgers|Pizza|Chicken/i }).first();
  if (await qc.count()) {
    await qc.click();
    await expect(qc).toHaveAttribute('aria-pressed', 'true');
    await qc.click();
    await expect(qc).toHaveAttribute('aria-pressed', 'false');
  }

  // Hide current choice, cancel once, then confirm and verify it appears in Settings.
  const currentFoodName = await page.locator('#stage .stack-card.active .card-name').textContent();
  await page.locator('#hideBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await page.locator('#confirmCancelBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeHidden();
  await page.locator('#hideBtn').click();
  await page.locator('#confirmCutBtn').click();
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBe(beforeMaybe - 1);

  await page.locator('#menuBtn').click();
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toBeVisible();
  await expect(page.locator('#hiddenFoodList')).toContainText(String(currentFoodName).trim());
  const hiddenRow = page.locator('#hiddenFoodList .hidden-choice-row').filter({ hasText: String(currentFoodName).trim() }).first();
  await hiddenRow.getByRole('button', { name: 'Unhide' }).click();
  await expect(page.locator('#hiddenFoodList .hidden-choice-row').filter({ hasText: String(currentFoodName).trim() })).toHaveCount(0);

  // Preferences, export, and close settings.
  await page.locator('#prefQuick').click();
  await expect(page.locator('#prefQuick')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#prefQuick').click();
  await expect(page.locator('#prefQuick')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#prefComfort').click();
  await expect(page.locator('#prefComfort')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#prefComfort').click();
  await expect(page.locator('#prefComfort')).toHaveAttribute('aria-pressed', 'false');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportDataBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^dinliminate-backup-\\d{4}-\\d{2}-\\d{2}\\.json$/);
  await page.locator('#closeSettingsBtn').click();

  // Choose a winner, verify Details/Share, then inspect and remove its history calendar entry.
  await page.evaluate(() => document.querySelector('#stage .stack-card.active [data-card-action="choose"]')?.click());
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await expect(page.locator('#winnerQuickActions [data-winner-details]')).toBeVisible();
  await page.locator('#winnerQuickActions [data-winner-details]').click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await page.locator('#detailCloseBtn').click();
  await page.locator('#winnerHomeBtn').click();
  await expect(page.locator('#homePanel')).toBeVisible();

  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#historyMenuBtn').click();
  await expect(page.locator('#libraryBackdrop')).toBeVisible();
  await expect(page.locator('#libraryList .history-calendar-wrap')).toBeVisible();
  await expect(page.locator('#libraryList [data-history-open]').first()).toBeVisible();
  const historyOpen = page.locator('#libraryList [data-history-open]').first();
  await historyOpen.click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await page.locator('#detailCloseBtn').click();

  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#historyMenuBtn').click();
  await expect(page.locator('#libraryList [data-history-remove]').first()).toBeVisible();
  await page.locator('#libraryList [data-history-remove]').first().click();
  await expect(page.locator('#libraryList [data-history-open]')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('deep Pass Around: two-person vote, handoff, restore by End Pass', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#startBtn').click();
  const initial = Number(await page.locator('#gameTopCount').textContent());

  await page.locator('#foodPassAroundBtn').click();
  await page.locator('[data-pass-n="2"]').click();
  await expect(page.locator('#passStatus')).toContainText('Person 1 of 2');

  // One real vote before ending; End Pass must restore the pre-pass state.
  await page.locator('#cutBtn').click();
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBe(initial - 1);
  await page.locator('#passEndBtn').click();
  await expect(page.locator('#passStatus')).toHaveCount(0);
  await expect(page.locator('#gamePanel')).toBeVisible();
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBe(initial);
  expect(pageErrors).toEqual([]);
});

test('deep restaurant journey: search, details, save, maybe, undo, filters and no-error return', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#homeRestaurantQuick').click();
  await expect(page.locator('#restaurantPanel')).toBeVisible();
  await page.locator('#restaurantLocationInput').fill(TEST_ADDRESS);
  await expect(page.locator('.restaurant-address-suggestion').first()).toBeVisible({ timeout: 20000 });
  await page.locator('.restaurant-address-suggestion').first().click();
  await expect(page.locator('.restaurant-card-v240')).toBeVisible({ timeout: 70000 });

  const count = Number(await page.locator('#restaurantTopCount').textContent());
  expect(count).toBeGreaterThan(0);

  // Card Details + Save.
  await page.locator('.restaurant-card-v240 [data-rest-action="details"]').click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await expect(page.locator('#detailGrid')).toContainText(/Address|Website|Hours/i);
  await page.locator('#detailSaveBtn').click();
  await expect(page.locator('#detailSaveBtn')).toHaveText(/Saved/);
  await page.locator('#detailSaveBtn').click();
  await page.locator('#detailCloseBtn').click();

  // Restaurant Maybe then Back.
  await page.locator('#restaurantKeepBtn').click();
  await expect.poll(async () => Number(await page.locator('#restaurantTopCount').textContent())).toBe(count - 1);
  await page.locator('#restaurantBackAction').click();
  await expect.poll(async () => Number(await page.locator('#restaurantTopCount').textContent())).toBe(count);

  // Search utility and Quick Cut reversible state.
  await page.locator('#restaurantSearchBtn').click();
  await expect(page.locator('#restaurantInlineSearchInput')).toBeVisible();
  await page.locator('#restaurantInlineSearchInput').fill('McDonald');
  await page.locator('#restaurantInlineSearchInput').press('Enter');
  await expect.poll(async () => Number(await page.locator('#restaurantTopCount').textContent())).toBeLessThanOrEqual(count);
  await page.locator('#restaurantSearchBtn').click();

  const rq = page.locator('#restaurantQuickCuts button').filter({ hasText: /Fast Food|American|Pasta|Healthy|Southern|Potato|Soup \/ Stew/i }).first();
  if (await rq.count() && await rq.isEnabled()) {
    await rq.click();
    await expect(rq).toHaveAttribute('aria-pressed', 'true');
    await rq.click();
    await expect(rq).toHaveAttribute('aria-pressed', 'false');
  }

  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText('Closed');
  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText(/Open \/ Unknown/);

  expect(pageErrors).toEqual([]);
});

test('deep System Restore and backup import guard', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#startBtn').click();

  // Put the app into a non-default state first.
  await page.locator('#holdBtn').click();
  await page.locator('#menuBtn').click();
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toBeVisible();

  // Cancel must leave the app/settings intact.
  await page.locator('#systemRestoreBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeVisible();
  await page.locator('#restoreCancelBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeHidden();
  await expect(page.locator('#settingsBackdrop')).toBeVisible();

  // Confirm restore; app intentionally reloads.
  await page.locator('#systemRestoreBtn').click();
  await page.locator('#restoreConfirmBtn').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#homePanel')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => window.DinliminateDiagnostics.customCount())).toBe(0);
  expect(await page.evaluate(() => window.DinliminateDiagnostics.hiddenCount())).toBe(0);
  expect(await page.evaluate(() => window.DinliminateDiagnostics.historyCount())).toBe(0);
  expect(pageErrors).toEqual([]);
});


test('deep backup round-trip: exported backup can be imported back into Dinliminate', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#addMenuBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await page.locator('#newName').fill('QA Import Roundtrip');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.DinliminateDiagnostics.customCount())).toBe(1);

  await page.locator('#menuBtn').click();
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportDataBtn').click();
  const download = await downloadPromise;
  const exportPath = await download.path();
  if (!exportPath) throw new Error('Backup download path unavailable.');
  const fs = await import('node:fs/promises');
  const backupText = await fs.readFile(exportPath, 'utf8');
  const backup = JSON.parse(backupText);
  const backupCustom = typeof backup?.data?.custom === 'string' ? JSON.parse(backup.data.custom) : backup?.data?.custom;
  expect(Array.isArray(backupCustom)).toBeTruthy();
  expect(backupCustom.length).toBe(1);
  console.log('exported backup version:', backup.version);

  const input = page.locator('#importDataInput');
  await input.setInputFiles({
    name: 'dinliminate-roundtrip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backupText, 'utf8')
  });

  await page.waitForTimeout(700);
  await expect(page.locator('#toast')).toHaveText('Backup imported. Reloading…');
  await expect(page.locator('#homePanel')).toBeVisible({ timeout: 10000 });
  const importedNames = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('dinliminateCustom') || '[]').map(x => x.name); }
    catch { return []; }
  });
  expect(importedNames).toContain('QA Import Roundtrip');
  expect(pageErrors).toEqual([]);
});


test('targeted probe: custom-food Delete confirmation must sit above Details', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#addMenuBtn').click();
  await page.locator('#newName').fill('QA Delete Overlay');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeHidden();
  const item = await page.evaluate(() => JSON.parse(localStorage.getItem('dinliminateCustom') || '[]').find(x => x.name === 'QA Delete Overlay'));
  if (!item) throw new Error('Custom food missing after add.');
  await page.evaluate(item => window.openDetails?.(item), item);
  await page.locator('#deleteCardBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  const clickable = await page.evaluate(() => {
    const b = document.querySelector('#confirmCutBtn');
    if (!b) return false;
    const r = b.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return top === b || b.contains(top);
  });
  expect(clickable).toBeTruthy();
});
