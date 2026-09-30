import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const url='https://deploy-preview-53--diliminate.netlify.app/?remote-smoke='+Date.now();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/Chicago'});
await context.grantPermissions(['geolocation'],{origin:'https://deploy-preview-53--diliminate.netlify.app'});
await context.setGeolocation({latitude:40,longitude:-75});
const page=await context.newPage();
const pageErrors=[]; const consoleErrors=[]; const failed=[]; const badResponses=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText||'unknown'}));
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()});});
const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
const result={status:response?.status()??0,title:await page.title(),homeVisible:await page.locator('#home').isVisible().catch(()=>false),homeText:await page.locator('#home h1').innerText().catch(()=>''),pageErrors,consoleErrors,failed,badResponses};
console.log(JSON.stringify(result,null,2));
assert.equal(result.status,200,'Netlify preview must return HTTP 200');
assert.equal(result.homeVisible,true,'Home screen must be visible on the live Netlify preview');
assert.equal(result.homeText,'Dinner Decisions Simplified','Live Netlify preview must render the current home screen');
assert.equal(pageErrors.length,0,'Live Netlify preview must have no page errors');
assert.equal(result.badResponses.length,0,'Live Netlify preview must not request missing assets or receive HTTP errors');

const suggestResponse=await page.evaluate(async()=>{const r=await fetch('/api/restaurant-search?mode=suggest&q=Main%20Street%20Clarksville%20TN',{cache:'no-store'});return {status:r.status,body:await r.json().catch(()=>null)}});
assert.equal(suggestResponse.status,200,'Live Netlify address-suggest route must return HTTP 200');
assert.equal(suggestResponse.body?.ok,true,'Live Netlify address-suggest route must execute suggest mode');
assert.ok(Array.isArray(suggestResponse.body?.results),'Live Netlify address-suggest route must return a results array');

const searchResponse=await page.evaluate(async()=>{const r=await fetch('/api/restaurant-search?mode=search&lat=40&lon=-75&radius=5',{cache:'no-store'});return {status:r.status,body:await r.json().catch(()=>null)}});
assert.equal(searchResponse.status,200,'Live Netlify restaurant-search route must return HTTP 200');
assert.equal(searchResponse.body?.ok,true,'Live Netlify restaurant-search route must execute search mode rather than defaulting to health');
assert.equal(Number(searchResponse.body?.radiusMiles),5,'Live Netlify restaurant-search route must preserve the requested radius');
assert.ok(Array.isArray(searchResponse.body?.results),'Live Netlify restaurant-search route must return a results array');

await page.locator('#restStart').click();
await page.waitForTimeout(150);
assert.equal(await page.locator('#restaurant').isVisible(),true,'Find a restaurant should open the Restaurant screen');

await page.locator('#address').fill('Main Street, Clarksville, TN');
await page.locator('#find').click();
await page.waitForFunction(()=>!document.querySelector('#find')?.disabled,{timeout:30000});
assert.match(await page.locator('#locationSourceLabel').innerText(),/selected address/i,'Find should resolve a typed address and select it');
assert.notEqual(await page.locator('#restaurantCount').innerText(),'0 choices','Find should return restaurant choices when the provider has results');

await page.locator('#locate').click();
await page.waitForFunction(()=>/Using your location/i.test(document.querySelector('#locationSourceLabel')?.textContent||'') || /Location permission|Could not access/i.test(document.querySelector('#status')?.textContent||''),{timeout:20000});
const locationLabel=await page.locator('#locationSourceLabel').innerText();
assert.match(locationLabel,/Using your location/i,'Use My Location should set the location source when geolocation is available');
await page.waitForFunction(()=>!document.querySelector('#find')?.disabled,{timeout:30000});
await page.locator('#address').fill('Clarksville, TN');
await page.waitForSelector('#suggestionsBox button',{state:'visible',timeout:15000});
assert.ok(await page.locator('#suggestionsBox button').count()>0,'Live address autocomplete must return at least one suggestion');
await page.locator('#suggestionsBox button').first().click();
await page.waitForFunction(()=>!document.querySelector('#find')?.disabled,{timeout:30000});
assert.match((await page.locator('#locationSourceLabel').innerText()),/selected address/i,'Selecting an address must set the location source');
assert.notEqual(await page.locator('#address').inputValue(),'','Selecting an address must populate the address field');
assert.match(await page.locator('#restaurantCount').innerText(),/choice/i,'Live restaurant search must populate the restaurant choice count');

await page.locator('#restDetails').click();
await page.waitForTimeout(150);
assert.equal(await page.locator('#detailsModal').isVisible(),true,'Live Restaurant Details must open');
assert.equal(await page.locator('#detailsModal h3').innerText(),'Restaurant Details','Live Restaurant Details must use the explicit Restaurant Details title');
assert.equal(await page.locator('#detailsModal .restaurant-detail-contact').count(),1,'Live Restaurant Details must include the contact/directions section');
assert.ok((await page.locator('#detailsModal').innerText()).includes('Phone'),'Live Restaurant Details must include a Phone field');
assert.equal(await page.locator('#detailsModal #detailDirections').count(),1,'Live Restaurant Details must include Google Maps directions');
assert.match(await page.locator('#detailsModal #detailDirections').getAttribute('href')||'',/google\.com\/maps\/dir\//,'Live Restaurant Details directions must use Google Maps');
assert.equal(await page.locator('#detailsModal #detailWeb').count(),1,'Live Restaurant Details must include website/Google fallback');
await page.locator('#detailsModal [data-close]').click();

await page.locator('#hoursToggle').click();
assert.equal(await page.locator('#hoursToggle').innerText(),'All','Open/Unknown toggle must switch to All');
await page.locator('#hoursToggle').click();
assert.equal(await page.locator('#hoursToggle').innerText(),'Open/Unknown','Open/Unknown toggle must switch back');

await page.locator('#restaurantMenu').click();
await page.waitForTimeout(100);
await page.locator('#settings').click();
await page.waitForTimeout(100);
await page.locator('#appDiagnosis').click();
await page.waitForTimeout(200);
const diagnosisText=await page.locator('#settingsModal').innerText().catch(()=>''), diagnosisSections=await page.locator('#settingsModal .diagnosis-section').count(), diagnosisLoader=await page.locator('#settingsModal .diagnosis-loading').count();
assert.equal(diagnosisLoader,0,'Live App Diagnosis must not show the centered loading screen');
assert.equal(diagnosisSections,5,'Live App Diagnosis must render all five sections immediately');
assert.match(diagnosisText,/Core app/i,'Live App Diagnosis must show Core app');
await context.close();
await browser.close();
