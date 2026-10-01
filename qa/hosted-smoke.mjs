import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=String(process.env.BASE_URL||'').replace(/\/$/,'');
assert(base,'BASE_URL is required for hosted smoke');

const health=await fetch(base+'/api/restaurant-search?mode=health');
assert.equal(health.ok,true,'Hosted restaurant health endpoint should return HTTP 200');
const h=await health.json();
assert.equal(h.ok,true,'Hosted restaurant health should report ok');
assert.equal(Number(h.maxRadiusMiles),100,'Hosted restaurant API should expose 100-mile maximum');

const requireRelease=String(process.env.REQUIRE_RELEASE||'true').toLowerCase()!=='false';
let rel=null;
if(requireRelease){
  const release=await fetch(base+'/api/release',{cache:'no-store'});
  assert.equal(release.ok,true,'Hosted release endpoint should return HTTP 200');
  rel=await release.json();
  assert.equal(String(rel.build),'197','Hosted build should be Build 197');
  assert.equal(String(rel.version),'1.0','Hosted version should be 1.0');
  assert.equal(String(rel.sourceBranch),'cp466-restaurant-identity-final-2026-09-30','Hosted source branch should identify the Build 197 candidate');
}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const response=await page.goto(base+'/?hosted-smoke=1',{waitUntil:'domcontentloaded'});
assert(response&&response.ok(),'Hosted app page should load successfully');
assert.match(await page.title(),/Dinliminate/,'Hosted page title should contain Dinliminate');
assert.equal(await page.locator('#foodStart').isVisible(),true,'Hosted Home should expose Choose a food');
assert.equal(await page.locator('#restStart').isVisible(),true,'Hosted Home should expose Find a restaurant');
assert.equal(await page.locator('#offlineIndicator').count(),1,'Hosted shell should include the offline indicator');
assert.equal(errors.length,0,'Hosted app should have no page/console errors: '+errors.join(' | '));
await browser.close();
console.log(JSON.stringify({health:h,release:rel,base,requireRelease}));
