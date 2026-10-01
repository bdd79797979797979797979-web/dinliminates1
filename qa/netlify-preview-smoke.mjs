import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl=(process.env.BASE_URL||'https://deploy-preview-92--diliminate.netlify.app').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:393,height:852},
  deviceScaleFactor:2,
  isMobile:true,
  hasTouch:true,
  timezoneId:'America/Chicago'
});
await context.grantPermissions(['geolocation'],{origin:baseUrl});
await context.setGeolocation({latitude:36.5304,longitude:-87.3601});

const page=await context.newPage();
const pageErrors=[];
const consoleErrors=[];
const criticalResponses=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.on('response',r=>{
  if(r.status()>=400){
    const u=new URL(r.url());
    if(u.origin===new URL(baseUrl).origin || u.pathname.startsWith('/api/')) criticalResponses.push(r.status()+' '+r.url());
  }
});

try{
  await page.goto(baseUrl+'/?launch-smoke='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(600);

  assert.match(await page.title(),/Dinliminate/i,'Home title should identify Dinliminate');
  assert.equal(await page.locator('#home').isVisible(),true,'Home should be visible');
  for(const id of ['#foodStart','#restStart','#iphoneHelp','#menu']){
    assert.equal(await page.locator(id).count(),1,`Missing Home control ${id}`);
  }

  const release=await page.evaluate(async()=>({
    local:await fetch('./release.json?launch-smoke='+Date.now(),{cache:'no-store'}).then(r=>r.json()),
    runtime:await fetch('./api/release?launch-smoke='+Date.now(),{cache:'no-store'}).then(r=>r.json()),
    health:await fetch('./api/restaurant-search?mode=health&launch-smoke='+Date.now(),{cache:'no-store'}).then(r=>r.json())
  }));
  assert.equal(String(release.local.build),'197','Local release metadata must be Build 197');
  assert.equal(String(release.runtime.build),'197','Hosted release endpoint must report Build 197');
  assert.equal(String(release.runtime.sourceBranch),'cp466-restaurant-identity-final-2026-09-30','Hosted release endpoint must identify the Build 197 source branch');
  assert.equal(release.health.ok,true,'Restaurant health endpoint must be healthy');
  assert.equal(String(release.health.version),'r22','Hosted restaurant API must report r22');
  assert.equal(Number(release.health.maxRadiusMiles),100,'Hosted restaurant API must expose the 100-mile maximum');

  const homeOverflow=await page.evaluate(()=>({
    horizontal:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    vertical:document.documentElement.scrollHeight>window.innerHeight+2
  }));
  assert.equal(homeOverflow.horizontal,false,'Home must not horizontally overflow at 393px');
  assert.equal(homeOverflow.vertical,false,'Home must fit the 393x852 viewport without vertical overflow');

  await page.locator('#foodStart').click();
  await page.locator('#foodCard').waitFor({state:'visible',timeout:5000});
  for(const id of ['#foodCut','#foodMaybe','#foodBack','#foodDetails']){
    assert.equal(await page.locator(id).count(),1,`Missing Meal control ${id}`);
  }
  assert.ok(await page.locator('#foodQuick button').count()>=10,'Meal Quick Cuts should render');
  const foodBefore=Number((await page.locator('#foodCount').textContent()).match(/\d+/)?.[0]||0);
  assert.equal(foodBefore,116,'Meal deck should start with 116 choices');
  await page.locator('#foodMaybe').click();
  await page.waitForTimeout(150);
  const foodAfterMaybe=Number((await page.locator('#foodCount').textContent()).match(/\d+/)?.[0]||0);
  assert.equal(foodAfterMaybe,foodBefore,'Maybe should keep the Meal choice count unchanged');
  await page.locator('#foodBack').click();
  await page.waitForTimeout(150);
  const foodAfterBack=Number((await page.locator('#foodCount').textContent()).match(/\d+/)?.[0]||0);
  assert.equal(foodAfterBack,116,'Meal Back should restore the current decision state');
  await page.locator('#foodCut').click();
  await page.waitForTimeout(150);
  const foodAfterCut=Number((await page.locator('#foodCount').textContent()).match(/\d+/)?.[0]||0);
  assert.equal(foodAfterCut,115,'Meal Cut should remove one choice');
  await page.locator('#foodBack').click();
  await page.waitForTimeout(150);
  assert.equal(Number((await page.locator('#foodCount').textContent()).match(/\d+/)?.[0]||0),116,'Meal Back should undo a cut');
  await page.locator('#foodBackTop').click();
  assert.equal(await page.locator('#home').isVisible(),true,'Meal Back-to-home should return Home');

  await page.locator('#restStart').click();
  await page.locator('#restaurant').waitFor({state:'visible',timeout:5000});
  for(const id of ['#address','#locate','#find','#radius','#restaurantSearch','#restQuick','#restaurantMenu','#restaurantBackTop']){
    assert.equal(await page.locator(id).count(),1,`Missing Restaurant control ${id}`);
  }
  assert.equal(await page.locator('#radius option').count(),7,'Restaurant radius selector should expose seven tiers');
  assert.deepEqual(await page.locator('#radius option').allTextContents(),['1','3','5','10','25','50','100']);

  await page.locator('#radius').selectOption('1');
  await page.locator('#locate').click();
  await page.waitForTimeout(12000);
  const restaurantStatus=await page.locator('#status').textContent();
  const restaurantCountText=await page.locator('#restaurantCount').textContent();
  const hasRestaurantCard=await page.locator('#restaurantCard').count()>0;
  assert.ok(hasRestaurantCard || /No restaurants|sources are unavailable|timed out|Could not access|permission/i.test(restaurantStatus||''),`Restaurant search should settle cleanly; status=${restaurantStatus}`);

  const restOverflow=await page.evaluate(()=>({
    horizontal:document.documentElement.scrollWidth>document.documentElement.clientWidth+1
  }));
  assert.equal(restOverflow.horizontal,false,'Restaurant screen must not horizontally overflow at 393px');

  console.log(JSON.stringify({
    ok:true,
    build:release.runtime.build,
    api:release.health.version,
    home:'PASS',
    meal:'PASS',
    restaurant:'PASS',
    restaurantCount:restaurantCountText,
    restaurantCard:hasRestaurantCard,
    status:restaurantStatus,
    pageErrors,
    consoleErrors,
    criticalResponses
  },null,2));
} finally{
  await browser.close();
}

assert.equal(pageErrors.length,0,'Hosted page errors: '+pageErrors.join(' | '));
assert.equal(consoleErrors.length,0,'Hosted console errors: '+consoleErrors.join(' | '));
assert.equal(criticalResponses.length,0,'Critical hosted HTTP errors: '+criticalResponses.join(' | '));
