import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const release=JSON.parse(fs.readFileSync(path.join(root,'release.json'),'utf8'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent((req.url||'/').split('?')[0]);
  const rel=pathname==='/'?'index.html':pathname.replace(/^\//,'');
  const file=path.join(root,rel);
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(4174,'127.0.0.1',resolve));

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/Chicago'
});
await context.grantPermissions(['geolocation'],{origin:'http://127.0.0.1:4174'});
await context.setGeolocation({latitude:36.5304,longitude:-87.3601});
const page=await context.newPage();

const png1x1=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const requests=[],badResponses=[],pageErrors=[],consoleErrors=[];
let reverseFailure=false;

const allResults=[
 {id:'mcd',name:"McDonald's",category:'Fast Food',fastFood:true,cuisine:'burger',distance:.8,address:'100 Main St, Clarksville, TN',website:'https://www.mcdonalds.com',phone:'(931) 555-0101',opening_hours:'24/7',openNow:true,menuItems:['Big Mac','Fries'],photo:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85'},
 {id:'waffle',name:'Waffle House',category:'American',fastFood:false,cuisine:'breakfast',distance:2.8,address:'200 Riverside Dr, Clarksville, TN',website:'https://www.wafflehouse.com',phone:'(931) 555-0102',opening_hours:'24/7',openNow:true,menuItems:['Waffles'],photo:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85'},
 {id:'taco',name:'Taco Bell',category:'Fast Food',fastFood:true,cuisine:'mexican',distance:4.2,address:'300 Madison St, Clarksville, TN',website:'https://www.tacobell.com',phone:'(931) 555-0103',opening_hours:'24/7',openNow:true,menuItems:['Tacos'],photo:'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85'},
 {id:'pizza',name:'Pizza House',category:'Italian',fastFood:false,cuisine:'pizza',distance:9,address:'400 College St, Clarksville, TN',website:'https://example.com',phone:'',opening_hours:'24/7',openNow:true,menuItems:['Pizza'],photo:'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=1200&q=85'},
 {id:'american',name:'American Grill',category:'American',fastFood:false,cuisine:'american',distance:24,address:'500 Main St, Clarksville, TN',website:'',phone:'',opening_hours:'24/7',openNow:true,menuItems:['Chicken','Burger'],photo:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'},
 {id:'italian',name:'Pasta House',category:'Italian',fastFood:false,cuisine:'italian',distance:49,address:'600 College St, Clarksville, TN',website:'',phone:'',opening_hours:'24/7',openNow:true,menuItems:['Pasta'],photo:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85'},
 {id:'asian',name:'Asian Garden',category:'Asian',fastFood:false,cuisine:'asian',distance:50,address:'700 Madison St, Clarksville, TN',website:'',phone:'',opening_hours:'',menuItems:['Noodles'],photo:'https://images.unsplash.com/photo-1515669097368-22e681b4d36c?auto=format&fit=crop&w=1200&q=85'},
 {id:'bbq',name:'Clarksville BBQ',category:'BBQ',fastFood:false,cuisine:'bbq',distance:75,address:'800 BBQ Rd, Clarksville, TN',website:'',phone:'',opening_hours:'24/7',openNow:true,menuItems:['BBQ'],photo:'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85'},
 {id:'seafood',name:'Seafood Dock',category:'Seafood',fastFood:false,cuisine:'seafood',distance:99,address:'900 River Rd, Clarksville, TN',website:'',phone:'',opening_hours:'24/7',openNow:true,menuItems:['Fish'],photo:'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=1200&q=85'},
 {id:'closed',name:'Closed Grill',category:'American',fastFood:false,cuisine:'american',distance:5.5,address:'1000 Main St, Clarksville, TN',website:'',phone:'',opening_hours:'24/7',openNow:false,menuItems:[],photo:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'}
];

page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{
  if(m.type()!=='error') return;
  const msg=m.text();
  if(reverseFailure && /Failed to load resource: the server responded with a status of 502/.test(msg)) return;
  consoleErrors.push(msg);
});
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
page.on('request',r=>{if(r.url().includes('/api/restaurant-search?mode=search'))requests.push(r.url())});

await page.route('**/*',async route=>{
 const u=route.request().url();
 if(u.includes('/api/release')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,name:'Dinliminate',version:'1.0',build:String(release.build),sourceBranch:release.sourceBranch,expectedBranch:release.sourceBranch})});
 if(u.includes('/api/restaurant-search?mode=health')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,version:'qa',maxRadiusMiles:100,providers:['qa']})});
 if(u.includes('/api/restaurant-search?mode=suggest')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,results:[
   {lat:36.5298,lon:-87.3588,display:'801 Iron Workers Rd, Clarksville, TN 37043'},
   {lat:36.5200,lon:-87.3500,display:'123 Main St, Clarksville, TN 37040'}
 ]})});
 if(u.includes('/api/restaurant-search?mode=resolve')) return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,lat:36.5298,lon:-87.3588,display:'801 Iron Workers Rd, Clarksville, TN 37043'})});
 if(u.includes('/api/restaurant-search?mode=reverse')){
   if(reverseFailure)return route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({ok:false,message:'QA reverse unavailable'})});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,display:'Current location (QA)'})});
 }
 if(u.includes('/api/restaurant-search?mode=search')){
   const url=new URL(u),radius=Number(url.searchParams.get('radius')||10),q=String(url.searchParams.get('q')||'').toLowerCase();
   let results=allResults.filter(x=>x.distance<=radius+1e-9);
   if(q){
     const nq=q.replace(/[^a-z0-9]+/g,' ').trim();
     if(nq.includes('mcdonald'))results=results.filter(x=>x.id==='mcd');
     else if(nq.includes('burger'))results=results.filter(x=>['mcd','waffle','american'].includes(x.id));
     else if(nq.includes('mexican'))results=results.filter(x=>x.id==='taco');
     else if(nq.includes('fast food'))results=results.filter(x=>['mcd','taco'].includes(x.id));
     else if(nq.includes('pizza')||nq.includes('pasta'))results=results.filter(x=>['pizza','italian'].includes(x.id));
   }
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
     ok:true,version:'qa',radiusMiles:radius,total:results.length,fastFoodCount:results.filter(x=>x.fastFood).length,timezone:'America/Chicago',searchQuery:q,searchLatencyMs:150,searchBudgetMs:12000,results
   })});
 }
 if(u.includes('/api/image?url='))return route.fulfill({status:200,contentType:'image/jpeg',body:png1x1});
 if(u.startsWith('https://images.unsplash.com/')||u.startsWith('https://images.pexels.com/'))return route.fulfill({status:200,contentType:'image/png',body:png1x1});
 return route.continue();
});

const settle=()=>page.waitForTimeout(180);
const snap=()=>page.evaluate(()=>window.__DINLIMINATE_QA__?.snapshot());
async function waitForRestaurant(){await page.waitForFunction(()=>/restaurants found|choices/.test(document.querySelector('#status')?.textContent||''));await settle();}
async function openRestaurantScreen(){await page.locator('#restStart').click();await settle();}

await page.goto('http://127.0.0.1:4174/?qa=1');
await page.waitForLoadState('domcontentloaded');
await settle();

const report={};
report["1_use_location"]={};
await openRestaurantScreen();
await page.locator('#locate').click();
await waitForRestaurant();
let s=await snap();
assert.equal(s.locationSource,'device');
assert.ok(Math.abs(Number(s.location?.lat)-36.5304)<0.001);
assert.ok(Math.abs(Number(s.location?.lon)+87.3601)<0.001);
assert.equal((await page.locator('#locationSourceLabel').textContent()).trim(),'Using your location');
report["1_use_location"].success=true;
report["1_use_location"].coordinates=s.location;
report["1_use_location"].source=await page.locator('#locationSourceLabel').innerText();

// Also verify graceful fallback when reverse lookup fails.
reverseFailure=true;
await page.locator('#locate').click();
await waitForRestaurant();
s=await snap();
assert.equal(s.locationSource,'device');
assert.ok(Math.abs(Number(s.location?.lat)-36.5304)<0.001);
reverseFailure=false;
report["1_use_location"].reverseFailureFallback=true;

// 2. Address search with autocomplete and later address replacement.
report["2_search_address"]={};
await page.locator('#address').fill('801 Iron');
await page.waitForSelector('#suggestionsBox button',{state:'visible'});
assert.ok(await page.locator('#suggestionsBox button').count()>=2);
await page.locator('#suggestionsBox button').first().click();
await waitForRestaurant();
s=await snap();
assert.equal(s.locationSource,'address');
assert.equal(await page.locator('#address').inputValue(),'801 Iron Workers Rd, Clarksville, TN 37043');
assert.equal(Number(s.location.lat),36.5298);
report["2_search_address"].autocomplete=true;
report["2_search_address"].selectedAddress=await page.locator('#address').inputValue();
report["2_search_address"].coordinates=s.location;

// Also verify a complete typed address can be submitted directly with Enter (without choosing a suggestion).
await page.locator('#address').fill('801 Iron Workers Rd, Clarksville, TN 37043');
await page.locator('#address').press('Enter');
await waitForRestaurant();
s=await snap();
assert.equal(s.locationSource,'address');
assert.equal(await page.locator('#address').inputValue(),'801 Iron Workers Rd, Clarksville, TN 37043');
report["2_search_address"].directEnter=true;

// 3. All seven radius values; verify request forwarding, exact radius contract, result monotonicity, and containment.
report["3_radius"]={};
const radii=[1,3,5,10,25,50,100];
const radiusRows=[];
for(const r of radii){
  await page.locator('#radius').selectOption(String(r));
  await page.waitForFunction(expected=>Number(document.querySelector('#radius')?.value)===expected,r);
  await waitForRestaurant();
  const snapNow=await snap();
  assert.equal(Number(await page.locator('#radius').inputValue()),r);
  assert.equal(Number(snapNow.restaurantSearchOrigin?.lat),36.5298);
  const ids=snapNow.allRestaurantIds;
  assert.equal(new Set(ids).size,ids.length);
  const outOfRange=(await page.evaluate(()=>window.__DINLIMINATE_QA__?.snapshot())).restaurantPool;
  const expected=allResults.filter(x=>x.distance<=r).map(x=>x.id);
  assert.deepEqual(new Set(ids),new Set(expected));
  const searchUrl=requests.at(-1)||'';
  assert.equal(Number(new URL(searchUrl).searchParams.get('radius')),r);
  radiusRows.push({miles:r,count:ids.length,fastFood:ids.filter(id=>allResults.find(x=>x.id===id)?.fastFood).length,requestRadius:Number(new URL(searchUrl).searchParams.get('radius'))});
}
for(let i=1;i<radiusRows.length;i++)assert.ok(radiusRows[i].count>=radiusRows[i-1].count);
report["3_radius"].rows=radiusRows;
report["3_radius"].monotonic=true;
report["3_radius"].tested=radii;

// 4. Restaurant Search box: provider request plus local result presentation.
report["4_search_restaurants"]={};
await page.locator('#restaurantSearch').click(); await settle();
requests.length=0;
await page.locator('#restaurantQuery').fill('Mcdonalds');
await page.waitForTimeout(1000);
s=await snap();
assert.deepEqual(s.restaurantPool,['mcd']);
assert.ok(requests.some(u=>String(new URL(u).searchParams.get('q')||'').toLowerCase()==='mcdonalds'),'Typed query was not sent to provider search');
report["4_search_restaurants"].mcdonalds={matched:s.restaurantPool,providerQuery:requests.at(-1)};
await page.locator('#restaurantQuery').fill('burger'); await page.waitForTimeout(1000);
s=await snap();
assert.deepEqual(new Set(s.restaurantPool),new Set(['mcd','american']));
assert.ok(requests.some(u=>new URL(u).searchParams.get('q')==='burger'));
report["4_search_restaurants"].burger=s.restaurantPool;
await page.locator('#restaurantQuery').fill('mexican'); await page.waitForTimeout(1000);
s=await snap();
assert.deepEqual(s.restaurantPool,['taco']);
assert.ok(requests.some(u=>new URL(u).searchParams.get('q')==='mexican'));
report["4_search_restaurants"].mexican=s.restaurantPool;
await page.locator('#restaurantQuery').fill(''); await page.waitForTimeout(700);

// 5. Hours: Open/Unknown excludes explicit closed; All restores it; unknown remains.
report["5_open_all"]={};
await page.locator('#hoursToggle').click(); await settle();
s=await snap();
assert.equal((await page.locator('#hoursToggle').textContent()).trim(),'All');
assert.ok(s.restaurantPool.includes('closed'));
const allCount=s.restaurantPool.length;
await page.locator('#hoursToggle').click(); await settle();
s=await snap();
assert.equal((await page.locator('#hoursToggle').textContent()).trim(),'Open/Unknown');
assert.equal(s.restaurantPool.includes('closed'),false);
report["5_open_all"].allCount=allCount;
report["5_open_all"].openUnknownCount=s.restaurantPool.length;
report["5_open_all"].closedExcluded=true;
const unknown=allResults.find(x=>x.id==='asian');
const unknownState=await page.evaluate(row=>window.__DINLIMINATE_TEST__.restaurantHourState(row),unknown);
assert.equal(unknownState,'unknown');
report["5_open_all"].unknownPreserved=true;

// 6. All ten Quick Cuts: verify they render as photos and each toggled cut changes the active filter.
report["6_quick_cuts"]={};
const labels=['Fast Food','Burgers','Pizza','Mexican','American','Italian','Asian','BBQ','Seafood','Breakfast'];
assert.equal(await page.locator('#restQuick [data-rest-quick]').count(),10);
assert.deepEqual(await page.locator('#restQuick [data-rest-quick]').evaluateAll(els=>els.map(x=>x.textContent.trim())),labels);
assert.equal(await page.locator('#restQuick [data-rest-quick] .quick-chip-photo').count(),10);
const quickResults={};
for(const label of labels){
  const before=(await snap()).restaurantPool.length;
  await page.locator('[data-rest-quick="'+label+'"]').click();
  await settle();
  const after=await snap();
  const matching=after.restaurantPool;
  assert.ok(matching.length<before,'Quick Cut '+label+' did not narrow the active pool');
  quickResults[label]={beforeCount:before,remaining:matching,remainingCount:matching.length};
  await page.locator('[data-rest-quick="'+label+'"]').click();
  await settle();
  assert.equal((await snap()).restaurantPool.length,before,'Quick Cut '+label+' did not restore the pool when toggled off');
}
s=await snap();
assert.equal(await page.locator('#restQuick [data-rest-quick]').count(),10);
report["6_quick_cuts"].results=quickResults;
report["6_quick_cuts"].allRenderedWithPhotos=true;

// Reliability pass: five consecutive Refresh operations at the same location/radius.
requests.length=0;
for(let i=0;i<5;i++){
  await page.locator('#find').click();
  await waitForRestaurant();
}
assert.ok(requests.length>=5,'Five consecutive Refresh operations should each reach the restaurant endpoint');
report.repeatedRefreshes={attempts:5,searchRequests:requests.length};

assert.equal(pageErrors.length,0,'Browser page errors: '+JSON.stringify(pageErrors));
assert.equal(consoleErrors.length,0,'Browser console errors: '+JSON.stringify(consoleErrors));
assert.equal(badResponses.length,0,'HTTP errors: '+JSON.stringify(badResponses));
report.global={pageErrors,consoleErrors,badResponses,releaseBuild:release.build};
console.log(JSON.stringify(report,null,2));

await browser.close();
await new Promise(resolve=>server.close(resolve));
