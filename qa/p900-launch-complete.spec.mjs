import { test, expect } from '@playwright/test';

const BASE = process.env.DINLIMINATE_BASE_URL || 'https://dinliminates1.vercel.app';
test.describe.configure({ timeout: 120000 });

test('P900 release contract is present', async ({ request }) => {
  const res = await request.get(BASE + '/');
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  expect(html).toContain('p900-launch-complete-2026-09-29');
  expect(html).toContain('restaurantAddressSuggestions');
  expect(html).toContain('restaurantOpenUnknownBtn');
  expect(html).toContain('restaurantPassAroundBtn');
  expect(html).not.toContain('p642-cache-cleanup');
});

test('P900 combined restaurant and fast-food API contract', async ({ request }) => {
  const health = await request.get(BASE + '/api/restaurant-search?mode=health');
  expect(health.ok()).toBeTruthy();
  const h = await health.json();
  expect(h.ok).toBeTruthy();
  expect(Number(h.maxRadiusMiles)).toBe(100);
  const search = await request.get(BASE + '/api/restaurant-search?mode=search&lat=36.1661&lon=-86.7716&radius=5&limit=100');
  expect(search.ok()).toBeTruthy();
  const d = await search.json();
  expect(d.searchContract).toBe('combined-restaurant-fast-food');
  expect(Number(d.apiSchema)).toBe(2);
  expect(Array.isArray(d.results)).toBeTruthy();
  expect(Number(d.fastFoodCount)).toBeGreaterThan(0);
  for (const r of d.results.slice(0, 100)) expect(Number(r.distanceMiles)).toBeLessThanOrEqual(5.001);
});

test('P900 service worker is real and versioned', async ({ request }) => {
  const res = await request.get(BASE + '/dinliminate-sw.js');
  expect(res.ok()).toBeTruthy();
  const sw = await res.text();
  expect(sw).toContain('dinliminate-p900-2026-09-29');
  expect(sw).toContain("self.addEventListener('fetch'");
  expect(sw).not.toContain('self.registration.unregister()');
});

test('P900 restaurant controls load without client errors', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.locator('#homeRestaurantQuick').click();
  await expect(page.locator('#restaurantLocationInput')).toBeVisible();
  await expect(page.locator('#restaurantRadiusFilter')).toBeVisible();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toBeVisible();
  await expect(page.locator('#restaurantPassAroundBtn')).toBeVisible();
  await page.locator('#restaurantSearchBtn').click();
  await expect(page.locator('#restaurantInlineSearch')).toBeVisible();
  await page.locator('#restaurantInlineSearchInput').fill('McDonald');
  await expect(page.locator('#restaurantInlineSearchInput')).toHaveValue('McDonald');
  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText('All');
  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toContainText('Open');
  expect(errors).toEqual([]);
});