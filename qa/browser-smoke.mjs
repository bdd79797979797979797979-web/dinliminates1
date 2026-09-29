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
      {id:'mcd-1',name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',menuItems:['Big Mac','Fries'],distance:1.2,address:'100 Main St, Clarksville, TN',website:'https://mcdonalds.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85'},
      {id:'waffle-1',name:'Waffle House',category:'American',fastFood:false,cuisine:'breakfast',distance:2.1,address:'200 Riverside Dr, Clarksville, TN',website:'https://wafflehouse.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85'},
      {id:'taco-1',name:'Taco Bell',category:'Fast Food',fastFood:true,cuisine:'mexican',distance:3.4,address:'300 Madison St, Clarksville, TN',website:'https://tacobell.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85'},
      {id:'ital-1',name:'Pasta House',category:'Italian',fastFood:false,cuisine:'italian',distance:4.2,address:'400 College St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85'},
      {id:'southern-1',name:'Southern Table',category:'Southern',fastFood:false,cuisine:'southern',distance:5.1,address:'500 Main St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'},
      {id:'asian-1',name:'Asian Garden',category:'Asian',fastFood:false,cuisine:'asian',distance:5.8,address:'600 Madison St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',photo:'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=85'},
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

await assert.equal((await qa()).foodCatalog,62,'Restored 62-food catalog should load before the round starts');
await click('#foodStart'); await settle();
assert.equal(await visible('foodNextCard'),true,'Food should show the next Tinder card behind the current card');
assert.equal(await page.locator('[data-food-quick]').count(),12,'Food should have 12 Quick Cuts');
assert.equal((await page.locator('[data-food-quick]').evaluateAll(btns=>btns.map(b=>getComputedStyle(b).backgroundImage))).every(v=>v!=='none'&&v.includes('url(')),true,'Every Food Quick Cut should have its own photo');
const imageCatalog=await page.evaluate(()=>Object.fromEntries((window.DINLIMINATE_FOODS||[]).filter(x=>['popcorn','stir-fry'].includes(x.id)).map(x=>[x.id,x.image])));
assert.match(imageCatalog.popcorn||'',/pexels-photo-6422042\.jpeg/,'Popcorn should use a popcorn photo');
assert.match(imageCatalog['stir-fry']||'',/pexels-photo-4924603\.jpeg/,'Mexican Stir Fry should use an accurate Mexican stir-fry photo');
const foodGeom=await page.evaluate(()=>{const card=document.querySelector('#foodCard'),actions=document.querySelector('#foodCut')?.parentElement;return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,cardBottom:card?.getBoundingClientRect().bottom||0,actionsBottom:actions?.getBoundingClientRect().bottom||0,h:innerHeight}});
let s=await qa(); assert.equal(s.screen,'food'); assert.equal(s.foodPool.length,62,'expected restored food catalog');
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

await click('#foodMaybe'); await settle();
s=await qa(); assert.equal(s.maybe.length,1,'Maybe should move the current choice out');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.maybe.length,0,'Back should restore Maybe');

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
await click('#drawerClose'); await settle();
await page.locator('#foodDetails').click(); await settle();
assert.equal(await visible('detailsModal'),true,'Food Details should open the Details sheet');
assert.equal(await page.locator('#detailsModal').locator('text=Typical nutrition').count()>0,true,'Food Details should show typical nutrition');
assert.equal(await page.locator('#detailsModal').locator('text=Ingredients').count()>0,true,'Food Details should show ingredients');
assert.equal(await page.locator('#detailsModal #detailHide').count(),1,'Food Details should include Hide');
await page.locator('#detailsModal [data-close]').click(); await settle();


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

await click('#foodBackTop'); await settle();
await click('#restStart'); await settle();
await page.locator('#address').fill('123');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:first-child'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
assert.equal(await page.locator('#address').inputValue(),'123 Main St, Clarksville, TN 37040','address suggestion should populate the selected address');
let locState=await qa(); assert.equal(locState.location?.lat,36.5298,'selected suggestion should set exact coordinates');
await page.locator('#address').fill('456');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:nth-child(2)'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
locState=await qa(); assert.equal(locState.location?.lat,36.5304,'a later address selection should replace the previous location');
await click('#find'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
s=await qa(); assert.equal(s.allRestaurantIds.length,7,'combined restaurant pool should contain restaurant + fast food');

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
await click('#restMaybe'); await settle();
restAfterButtons=await qa(); assert.equal(restAfterButtons.restaurantActions.at(-1)?.type,'maybe','Restaurant Maybe should record a Maybe action');
assert.equal(restAfterButtons.restaurantPool.includes(restFirstId),false,'Restaurant Maybe should move the current card out');
await click('#restBack'); await settle();
restAfterButtons=await qa(); assert.equal(restAfterButtons.restaurantPool.includes(restFirstId),true,'Restaurant Back should restore Maybe');


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
assert.ok(currentRestaurantImg && /^https?:\/\//.test(currentRestaurantImg),'Restaurant card should always use a real photo URL');
assert.notEqual(currentRestaurantImg,'','Restaurant card photo URL must not be empty');
assert.equal(await page.locator('#restQuick [data-rest-quick]').count(),12,'Restaurant should have 12 Quick Cuts');
assert.equal((await page.locator('[data-rest-quick]').evaluateAll(btns=>btns.map(b=>getComputedStyle(b).backgroundImage))).every(v=>v!=='none'&&v.includes('url(')),true,'Every Restaurant Quick Cut should have its own photo');
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
await page.locator('#restDetails').click(); await settle(); assert.equal(await visible('detailsModal'),true,'Restaurant Details should open the Details sheet'); console.log('Restaurant Details modal debug',JSON.stringify({text:await page.locator('#detailsModal').innerText(),qa:await qa()})); assert.match(await page.locator('#detailsModal').innerText(),/COMMON MENU ITEMS/i,'Restaurant Details should show common menu items when supplied'); assert.equal((await page.locator('#detailsModal').innerText()).includes('Big Mac'),true,'Restaurant Details should show the supplied menu items'); await page.locator('#detailsModal [data-close]').click(); await settle();
await page.locator('#restaurantQuery').fill(''); await settle();

const hideDialog=page.waitForEvent('dialog'); const hideClick=click('#restHide'); const dlg=await hideDialog; assert.equal(dlg.type(),'confirm','Restaurant Hide should ask for confirmation'); await dlg.accept(); await hideClick; await settle(); s=await qa(); console.log('Restaurant hide QA state',JSON.stringify({hiddenRestaurants:s.hiddenRestaurants,restaurantPool:s.restaurantPool})); assert.equal(Object.keys(s.hiddenRestaurants).length>=1,true,'Hide confirmation should persist the restaurant in Settings');
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
const settingsDeleteDialog=page.waitForEvent('dialog'); const settingsDeleteClick=page.locator('[data-setting-food-delete="popcorn"]').click(); const settingsDeleteDlg=await settingsDeleteDialog; assert.equal(settingsDeleteDlg.type(),'confirm'); await settingsDeleteDlg.accept(); await settingsDeleteClick; await settle();
assert.equal((await page.locator('#settingsModal').innerText()).includes('popcorn'),false,'Settings Delete should remove the hidden food');
await page.locator('#settingsModal [data-close]').click(); await settle();
assert.equal(await page.locator('#manageFoodsModal').count(),0,'closing Settings should leave no stale Manage Foods modal');
assert.equal(await page.locator('#foodEditorModal').count(),0,'closing Settings should leave no stale Food editor modal');
await page.locator('#addFood').evaluate(el=>el.click()); await settle();
assert.equal(await visible('manageFoodsModal'),true,'Add Food manager should open');
await click('#openFoodEditor'); await settle();
assert.equal(await visible('foodEditorModal'),true,'Add Food editor should open');
assert.deepEqual(await page.locator('#editFoodCat option').allTextContents(),['American','Southern','Asian','Mexican','Pasta','Pork','Healthy','Breakfast','Soup','Greek','Snack','Potato'],'Food editor should expose all Quick Cut categories');
await page.locator('#editFoodName').fill('QA Special');
await page.locator('#editFoodRecipe').fill('Test recipe');
await page.locator('#editFoodFile').setInputFiles({
  name:'qa.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')
});
await page.waitForFunction(()=>document.querySelector('#editFoodPhoto')?.value.startsWith('data:image/'),'',{timeout:5000});
assert.ok((await page.locator('#editFoodPhoto').inputValue()).startsWith('data:image/'),'device photo should be converted to a stored image');
await click('#foodEditorForm button.cut'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.name==='QA Special'&&x.recipe==='Test recipe'&&x.image.startsWith('data:image/')),true,'custom Food photo/recipe should persist');
assert.equal(await visible('manageFoodsModal'),false,'saving a custom food from the Food deck should return to the swipe deck');
assert.equal(await page.locator('#foodEditorModal').count(),0,'saving a custom food should close the editor');
await page.locator('#foodMenu').click({force:true}); await settle();
await page.locator('#manage').click({force:true}); await settle();
assert.equal(await visible('manageFoodsModal'),true,'Manage Foods should expose the saved custom food for editing');
await click('[data-food-edit="qa-special"]'); await settle();
await page.locator('#editFoodRecipe').fill('Edited recipe');
await click('#foodEditorForm button.cut'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.name==='QA Special'&&x.recipe==='Edited recipe'),true,'custom Food edit should persist');

const deleteDialog=page.waitForEvent('dialog'); const deleteClick=click('[data-food-delete="qa-special"]'); const deleteDlg=await deleteDialog; assert.equal(deleteDlg.type(),'confirm','custom delete should confirm'); await deleteDlg.accept(); await deleteClick; await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.id==='qa-special'),false,'custom food delete should remove it permanently');

const builtInDialog=page.waitForEvent('dialog'); const builtInClick=click('[data-food-delete="popcorn"]'); const builtInDlg=await builtInDialog; assert.equal(builtInDlg.type(),'confirm'); await builtInDlg.accept(); await builtInClick; await settle();
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
assert.equal((await qa()).foodPool.length,1);
await click('#foodCut'); await settle(); assert.equal(await visible('winner'),true);
await click('#restart'); await settle();
await click('#menu'); await settle();
await click('#backToStart'); await settle(); assert.equal((await qa()).screen,'home','Back to Start should return to the front page');
await click('#menu'); await settle(); await click('#about'); await settle();
assert.equal(await visible('aboutModal'),true,'About should open');
const aboutText=await page.locator('#aboutModal').innerText();
assert.match(aboutText,/TEST BUILD/);
assert.match(aboutText,/Version\s+1\.0/i);
assert.match(aboutText,/Build\s+112/i);
const expectedDate=await page.evaluate(()=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date()));
assert.ok(aboutText.includes(expectedDate),'About date should always reflect the current date');
assert.equal(await page.locator('#aboutModal .about-test').count(),0,'TEST BUILD label should not be shown in About');
assert.equal(await page.locator('#aboutModal .about-credit').innerText(),'Made by Brian Dunn for Devonda Dunn','About should show the requested attribution');
assert.equal(await page.locator('#aboutModal .about-credit').evaluate(el=>getComputedStyle(el).color),'rgb(191, 161, 107)','About attribution should be gold');
await page.locator('[data-close]').click(); await settle();
await click('#menu'); await settle(); await click('#settings'); await settle();
const settingsFoodText=await page.locator('#settingsModal').innerText(); assert.match(settingsFoodText,/Food Choices/i); assert.equal(await page.locator('#settingsModal h4').filter({hasText:'Deleted Foods'}).count(),0,'Hidden and deleted foods should share one Settings section'); await page.locator('#settingsModal [data-close]').click(); await settle();
await click('#iphoneHelp'); await settle(); assert.equal(await visible('iphoneModal'),true,'iPhone help should open'); await page.locator('[data-close]').click(); await settle();

// Restaurant final-choice right swipe must select the final restaurant, not enter Hungry.
await click('#restStart'); await settle();
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
const finalState=await qa(); assert.equal(finalState.winnerType,'restaurant','Final restaurant swipe should produce a restaurant winner'); assert.equal(finalState.winner?.id,finalRestaurantId,'Winner should be the final restaurant');

// History calendar X deletion must remove the saved entry, not just persist it behind a stale render.
await page.evaluate(() => {
  const now=new Date(), y=now.getFullYear(), m=now.getMonth()+1;
  const key=y+'-'+String(m).padStart(2,'0')+'-02';
  const key2=y+'-'+String(m).padStart(2,'0')+'-03'; localStorage.setItem('dinliminate.clean.history', JSON.stringify([{id:'hist-test',date:key,type:'food',name:'Calendar Food Test',image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',category:'Healthy'},{id:'hist-test-rest',date:key2,type:'restaurant',name:'Calendar Restaurant Test',image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',category:'American'}]));
});
await click('#menu'); await settle(); await click('#history'); await settle();
assert.equal(await page.locator('[data-history-delete]').count(),2,'History calendar should show an X delete control for food and restaurant entries');
await page.locator('[data-history-delete]').nth(0).click(); await settle();
assert.equal(await page.locator('[data-history-delete]').count(),1,'Calendar X should remove the first entry from the calendar');
assert.equal(await page.locator('.history-open').count(),1,'Calendar X should remove the corresponding food history row');
await page.locator('[data-history-delete]').first().click(); await settle();
assert.equal(await page.locator('[data-history-delete]').count(),0,'Calendar X should remove the restaurant entry too');
assert.equal(await page.locator('.history-open').count(),0,'Calendar X should remove the corresponding restaurant history row');


assert.equal(pageErrors.length,0,'Browser page errors: '+pageErrors.join(' | '));
assert.equal(consoleErrors.length,0,'Browser console errors: '+consoleErrors.join(' | '));
await browser.close(); server.close();
console.log('Dinliminate clean browser smoke: PASS');
