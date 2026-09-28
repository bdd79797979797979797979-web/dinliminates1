import { test, expect } from '@playwright/test';

const BASE = process.env.DINLIMINATE_BASE_URL || 'https://dinliminates1.vercel.app';

test('P730 final-state virtual user regression', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(BASE, { waitUntil:'domcontentloaded' });
  await page.setViewportSize({width:390,height:844});

  // Home chrome.
  await expect(page.locator('#homePanel')).toBeVisible();
  await expect(page.locator('.home-topbar-brand')).toContainText('Dinliminate');
  await expect(page.locator('#homePanel .home-topbar-menu:visible')).toHaveCount(1);
  const chrome = await page.evaluate(() => {
    const b = document.querySelector('.home-topbar-brand');
    return {
      bg:b ? getComputedStyle(b).backgroundColor : '',
      font:b ? parseFloat(getComputedStyle(b).fontSize) : 0
    };
  });
  expect(chrome.bg).toBe('rgba(0, 0, 0, 0)');
  expect(chrome.font).toBeGreaterThanOrEqual(20);

  // Food: Maybe on 2+; Choose on 1; Choose -> Winner; Cut on 1 -> Hungry.
  await page.locator('#startBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  await page.evaluate(() => {
    activeItems=[homeMeals[0],homeMeals[1]];
    holdingItems=[]; undoStack=[]; finalistMode=false; searchQuery=''; originalCount=2;
    renderStage(); syncDecisionActionLabels();
  });
  await expect(page.locator('#holdBtn')).toHaveText(/Maybe/);
  await page.locator('#holdBtn').click();
  await expect.poll(() => page.evaluate(() => activeItems.length)).toBe(1);
  await expect(page.locator('#holdBtn')).toHaveText('Choose');
  await page.locator('#holdBtn').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#winnerHomeBtn').click();

  await page.locator('#startBtn').click();
  await page.evaluate(() => {
    activeItems=[homeMeals[0]]; holdingItems=[]; undoStack=[]; finalistMode=false; originalCount=1;
    renderStage(); syncDecisionActionLabels();
  });
  await expect(page.locator('#holdBtn')).toHaveText('Choose');
  await page.locator('#cutBtn').click();
  await expect(page.locator('.hungry-state')).toBeVisible();
  await expect(page.locator('#gameTopCount')).toHaveText('0');

  // Restaurant: exact 27 total / 15 Fast Food => 12 remain; restore => 27.
  const rows = Array.from({length:27},(_,i)=>{
    const ff=i<15;
    return {
      id:'p730-ff-'+(i+1), name:ff?'Fast Food '+(i+1):'Restaurant '+(i+1),
      type:'restaurant', amenity:ff?'fast_food':'restaurant',
      category:ff?'Fast Food':'American', cuisine:ff?'':'american',
      tags:ff?['restaurant','fast_food']:['restaurant','american'],
      address:(i+1)+' Main St, Nashville, TN 37213', openNow:true,
      distanceMiles:(i+1)/3, lat:36.16, lon:-86.77
    };
  });
  await page.evaluate((rows) => {
    restaurantItems=rows; restaurantBase=[...rows]; activeRestaurants=[...rows];
    holdingRestaurants=[]; restaurantManual=new Set(); restaurantQuickCuts=new Set();
    restaurantFilters={query:'',sort:'shuffle'}; restaurantRadiusMiles=10;
    restaurantHoursFilter='open-unknown'; restaurantEliminationExhausted=false;
    restaurantRoundInProgress=false;
    document.body.classList.remove('game-mode','finalist-mode');
    document.body.classList.add('restaurant-mode');
    document.querySelector('#homePanel')?.classList.add('hidden');
    document.querySelector('#gamePanel')?.classList.add('hidden');
    document.querySelector('#winnerPanel')?.classList.add('hidden');
    document.querySelector('#restaurantPanel')?.classList.remove('hidden');
    renderRestaurantStage(); renderRestaurantQuickCuts(); syncRestaurantActionLabels();
  }, rows);
  await expect(page.locator('#restaurantTopCount')).toHaveText('27');

  const fast=page.locator('#restaurantQuickCuts button[data-launch-rq="fast_food"]');
  await expect(fast).toContainText('hide · 15');
  await fast.click();
  await expect(page.locator('#restaurantTopCount')).toHaveText('12');
  await expect(fast).toContainText('show · 15');
  await fast.click();
  await expect(page.locator('#restaurantTopCount')).toHaveText('27');

  // Restaurant: 2 -> Maybe -> 1 -> Choose -> Winner.
  const two=rows.slice(0,2);
  await page.evaluate((two) => {
    restaurantItems=two; restaurantBase=[...two]; activeRestaurants=[...two];
    holdingRestaurants=[]; restaurantManual=new Set(); restaurantQuickCuts=new Set();
    restaurantFilters={query:'',sort:'shuffle'}; restaurantRadiusMiles=10;
    restaurantHoursFilter='open-unknown'; restaurantEliminationExhausted=false; restaurantRoundInProgress=false;
    renderRestaurantStage(); renderRestaurantQuickCuts(); syncRestaurantActionLabels();
  }, two);
  await expect(page.locator('#restaurantKeepBtn')).toHaveText(/Maybe/);
  await page.locator('#restaurantKeepBtn').click();
  await expect.poll(() => page.evaluate(() => activeRestaurants.length)).toBe(1);
  await expect(page.locator('#restaurantKeepBtn')).toHaveText('Choose');
  await page.locator('#restaurantKeepBtn').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#winnerHomeBtn').click();

  // Restaurant: 1 -> Cut -> Hungry, with no round-resurrection after 250ms.
  const one=[rows[0]];
  await page.evaluate((one) => {
    restaurantItems=one; restaurantBase=[...one]; activeRestaurants=[...one];
    holdingRestaurants=[]; restaurantManual=new Set(); restaurantQuickCuts=new Set();
    restaurantFilters={query:'',sort:'shuffle'}; restaurantRadiusMiles=10;
    restaurantHoursFilter='open-unknown'; restaurantEliminationExhausted=false; restaurantRoundInProgress=false;
    document.body.classList.remove('game-mode','finalist-mode');
    document.body.classList.add('restaurant-mode');
    document.querySelector('#winnerPanel')?.classList.add('hidden');
    document.querySelector('#restaurantPanel')?.classList.remove('hidden');
    renderRestaurantStage(); renderRestaurantQuickCuts(); syncRestaurantActionLabels();
  }, one);
  await expect(page.locator('#restaurantKeepBtn')).toHaveText('Choose');
  await page.locator('#restaurantCutBtn').click();
  await expect(page.locator('.restaurant-hungry-state')).toBeVisible({timeout:10000});
  await expect(page.locator('#restaurantTopCount')).toHaveText('0');
  await page.waitForTimeout(400);
  await expect(page.locator('.restaurant-hungry-state')).toBeVisible();
  await expect(page.locator('#restaurantHungryResetBtn')).toBeVisible();

  expect(errors).toEqual([]);
});


test('Menu navigation exposes Saved and keeps Winner out', async ({ page }) => {
  test.setTimeout(30000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(BASE, { waitUntil:'domcontentloaded' });
  await page.setViewportSize({width:390,height:844});

  await page.locator('#homeMenuTopBtn').click();
  await expect(page.locator('#drawer')).toBeVisible();

  await expect(page.locator('#drawer .drawer-title')).toHaveText('Menu');
  await expect(page.locator('#savedMenuBtn')).toBeVisible();
  await expect(page.locator('#historyMenuBtn')).toBeVisible();
  await expect(page.locator('#restaurantsMenuBtn')).toBeVisible();
  await expect(page.locator('#addMenuBtn')).toBeVisible();
  await expect(page.locator('#settingsBtn')).toBeVisible();
  await expect(page.locator('#aboutMenuBtn')).toBeVisible();
  await expect(page.locator('#winnerMenuBtn')).toHaveCount(0);

  await page.locator('#savedMenuBtn').click();
  await expect(page.locator('#libraryBackdrop')).toBeVisible();
  await expect(page.locator('#libraryTitle')).toHaveText('Saved');
  await expect(page.locator('.library-tabs')).toHaveCount(0);
  await expect(page.locator('[data-library-tab]')).toHaveCount(0);

  await page.locator('#closeLibraryBtn').click();
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#historyMenuBtn').click();
  await expect(page.locator('#libraryBackdrop')).toBeVisible();
  await expect(page.locator('#libraryTitle')).toHaveText('History');
  await expect(page.locator('.library-tabs')).toHaveCount(0);
  await expect(page.locator('[data-library-tab]')).toHaveCount(0);

  await page.locator('#closeLibraryBtn').click();
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#aboutMenuBtn').click();
  await expect(page.locator('#infoBody')).toContainText('Made by Brian Dunn for Devona Dunn.');

  expect(errors).toEqual([]);
});


test('Food and restaurant Details open immediately', async ({ page }) => {
  test.setTimeout(30000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(BASE, { waitUntil:'domcontentloaded' });
  await page.setViewportSize({width:390,height:844});

  await page.locator('#startBtn').click();
  await page.evaluate(() => {
    activeItems=[homeMeals[0]];
    holdingItems=[]; undoStack=[]; finalistMode=false; searchQuery=''; originalCount=1;
    renderStage(); syncDecisionActionLabels();
  });
  const foodStart = await page.evaluate(() => performance.now());
  await page.locator('[data-card-action="details"]:visible').click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  const foodElapsed = await page.evaluate(t => performance.now()-t, foodStart);
  expect(foodElapsed).toBeLessThan(750);
  await page.locator('#detailCloseBtn').click();

  const restaurant = {
    id:'details-speed-1', name:'Details Speed Test Restaurant', type:'restaurant',
    category:'American', cuisine:'american', amenity:'restaurant',
    tags:['restaurant','american'], address:'1 Main St, Nashville, TN 37213',
    openNow:true, distanceMiles:1.2, lat:36.16, lon:-86.77
  };
  await page.evaluate((r) => {
    restaurantItems=[r]; restaurantBase=[r]; activeRestaurants=[r];
    holdingRestaurants=[]; restaurantManual=new Set(); restaurantQuickCuts=new Set();
    restaurantFilters={query:'',sort:'shuffle'}; restaurantRadiusMiles=10;
    restaurantHoursFilter='open-unknown'; restaurantEliminationExhausted=false; restaurantRoundInProgress=false;
    document.body.classList.remove('game-mode','finalist-mode');
    document.body.classList.add('restaurant-mode');
    document.querySelector('#homePanel')?.classList.add('hidden');
    document.querySelector('#gamePanel')?.classList.add('hidden');
    document.querySelector('#winnerPanel')?.classList.add('hidden');
    document.querySelector('#restaurantPanel')?.classList.remove('hidden');
    renderRestaurantStage(); renderRestaurantQuickCuts(); syncRestaurantActionLabels();
  }, restaurant);
  const restStart = await page.evaluate(() => performance.now());
  await page.locator('.restaurant-detail-btn-v240:visible').click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  const restElapsed = await page.evaluate(t => performance.now()-t, restStart);
  expect(restElapsed).toBeLessThan(750);

  expect(errors).toEqual([]);
});
