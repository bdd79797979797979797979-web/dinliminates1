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
      {id:'mcd-1',name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',menuItems:['Big Mac','Fries'],distance:1.2,address:'100 Main St, Clarksville, TN',website:'https://mcdonalds.com',opening_hours:'Mo-Su 06:00-23:00'},
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
async function settle(){await page.waitForTimeout(150);}

await page.goto('http://127.0.0.1:4173/?qa=1');
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(100);
console.log('Food data runtime diagnostic',JSON.stringify({catalog:await page.evaluate(()=>Array.isArray(window.DINLIMINATE_FOODS)?window.DINLIMINATE_FOODS.length:-1),responses:dataResponses,requestFailures,pageErrors,consoleErrors}));
await assert.equal(await page.locator('#home h1').innerText(),'what sounds good tonight?');
const homeGeom=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,innerHeight:window.innerHeight}));
assert.equal(homeGeom.scrollWidth,homeGeom.clientWidth,'Home should not horizontally overflow on iPhone');

await assert.equal((await qa()).foodCatalog,31,'Food catalog should load before the round starts');
await click('#foodStart'); await settle();
assert.equal(await visible('foodNextCard'),true,'Food should show the next Tinder card behind the current card');
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
s=await qa(); assert.equal(s.foodPool.length,31,'Food Back should restore left swipe');

const foodBox2=await page.locator('#foodCard').boundingBox();
if(!foodBox2) throw new Error('Food card bounding box missing for right swipe QA');
await page.mouse.move(foodBox2.x+60,foodBox2.y+foodBox2.height/2);
await page.mouse.down();
await page.mouse.move(foodBox2.x+foodBox2.width-20,foodBox2.y+foodBox2.height/2,{steps:4});
await page.mouse.up();
await settle();
s=await qa(); assert.equal(s.foodActions.at(-1)?.type,'maybe','Food right swipe should Maybe');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodPool.length,31,'Food Back should restore right swipe');
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

await page.evaluate(()=>{ Math.random=()=>0.24; });
await click('#randomOne'); await settle();
s=await qa(); assert.equal(s.foodActions.length>=1,true,'Random Cut One should use the same action history');
assert.equal(s.foodPool.includes('wings'),true,'cutting Chicken Tenders must not remove Chicken Wings');
assert.equal(s.foodPool.includes('chicken-dumplings'),true,'cutting Chicken Tenders must not remove Chicken & Dumplings');
await click('#foodBack'); await settle();

await click('#restart'); await settle();
await click('#foodStart'); await settle();

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
await click('#suggestionsBox button:first-child'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
assert.equal(await page.locator('#address').inputValue(),'123 Main St, Clarksville, TN 37040','address suggestion should populate the selected address');
let locState=await qa(); assert.equal(locState.location?.lat,36.5298,'selected suggestion should set exact coordinates');
await page.locator('#address').fill('456');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:nth-child(2)'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
locState=await qa(); assert.equal(locState.location?.lat,36.5304,'a later address selection should replace the previous location');
await click('#find'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('7 restaurants'));
s=await qa(); assert.equal(s.allRestaurantIds.length,7,'combined restaurant pool should contain restaurant + fast food');

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

await click('#hoursToggle'); await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['closed-1'],'Closed mode should isolate explicit closed results');
await click('#hoursToggle'); await settle(); s=await qa(); assert.equal(s.restaurantPool.includes('closed-1'),false);

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

await assert.ok((await page.locator('#restStage').innerText()).includes('Common'),'restaurant card should show provider-supplied common menu items');
await click('#restDetails'); await settle(); assert.equal(await visible('detailsModal'),true,'Restaurant Details should open'); assert.equal((await page.locator('#detailsModal').innerText()).includes('Common menu items'),true,'Restaurant Details should show common menu items when supplied'); await page.locator('#detailDone').click(); await settle();

const hideDialog=page.waitForEvent('dialog'); const hideClick=click('#restHide'); const dlg=await hideDialog; assert.equal(dlg.type(),'confirm','Restaurant Hide should ask for confirmation'); await dlg.accept(); await hideClick; await settle(); s=await qa(); console.log('Restaurant hide QA state',JSON.stringify({hiddenRestaurants:s.hiddenRestaurants,restaurantPool:s.restaurantPool})); assert.equal(Object.keys(s.hiddenRestaurants).length>=1,true,'Hide confirmation should persist the restaurant in Settings');
await page.locator('#menu').click({force:true});
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
await click('#restaurant [data-home]'); await settle(); await click('#foodStart'); await settle();
await page.locator('#addFood').evaluate(el=>el.click()); await settle();
await click('[data-food-hide="popcorn"]'); await settle();
s=await qa(); assert.ok(s.hiddenFoods.includes('popcorn'),'Manage Foods Hide should persist the hidden food in state');
await page.locator('#manageFoodsModal [data-close]').click(); await settle();
await page.locator('#menu').click(); await settle(); await page.locator('#settings').click(); await settle();
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
await page.locator('#menu').click({force:true}); await settle();
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

while((await qa()).foodPool.length>1) { await click('#foodCut'); await settle(); }
assert.equal(await visible('winner'),true,'Food elimination should produce winner');
const bg=await page.locator('#winner').evaluate(el=>getComputedStyle(el).backgroundColor);
assert.equal(bg,'rgb(9, 9, 9)','winner should use the black winner window');
await click('#details'); await settle(); assert.equal(await visible('detailsModal'),true,'Winner Details should open'); assert.match(await page.locator('#detailsModal').innerText(),/Recipe \/ notes/i,'Built-in food Details should include recipe notes'); await page.locator('#detailDone').click(); await settle();

await click('#restart'); await settle();
await click('#menu'); await settle(); await click('#about'); await settle(); assert.equal(await visible('aboutModal'),true,'About should open'); await page.locator('[data-close]').click(); await settle();
await click('#iphoneHelp'); await settle(); assert.equal(await visible('iphoneModal'),true,'iPhone help should open');

assert.equal(pageErrors.length,0,'Browser page errors: '+pageErrors.join(' | '));
assert.equal(consoleErrors.length,0,'Browser console errors: '+consoleErrors.join(' | '));
await browser.close(); server.close();
console.log('Dinliminate clean browser smoke: PASS');
