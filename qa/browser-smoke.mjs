import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const releaseMeta=JSON.parse(fs.readFileSync(path.join(root,'app-release.json'),'utf8'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent((req.url||'/').split('?')[0]);
  const rel=pathname==='/'?'index.html':pathname.replace(/^\//,'');
  const file=path.join(root,rel);
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/Chicago'});
await context.grantPermissions(['geolocation'],{origin:'http://127.0.0.1:4173'});
await context.setGeolocation({latitude:36.5304,longitude:-87.3601});
const page=await context.newPage();
const errors=[],consoleErrors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&&!/404 \(Not Found\)/i.test(m.text()))consoleErrors.push(m.text());});

const tiny=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
await page.route('**/*',async route=>{
  const u=route.request().url();
  if(u.includes('/api/release')){
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,name:releaseMeta.name,version:releaseMeta.version,build:String(releaseMeta.build),sourceBranch:releaseMeta.sourceBranch,expectedBranch:releaseMeta.sourceBranch,environment:'test'})});
  }
  if(u.includes('/api/restaurant-search?mode=health')){
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'r27',maxRadiusMiles:100})});
  }
  if(u.includes('/api/restaurant-search?mode=reverse')){
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,display:'Clarksville, TN'})});
  }
  if(u.includes('/api/restaurant-search?mode=search')){
    const rows=[
      {id:'qa-restaurant-1',name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',address:'100 Main St, Clarksville, TN',lat:36.5305,lon:-87.3600,distance:0.1,website:'https://www.mcdonalds.com',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1514933651103-005eec06c04b'},
      {id:'qa-restaurant-2',name:'Thirsty Goat',category:'Pizza',fastFood:false,cuisine:'pizza',address:'200 Main St, Clarksville, TN',lat:36.5320,lon:-87.3590,distance:0.2,website:'',opening_hours:'',openNow:true,photo:'https://images.unsplash.com/photo-1579684947550-22e945225d9a'},
      {id:'qa-restaurant-3',name:'Ruby Tuesday',category:'American',fastFood:false,cuisine:'american',address:'300 Main St, Clarksville, TN',lat:36.5350,lon:-87.3600,distance:0.4,website:'',opening_hours:'24/7',openNow:true,photo:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
    ];
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'r25',radiusMiles:10,total:rows.length,fastFoodCount:1,timezone:'America/Chicago',results:rows})});
  }
  if(u.includes('/api/restaurant-photo')){
    return route.fulfill({status:200,contentType:'image/png',body:tiny});
  }
  if(u.includes('/api/image?url=')||u.startsWith('https://images.unsplash.com/')||u.startsWith('https://images.pexels.com/')){
    return route.fulfill({status:200,contentType:'image/png',body:tiny});
  }
  return route.continue();
});

await page.goto('http://127.0.0.1:4173/?qa=1',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(150);
assert.equal(await page.locator('#home h1').innerText(),'Meal Decisions Simplified');
assert.equal(await page.locator('#home .sub').innerText(),'Swipe. Dinliminate. Enjoy.');
assert.equal(await page.locator('#addToPhone').count(),1);
assert.equal(await page.locator('#shareApp').count(),1);
assert.equal(await page.locator('#foodStart').locator('strong').innerText(),'DINE IN');
assert.equal(await page.locator('#foodStart').locator('span').nth(1).innerText(),'Reveal your meal');
assert.equal(await page.locator('#restStart').locator('strong').innerText(),'DINE OUT');
assert.equal(await page.locator('#restStart').locator('span').nth(1).innerText(),'Reveal your restaurant');
assert.equal(await page.locator('#homeFirstNudge').innerText(),'Swipe until it’s revealed.');
assert.equal(await page.locator('#homeFirstNudge').isVisible(),true);
const ambient=await page.evaluate(()=>getComputedStyle(document.querySelector('.app'),'::after').animationDuration);
assert.equal(ambient,'16s');
const homeGeom=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,scrollHeight:document.documentElement.scrollHeight,innerHeight}));
assert.equal(homeGeom.scrollWidth,homeGeom.clientWidth);
assert.ok(homeGeom.scrollHeight<=homeGeom.innerHeight+2);

await page.locator('#foodStart').click({position:{x:10,y:10}});
await page.waitForTimeout(100);
assert.equal(await page.locator('#foodCard').isVisible(),true);
assert.equal(await page.locator('#foodCard .swipe-card-coach').count(),1);
assert.equal(await page.locator('.swipe-hint').count(),0);
assert.match(await page.locator('#foodCard .swipe-card-coach').innerText(),/← CUT.*SWIPE.*MAYBE →/s);
const foodMaybeStyle=await page.locator('#foodMaybe').evaluate(el=>getComputedStyle(el,'::before').animationName);
assert.equal(foodMaybeStyle,'cp774MaybeGlow');
const foodBefore=Number((await page.locator('#foodCount').innerText()).match(/\d+/)?.[0]||0);
assert.equal(foodBefore,116);
await page.locator('#foodMaybe').dispatchEvent('pointerdown',{pointerType:'mouse',button:0});
assert.match(await page.locator('#foodMaybe').getAttribute('class'),/is-pressed/);
await page.locator('#foodMaybe').dispatchEvent('pointerup',{pointerType:'mouse',button:0});
await page.waitForTimeout(400);
assert.equal(Number((await page.locator('#foodCount').innerText()).match(/\d+/)?.[0]||0),foodBefore);
await page.locator('#foodCut').dispatchEvent('pointerdown',{pointerType:'mouse',button:0});
assert.match(await page.locator('#foodCut').getAttribute('class'),/is-pressed/);
await page.locator('#foodCut').dispatchEvent('pointerup',{pointerType:'mouse',button:0});
await page.waitForTimeout(220);

assert.equal(Number((await page.locator('#foodCount').innerText()).match(/\d+/)?.[0]||0),115);
await page.locator('#foodBack').click();
await page.waitForTimeout(120);
assert.equal(Number((await page.locator('#foodCount').innerText()).match(/\d+/)?.[0]||0),116);
await page.locator('#foodDetails').click();
await page.waitForTimeout(80);
assert.equal(await page.locator('#detailsModal').count(),1);
assert.ok((await page.locator('#detailsModal').getAttribute('class')).includes('details-modal'));
const mealDetailTiming=await page.locator('#detailsModal .history-detail-photo').evaluate(el=>getComputedStyle(el).transitionDuration);
assert.equal(mealDetailTiming,'0.2s');
const mealTitleTiming=await page.locator('#detailsModal .detail-unified-title').evaluate(el=>getComputedStyle(el).transitionDuration);
assert.equal(mealTitleTiming,'0.18s');
await page.locator('#detailNotesToggle').click();
await page.locator('#detailNotesInput').fill('Keep this one in mind.');
await page.locator('#detailNotesSave').click();
assert.equal(await page.locator('#detailNoteEdit').isVisible(),true);
assert.equal(await page.locator('#detailNotesDelete').isVisible(),true);
await page.locator('#detailNoteEdit').click();
await page.locator('#detailNotesInput').fill('Updated note.');
await page.locator('#detailNotesSave').click();
assert.equal(await page.locator('#detailNotesPreview').innerText(),'Updated note.');
await page.locator('#detailNotesDelete').click();
assert.equal(await page.locator('#detailNotesEmpty').isVisible(),true);
await page.locator('#detailsModal [data-close]').click();
await page.locator('#foodBackTop').click();
await page.waitForTimeout(200);
assert.equal(await page.locator('#homeFirstNudge').count(),0);

await page.locator('#restStart').click();
await page.waitForTimeout(600);
assert.equal(await page.locator('#restaurant').isVisible(),true);
assert.equal(await page.locator('#restaurantSearch').count(),0,'Restaurant Search must remain hidden');
assert.equal(await page.locator('#hoursToggle').count(),0,'Open/All must remain hidden');
assert.equal(await page.locator('#restaurantQuery').count(),1);
assert.equal(await page.locator('#restaurant .swipe-card-coach').count(),0);
assert.equal(await page.locator('#restStage #restaurantCard').count(),1);
const restBefore=Number((await page.locator('#restaurantCount').innerText()).match(/\d+/)?.[0]||0);
assert.equal(restBefore,3);
await page.locator('#restMaybe').dispatchEvent('pointerdown',{pointerType:'mouse',button:0});
assert.match(await page.locator('#restMaybe').getAttribute('class'),/is-pressed/);
await page.locator('#restMaybe').dispatchEvent('pointerup',{pointerType:'mouse',button:0});
await page.waitForTimeout(400);
assert.equal(Number((await page.locator('#restaurantCount').innerText()).match(/\d+/)?.[0]||0),restBefore);
await page.locator('#restCut').dispatchEvent('pointerdown',{pointerType:'mouse',button:0});
assert.match(await page.locator('#restCut').getAttribute('class'),/is-pressed/);
await page.locator('#restCut').dispatchEvent('pointerup',{pointerType:'mouse',button:0});
await page.waitForTimeout(220);
assert.equal(Number((await page.locator('#restaurantCount').innerText()).match(/\d+/)?.[0]||0),2);
await page.locator('#restBack').click();
await page.waitForTimeout(120);
assert.equal(Number((await page.locator('#restaurantCount').innerText()).match(/\d+/)?.[0]||0),3);
await page.locator('#restDetails').click();
await page.waitForTimeout(80);
assert.equal(await page.locator('#detailNotesToggle').count(),1);
assert.ok((await page.locator('#detailsModal').getAttribute('class')).includes('details-modal'));
const restDetailTiming=await page.locator('#detailsModal .history-detail-photo').evaluate(el=>getComputedStyle(el).transitionDuration);
assert.equal(restDetailTiming,'0.2s');
await page.locator('#detailNotesToggle').click();
await page.locator('#detailNotesInput').fill('Try the pizza.');
await page.locator('#detailNotesSave').click();
assert.equal(await page.locator('#detailNoteEdit').count(),1);
await page.locator('#detailNotesDelete').click();
assert.equal(await page.locator('#detailNotesEmpty').isVisible(),true);

assert.equal(errors.length,0,'Browser page errors: '+errors.join(' | '));
assert.equal(consoleErrors.length,0,'Browser console errors: '+consoleErrors.join(' | '));
console.log(JSON.stringify({ok:true,build:releaseMeta.build,checkpoint:releaseMeta.checkpoint,home:'PASS',meal:'PASS',notes:'PASS',restaurant:'PASS',hiddenRestaurantSearch:true,hiddenOpenAll:true}));
await browser.close();
server.close();