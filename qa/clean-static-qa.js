const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const foodsSource=fs.readFileSync('data/foods.js','utf8');
const taxonomy=fs.readFileSync('data/restaurant-taxonomy.js','utf8');
const api=fs.readFileSync('api/restaurants.js','utf8');
const release=JSON.parse(fs.readFileSync('app-release.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('release-manifest.json','utf8'));
const releaseApi=fs.readFileSync('api/release.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');

new vm.Script(foodsSource); new vm.Script(app); new vm.Script(api); new vm.Script(fs.readFileSync('api/image.js','utf8').replace('export default async function handler','async function handler')); new vm.Script(fs.readFileSync('api/restaurant-photo.js','utf8'));

assert.equal(release.build,707,'Current release must be Build 707');
assert.equal(release.checkpoint,'CP707','Current release checkpoint must be CP707');
assert.equal(manifest.build,707,'Release manifest build must be 707');
assert.equal(manifest.checkpoint,'CP707','Release manifest checkpoint must be CP707');
assert.equal(manifest.sourceBranch,release.sourceBranch,'Release manifest branch must match app-release');
assert.ok(releaseApi.includes("require('../app-release.json')"),'Vercel release endpoint must use app-release.json');
assert.ok(!releaseApi.includes("require('../release.json')"),'Obsolete release.json must not be referenced');

assert.ok(html.includes('Dinner Decisions Simplified'),'Home title must remain current');
assert.ok(html.includes('Beautifully swipe until it’s revealed.'),'Selected Home tagline must be current');
assert.ok(html.includes('id="addToPhone"')&&html.includes('id="shareApp"'),'Home Add and Share controls must both exist');
assert.ok(html.includes('app.js?v=674'),'App cache-busting query must be current');
assert.ok(!html.includes('id="restaurantSearch"')&&!html.includes('id="hoursToggle"'),'Restaurant Search and Open/All controls must remain hidden for now');
assert.ok(html.includes('id="restaurantQuery"')&&html.includes('id="restaurantSearchBox"'),'Hidden Restaurant search implementation may remain available for later re-exposure');

assert.ok(app.includes("let APP_BUILD = '707'"),'Offline release fallback must be current');
assert.ok(app.includes('function bindSwipeCard')&&app.includes('requestAnimationFrame'),'Swipe engine must use the current stabilized motion path');
assert.ok(app.includes("bindCardButton('restMaybe'")&&app.includes("bindCardButton('restCut'"),'Restaurant decision buttons must use the protected binding');
assert.ok(app.includes('detailNoteEdit')&&app.includes('detailNotesDelete'),'Per-note Edit and delete controls must be wired');
assert.ok(app.includes("delete S.notes['food:'+id];saveItemNotes();")&&!app.includes("saveItemNotes();delete S.notes['food:'+id];saveItemNotes();"),'Custom meal delete must not duplicate note deletion');
assert.ok(app.includes('const runtimeBuild=String(d?.build||\'\');'),'Diagnosis must compare runtime release metadata dynamically');
assert.ok(!app.includes("==='701'")&&!app.includes("cp701-app-diagnosis-refresh"),'Diagnosis must not hardcode CP701 release identity');

const foodsMatch=foodsSource.match(/window\.DINLIMINATE_FOODS\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
assert(foodsMatch,'Food data must expose the current global catalog');
const foods=JSON.parse(foodsMatch[1]);
assert.equal(foods.length,116,'Built-in meal catalog must contain 116 meals');
assert.equal(new Set(foods.map(x=>x.id)).size,116,'Built-in meal IDs must be unique');
assert.equal(new Set(foods.map(x=>x.name)).size,116,'Built-in meal names must be unique');
assert(foods.every(x=>x.image&&x.ingredients?.length&&x.nutrition&&x.quickCuts?.length&&x.recipe),'Every built-in meal must have complete Details data');
assert.equal(foods.filter(x=>x.quickCuts?.includes('Pork')).length,0,'Food Pork Quick Cut must remain removed');
for(const name of ['Lasagna','Vegetable Lasagna','Salisbury Steak','Stuffed Peppers','Health Shake','White Fish','Chicken Pot Pie','BLT','Reuben','Hot Dog','Corn Dog','Orange Chicken','Chicken Teriyaki','Sushi','Pancakes','Omelet','Oatmeal','Shrimp','Crab Cakes','Gumbo','Chicken Nuggets','Ramen','Pimento Cheese Sandwich','Liver & Onions','Enchiladas','Fish Sticks','Protein Bar']) assert(foods.some(x=>x.name===name),'Missing current meal: '+name);

assert.ok(taxonomy.includes('Fast Food')&&taxonomy.includes('Burgers')&&taxonomy.includes('Pizza'),'Restaurant taxonomy must include current Quick Cuts');
assert.ok(api.includes("const API_VERSION='r25'"),'Restaurant API must be r25');
assert.ok(api.includes('MAX_RADIUS=100'),'Restaurant API must cap radius at 100 miles');
assert.ok(api.includes('process.env.GOOGLE_PLACES_API_KEY')&&api.includes('process.env.GOOGLE_MAPS_API_KEY'),'Google Places support must remain optional, not required');
assert.ok(api.includes('Photon')||api.includes('photon'),'No-credential discovery must retain non-Google providers');

assert.ok(sw.includes("const CACHE='dinliminate-shell-v674'"),'Service-worker shell cache must be advanced beyond v668');
assert.ok(sw.includes("'./app-release.json'")&&sw.includes("'./release-manifest.json'"),'Service worker must cache release metadata');
assert.ok(css.includes('.luxury-home .home-icon-action')&&css.includes('.restaurant-card-utility'),'Premium Home and Restaurant utility styles must exist');
assert.ok(css.includes('min-height:44px')&&css.includes('height:44px'),'Current utility hit-area rules must include 44px targets');

assert.ok(!html.includes('Pass Around')&&!app.includes('Pass Around')&&!app.includes('passAround'),'Pass Around must remain absent from active UI/runtime');
assert.ok(!html.includes('All Cut')&&!html.includes('allCuts*='),'All Cut must remain absent');

console.log('Dinliminate CP707 static QA: PASS');
console.log(JSON.stringify({build:release.build,checkpoint:release.checkpoint,foods:foods.length,api:'r25',swCache:'v674',hiddenRestaurantSearch:true,hiddenOpenAll:true}));