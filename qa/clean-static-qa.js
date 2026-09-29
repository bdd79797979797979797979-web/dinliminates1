const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),foods=fs.readFileSync('data/foods.js','utf8'),api=fs.readFileSync('api/restaurants.js','utf8'),release=JSON.parse(fs.readFileSync('release.json','utf8')),releaseApi=fs.readFileSync('api/release.js','utf8'),releaseManifest=JSON.parse(fs.readFileSync('release-manifest.json','utf8'));
new vm.Script(foods);new vm.Script(app);new vm.Script(api);
for(const s of ['what sounds good tonight?','Choose a food','Find a restaurant','foodPassAround','restaurantPassAround','foodCut','foodMaybe','foodBack','foodHide','randomOne'])assert(html.includes(s),'missing HTML contract: '+s);
assert(html.includes('<script src="./data/foods.js"></script>') && html.includes('<script src="./app.js"></script>'),'clean app scripts must load synchronously in data-before-app order');
assert(!html.includes('defer'),'clean app should not defer its data/app runtime scripts');
for(const s of ['restaurantPoolFiltered','searchRestaurants','useLocation','restaurantBack','foodCut','foodMaybe','foodCuts','readImageFile','foodEditor','passSetup','passVote','passUndo'])assert(app.includes(s),'missing app contract: '+s);
for(const s of ['fast_food','restaurant',"mode==='search'","mode==='suggest'","mode==='resolve'","mode==='reverse'",'r14'])assert(api.includes(s),'missing API contract: '+s);
assert(!app.includes("document.createElement('style')"),'app should not construct stylesheet builders');
assert(app.includes("S.winnerType"),'winner type must be persisted explicitly');
assert(app.includes('editFoodRecipe') && app.includes('editFoodFile') && app.includes('readImageFile'),'custom food recipe/photo upload support is required');
assert(app.includes('editQuickCut') && app.includes('quickCuts'),'Custom foods must support multiple Quick Cut groups');
assert(app.includes('data-food-edit') && app.includes('data-food-delete') && app.includes('data-setting-food-delete'),'food edit/delete support is required');
assert(app.includes('S.deleted'),'deleted-food persistence is required');
assert(app.includes('legacyKeys') && app.includes('cutPrimary'),'Persisted state migration must retire legacy fields');
console.log('Dinliminate clean static QA: PASS');
console.log('HTML bytes:',html.length,'APP bytes:',app.length,'FOODS bytes:',foods.length,'API bytes:',api.length);

assert(html.includes('foodNextCard'),'Food Tinder card stack must be present in the base DOM');
assert(app.includes('restaurantNextCard') && app.includes('restaurant-card-stack'),'Restaurant Tinder card stack must be rendered dynamically');
assert(app.includes('next-card'),'App must implement shared next-card swipe presentation');
assert(!html.includes('allCut') && !html.includes('All Cut') && !/\ballCut\s*(?:=|onclick)/.test(app),'All Cut must stay removed from the current UI; legacy migration support may remain');
assert(!html.includes('bottom-nav') && !html.includes('id="bottomNav"'),'Legacy bottom navigation must stay removed');
assert(html.includes('swipe-actions') && html.includes('round-action'),'Decision controls must use the card-first circular action structure');
assert(html.includes('round-cut') && html.includes('round-maybe') && html.includes('round-back') && html.includes('round-hide'),'All four decision actions must remain wired');
assert(html.includes('class="decision-bar"'),'Food/Restaurant must use local compact decision bars');
assert(html.includes('id="foodBackTop"') && html.includes('id="foodMenu"'),'Food local Back/Menu controls must be present');
assert(html.includes('id="restaurantBackTop"') && html.includes('id="restaurantMenu"'),'Restaurant local Back/Menu controls must be present');
assert(html.includes('id="foodCount"') && html.includes('id="restaurantCount"'),'Choice counts must be present on the Quick Cuts rows');
assert(!/<span>FOOD<\/span>/.test(html) && !/<span>RESTAURANTS<\/span>/.test(html),'Standalone FOOD/RESTAURANTS header labels must stay removed');
assert(html.includes('id="foodDetails"') && html.includes('details-icon') && /detailsSheet\(item,\s*['"]food['"]\)/.test(app),'Food card Details must open the full Details sheet');
assert(app.includes('id="restDetails"') && app.includes("detailsSheet(current, 'restaurant')"),'Restaurant card Details must open the full Details sheet');
assert(!app.includes("$('globalBack').onclick"),'Removed global Back must not be referenced');
assert(!app.includes("$('restWebsite').onclick"),'Removed stale Restaurant website binding must not be referenced');
assert(app.includes("e.target.closest?.('button,a,input,select')") || app.includes("e.target.closest('button,a,input,select')"),'Swipe handlers must ignore interactive controls');
assert(css.includes('round-cut') && css.includes('background:#ef3340'),'Cut must remain a red primary action');
assert(css.includes('round-maybe') && css.includes('background:#28c76f'),'Maybe must remain a green primary action');
assert(css.includes('max-height:61svh') && css.includes('max-height:57svh'),'Decision cards must remain large on desktop and iPhone');
assert(css.includes('flex:1;height:25px'),'Restaurant Search/Hours controls must remain compact');
assert(css.includes('.location-strip{margin-top:3px'),'Restaurant location strip must remain compact');
assert(foods.includes('window.DINLIMINATE_FOODS=') && (foods.match(/"id":/g)||[]).length===64,'The Build 119 food deck must contain exactly 64 foods');
const dataJson=foods.slice(foods.indexOf('=')+1).trim().replace(/;\s*$/,'');
const foodRows=JSON.parse(dataJson);
assert(foodRows.length===64,'Food deck must contain exactly 64 foods');
assert(foodRows.every(x=>x.image && x.ingredients?.length && x.nutrition && x.quickCuts?.length && x.recipe),'Every restored food must have photo, ingredients, nutrition, Quick Cut mapping, and recipe details');
for(const name of ['Mexican Stir Fry','Meatloaf & Mashed Potatoes','Beef Stroganoff','Fried Rice','Pot Roast','Pork Chops','Potato Soup','Cheerios Cereal','Fish Sticks']) assert(foodRows.some(x=>x.name===name),'Missing restored food: '+name);
const steak=foodRows.find(x=>x.id==='steak-potato'), potato=foodRows.find(x=>x.id==='loaded-baked-potato');
assert(!steak.quickCuts.includes('Potato'),'Steak & Potato must not be a Potato Quick Cut');
assert(potato.quickCuts.includes('Potato'),'Loaded Baked Potato must be a Potato Quick Cut');
const popcorn=foodRows.find(x=>x.id==='popcorn'), stir=foodRows.find(x=>x.id==='stir-fry');
assert(popcorn?.image?.includes('pexels-photo-6422042.jpeg'),'Popcorn must use a popcorn photo');
assert(stir?.image?.includes('photos/31673757/'),'Mexican Stir Fry must use an accurate Mexican stir-fry photo');
assert(api.includes("mode==='search'") && api.includes("mode==='suggest'") && api.includes("mode==='resolve'"), 'Restaurant API contract must exist');
assert(api.includes('amenity:restaurant') && api.includes('amenity:fast_food'),'Restaurant search should use tagged Photon coverage plus restaurant/fast-food discovery');
assert(api.includes('TARGETED_FAST') && api.includes('slice(0,4)'),'Fast-food fallback should be bounded to four targeted requests');
assert(releaseApi.includes("require('../release.json')") && releaseApi.includes('String(release.build)'),'Release endpoint must use release.json as source of truth');
assert.equal(releaseManifest.build,String(release.build),'Release manifest must match release.json build');
assert.equal(releaseManifest.sourceBranch,release.sourceBranch,'Release manifest must identify the release branch');
console.log('Dinliminate CP108 static QA: PASS');
console.log('HTML bytes:',html.length,'APP bytes:',app.length,'FOODS bytes:',foods.length,'API bytes:',api.length);

assert(html.includes('food-choice') && html.includes('restaurant-choice'),'Home choices must be photo-backed');
assert(!html.includes('home-photo-rail'),'Standalone Home food photo rail must stay removed');
assert(css.includes('.luxury-home h1{max-width:calc(100% - 16px)'),'Home headline must stay inside the iPhone viewport');
assert(css.includes('font-size:clamp(2rem,8.1vw'),'Home headline must stay compact on iPhone');
assert(css.includes('.luxury-home .home-card-photo{'),'Home choice cards must use dedicated photo backgrounds');
assert(!html.includes('Made by Brian Dunn for Devona Dunn'),'Front page should not show attribution text');
assert(!html.includes('Continue saved round'),'Front page should not show a Continue saved round button');
assert(html.includes('id="backToStart"'),'Menu must include Back to Start');
assert(html.includes('id="celebration"'),'Winner must include celebration layer');
assert(!html.toLowerCase().includes('clean rebuild'),'HTML should not mention build-internal wording');
assert(app.includes("const randomCutOne()") || app.includes("function randomCutOne()"),'Random Cut One handler must exist');
assert(app.includes("if (!S.pool.length) return;") && !app.includes("if (S.pool.length < 2) return;"),'Random Cut One must operate when one choice remains');
assert(app.includes("HUNGRY ☹") && app.includes("HUNGRY_IMAGE"),'Last-choice Cut must use the Hungry frown state');
assert(app.includes("classList.toggle('hungry-image', hungry)"),'Hungry winner must use the dedicated artwork class');
assert(app.includes("const APP_VERSION = '1.0'") && new RegExp("APP_BUILD\\s*=\\s*['\\\"]"+String(release.build)+"['\\\"]").test(app) && String(release.build)==='119','About must expose the current app version/build');
assert(app.includes('function appConfirm'),'professional confirmation modal contract missing');
assert(app.includes("aria-labelledby",0) && app.includes("aria-modal"),'Generic modals must expose labelled dialog semantics');
assert(app.includes('localClockForZone'),'timezone-aware opening-hours helper is required');
assert(app.includes('restaurantSearchDegraded'),'degraded-search state is required');
assert(app.includes('resetRound') && app.includes('systemRestoreFlow') && app.includes('resetAppDataFlow'),'round reset, System Restore, and full app-data reset must be separated');
assert(app.includes('safeExternalUrl'),'external restaurant URLs must be protocol-validated');
assert(app.includes('storageWarning'),'storage failure state is required');
assert(app.includes('card-phone') && app.includes('card-card-action'),'restaurant card phone/action contract missing');
assert(app.includes("serviceWorker.register('./sw.js')"),'service worker registration contract missing');
const sw=fs.readFileSync('sw.js','utf8'); assert(sw.includes("'./icon-512.png'") && sw.includes("'./apple-touch-icon.png'"),'Offline shell must cache both PWA raster icons');
assert(html.includes('apple-touch-icon.png'),'iOS touch icon contract missing');
assert((html.match(/id="offlineIndicator"/g)||[]).length===1,'offline indicator must be unique');
assert((html.match(/id="restaurantPassAround"/g)||[]).length===1,'Restaurant Pass Around must have one compact tool-row control');
assert(!html.includes('id="newCat"'),'legacy Add Food category control must be removed');
assert(app.includes('Intl.DateTimeFormat'),'About date should be generated from the current date');
assert(css.includes('#aboutModal .about-test') && css.includes('color:#bfa16b'),'About test build label should be gold');
assert(app.includes("btn.textContent=openMode?'Open/Unknown':'All'") && app.includes("S.hoursMode==='openUnknown'?'all':'openUnknown'"),'Hours toggle must use Open/Unknown and All');
assert(app.includes("S.hoursMode==='openUnknown'?'all':'openUnknown'") || app.includes("S.hoursMode = S.hoursMode === 'openUnknown' ? 'all' : 'openUnknown'"),'Hours toggle must alternate between Open/Unknown and All');
for(const label of ['Southern','Pasta','Asian','Mexican','Pork','Soup/Stew','Healthy','Breakfast','American','Greek','Snack','Potato']) {
  const key = label.includes(' ') || label.includes('/') ? "'"+label+"':" : label+':';
  assert(app.includes(key),'Food Quick Cut photo mapping must include '+label);
}
for(const label of ['American','Fast Food','Mexican','Asian','Pasta','Southern','Healthy','Soup/Stew','Potato','Greek','Pork','BBQ']) {
  const key = label.includes(' ') || label.includes('/') ? "'"+label+"':" : label+':';
  assert(app.includes(key),'Restaurant Quick Cut photo mapping must include '+label);
}
assert(app.includes('restaurant-detail-grid') && app.includes('Distance') && app.includes('Address'),'Restaurant Details must expose richer information');
assert(app.includes('Typical nutrition') && app.includes('Ingredients'),'Food Details must expose nutrition and ingredients');

assert(app.includes("if (label === 'Potato')") && app.includes("Array.isArray(row.menuItems)"),'Restaurant Potato Quick Cut must use menu-aware matching');

assert(!app.includes('Clean rebuild') && !app.includes('clean rebuild'),'App source should not mention build-internal wording');
assert(app.includes('foodMaybeRound') && app.includes('S.foodMaybeRound=true'),'Food Maybe choices must recycle into a second narrowing pass');
assert(app.includes('restaurantMaybeRound') && app.includes('S.restaurantMaybeRound=true'),'Restaurant Maybe choices must recycle into a second narrowing pass');
assert(app.includes('right to Keep'),'Right swipe must communicate Keep semantics');
assert(!app.includes("if (S.pool.length === 1) winner(S.pool[0]);"),'Food must not auto-win at one remaining choice');

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(fs.existsSync('icon-512.png'),'512px PWA icon asset is required');
assert(fs.existsSync('apple-touch-icon.png'),'180px iOS icon asset is required');
assert(manifest.icons.some(x=>x.src==='./icon-512.png'&&x.sizes==='512x512'),'manifest must declare the 512px PNG icon');
assert(manifest.icons.some(x=>x.src==='./apple-touch-icon.png'&&x.sizes==='180x180'),'manifest must declare the 180px iOS PNG icon');
assert(manifest.id==='./'&&manifest.scope==='./'&&manifest.orientation==='portrait','manifest PWA identity/orientation contract must be stable');
const vercelConfig=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const globalHeaders=vercelConfig.headers?.find(x=>x.source==='/(.*)')?.headers||[];
assert(globalHeaders.some(x=>x.key==='Content-Security-Policy'),'Vercel CSP header is required');
assert(globalHeaders.some(x=>x.key==='Permissions-Policy'&&String(x.value).includes('geolocation=(self)')),'Vercel geolocation Permissions-Policy is required');
assert(!globalHeaders.some(x=>x.key==='Cache-Control'&&x.value==='no-store'),'Global no-store must not disable API edge caching');

assert(!app.includes('s.wsj.net') && !app.includes('photos.zillowstatic.com') && !app.includes('pub-ba1a74be17d7442a9f2541946eb9510e.r2.dev'),'unstable restaurant image hosts must not be used for production fallbacks');

assert.equal(vercelConfig.functions['api/restaurants.js'].maxDuration,30,'Restaurant API maxDuration should be 30 seconds');

assert(!html.includes('id="privacy"'),'Privacy must not remain a top-level drawer item');
assert(app.includes('privacyFromAbout') && app.includes("privacyView()"),'Privacy must be reachable from the About modal');
assert(app.includes('CURRENT BUILD'),'About must label the build as Current Build');
assert(app.includes("S.pool.length===1") && app.includes("winner(item)"),'Final Food choice must enter Winner instead of Hungry');
assert(app.includes('restaurantWebsiteUrl') && app.includes('google.com/search'),'Restaurant Website must have a Google fallback');
assert(app.includes('id="restDetails"') && app.includes('icon-action') && app.includes('details-icon'),'Restaurant Details must use the professional icon button');
assert(app.includes("pass-surface") && !app.includes("openModal('passModal"),'Pass Around must use the full-page swipe surface instead of a voting modal');
assert(app.includes('quick-chip-photo'),'Food and Restaurant Quick Cuts must render real image elements');
assert(css.includes('.luxury-home h1{max-width:12em'),'Home title must be allowed to wrap fully on iPhone');
assert(app.includes('function appDiagnosisView'),'Settings must expose the App Diagnosis panel');
assert(app.includes('id="appDiagnosis"') && app.includes('appDiagnosisView'),'Settings must include an App Diagnosis launcher');
assert(app.includes('diagnosisRestaurantDuplicates'),'App Diagnosis must detect possible restaurant duplicates in the loaded pool');
assert(app.includes('restaurantWebsiteUrl'),'Restaurant diagnosis must include website fallback support');
assert(app.includes('Browser certification'),'App Diagnosis must distinguish browser certification from code-level feature wiring');
assert(app.includes('Runtime release identity'),'App Diagnosis must report runtime release identity');
assert(app.includes('Viewport overflow'),'App Diagnosis must report actual viewport overflow');
assert(app.includes('Browser certification'),'App Diagnosis must distinguish browser certification from code-level feature wiring');
assert(app.includes('FINAL_FOOD_IMAGE')&&app.includes('FINAL_RESTAURANT_IMAGE'),'Resilient local image fallbacks are required');
assert(app.includes('restaurantChoiceIndex')&&app.includes('foodChoiceIndex'),'Maybe choices must remain in the count while card progression uses separate eligibility');
assert(css.includes('.settings-system-action.restore-action{background:#5b3fb3'),'System Restore must use a unique color');
assert(css.includes('.home-card-photo .home-photo-img{'),'Home images must render as image elements');
assert(app.includes('diagnosisRefresh')&&app.includes('Run again'),'App Diagnosis must have a stable rerunnable control');

assert(foods.includes('"id":"vegetable-lasagna"')&&foods.includes('"id":"salisbury-steak"')&&foods.includes('"id":"stuffed-peppers"')&&!foods.includes('"id":"frozen"'),'Requested food additions/removal must be present');

assert(/Food catalog contract/.test(app)&&/Food image catalog/.test(app),'App Diagnosis must provide actionable food catalog/image checks');

assert(css.includes('.icon-action{')&&css.includes('.details-icon{'),'Details must use a professional icon button');
