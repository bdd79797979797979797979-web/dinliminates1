import { test, expect } from '@playwright/test';

const BASE = process.env.DINLIMINATE_BASE_URL || 'http://127.0.0.1:4173';

test.describe.configure({ timeout: 120000 });

test('deep user journey: menu, about, food personalization, hidden restore, history, add food, restaurant details', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homePanel')).toBeVisible();

  // Home menu + About
  await page.locator('#homeMenuTopBtn').click();
  await expect(page.locator('#drawer')).toBeVisible();
  await page.locator('#aboutMenuBtn').click();
  await expect(page.locator('#infoBackdrop')).toBeVisible();
  await expect(page.locator('#infoBody')).toContainText('Made by Brian Dunn for Devona Dunn.');
  await page.locator('#closeInfoBtn').click();
  await expect(page.locator('#infoBackdrop')).toBeHidden();

  // Food personalization: reversible Quick Cut
  await page.locator('#startBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  const quick = page.locator('#quickCutsBar button[data-launch-quick]:not([disabled])').first();
  await expect(quick).toBeVisible();
  await quick.click();
  await expect(quick).toHaveAttribute('aria-pressed', 'true');
  await quick.click();
  await expect(quick).toHaveAttribute('aria-pressed', 'false');

  // Hide: cancel first, then confirm; verify hidden choice appears in Settings and can be restored.
  const foodName = await page.locator('#stage .stack-card.active .card-name').textContent();
  await page.locator('#hideBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await page.locator('#confirmCancelBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeHidden();

  await page.locator('#hideBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await page.locator('#confirmCutBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeHidden();
  await expect.poll(async () => Number(await page.locator('#gameTopCount').textContent())).toBeLessThan(60);

  await page.evaluate(() => window.openSettings?.());
  await expect(page.locator('#settingsBackdrop')).toBeVisible();
  await expect(page.locator('#hiddenFoodList')).toContainText(String(foodName).trim());
  const unhide = page.locator('#hiddenFoodList .unhide-btn').first();
  await expect(unhide).toBeVisible();
  await unhide.click();
  await expect(page.locator('#hiddenFoodList')).not.toContainText(String(foodName).trim());
  await page.locator('#closeSettingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toBeHidden();

  // Add Food: create a real custom entry and verify persistence.
  await page.locator('#addDuringBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await page.locator('#newName').fill('QA Custom Dinner');
  await page.locator('#newCategory').selectOption({ label: 'Dinner' });
  await page.locator('#newRecipe').fill('Test ingredients and directions.');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeHidden();
  const savedCustom = await page.evaluate(() => JSON.parse(localStorage.getItem('dinliminateCustom') || '[]'));
  expect(savedCustom.some(x => x.name === 'QA Custom Dinner')).toBeTruthy();

  // Winner + history.
  const choose = page.locator('#stage .stack-card.active [data-card-action="choose"]').first();
  await expect(choose).toBeVisible();
  await choose.click();
  await expect(page.locator('#winnerPanel')).toBeVisible();

  await page.evaluate(() => window.openLibrary?.('history'));
  await expect(page.locator('#libraryBackdrop')).toBeVisible();
  await expect(page.locator('#libraryList')).toContainText('DECISIONS');
  await expect(page.locator('#libraryList')).toContainText('September');
  await page.locator('#closeLibraryBtn').click();
  await expect(page.locator('#libraryBackdrop')).toBeHidden();

  // System restore confirmation exists and can be canceled.
  await page.evaluate(() => window.openSettings?.());
  await expect(page.locator('#settingsBackdrop')).toBeVisible();
  await page.locator('#systemRestoreBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeVisible();
  await page.locator('#restoreCancelBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeHidden();
  await page.locator('#closeSettingsBtn').click();

  // Restaurant details path.
  await page.evaluate(() => window.showRestaurantMode?.());
  await expect(page.locator('#restaurantPanel')).toBeVisible();
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 36.16655, longitude: -86.77135 });
  await page.locator('#restaurantUseLocationBtn').click();
  await expect(page.locator('#restaurant-card, #restaurantStage .restaurant-card-v240').first()).toBeVisible({ timeout: 70000 }).catch(()=>{});
  const restaurant = page.locator('#restaurantStage .restaurant-card-v240').first();
  await expect(restaurant).toBeVisible({ timeout: 70000 });
  const detailsBtn = restaurant.locator('[data-rest-action="details"]').first();
  await expect(detailsBtn).toBeVisible();
  await detailsBtn.click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await expect(page.locator('#detailTitle')).not.toHaveText('');
  await page.locator('#detailCloseBtn').click();
  await expect(page.locator('#detailBackdrop')).toBeHidden();

  expect(errors).toEqual([]);
});
