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
  expect(body).toContain('p682-restaurant-quickcuts-live-sync');
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
    await expect(btn).toHaveAttribute('aria-pressed','false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed','true');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed','false');
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

test('restaurant Quick Cuts stay synced to the active radius and inline restaurant search', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#homeRestaurantQuick').click();
  await expect(page.locator('#restaurantPanel')).toBeVisible();
  await page.locator('#restaurantLocationInput').fill(TEST_ADDRESS);
  await expect(page.locator('.restaurant-address-suggestion').first()).toBeVisible({ timeout: 20000 });
  await page.locator('.restaurant-address-suggestion').first().click();
  await expect(page.locator('.restaurant-card-v240')).toBeVisible({ timeout: 70000 });

  const area = await page.evaluate(() => {
    const s = window.DinliminateRestaurantSearchV3?.state?.();
    return { lat: Number(s?.area?.lat), lon: Number(s?.area?.lon) };
  });
  expect(Number.isFinite(area.lat)).toBeTruthy();
  expect(Number.isFinite(area.lon)).toBeTruthy();

  const apiUrl = radius => BASE + '/api/restaurant-search?mode=search&lat=' + encodeURIComponent(area.lat) + '&lon=' + encodeURIComponent(area.lon) + '&radius=' + radius + '&limit=1000';
  const data10 = await (await page.request.get(apiUrl(10))).json();
  const data5 = await (await page.request.get(apiUrl(5))).json();
  const fastMatch = r => r?.fastFood === true || /fast[\\s_-]?food/i.test(String(r?.category || '') + ' ' + String(r?.tags || ''));
  const openUnknown = r => r?.openNow !== false && r?.currentlyOpen !== false;
  const expectedFast5 = data5.results.filter(r => Number(r.distanceMiles) <= 5.001 && fastMatch(r) && openUnknown(r)).length;
  const expectedFast10 = data10.results.filter(r => Number(r.distanceMiles) <= 10.001 && fastMatch(r) && openUnknown(r)).length;
  expect(expectedFast10).toBeGreaterThanOrEqual(expectedFast5);

  const fastButton = page.locator('#restaurantQuickCuts button').filter({ hasText: 'Fast Food' }).first();
  const countFromButton = async () => {
    const t = await fastButton.locator('.quick-cut-copy em').textContent();
    const m = String(t || '').match(/(\\d+)\\s*$/);
    return m ? Number(m[1]) : -1;
  };

  await page.locator('#restaurantRadiusFilter').selectOption('10');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('10 mi');
  await expect.poll(countFromButton, { timeout: 70000 }).toBe(expectedFast10);

  await page.locator('#restaurantRadiusFilter').selectOption('5');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('5 mi');
  await expect.poll(countFromButton, { timeout: 5000 }).toBe(expectedFast5);

  // A Quick Cut must never reintroduce a restaurant outside the newly selected radius.
  if (expectedFast5 > 0) {
    await fastButton.click();
    await expect(fastButton).toHaveAttribute('aria-pressed', 'true');
    const displayed = page.locator('#restaurantStage .restaurant-card.active').first();
    if (await displayed.count()) {
      const distanceText = await displayed.locator('.restaurant-distance-pill').textContent();
      const miles = Number.parseFloat(String(distanceText || '').replace(/[^0-9.]/g, ''));
      expect(Number.isFinite(miles)).toBeTruthy();
      expect(miles).toBeLessThanOrEqual(5.001);
    }
    await fastButton.click();
    await expect(fastButton).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(countFromButton, { timeout: 5000 }).toBe(expectedFast5);
  }

  // Inline Search is also part of the live Quick Cut scope.
  await page.locator('#restaurantSearchBtn').click();
  const searchInput = page.locator('#restaurantInlineSearchInput');
  await searchInput.fill('McDonald');
  const expectedMcFast5 = data5.results.filter(r => {
    const text = [r?.name, r?.address, r?.brand, r?.operator, r?.category, r?.cuisine, ...(Array.isArray(r?.tags) ? r.tags : [])].filter(Boolean).join(' ').toLowerCase();
    return /mcdonald/.test(text) && Number(r.distanceMiles) <= 5.001 && fastMatch(r) && openUnknown(r);
  }).length;
  await expect.poll(countFromButton, { timeout: 5000 }).toBe(expectedMcFast5);

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