const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),foods=fs.readFileSync('data/foods.js','utf8'),api=fs.readFileSync('api/restaurants.js','utf8'),imageApi=fs.readFileSync('api/image.js','utf8'),photoApi=fs.readFileSync('api/restaurant-photo.js','utf8'),release=JSON.parse(fs.readFileSync('release.json','utf8')),releaseApi=fs.readFileSync('api/release.js','utf8'),releaseManifest=JSON.parse(fs.readFileSync('release-manifest.json','utf8'));
// CP448 restaurant regression contracts
assert(app.includes("function bindCardButton(id,handler)"),'Restaurant decision controls require the shared bindCardButton helper');
assert(app.includes("bindCardButton('restDetails', () => detailsSheet(current,'restaurant'))"),'Restaurant Details must use the shared protected button binding');
assert(app.includes("bindRestaurantSwipe(current)"),'Restaurant swipe binding must remain after button binding');
assert(html.includes('<section class="screen hidden decision-screen restaurant" id="restaurant">'),'Restaurant screen must expose the .restaurant scope used by premium restaurant controls');
assert(html.includes('app.js?v=532'),'App script must use the current CP532/Build 197 cache-busting query');
assert(release.build===197 && release.checkpoint==='CP487' && release.sourceBranch==='cp466-restaurant-identity-final-2026-09-30','release.json must identify the current Build 197 / CP487 candidate');
assert(css.includes('#restaurant .find{') && css.includes('#restaurant .round-cut{') && css.includes('#restaurant .round-maybe{'),'Restaurant control styling must be hard-scoped and explicit');

new vm.Script(foods);new vm.Script(app);new vm.Script(api);new vm.Script(imageApi.replace('export default async function handler','async function handler'));new vm.Script(photoApi);
for(const s of ['Dinner Simplified','Choose a meal','Find a restaurant','foodCut','foodChoose','foodMaybe','foodBack','foodHide'])assert(html.includes(s),'missing HTML contract: '+s); assert(app.includes("if($('foodChoose'))$('foodChoose').onclick=()=>winner(item);"),'Food Choose must open the existing winner flow'); assert(app.includes("bindCardButton('restChoose', () => winner(current));"),'Restaurant Choose must open the existing winner flow');
assert(html.includes('<script src="./data/foods.js"></script>') && /<script src="\.\/app\.js(?:\?v=\d+)?"><\/script>/.test(html),'clean app scripts must load synchronously in data-before-app order');
assert(!html.includes('defer'),'clean app should not defer its data/app runtime scripts');
for(const s of ['restaurantPoolFiltered','searchRestaurants','useLocation','restaurantBack','foodCut','foodMaybe','foodCuts','readImageFile','foodEditor'])assert(app.includes(s),'missing app contract: '+s);
for(const s of ['fast_food','restaurant',"mode==='search'","mode==='suggest'","mode==='resolve'","mode==='reverse'",'r22'])assert(api.includes(s),'missing API contract: '+s);
assert(!app.includes("document.createElement('style')"),'app should not construct stylesheet builders');
assert(app.includes("S.winnerType"),'winner type must be persisted explicitly');
assert(app.includes("const DEFAULT_FOOD_IMAGE = 'https://images.pexels.com/photos/16365767/pexels-photo-16365767.jpeg?auto=compress&cs=tinysrgb&w=1800';"),'Added meals must have a dedicated default food image.');
assert(app.includes("let photo=$('editFoodPhoto').value.trim()||DEFAULT_FOOD_IMAGE"),'Meals saved without an uploaded photo must use the default food image.');
assert(app.includes('else item.image=DEFAULT_FOOD_IMAGE;'),'Missing stored custom photos must recover to the default food image.');
assert(css.includes('#manageFoodsModal .manage-delete'),'Custom meal Delete action must have premium destructive styling');
assert(app.includes('editFoodRecipe') && app.includes('editFoodFile') && app.includes('readImageFile'),'custom food recipe/photo upload support is required');
assert(app.includes('Cuisine &amp; Quick Cuts')&&app.includes('class="quick-cut-editor meal-category-editor"'),'Food editor must present a single shared Cuisine & Quick Cuts field');
assert(!app.includes('id="editFoodCat"'),'Food editor must not retain a separate duplicate Cuisine selector');
assert(app.includes('const preferred=item?.category&&quickCuts.includes(item.category)?item.category:quickCuts[0]'),'The first/primary selected category must define the stored meal category');
assert(app.includes('editQuickCut') && app.includes('quickCuts'),'Custom foods must support multiple Quick Cut groups');
assert(app.includes('data-food-edit') && app.includes('editQuickCut') && app.includes('data-food-delete') && !app.includes('data-setting-food-delete'),'Food management must use Edit plus Hide/Restore, with Delete available only for added custom meals.');
assert(app.includes('S.deleted'),'deleted-food persistence is required');
assert(app.includes('legacyKeys') && app.includes('cutPrimary'),'Persisted state migration must retire legacy fields');
assert(app.includes('restaurantSearchOrigin'),'Restaurant search origin must be persisted for radius expansion behavior');
assert(app.includes("$('radius').addEventListener('change'"),'Radius changes must automatically trigger a restaurant refresh');
assert(app.includes('renderFindButton') && app.includes("S.location?'Refresh':'Find'"),'Find control must act as Refresh once a location is selected');
assert(app.includes("if(row&&typeof row.openNow==='boolean')return row.openNow?'open':'closed';"),'Hours filtering must honor provider current open state when available');
assert(api.includes("currentOpeningHours.openNow") && api.includes('openNow'),'Restaurant API must request and preserve current opening status');
assert(api.includes("function googleSearchPlaces") && api.includes("textQuery:termVariant+' restaurant'"),'Restaurant provider-backed search must use shared taxonomy provider variants for non-empty queries');
assert(api.includes('searchQueryMany') && api.includes('cuisine~') && api.includes('brand~'),'Restaurant provider-backed fallback must search OSM name, brand, operator, and cuisine');
assert(api.includes("searchTerm=normalizeSearchQuery(q.get('q')||'')") && api.includes("+':'+searchTerm,hit=cache.get(key)"),'Restaurant API search cache must vary by search query');
assert(app.includes("const searchTerm = String(S.restaurantQuery||'').trim().slice(0,100);") && app.includes("searchTerm ? '&q='+encodeURIComponent(searchTerm) : ''"),'Restaurant Search box must send its query to the restaurant API');
assert(app.includes('scheduleRestaurantProviderSearch') && app.includes("setTimeout(()=>{searchRestaurants();},650)"),'Restaurant Search box must trigger provider-backed search after typing settles');
assert(api.includes('normAddress') && api.includes('sameRestaurant'),'Restaurant dedupe must normalize provider address variants and compare venue identity');
assert(app.includes('fetchRestaurantEndpoint') && app.includes('attempt<2'),'Restaurant endpoint retry protection must be present');
assert(app.includes('function invalidateAddressSuggestions()') && app.includes('suggestController?.abort()'),'Address search must abort stale in-flight suggestion requests before starting a new location search.');
assert(app.includes('function addressLooksComplete(value)') && app.includes('chooseAddressSuggestion(0)'),'Enter Address must distinguish complete-looking input from partial input with visible suggestions.');
assert(app.includes("aria-activedescendant") && app.includes("addressSuggestion-"),'Address suggestions must expose keyboard active-descendant semantics.');
assert(app.includes('function setLocationBusy(busy)') && app.includes("btn.setAttribute('aria-label',busy?'Getting your location…':'Use My Location')"),'Use My Location must expose a busy/disabled state while location acquisition is active.');
assert(app.includes('let locationRequestActive = false') && app.includes('if(locationRequestActive)return;'),'Use My Location must prevent overlapping location acquisition requests.');
assert(app.includes('function reverseLocationLabel') && app.includes('setTimeout(()=>ctl.abort(),5000)'),'Reverse geocoding must have a bounded client timeout with raw-coordinate fallback.');
assert(app.includes("enableHighAccuracy:true,timeout:10000,maximumAge:0") && app.includes('moved>=0.1'),'Use My Location must request a fresh high-accuracy fix and only re-search when the new fix materially differs.');
assert(app.includes("if(S.locationSource==='device' && S.location)S.locationSource='last'") && app.includes("last:'Last used location'"),'Persisted device locations must be labeled as last-used rather than freshly confirmed.');

assert(app.includes('const deadline=setTimeout(()=>{timedOut=true;restaurantSearchController.abort()},14500)'),'Restaurant search client timeout should remain bounded');
assert(api.includes('const SEARCH_BUDGET_MS=12000') && api.includes('const WIDE_DISCOVERY_RESERVE_MS=4500'),'Restaurant search reliability budget contract must be present');
assert(api.includes('const MAX_SEARCH_PER_MINUTE=60') && api.includes("mode!=='search'&&rate(req,mode)"),'Restaurant search rate limiter should tolerate normal interactive use and spare cached hits');
assert(api.includes('const discoveryPromise=wideSearch||searchTerm'),'Provider-backed discovery must start concurrently with primary restaurant providers');
console.log('Dinliminate clean static QA: PASS');
console.log('HTML bytes:',html.length,'APP bytes:',app.length,'FOODS bytes:',foods.length,'API bytes:',api.length);

assert(html.includes('foodNextCard'),'Food Tinder card stack must be present in the base DOM');
assert(app.includes('restaurantNextCard') && app.includes('restaurant-card-stack'),'Restaurant Tinder card stack must be rendered dynamically');
assert(app.includes('next-card'),'App must implement shared next-card swipe presentation');
assert(!html.includes('allCut') && !html.includes('All Cut') && !/\ballCut\s*(?:=|onclick)/.test(app),'All Cut must stay removed from the current UI; legacy migration support may remain');
assert(!html.includes('Pass Around') && !app.includes('Pass Around') && !app.includes('passAround'),'Pass Around must remain absent from the active UI and runtime.');
assert(!html.includes('bottom-nav') && !html.includes('id="bottomNav"'),'Legacy bottom navigation must stay removed');
assert(html.includes('swipe-actions') && html.includes('round-action'),'Decision controls must use the card-first circular action structure');
assert(html.includes('round-cut') && html.includes('round-maybe') && html.includes('round-back') && html.includes('round-hide'),'All four decision actions must remain wired');
assert(html.includes('class="decision-bar"'),'Food/Restaurant must use local compact decision bars');
assert(html.includes('id="foodBackTop"') && html.includes('id="foodMenu"'),'Food local Back/Menu controls must be present');
assert(html.includes('id="restaurantBackTop"') && html.includes('id="restaurantMenu"'),'Restaurant local Back/Menu controls must be present');
assert(html.includes('id="foodCount"') && html.includes('id="restaurantCount"'),'Choice counts must be present on the Quick Cuts rows');
assert(!/<span>FOOD<\/span>/.test(html) && !/<span>RESTAURANTS<\/span>/.test(html),'Standalone FOOD/RESTAURANTS header labels must stay removed');
assert(html.includes('id="foodDetails"') && html.includes('details-icon') && app.includes("detailsSheet(item,'food')"),'Food card Details must use the crisp icon and open the full Details sheet');
assert(app.includes('cardDetailsAction') && app.includes("bindCardButton('restDetails', () => detailsSheet(current,'restaurant'))"),'Restaurant card Details must use the protected binding and open the full Details sheet');
assert(!app.includes("$('globalBack').onclick"),'Removed global Back must not be referenced');
assert(!app.includes("$('restWebsite').onclick"),'Removed stale Restaurant website binding must not be referenced');
assert(app.includes("e.target.closest('button,a,input,select')") || app.includes("e.target.closest?.('button,a,input,select')"),'Swipe handlers must ignore interactive controls');
assert(css.includes('round-cut') && css.includes('background:#ef3340'),'Cut must remain a red primary action');
assert(css.includes('round-maybe') && css.includes('background:#28c76f'),'Maybe must remain a green primary action');
assert(css.includes('max-height:61svh') && css.includes('max-height:57svh'),'Decision cards must remain large on desktop and iPhone');
assert(css.includes('flex:1;height:25px'),'Restaurant Search/Hours controls must remain compact');
assert(css.includes('.location-strip{margin-top:3px'),'Restaurant location strip must remain compact');
assert(foods.includes('window.DINLIMINATE_FOODS=') && (foods.match(/"id":/g)||[]).length===116,'The current 116-food deck must be present');
const dataJson=foods.slice(foods.indexOf('=')+1).trim().replace(/;\s*$/,'');
const foodRows=JSON.parse(dataJson);
assert(foodRows.length===116,'Food deck must contain exactly 116 foods');
assert(foodRows.every(x=>x.image && x.ingredients?.length && x.nutrition && x.quickCuts?.length && x.recipe),'Every restored food must have photo, ingredients, nutrition, Quick Cut mapping, and recipe details');
for(const name of ['Fajitas','Meatloaf & Mashed Potatoes','Beef Stroganoff','Fried Rice','Pot Roast','Pork Chops','Potato Soup','Cereal','Fish Sticks','Health Shake','Lasagna','Vegetable Lasagna','Salisbury Steak','Stuffed Peppers','Chicken Pot Pie','BLT','Reuben','Hot Dog','Corn Dog','Nachos','Orange Chicken','Chicken Teriyaki','Sushi','Pancakes','Omelet','Oatmeal','Shrimp','Crab Cakes','Gumbo','Chicken Nuggets','Ramen','Pimento Cheese Sandwich','Ice Cream','Protein Bar','Candy Bar','Banana','Apple']) assert(foodRows.some(x=>x.name===name),'Missing restored food: '+name);
const steak=foodRows.find(x=>x.id==='steak-potato'), potato=foodRows.find(x=>x.id==='loaded-baked-potato');
assert(!steak.quickCuts.includes('Potato'),'Steak & Potato must not be a Potato Quick Cut');
assert(potato.quickCuts.includes('Potato'),'Loaded Baked Potato must be a Potato Quick Cut');
assert(foodRows.filter(x=>x.quickCuts?.includes('Pork')).length===0,'No built-in food should retain the removed Pork Quick Cut');
assert.deepEqual(foodRows.find(x=>x.id==='homemade-pizza')?.quickCuts,['Italian']);
assert.deepEqual(foodRows.find(x=>x.id==='meatball-subs')?.quickCuts,['Italian']);
assert.deepEqual(foodRows.find(x=>x.id==='sausage-peppers')?.quickCuts,['Italian']);
assert.deepEqual(foodRows.find(x=>x.id==='pork-chops')?.quickCuts,['Southern']);
assert.deepEqual(foodRows.find(x=>x.id==='pork-tenderloin')?.quickCuts,['Southern']);
assert.deepEqual(foodRows.find(x=>x.id==='white-fish')?.quickCuts,['Healthy']);
assert.deepEqual(foodRows.find(x=>x.id==='biscuits-gravy')?.quickCuts,['Breakfast','Southern']);
assert.equal(foodRows.find(x=>x.id==='mashed-potatoes')?.name,'Mashed Potatoes');
assert.ok(foodRows.find(x=>x.id==='white-fish')?.ingredients?.length && foodRows.find(x=>x.id==='white-fish')?.nutrition && foodRows.find(x=>x.id==='white-fish')?.recipe);
assert.ok(foodRows.find(x=>x.id==='pork-tenderloin')?.ingredients?.length && foodRows.find(x=>x.id==='pork-tenderloin')?.nutrition && foodRows.find(x=>x.id==='pork-tenderloin')?.recipe);
const popcorn=foodRows.find(x=>x.id==='popcorn'), stir=foodRows.find(x=>x.id==='stir-fry');
assert(popcorn?.image?.includes('pexels-photo-6422042.jpeg'),'Popcorn must use a popcorn photo');
assert(stir?.name==='Fajitas' && stir?.category==='Mexican' && stir?.quickCuts?.join('|')==='Mexican','Fajitas must replace Mexican Stir Fry with a Mexican Quick Cut');
assert(api.includes("mode==='search'") && api.includes("mode==='suggest'") && api.includes("mode==='resolve'"), 'Restaurant API contract must exist');
assert(api.includes('amenity:restaurant') && api.includes('amenity:fast_food'),'Restaurant search should use tagged Photon coverage plus restaurant/fast-food discovery');
assert(api.includes("const API_VERSION='r22'"),'Restaurant API should report r22');
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
assert(app.includes("HUNGRY ☹") && app.includes("HUNGRY_IMAGE"),'Last-choice Cut must use the Hungry frown state');
assert(app.includes("classList.toggle('hungry-image', hungry)"),'Hungry winner must use the dedicated artwork class');
assert(app.includes("detailsBtn.classList.toggle('hidden',hungry)"),'Hungry winner must hide the Details action');
assert(app.includes("if(item?.category==='Hungry')return;"),'Hungry Details must be blocked even if invoked programmatically');
assert(app.includes("const APP_VERSION = '1.0'") && new RegExp("APP_BUILD\\s*=\\s*['\\\"]"+String(release.build)+"['\\\"]").test(app),'About must expose the current app version/build');
assert(app.includes('function appConfirm'),'professional confirmation modal contract missing');
assert(app.includes("aria-labelledby",0) && app.includes("aria-modal"),'Generic modals must expose labelled dialog semantics');
assert(app.includes('localClockForZone'),'timezone-aware opening-hours helper is required');
assert(app.includes('restaurantSearchDegraded'),'degraded-search state is required');
assert(app.includes('resetRound') && app.includes('systemRestoreFlow') && app.includes('resetAppDataFlow'),'round reset, System Restore, and full app-data reset must be separated');
assert(app.includes('safeExternalUrl'),'external restaurant URLs must be protocol-validated');
assert(app.includes('storageWarning'),'storage failure state is required');
assert(app.includes('restaurant-card-utility') && app.includes('restaurant-card-details-utility'),'restaurant card utility action contract missing');
assert(app.includes("serviceWorker.register('./sw.js')"),'service worker registration contract missing');
const sw=fs.readFileSync('sw.js','utf8'); assert(sw.includes("'./data/restaurant-taxonomy.js'"),'Offline shell must cache the shared restaurant taxonomy'); assert(sw.includes("'./icon.svg'"),'Offline shell must cache the PWA icon');
assert(html.includes('rel="icon"') && html.includes('./icon.svg'),'PWA icon link contract missing');
assert((html.match(/id="offlineIndicator"/g)||[]).length===1,'offline indicator must be unique');

assert(!html.includes('id="newCat"'),'legacy Add Food category control must be removed');
assert(app.includes('Intl.DateTimeFormat'),'About date should be generated from the current date');
assert(css.includes('#aboutModal .about-test') && css.includes('color:#bfa16b'),'About test build label should be gold');
assert(html.includes('id="restaurantSearch" aria-label="Search restaurants by name or cuisine"'),'Restaurant Search control must remain available');
assert(css.includes('#restaurant .radius-search svg'),'Restaurant Search needs a compact visual icon distinct from Find');
assert(css.includes('#manageFoodsModal .manage-add-action')&&css.includes('.premium-manage-row'),'Manage Meals must use the current premium treatment');
assert(app.includes('Contact coverage')&&app.includes('Photo coverage')&&app.includes('Radius controls'),'App Diagnosis must include the current Restaurant checks');

assert(html.includes('<div class="location-sub">') && html.includes('class="restaurant-tool radius-search" id="restaurantSearch"'),'Restaurant Search must sit in the same Radius row');
assert(!html.includes('<div class="restaurant-tools"'),'Restaurant Search must not consume a separate full-width row');
assert(html.includes('id="hoursToggle"') && html.includes('data-hours-mode="openUnknown"') && html.includes('data-hours-mode="all"'),'Restaurant hours filter must expose Open and All controls');
assert(app.includes("'https://images.pexels.com/photos/32845321/pexels-photo-32845321.jpeg"),'Restaurant Asian Quick Cut must have a concrete photo source');
assert(app.includes("S.hoursMode = 'openUnknown';") && app.includes("function setRestaurantHoursMode(mode)"),'Restaurant hours state must default to Open/Unknown and be user-switchable to All');

assert(app.includes("function restaurantHourState(row)"),'Restaurant hour state must be normalized to open/closed/unknown');
assert(app.includes("function restaurantHoursFilter(row)"),'Restaurant hours filtering must remain available internally');
for(const label of ['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Seafood','Potato','Snack']) {
  const key = label.includes(' ') || label.includes('/') ? "'"+label+"':" : label+':';
  assert(app.includes(key),'Food Quick Cut photo mapping must include '+label);
}
assert(app.includes('function restaurantPoolBase()') && app.includes('function updateRestaurantStatus()'),'Restaurant filters need a shared pre-hours pool and visible count status.');
assert(app.includes('function restaurantCuisineTags(row)') && app.includes('restaurantCuisineTags(row,label)')===false && app.includes('restaurantQuickMatches(row,label)') && app.includes('restaurantCuisineTags(row).includes(label)'),'Restaurant Quick Cuts must use independent cuisine/category tags.');
assert(app.includes('const RESTAURANT_TAXONOMY = window.DINLIMINATE_RESTAURANT_TAXONOMY'),'Browser must consume the shared restaurant taxonomy.');
assert(html.includes('<script src="./data/restaurant-taxonomy.js"></script>'),'Shared restaurant taxonomy must load before app.js.');
assert(api.includes("require('../data/restaurant-taxonomy')"),'API must consume the shared restaurant taxonomy.');
assert(api.includes('quickCutTags:classification.tags') && api.includes('quickCutEvidence:classification.evidence'),'API results must expose shared restaurant classification tags/evidence.');

assert(app.includes('function restaurantIsFastFood(row)') && app.includes('return RESTAURANT_TAXONOMY.isFastFood(row);'),'Restaurant Fast Food classification must use the shared restaurant taxonomy.');
assert(app.includes('const RESTAURANT_TAXONOMY = window.DINLIMINATE_RESTAURANT_TAXONOMY'),'Restaurant identity corrections must be centralized in the shared taxonomy.');
assert(app.includes('function restaurantCuisineEvidence(row)'),'Restaurant Quick Cut associations must expose explainable evidence for QA/diagnosis.');
for(const label of ['Fast Food','Burgers','Pizza','Mexican','American','Italian','Asian','BBQ','Seafood','Breakfast']) {
  const key = label.includes(' ') || label.includes('/') ? "'"+label+"':" : label+':';
  assert(app.includes(key),'Restaurant Quick Cut photo mapping must include '+label);
}
assert(app.includes('restaurant-luxury-stat-grid') && app.includes('Distance') && app.includes('Address'),'Restaurant Details must expose richer information');
assert(app.includes('Typical nutrition') && app.includes('Ingredients'),'Food Details must expose nutrition and ingredients');

assert(app.includes("const REST_QUICK = [...RESTAURANT_TAXONOMY.tags]"),'Restaurant Quick Cuts must use the shared restaurant taxonomy categories');
const restQuickLine=(app.match(/const REST_QUICK = \[([^\]]+)\]/)||[])[1]||''; for(const legacy of ['Potato','Pasta','Soup/Stew','Healthy']) assert(!restQuickLine.includes("'"+legacy+"'"),'Restaurant Quick Cuts must not include food-style '+legacy+' shortcut');
assert(app.includes('normalizeRestaurantSearch') && app.includes('RESTAURANT_SEARCH_ALIASES'),'Restaurant search should normalize punctuation and support cuisine/category aliases');
assert(app.includes('RESTAURANT_TAXONOMY.restaurantSearchClassification'),'Restaurant Search should classify semantic cuisine/type queries with the shared taxonomy.');
assert(app.includes("if(classification.kind==='category'&&classification.tag)"),'Restaurant Search should use taxonomy category matching rather than broad fast-food fallback for semantic searches.');
assert(api.includes('const MAX_RADIUS=100'),'Restaurant search must be capped at 100 miles.');
assert(/<option>100<\/option>/.test(html),'Restaurant radius UI must expose the 100-mile tier.');
assert(api.includes('function centers(lat,lon,r)'),'Restaurant search must retain center-based coverage through the 100-mile maximum.');
assert(app.includes('existing.length!==labels.length||existing.some((x,i)=>x!==labels[i])'),'Quick Cut rendering must preserve existing photo nodes when the set of labels is unchanged.');

assert(!app.includes('Clean rebuild') && !app.includes('clean rebuild'),'App source should not mention build-internal wording');
assert(app.includes('foodMaybeRound') && app.includes('S.foodMaybeRound=true'),'Food Maybe choices must recycle into a second narrowing pass');
assert(app.includes('restaurantMaybeRound') && app.includes('S.restaurantMaybeRound=true'),'Restaurant Maybe choices must recycle into a second narrowing pass');
assert(app.includes('right to Keep'),'Right swipe must communicate Keep semantics');
assert(!app.includes("if (S.pool.length === 1) winner(S.pool[0]);"),'Food must not auto-win at one remaining choice');

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert(fs.existsSync('icon.svg'),'PWA icon asset is required');
assert(manifest.icons.some(x=>x.src==='./icon.svg'),'manifest must declare the available PWA icon');
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
assert(/S\.pool\.length\s*===\s*1/.test(app) && app.includes("winner(item)"),'Final Food choice must enter Winner instead of Hungry');
assert(app.includes('restaurantWebsiteUrl') && app.includes('google.com/search'),'Restaurant Website must have a Google fallback');
assert(app.includes('id="restDetails"') && app.includes('restaurant-card-utility') && app.includes('restaurant-card-details-utility') && app.includes('details-icon'),'Restaurant Details must be a working compact icon utility control');
assert(app.includes('quick-chip-photo'),'Food and Restaurant Quick Cuts must render real image elements');
assert(css.includes('.luxury-home h1{max-width:12em'),'Home title must be allowed to wrap fully on iPhone');
assert(app.includes('function appDiagnosisView'),'Settings must expose the App Diagnosis panel');
assert(app.includes("modal.classList.add(shellClass)") && app.includes("refresh.classList.add('selected')"),'App Diagnosis should be rendered in a stable existing modal shell and expose a running state');
assert(css.includes('.diagnosis-modal{min-height:'),'App Diagnosis must have a dedicated stable full-size modal layout');
assert(app.includes('id="appDiagnosis"') && app.includes('appDiagnosisView'),'Settings must include an App Diagnosis launcher'); assert(app.includes("Run '+run+' selected · checking now…") && app.includes("classList.add('selected')"),'App Diagnosis must visibly indicate Run again is selected while diagnostics run');
assert(app.includes('diagnosisRestaurantDuplicates'),'App Diagnosis must detect possible restaurant duplicates in the loaded pool');
assert(app.includes('restaurantWebsiteUrl'),'Restaurant diagnosis must include website fallback support');
assert(app.includes('Browser certification'),'App Diagnosis must distinguish browser certification from code-level feature wiring');
assert(app.includes('Runtime release identity'),'App Diagnosis must report runtime release identity');
assert(app.includes('Viewport overflow'),'App Diagnosis must report actual viewport overflow');
assert(app.includes('Browser certification'),'App Diagnosis must distinguish browser certification from code-level feature wiring');
assert(new RegExp("APP_BUILD\\s*=\\s*['\\\"]"+String(release.build)+"['\\\"]").test(app),'Current release build should match release.json');
assert(css.includes('.card-card-action.icon-action{width:28px')&&css.includes('.details-icon{width:14px!important'),'CP250 Details styling should be present');
assert.equal(foodRows.length,116,'Built-in food catalog should contain 116 meals'); assert(foodRows.every(x=>/^https:\/\//.test(String(x.image||''))),'Every built-in meal should have an HTTPS image URL'); assert.equal(new Set(foodRows.map(x=>x.image)).size,foodRows.length,'Built-in meal image URLs should remain unique');

// CP258 food catalog expansion and Quick Cut contracts.
const byId=new Map(foodRows.map(x=>[x.id,x]));
assert(app.includes("const FOOD_QUICK = ['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Seafood','Potato','Snack']"),'Food Quick Cuts should use the revised logical order');
assert(!/const\s+FOOD_QUICK\s*=\s*\[[^\]]*['"]Greek['"]/.test(app),'Food Quick Cut button list should not include Greek'); assert.deepEqual(foodRows.find(x=>x.id==='gyro')?.quickCuts,['Healthy'],'Gyro should use Healthy Quick Cut');
assert.deepEqual(byId.get('gyro')?.quickCuts,['Healthy']); assert.equal(byId.get('gyro')?.category,'Healthy');
assert.deepEqual(byId.get('stir-fry')?.quickCuts,['Mexican']); assert.equal(byId.get('stir-fry')?.name,'Fajitas');
const cp258Cuts={
'pot-pie':['American','Southern'],blt:['American'],reuben:['American'],'hot-dog':['American'],'corn-dog':['American'],nachos:['Mexican','Snack'],'orange-chicken':['Asian'],'chicken-teriyaki':['Asian','Healthy'],sushi:['Asian','Healthy'],pancakes:['Breakfast'],omelet:['Breakfast'],oatmeal:['Breakfast','Healthy'],shrimp:['Seafood','Healthy'],'crab-cakes':['Seafood','Southern'],gumbo:['Southern','Soup/Stew'],'chicken-nuggets':['American'],ramen:['Asian','Soup/Stew'],'pimento-cheese-sandwich':['Southern','American'],'ice-cream':['Snack'],'protein-bar':['Healthy','Snack'],'candy-bar':['Snack'],banana:['Healthy','Snack'],apple:['Healthy','Snack']};
for(const [id,cuts] of Object.entries(cp258Cuts)) assert.deepEqual(byId.get(id)?.quickCuts,cuts,id+' Quick Cut mapping');
assert(!foodRows.some(x=>x.quickCuts?.includes('Pork')),'Food Pork Quick Cut must remain removed'); assert(!/const FOOD_QUICK\s*=\s*\[[^\]]*['"]Pork['"]/.test(app),'Food Quick Cut list must not reintroduce Pork');


// CP259 requested food catalog additions and ordering.
const cp259Cuts={
'turkey-dinner':['Southern','American'],
'ham-dinner':['Southern','American'],
'lobster':['Seafood','Healthy'],
'crab-legs':['Seafood','Healthy'],
'liver-and-onions':['Southern','Healthy'],
'duck-dinner':['American'],
'mexican-burrito':['Mexican'],
'quesadillas':['Mexican'],
'roast-beef-sandwich-chips':['American'],
'eggplant-meal':['Healthy'],
'ravioli':['Pasta','Italian'],
'pinto-beans-cornbread':['Southern'],
'banana-split':['Snack'],
'fried-eggs':['Breakfast'],
'boiled-eggs':['Breakfast','Healthy'],
'mixed-nuts':['Snack','Healthy'],
'smoked-brisket-sides':['Southern'],
'clam-chowder':['Soup/Stew','Seafood'],
'turkey-sandwich-chips':['American'],
'masala-pasta':['Pasta','Asian'],
'enchiladas':['Mexican'],
'white-chicken-chili':['Soup/Stew','Mexican'],
'corn-chowder':['Soup/Stew'],
'jell-o':['Snack'],
'pudding':['Snack'],
'cottage-cheese':['Healthy']
};
for(const [id,cuts] of Object.entries(cp259Cuts)) assert.deepEqual(byId.get(id)?.quickCuts,cuts,'CP259 '+id+' Quick Cut mapping');
for(const id of Object.keys(cp259Cuts)) assert(byId.has(id),'Missing CP259 food: '+id);
assert.equal(byId.get('gumbo')?.quickCuts?.join('|'),'Southern|Soup/Stew','Gumbo should remain Southern + Soup/Stew');
assert.equal(byId.get('fish-sticks')?.name,'Fish Sticks','Fish Sticks should remain in the catalog');
assert.equal(foodRows[foodRows.length-1]?.id,'fish-sticks','Fish Sticks must be the final built-in food');
assert.equal(foodRows.filter(x=>x.name==='Roast Beef Sandwich + Chips').length,1,'Roast Beef Sandwich + Chips must not be duplicated');
assert.equal(foodRows.filter(x=>x.id==='gumbo').length,1,'Gumbo must not be duplicated');
assert.equal(foodRows.length,116,'CP259 built-in food deck must contain exactly 116 foods');
console.log('Dinliminate CP259 food catalog QA: PASS');

// CP428-433 Restaurant overall release contracts.
assert(app.includes('restaurant-card-meta-row') && app.includes('restaurant-card-location') && app.includes('restaurant-card-utilities'),'Restaurant Tinder card must use the simplified decision-first information hierarchy.');
assert(!app.includes('cardPhoneAction') && app.includes('cardWebsite') && app.includes('cardDetailsAction'),'Restaurant Tinder card must retain compact Details and Website actions without a phone icon.');
assert(!app.includes('cardCommon') && !app.includes('cardHours'),'Restaurant Tinder card should not render directory-style menu and hours blocks on-card.');
assert(app.includes("photoFallback:item.photoFallback||''") && app.includes("googlePlaceId:item.googlePlaceId||''") && app.includes("opening_hours:item.opening_hours||''"),'Restaurant History must persist venue-photo identity and core Details metadata.');
assert(app.includes("if ($('celebration')) $('celebration').classList.toggle('hidden', hungry)") && app.includes("if (!hungry) {") && app.includes("hydrateGoogleRestaurantPhoto(item,'#winner')"),'Restaurant Winner must use the same celebration behavior and photo hydration path as Food.');
assert(app.includes("winnerType") && app.includes("S.winnerType ="),'Restaurant winner state must remain explicitly tracked in winner().');
assert(api.includes("source:'Google Places Search',googlePlaceId:p.id||''"),'Google Text Search must preserve Place IDs for venue photo hydration.');


assert(html.includes('id="hungryNote"') && app.includes("hungryNote.textContent=hungry?'Fish Sticks?':''"),'Hungry winner must show the Fish Sticks? prompt');
assert(app.includes("const actionBar=item?.category==='Hungry'?'':"),'Hungry Details must conditionally omit its Hide action');


// CP260 UI contracts.
assert.deepEqual(foodRows.find(x=>x.id==='liver-and-onions')?.quickCuts,['Southern','Healthy'],'Liver & Onions should use Southern + Healthy');
for(const id of ['spaghetti','pasta-alfredo','lasagna']) assert.deepEqual(foodRows.find(x=>x.id===id)?.quickCuts,['Pasta','Italian'],id+' should use Pasta + Italian'); assert.deepEqual(foodRows.find(x=>x.id==='chicken-parmesan')?.quickCuts,['Italian','Pasta'],'chicken-parmesan should use Italian + Pasta');
assert(app.includes('restaurant-card-meta-row') && app.includes('id="restDetails"') && app.includes('restaurant-card-utilities') && app.indexOf('restaurant-card-meta-row')<app.indexOf('swipe-actions'),'Restaurant Details utility should sit in the Restaurant card meta row above decision actions');
assert(css.includes('#restaurant .restaurant-card-utility') && css.includes('#restaurant .restaurant-card-details-utility'),'Restaurant Details utility should retain dedicated premium styling');
assert(css.includes('.settings-system-action.diagnosis-action{background:linear-gradient(180deg,#19757b,#125258)'),'App Diagnosis should use the teal system action treatment');
assert(css.includes('#restaurant .restaurant-card-utility') && css.includes('#restaurant .restaurant-card-details-utility'),'Restaurant Details utility should sit in the Restaurant card utility row');
assert(app.includes("const cats=[...FOOD_QUICK,'Other']"),'Custom Food Other must be a selectable cuisine/category and Quick Cut');
assert(app.includes('name="editQuickCut"') && app.includes("value=\"'+esc(x)+'\"") && app.includes('const cat=preferred') && app.includes('category:cat,quickCuts'),'Custom Food Quick Cut editor should include Other and persist the selected categories');

// CP261 Vercel image proxy contract.
const imageProxyHosts=['images.pexels.com','images.unsplash.com','commons.wikimedia.org','static.spotapps.co','www.goodnes.com','hips.hearstapps.com','calliesbiscuits.com','vinovoss.com','southernbite.com','snapcalorie-webflow-website.s3.us-east-2.amazonaws.com','butterhearth.com','slicelife.imgix.net','cdn.shopify.com','savouryflavor.com','resizer.otstatic.com','kookycrunch.com','cdn.apartmenttherapy.info','www.southernliving.com','shop.barebells.com','b1880159.assetcdn.net','www.mybakingaddiction.com','a.fsimg.co.nz','ourstate.s3.amazonaws.com','whitneybond.com','thedailymeal.com','crockncle.com','www.africanbites.com','www.foodrepublic.com','shop.camelliabrand.com'];
assert(imageApi.includes('ALLOWED_HOSTS')&&imageApi.includes('MAX_BYTES'),'Vercel image proxy must use an explicit allowlist and response size cap');
assert(imageApi.includes("u.protocol!=='https:'"),'Vercel image proxy must reject non-HTTPS upstream URLs');
assert(imageProxyHosts.every(h=>imageApi.includes("'"+h+"'")),'Vercel image proxy allowlist must cover all current food image hosts');
assert(imageApi.includes("Cache-Control")&&imageApi.includes("s-maxage=604800"),'Vercel image proxy must be edge-cacheable');
assert(app.includes('function imageProxyUrl')&&app.includes('/api/image?url='),'App must route supported external images through the Vercel image proxy');
assert(html.includes('/api/image?url='),'Home images must use the Vercel image proxy');
console.log('Dinliminate CP261 Vercel image proxy QA: PASS');

assert(fs.readFileSync('vercel.json','utf8').includes('"api/image.js"') && fs.readFileSync('vercel.json','utf8').includes('"maxDuration": 10'),'Vercel image proxy function must have a 10-second max duration');
assert(photoApi.includes("GOOGLE_PLACES_API_KEY") && photoApi.includes("GOOGLE_MAPS_API_KEY"),'Restaurant photo endpoint must use the server-side Google Places key only.');
assert(photoApi.includes("X-Goog-FieldMask':'photos'"),'Restaurant photo endpoint must request fresh Google photo resources through Place Details.');
assert(photoApi.includes("Cache-Control",'no-store') && photoApi.includes("X-Restaurant-Photo-Attributions"),'Google restaurant photo responses must be non-cacheable and carry attribution metadata.');
assert(photoApi.includes("photo.name") && photoApi.includes("/media?maxWidthPx=1200"),'Google restaurant photo endpoint must resolve a fresh photo resource and request an appropriately sized image.');
assert(app.includes('hydrateGoogleRestaurantPhoto') && app.includes('/api/restaurant-photo?placeId='),'Browser must hydrate Google venue photos through the server endpoint without exposing the Places API key.');
assert(app.includes('photoSource') && app.includes('photoIsGeneric'),'Browser Restaurant rows must consume photo provenance metadata.'); assert(api.includes('photoSource') && api.includes('photoIsGeneric') && api.includes('photoConfidence'),'Restaurant API rows must expose photo provenance metadata.');
assert(api.includes('restaurantPhotoMeta') && api.includes('photoSource') && api.includes('photoFallback'),'Restaurant API must use a unified photo resolver with provenance and fallback metadata.');

assert(!app.includes("openModal('diagnosisModal'") && app.includes("modal.classList.add('diagnosis-modal')"),'App Diagnosis must use only the existing Settings modal shell');
assert(app.includes("card.style.webkitUserSelect='none'") && app.includes("img.draggable=false"),'Tinder card swipe surface must suppress image drag interference on phones');

assert(app.includes("const cats=[...FOOD_QUICK,'Other']"),'Food editor cuisine/category dropdown must include Other');
assert(app.includes('restaurantDirectionsUrl') && app.includes('detail-directions-action') && app.includes('Get Google Maps directions'),'Restaurant Details must include Google Maps directions');
assert(app.includes('restaurant-luxury-contact-row') && app.includes('phoneHref(detailPhone)'),'Restaurant Details must include a tap-to-call phone number');
assert(app.includes('const appBrandHost=/(^|[.-])(?:dinliminate|diliminate)([.-]|$)/i.test(host)'),'Restaurant Website must reject Dinliminate deployment hosts');
assert(app.includes('KNOWN_RESTAURANT_WEBSITES') && app.includes('mcdonalds.com'),'Restaurant Website must have an official national-chain website registry');
assert(app.includes("(q||'restaurant')+' restaurant website'"),'Restaurant Website must use a Google restaurant-website fallback query');
assert(app.includes('restaurantPhoneSearchUrl') && app.includes("' phone number'"),'Restaurant phone fallback must provide a Google phone-number search when a provider has no local phone');
assert(api.includes('KNOWN_RESTAURANT_WEBSITES') && api.includes('mcdonalds.com'),'Restaurant API must have an official national-chain website registry');
assert(api.includes('contactEnrichment') && api.includes('missingContactNames'),'Restaurant API must attempt targeted contact enrichment for missing fast-food phone data');
assert(api.includes("Country,Phone,URL"),'Restaurant provider lookup should request phone/URL metadata where available');
assert(api.includes("attrs.Phone||attrs.phone") && api.includes("attrs.URL||attrs.Url||attrs.url"),'Restaurant API should preserve provider phone and website metadata');
assert(app.includes('const appBrandHost=/(^|[.-])(?:dinliminate|diliminate)([.-]|$)/i.test(host)'),'Restaurant Website must reject Dinliminate deployment hosts');
assert(app.includes("(q||'restaurant')+' restaurant website'"),'Restaurant Website must use a Google restaurant-website fallback query');
assert(api.includes("Country,Phone,URL"),'Restaurant provider lookup should request phone/URL metadata where available');
assert(api.includes("attrs.Phone||attrs.phone") && api.includes("attrs.URL||attrs.Url||attrs.url"),'Restaurant API should preserve provider phone and website metadata');
assert(app.includes('iphone-guide-steps') && app.includes('Add to Home Screen'),'iPhone instructions must use the premium guide');
assert(!html.includes('Dinner Decisions Simplified') && html.includes('Dinner Simplified') && html.includes('Swipe. Dinliminate. Enjoy.') && html.includes('Add to iPhone'),'Current Home copy must be present');

// CP323 Restaurant Details visibility contract
assert(app.includes("openModal('detailsModal','Restaurant Details',body)"),'Restaurant Details modal must have an explicit Restaurant Details title');
assert(app.includes('restaurant-luxury-contact-card') && app.includes('detail-directions-action') && app.includes('contact-label') && app.includes('Phone'),'Restaurant Details must visibly expose a contact/directions section');
assert(css.includes('#detailsModal .restaurant-luxury-contact-card') && css.includes('#detailsModal .restaurant-luxury-actions'),'Restaurant Details contact/directions section must have dedicated premium styling');
assert(api.includes('MAX_RADIUS=100'),'Restaurant API maximum radius must be capped at 100 miles');assert(api.includes("if(String(r?.googlePlaceId||'').trim())"),'Google Place photo handling must take priority over generic provider imagery');
assert(app.includes("const hoursLabel=hoursState==='open'?'Open now'"),'Restaurant Details must expose normalized current hours state');
assert(app.includes('restaurant-hours-schedule'),'Restaurant Details should retain the provider hours schedule when available');
assert(app.includes("replace(/\\b(?:usa|united states)\\b/g,'')"),'Browser Restaurant address normalization must strip country suffixes');
assert(!app.includes('const cardPhoneAction'),'Restaurant cards must not render a phone icon action');
assert(app.includes('cardDetailsAction+cardWebsite'),'Restaurant card utility order must be Details then Website');
assert(api.includes("tennessee:'tn'"),'Restaurant API address normalization must equate Tennessee and TN');
assert(app.includes("tennessee:'tn'"),'Browser Restaurant address normalization must equate Tennessee and TN');
assert(!app.includes('cardPhoneAction'),'Restaurant cards must not render a phone icon action');
assert(app.includes("restaurant-card-utilities+'</div>" )||app.includes('cardDetailsAction+cardWebsite'),'Restaurant card utility order must be Details then Website');
assert(api.includes('function restaurantStreetKey(value)'),'Restaurant API must compare canonical street identity for partial address dedupe');
assert(app.includes('function restaurantStreetFamily(value)'),'Browser Restaurant layer must compare canonical street identity for partial address dedupe');
assert(html.includes('Dinner Simplified') && !html.includes('Dinner Decisions Simplified'),'Home headline must be Dinner Simplified');
assert(api.includes('const sameNameStreet=sameStreet&&originDistanceClose&&partialAddress&&(variant||sameName);'),'Restaurant dedupe must use same-street + close-origin-distance matching with name/variant and partial-address safeguards.');
assert(app.includes('const sameNameStreet=sameStreet&&originDistanceClose&&partialAddress&&(variant||sameName);'),'Browser Restaurant dedupe must mirror same-street distance matching with name/variant and partial-address safeguards.');
assert(api.includes('providerType')&&api.includes('primaryType'),'Restaurant provider type metadata must be preserved for cuisine inference.');
assert(app.includes("return raw&&/^(restaurant|eatery|food)$/i.test(raw)?'American':(raw||'American')"),'Restaurant card category must use a useful fallback instead of generic Restaurant where possible.');
assert(api.includes('function restaurantNameKey(value)'),'Restaurant API must normalize apostrophe-s and plain name variants consistently');
assert(app.includes("replace(/[’']s\\b/gi,'s')"),'Browser Restaurant names must normalize Wendy’s and Wendys consistently');
assert(api.includes('sameName && !conflictingAddress && dist<=0.08'),'Restaurant API same-name dedupe must use a tight same-venue distance threshold');
assert(app.includes('const close=Number.isFinite(dist)&&dist<=0.08'),'Browser Restaurant dedupe must use the same tight same-venue distance threshold');
assert(api.includes('const conflictingAddress=!!ax&&!!ar&&!sameAddress'),'Restaurant dedupe must protect distinct nearby addresses from false merges');
assert(app.includes('const conflictingAddr=!!address&&!!xa&&!sameAddr'),'Frontend Restaurant dedupe must protect distinct nearby addresses from false merges');
assert(api.includes('function applyGoogleContactPatches'),'Google contact enrichment must merge into existing rows');
assert(api.includes("if(got&&!got.__timeout){googleContactOut=got;applyGoogleContactPatches(contactCandidates,googleContactOut.rows)}"),'Google contact patches must be applied without appending duplicate rows');
assert(app.includes('function setRestaurantHoursMode(mode)')&&app.includes('function syncRestaurantHoursControl()'),'Restaurant hours-control runtime must remain wired for Open/All');


assert(css.includes('--orange:#c6a46a'),'Primary app accent should be satin gold');


// CP532 meal photo contracts.
const foodPhotoRows=(()=>{const w={};vm.runInNewContext(foods,{window:w});return w.DINLIMINATE_FOODS||[]})();
const foodByName=new Map(foodPhotoRows.map(x=>[x.name,x]));
assert(/shop\.barebells\.com.*salty-peanut-gallery-0-8491550198\.png/i.test(foodByName.get('Protein Bar')?.image||''),'Protein Bar must use the Barebells Salty Peanut bar product image');
assert(/images\.pexels\.com.*pexels-photo-19202817\.jpeg/i.test(foodByName.get('BLT')?.image||''),'BLT must use the refreshed bacon-lettuce-tomato sandwich photo');
assert(/ourstate\.s3\.amazonaws\.com.*FEB25-PE_Cornbread-and-Buttermilk__TimRobison\.jpg/i.test(foodByName.get('Buttermilk & Cornbread')?.image||''),'Buttermilk & Cornbread must use the requested glass-and-cornbread pairing');
assert(/images\.pexels\.com.*pexels-photo-2397401\.jpeg/i.test(foodByName.get('Meatloaf & Mashed Potatoes')?.image||''),'Meatloaf & Mashed Potatoes must use the refreshed Southern-style plate photo');
assert(/commons\.wikimedia\.org.*Soup_beans_and_corn_bread\.jpg/i.test(foodByName.get('Pinto Beans & Cornbread')?.image||''),'Pinto Beans & Cornbread must use the refreshed Southern pairing photo');