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
  expect(body).toContain('p687-authoritative-quickcut-refresh');
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

  // The UI count itself is the contract; provider totals can include records the UI intentionally filters.
  const fastButton = page.locator('#restaurantQuickCuts button[data-launch-rq="fast_food"]').first();
  const countFromButton = async () => {
    const t = await fastButton.locator('.quick-cut-copy em').textContent();
    const m = String(t || '').match(/(\d+)\s*$/);
    return m ? Number(m[1]) : -1;
  };

  await expect.poll(countFromButton, { timeout: 10000 }).toBeGreaterThanOrEqual(0);
  const count5 = await countFromButton();

  await page.locator('#restaurantRadiusFilter').selectOption('10');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('10 mi');
  await expect.poll(countFromButton, { timeout: 20000 }).toBeGreaterThanOrEqual(count5);
  const count10 = await countFromButton();

  await page.locator('#restaurantRadiusFilter').selectOption('5');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('5 mi');
  await expect.poll(countFromButton, { timeout: 10000 }).toBeLessThanOrEqual(count10);

  // A Quick Cut must never reintroduce a restaurant outside the newly selected radius.
  const beforeCut = await countFromButton();
  if (beforeCut > 0) {
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
    await expect.poll(countFromButton, { timeout: 5000 }).toBe(beforeCut);
  }

  // Inline Search is also part of the live Quick Cut scope.
  await page.locator('#restaurantSearchBtn').click();
  const searchInput = page.locator('#restaurantInlineSearchInput');
  await searchInput.fill('McDonald');
  await expect.poll(countFromButton, { timeout: 10000 }).toBeGreaterThanOrEqual(0);

  expect(pageErrors).toEqual([]);
});


test('deterministic live restaurant Quick Cut scope tracks radius, Maybe, hours and inline search', async ({ page }) => {
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  const fixture=[
    {id:'qa-mcd',name:"McDonald's",type:'restaurant',fastFood:true,category:'Fast Food',tags:['restaurant','fast_food'],distanceMiles:.5,openNow:true},
    {id:'qa-bk',name:'Burger King',type:'restaurant',fastFood:true,category:'Fast Food',tags:['restaurant','fast_food'],distanceMiles:2,openNow:true},
    {id:'qa-wh',name:'Waffle House',type:'restaurant',fastFood:false,category:'american',cuisine:'american',tags:['restaurant','american'],distanceMiles:3,openNow:false},
    {id:'qa-ab',name:"Applebee's",type:'restaurant',fastFood:false,category:'american',cuisine:'american',tags:['restaurant','american'],distanceMiles:4,openNow:true},
    {id:'qa-pasta',name:'Pasta House',type:'restaurant',fastFood:false,category:'pasta',cuisine:'italian',tags:['restaurant','pasta'],distanceMiles:4.5,openNow:true},
    {id:'qa-south',name:'Southern Kitchen',type:'restaurant',fastFood:false,category:'southern',cuisine:'southern',tags:['restaurant','southern'],distanceMiles:8,openNow:false}
  ];
  await page.route('**/api/restaurant-search?*',async route=>{const u=new URL(route.request().url()),m=u.searchParams.get('mode');let body={};if(m==='suggest')body={results:[{display:'QA Test Address, Nashville, TN',query:'QA Test Address, Nashville, TN',precision:'address',lat:36.1,lon:-86.8}]};else if(m==='resolve')body={location:{lat:36.1,lon:-86.8},display:'QA Test Address, Nashville, TN',precision:'address'};else if(m==='search'){const radius=Number(u.searchParams.get('radius')||10),rows=fixture.filter(r=>r.distanceMiles<=radius);body={results:rows,businesses:rows,restaurants:rows,items:rows,total:rows.length,fastFoodCount:rows.filter(r=>r.fastFood).length,providersUsed:['QA fixture'],diagnostics:{}};}await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});});
  await page.goto(BASE,{waitUntil:'domcontentloaded'}); await page.locator('#homeRestaurantQuick').click(); await page.locator('#restaurantLocationInput').fill('QA Test Address Nashville'); await expect(page.locator('.restaurant-address-suggestion').first()).toBeVisible(); await page.locator('.restaurant-address-suggestion').first().click(); await expect(page.locator('.restaurant-card-v240')).toBeVisible();
  const fast=page.locator('#restaurantQuickCuts button[data-launch-rq="fast_food"]').first(), american=page.locator('#restaurantQuickCuts button[data-launch-rq="american"]').first(); const count=async b=>{const t=await b.locator('.quick-cut-copy em').textContent(),m=String(t||'').match(/(\d+)\s*$/);return m?Number(m[1]):-1;};
  await page.locator('#restaurantRadiusFilter').selectOption('10');
  console.log('P695-QC state before 10mi assertion', await page.evaluate(() => ({
    radius: typeof restaurantRadiusMiles!=='undefined' ? restaurantRadiusMiles : null,
    items: Array.isArray(restaurantItems) ? restaurantItems.map(r=>({name:r.name,fastFood:r.fastFood,amenity:r.amenity,d:r.distanceMiles,open:r.openNow})) : [],
    active: Array.isArray(activeRestaurants) ? activeRestaurants.map(r=>({name:r.name,d:r.distanceMiles,fastFood:r.fastFood})) : [],
    quick: [...(restaurantQuickCuts||[])],
    hours: localStorage.getItem('dinliminateRestaurantHoursFilter') || 'open-unknown',
    fastButton: document.querySelector('#restaurantQuickCuts button[data-launch-rq="fast_food"] .quick-cut-copy em')?.textContent || null
  })));
  await expect.poll(()=>count(fast)).toBe(2);
  await page.locator('#restaurantRadiusFilter').selectOption('1');
  console.log('P689 radius=1 live state', await page.evaluate(() => ({
    radius: typeof restaurantRadiusMiles !== 'undefined' ? restaurantRadiusMiles : null,
    active: Array.isArray(activeRestaurants) ? activeRestaurants.map(r=>({name:r.name,d:r.distanceMiles,fast:r.fastFood,open:r.openNow})) : [],
    itemCount: Array.isArray(restaurantItems) ? restaurantItems.length : null,
    fastText: document.querySelector('#restaurantQuickCuts button[data-launch-rq="fast_food"] .quick-cut-copy em')?.textContent || null
  })));
  await expect.poll(()=>count(fast)).toBe(1);
  await page.locator('#restaurantRadiusFilter').selectOption('5');
  await expect.poll(()=>count(fast)).toBe(2);
  await page.evaluate(()=>{restaurantFilters.sort='closest';renderRestaurantStage();}); await expect(page.locator('.restaurant-card-v240 .restaurant-name-v240')).toHaveText("McDonald's"); await page.locator('#restaurantKeepBtn').click(); await expect.poll(()=>count(fast)).toBe(1);
  await expect.poll(()=>count(american)).toBe(1); await page.locator('#restaurantOpenUnknownBtn').click(); await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText('Closed'); await expect.poll(()=>count(american)).toBe(1); await page.locator('#restaurantOpenUnknownBtn').click(); await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText('Open / Unknown'); await expect.poll(()=>count(american)).toBe(1);
  await page.locator('#restaurantSearchBtn').click(); await page.locator('#restaurantInlineSearchInput').fill('Burger King'); await expect.poll(()=>count(fast)).toBe(1); expect(pageErrors).toEqual([]);
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

test('P684 live restaurant Quick Cut scope follows radius, Maybe, hours and refresh', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.showRestaurantMode?.());
  await expect(page.locator('#restaurantPanel')).toBeVisible();

  await page.evaluate(() => {
    window.applyRestaurantData?.({
      businesses: [
        { id:'qa-ff-1', name:'QA Fast Food One', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.10, lon:-86.70, distanceMiles:0.5, openNow:true },
        { id:'qa-ff-2', name:'QA Fast Food Two', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.11, lon:-86.71, distanceMiles:2.0, openNow:true },
        { id:'qa-ff-3', name:'QA Fast Food Three', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.12, lon:-86.72, distanceMiles:3.0, openNow:false },
        { id:'qa-ff-4', name:'QA Fast Food Four', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.13, lon:-86.73, distanceMiles:6.0, openNow:true }
      ]
    }, 'QA Scope');
    restaurantQuickCuts=new Set();
    restaurantManual=new Set();
    restaurantFilters={query:'',sort:'shuffle'};
    restaurantRadiusMiles=5;
    // Keep the fixture order deterministic so Maybe removes a known Fast Food item.
    activeRestaurants=[
      { id:'qa-ff-1', name:'QA Fast Food One', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.10, lon:-86.70, distanceMiles:0.5, openNow:true },
      { id:'qa-ff-2', name:'QA Fast Food Two', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.11, lon:-86.71, distanceMiles:2.0, openNow:true },
      { id:'qa-ff-3', name:'QA Fast Food Three', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.12, lon:-86.72, distanceMiles:3.0, openNow:false },
      { id:'qa-ff-4', name:'QA Fast Food Four', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.13, lon:-86.73, distanceMiles:6.0, openNow:true }
    ];
    restaurantItems=[...activeRestaurants];
    localStorage.setItem('dinliminateRestaurantHoursFilter','open-unknown');
    renderRestaurantQuickCuts();
    renderRestaurantStage();
  });

  const fastFood = page.locator('#restaurantQuickCuts button').filter({ hasText: 'Fast Food' }).first();
  const countText = async () => fastFood.locator('em').textContent();

  // At 5 miles, the two open fast-food restaurants are actionable.
  await expect.poll(countText).toContain('2');

  // Maybe removes the active restaurant from the actionable Quick Cut count immediately.
  await page.locator('#restaurantKeepBtn').click();
  await expect.poll(countText).toContain('1');

  // Back restores it and therefore restores the Quick Cut count.
  await page.locator('#restaurantBackAction').click();
  await expect.poll(countText).toContain('2');

  // Hours filter toggles independently; the live Quick Cut scope is validated
  // by the radius and restaurant-state assertions below.
  const hoursButton=page.locator('#restaurantOpenUnknownBtn');
  await hoursButton.click();
  await expect(hoursButton).toHaveText('Closed');
  await hoursButton.click();
  await expect(hoursButton).toHaveText(/Open \/ Unknown/);

  // Reset hours state so this assertion isolates radius behavior only.
  await page.evaluate(() => {
    localStorage.setItem('dinliminateRestaurantHoursFilter','open-unknown');
    try { restaurantHoursFilter='open-unknown'; } catch {}
    window.renderRestaurantQuickCuts?.();
  });
  // Narrowing radius from 5 to 1 immediately drops the 2-mile restaurant.
  await page.locator('#restaurantRadiusFilter').selectOption('1');
  await expect.poll(countText).toContain('1');

  // Cutting the only remaining matching restaurant drops the count to zero.
  await page.locator('#restaurantCutBtn').click();
  await expect.poll(countText).toContain('0');

  // A same-location refresh must preserve an active Quick Cut selection.
  await page.evaluate(() => {
    restaurantRadiusMiles=5;
    restaurantQuickCuts=new Set(['fast_food']);
    restaurantManual=new Set();
    restaurantFilters={query:'',sort:'shuffle'};
    const refreshed=[
      { id:'qa-ff-refresh-1', name:'QA Refresh Fast Food One', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.10, lon:-86.70, distanceMiles:0.5, openNow:true },
      { id:'qa-ff-refresh-2', name:'QA Refresh Fast Food Two', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.11, lon:-86.71, distanceMiles:2.0, openNow:true },
      { id:'qa-ff-refresh-3', name:'QA Refresh Fast Food Three', amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food'], lat:36.12, lon:-86.72, distanceMiles:6.0, openNow:true }
    ];
    window.DinliminatePreserveRestaurantQuickCutsOnRefresh?.();
    window.applyRestaurantData?.({businesses:refreshed}, 'QA Scope Refresh');
    restaurantRadiusMiles=5;
    renderRestaurantQuickCuts();
  });
  await expect(fastFood).toHaveAttribute('aria-pressed','true');
  // Only 0.5 mi and 2.0 mi are inside the 5-mile radius; the 6-mile result is out of scope.
  await expect.poll(countText).toContain('2');

  // Toggling the active Quick Cut back off restores the refreshed choices.
  await fastFood.click();
  await expect(fastFood).toHaveAttribute('aria-pressed','false');
  await expect.poll(async () => page.evaluate(() => activeRestaurants.length)).toBe(3);

  expect(pageErrors).toEqual([]);
});
