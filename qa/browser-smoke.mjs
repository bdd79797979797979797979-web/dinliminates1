import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};

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
const page = await context.newPage();

const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const pageErrors=[]; const consoleErrors=[]; const dataResponses=[]; const requestFailures=[];
page.on('pageerror', err => pageErrors.push(String(err)));
page.on('console', msg => { if(msg.type()==='error') consoleErrors.push(msg.text()); });
page.on('response', res => { if(res.url().includes('/data/foods.js')) dataResponses.push({status:res.status(),url:res.url()}); });
page.on('requestfailed', req => { if(req.url().includes('/data/foods.js')) requestFailures.push({url:req.url(),error:req.failure()?.errorText||'unknown'}); });
await page.route('**/*', async route => {
  const u = route.request().url();
  if (u.includes('/api/restaurants?mode=suggest')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,results:[
      {lat:36.5298,lon:-87.3588,display:'123 Main St, Clarksville, TN 37040'},
      {lat:36.5304,lon:-87.3601,display:'456 Market St, Clarksville, TN 37043'}
    ]})});
  }
  if (u.includes('/api/restaurants?mode=resolve')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,lat:36.5298,lon:-87.3588,display:'123 Main St, Clarksville, TN 37040'})});
  }
  if (u.includes('/api/restaurants?mode=reverse')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,display:'Current location (QA)'})});
  }
  if (u.includes('/api/restaurants?mode=search')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'qa',radiusMiles:10,total:7,fastFoodCount:2,results:[
      {id:'mcd-1',name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',distance:1.2,address:'100 Main St, Clarksville, TN',website:'https://mcdonalds.com',opening_hours:'Mo-Su 06:00-23:00'},
      {id:'waffle-1',name:'Waffle House',category:'American',fastFood:false,cuisine:'breakfast',distance:2.1,address:'200 Riverside Dr, Clarksville, TN',website:'https://wafflehouse.com',opening_hours:'24/7'},
      {id:'taco-1',name:'Taco Bell',category:'Fast Food',fastFood:true,cuisine:'mexican',distance:3.4,address:'300 Madison St, Clarksville, TN',website:'https://tacobell.com',opening_hours:'Mo-Su 07:00-01:00'},
      {id:'ital-1',name:'Pasta House',category:'Italian',fastFood:false,cuisine:'italian',distance:4.2,address:'400 College St, Clarksville, TN',website:'https://example.com',opening_hours:'Mo-Su 11:00-22:00'},
      {id:'southern-1',name:'Southern Table',category:'Southern',fastFood:false,cuisine:'southern',distance:5.1,address:'500 Main St, Clarksville, TN',website:'https://example.com',opening_hours:'Mo-Su 11:00-21:00'},
      {id:'asian-1',name:'Asian Garden',category:'Asian',fastFood:false,cuisine:'asian',distance:5.8,address:'600 Madison St, Clarksville, TN',website:'https://example.com',opening_hours:'Mo-Su 11:00-22:00'},
      {id:'closed-1',name:'Closed Grill',category:'American',fastFood:false,cuisine:'american',distance:6.2,address:'700 Main St, Clarksville, TN',website:'https://example.com',opening_hours:'closed'}
    ]})});
  }
  if (u.startsWith('https://images.unsplash.com/')) {
    return route.fulfill({status:200,contentType:'image/png',body:png1x1});
  }
  return route.continue();
});

function qa(){ return page.evaluate(()=>window.__DINLIMINATE_QA__?.snapshot()); }
async function visible(id){return page.locator('#'+id).isVisible();}
async function click(sel){await page.locator(sel).click();}
async function settle(){await page.waitForTimeout(80);}

await page.goto('http://127.0.0.1:4173/?qa=1');
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(100);
console.log('Food data runtime diagnostic',JSON.stringify({catalog:await page.evaluate(()=>Array.isArray(window.DINLIMINATE_FOODS)?window.DINLIMINATE_FOODS.length:-1),responses:dataResponses,requestFailures,pageErrors,consoleErrors}));
await assert.equal(await page.locator('#home h1').innerText(),'what sounds good tonight?');
const homeGeom=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,innerHeight:window.innerHeight}));
assert.equal(homeGeom.scrollWidth,homeGeom.clientWidth,'Home should not horizontally overflow on iPhone');

await assert.equal((await qa()).foodCatalog,31,'Food catalog should load before the round starts');
await click('#foodStart'); await settle();
const foodGeom=await page.evaluate(()=>{const card=document.querySelector('#foodCard'),actions=document.querySelector('#foodCut')?.parentElement;return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,cardBottom:card?.getBoundingClientRect().bottom||0,actionsBottom:actions?.getBoundingClientRect().bottom||0,h:innerHeight}});
let s=await qa(); assert.equal(s.screen,'food'); assert.equal(s.foodPool.length,31,'expected clean food catalog');
await click('[data-food-quick="Potato"]'); await settle();
s=await qa();
assert.equal(s.foodPool.length,30,'Potato should remove only Potato-primary choices');
assert.equal(s.foodPool.includes('potato-soup'),false);
assert.equal(s.foodPool.includes('steak-potato'),true);
assert.equal(s.foodPool.includes('burger-fries'),true);
await click('[data-food-quick="Potato"]'); await settle();
s=await qa(); assert.equal(s.foodPool.length,31,'Quick Cut should restore');
const beforeCut=s.foodPool.length;
await click('#foodCut'); await settle();
let afterCut=await qa(); assert.equal(afterCut.foodPool.length < beforeCut,true);
assert.equal(afterCut.foodActions.length,1);
const cutId=afterCut.foodActions[0].id;
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodPool.includes(cutId),true,'Food Back should restore exact cut choice');

await click('#foodMaybe'); await settle();
s=await qa(); assert.equal(s.maybe.length,1,'Maybe should move the current choice out');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.maybe.length,0,'Back should restore Maybe');

await click('#randomOne'); await settle();
s=await qa(); assert.equal(s.foodActions.length>=1,true,'Random Cut One should use the same action history');
await click('#foodBack'); await settle();

await click('#foodPassAround'); await settle();
assert.equal(await visible('passSetup'),true,'Pass Around setup should open');
await click('[data-pass-count="3"]'); await settle();
const names=page.locator('[data-pass-name]');
await names.nth(0).fill('Brian'); await names.nth(1).fill('Devona'); await names.nth(2).fill('Guest');
await click('#passBegin'); await settle();
assert.equal(await visible('passModal'),true,'Pass Around voting should open');
let pass=await qa(); const firstPassId=pass.pass.poolIds[0];
await click('#passCut'); await settle();
pass=await qa(); assert.equal(pass.pass.poolIds.includes(firstPassId),false);
await click('#passBack'); await settle();
pass=await qa(); assert.equal(pass.pass.poolIds.includes(firstPassId),true,'Pass Around Back should restore exact cut');
await click('#passEnd'); await settle();

await click('#food [data-home]'); await settle();
await click('#restStart'); await settle();
await page.locator('#address').fill('123');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:first-child'); await settle();
assert.equal(await page.locator('#address').inputValue(),'123 Main St, Clarksville, TN 37040');
await click('#find'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
s=await qa(); assert.equal(s.allRestaurantIds.length,7,'combined restaurant pool should contain restaurant + fast food');

await click('[data-rest-quick="Fast Food"]'); await settle();
s=await qa(); assert.equal(s.restaurantPool.includes('mcd-1'),false); assert.equal(s.restaurantPool.includes('taco-1'),false); assert.equal(s.restaurantPool.includes('waffle-1'),true);
await click('[data-rest-quick="Fast Food"]'); await settle();

await click('#restaurantSearch'); await settle();
await page.locator('#restaurantQuery').fill('Pasta');
await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['ital-1'],'Restaurant Search should filter current results');
await page.locator('#restaurantQuery').fill(''); await settle();

await click('#hoursToggle'); await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['closed-1'],'Closed mode should isolate explicit closed results');
await click('#hoursToggle'); await settle(); s=await qa(); assert.equal(s.restaurantPool.includes('closed-1'),false);

const restBefore=s.restaurantPool.length;
await click('#restCut'); await settle(); let restAfter=await qa(); assert.equal(restAfter.restaurantPool.length,restBefore-1);
const restCutId=restAfter.restaurantActions.at(-1).id;
await click('#restBack'); await settle(); s=await qa(); assert.equal(s.restaurantPool.includes(restCutId),true);

await click('#restDetails'); await settle(); assert.equal(await visible('detailsModal'),true,'Restaurant Details should open'); await page.locator('#detailDone').click(); await settle();

const hideDialog=page.waitForEvent('dialog'); const hideClick=click('#restHide'); const dlg=await hideDialog; assert.equal(dlg.type(),'confirm','Restaurant Hide should ask for confirmation'); await dlg.accept(); await hideClick; await settle(); s=await qa(); console.log('Restaurant hide QA state',JSON.stringify({hiddenRestaurants:s.hiddenRestaurants,restaurantPool:s.restaurantPool})); assert.equal(Object.keys(s.hiddenRestaurants).length>=1,true,'Hide confirmation should persist the restaurant in Settings');
await click('#menu'); await settle(); await click('#settings'); await settle();
assert.equal(await page.locator('#settingsModal').innerText().then(t=>t.includes('Hidden Restaurants')),true);
const restore=page.locator('[data-setting-rest]').first(); assert.equal(await restore.count(),1);
await restore.click(); await settle();

await click('#food [data-home]'); await settle(); await click('#foodStart'); await settle();
await click('#addFood'); await settle();
await page.locator('#newFoodName').fill('QA Special');
await page.locator('#newFoodPhoto').fill('https://example.com/qa.jpg');
await page.locator('#newFoodRecipe').fill('Test recipe');
await click('#foodAddForm button.cut'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.name==='QA Special'&&x.recipe==='Test recipe'&&x.image==='https://example.com/qa.jpg'),true,'custom Food photo/recipe should persist');

while((await qa()).foodPool.length>1) { await click('#foodCut'); await settle(); }
assert.equal(await visible('winner'),true,'Food elimination should produce winner');
const bg=await page.locator('#winner').evaluate(el=>getComputedStyle(el).backgroundColor);
assert.equal(bg,'rgb(9, 9, 9)','winner should use the black winner window');
await click('#details'); await settle(); assert.equal(await visible('detailsModal'),true,'Winner Details should open'); await page.locator('#detailDone').click(); await settle();

await click('#restart'); await settle();
await click('#menu'); await settle(); await click('#about'); await settle(); assert.equal(await visible('aboutModal'),true,'About should open'); await page.locator('[data-close]').click(); await settle();
await click('#iphoneHelp'); await settle(); assert.equal(await visible('iphoneModal'),true,'iPhone help should open');

assert.equal(pageErrors.length,0,'Browser page errors: '+pageErrors.join(' | '));
assert.equal(consoleErrors.length,0,'Browser console errors: '+consoleErrors.join(' | '));
await browser.close(); server.close();
console.log('Dinliminate clean browser smoke: PASS');
