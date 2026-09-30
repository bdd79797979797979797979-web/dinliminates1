import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseMeta = JSON.parse(fs.readFileSync(path.join(root,'release.json'),'utf8'));
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

let forceReverseFailure=false;
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
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,name:'Dinliminate',version:'1.0',build:String(releaseMeta.build),sourceBranch:releaseMeta.sourceBranch,commit:null,branch:releaseMeta.sourceBranch,environment:'test',expectedBranch:releaseMeta.sourceBranch})});
  }
  if (u.includes('/api/restaurant-search?mode=health')) {
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'qa',maxRadiusMiles:50,providers:['qa']})});
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
    if(forceReverseFailure) return route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({ok:false,message:'Reverse lookup unavailable in QA'})});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,display:'Current location (QA)'})});
  }
  if (u.includes('/api/restaurant-search?mode=search')) {
    const searchUrl=new URL(u);
    const radius=Number(searchUrl.searchParams.get('radius')||10);
    const allResults=[
      {id:'mcd-1',name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',menuItems:['Big Mac','Fries'],distance:1.2,address:'100 Main St, Clarksville, TN',website:'https://mcdonalds.com',phone:'(931) 555-0101',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85'},
      {id:'waffle-1',name:'Waffle House',category:'American',fastFood:false,cuisine:'breakfast',distance:2.1,address:'200 Riverside Dr, Clarksville, TN',website:'https://wafflehouse.com',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85'},
      {id:'burger-barn-1',name:'Burger Barn',category:'American',fastFood:false,cuisine:'burgers',menuItems:['Cheeseburger','Fries'],distance:2.8,address:'250 Riverside Dr, Clarksville, TN',website:'',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85'},
      {id:'taco-1',name:'Taco Bell',category:'Fast Food',fastFood:true,cuisine:'mexican',distance:3.4,address:'300 Madison St, Clarksville, TN',website:'https://tacobell.com',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85'},
      {id:'ital-1',name:'Pasta House',category:'Italian',fastFood:false,cuisine:'italian',distance:4.2,address:'400 College St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85'},
      {id:'southern-1',name:'Southern Table',category:'Southern',fastFood:false,cuisine:'southern',distance:5.1,address:'500 Main St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'},
      {id:'asian-1',name:'Asian Garden',category:'Asian',fastFood:false,cuisine:'asian',distance:5.8,address:'600 Madison St, Clarksville, TN',website:'',opening_hours:'',photo:'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=85'},
      {id:'closed-1',name:'Closed Grill',category:'American',fastFood:false,cuisine:'american',distance:6.2,address:'700 Main St, Clarksville, TN',website:'https://example.com',opening_hours:'24/7',openNow:false,photo:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'},
      {id:'heads-1',name:"Heads BBQ",category:'BBQ',fastFood:false,cuisine:'bbq',distance:6.3,address:'724 Sango Rd, Clarksville, TN 37043',website:'https://example.com',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'},
      {id:'robert-heads-duplicate',name:'Robert Heads BBQ',category:'BBQ',fastFood:false,cuisine:'bbq',distance:6.3,address:'724 Sango Road, Clarksville, TN 37043',website:'https://example.com',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'}
    ];
    const results=allResults.filter(x=>Number(x.distance)<=radius);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'qa',radiusMiles:radius,total:results.length,fastFoodCount:results.filter(x=>x.fastFood).length,timezone:'America/Chicago',results})});
  }
  if (u.includes('/api/image?url=')) {
    return route.fulfill({status:200,contentType:'image/jpeg',body:png1x1});
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
await assert.equal(await page.locator('#home h1').innerText(),'Dinner Decisions Simplified');
const hourContract=await page.evaluate(()=>{
  const t=window.__DINLIMINATE_TEST__;
  return {
    open:t?.hourStatus({openNow:true,opening_hours:'closed'},'','America/Chicago'),
    closed:t?.hourStatus({openNow:false,opening_hours:'24/7'},'','America/Chicago'),
    unknown:t?.hourStatus({opening_hours:''},'','America/Chicago')
  };
});
assert.equal(hourContract.open,'open','Provider openNow=true should win over conflicting opening-hours text');
assert.equal(hourContract.closed,'closed','Provider openNow=false should win over conflicting opening-hours text');
assert.equal(hourContract.unknown,'unknown','Missing hours should remain unknown');

const restaurantSearchContract=await page.evaluate(()=>{
 const t=window.__DINLIMINATE_TEST__;
 const mcd={name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',menuItems:['Big Mac']};
 const taco={name:'Taco Bell',category:'Fast Food',fastFood:true,cuisine:'mexican',menuItems:['Tacos']};
 const burger={name:'Burger Barn',category:'American',fastFood:false,cuisine:'burgers',menuItems:['Cheeseburger']};
 const waffle={name:'Waffle House',category:'American',fastFood:false,cuisine:'breakfast',menuItems:['Waffles']};
 return {
  mcdNormalized:t.normalizeRestaurantSearch("McDonald's"),
  mcdSearch:t.restaurantSearchTermMatches(mcd,'Mcdonalds',t.normalizeRestaurantSearch("McDonald's Fast Food burger")),
  burgerFastFood:t.restaurantSearchTermMatches(mcd,'burger',t.normalizeRestaurantSearch("McDonald's Fast Food burger Big Mac")),
  burgerDedicated:t.restaurantSearchTermMatches(burger,'burger',t.normalizeRestaurantSearch("Burger Barn American burgers cheeseburger")),
  burgerUnrelated:t.restaurantSearchTermMatches(waffle,'burger',t.normalizeRestaurantSearch("Waffle House American breakfast waffles")),
  mexicanCategory:t.restaurantSearchTermMatches(taco,'mexican',t.normalizeRestaurantSearch("Taco Bell Fast Food mexican tacos")),
  quickBurger:t.restaurantQuickMatches(burger,'Burgers'),
  quickPizza:t.restaurantQuickMatches({name:'Dominos Pizza',category:'Fast Food',fastFood:true,cuisine:'',menuItems:[]},'Pizza'),
  quickBreakfast:t.restaurantQuickMatches(waffle,'Breakfast')
 };
});
assert.equal(restaurantSearchContract.mcdNormalized,'mcdonalds','Restaurant search normalizer should remove apostrophes');
assert.equal(restaurantSearchContract.mcdSearch,true,'Mcdonalds should match McDonald\'s');
assert.equal(restaurantSearchContract.burgerFastFood,true,'Burger Search should match fast-food restaurants');
assert.equal(restaurantSearchContract.burgerDedicated,true,'Burger Search should match dedicated burger restaurants');
assert.equal(restaurantSearchContract.burgerUnrelated,false,'Burger Search should not match unrelated restaurants');
assert.equal(restaurantSearchContract.mexicanCategory,true,'Cuisine search should match Mexican restaurants');
assert.equal(restaurantSearchContract.quickBurger,true,'Burger Quick Cut should match burger restaurants');
assert.equal(restaurantSearchContract.quickPizza,true,'Pizza Quick Cut should match pizza chains');
assert.equal(restaurantSearchContract.quickBreakfast,true,'Breakfast Quick Cut should match breakfast restaurants');

const contactLinkGuards=await page.evaluate(()=>{
  const t=window.__DINLIMINATE_TEST__;
  return {
    appOrigin:t?.safeExternalUrl(location.origin),
    appBrand:t?.safeExternalUrl('https://diliminate.netlify.app/'),
    direct:t?.safeExternalUrl('https://example.com/restaurant'),
    appFallback:t?.restaurantWebsiteUrl({name:'QA Restaurant',address:'100 Main St, Clarksville, TN',website:location.origin}),
    mcdKnown:t?.restaurantWebsiteUrl({name:"McDonald's",address:'100 Main St, Clarksville, TN',website:''}),
    phone:t?.phoneHref('(931) 555-0101')
  };
});
assert.equal(contactLinkGuards.appOrigin,'','Restaurant Website must never point back to the current Dinliminate app');
assert.equal(contactLinkGuards.appBrand,'','Restaurant Website must reject a Dinliminate deployment host');
assert.equal(contactLinkGuards.direct,'https://example.com/restaurant','A real HTTPS restaurant website should remain a direct external link');
assert.match(contactLinkGuards.appFallback||'',/google\.com\/search\?q=/,'A Dinliminate/app URL must fall back to a Google restaurant website search');
assert.equal(contactLinkGuards.mcdKnown,'https://www.mcdonalds.com','Known national chain websites should be supplied even when provider metadata is missing');
assert.equal(contactLinkGuards.phone,'tel:+19315550101','Restaurant phone numbers should normalize to tappable tel links');
const homeGeom=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,clientWidth:document.documentElement.clientWidth,innerHeight:window.innerHeight}));
assert.equal(homeGeom.scrollWidth,homeGeom.clientWidth,'Home should not horizontally overflow on iPhone');
assert.ok(homeGeom.scrollHeight <= homeGeom.innerHeight + 2,'Home should fit one iPhone viewport without vertical scrolling');
assert.equal(await page.locator('#home .home-card-photo').count(),2,'Home should have exactly two photo-backed choices');
assert.equal(await page.locator('#iphoneHelp').innerText(),'How to add to your phone','Home install control should use the current label');
assert.ok(homeGeom.scrollHeight <= homeGeom.innerHeight + 2,'Home should fit one iPhone viewport without vertical scrolling');
assert.equal(await page.locator('#home .home-card-photo').count(),2,'Home should have one photo-backed Food choice and one photo-backed Restaurant choice');
assert.equal((await page.locator('#home .home-card-photo').evaluateAll(els=>els.map(e=>e.getAttribute('style')||''))).every(s=>s.includes('--home-photo')),true,'Both Home choices should have dedicated food/restaurant photos');
assert.equal((await page.locator('#home .home-card-photo').evaluateAll(els=>els.map(e=>e.getAttribute('style')||''))).every(s=>s.includes('/api/image?url=')),true,'Home image URLs should route through the Vercel image proxy');
assert.equal(await page.locator('#home #continue').count(),0,'Continue saved round should not appear on the home screen');
assert.equal(await page.locator('#home .made-by').count(),0,'Home attribution should not appear on the front page');
const homeHeading=await page.locator('#home h1').boundingBox();
assert.ok(homeHeading && homeHeading.x + homeHeading.width <= homeGeom.clientWidth + 1,'Home headline should fit fully inside the iPhone viewport');
assert.ok(homeHeading && homeHeading.y >= 0 && homeHeading.y + homeHeading.height <= homeGeom.innerHeight + 2,'Home headline should not be vertically cut off');

await assert.equal((await qa()).foodCatalog,116,'Restored 116-food catalog should load before the round starts');
await click('#foodStart'); await settle();
const enlargedFoodCard=await page.locator('#foodCard').boundingBox(); const foodViewport=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,scrollHeight:document.documentElement.scrollHeight,innerHeight:window.innerHeight})); assert.ok(enlargedFoodCard&&enlargedFoodCard.height>=540,'Food card should use the space freed by removing Random Cut One'); assert.equal(foodViewport.scrollWidth,foodViewport.clientWidth,'Food screen should not horizontally overflow on iPhone'); assert.ok(foodViewport.scrollHeight<=foodViewport.innerHeight+2,'Food screen should fit within one iPhone viewport');
const foodActionIds=await page.locator('#food .food-swipe-actions > button').evaluateAll(els=>els.map(x=>x.id)); assert.deepEqual(foodActionIds,['foodBack','foodCut','foodMaybe','foodHide','addFood'],'Food Add Food icon should sit directly to the right of Hide');
assert.equal(await page.locator('#food #addFood').evaluate(el=>el.classList.contains('round-add-food')),true,'Add Food should use the compact circular icon style');
assert.equal(await page.locator('#food #addFood').innerText(),'＋','Add Food should use a plus icon rather than a text button');
assert.equal(await visible('foodNextCard'),true,'Food should show the next Tinder card behind the current card');
assert.equal(await page.locator('#foodQuick [data-food-quick]').count(),11,'Food should have 11 Quick Cuts');
assert.deepEqual(await page.locator('#foodQuick [data-food-quick]').evaluateAll(els=>els.map(el=>el.innerText.trim())),['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Potato','Snack'],'Food Quick Cut order should follow the revised logical order');
assert.equal(await page.locator('#foodQuick [data-food-quick] .quick-chip-photo').count(),11,'Every Food Quick Cut should render a photo element');
const requestedFoods=await page.evaluate(()=>Object.fromEntries((window.DINLIMINATE_FOODS||[]).filter(x=>['lasagna','vegetable-lasagna','salisbury-steak','stuffed-peppers','health-shake','cheerios'].includes(x.id)).map(x=>[x.id,{name:x.name,quickCuts:x.quickCuts,image:x.image,detailsReady:!!x.recipe&&!!x.nutrition&&!!x.ingredients?.length}])));
assert.equal(requestedFoods.cheerios?.name,'Cereal','Cheerios should be renamed Cereal');
for(const [id,cuts] of Object.entries({lasagna:['Pasta'],'vegetable-lasagna':['Pasta','Healthy'],'salisbury-steak':['Southern','American'],'stuffed-peppers':['Healthy','American'],'health-shake':['Healthy']})){assert.ok(requestedFoods[id],id+' should exist');assert.ok(cuts.every(x=>requestedFoods[id].quickCuts.includes(x)),id+' Quick Cut mapping');assert.equal(String(requestedFoods[id].image||'').startsWith('http'),true,id+' should have an image');assert.equal(requestedFoods[id].detailsReady,true,id+' should have Details content');}
assert.equal((await page.evaluate(()=>window.DINLIMINATE_FOODS||[])).some(x=>x.id==='frozen'||/stouffer/i.test(x.name||'')),false,'Stouffer dinner must be absent');

assert.equal((await page.locator('[data-food-quick] .quick-chip-photo').evaluateAll(imgs=>imgs.map(x=>x.getAttribute('src')))).every(Boolean),true,'Every Food Quick Cut should have a photo source');
const imageCatalog=await page.evaluate(()=>Object.fromEntries((window.DINLIMINATE_FOODS||[]).filter(x=>['popcorn','stir-fry'].includes(x.id)).map(x=>[x.id,x.image])));
assert.match(imageCatalog.popcorn||'',/pexels-photo-6422042\.jpeg/,'Popcorn should use a popcorn photo');
assert.equal(await page.evaluate(()=>window.DINLIMINATE_FOODS.find(x=>x.id==='stir-fry')?.name),'Fajitas');
const foodGeom=await page.evaluate(()=>{const card=document.querySelector('#foodCard'),actions=document.querySelector('#foodCut')?.parentElement;return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,cardBottom:card?.getBoundingClientRect().bottom||0,actionsBottom:actions?.getBoundingClientRect().bottom||0,h:innerHeight}});
let s=await qa(); assert.equal(s.screen,'food'); assert.equal(s.foodPool.length,116,'expected restored food catalog');
const foodImageSources=await page.evaluate(()=>window.DINLIMINATE_FOODS.map(x=>({id:x.id,image:x.image})));
assert.equal(foodImageSources.length,116,'Food data should expose 116 image-backed choices');
assert.equal(foodImageSources.every(x=>typeof x.image==='string'&&x.image.length>0),true,'Every built-in food must have an image URL');
const refreshedImageChecks=await page.evaluate(()=>Object.fromEntries((window.DINLIMINATE_FOODS||[]).filter(x=>['tacos','stir-fry','meatloaf','buttermilk-cornbread','potato-soup','stuffed-peppers','stroganoff','health-shake'].includes(x.id)).map(x=>[x.id,x.image])));
const refreshedExpected={tacos:/14179985/, 'stir-fry':/31673757/, meatloaf:/2397401/, 'buttermilk-cornbread':/6525832/, 'potato-soup':/29653177/, 'stuffed-peppers':/goodnes\.com.*stouffers-hwe4pryaocyufr0fchw5/i, stroganoff:/20234576/, 'health-shake':/7974814/};
for(const [id,re] of Object.entries(refreshedExpected))assert.match(refreshedImageChecks[id]||'',re,id+' should use its refreshed image mapping');
const requestedCatalog=await page.evaluate(()=>Object.fromEntries((window.DINLIMINATE_FOODS||[]).filter(x=>['homemade-pizza','meatball-subs','sausage-peppers','buttermilk-cornbread','grilled-salmon','bbq-pulled-pork','pork-chops','pork-tenderloin','white-fish','mashed-potatoes','biscuits-gravy','stuffed-peppers','stroganoff'].includes(x.id)).map(x=>[x.id,{name:x.name,category:x.category,quickCuts:x.quickCuts,image:x.image}])));
assert.deepEqual(requestedCatalog['homemade-pizza'].quickCuts,['Italian'],'Pizza should be associated with Italian only');
assert.deepEqual(requestedCatalog['meatball-subs'].quickCuts,['Italian'],'Meatball Sub should be associated with Italian');
assert.deepEqual(requestedCatalog['sausage-peppers'].quickCuts,['Italian'],'Sausage & Peppers should be associated with Italian');
for(const id of ['spaghetti','pasta-alfredo','lasagna','chicken-parmesan']){
 const row=await page.evaluate(id=>window.DINLIMINATE_FOODS.find(x=>x.id===id),id);
 assert.deepEqual(row?.quickCuts,['Pasta','Italian'],id+' should be associated with Pasta + Italian');
}
const liver=await page.evaluate(()=>window.DINLIMINATE_FOODS.find(x=>x.id==='liver-and-onions'));
assert.deepEqual(liver?.quickCuts,['Southern','Healthy'],'Liver & Onions should be Southern + Healthy');
assert.deepEqual(requestedCatalog['pork-chops'].quickCuts,['Southern'],'Pork Chops should be associated with Southern');
assert.deepEqual(requestedCatalog['pork-tenderloin'].quickCuts,['Southern'],'Pork Tenderloin should be associated with Southern');
assert.deepEqual(requestedCatalog['white-fish'].quickCuts,['Healthy'],'White Fish should be associated with Healthy');
assert.deepEqual(requestedCatalog['biscuits-gravy'].quickCuts,['Breakfast'],'Biscuits & Gravy should be Breakfast');
assert.deepEqual(requestedCatalog['stuffed-peppers'].category,'American');
assert.equal(requestedCatalog['mashed-potatoes'].name,'Mashed Potatoes','Mashed Potatoes should not include gravy in its title');
assert.equal(Object.values(requestedCatalog).some(x=>x.quickCuts.includes('Pork')),false,'No Food Quick Cut should include Pork');

await click('[data-food-quick="Potato"]'); await settle();
s=await qa();
const fullPotatoMappedCount=await page.evaluate(()=>window.DINLIMINATE_FOODS.filter(x=>Array.isArray(x.quickCuts)&&x.quickCuts.includes('Potato')).length); assert.equal(s.foodPool.length,116-fullPotatoMappedCount,'Potato Quick Cut should remove exactly the foods explicitly mapped to Potato');
assert.equal(s.foodPool.includes('potato-soup'),true,'Potato Quick Cut must not remove Potato Soup because soup is its primary mapping');
assert.equal(s.foodPool.includes('steak-potato'),true);
assert.equal(s.foodPool.includes('burgers'),true,'Potato Quick Cut must not remove Burgers');
await click('[data-food-quick="Potato"]'); await settle();
s=await qa(); assert.equal(s.foodPool.length,116,'Quick Cut should restore');
await click('[data-food-quick="Pasta"]'); await settle();
s=await qa(); assert.ok(s.foodPool.length<116 && s.foodPool.length>0,'Pasta Quick Cut should leave an active food deck');
const pastaCard=await page.locator('#foodCard').boundingBox(); if(!pastaCard) throw new Error('Food card missing after Pasta Quick Cut');
await page.mouse.move(pastaCard.x+pastaCard.width/2,pastaCard.y+pastaCard.height/2); await page.mouse.down(); await page.mouse.move(pastaCard.x+60,pastaCard.y+pastaCard.height/2,{steps:5}); assert.equal(await page.locator('#foodCard').getAttribute('data-swipe'),'cut','Food swipe should still work after Pasta Quick Cut'); await page.mouse.up(); await settle();
s=await qa(); assert.equal(s.foodActions.at(-1)?.type,'cut','Food left swipe should work after Pasta Quick Cut'); await click('#foodBack'); await settle();
const pastaCard2=await page.locator('#foodCard').boundingBox(); if(!pastaCard2) throw new Error('Food card missing for Pasta right-swipe QA');
await page.mouse.move(pastaCard2.x+50,pastaCard2.y+pastaCard2.height/2); await page.mouse.down(); await page.mouse.move(pastaCard2.x+pastaCard2.width-18,pastaCard2.y+pastaCard2.height/2,{steps:5}); await page.mouse.up(); await settle();
s=await qa(); assert.equal(s.foodActions.at(-1)?.type,'maybe','Food right swipe should work after Pasta Quick Cut'); await click('#foodBack'); await settle();
await click('[data-food-quick="Pasta"]'); await settle();

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
s=await qa(); assert.equal(s.foodPool.length,116,'Food Back should restore left swipe');

const foodBox2=await page.locator('#foodCard').boundingBox();
if(!foodBox2) throw new Error('Food card bounding box missing for right swipe QA');
await page.mouse.move(foodBox2.x+60,foodBox2.y+foodBox2.height/2);
await page.mouse.down();
await page.mouse.move(foodBox2.x+foodBox2.width-20,foodBox2.y+foodBox2.height/2,{steps:4});
await page.mouse.up();
await settle();
s=await qa(); assert.equal(s.foodActions.at(-1)?.type,'maybe','Food right swipe should Maybe');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodPool.length,116,'Food Back should restore right swipe');
const beforeCut=s.foodPool.length;
await click('#foodCut'); await settle();
let afterCut=await qa(); assert.equal(afterCut.foodPool.length < beforeCut,true);
assert.equal(afterCut.foodActions.length,1);
const cutId=afterCut.foodActions[0].id;
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodPool.includes(cutId),true,'Food Back should restore exact cut choice');

await click('#foodMaybe'); await settle();
s=await qa(); assert.equal(s.maybe.length,1,'Maybe should mark the current choice for recycling');
assert.equal(s.foodPool.length,116,'Maybe should move the current card to the recycle queue for this pass');
while(!s.foodMaybeRound && s.foodPool.length>0){ await click('#foodCut'); await settle(); s=await qa(); }
assert.equal(s.foodMaybeRound,true,'Food Maybe choices should recycle into a second narrowing pass');
assert.equal(s.foodPool.includes((await qa()).maybe[0]),true,'The kept food should return when the first pass is exhausted');
await click('#foodBack'); await settle();
s=await qa(); assert.equal(s.foodMaybeRound,true,'Back from a second-pass Cut should preserve the recycle round');
await click('#foodBackTop'); await settle(); await click('#foodStart'); await settle();
assert.equal((await qa()).foodPool.length,116,'Starting a new food round should reset the Maybe recycle cycle');


await click('#foodBackTop'); await settle();
assert.equal((await qa()).screen,'home','top Back should return to the home screen');
await click('#foodStart'); await settle();

// Menu + Food Details + Hide must be clickable.
await click('#foodMenu'); await settle();
assert.equal(await visible('drawer'),true,'Food Menu should open the drawer');
await click('#settings'); await settle();
assert.equal(await visible('settingsModal'),true,'Settings should open');
assert.equal(await page.locator('#appDiagnosis').count(),1,'Settings should include App Diagnosis');
const systemButtons=await page.locator('#settingsModal .settings-system-action').count(); assert.equal(systemButtons,3,'Settings System should have exactly three action buttons');
const systemButtonMetrics=await page.locator('#settingsModal .settings-system-action').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {id:el.id,width:Math.round(r.width),height:Math.round(r.height),fontSize:cs.fontSize,fontWeight:cs.fontWeight,lineHeight:cs.lineHeight,fontFamily:cs.fontFamily}})); assert.ok(systemButtonMetrics.every(x=>x.height===46),'All Settings System buttons should be the same height'); assert.ok(systemButtonMetrics.every(x=>x.width===systemButtonMetrics[0].width),'All Settings System buttons should be the same width'); assert.ok(systemButtonMetrics.every(x=>x.fontSize===systemButtonMetrics[0].fontSize&&x.fontWeight===systemButtonMetrics[0].fontWeight&&x.fontFamily===systemButtonMetrics[0].fontFamily),'All Settings System buttons should use the same text styling');
await click('#appDiagnosis'); await settle();
assert.equal(await visible('settingsModal'),true,'App Diagnosis should stay inside the existing Settings window without opening a second window');
assert.equal(await page.locator('#diagnosisModal').count(),0,'App Diagnosis should not create a second modal element');
assert.ok((await page.locator('#settingsModal').getAttribute('class')||'').includes('diagnosis-modal'),'Settings shell should switch to the full-size diagnosis layout before rendering');
assert.equal(await page.locator('#settingsModal .modal-head h3').innerText(),'App Diagnosis','The existing modal title should change to App Diagnosis');
assert.equal(await page.locator('#settingsModal .diagnosis-loading').count(),0,'App Diagnosis must not show a centered loading screen');
assert.equal(await page.locator('#settingsModal .diagnosis-section').count(),5,'App Diagnosis should render all diagnostic sections immediately');
assert.ok((await page.locator('#settingsModal').boundingBox())?.height>500,'App Diagnosis should open at full size without a small-to-large flash');
assert.match(await page.locator('#settingsModal').innerText(),/Core app/i,'App Diagnosis should show grouped diagnostic sections');
assert.match(await page.locator('#settingsModal').innerText(),/Food system/i,'App Diagnosis should report Food system health');
assert.match(await page.locator('#settingsModal').innerText(),/Restaurant system/i,'App Diagnosis should report Restaurant system health');
assert.match(await page.locator('#settingsModal').innerText(),/Device & runtime/i,'App Diagnosis should report device/runtime health');
assert.match(await page.locator('#settingsModal').innerText(),/Build & deployment/i,'App Diagnosis should report build/deployment health');
assert.match(await page.locator('#settingsModal').innerText(),/Pass Around/i,'App Diagnosis should confirm the removed Pass Around feature');
assert.equal(await page.locator('#diagnosisRefresh').getAttribute('aria-pressed'),'false','Run again should start unselected');
await page.waitForFunction(()=>document.querySelector('#diagnosisRunStatus')?.textContent.includes('complete'),'',{timeout:12000});
await click('#diagnosisRefresh'); assert.equal(await page.locator('#diagnosisRefresh').getAttribute('aria-pressed'),'true','Run again should visibly enter a selected/running state'); assert.equal(await page.locator('#diagnosisRefresh').isDisabled(),true,'Run again should disable while diagnostics are running'); await page.waitForFunction(()=>document.querySelector('#diagnosisRefresh')?.getAttribute('aria-pressed')==='false' && document.querySelector('#diagnosisRunStatus')?.textContent.includes('complete'));
assert.equal(await visible('settingsModal'),true,'App Diagnosis should remain open after Run again');
assert.ok((await page.locator('#diagnosisRunStatus').innerText()).includes('complete'),'Diagnosis should show which run just completed');
await page.locator('#settingsModal [data-close]').click(); await settle();
assert.equal(await page.locator('#settingsModal').count(),0,'Closing App Diagnosis should remove the single Settings/Diagnosis modal cleanly');
assert.equal(await page.locator('#settingsModalBg').count(),0,'Closing App Diagnosis should remove its backdrop cleanly');
await click('#foodMenu'); await settle();

await click('#drawerClose'); await settle();
await page.locator('#foodDetails').click(); await settle();
assert.equal(await visible('detailsModal'),true,'Food Details should open the Details sheet');
assert.equal(await page.locator('#detailsModal').locator('text=Typical nutrition').count()>0,true,'Food Details should show typical nutrition');
assert.equal(await page.locator('#detailsModal').locator('text=Ingredients').count()>0,true,'Food Details should show ingredients');
assert.equal(await page.locator('#detailsModal #detailHide').count(),1,'Food Details should include Hide');
await page.locator('#detailsModal [data-close]').click(); await settle();


await click('#foodBackTop'); await settle();
const contactResolution=await page.evaluate(()=>{const t=window.__DINLIMINATE_TEST__;return {
  mcd:t?.knownRestaurantWebsite({name:"McDonald's"}),
  mcdBrand:t?.knownRestaurantWebsite({name:'Local Store',brand:"McDonald's"}),
  google:t?.restaurantWebsiteUrl({name:'Local Restaurant',address:'100 Main St, Clarksville, TN',website:''}),
  rejectedApp:t?.restaurantWebsiteUrl({name:"McDonald's",address:'100 Main St, Clarksville, TN',website:location.origin}),
  phoneSearch:t?.restaurantPhoneSearchUrl({name:"McDonald's",address:'1265 Rossview Rd, Clarksville, TN 37043'})
};});
assert.equal(contactResolution.mcd,'https://www.mcdonalds.com',"McDonald's must resolve to its official website");
assert.equal(contactResolution.mcdBrand,'https://www.mcdonalds.com',"Known brand matches must resolve to the official website");
assert.match(contactResolution.google||'',/google\.com\/search\?q=/,'Unknown restaurants must use Google Search as website fallback');
assert.match(contactResolution.rejectedApp||'',/google\.com\/search\?q=/,'A bad/app website URL must be rejected in favor of Google Search');
assert.match(contactResolution.phoneSearch||'',/google\.com\/search\?q=.*phone%20number/,'Missing phone data must get a Google phone-number lookup fallback');
await click('#restStart'); await settle();
await page.screenshot({path:path.join(root,'qa-artifacts','restaurant-start-393.png'),fullPage:true});
await page.locator('#address').fill('123');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:first-child'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('9 restaurants')); assert.equal((await page.locator('#locationSourceLabel').innerText()).toLowerCase(),'using selected address','Selected address should expose its location source');
assert.equal(await page.locator('#address').inputValue(),'123 Main St, Clarksville, TN 37040','address suggestion should populate the selected address');
let locState=await qa(); assert.equal(locState.location?.lat,36.5298,'selected suggestion should set exact coordinates');
await page.locator('#address').fill('456');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
await click('#suggestionsBox button:nth-child(2)'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('9 restaurants'));
locState=await qa(); assert.equal(locState.location?.lat,36.5304,'a later address selection should replace the previous location');
await click('#find'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('9 restaurants'));
s=await qa(); assert.equal(s.allRestaurantIds.length,9,'combined restaurant pool should contain unique restaurant + fast food choices');
assert.equal(s.allRestaurantIds.includes('heads-1')&&s.allRestaurantIds.includes('robert-heads-duplicate'),false,'Provider duplicate Heads BBQ records must collapse to one visible restaurant');

assert.equal(await page.locator('#find').innerText(),'Refresh','Find should act as Refresh after a location is selected');
const searchRequests=[];
page.on('request',req=>{if(req.url().includes('/api/restaurant-search?mode=search'))searchRequests.push(req.url());});
const requestsBeforeRadius=searchRequests.length;
await page.locator('#radius').selectOption('5');
await page.waitForFunction(()=>document.querySelector('#restaurantCount')?.innerText.includes('5 choices')||document.querySelector('#status')?.textContent.includes('5 restaurants'));
await settle();
assert.ok(searchRequests.length>requestsBeforeRadius,'Changing radius should automatically trigger a restaurant search');
assert.equal(await page.locator('#radius').inputValue(),'5','Radius control should retain the selected value');
assert.equal((await qa()).allRestaurantIds.length,5,'Five-mile search should return only the five unique mocked venues within five miles');
assert.equal((await qa()).restaurantPool.length,5,'Five-mile radius should filter the active choice pool to five venues');
await page.locator('#radius').selectOption('10');
await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('9 restaurants'));
assert.equal((await qa()).allRestaurantIds.length,9,'Returning to ten miles should restore the full unique radius result set');

await click('#restaurantMenu'); await settle();
await click('#settings'); await settle();
await click('#appDiagnosis'); await settle();
assert.equal(await visible('settingsModal'),true,'App Diagnosis should open from Restaurant Settings');
assert.match(await page.locator('#settingsModal').innerText(),/Restaurant duplicates/i,'Restaurant App Diagnosis should inspect the loaded restaurant pool');
assert.match(await page.locator('#settingsModal').innerText(),/Current restaurant pool/i,'Restaurant App Diagnosis should report the current pool');
assert.doesNotMatch(await page.locator('#settingsModal').innerText(),/miles is not defined/i,'Restaurant App Diagnosis should not throw on loaded restaurant results');
await page.locator('#settingsModal [data-close]').click(); await settle();
assert.equal(await page.locator('#settingsModal').count(),0,'Closing Restaurant App Diagnosis should remove the single modal cleanly');
assert.equal(await page.locator('#settingsModal').count(),0,'Closing Restaurant App Diagnosis should not leave a stale Settings modal');
const hoursBefore=await qa(); assert.equal(await page.locator('#hoursToggle').innerText(),'Open/Unknown','Hours filter should start in Open/Unknown mode');
const restaurantCountStyle=await page.locator('#restaurantCount').evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:s.borderTopWidth,padding:s.padding}});
assert.equal(restaurantCountStyle.background,'rgba(0, 0, 0, 0)','Restaurant count should not render as a colored pill');
assert.equal(restaurantCountStyle.border,'0px','Restaurant count should not render a capsule border');
assert.equal(restaurantCountStyle.padding,'0px','Restaurant count should not render capsule padding');
assert.equal((await page.locator('#restaurantCard').innerText()).includes('Closed Grill'),false,'Closed restaurant should not be shown in Open/Unknown mode');
await click('#hoursToggle'); await settle();
assert.equal(await page.locator('#hoursToggle').innerText(),'All','Hours filter should switch to All');
assert.ok((await qa()).restaurantPool.includes('closed-1'),'Closed restaurant should return in All mode');
await click('#hoursToggle'); await settle();
assert.equal(await page.locator('#hoursToggle').innerText(),'Open/Unknown','Hours filter should switch back to Open/Unknown');
assert.equal((await qa()).restaurantPool.includes('closed-1'),false,'Closed restaurant should be hidden after toggling back to Open/Unknown');

// // Restaurant card controls must all be real interactive elements.
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
assert.equal(restAfterButtons.restaurantPool.includes(restFirstId),true,'Restaurant Maybe/Keep should leave the choice in the pool for recycling');
while(!restAfterButtons.restaurantMaybeRound && restAfterButtons.restaurantPool.length>0){ await click('#restCut'); await settle(); restAfterButtons=await qa(); }
assert.equal(restAfterButtons.restaurantMaybeRound,true,'Restaurant Maybe choices should recycle into a second narrowing pass');
assert.equal(restAfterButtons.restaurantPool.some(x=>x===restFirstId),true,'The kept restaurant should return when the first pass is exhausted');
await click('#restBack'); await settle();
restAfterButtons=await qa(); assert.equal(restAfterButtons.restaurantMaybeRound,true,'Back from a second-pass Cut should preserve the recycle round');
await click('#restaurantBackTop'); await settle(); await click('#restStart'); await settle();
assert.equal((await qa()).restaurantMaybeRound,false,'Starting a new restaurant round should reset the Maybe recycle cycle');

await click('[data-rest-quick="Fast Food"]'); await settle();
s=await qa(); assert.equal(s.restaurantPool.includes('mcd-1'),false,'Fast Food Quick Cut should remove McDonald\'s'); assert.equal(s.restaurantPool.includes('taco-1'),false,'Fast Food Quick Cut should remove Taco Bell'); assert.equal(s.restaurantPool.includes('waffle-1'),true,'Fast Food Quick Cut should keep Waffle House');
await click('[data-rest-quick="Fast Food"]'); await settle();
await click('[data-rest-quick="Burgers"]'); await settle();
s=await qa(); assert.equal(s.restaurantPool.includes('mcd-1'),false,'Burgers Quick Cut should remove McDonald\'s'); assert.equal(s.restaurantPool.includes('burger-barn-1'),false,'Burgers Quick Cut should remove burger restaurants'); assert.equal(s.restaurantPool.includes('taco-1'),true,'Burgers Quick Cut should not remove non-burger fast food');
await click('[data-rest-quick="Burgers"]'); await settle();
await click('[data-rest-quick="Pizza"]'); await settle();
s=await qa(); assert.equal(s.restaurantPool.includes('ital-1'),false,'Pizza Quick Cut should remove pizza/pizzeria restaurants'); assert.equal(s.restaurantPool.includes('burger-barn-1'),true,'Pizza Quick Cut should keep burger restaurants');
await click('[data-rest-quick="Pizza"]'); await settle();

await click('#restaurantSearch'); await settle();
await page.locator('#restaurantQuery').fill('Mcdonalds');
await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['mcd-1'],'Restaurant Search should normalize apostrophes so McDonalds finds McDonald\'s');
await page.locator('#restaurantQuery').fill('burger');
await settle(); s=await qa(); assert.equal(s.restaurantPool.includes('mcd-1'),true,'Burger Search should include fast-food restaurants such as McDonald\'s'); assert.equal(s.restaurantPool.includes('taco-1'),true,'Burger Search should include fast-food restaurants even when the name is not burger-specific'); assert.equal(s.restaurantPool.includes('burger-barn-1'),true,'Burger Search should include dedicated burger restaurants'); assert.equal(s.restaurantPool.includes('waffle-1'),false,'Burger Search should not include unrelated breakfast restaurants');
await page.locator('#restaurantQuery').fill('mexican');
await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['taco-1'],'Cuisine Search should match restaurant cuisine');
await page.locator('#restaurantQuery').fill('fast food');
await settle(); s=await qa(); assert.deepEqual([...s.restaurantPool].sort(),['mcd-1','taco-1'].sort(),'Category Search should match all Fast Food restaurants');
await page.locator('#restaurantQuery').fill('pizza');
await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['ital-1'],'Category/cuisine Search should match pizza restaurants');
await page.locator('#restaurantQuery').fill('Pasta');
await settle(); s=await qa(); assert.deepEqual(s.restaurantPool,['ital-1'],'Italian/Pasta alias Search should match pasta restaurants');
await page.locator('#restaurantQuery').fill(''); await settle();

const currentRestaurantImg=await page.locator('#restaurantCard img').getAttribute('src');
assert.ok(await page.locator('#restaurantCard .card-phone').count()>0,'Restaurant card should show phone number when supplied');
assert.equal(await page.locator('#restaurantCard .card-phone').getAttribute('href'),'tel:+19315550101','Restaurant phone should be a tappable tel link');
assert.equal(await page.locator('#restaurantCard .card-card-action[href^="https://mcdonalds.com"]').count(),1,'Restaurant card should expose the supplied restaurant website directly');
assert.equal(await page.locator('#restaurantCard #restDetails').count(),1,'Restaurant card should expose a labeled Details action');
const cuisineBoxSummary=await page.locator('#restaurantCard .cuisine-line').boundingBox(); const detailsBoxSummary=await page.locator('#restaurantCard #restDetails').boundingBox(); assert.ok(cuisineBoxSummary&&detailsBoxSummary&&detailsBoxSummary.x>=cuisineBoxSummary.x+cuisineBoxSummary.width-2,'Restaurant Details icon should sit to the right of cuisine');  assert.ok(detailsBoxSummary&&detailsBoxSummary.width<=30&&detailsBoxSummary.height<=30,'Restaurant Details icon should stay compact and clear of card text'); assert.ok(await page.locator('#restaurantCard #restDetails .details-icon').evaluate(el=>getComputedStyle(el).width)==='14px','Details icon should use the crisp compact glyph size');
assert.ok(await page.locator('#restaurantCard .card-card-action').count()>=1,'Restaurant card should show card actions');
assert.equal(await page.locator('#restaurantCard').getByText(/Directions|Google Maps/i).count(),0,'Restaurant card must not show Directions; it belongs inside Details');
assert.equal(await page.locator('#restaurantCard .card-card-action').filter({hasText:'↗'}).count(),1,'Restaurant Website action should use a symbol');
assert.equal(await page.locator('#restDetails').getAttribute('aria-label'),'Details','Restaurant Details should use an accessible icon label'); assert.equal(await page.locator('#restDetails .details-icon').count(),1,'Restaurant Details should render the crisp icon');
const cuisineBox=await page.locator('#restaurantCard .card-cuisine-row .cuisine-line').boundingBox(); const detailsInlineBox=await page.locator('#restaurantCard #restDetails').boundingBox();
assert.ok(cuisineBox&&detailsInlineBox&&detailsInlineBox.x>=cuisineBox.x+cuisineBox.width-1,'Restaurant Details icon should sit to the right of the cuisine text');
assert.ok(cuisineBox&&detailsInlineBox&&Math.abs(detailsInlineBox.y-cuisineBox.y)<=8,'Restaurant Details icon should stay aligned with the cuisine row');

assert.ok(currentRestaurantImg && (/^https?:\/\//.test(currentRestaurantImg) || currentRestaurantImg.startsWith('/api/image?url=https%3A%2F%2F')),'Restaurant card should always use a real or securely proxied photo URL');
assert.notEqual(currentRestaurantImg,'','Restaurant card photo URL must not be empty');
assert.equal(await page.locator('#restQuick [data-rest-quick]').count(),10,'Restaurant should have 10 Quick Cuts');
assert.deepEqual(await page.locator('#restQuick [data-rest-quick]').evaluateAll(els=>els.map(el=>el.innerText.trim())),['Fast Food','Burgers','Pizza','Mexican','American','Italian','Asian','BBQ','Seafood','Breakfast'],'Restaurant Quick Cuts should use restaurant categories rather than food types');
assert.equal(await page.locator('#restQuick [data-rest-quick] .quick-chip-photo').count(),10,'Every Restaurant Quick Cut should render a photo element');
assert.equal((await page.locator('[data-rest-quick] .quick-chip-photo').evaluateAll(imgs=>imgs.map(x=>x.getAttribute('src')))).every(Boolean),true,'Every Restaurant Quick Cut should have a photo source');
assert.equal(await page.locator('#hoursOpenUnknown').innerText(),'Open + Unknown');
await click('#hoursAll'); await settle(); s=await qa(); assert.equal(await page.locator('#hoursAll').innerText(),'All'); assert.equal(s.restaurantPool.includes('closed-1'),true,'All should include open, unknown, and closed restaurants');
await click('#hoursOpenUnknown'); await settle(); s=await qa(); assert.equal(await page.locator('#hoursOpenUnknown').innerText(),'Open + Unknown'); assert.equal(s.restaurantPool.includes('closed-1'),false,'Open + Unknown should exclude explicitly closed restaurants');

const restBefore=s.restaurantPool.length;
await click('#restCut'); await settle(); let restAfter=await qa(); assert.equal(restAfter.restaurantPool.length,restBefore-1);
const restCutId=restAfter.restaurantActions.at(-1).id;
await click('#restBack'); await settle(); s=await qa(); assert.equal(s.restaurantPool.includes(restCutId),true);

const restaurantCard=page.locator('#restaurantCard');
if(!(await restaurantCard.count())) throw new Error('Restaurant card missing for right swipe QA');
assert.equal(await visible('restaurantNextCard'),true,'Restaurant should show the next Tinder card behind the current card');
const restSwipeBox=await restaurantCard.boundingBox(); if(!restSwipeBox) throw new Error('Restaurant card bounding box missing for right swipe QA');
await page.mouse.move(restSwipeBox.x+50,restSwipeBox.y+restSwipeBox.height/2); await page.mouse.down(); await page.mouse.move(restSwipeBox.x+restSwipeBox.width-18,restSwipeBox.y+restSwipeBox.height/2,{steps:4}); await page.mouse.up();
await settle();
s=await qa(); assert.equal(s.restaurantActions.at(-1)?.type,'maybe','Restaurant right swipe should Maybe');
await click('#restBack'); await settle();
s=await qa(); assert.equal(s.restaurantActions.length,0,'Restaurant Back should undo Maybe swipe');

if(!(await page.locator('#restaurantQuery').isVisible())) { await page.locator('#restaurantSearch').click(); await settle(); }
await page.locator('#restaurantQuery').fill("McDonald's"); await settle();
assert.equal((await page.locator('#restStage').innerText()).includes('Big Mac · Fries'),true,'restaurant card should show provider-supplied common menu items');
await page.locator('#restDetails').click(); await settle(); assert.equal(await visible('detailsModal'),true,'Restaurant Details should open the Details sheet'); assert.equal(await page.locator('#detailsModal h3').innerText(),'Restaurant Details','Restaurant Details modal should have an explicit title'); assert.match(await page.locator('#detailsModal').innerText(),/COMMON MENU ITEMS/i,'Restaurant Details should show common menu items when supplied'); assert.equal(await page.locator('#detailsModal .detail-website-action').count(),1,'Restaurant Details should expose the Website/Google icon action'); assert.equal(await page.locator('#detailsModal .restaurant-luxury-contact-card').count(),1,'Restaurant Details should show the premium contact section'); assert.match(await page.locator('#detailsModal').innerText(),/PHONE/i,'Restaurant Details should visibly show a Phone label'); assert.match(await page.locator('#detailsModal').innerText(),/GOOGLE MAPS/i,'Restaurant Details should visibly show Google Maps directions');
assert.equal(await page.locator('#detailsModal .detail-directions-action').count(),1,'Restaurant Details should expose Google Maps directions');
assert.match(await page.locator('#detailsModal .detail-directions-action').getAttribute('href')||'',/google\.com\/maps\/dir\//,'Restaurant Details directions should use Google Maps');
assert.ok(await page.locator('#detailsModal .restaurant-luxury-contact-row[href^="tel:"]').count()>=1,'Restaurant Details should expose a tap-to-call phone number');
assert.equal(await page.locator('#detailsModal .restaurant-luxury-contact-row[href^="tel:"]').getAttribute('href'),'tel:+19315550101','Restaurant Details phone should be a tappable tel link');
const detailActionMetrics=await page.locator('#detailsModal .restaurant-luxury-actions .detail-icon-button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)}}));
assert.equal(detailActionMetrics.length,2,'Website and Directions should share the same compact action row');
assert.equal(new Set(detailActionMetrics.map(x=>x.w+"x"+x.h)).size,1,'Website and Directions should use the same button dimensions');
await page.locator('#detailsModal .detail-website-action').click(); await settle(); await page.locator('#detailsModal [data-close]').click(); await settle();
const directWebsite=await page.locator('#restaurantCard .card-card-action[aria-label="Open restaurant website"]').getAttribute('href'); assert.match(directWebsite||'',/^https:\/\/mcdonalds\.com/,'Restaurant Website action should use the provider website when supplied');
if(!(await page.locator('#restaurantQuery').isVisible())) { await page.locator('#restaurantSearch').click(); await settle(); }
await page.locator('#restaurantQuery').fill('Asian Garden'); await settle(); const fallbackHref=await page.locator('#restaurantCard .card-card-action').filter({hasText:'↗'}).getAttribute('href'); assert.match(fallbackHref||'',/google\.com\/search\?q=/,'Restaurant Website action should fall back to Google search when no website is supplied');
await page.locator('#restaurantQuery').fill(''); await settle();
await click('#restHide'); await settle(); assert.equal(await visible('appConfirmModal'),true,'Restaurant Hide should create a hidden restaurant before Settings Restore is tested'); await click('#appConfirmOk'); await settle();

await page.locator('#restaurantMenu').click({force:true});
await page.locator('#drawer:not(.hidden)').waitFor({state:'visible',timeout:3000});
await page.locator('#settings').click(); await settle();
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
const settingsFoodText=await page.locator('#settingsModal').innerText();
assert.equal(/Food Choices/i.test(settingsFoodText),false,'Settings should no longer contain a Food Choices section');
assert.equal(settingsFoodText.toLowerCase().includes('popcorn'),false,'Settings should not list hidden foods');
assert.equal(await page.locator('[data-setting-food-delete]').count(),0,'Settings should expose no food Delete control');
assert.equal(await page.locator('[data-setting-food]').count(),0,'Settings should expose no food Restore/Hide control');
await page.locator('#settingsModal [data-close]').click(); await settle();
assert.equal(await page.locator('#manageFoodsModal').count(),0,'closing Settings should leave no stale Manage Foods modal');
assert.equal(await page.locator('#foodEditorModal').count(),0,'closing Settings should leave no stale Food editor modal');
await page.locator('#addFood').evaluate(el=>el.click()); await settle();
assert.equal(await visible('manageFoodsModal'),true,'Add Food manager should open');
await click('#openFoodEditor'); await settle();
assert.equal(await visible('foodEditorModal'),true,'Add Food editor should open');
assert.deepEqual(await page.locator('#editFoodCat option').allTextContents(),['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Potato','Snack','Other'],'Food editor should expose all food categories including Other');
await page.locator('#editFoodCat').selectOption('Other');
assert.equal(await page.locator('input[name="editQuickCut"][value="Other"]').isChecked(),true,'Choosing Other cuisine/category should automatically associate the Other Quick Cut');
await page.locator('#editFoodName').fill('QA Special');
await page.locator('#editFoodRecipe').fill('Test recipe');
await page.locator('#editFoodFile').setInputFiles({
  name:'qa.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')
});
await page.waitForFunction(()=>document.querySelector('#editFoodPhoto')?.value.startsWith('data:image/'),'',{timeout:5000});
assert.ok((await page.locator('#editFoodPhoto').inputValue()).startsWith('data:image/'),'device photo should be converted to a stored image');
const editorDiag=await page.evaluate(()=>({count:document.querySelectorAll('input[name="editQuickCut"]').length,values:[...document.querySelectorAll('input[name="editQuickCut"]')].map(x=>x.value),modal:document.querySelector('#foodEditorModal')?.innerHTML.slice(0,3500)||null})); console.log('Custom Food editor Quick Cut runtime:',JSON.stringify(editorDiag)); assert.equal(editorDiag.count,12,'Custom Food editor should render the 11 standard Food Quick Cuts plus Other');
assert.ok(editorDiag.values.includes('Other'),'Custom Food editor should expose Other as an optional Quick Cut');
await page.locator('input[name="editQuickCut"][value="Pasta"]').check({force:true});
await page.locator('input[name="editQuickCut"][value="Other"]').check({force:true});
await page.locator('input[name="editQuickCut"][value="Healthy"]').check({force:true});
await click('#foodEditorForm button.cut'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.name==='QA Special'&&x.recipe==='Test recipe'&&x.image.startsWith('data:image/')),true,'custom Food photo/recipe should persist');
const customRow=s.custom.find(x=>x.id==='qa-special'); assert.equal(customRow.quickCuts.includes('Pasta'),true,'Custom food should support multiple Quick Cuts'); assert.equal(customRow.quickCuts.includes('Healthy'),true,'Custom food should support multiple Quick Cuts');
assert.equal(customRow.quickCuts.includes('Other'),true,'Custom food should persist the optional Other Quick Cut');
assert.equal(await page.locator('[data-food-quick="Other"]').count(),1,'Other Quick Cut should appear only after a custom food adds it');
assert.equal(await visible('manageFoodsModal'),false,'saving a custom food from the Food deck should return to the swipe deck');
assert.equal(await page.locator('#foodEditorModal').count(),0,'saving a custom food should close the editor');
await click('[data-food-quick="Other"]'); await settle(); s=await qa(); assert.equal(s.foodPool.includes('qa-special'),false,'Other Quick Cut should eliminate only foods explicitly tagged Other'); await click('[data-food-quick="Other"]'); await settle();
await page.locator('#foodMenu').click({force:true}); await settle();
await page.locator('#manage').click({force:true}); await settle();
assert.equal(await visible('manageFoodsModal'),true,'Manage Foods should expose the saved custom food for editing');
await click('[data-food-edit="qa-special"]'); await settle();
await page.locator('#editFoodRecipe').fill('Edited recipe');
await click('#foodEditorForm button.cut'); await settle();
s=await qa(); assert.equal(s.custom.some(x=>x.name==='QA Special'&&x.recipe==='Edited recipe'),true,'custom Food edit should persist');
const storedCustomPhoto=await page.evaluate(()=>JSON.parse(localStorage.getItem('dinliminate.clean.cp1')||'{}').custom?.find(x=>x.id==='qa-special')?.image||'');
assert.equal(storedCustomPhoto,'idb:qa-special','Custom food photo should be stored as an IndexedDB reference in localStorage');

assert.equal(await page.locator('[data-food-delete]').count(),0,'Manage Foods should expose no food Delete controls');
assert.equal(await page.locator('#manageFoodsModal .danger-lite').count(),0,'Manage Foods should expose no food delete-style action');
await page.locator('[data-food-hide="popcorn"]').count();
await page.locator('#manageFoodsModal [data-close]').click(); await settle();
await page.locator('#foodMenu').click({force:true}); await settle();
await page.locator('#manage').click({force:true}); await settle();
assert.equal(await page.locator('[data-food-restore="popcorn"]').count(),1,'Hidden built-in food should be restorable only through Manage Foods');
await page.locator('[data-food-restore="popcorn"]').click(); await settle();
s=await qa(); assert.equal(s.hiddenFoods.includes('popcorn'),false,'Manage Foods Restore should unhide the food');
assert.equal(await page.locator('#manageFoodsModal').count(),1,'Manage Foods should remain available after Restore');
await page.locator('#manageFoodsModal [data-close]').click(); await settle();
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
assert.equal(await page.locator('#hungryNote').innerText(),'Fish Sticks?','Hungry winner should show the Fish Sticks? prompt');
await page.locator('#details').click(); await settle();
assert.equal(await page.locator('#detailsModal #detailHide').count(),0,'Hungry Details should not include Hide');
await page.locator('#detailsModal [data-close]').click(); await settle();
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
assert.match(aboutText,/Build\s+\d+/i);
const expectedDate=await page.evaluate(()=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date()));
assert.ok(aboutText.includes(expectedDate),'About date should always reflect the current date');
assert.equal(await page.locator('#aboutModal .about-test').evaluate(el=>getComputedStyle(el).color),'rgb(191, 161, 107)','About current build label should be gold');
assert.equal(await page.locator('#drawer #privacy').count(),0,'Privacy should no longer be a top-level drawer item');
assert.equal(await page.locator('#privacyFromAbout').count(),1,'Privacy should live inside About');
await click('#privacyFromAbout'); await settle(); assert.equal(await visible('privacyModal'),true,'Privacy should open from About');
await page.locator('#privacyModal [data-close]').click(); await settle();
await page.locator('[data-close]').click(); await settle();
await click('#menu'); await settle(); await click('#settings'); await settle();
const settingsFoodText2=await page.locator('#settingsModal').innerText(); assert.equal(/Food Choices/i.test(settingsFoodText2),false,'Settings should not contain a Food Choices section'); assert.equal(await page.locator('#settingsModal h4').filter({hasText:'Deleted Foods'}).count(),0,'Settings should contain no deleted-food section'); await page.locator('#settingsModal [data-close]').click(); await settle();
await click('#iphoneHelp'); await settle(); assert.equal(await visible('iphoneModal'),true,'iPhone help should open'); await page.locator('[data-close]').click(); await settle();

// Restaurant final-choice right swipe must select the final restaurant, not enter Hungry.
await click('#restStart'); await settle();
await click('#locate'); await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('9 restaurants') || document.querySelector('#status')?.textContent.includes('restaurants found')); await settle();
assert.equal((await page.locator('#locationSourceLabel').innerText()).toLowerCase(),'using your location','Device location should be labeled as the source');
const deviceLoc=await qa(); assert.ok(Math.abs(Number(deviceLoc.location?.lat)-36.5304)<0.01,'Device latitude should be persisted');
assert.ok(Math.abs(Number(deviceLoc.location?.lon)+87.3601)<0.01,'Device longitude should be persisted');
forceReverseFailure=true;
await page.locator('#locate').click();