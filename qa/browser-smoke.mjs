import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'};

const server = http.createServer((req,res)=>{
  const pathname = decodeURIComponent((req.url||'/').split('?')[0]);
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\//,'');
  const file = path.join(root, rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {res.writeHead(404);res.end('not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));

const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/Chicago'});
await context.grantPermissions(['geolocation'],{origin:'http://127.0.0.1:4173'}); await context.setGeolocation({latitude:36.5304,longitude:-87.3601});
const page = await context.newPage();

const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const pageErrors=[]; const consoleErrors=[]; const dataResponses=[]; const requestFailures=[]; const badResponses=[];
fs.mkdirSync(path.join(root,'qa-artifacts'),{recursive:true});
page.on('pageerror', err => pageErrors.push(String(err)));
page.on('console', msg => { if(msg.type()==='error') consoleErrors.push(msg.text()); });
page.on('response', res => { if(res.url().includes('/data/foods.js')) dataResponses.push({status:res.status(),url:res.url()}); if(res.status()>=400) badResponses.push({status:res.status(),url:res.url(),type:res.request().resourceType()}); });
page.on('requestfailed', req => { if(req.url().includes('/data/foods.js')) requestFailures.push({url:req.url(),error:req.failure()?.errorText||'unknown'}); });
await page.route('**/*', async route => {
  const u = route.request().url();
  if (u.includes('/api/release')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,name:'Dinliminate',version:'1.0',build:'117',sourceBranch:'cp238-launch-hardening',commit:null,branch:'cp238-launch-hardening',environment:'test',expectedBranch:'cp238-launch-hardening'})});
  }
  if (u.includes('/api/restaurant-search?mode=health')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'qa',maxRadiusMiles:100,providers:['qa']})});
  }
  if (u.includes('/api/restaurant-search?mode=suggest')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,results:[
      {lat:36.5298,lon:-87.3588,display:'123 Main St, Clarksville, TN 37040'},
      {lat:36.5304,lon:-87.3601,display:'456 Market St, Clarksville, TN 37043'}
    ]})});
  }
  if (u.includes('/api/restaurant-search?mode=resolve')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,lat:36.5298,lon:-87.3588,display:'123 Main St, Clarksville, TN 37040'})});
  }
  if (u.includes('/api/restaurant-search?mode=reverse')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,display:'Current location (QA)'})});
  }
  if (u.includes('/api/restaurant-search?mode=search')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'qa',radiusMiles:10,total:7,fastFoodCount:2,results:[
      {id:'mcd-1',name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',menuItems:['Big Mac','Fries'],distance:1.2,address:'100 Main St, Clarksville, TN',website:'https://mcdonalds.com',phone:'(931) 555-0101',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85'},
      {id:'waffle-1',name:'Waffle House',category:'American',fastFood:false,cuisine:'breakfast',distance:2.1,address:'200 Riverside Dr, Clarksville, TN',website:'https://wafflehouse.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85'},
      {id:'taco-1',name:'Taco Bell',category:'Fast Food',fastFood:true,cuisine:'mexican',distance:3.4,address:'300 Madison St, Clarksville, TN',website:'https://tacobell.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85'},
      {id:'ital-1',name:'Pasta House',category:'Italian',fastFood:false,cuisine:'italian',distance:4.2,address:'400 College St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85'},
      {id:'southern-1',name:'Southern Table',category:'Southern',fastFood:false,cuisine:'southern',distance:5.1,address:'500 Main St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'},
      {id:'asian-1',name:'Asian Garden',category:'Asian',fastFood:false,cuisine:'asian',distance:5.8,address:'600 Madison St, Clarksville, TN',website:'',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=85'},
      {id:'closed-1',name:'Closed Grill',category:'American',fastFood:false,cuisine:'american',distance:6.2,address:'700 Main St, Clarksville, TN',website:'https://example.com',opening_hours:'closed',photo:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'}
    ]})});
  }
  if (u.startsWith('https://images.unsplash.com/') || u.startsWith('https://images.pexels.com/')) {
    return route.fulfill({status:200,contentType:'image/png',body:png1x1});
  }
  return route.continue();
});

function qa(){ return page.evaluate(()=>window.__DINLIMINATE_QA__?.snapshot()); }
async function visible(id){return page.locator('#'+id).isVisible();}
async function click(sel){await page.locator(sel).click();}
async function settle(){await page.waitForTimeout(150);}

await page.goto('http://127.0.0.1:4173/?qa=1');
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(100);
console.log('Food data runtime diagnostic',JSON.stringify({catalog:await page.evaluate(()=>Array.isArray(window.DINLIMINATE_FOODS)?window.DINLIMINATE_FOODS.length:-1),responses:dataResponses,requestFailures,pageErrors,consoleErrors}));
await assert.equal(await page.locator('#home h1').innerText(),'what sounds good tonight?');
const homeGeom=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,clientWidth:document.documentElement.clientWidth,innerHeight:window.innerHeight}));
assert.equal(homeGeom.scrollWidth,homeGeom.clientWidth,'Home should not horizontally overflow on iPhone');
assert.ok(homeGeom.scrollHeight <= homeGeom.innerHeight + 2,'Home should fit one iPhone viewport without vertical scrolling');
assert.equal(await page.locator('#home .home-card-photo').count(),2,'Home should have exactly two photo-backed choices');
assert.ok(homeGeom.scrollHeight <= homeGeom.innerHeight + 2,'Home should fit one iPhone viewport without vertical scrolling');
assert.equal(await page.locator('#home .home-card-photo').count(),2,'Home should have one photo-backed Food choice and one photo-backed Restaurant choice');
assert.equal((await page.locator('#home .home-card-photo').evaluateAll(els=>els.map(e=>e.getAttribute('style')||''))).every(s=>s.includes('--home-photo')),true,'Both Home choices should have dedicated food/restaurant photos');
assert.equal(await page.locator('#home #continue').count(),0,'Continue saved round should not appear on the home screen');
assert.equal(await page.locator('#home .made-by').count(),0,'Home attribution should not appear on the front page');
const homeHeading=await page.locator('#home h1').boundingBox();
assert.ok(homeHeading && homeHeading.x + homeHeading.width <= homeGeom.clientWidth + 1,'Home headline should fit fully inside the iPhone viewport');
assert.ok(homeHeading && homeHeading.y >= 0 && homeHeading.y + homeHeading.height <= homeGeom.innerHeight + 2,'Home headline should not be vertically cut off');

await assert.equal((await qa()).foodCatalog,62,'Restored 62-food catalog should load before the round starts');
await click('#foodStart'); await settle();
assert.equal(await visible('foodNextCard'),true,'Food should show the next Tinder card behind the current card');
assert.equal(await page.locator('[data-food-quick]').count(),12,'Food should have 12 Quick Cuts');
assert.equal(await page.locator('[data-food-quick] .quick-chip-photo').count(),12,'Every Food Quick Cut should render a photo element');
assert.equal((await page.locator('[data-food-quick] .quick-chip-photo').evaluateAll(imgs=>imgs.map(x=>x.getAttribute('src')))).every(Boolean),true,'Every Food Quick Cut should have a photo source');
const imageCatalog=await page.evaluate(()=>Object.fromEntries((window.DINLIMINATE_FOODS||[]).filter(x=>['popcorn','stir-fry'].includes(x.id)).map(x=>[x.id,x.image])));
assert.match(imageCatalog.popcorn||'',/pexels-photo-6422042\.jpeg/,'Popcorn should use a popcorn photo');
assert.match(imageCatalog['stir-fry']||'',/photos\/31673757\//,'Mexican Stir Fry should use an accurate Mexican stir-fry photo');
const foodGeom=await page.evaluate(()=>{const card=document.querySelector('#foodCard'),actions=document.querySelector('#foodCut')?.parentElement;return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,cardBottom:card?.getBoundingClientRect().bottom||0,actionsBottom:actions?.getBoundingClientRect().bottom||0,h:innerHeight}});
let s=await qa(); assert.equal(s.screen,'food'); assert.equal(s.foodPool.length,62,'expected restored food catalog');
const foodImageSources=await page.evaluate(()=>window.DINLIMINATE_FOODS.map(x=>({id:x.id,image:x.image})));
assert.equal(foodImageSources.length,62,'Food data should expose 62 image-backed choices');
assert.equal(foodImageSources.every(x=>typeof x.image==='string'&&x.image.length>0),true,'Every built-in food must have an image URL');
await click('[data-food-quick="Potato"]'); await settle();
s=await qa();
assert.equal(s.foodPool.length,59,'Potato Quick Cut should remove only Potato-mapped foods');
assert.equal(s.foodPool.includes('potato-soup'),true,'Potato Quick Cut must not remove Potato Soup because soup is its primary mapping');
assert.equal(s.foodPool.includes('steak-potato'),true);
assert.equal(s.foodPool.includes('burgers'),true,'Potato Quick Cut must not remove Burgers');
await click('[data-food-quick="Potato"]'); await settle();
s=await qa(); assert.equal(s.foodPool.length,62,'Quick Cut should restore');

const foodBox=await page.locator('#foodCard').boundingBox();
if(!foodBox) throw new Error('Food card bounding box missing for swipe QA');
await page.mouse.move(foodBox.x+foodBox.width/2,foodBox.y+foodBox.height/2);
await page.mouse.down();
await page.mouse.move(foodBox.x+60,foodBox.y+foodBox.height/2,{steps:4});
assert.equal(await page.locator('#foodCard').getAttribute('data-swipe'),'cut','Food swipe should show CUT affordance while dragging');
assert.ok((await page.locator('#foodCard').evaluate(el=>el.style.transform)).includes('translateX'),'Food swipe should visibly drag the card');
assert.match(await page.locator('#foodNextCard').evaluate(el=>el.style.transform),/scale\(0\.9[6-9]|1/,'Food next card should advance while the current card is dragged');
await page.mouse.up();
await settle();
s=await qa(); assert.equal(s.foodActions.at(-1)?.type,'cut','Food left swipe should Cut');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodPool.length,62,'Food Back should restore left swipe');

const foodBox2=await page.locator('#foodCard').boundingBox();
if(!foodBox2) throw new Error('Food card bounding box missing for right swipe QA');
await page.mouse.move(foodBox2.x+60,foodBox2.y+foodBox2.height/2);
await page.mouse.down();
await page.mouse.move(foodBox2.x+foodBox2.width-20,foodBox2.y+foodBox2.height/2,{steps:4});
await page.mouse.up();
await settle();
s=await qa(); assert.equal(s.foodActions.at(-1)?.type,'maybe','Food right swipe should Maybe');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodPool.length,62,'Food Back should restore right swipe');
const beforeCut=s.foodPool.length;
await click('#foodCut'); await settle();
let afterCut=await qa(); assert.equal(afterCut.foodPool.length < beforeCut,true);
assert.equal(afterCut.foodActions.length,1);
const cutId=afterCut.foodActions[0].id;
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodPool.includes(cutId),true,'Food Back should restore exact cut choice');

const foodKeepCount=(await qa()).foodPool.length; await click('#foodMaybe'); await settle();
s=await qa(); assert.equal(s.maybe.length,1,'Maybe should mark the current choice for recycling'); assert.equal(s.foodPool.length,foodKeepCount,'Maybe/Keep should leave the food count unchanged');
assert.equal(s.foodPool.length,62,'Maybe/Keep should leave the food count unchanged');
while(!s.foodMaybeRound && s.foodPool.length>0){ await click('#foodCut'); await settle(); s=await qa(); }
assert.equal(s.foodMaybeRound,true,'Food Maybe choices should recycle into a second narrowing pass');
assert.equal(s.foodPool.includes((await qa()).maybe[0]),true,'The kept food should return when the first pass is exhausted');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodMaybeRound,true,'Back from a second-pass Cut should preserve the recycle round');
await click('#foodBackTop'); await settle(); await click('#foodStart'); await settle(); console.log('Food next probe 1',JSON.stringify(await page.evaluate(()=>{const c=document.querySelector('#foodNextCard'),s=window.__DINLIMINATE_QA__?.snapshot(); return {screen:s?.screen,pool:s?.foodPool?.length,index:s?.index,maybe:s?.maybe?.length,round:s?.foodMaybeRound,cls:c?.className,display:c&&getComputedStyle(c).display,rect:c?.getBoundingClientRect().toJSON(),child:c?.firstElementChild?.tagName};}))); await page.evaluate(()=>window.drawFood?.()); await settle(); console.log('Food next probe 2',JSON.stringify(await page.evaluate(()=>{const c=document.querySelector('#foodNextCard'),s=window.__DINLIMINATE_QA__?.snapshot(); return {screen:s?.screen,pool:s?.foodPool?.length,index:s?.index,maybe:s?.maybe?.length,round:s?.foodMaybeRound,cls:c?.className,display:c&&getComputedStyle(c).display,rect:c?.getBoundingClientRect().toJSON(),child:c?.firstElementChild?.tagName};})));
assert.equal((await qa()).foodPool.length,62,'Starting a new food round should reset the Maybe recycle cycle');

const randomBefore=(await qa()).foodPool.length;
await page.evaluate(()=>{ Math.random=()=>0.24; });
await click('#randomOne'); await settle();
s=await qa(); assert.equal(s.foodActions.at(-1)?.type,'cut','Random Cut One should use the same Cut action');
assert.equal(s.foodPool.length,randomBefore-1,'Random Cut One should remove exactly one choice');
await click('#foodBack'); await settle();

await click('#foodBackTop'); await settle();
assert.equal((await qa()).screen,'home','top Back should return to the home screen');
await click('#foodStart'); await settle();

// Menu + Food Details + Hide must be clickable.
await click('#foodMenu'); await settle();
assert.equal(await visible('drawer'),true,'Food Menu should open the drawer');
await click('#settings'); await settle();
assert.equal(await visible('settingsModal'),true,'Settings should open');
assert.equal(await page.locator('#appDiagnosis').count(),1,'Settings should include App Diagnosis');
await click('#appDiagnosis'); await settle();
assert.equal(await visible('diagnosisModal'),true,'App Diagnosis should open from Settings');
assert.match(await page.locator('#diagnosisModal').innerText(),/System diagnosis/i,'App Diagnosis should render the diagnostic report');
assert.match(await page.locator('#diagnosisModal').innerText(),/Food catalog/i,'App Diagnosis should report food catalog health');
assert.match(await page.locator('#diagnosisModal').innerText(),/Restaurant search service/i,'App Diagnosis should report restaurant search service health');
const diagnosisRun1=await page.locator('#diagnosisModal .diagnosis-summary').innerText(); await click('#diagnosisRefresh'); await page.waitForFunction(()=>document.querySelector('#diagnosisModal .diagnosis-summary')?.innerText.includes('Run 2')); assert.equal(await visible('diagnosisModal'),true,'App Diagnosis should remain open after Run again'); assert.notEqual(await page.locator('#diagnosisModal .diagnosis-summary').innerText(),diagnosisRun1,'Run again should execute a new diagnostic pass');
await page.locator('#diagnosisModal [data-close]').click(); await settle();
await page.locator('#settingsModal [data-close]').click(); await settle();
await click('#foodMenu'); await settle();

await click('#drawerClose'); await settle();
await page.locator('#foodDetails').click(); await settle();
assert.equal(await visible('detailsModal'),true,'Food Details should open the Details sheet');
assert.equal(await page.locator('#detailsModal').locator('text=Typical nutrition').count()>0,true,'Food Details should show typical nutrition');
assert.equal(await page.locator('#detailsModal').locator('text=Ingredients').count()>0,true,'Food Details should show ingredients');
assert.equal(await page.locator('#detailsModal #detailHide').count(),1,'Food Details should include Hide');
await page.locator('#detailsModal [data-close]').click(); await settle();


await click('#foodPassAround'); await settle();
assert.equal(await visible('passSurface'),true,'Pass Around setup should use the full page, not a popup');
assert.equal(await page.locator('#passModal').count(),0,'Pass Around should not open a modal');
await click('[data-pass-count="3"]'); await settle();
const names=page.locator('[data-pass-name]');
await names.nth(0).fill('Brian'); await names.nth(1).fill('Devona'); await names.nth(2).fill('Guest');
await click('#passBegin'); await settle();
assert.equal(await visible('passSurface'),true,'Pass Around voting should remain full page');
let pass=await qa(); const firstPassId=pass.pass.poolIds[0];
assert.equal(await page.locator('#passGestureHit').count(),1,'Pass Around should expose a dedicated full-card gesture layer');
console.log('Pass bind diagnostic',await page.evaluate(()=>window.__DINLIMINATE_TEST__));
assert.equal(await page.locator('#passGestureHit').getAttribute('data-pass-swipe-bound'),'true','Pass Around gesture layer should be bound when the page is created');
const passBox=await page.locator('#passGestureHit').boundingBox(); if(!passBox) throw new Error('Pass gesture surface missing');
const passX1=passBox.x+50, passX2=passBox.x+passBox.width-45, passY=passBox.y+passBox.height/2;
const passTarget=await page.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y);const g=e?getComputedStyle(e):null;return {tag:e?.tagName||'',id:e?.id||'',cls:e?.className||'',pointerEvents:g?.pointerEvents||'',zIndex:g?.zIndex||'',rect:e?JSON.stringify(e.getBoundingClientRect()):''}},{x:passX1,y:passY}); console.log('Pass drag target diagnostic',JSON.stringify(passTarget));
assert.equal(passTarget.id,'passGestureHit','The full-card swipe hit layer must be the topmost pointer target');
assert.equal(passTarget.pointerEvents,'auto','The full-card swipe hit layer must accept pointer input');
await page.mouse.move(passX1,passY); await page.mouse.down(); await page.mouse.move(passX2,passY,{steps:8});
await page.waitForTimeout(20);
console.log('Pass gesture event diagnostic',await page.evaluate(()=>window.__DINLIMINATE_TEST__));
assert.equal(await page.locator('#passCard').getAttribute('data-swipe'),'maybe','Pass Around should enter the right-swipe Keep state during the drag');
await page.mouse.up(); await settle();
pass=await qa(); assert.ok(pass.pass?.history?.length,'Pass Around right swipe should create a vote history entry'); assert.equal(pass.pass.history.at(-1)?.keep,true,'Pass Around right swipe should record Keep'); assert.equal(pass.pass.voterIndex,1,'Pass Around right swipe should Keep for the current voter');
const passBox2=await page.locator('#passCard').boundingBox(); await page.mouse.move(passBox2.x+passBox2.width-55,passBox2.y+passBox2.height/2); await page.mouse.down(); await page.mouse.move(passBox2.x+18,passBox2.y+passBox2.height/2,{steps:4}); await page.mouse.up(); await settle();
assert.ok(await qa(), 'Pass Around should remain active after swipe');
await click('#passBack'); await settle(); pass=await qa(); assert.equal(pass.pass.poolIds.includes(firstPassId),true,'Pass Around Back should restore the exact choice');
await click('#passClose'); await settle(); assert.equal(await page.locator('#passSurface').count(),0,'Ending Pass Around should return to the normal decision deck');

await click('#foodBackTop'); await settle();
await click('#restStart'); await settle();
await page.screenshot({path:path.join(root,'qa-artifacts','restaurant-start-393.png'),fullPage:true});
await page.locator('#address').fill('123');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:first-child'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants')); assert.equal((await page.locator('#locationSourceLabel').innerText()).toLowerCase(),'using selected address','Selected address should expose its location source');
assert.equal(await page.locator('#address').inputValue(),'123 Main St, Clarksville, TN 37040','address suggestion should populate the selected address');
let locState=await qa(); assert.equal(locState.location?.lat,36.5298,'selected suggestion should set exact coordinates');
await page.locator('#address').fill('456');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:nth-child(2)'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
locState=await qa(); assert.equal(locState.location?.lat,36.5304,'a later address selection should replace the previous location');
await click('#find'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
s=await qa(); assert.equal(s.allRestaurantIds.length,7,'combined restaurant pool should contain restaurant + fast food');
await click('#restaurantMenu'); await settle();
await click('#settings'); await settle();
await click('#appDiagnosis'); await settle();
assert.equal(await visible('diagnosisModal'),true,'App Diagnosis should open from Restaurant Settings');
assert.match(await page.locator('#diagnosisModal').innerText(),/Restaurant duplicates/i,'Restaurant App Diagnosis should inspect the loaded restaurant pool');
assert.match(await page.locator('#diagnosisModal').innerText(),/Current restaurant pool/i,'Restaurant App Diagnosis should report the current pool');
assert.doesNotMatch(await page.locator('#diagnosisModal').innerText(),/miles is not defined/i,'Restaurant App Diagnosis should not throw on loaded restaurant results');
await page.locator('#diagnosisModal [data-close]').click(); await settle();
await page.locator('#settingsModal [data-close]').click(); await settle();
const hoursBefore=await qa(); assert.equal(await page.locator('#hoursToggle').innerText(),'Open/Unknown','Hours filter should start in Open/Unknown mode'); assert.equal(await page.locator('#hoursToggle').getAttribute('aria-pressed'),'true','Open/Unknown should be active');
const restaurantCountStyle=await page.locator('#restaurantCount').evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:s.borderTopWidth,padding:s.padding}});
assert.equal(restaurantCountStyle.background,'rgba(0, 0, 0, 0)','Restaurant count should not render as a colored pill');
assert.equal(restaurantCountStyle.border,'0px','Restaurant count should not render a capsule border');
assert.equal(restaurantCountStyle.padding,'0px','Restaurant count should not render capsule padding');
assert.equal((await page.locator('#restaurantCard').innerText()).includes('Closed Grill'),false,'Closed restaurant should not be shown in Open/Unknown mode');
await click('#hoursToggle'); await settle();
assert.equal(await page.locator('#hoursToggle').innerText(),'All','Hours filter should switch to All'); assert.equal(await page.locator('#hoursToggle').getAttribute('aria-pressed'),'false','All should be active');
assert.ok((await qa()).restaurantPool.includes('closed-1'),'Closed restaurant should return in All mode');
await click('#hoursToggle'); await settle();
assert.equal(await page.locator('#hoursToggle').innerText(),'Open/Unknown','Hours filter should toggle back to Open/Unknown');

// Restaurant card controls must all be real interactive elements.
await page.locator('#restDetails').click(); await settle();
assert.equal(await visible('detailsModal'),true,'Restaurant Details should open the Details sheet');
await page.locator('#detailsModal [data-close]').click(); await settle();
const restBeforeButtons=await qa();
const restFirstId=restBeforeButtons.restaurantPool[0];
await click('#restCut'); await settle();
let restAfterButtons=await qa(); assert.equal(restAfterButtons.restaurantPool.includes(restFirstId),false,'Restaurant Cut should remove the current card');
await click('#restBack'); await settle();
restAfterButtons=await qa(); assert.equal(restAfterButtons.restaurantPool.includes(restFirstId),true,'Restaurant Back should restore the current card');
const restKeepCount=(await qa()).restaurantPool.length; await click('#restMaybe'); await settle();
restAfterButtons=await qa(); assert.equal(restAfterButtons.restaurantActions.at(-1)?.type,'maybe','Restaurant Maybe should record a Maybe action'); assert.equal(restAfterButtons.restaurantPool.length,restKeepCount,'Restaurant Maybe/Keep should leave the count unchanged');
assert.equal(restAfterButtons.restaurantPool.includes(restFirstId),false,'Restaurant Maybe should move the current card into the recycle queue for this pass');
while(!restAfterButtons.restaurantMaybeRound && restAfterButtons.restaurantPool.length>0){ await click('#restCut'); await settle(); restAfterButtons=await qa(); }
assert.equal(restAfterButtons.restaurantMaybeRound,true,'Restaurant Maybe choices should recycle into a second narrowing pass');
assert.equal(restAfterButtons.restaurantPool.some(x=>x===restFirstId),true,'The kept restaurant should return when the first pass is exhausted');
await click('#restBack'); await settle();
restAfterButtons=await qa(); assert.equal(restAfterButtons.restaurantMaybeRound,true,'Back from a second-pass Cut should preserve the recycle round');
await click('#restaurantBackTop'); await settle(); await click('#restStart'); await settle();
assert.equal((await qa()).restaurantMaybeRound,false,'Starting a new restaurant round should reset the Maybe recycle cycle');

await click('[data-rest-quick="Fast Food"]'); await settle();
s=await qa(); assert.equal(s.restaurantPool.includes('mcd-1'),false); assert.equal(s.restaurantPool.includes('taco-1'),false); assert.equal(s.restaurantPool.includes('waffle-1'),true);
await click('[data-rest-quick="Fast Food"]'); await settle();
await click('[data-rest-quick="Potato"]'); await settle();
s=await qa(); assert.equal(s.restaurantPool.includes('mcd-1'),false,'Potato Quick Cut should remove fries-bearing restaurants'); assert.equal(s.restaurantPool.includes('ital-1'),true,'Potato Quick Cut should not remove unrelated restaurants');
await click('[data-rest-quick="Potato"]'); await settle();

await click('#restaurantSearch'); await settle();
await page.locator('#restaurantQuery').fill('Pasta');
await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['ital-1'],'Restaurant Search should filter current results');
await page.locator('#restaurantQuery').fill(''); await settle();

const currentRestaurantImg=await page.locator('#restaurantCard img').getAttribute('src');
assert.ok(await page.locator('#restaurantCard .card-phone').count()>0,'Restaurant card should show phone number when supplied');
assert.equal(await page.locator('#restaurantCard .card-phone').getAttribute('href'),'tel:+19315550101','Restaurant phone should be a tappable tel link');
assert.equal(await page.locator('#restaurantCard .card-card-action[href^="https://mcdonalds.com"]').count(),1,'Restaurant card should expose the supplied restaurant website directly');
assert.equal(await page.locator('#restaurantCard #restDetails').count(),1,'Restaurant card should expose a labeled Details action');
assert.ok(await page.locator('#restaurantCard .card-card-action').count()>=1,'Restaurant card should show card actions');
assert.equal(await page.locator('#restaurantCard .website-action').innerText(),'Website ↗','Restaurant Website action should be professional');
assert.equal(await page.locator('#restDetails').innerText(),'ⓘ','Restaurant Details action should use an info symbol');
assert.equal(await page.locator('#restaurantPassAround').count(),1,'Restaurant Pass Around should remain a single compact control');
assert.ok(currentRestaurantImg && /^https?:\/\//.test(currentRestaurantImg),'Restaurant card should always use a real photo URL');
assert.notEqual(currentRestaurantImg,'','Restaurant card photo URL must not be empty');
assert.equal(await page.locator('#restQuick [data-rest-quick]').count(),12,'Restaurant should have 12 Quick Cuts');
assert.equal(await page.locator('[data-rest-quick] .quick-chip-photo').count(),12,'Every Restaurant Quick Cut should render a photo element');
assert.equal((await page.locator('[data-rest-quick] .quick-chip-photo').evaluateAll(imgs=>imgs.map(x=>x.getAttribute('src')))).every(Boolean),true,'Every Restaurant Quick Cut should have a photo source');
assert.equal(await page.locator('#hoursToggle').innerText(),'Open/Unknown');
await click('#hoursToggle'); await settle(); s=await qa(); assert.equal(await page.locator('#hoursToggle').innerText(),'All'); assert.equal(s.restaurantPool.includes('closed-1'),true,'All should include open, unknown, and closed restaurants');
await click('#hoursToggle'); await settle(); s=await qa(); assert.equal(await page.locator('#hoursToggle').innerText(),'Open/Unknown'); assert.equal(s.restaurantPool.includes('closed-1'),false,'Open/Unknown should exclude explicitly closed restaurants');

const restBefore=s.restaurantPool.length;
await click('#restCut'); await settle(); let restAfter=await qa(); assert.equal(restAfter.restaurantPool.length,restBefore-1);
const restCutId=restAfter.restaurantActions.at(-1).id;
await click('#restBack'); await settle(); s=await qa(); assert.equal(s.restaurantPool.includes(restCutId),true);

const restaurantCard=page.locator('#restaurantCard');
if(!(await restaurantCard.count())) throw new Error('Restaurant card missing for right swipe QA');
assert.equal(await visible('restaurantNextCard'),true,'Restaurant should show the next Tinder card behind the current card');
await restaurantCard.evaluate(el=>{
  el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,clientX:100}));
  el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7,clientX:300}));
});
await settle();
s=await qa(); assert.equal(s.restaurantActions.at(-1)?.type,'maybe','Restaurant right swipe should Maybe');
await click('#restBack'); await settle();
s=await qa(); assert.equal(s.restaurantActions.length,0,'Restaurant Back should undo Maybe swipe');

if(!(await page.locator('#restaurantQuery').isVisible())) { await page.locator('#restaurantSearch').click(); await settle(); }
await page.locator('#restaurantQuery').fill("McDonald's"); await settle();
assert.equal((await page.locator('#restStage').innerText()).includes('Big Mac · Fries'),true,'restaurant card should show provider-supplied common menu items');
await page.locator('#restDetails').click(); await settle(); assert.equal(await visible('detailsModal'),true,'Restaurant Details should open the Details sheet'); assert.match(await page.locator('#detailsModal').innerText(),/COMMON MENU ITEMS/i,'Restaurant Details should show common menu items when supplied'); assert.equal(await page.locator('#detailsModal #detailWeb').count(),1,'Restaurant Details should expose the Website/Google action'); await page.locator('#detailsModal #detailWeb').click(); await settle(); await page.locator('#detailsModal [data-close]').click(); await settle();
const directWebsite=await page.locator('#restaurantCard .website-action[aria-label="Open restaurant website"]').getAttribute('href'); assert.match(directWebsite||'',/^https:\/\/mcdonalds\.com/,'Restaurant Website action should use the provider website when supplied');
if(!(await page.locator('#restaurantQuery').isVisible())) { await page.locator('#restaurantSearch').click(); await settle(); }
await page.locator('#restaurantQuery').fill('Asian Garden'); await settle(); const fallbackHref=await page.locator('#restaurantCard .website-action').getAttribute('href'); assert.match(fallbackHref||'',/google\.com\/search\?q=/,'Restaurant Website action should fall back to Google search when no website is supplied');
await page.locator('#restaurantQuery').fill(''); await settle();

await click('#restHide'); await settle(); assert.equal(await visible('appConfirmModal'),true,'Restaurant Hide should use the branded confirmation modal'); assert.match(await page.locator('#appConfirmModal').innerText(),/Hide this restaurant/i); await click('#appConfirmOk'); await settle(); s=await qa(); console.log('Restaurant hide QA state',JSON.stringify({hiddenRestaurants:s.hiddenRestaurants,restaurantPool:s.restaurantPool})); assert.equal(Object.keys(s.hiddenRestaurants).length>=1,true,'Hide confirmation should persist the restaurant in Settings');
await page.locator('#restaurantMenu').click({force:true});
await page.locator('#drawer:not(.hidden)').waitFor({state:'visible',timeout:3000});
await page.locator('#settings').click(); await settle();
const settingsDiag=await page.evaluate(()=>{const el=document.querySelector('#settingsModal'); return {count:document.querySelectorAll('#settingsModal').length,drawerHidden:document.querySelector('#drawer')?.classList.contains('hidden')??null,bgCount:document.querySelectorAll('#settingsModalBg').length,exists:!!el,text:el?.textContent||'',display:el?getComputedStyle(el).display:null,visibility:el?getComputedStyle(el).visibility:null,rect:el?el.getBoundingClientRect().toJSON():null};}); console.log('Settings diagnostic',JSON.stringify(settingsDiag));
assert.equal(await visible('settingsModal'),true,'Settings modal should open');
const settingsText=await page.locator('#settingsModal').innerText(); assert.match(settingsText,/Hidden Restaurants/i,'Settings should show Hidden Restaurants');
const restore=page.locator('#settingsModal [data-setting-rest]').first(); assert.equal(await restore.count(),1,'Settings should expose a restaurant Restore control');
await restore.click(); await settle(); s=await qa(); assert.equal(Object.keys(s.hiddenRestaurants).length,0,'Restaurant Restore should remove the hidden registry entry');

await page.locator('#settingsModal [data-close]').click(); await settle();
assert.equal(await page.locator('#settingsModal').count(),0,'Settings close should remove the modal');
assert.equal(await page.locator('#manageFoodsModal').count(),0,'Settings close should leave no stale Manage Foods modal');
assert.equal(await page.locator('#foodEditorModal').count(),0,'Settings close should leave no stale Food editor modal');
assert.equal(await page.locator('#settingsModal').count(),0,'Settings close should remove the modal');
assert.equal(await page.locator('#drawer').evaluate(el=>el.classList.contains('hidden')),true,'Settings close should leave the drawer closed');
await click('#restaurantBackTop'); await settle(); await click('#foodStart'); await settle();
await page.locator('#addFood').evaluate(el=>el.click()); await settle();
await click('[data-food-hide="popcorn"]'); await settle();
s=await qa(); assert.ok(s.hiddenFoods.includes('popcorn'),'Manage Foods Hide should persist the hidden food in state');
await page.locator('#manageFoodsModal .modal-head [data-close]').click(); await settle();
await page.locator('#foodMenu').click(); await settle(); await page.locator('#settings').click(); await settle();
assert.equal((await page.locator('#settingsModal').innerText()).toLowerCase().includes('popcorn'),true,'Settings should list hidden built-in food');
assert.equal(await page.locator('[data-setting-food-delete="popcorn"]').count(),1,'Settings should place Delete beside hidden-food Restore');
await page.locator('[data-setting-food-delete="popcorn"]').click(); await settle(); assert.equal(await visible('appConfirmModal'),true,'Settings food removal should use branded confirmation modal'); await click('#appConfirmOk'); await settle();
assert.equal((await page.locator('#settingsModal').innerText()).includes('popcorn'),false,'Settings Delete should remove the hidden food');
await page.locator('#settingsModal [data-close]').click(); await settle();
assert.equal(await page.locator('#manageFoodsModal').count(),0,'closing Settings should leave no stale Manage Foods modal');
assert.equal(await page.locator('#foodEditorModal').count(),0,'closing Settings should leave no stale Food editor modal');
await page.locator('#addFood').evaluate(el=>el.click()); await settle();
assert.equal(await visible('manageFoodsModal'),true,'Add Food manager should open');
await click('#openFoodEditor'); await settle();
assert.equal(await visible('foodEditorModal'),true,'Add Food editor should open');
assert.deepEqual(await page.locator('#editFoodCat option').allTextContents(),['American','Southern','Asian','Mexican','Pasta','Pork','Healthy','Breakfast','Soup/Stew','Greek','Snack','Potato'],'Food editor should expose all Quick Cut categories');
await page.locator('#editFoodName').fill('QA Special');
await page.locator('#editFoodRecipe').fill('Test recipe');
await page.locator('#editFoodFile').setInputFiles({
  name:'qa.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')
});
await page.waitForFunction(()=>document.querySelector('#editFoodPhoto')?.value.startsWith('data:image/'),'',{timeout:5000});
assert.ok((await page.locator('#editFoodPhoto').inputValue()).startsWith('data:image/'),'device photo should be converted to a stored image');
await page.locator('input[name="editQuickCut"][value="Pasta"]').check();
await page.locator('input[name="editQuickCut"][value="Healthy"]').check();
await click('#foodEditorForm button.cut'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.name==='QA Special'&&x.recipe==='Test recipe'&&x.image.startsWith('data:image/')),true,'custom Food photo/recipe should persist');
const customRow=s.custom.find(x=>x.id==='qa-special'); assert.equal(customRow.quickCuts.includes('Pasta'),true,'Custom food should support multiple Quick Cuts'); assert.equal(customRow.quickCuts.includes('Healthy'),true,'Custom food should support multiple Quick Cuts');
assert.equal(await visible('manageFoodsModal'),false,'saving a custom food from the Food deck should return to the swipe deck');
assert.equal(await page.locator('#foodEditorModal').count(),0,'saving a custom food should close the editor');
await page.locator('#foodMenu').click({force:true}); await settle();
await page.locator('#manage').click({force:true}); await settle();
assert.equal(await visible('manageFoodsModal'),true,'Manage Foods should expose the saved custom food for editing');
await click('[data-food-edit="qa-special"]'); await settle();
await page.locator('#editFoodRecipe').fill('Edited recipe');
await click('#foodEditorForm button.cut'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.name==='QA Special'&&x.recipe==='Edited recipe'),true,'custom Food edit should persist');
const storedCustomPhoto=await page.evaluate(()=>JSON.parse(localStorage.getItem('dinliminate.clean.cp1')||'{}').custom?.find(x=>x.id==='qa-special')?.image||'');
assert.equal(storedCustomPhoto,'idb:qa-special','Custom food photo should be stored as an IndexedDB reference in localStorage');

await page.locator('[data-food-delete="qa-special"]').focus(); await click('[data-food-delete="qa-special"]'); await settle(); assert.equal(await visible('appConfirmModal'),true,'Custom delete should use branded confirmation modal');
assert.equal(await page.locator('#appConfirmModal').getAttribute('role'),'dialog','Confirmation modal should expose dialog semantics');
assert.equal(await page.locator('#appConfirmModal').getAttribute('aria-modal'),'true','Confirmation modal should be modal');
assert.equal(await page.locator('#appConfirmCancel').evaluate(el=>el===document.activeElement),true,'Confirmation modal should default focus to Cancel');
await page.keyboard.press('Tab'); await settle(); assert.equal(await page.locator('#appConfirmOk').evaluate(el=>el===document.activeElement),true,'Confirmation modal focus should move through the primary action');
await page.keyboard.press('Escape'); await settle(); assert.equal(await visible('appConfirmModal'),false,'Escape should close the confirmation modal');
assert.equal(await page.locator('[data-food-delete="qa-special"]').evaluate(el=>el===document.activeElement),true,'Closing confirmation should restore focus to launcher');
await click('[data-food-delete="qa-special"]'); await settle(); assert.equal(await visible('appConfirmModal'),true,'Custom delete should use branded confirmation modal'); await click('#appConfirmOk'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.id==='qa-special'),false,'custom food delete should remove it permanently');

await click('[data-food-delete="popcorn"]'); await settle(); assert.equal(await visible('appConfirmModal'),true,'Built-in delete should use branded confirmation modal'); await click('#appConfirmOk'); await settle();
s=await qa(); assert.equal(s.foodPool.includes('popcorn'),false,'built-in delete should remove the food from choices');
assert.equal((await page.locator('[data-food-quick]').count())>0,true,'Quick Cuts should remain intact after food deletion');
await click('[data-food-restore-deleted="popcorn"]'); await settle();
s=await qa(); assert.equal(s.foodPool.includes('popcorn'),true,'deleted built-in restore should work');
assert.equal(await page.locator('#manageFoodsModal').count(),0,'Restoring a deleted built-in should close Manage Foods automatically');

while((await qa()).foodPool.length>1) { await click('#foodCut'); await settle(); }
assert.equal((await qa()).foodPool.length,1,'Food should be able to reach one remaining choice');
await click('#foodCut'); await settle();
assert.equal(await visible('winner'),true,'Cutting the last remaining choice should enter Hungry');
assert.match(await page.locator('#winName').innerText(),/HUNGRY/,'Hungry state should use the original HUNGRY label');
assert.equal((await page.locator('#winner').getAttribute('class')).includes('hidden'),false);
const bg=await page.locator('#winner').evaluate(el=>getComputedStyle(el).backgroundColor);
assert.equal(bg,'rgb(9, 9, 9)','winner should use the black Hungry/winner window');
assert.equal(await page.locator('#winImg').getAttribute('class'),'hungry-image','Hungry winner should use the dedicated black hungry artwork');
assert.ok((await page.locator('#winImg').getAttribute('src')||'').startsWith('data:image/svg'),'Hungry winner should use the built-in frown artwork');
await click('#restart'); await settle();
await click('#foodStart'); await settle();
while((await qa()).foodPool.length>1) { await click('#foodCut'); await settle(); }
assert.equal((await qa()).foodPool.length,1,'Food should reach one remaining choice');
const finalFoodId=(await qa()).foodPool[0];
const finalFoodBox=await page.locator('#foodCard').boundingBox(); if(!finalFoodBox) throw new Error('Final food card missing');
await page.mouse.move(finalFoodBox.x+55,finalFoodBox.y+finalFoodBox.height/2);
await page.mouse.down();
await page.mouse.move(finalFoodBox.x+finalFoodBox.width-18,finalFoodBox.y+finalFoodBox.height/2,{steps:4});
await page.mouse.up(); await settle();
assert.equal(await visible('winner'),true,'Right swipe on final food should open Winner');
const foodWin=await qa(); assert.equal(foodWin.winnerType,'food','Final food swipe should produce a food winner'); assert.equal(foodWin.winner?.id,finalFoodId,'Winner should be the final food'); assert.notEqual(await page.locator('#winName').innerText(),'HUNGRY ☹','Chosen food must not fall into Hungry state');
await click('#restart'); await settle();
await click('#menu'); await settle();
await click('#backToStart'); await settle(); assert.equal((await qa()).screen,'home','Back to Start should return to the front page');
await click('#menu'); await settle(); await click('#about'); await settle();
assert.equal(await visible('aboutModal'),true,'About should open');
const aboutText=await page.locator('#aboutModal').innerText();
assert.match(aboutText,/CURRENT BUILD/);
assert.match(aboutText,/Version\s+1\.0/i);
assert.match(aboutText,/Build\s+117/i);
const expectedDate=await page.evaluate(()=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date()));
assert.ok(aboutText.includes(expectedDate),'About date should always reflect the current date');
assert.equal(await page.locator('#aboutModal .about-test').evaluate(el=>getComputedStyle(el).color),'rgb(191, 161, 107)','About current build label should be gold');
assert.equal(await page.locator('#drawer #privacy').count(),0,'Privacy should no longer be a top-level drawer item');
assert.equal(await page.locator('#privacyFromAbout').count(),1,'Privacy should live inside About');
await click('#privacyFromAbout'); await settle(); assert.equal(await visible('privacyModal'),true,'Privacy should open from About');
await page.locator('#privacyModal [data-close]').click(); await settle();
await page.locator('[data-close]').click(); await settle();
await click('#menu'); await settle(); await click('#settings'); await settle();
const settingsFoodText=await page.locator('#settingsModal').innerText(); assert.match(settingsFoodText,/Food Choices/i); assert.equal(await page.locator('#settingsModal h4').filter({hasText:'Deleted Foods'}).count(),0,'Hidden and deleted foods should share one Settings section'); await page.locator('#settingsModal [data-close]').click(); await settle();
await click('#iphoneHelp'); await settle(); assert.equal(await visible('iphoneModal'),true,'iPhone help should open'); await page.locator('[data-close]').click(); await settle();

// Restaurant final-choice right swipe must select the final restaurant, not enter Hungry.
await click('#restStart'); await settle();
await click('#locate'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants') || document.querySelector('#status')?.textContent.includes('restaurants found')); await settle();
assert.equal((await page.locator('#locationSourceLabel').innerText()).toLowerCase(),'using your location','Device location should be labeled as the source');
const deviceLoc=await qa(); assert.ok(Math.abs(Number(deviceLoc.location?.lat)-36.5304)<0.01,'Device latitude should be persisted');
assert.ok(Math.abs(Number(deviceLoc.location?.lon)+87.3601)<0.01,'Device longitude should be persisted');
await page.locator('#address').fill('123'); await page.waitForSelector('#suggestionsBox button',{state:'visible'}); await click('#suggestionsBox button:first-child'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
if ((await page.locator('#hoursToggle').innerText()) !== 'All') { await click('#hoursToggle'); await settle(); }
while ((await qa()).restaurantPool.length>1) { await click('#restCut'); await settle(); }
assert.equal((await qa()).restaurantPool.length,1,'Restaurant should reach one remaining choice before final swipe');
const finalRestaurantId=(await qa()).restaurantPool[0];
const finalRestBox=await page.locator('#restaurantCard').boundingBox(); if(!finalRestBox) throw new Error('Final restaurant card missing');
await page.mouse.move(finalRestBox.x+60,finalRestBox.y+finalRestBox.height/2);
await page.mouse.down();
await page.mouse.move(finalRestBox.x+finalRestBox.width-20,finalRestBox.y+finalRestBox.height/2,{steps:4});
await page.mouse.up(); await settle();
assert.equal(await visible('winner'),true,'Right swipe on final restaurant should open Winner');
await page.screenshot({path:path.join(root,'qa-artifacts','restaurant-winner-393.png'),fullPage:true});
const finalState=await qa(); assert.equal(finalState.winnerType,'restaurant','Final restaurant swipe should produce a restaurant winner'); assert.equal(finalState.winner?.id,finalRestaurantId,'Winner should be the final restaurant');
assert.equal(await page.locator('#celebration').isVisible(),false,'Restaurant winner should not show a celebration layer');

// History calendar X deletion must remove the saved entry, not just persist it behind a stale render.
await page.evaluate(() => {
  const now=new Date(), y=now.getFullYear(), m=now.getMonth()+1;
  const key=y+'-'+String(m).padStart(2,'0')+'-02';
  const key2=y+'-'+String(m).padStart(2,'0')+'-03';
  localStorage.setItem('dinliminate.clean.history', JSON.stringify([
    {id:'hist-test',date:key,type:'food',name:'Calendar Food Test',image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',category:'Healthy'},
    {id:'hist-test-2',date:key,type:'restaurant',name:'Calendar Same Day Restaurant',image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',category:'American'},
    {id:'hist-test-rest',date:key2,type:'restaurant',name:'Calendar Restaurant Test',image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',category:'American'}
  ]));
});
await click('#menu'); await settle(); await click('#history'); await settle();
assert.equal(await page.locator('[data-history-delete]').count(),2,'History calendar should show one X control per occupied date');
assert.equal(await page.locator('.cal-more').count(),1,'History calendar should show +1 when two decisions share a date');
assert.equal(await page.locator('.history-open').count(),3,'History list should retain every decision, including same-day entries');
const sameDayDelete=page.locator('[data-history-delete="hist-test"]');
assert.equal(await sameDayDelete.count(),1,'Same-day calendar entry should have an individual delete target');
await sameDayDelete.click(); await settle();
assert.equal(await page.locator('.cal-more').count(),0,'Deleting one same-day history entry should remove only that entry from the day');
assert.equal(await page.locator('.history-open').count(),2,'Deleting one same-day entry should leave the other history entries');
assert.equal(await page.locator('[data-history-delete]').count(),2,'The remaining same-day entry should still have a delete control');
const sameDayDelete2=page.locator('[data-history-delete="hist-test-2"]');
assert.equal(await sameDayDelete2.count(),1,'Second same-day entry should become the calendar item after the first is deleted');
await sameDayDelete2.click(); await settle();
assert.equal(await page.locator('[data-history-delete]').count(),1,'Deleting the second same-day entry should leave the other date');
assert.equal(await page.locator('.history-open').count(),1,'Only the unrelated history entry should remain');
await page.locator('#historyClearAll').click(); await settle();
assert.equal(await visible('appConfirmModal'),true,'Clear all history should use branded confirmation');
await click('#appConfirmOk'); await settle();
assert.equal(await page.locator('[data-history-delete]').count(),0,'Clear all history should remove every calendar entry');
assert.equal(await page.locator('.history-open').count(),0,'Clear all history should remove every history list row');



/* Accessibility, touch targets, PWA and multi-width checks. */
await page.goto('http://127.0.0.1:4173/?qa=1&storage-failure=1'); await page.waitForLoadState('domcontentloaded'); await settle();
await page.evaluate(()=>{
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){ if(String(key).includes('dinliminate.clean.cp1')) throw new DOMException('Quota exceeded','QuotaExceededError'); return original.call(this,key,value); };
});
await click('#foodStart'); await settle();
assert.equal(await page.locator('#storageIndicator').isVisible(),true,'Storage failure should surface visibly');
assert.match(await page.locator('#storageIndicator').innerText(),/could not save|storage/i);
await page.evaluate(()=>{ window.location.reload(); });
await page.waitForLoadState('domcontentloaded'); await settle();
await page.goto('http://127.0.0.1:4173/?qa=1&timezone-test=1'); await page.waitForLoadState('domcontentloaded'); await settle();
const tz=await page.evaluate(()=>{
  const h=window.__DINLIMINATE_TEST__?.hourStatus;
  return {
    nyOpen:h({opening_hours:'Mo 08:00-17:00'},'2026-09-28T13:00:00Z','America/New_York'),
    laClosed:h({opening_hours:'Mo 08:00-17:00'},'2026-09-28T13:00:00Z','America/Los_Angeles'),
    overnightOpen:h({opening_hours:'Mo 22:00-02:00'},'2026-09-29T06:00:00Z','America/Chicago'),
    unknown:h({opening_hours:'Mo whenever'},'2026-09-28T13:00:00Z','America/New_York')
  };
});
assert.deepEqual(tz,{nyOpen:'open',laClosed:'closed',overnightOpen:'open',unknown:'unknown'},'timezone-aware Open/Closed regression should be deterministic');
await page.goto('http://127.0.0.1:4173/?qa=1&fresh=1'); await page.waitForLoadState('domcontentloaded'); await settle();
assert.ok(fs.existsSync(path.join(root,'sw.js')),'service worker file should exist');
assert.ok(fs.existsSync(path.join(root,'manifest.webmanifest')),'manifest should exist');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
assert.ok(manifest.icons.some(x=>x.sizes==='512x512'&&x.src==='./icon-512.png'),'512px manifest icon required');
assert.ok(manifest.icons.some(x=>x.sizes==='180x180'&&x.src==='./apple-touch-icon.png'),'180px iOS manifest icon required');
const pngSize=file=>{const b=fs.readFileSync(file); return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)}};
assert.deepEqual(pngSize(path.join(root,'icon-512.png')),{w:512,h:512},'512px icon file must actually be 512x512');
assert.deepEqual(pngSize(path.join(root,'apple-touch-icon.png')),{w:180,h:180},'iOS icon file must actually be 180x180');

await page.screenshot({path:path.join(root,'qa-artifacts','home-393.png'),fullPage:true});
await page.locator('#foodStart').click(); await settle();
await page.screenshot({path:path.join(root,'qa-artifacts','food-393.png'),fullPage:true});
await page.locator('#foodDetails').click(); await settle();
assert.equal(await page.locator('#detailsModal').getAttribute('role'),'dialog','Details modal should have dialog semantics');
assert.equal(await page.locator('#detailsModal').getAttribute('aria-modal'),'true','Details modal should be modal to assistive technology');
assert.equal(await page.locator('#detailsModal [data-close]').evaluate(el=>el===document.activeElement),true,'Details modal should receive focus when opened');
await page.keyboard.press('Tab'); await settle();
assert.equal(await page.locator('#detailsModal').isVisible(),true,'Details modal should remain open during keyboard navigation');
await page.locator('#detailsModal [data-close]').click(); await settle();

await page.locator('#foodCard').focus().catch(()=>{});
await page.locator('#foodMenu').click(); await settle(); await page.locator('#drawer').press('Escape').catch(()=>{}); await settle();
const touchSizes=await page.locator('#food .round-action, #food .bottom-util, #foodMenu').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {id:e.id,w:r.width,h:r.height}}));
assert.ok(touchSizes.filter(x=>x.w>0).every(x=>x.w>=40&&x.h>=40),'Primary Food controls should remain at least 40px tappable');

await page.evaluate(()=>{localStorage.removeItem('dinliminate.clean.cp1'); localStorage.removeItem('dinliminate.swipeHint.v1');});
await page.goto('http://127.0.0.1:4173/?qa=1&fresh=1'); await settle();
await page.evaluate(()=>localStorage.removeItem('dinliminate.swipeHint.v1'));
await page.locator('#foodStart').click(); await settle();
assert.equal(await page.locator('#swipeHint').isVisible(),true,'First Food start should show a subtle swipe hint');
assert.match(await page.locator('#swipeHint').innerText(),/Swipe left to Cut · right to Keep/);
await page.waitForTimeout(2800); assert.equal(await page.locator('#swipeHint').count(),0,'Swipe hint should disappear automatically');

const swReg=await page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()));
assert.equal(swReg,true,'Service worker should register on localhost');
const widths=[320,375,393,430];
for(const width of widths){
  await page.setViewportSize({width,height:852}); await page.goto('http://127.0.0.1:4173/?qa=1&fresh='+width); await page.waitForLoadState('domcontentloaded'); await settle();
  const g=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,scrollHeight:document.documentElement.scrollHeight,innerHeight:window.innerHeight}));
  assert.ok(g.scrollWidth<=g.clientWidth+1,'No horizontal overflow at '+width+'px');
  assert.ok(g.scrollHeight<=g.innerHeight+2,'Home should fit one viewport at '+width+'px');
}
await page.setViewportSize({width:393,height:852});

// System Restore should restore built-in defaults without deleting custom foods.
await page.evaluate(() => { localStorage.removeItem('dinliminate.clean.cp1'); });
await page.goto('http://127.0.0.1:4173/?qa=1&restore-test=1'); await page.waitForLoadState('domcontentloaded'); await settle();
await click('#foodStart'); await settle();
await click('#addFood'); await settle();
assert.equal(await visible('manageFoodsModal'),true,'Add Food should open Manage Foods');
await click('#openFoodEditor'); await settle();
assert.equal(await visible('foodEditorModal'),true,'Manage Foods Add Food should open the editor');
await page.locator('#editFoodName').fill('Restore Proof Food');
await click('#foodEditorForm button.cut'); await settle();
assert.equal((await qa()).custom.some(x=>x.name==='Restore Proof Food'),true,'custom food should exist before System Restore');
await click('#foodMenu'); await settle(); await click('#settings'); await settle();
await page.locator('#systemRestore').click(); await settle();
assert.equal(await visible('appConfirmModal'),true,'System Restore should use branded confirmation');
await click('#appConfirmOk'); await settle();
assert.equal(await visible('home'),true,'System Restore should return to Home');
await click('#foodStart'); await settle();
assert.equal((await qa()).foodPool.includes('popcorn'),true,'System Restore should restore deleted built-in defaults');
await click('#foodMenu'); await settle(); await click('#manage'); await settle();
assert.equal((await qa()).custom.some(x=>x.name==='Restore Proof Food'),true,'System Restore should preserve custom foods');
await page.reload({waitUntil:'domcontentloaded'}); await settle(); assert.equal((await qa()).custom.some(x=>x.name==='Restore Proof Food'),true,'System Restore should preserve custom foods after reload');
await page.locator('#foodMenu').click(); await settle(); await page.locator('#settings').click(); await settle();
await page.locator('#resetAppData').click(); await settle();
assert.equal(await visible('appConfirmModal'),true,'Reset App Data should use branded confirmation');
await click('#appConfirmOk'); await settle();
assert.equal(await visible('home'),true,'Reset App Data should return Home');
const wiped=await qa(); assert.equal(wiped.custom.length,0,'Reset App Data should wipe custom foods');

assert.equal(await page.locator('#manageFoodsModal').count(),0,'Reset App Data should close Manage Foods after wiping custom data');

assert.equal(pageErrors.length,0,'Browser page errors: '+pageErrors.join(' | '));
console.log('Browser console errors:',JSON.stringify(consoleErrors));
console.log('Browser HTTP failures:',JSON.stringify(badResponses));
assert.equal(pageErrors.length,0,'Browser page errors: '+pageErrors.join(' | '));
assert.equal(badResponses.length,0,'Browser HTTP 4xx/5xx resources: '+JSON.stringify(badResponses));
assert.equal(consoleErrors.length,0,'Browser console errors: '+consoleErrors.join(' | '));
await browser.close(); server.close();
console.log('Dinliminate clean browser smoke: PASS');
