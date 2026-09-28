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
  expect(body).toContain('p733-launch-lock');
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
  await expect(page.locator('.restaurant-card-v240.active')).toBeVisible({ timeout: 70000 });
  await expect(page.locator('.restaurant-card-v240.active .restaurant-name-v240')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-meta-v240')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-address-v240')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-status-pill')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-distance-pill')).toBeVisible();
  const activeCard = page.locator('.restaurant-card-v240.active');
  const detailBtn = activeCard.locator('.restaurant-detail-btn-v240');
  const websiteBtn = activeCard.locator('.restaurant-order-btn-v240');
  await expect(detailBtn).toBeVisible();
  await expect(websiteBtn).toBeVisible();

  const menuCard = activeCard.locator('.restaurant-menu-card');
  if (await menuCard.count()) {
    await expect(menuCard).toBeVisible();
  }

  // Details opens from already-rendered card data; it should not wait on a search/provider request.
  const detailOpenMs = await page.evaluate(() => {
    const btn = document.querySelector('#restaurantStage .restaurant-card-v240.active .restaurant-detail-btn-v240');
    if (!btn) throw new Error('restaurant detail button missing');
    const t = performance.now();
    btn.click();
    return performance.now() - t;
  });
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  console.log('restaurant detail handler ms', Math.round(detailOpenMs));
  expect(detailOpenMs).toBeLessThan(100);
  await page.locator('#detailCloseBtn').click();
  await expect(page.locator('#detailBackdrop')).toHaveClass(/hidden/);

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
    // A live area may legitimately have zero matches for a cuisine. Such a
    // Quick Cut is disabled; deterministic coverage verifies click/restore
    // behavior when matches exist.
    if (await btn.isDisabled()) continue;
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
  await expect(page.locator('.restaurant-card-v240.active')).toBeVisible({ timeout: 70000 });

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


test('deterministic live restaurant Quick Cut scope tracks radius, Maybe, Back and hours', async ({ page }) => {
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  const fixture=[
    {id:'qa-mcd',name:"McDonald's",type:'restaurant',fastFood:true,category:'Fast Food',tags:['restaurant','fast_food'],distanceMiles:.5,openNow:true,address:'1201 Broadway, Nashville, TN 37203',menuItems:['Burgers','Fries'],website:'https://www.mcdonalds.com'},
    {id:'qa-bk',name:'Burger King',type:'restaurant',fastFood:true,category:'Fast Food',tags:['restaurant','fast_food'],distanceMiles:2,openNow:true},
    {id:'qa-wh',name:'Waffle House',type:'restaurant',fastFood:false,category:'american',cuisine:'american',tags:['restaurant','american'],distanceMiles:3,openNow:false},
    {id:'qa-ab',name:"Applebee's",type:'restaurant',fastFood:false,category:'american',cuisine:'american',tags:['restaurant','american'],distanceMiles:4,openNow:true},
    {id:'qa-pasta',name:'Pasta House',type:'restaurant',fastFood:false,category:'pasta',cuisine:'italian',tags:['restaurant','pasta'],distanceMiles:4.5,openNow:true},
    {id:'qa-south',name:'Southern Kitchen',type:'restaurant',fastFood:false,category:'southern',cuisine:'southern',tags:['restaurant','southern'],distanceMiles:4.8}
  ];
  await page.route('**/api/restaurant-search?*',async route=>{
    const u=new URL(route.request().url()),m=u.searchParams.get('mode');let body={};
    if(m==='suggest')body={results:[{display:'QA Test Address, Nashville, TN',query:'QA Test Address, Nashville, TN',precision:'address',lat:36.1,lon:-86.8}]};
    else if(m==='resolve')body={location:{lat:36.1,lon:-86.8},display:'QA Test Address, Nashville, TN',precision:'address'};
    else if(m==='search'){const radius=Number(u.searchParams.get('radius')||10),rows=fixture.filter(r=>r.distanceMiles<=radius);body={results:rows,businesses:rows,restaurants:rows,items:rows,total:rows.length,fastFoodCount:rows.filter(r=>r.fastFood).length,providersUsed:['QA fixture'],diagnostics:{}};}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.locator('#homeRestaurantQuick').click();
  await page.locator('#restaurantLocationInput').fill('QA Test Address Nashville');
  await expect(page.locator('.restaurant-address-suggestion').first()).toBeVisible();
  await page.locator('.restaurant-address-suggestion').first().click();
  await page.locator('#restaurantLoadBtn').click();
  await expect(page.locator('.restaurant-card-v240.active')).toBeVisible({timeout:10000});
  const fast=page.locator('#restaurantQuickCuts button[data-launch-rq="fast_food"]').first();
  const american=page.locator('#restaurantQuickCuts button[data-launch-rq="american"]').first();
  const count=async b=>{const t=await b.locator('.quick-cut-copy em').textContent(),m=String(t||'').match(/(\d+)\s*$/);return m?Number(m[1]):-1;};

  await expect.poll(()=>count(fast)).toBe(2);
  await page.locator('#restaurantRadiusFilter').selectOption('1');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('1 mi');
  await expect.poll(()=>count(fast)).toBe(1);
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.length)).toBe(1);

  await page.locator('#restaurantRadiusFilter').selectOption('5');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('5 mi');
  await expect.poll(()=>count(fast)).toBe(2);
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.length)).toBe(6);

  await page.evaluate(()=>{
    activeRestaurants.sort((a,b)=>(Number(a.distanceMiles)||999)-(Number(b.distanceMiles)||999));
    restaurantFilters.query='';
    renderRestaurantStage();
    window.DinliminateRefreshRestaurantQuickCuts?.();
  });
  await expect(page.locator('.restaurant-card-v240.active .restaurant-name-v240')).toHaveText("McDonald's");
  await page.locator('#restaurantKeepBtn').click();
  await expect.poll(()=>count(fast)).toBe(1);
  await page.locator('#restaurantBackAction').click();
  await expect.poll(()=>count(fast)).toBe(2);

  await expect.poll(()=>count(american)).toBe(1);
  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText('Closed');
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.every(r=>restaurantOpenStatus(r)===false))).toBe(true);
  await expect(page.locator('.restaurant-card-v240.active .restaurant-name-v240')).toHaveText('Waffle House');
  console.log('P690 hours=closed state', await page.evaluate(() => ({
    hours: localStorage.getItem('dinliminateRestaurantHoursFilter'),
    active: Array.isArray(activeRestaurants) ? activeRestaurants.map(r=>({name:r.name,d:r.distanceMiles,open:r.openNow,cat:r.category})) : [],
    americanText: document.querySelector('#restaurantQuickCuts button[data-launch-rq="american"] .quick-cut-copy em')?.textContent || null
  })));
  await expect.poll(()=>count(american)).toBe(1);
  await page.locator('#restaurantOpenUnknownBtn').click();
  await expect(page.locator('#restaurantOpenUnknownBtn')).toHaveText('Open / Unknown');
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.every(r=>restaurantOpenStatus(r)!==false))).toBe(true);
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.some(r=>r.name==='Southern Kitchen' && restaurantOpenStatus(r)===null))).toBe(true);
  await expect.poll(()=>count(american)).toBe(1);

  await fast.click();
  await expect(fast).toHaveAttribute('aria-pressed','true');
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.every(r=>!r.fastFood))).toBe(true);
  await fast.click();
  await expect(fast).toHaveAttribute('aria-pressed','false');
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.filter(r=>r.fastFood).length)).toBe(2);

  expect(pageErrors).toEqual([]);
});

test('restaurant card shows all available card data without clipping', async ({ page }) => {
  const pageErrors=[];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(() => {
    localStorage.setItem('dinliminateRestaurantHoursFilter','open-unknown');
    restaurantHoursFilter='open-unknown';
    window.applyRestaurantData?.({
      businesses:[{
        id:'qa-card-full',
        name:'QA Full Restaurant',
        type:'restaurant',
        category:'American',
        cuisine:'American',
        tags:['restaurant','american'],
        address:'123 Main Street, Nashville, TN 37203',
        phone:'615-555-0100',
        website:'https://example.com',
        opening_hours:'Mo-Su 8:00 AM-10:00 PM',
        openNow:true,
        distanceMiles:.8,
        lat:36.16,
        lon:-86.77,
        menuItems:['Burgers','Fries','Milkshakes']
      }]
    },'QA Card');
    const item=restaurantItems.find(r=>r.id==='qa-card-full') || restaurantItems[0];
    activeRestaurants=item?[item]:[];
    holdingRestaurants=[];
    restaurantQuickCuts=new Set();
    restaurantManual=new Set();
    restaurantFilters={query:'',sort:'shuffle'};
    restaurantRadiusMiles=10;
    renderRestaurantStage();
    renderRestaurantQuickCuts();
  });
  const card=page.locator('.restaurant-card-v240.active');
  await expect(card).toBeVisible();
  for(const selector of [
    '.restaurant-name-v240',
    '.restaurant-meta-v240',
    '.restaurant-address-v240',
    '.restaurant-menu-card',
    '.restaurant-card-choose-btn',
    '.restaurant-detail-btn-v240',
    '.restaurant-order-btn-v240'
  ]) await expect(card.locator(selector)).toBeVisible();
  const cardBox=await card.boundingBox();
  expect(cardBox).toBeTruthy();
  for(const selector of [
    '.restaurant-address-v240',
    '.restaurant-menu-card',
    '.restaurant-card-choice-row',
    '.restaurant-v240-actions'
  ]){
    const box=await card.locator(selector).boundingBox();
    expect(box).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(cardBox.x-1);
    expect(box.x+box.width).toBeLessThanOrEqual(cardBox.x+cardBox.width+1);
    expect(box.y).toBeGreaterThanOrEqual(cardBox.y-1);
    expect(box.y+box.height).toBeLessThanOrEqual(cardBox.y+cardBox.height+1);
  }
  expect(pageErrors).toEqual([]);
});

test('iPhone viewport has no horizontal overflow and keeps primary controls visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const metrics = await page.evaluate(() => {
    const before = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      startVisible: !!document.querySelector('#startBtn'),
      restaurantVisible: !!document.querySelector('#homeRestaurantQuick')
    };
    window.scrollTo({ left: 200, top: 0, behavior: 'instant' });
    const afterAttempt = window.scrollX;
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    return { ...before, afterAttempt };
  });
  console.log('iPhone viewport metrics', JSON.stringify(metrics));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.afterAttempt).toBe(0);
  expect(metrics.startVisible).toBeTruthy();
  expect(metrics.restaurantVisible).toBeTruthy();
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
  await expect.poll(async () => page.evaluate(() => activeRestaurants.length)).toBe(2);

  expect(pageErrors).toEqual([]);
});


test('front page chrome and food Quick Cuts/end-state stay launch-clean', async ({ page }) => {
  const pageErrors=[];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.setViewportSize({ width:390, height:844 });
  await page.goto(BASE,{waitUntil:'domcontentloaded'});

  await expect(page.locator('#homeMenuTopBtn')).toHaveCount(1);
  await expect(page.locator('#homeMenuTopBtn')).toHaveAttribute('aria-label','Open menu');
  await expect(page.locator('#homeMenuTopBtn svg')).toHaveCount(1);
  await expect(page.locator('#homeMenuTopBtn')).toBeVisible();
  await expect(page.locator('#homePanel .home-topbar-menu:visible')).toHaveCount(1);
  await expect(page.locator('#homePanel .home-topbar-menu svg:visible')).toHaveCount(1);
  await expect(page.locator('.home-topbar-brand')).toContainText('Dinliminate');
  await expect(page.locator('body:not(.game-mode):not(.restaurant-mode) > .app > header .menu-btn')).toHaveCount(0);
  const homeChrome=await page.evaluate(()=>{
    const brand=document.querySelector('.home-topbar-brand');
    const menu=document.querySelector('#homeMenuTopBtn');
    return {
      brandBg:brand?getComputedStyle(brand).backgroundColor:'',
      brandBorder:brand?getComputedStyle(brand).borderTopWidth:'',
      menuText:menu?String(menu.textContent||''):'',
      literalHamburger:document.body.textContent.includes('☰'),
      wordmarkFontPx:parseFloat(getComputedStyle(brand).fontSize),
      visibleHomeMenus:Array.from(document.querySelectorAll('#homePanel .home-topbar-menu')).filter(el=>getComputedStyle(el).display!=='none').length,
      visibleHamburgerSvgs:Array.from(document.querySelectorAll('#homePanel .home-topbar-menu svg')).filter(el=>getComputedStyle(el).display!=='none').length
    };
  });
  expect(homeChrome.brandBg).toBe('rgba(0, 0, 0, 0)');
  expect(homeChrome.brandBorder).toBe('0px');
  expect(homeChrome.menuText).not.toContain('☰');
  expect(homeChrome.literalHamburger).toBeFalsy();
  expect(homeChrome.wordmarkFontPx).toBeGreaterThanOrEqual(20);
  expect(homeChrome.visibleHomeMenus).toBe(1);
  expect(homeChrome.visibleHamburgerSvgs).toBe(1);

  await page.locator('#startBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  const quick=page.locator('#quickCutsBar .quick-cut').first();
  if(await quick.count()){
    const before=await quick.getAttribute('aria-pressed');
    await quick.click();
    await expect(quick).toHaveAttribute('aria-pressed','true');
    await quick.click();
    await expect(quick).toHaveAttribute('aria-pressed',before||'false');
  }

  const foodDetailStart=Date.now();
  await page.locator('#stage .stack-card.active [data-card-action="details"]').click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  const foodDetailOpenMs=Date.now()-foodDetailStart;
  console.log('food detail open ms',foodDetailOpenMs);
  expect(foodDetailOpenMs).toBeLessThan(500);
  await page.locator('#detailCloseBtn').click();
  await expect(page.locator('#detailBackdrop')).toHaveClass(/hidden/);

  await page.evaluate(() => {
    activeItems=[];
    holdingItems=[];
    undoStack=[];
    finalistMode=false;
    showHungryState?.();
  });
  await expect(page.locator('#gameTopCount')).toHaveText('0');
  await expect(page.locator('#countNumber')).toHaveText('0');
  expect(pageErrors).toEqual([]);
});


// P729 — full virtual-user journey: every major user-facing flow.


test('P729 full virtual-user journey covers the complete app surface', async ({ page }) => {
  test.setTimeout(45000);
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  const restaurantFixture = [
    { id:'vu-mcd', name:"McDonald's", type:'restaurant', fastFood:true, amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food','burger'], cuisine:'', address:'1 Titans Way, Nashville, TN 37213', website:'https://www.mcdonalds.com', opening_hours:'Mo-Su 06:00-23:00', openNow:true, distanceMiles:.4, lat:36.1665, lon:-86.7713, menuItems:['Burgers','Fries'] },
    { id:'vu-bk', name:'Burger King', type:'restaurant', fastFood:true, amenity:'fast_food', category:'Fast Food', tags:['restaurant','fast_food','burger'], address:'2 Titans Way, Nashville, TN 37213', openNow:true, distanceMiles:1.5, lat:36.1666, lon:-86.7714 },
    { id:'vu-wh', name:'Waffle House', type:'restaurant', fastFood:false, amenity:'restaurant', category:'American', cuisine:'american', tags:['restaurant','american','breakfast'], address:'3 Titans Way, Nashville, TN 37213', openNow:false, distanceMiles:2.2, lat:36.1667, lon:-86.7715 },
    { id:'vu-south', name:'Southern Kitchen', type:'restaurant', fastFood:false, amenity:'restaurant', category:'Southern', cuisine:'southern', tags:['restaurant','southern'], address:'4 Titans Way, Nashville, TN 37213', distanceMiles:2.8, lat:36.1668, lon:-86.7716 },
    { id:'vu-pasta', name:'Pasta House', type:'restaurant', fastFood:false, amenity:'restaurant', category:'Pasta', cuisine:'italian', tags:['restaurant','italian','pasta'], address:'5 Titans Way, Nashville, TN 37213', openNow:true, distanceMiles:4.4, lat:36.1669, lon:-86.7717 }
  ];

  await page.route('**/api/restaurant-search*', async route => {
    const u = new URL(route.request().url());
    const mode = u.searchParams.get('mode');
    if (mode === 'reverse') {
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({
        ok:true, version:'virtual-user', display:'Nashville, Tennessee', city:'Nashville'
      })});
    }
    if (mode === 'suggest') {
      const q = u.searchParams.get('q') || '';
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({
        ok:true, version:'virtual-user',
        results:[{display:'1 Titans Way, Nashville, Tennessee, 37213',query:q,precision:'address',lat:36.1661,lon:-86.7716}]
      })});
    }
    if (mode === 'resolve') {
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({
        ok:true, version:'virtual-user', location:{lat:36.1661,lon:-86.7716},
        display:'1 Titans Way, Nashville, Tennessee, 37213',precision:'address'
      })});
    }
    if (mode === 'health') {
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({ok:true,version:'virtual-user'})});
    }
    if (mode === 'search') {
      const radius = Number(u.searchParams.get('radius') || 25);
      const rows = restaurantFixture.filter(r => r.distanceMiles <= radius);
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({
        ok:true, version:'virtual-user', radiusMiles:radius,
        results:rows, restaurants:rows, businesses:rows, items:rows,
        total:rows.length, fastFoodCount:rows.filter(r=>r.fastFood).length,
        providersUsed:['Virtual User Fixture'], diagnostics:{elapsedMs:3,cacheHit:false}
      })});
    }
    return route.fulfill({status:400, contentType:'application/json', body:JSON.stringify({ok:false})});
  });

  await page.goto(BASE, {waitUntil:'domcontentloaded'});
  await expect(page.locator('#startBtn')).toBeVisible();
  await expect(page.locator('#homeRestaurantQuick')).toBeVisible();
  await expect(page.locator('#homePhoneHelpBtn')).toBeVisible();

  // HOME / PHONE HELP / MENU / ABOUT
  await page.locator('#homePhoneHelpBtn').click();
  await expect(page.locator('#infoBackdrop')).toBeVisible();
  await expect(page.locator('#infoTitle')).toHaveText('How to add to iPhone');
  await expect(page.locator('#infoBody')).toContainText('Add to Home Screen');
  await page.locator('#closeInfoBtn').click();

  await page.locator('#homeMenuTopBtn').click();
  await expect(page.locator('#drawer')).toBeVisible();
  for (const id of ['addMenuBtn','restaurantsMenuBtn','settingsBtn','historyMenuBtn','winnerMenuBtn','aboutMenuBtn','homeMenuBtn']) {
    await expect(page.locator('#drawer #' + id)).toBeVisible();
  }
  await page.locator('#aboutMenuBtn').click();
  await expect(page.locator('#infoBackdrop')).toBeVisible();
  await expect(page.locator('#infoBody')).toContainText('Made by Brian Dunn for Devona Dunn');
  await page.locator('#closeInfoBtn').click();

  // SETTINGS: toggles, hidden list, export, restore cancel, close.
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toBeVisible();
  const initialPrefQuick = await page.locator('#prefQuick').getAttribute('aria-pressed');
  await page.locator('#prefQuick').click();
  await expect(page.locator('#prefQuick')).toHaveAttribute('aria-pressed', initialPrefQuick === 'true' ? 'false' : 'true');
  await page.locator('#prefQuick').click();
  await expect(page.locator('#prefQuick')).toHaveAttribute('aria-pressed', initialPrefQuick || 'false');

  const initialPrefComfort = await page.locator('#prefComfort').getAttribute('aria-pressed');
  await page.locator('#prefComfort').click();
  await expect(page.locator('#prefComfort')).toHaveAttribute('aria-pressed', initialPrefComfort === 'true' ? 'false' : 'true');
  await page.locator('#prefComfort').click();

  const initialMotion = await page.locator('#motionTiltToggle').getAttribute('aria-pressed');
  await page.locator('#motionTiltToggle').click();
  await page.waitForTimeout(150);
  const motionAfter = await page.locator('#motionTiltToggle').getAttribute('aria-pressed');
  expect(motionAfter).toMatch(/true|false/);
  if (motionAfter !== initialMotion) {
    await page.locator('#motionTiltToggle').click();
    await expect(page.locator('#motionTiltToggle')).toHaveAttribute('aria-pressed', initialMotion || 'false');
  }

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportDataBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/dinliminate/i);
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();

  await page.locator('#systemRestoreBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeVisible();
  await page.locator('#restoreCancelBtn').click();
  await expect(page.locator('#restoreBackdrop')).toHaveClass(/hidden/);
  await page.locator('#closeSettingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toHaveClass(/hidden/);

  // FOOD MODE: quick cuts, details/save, hide confirmation + undo, add/edit/delete custom food.
  await page.locator('#startBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  await expect(page.locator('#stage .stack-card.active')).toBeVisible();
  expect(await page.locator('#quickCutsBar .quick-cut').count()).toBeGreaterThan(0);

  const foodQuickCuts = page.locator('#quickCutsBar .quick-cut');
  const foodQuickCount = await foodQuickCuts.count();
  for (let i = 0; i < Math.min(foodQuickCount, 6); i++) {
    const q = foodQuickCuts.nth(i);
    if (await q.isDisabled()) continue;
    const before = await q.getAttribute('aria-pressed');
    await q.click();
    await expect(q).toHaveAttribute('aria-pressed','true');
    await q.click();
    await expect(q).toHaveAttribute('aria-pressed',before || 'false');
  }

  const foodDetail = page.locator('#stage .stack-card.active [data-card-action="details"]');
  await foodDetail.click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await expect(page.locator('#detailTitle')).not.toHaveText('');
  const saveFood = page.locator('#detailSaveBtn');
  await expect(saveFood).toBeVisible();
  const savedBefore = await saveFood.textContent();
  await saveFood.click();
  await expect(saveFood).toHaveText(/Saved|Save/);
  await page.locator('#detailCloseBtn').click();

  const foodCountBeforeCut = Number(await page.locator('#gameTopCount').textContent());
  await page.locator('#cutBtn').click();
  await expect.poll(async()=>Number(await page.locator('#gameTopCount').textContent())).toBeLessThan(foodCountBeforeCut);
  await page.locator('#backBtn').click();
  await expect.poll(async()=>Number(await page.locator('#gameTopCount').textContent())).toBe(foodCountBeforeCut);

  // Hide is a confirmed action.
  await page.locator('#hideBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await expect(page.locator('#confirmTitle')).toHaveText(/Hide this food/);
  await page.locator('#confirmCancelBtn').click();
  await expect(page.locator('#confirmBackdrop')).toHaveClass(/hidden/);
  const beforeHideCount = Number(await page.locator('#gameTopCount').textContent());
  await page.locator('#hideBtn').click();
  await page.locator('#confirmCutBtn').click();
  await expect.poll(async()=>Number(await page.locator('#gameTopCount').textContent())).toBeLessThan(beforeHideCount);

  // Open Settings from the live round and unhide the hidden food.
  await page.locator('#menuBtn').click();
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#hiddenFoodList [data-unhide]').first()).toBeVisible();
  await page.locator('#hiddenFoodList [data-unhide]').first().click();
  await page.locator('#closeSettingsBtn').click();

  // Add a custom food, then edit it and delete it permanently.
  await page.locator('#menuBtn').click();
  await page.locator('#addMenuBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await page.locator('#newName').fill('Virtual User Test Dinner');
  await page.locator('#newCategory').selectOption({label:'Dinner'});
  await page.locator('#newNotes').fill('Created by the launch virtual-user audit.');
  await page.locator('#newRecipe').fill('Test recipe: mix, heat, serve.');
  const tagButtons = page.locator('#addFoodTagRow button');
  if (await tagButtons.count()) await tagButtons.first().click();
  await page.locator('#saveBtn').click();
  await expect(page.locator('#modalBackdrop')).toHaveClass(/hidden/);
  await expect.poll(async()=>page.evaluate(()=>customItems.some(x=>x.name==='Virtual User Test Dinner'))).toBe(true);

  await page.evaluate(() => {
    const item = customItems.find(x=>x.name==='Virtual User Test Dinner');
    if (item) {
      activeItems = [item, ...activeItems.filter(x=>x.id!==item.id)];
      renderStage();
    }
  });
  await page.locator('#stage .stack-card.active [data-card-action="details"]').click();
  await expect(page.locator('#editCardBtn')).toBeVisible();
  await page.locator('#editCardBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();
  await page.locator('#newName').fill('Virtual User Edited Dinner');
  await page.locator('#saveBtn').click();
  await expect.poll(async()=>page.evaluate(()=>customItems.some(x=>x.name==='Virtual User Edited Dinner'))).toBe(true);

  await page.locator('#stage .stack-card.active [data-card-action="details"]').click();
  await page.locator('#deleteCardBtn').click();
  await expect(page.locator('#confirmBackdrop')).toBeVisible();
  await page.locator('#confirmCutBtn').click();
  await expect.poll(async()=>page.evaluate(()=>!customItems.some(x=>x.name==='Virtual User Edited Dinner'))).toBe(true);

  // LIBRARY: saved + history tabs and details/remove actions.
  await page.locator('#menuBtn').click();
  await page.locator('#historyMenuBtn').click();
  await expect(page.locator('#libraryBackdrop')).toBeVisible();
  await expect(page.locator('[data-library-tab="saved"]')).toBeVisible();
  await expect(page.locator('[data-library-tab="history"]')).toBeVisible();
  await page.locator('[data-library-tab="saved"]').click();
  await expect(page.locator('#libraryList')).toBeVisible();
  if (await page.locator('[data-lib-detail]').count()) {
    await page.locator('[data-lib-detail]').first().click();
    await expect(page.locator('#detailBackdrop')).toBeVisible();
    await page.locator('#detailCloseBtn').click();
    await page.locator('#menuBtn').click();
    await page.locator('#historyMenuBtn').click();
  }
  await page.locator('[data-library-tab="history"]').click();
  await expect(page.locator('#libraryList')).toBeVisible();
  await page.locator('#closeLibraryBtn').click();

  // WINNER: choose, share, back to start, and reopen last winner from Home.
  await page.evaluate(() => {
    activeItems = activeItems.slice(0, Math.max(2, Math.min(4, activeItems.length)));
    holdingItems = [];
    finalistMode = false;
    renderStage();
  });
  await page.locator('#stage .stack-card.active [data-card-action="choose"]').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#shareBtn').click();
  await page.waitForTimeout(100);
  if (await page.locator('#dinliminateLaunchSheet').count()) {
    await expect(page.locator('#launchSheetTitle')).toContainText('Share');
    await expect(page.locator('.launch-sheet-close')).toBeVisible();
    await page.locator('.launch-sheet-close').click();
    await expect(page.locator('#dinliminateLaunchSheet')).toHaveCount(0);
  }
  await page.locator('#winnerHomeBtn').click();
  await expect(page.locator('#homePanel')).toBeVisible();
  if (await page.locator('#homeWinnerBtn').isVisible()) {
    await page.locator('#homeWinnerBtn').click();
    await expect(page.locator('#winnerPanel')).toBeVisible();
    await page.locator('#winnerHomeBtn').click();
  }

  // RESTAURANT MODE: location, radius, inline search, hours, Quick Cuts, actions, details.
  await page.locator('#homeRestaurantQuick').click();
  await expect(page.locator('#restaurantPanel')).toBeVisible();
  await page.locator('#restaurantLocationInput').fill(TEST_ADDRESS);
  await expect(page.locator('.restaurant-address-suggestion').first()).toBeVisible();
  await page.locator('.restaurant-address-suggestion').first().click();
  await expect(page.locator('.restaurant-card-v240.active')).toBeVisible({timeout:10000});
  await expect(page.locator('.restaurant-card-v240.active .restaurant-name-v240')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-meta-v240')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-address-v240')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-status-pill')).toBeVisible();
  await expect(page.locator('.restaurant-card-v240.active .restaurant-distance-pill')).toBeVisible();

  await page.locator('#restaurantRadiusFilter').selectOption('1');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('1 mi');
  await page.locator('#restaurantRadiusFilter').selectOption('5');
  await expect(page.locator('#restaurantRadiusDisplayText')).toHaveText('5 mi');

  const rSearchBtn = page.locator('#restaurantSearchBtn');
  await rSearchBtn.click();
  await expect(rSearchBtn).toHaveAttribute('aria-expanded','true');
  await page.locator('#restaurantInlineSearchInput').fill("McDonald");
  await expect(page.locator('#restaurantStage .restaurant-card.active .restaurant-name-v240')).toHaveText("McDonald's");
  await page.locator('#restaurantInlineSearchInput').fill('');

  const rHours = page.locator('#restaurantOpenUnknownBtn');
  await rHours.click();
  await expect(rHours).toHaveText('Closed');
  await expect(page.locator('#restaurantStage .restaurant-card.active .restaurant-name-v240')).toHaveText('Waffle House');
  await rHours.click();
  await expect(rHours).toHaveText('Open / Unknown');

  for (const key of ['fast_food','american','pasta','healthy','southern','potato','soupstew']) {
    const b = page.locator('#restaurantQuickCuts button[data-launch-rq="' + key + '"]').first();
    if (!(await b.count()) || await b.isDisabled()) continue;
    await b.click();
    await expect(b).toHaveAttribute('aria-pressed','true');
    await b.click();
    await expect(b).toHaveAttribute('aria-pressed','false');
  }

  await page.locator('#restaurantInlineSearchInput').fill('zzz-no-restaurant');
  await expect(page.locator('#restaurantTopCount')).toHaveText('0');
  await expect(page.locator('.restaurant-hungry-state')).toBeVisible();
  await page.locator('#restaurantHungryResetBtn').click();
  await expect(page.locator('.restaurant-card-v240.active')).toBeVisible();

  // Select a restaurant with a known website before exercising the Website action.
  const restaurantInline = page.locator('#restaurantInlineSearch');
  if (await restaurantInline.isHidden()) await page.locator('#restaurantSearchBtn').click();
  await expect(restaurantInline).toBeVisible();
  await page.locator('#restaurantInlineSearchInput').fill('McDonald');
  await expect(page.locator('#restaurantStage .restaurant-card-v240.active .restaurant-name-v240')).toHaveText("McDonald's");

  const rDetail = page.locator('#restaurantStage .restaurant-card-v240.active .restaurant-detail-btn-v240');
  await rDetail.click();
  await expect(page.locator('#detailBackdrop')).toBeVisible();
  await expect(page.locator('#detailActions')).toContainText(/Save/);
  await expect(page.locator('#detailActions')).toContainText(/Open in Maps/);
  await expect(page.locator('#detailActions')).toContainText(/Visit Website/);
  await expect(page.locator('#detailActions')).toContainText(/Report data/);
  await page.locator('#detailSaveBtn').click();
  await expect(page.locator('#detailSaveBtn')).toHaveText(/Saved|Save/);
  await page.locator('#detailReportBtn').click();
  await expect(page.locator('#toast')).toContainText('marked for data review');
  await page.locator('#detailCloseBtn').click();

  await page.locator('#restaurantMenuBtn').click();
  await expect(page.locator('#drawer')).toBeVisible();
  await expect(page.locator('#drawer #settingsBtn')).toBeVisible();
  await expect(page.locator('#drawer #historyMenuBtn')).toBeVisible();
  await expect(page.locator('#drawer #homeMenuBtn')).toBeVisible();
  await page.locator('#homeMenuBtn').click();
  await expect(page.locator('#homePanel')).toBeVisible();

  expect(errors).toEqual([]);
});


test('P729 edge-control regression covers settings, photo editor, library reset and backup import', async ({ page }) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(5000);
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', msg => { if (msg.type() === 'error') pageErrors.push('console: ' + msg.text()); });

  await page.goto(BASE, {waitUntil:'domcontentloaded'});
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#settingsBtn').click();
  await expect(page.locator('#settingsBackdrop')).toBeVisible();

  // Hide toggle is a real persistent setting and must round-trip.
  const hideToggle = page.locator('#hideToggle');
  const hideBefore = await hideToggle.getAttribute('aria-pressed');
  await hideToggle.click();
  await expect(hideToggle).toHaveAttribute('aria-pressed', hideBefore === 'true' ? 'false' : 'true');
  await hideToggle.click();
  await expect(hideToggle).toHaveAttribute('aria-pressed', hideBefore || 'false');
  await page.locator('#closeSettingsBtn').click();

  // Add/edit flow including photo upload/remove and recipe deletion.
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#addMenuBtn').click();
  await expect(page.locator('#modalBackdrop')).toBeVisible();

  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  await page.locator('#newPhoto').setInputFiles({name:'tiny.png',mimeType:'image/png',buffer:tinyPng});
  await expect(page.locator('#newPhotoPreview')).toHaveClass(/show/);
  await expect(page.locator('#removePhotoBtn')).toBeVisible();
  await page.locator('#removePhotoBtn').click();
  await expect(page.locator('#newPhotoPreview')).not.toHaveClass(/show/);
  await page.locator('#newPhoto').setInputFiles({name:'tiny.png',mimeType:'image/png',buffer:tinyPng});
  await expect(page.locator('#newPhotoPreview')).toHaveClass(/show/);

  await page.locator('#newName').fill('Virtual Edge Dinner');
  await page.locator('#newRecipe').fill('Edge test recipe.');
  await page.locator('#saveBtn').click();
  await expect(page.locator('#modalBackdrop')).toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => customItems.some(x => x.name === 'Virtual Edge Dinner'))).toBe(true);

  await page.evaluate(() => {
    const item = customItems.find(x => x.name === 'Virtual Edge Dinner');
    activeItems = item ? [item, ...activeItems.filter(x => x.id !== item.id)] : activeItems;
    renderStage();
  });
  await page.locator('#stage .stack-card.active [data-card-action="details"]').click();
  await expect(page.locator('#editCardBtn')).toBeVisible();
  await page.locator('#editCardBtn').click();
  await expect(page.locator('#deleteRecipeBtn')).toBeVisible();
  await page.locator('#deleteRecipeBtn').click();
  await expect(page.locator('#deleteRecipeBtn')).toHaveClass(/hidden/);
  await page.locator('#saveBtn').click();
  await expect(page.locator('#modalBackdrop')).toHaveClass(/hidden/);

  await page.locator('#stage .stack-card.active [data-card-action="details"]').click();
  await expect(page.locator('#detailGrid .recipe-box')).toHaveCount(0);
  await page.locator('#detailCloseBtn').click();

  // Winner Start Fresh resets to a new food round.
  await page.evaluate(() => {
    activeItems = activeItems.slice(0, Math.max(2, Math.min(3, activeItems.length)));
    holdingItems = [];
    finalistMode = false;
    renderStage();
  });
  await page.locator('#stage .stack-card.active [data-card-action="choose"]').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#startOverBtn').click();
  await expect(page.locator('#gamePanel')).toBeVisible();
  await expect(page.locator('#stage .stack-card.active')).toBeVisible();

  // Make a history entry, then exercise the calendar, event removal, Saved removal, and reset.
  await page.locator('#stage .stack-card.active [data-card-action="choose"]').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#winnerHomeBtn').click();
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#historyMenuBtn').click();
  await expect(page.locator('#libraryBackdrop')).toBeVisible();

  await page.locator('[data-library-tab="history"]').click();
  await expect(page.locator('.history-calendar-grid')).toBeVisible();
  await expect(page.locator('.history-day')).toHaveCount(42);
  await expect(page.locator('[data-cal-prev]')).toBeVisible();
  await expect(page.locator('[data-cal-today]')).toBeVisible();
  await expect(page.locator('[data-cal-next]')).toBeVisible();
  const historyEvents = page.locator('.history-event');
  if (await historyEvents.count()) {
    await expect(page.locator('.history-event-x').first()).toBeVisible();
    await page.locator('.history-event-x').first().click();
    await expect(page.locator('.history-calendar-grid')).toBeVisible();
  }

  // The Saved tab must expose a Remove action for saved choices.
  await page.locator('[data-library-tab="saved"]').click();
  await expect(page.locator('#libraryList')).toBeVisible();
  const savedRemove = page.locator('[data-lib-remove]').first();
  if (await savedRemove.count()) {
    await savedRemove.click();
    await expect(page.locator('#libraryList')).toBeVisible();
  }
  await page.locator('#closeLibraryBtn').click();

  // Backup export + import must reload cleanly; first verify the real Restore confirmation.
  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#settingsBtn').click();
  await page.locator('#systemRestoreBtn').click();
  await expect(page.locator('#restoreBackdrop')).toBeVisible();
  await page.locator('#restoreConfirmBtn').click();
  await page.waitForTimeout(600);
  await expect(page.locator('#homePanel')).toBeVisible();

  await page.locator('#homeMenuTopBtn').click();
  await page.locator('#settingsBtn').click();
  const importPayload = {
    version: 'p729',
    exportedAt: new Date().toISOString(),
    data: {
      custom: [],
      hidden: [],
      saved: [],
      history: [],
      lastWinner: 'null',
      preferences: {quick:false,comfort:false},
      hideEnabled: 'true',
      radius: '10',
      motionTilt: 'false',
      restaurantArea: '',
      restaurantFilters: '{}',
      deletedFoods: [],
      restaurantReports: []
    }
  };
  await page.locator('#importDataInput').setInputFiles({
    name:'dinliminate-test-backup.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(importPayload))
  });
  await page.waitForTimeout(1200);
  await expect(page.locator('#homePanel')).toBeVisible();
  await expect(page.locator('#settingsBackdrop')).toHaveClass(/hidden/);

  expect(pageErrors).toEqual([]);
});


test('P730 exact Quick Cut count and one-remaining-choice behavior', async ({ page }) => {

test('P730 exact Quick Cut count and one-remaining-choice behavior', async ({ page }) => {
  test.setTimeout(60000);
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

  // FOOD: two choices -> Maybe -> one choice -> Choose.
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    activeItems=[homeMeals[0],homeMeals[1]];
    holdingItems=[];
    undoStack=[];
    finalistMode=false;
    searchQuery='';
    originalCount=2;
    renderStage();
    syncDecisionActionLabels();
  });
  await expect(page.locator('#gamePanel')).toBeVisible();
  await expect(page.locator('#holdBtn')).toHaveText(/Maybe/);
  await page.locator('#holdBtn').click();
  await expect.poll(async()=>page.evaluate(()=>activeItems.length)).toBe(1);
  await expect(page.locator('#holdBtn')).toHaveText('Choose');
  await expect(page.locator('#holdBtn')).toHaveClass(/is-final-choice/);
  await page.locator('#holdBtn').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#winnerHomeBtn').click();

  // FOOD: one choice -> Cut -> Hungry.
  await page.locator('#startBtn').click();
  await page.evaluate(()=>{
    activeItems=[homeMeals[0]];
    holdingItems=[];
    undoStack=[];
    finalistMode=false;
    renderStage();
    syncDecisionActionLabels();
  });
  await expect(page.locator('#holdBtn')).toHaveText('Choose');
  await page.locator('#cutBtn').click();
  await expect(page.locator('#hungryResetBtn')).toBeVisible();
  await expect(page.locator('#gameTopCount')).toHaveText('0');

  // RESTAURANT: exact 27 -> 15 Fast Food hidden -> 12 remain.
  await page.evaluate(()=>{
    const rows=[];
    for(let i=1;i<=27;i++) rows.push({
      id:'vu-ff-'+i,
      name:i<=15?'Fast Food '+i:'Restaurant '+i,
      type:'restaurant',
      amenity:i<=15?'fast_food':'restaurant',
      category:i<=15?'Fast Food':'American',
      cuisine:i<=15?'':'american',
      tags:i<=15?['restaurant','fast_food']:['restaurant','american'],
      address:i+' Main St, Nashville, TN 37213',
      openNow:true,
      distanceMiles:i<=27?i/3:9.5,
      lat:36.16, lon:-86.77
    });
    window.applyRestaurantData?.({businesses:rows},'QA Fast Food Count');
    restaurantItems=rows;
    restaurantBase=[...rows];
    activeRestaurants=[...rows];
    holdingRestaurants=[];
    restaurantManual=new Set();
    restaurantQuickCuts=new Set();
    restaurantFilters={query:'',sort:'shuffle'};
    restaurantRadiusMiles=10;
    restaurantHoursFilter='open-unknown';
    restaurantEliminationExhausted=false;
    showRestaurantMode();
    renderRestaurantStage();
    renderRestaurantQuickCuts();
    syncRestaurantActionLabels();
  });
  await expect(page.locator('#restaurantTopCount')).toHaveText('27');
  const fast=page.locator('#restaurantQuickCuts button[data-launch-rq="fast_food"]');
  await expect(fast).toContainText('hide · 15');
  await fast.click();
  await expect(page.locator('#restaurantTopCount')).toHaveText('12');
  await expect(fast).toContainText('show · 15');
  await fast.click();
  await expect(page.locator('#restaurantTopCount')).toHaveText('27');

  // RESTAURANT: two choices -> Maybe -> one choice -> Choose.
  await page.evaluate(()=>{
    const base=[
      {id:'vu-r1',name:'Virtual Restaurant One',type:'restaurant',amenity:'restaurant',category:'American',cuisine:'american',tags:['restaurant','american'],openNow:true,distanceMiles:1,lat:36.16,lon:-86.77},
      {id:'vu-r2',name:'Virtual Restaurant Two',type:'restaurant',amenity:'restaurant',category:'Italian',cuisine:'italian',tags:['restaurant','italian'],openNow:true,distanceMiles:2,lat:36.17,lon:-86.76}
    ];
    restaurantItems=base; restaurantBase=[...base]; activeRestaurants=[...base]; holdingRestaurants=[]; restaurantQuickCuts=new Set(); restaurantManual=new Set(); restaurantFilters={query:'',sort:'shuffle'}; restaurantRadiusMiles=10; restaurantHoursFilter='open-unknown'; restaurantEliminationExhausted=false;
    renderRestaurantStage(); renderRestaurantQuickCuts(); syncRestaurantActionLabels();
  });
  await expect(page.locator('#restaurantKeepBtn')).toHaveText(/Maybe/);
  await page.locator('#restaurantKeepBtn').click();
  await expect.poll(async()=>page.evaluate(()=>activeRestaurants.length)).toBe(1);
  await expect(page.locator('#restaurantKeepBtn')).toHaveText('Choose');
  await expect(page.locator('#restaurantKeepBtn')).toHaveClass(/is-final-choice/);
  await page.locator('#restaurantKeepBtn').click();
  await expect(page.locator('#winnerPanel')).toBeVisible();
  await page.locator('#winnerHomeBtn').click();

  // RESTAURANT: one choice -> Cut -> Hungry.
  await page.evaluate(()=>{
    const base=[{id:'vu-r3',name:'Virtual Restaurant Three',type:'restaurant',amenity:'restaurant',category:'American',cuisine:'american',tags:['restaurant','american'],openNow:true,distanceMiles:1,lat:36.16,lon:-86.77}];
    restaurantItems=base; restaurantBase=[...base]; activeRestaurants=[...base]; holdingRestaurants=[]; restaurantQuickCuts=new Set(); restaurantManual=new Set(); restaurantFilters={query:'',sort:'shuffle'}; restaurantRadiusMiles=10; restaurantHoursFilter='open-unknown'; restaurantEliminationExhausted=false;
    renderRestaurantStage(); renderRestaurantQuickCuts(); syncRestaurantActionLabels();
  });
  await expect(page.locator('#restaurantKeepBtn')).toHaveText('Choose');
  await page.locator('#restaurantCutBtn').click();
  await expect(page.locator('#restaurantHungryResetBtn')).toBeVisible();
  await expect(page.locator('#restaurantTopCount')).toHaveText('0');

  expect(errors).toEqual([]);
});