const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8'),foods=fs.readFileSync('data/foods.js','utf8'),api=fs.readFileSync('api/restaurants.js','utf8'),imageApi=fs.readFileSync('api/image.js','utf8'),release=JSON.parse(fs.readFileSync('release.json','utf8')),releaseApi=fs.readFileSync('api/release.js','utf8'),releaseManifest=JSON.parse(fs.readFileSync('release-manifest.json','utf8'));
new vm.Script(foods);new vm.Script(app);new vm.Script(api);new vm.Script(imageApi.replace('export default async function handler','async function handler'));
for(const s of ['Dinner Decisions Simplified','Choose a meal','Find a restaurant','foodCut','foodMaybe','foodBack','foodHide'])assert(html.includes(s),'missing HTML contract: '+s);
assert(html.includes('<script src="./data/foods.js"></script>') && /<script src="\.\/app\.js(?:\?v=\d+)?"><\/script>/.test(html),'clean app scripts must load synchronously in data-before-app order');
assert(!html.includes('defer'),'clean app should not defer its data/app runtime scripts');
for(const s of ['restaurantPoolFiltered','searchRestaurants','useLocation','restaurantBack','foodCut','foodMaybe','foodCuts','readImageFile','foodEditor'])assert(app.includes(s),'missing app contract: '+s);
for(const s of ['fast_food','restaurant',"mode==='search'","mode==='suggest'","mode==='resolve'","mode==='reverse'",'r19'])assert(api.includes(s),'missing API contract: '+s);
assert(!app.includes("document.createElement('style')"),'app should not construct stylesheet builders');
assert(app.includes("S.winnerType"),'winner type must be persisted explicitly');
assert(app.includes('editFoodRecipe') && app.includes('editFoodFile') && app.includes('readImageFile'),'custom food recipe/photo upload support is required');
assert(app.includes('editQuickCut') && app.includes('quickCuts'),'Custom foods must support multiple Quick Cut groups');
assert(app.includes('data-food-edit') && app.includes('editQuickCut') && !app.includes('data-food-delete') && !app.includes('data-setting-food-delete'),'Food management must use Edit plus Hide/Restore without Delete controls');
assert(app.includes('S.deleted'),'deleted-food persistence is required');
assert(app.includes('legacyKeys') && app.includes('cutPrimary'),'Persisted state migration must retire legacy fields');
assert(app.includes('restaurantSearchOrigin'),'Restaurant search origin must be persisted for radius expansion behavior');
assert(app.includes("$('radius').addEventListener('change'"),'Radius changes must automatically trigger a restaurant refresh');
assert(app.includes('renderFindButton') && app.includes("S.location?'Refresh':'Find'"),'Find control must act as Refresh once a location is selected');
assert(app.includes("if(row&&typeof row.openNow==='boolean')return row.openNow?'open':'closed';"),'Hours filtering must honor provider current open state when available');
assert(api.includes("currentOpeningHours.openNow") && api.includes('openNow'),'Restaurant API must request and preserve current opening status');
assert(api.includes("function googleSearchPlaces") && api.includes("textQuery:term+' restaurant'"),'Restaurant provider-backed search must use Google text search for non-empty queries');
assert(api.includes('searchQueryMany') && api.includes('cuisine~') && api.includes('brand~'),'Restaurant provider-backed fallback must search OSM name, brand, operator, and cuisine');
assert(api.includes("searchTerm=normalizeSearchQuery(q.get('q')||'')") && api.includes("+':'+searchTerm,hit=cache.get(key)"),'Restaurant API search cache must vary by search query');
assert(app.includes("const searchTerm = String(S.restaurantQuery||'').trim().slice(0,100);") && app.includes("searchTerm ? '&q='+encodeURIComponent(searchTerm) : ''"),'Restaurant Search box must send its query to the restaurant API');
assert(app.includes('scheduleRestaurantProviderSearch') && app.includes("setTimeout(()=>{searchRestaurants();},650)"),'Restaurant Search box must trigger provider-backed search after typing settles');
assert(api.includes('normAddress') && api.includes('sameRestaurant'),'Restaurant dedupe must normalize provider address variants and compare venue identity');
assert(app.includes('fetchRestaurantEndpoint') && app.includes('attempt<2'),'Restaurant endpoint retry protection must be present');
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
assert(!html.includes('bottom-nav') && !html.includes('id="bottomNav"'),'Legacy bottom navigation must stay removed');
assert(html.includes('swipe-actions') && html.includes('round-action'),'Decision controls must use the card-first circular action structure');
assert(html.includes('round-cut') && html.includes('round-maybe') && html.includes('round-back') && html.includes('round-hide'),'All four decision actions must remain wired');
assert(html.includes('class="decision-bar"'),'Food/Restaurant must use local compact decision bars');
assert(html.includes('id="foodBackTop"') && html.includes('id="foodMenu"'),'Food local Back/Menu controls must be present');
assert(html.includes('id="restaurantBackTop"') && html.includes('id="restaurantMenu"'),'Restaurant local Back/Menu controls must be present');
assert(html.includes('id="foodCount"') && html.includes('id="restaurantCount"'),'Choice counts must be present on the Quick Cuts rows');
assert(!/<span>FOOD<\/span>/.test(html) && !/<span>RESTAURANTS<\/span>/.test(html),'Standalone FOOD/RESTAURANTS header labels must stay removed');
assert(html.includes('id="foodDetails"') && html.includes('details-icon') && app.includes("detailsSheet(item,'food')"),'Food card Details must use the crisp icon and open the full Details sheet');
assert(app.includes('id="restDetails"') && app.includes("detailsSheet(current, 'restaurant')"),'Restaurant card Details must open the full Details sheet');
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
assert.deepEqual(foodRows.find(x=>x.id==='biscuits-gravy')?.quickCuts,['Breakfast']);
assert.equal(foodRows.find(x=>x.id==='mashed-potatoes')?.name,'Mashed Potatoes');
assert.ok(foodRows.find(x=>x.id==='white-fish')?.ingredients?.length && foodRows.find(x=>x.id==='white-fish')?.nutrition && foodRows.find(x=>x.id==='white-fish')?.recipe);
assert.ok(foodRows.find(x=>x.id==='pork-tenderloin')?.ingredients?.length && foodRows.find(x=>x.id==='pork-tenderloin')?.nutrition && foodRows.find(x=>x.id==='pork-tenderloin')?.recipe);
const popcorn=foodRows.find(x=>x.id==='popcorn'), stir=foodRows.find(x=>x.id==='stir-fry');
assert(popcorn?.image?.includes('pexels-photo-6422042.jpeg'),'Popcorn must use a popcorn photo');
assert(stir?.name==='Fajitas' && stir?.category==='Mexican' && stir?.quickCuts?.join('|')==='Mexican','Fajitas must replace Mexican Stir Fry with a Mexican Quick Cut');
assert(api.includes("mode==='search'") && api.includes("mode==='suggest'") && api.includes("mode==='resolve'"), 'Restaurant API contract must exist');
assert(api.includes('amenity:restaurant') && api.includes('amenity:fast_food'),'Restaurant search should use tagged Photon coverage plus restaurant/fast-food discovery');
assert(api.includes("const API_VERSION='r19'"),'Restaurant API should report r19 after hybrid provider search');
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
assert(app.includes("const APP_VERSION = '1.0'") && new RegExp("APP_BUILD\\s*=\\s*['\\\"]"+String(release.build)+"['\\\"]").test(app),'About must expose the current app version/build');
assert(app.includes('function appConfirm'),'professional confirmation modal contract missing');
assert(app.includes("aria-labelledby",0) && app.includes("aria-modal"),'Generic modals must expose labelled dialog semantics');
assert(app.includes('localClockForZone'),'timezone-aware opening-hours helper is required');
assert(app.includes('restaurantSearchDegraded'),'degraded-search state is required');
assert(app.includes('resetRound') && app.includes('systemRestoreFlow') && app.includes('resetAppDataFlow'),'round reset, System Restore, and full app-data reset must be separated');
assert(app.includes('safeExternalUrl'),'external restaurant URLs must be protocol-validated');
assert(app.includes('storageWarning'),'storage failure state is required');
assert(app.includes('card-phone') && app.includes('card-card-action'),'restaurant card phone/action contract missing');
assert(app.includes("serviceWorker.register('./sw.js')"),'service worker registration contract missing');
const sw=fs.readFileSync('sw.js','utf8'); assert(sw.includes("'./icon.svg'"),'Offline shell must cache the PWA icon');
assert(html.includes('rel="icon"') && html.includes('./icon.svg'),'PWA icon link contract missing');
assert((html.match(/id="offlineIndicator"/g)||[]).length===1,'offline indicator must be unique');

assert(!html.includes('id="newCat"'),'legacy Add Food category control must be removed');
assert(app.includes('Intl.DateTimeFormat'),'About date should be generated from the current date');
assert(css.includes('#aboutModal .about-test') && css.includes('color:#bfa16b'),'About test build label should be gold');
assert(app.includes("openMode?'Open/Unknown':'All'"),'Hours toggle must use Open/Unknown and All');
assert(app.includes("function setRestaurantHoursMode(mode)"),'Hours toggle must use an explicit restaurant hours-mode setter');
assert(app.includes("S.hoursMode=mode==='all'?'all':'openUnknown'"),'Hours mode setter must explicitly select All or Open/Unknown');
assert(app.includes("function restaurantHourState(row)"),'Restaurant hour state must be normalized to open/closed/unknown');
assert(app.includes("function restaurantHoursFilter(row)"),'Restaurant hours filtering must use a dedicated filter');
assert(app.includes('function restaurantPoolFiltered()') && app.includes('return restaurantPoolBase().filter(row=>restaurantHoursFilter(row));'),'Restaurant pool must apply the hours filter');
assert(app.includes("hoursBtn.addEventListener('click'"),'Hours toggle must have an explicit click event listener');
for(const label of ['American','Southern','Mexican','Italian','Asian','Pasta','Soup/Stew','Healthy','Breakfast','Potato','Snack']) {
  const key = label.includes(' ') || label.includes('/') ? "'"+label+"':" : label+':';
  assert(app.includes(key),'Food Quick Cut photo mapping must include '+label);
}
assert(app.includes('function restaurantPoolBase()') && app.includes('function updateRestaurantStatus()'),'Restaurant filters need a shared pre-hours pool and visible count status.');
assert(app.includes('function restaurantCuisineTags(row)') && app.includes('return tags.includes(label);'),'Restaurant Quick Cuts must use independent cuisine/category tags.');
assert(app.includes('function restaurantIsFastFood(row)') && app.includes("if(/thirsty goat/.test(hay)) return false;"),'Known pizza venue correction must prevent an incorrect Fast Food quick cut from removing the venue.');
assert(app.includes("if(/thirsty goat/.test(nameHay)) tags.add('Pizza');"),'Known pizza venue correction must add Pizza independently of provider category.');
for(const label of ['Fast Food','Burgers','Pizza','Mexican','American','Italian','Asian','BBQ','Seafood','Breakfast']) {
  const key = label.includes(' ') || label.includes('/') ? "'"+label+"':" : label+':';
  assert(app.includes(key),'Restaurant Quick Cut photo mapping must include '+label);
}
assert(app.includes('restaurant-luxury-stat-grid') && app.includes('Distance') && app.includes('Address'),'Restaurant Details must expose richer information');
assert(app.includes('Typical nutrition') && app.includes('Ingredients'),'Food Details must expose nutrition and ingredients');

assert(app.includes("const REST_QUICK = ['Fast Food','Burgers','Pizza','Mexican','American','Italian','Asian','BBQ','Seafood','Breakfast']"),'Restaurant Quick Cuts must use restaurant categories, not food-item categories');
const restQuickLine=(app.match(/const REST_QUICK = \[([^\]]+)\]/)||[])[1]||''; for(const legacy of ['Potato','Pasta','Soup/Stew','Healthy']) assert(!restQuickLine.includes("'"+legacy+"'"),'Restaurant Quick Cuts must not include food-style '+legacy+' shortcut');
assert(app.includes('normalizeRestaurantSearch') && app.includes('RESTAURANT_SEARCH_ALIASES'),'Restaurant search should normalize punctuation and support cuisine/category aliases');
assert(app.includes("normalized==='burger'") && app.includes('!!row.fastFood'),'Burger Search should include fast-food restaurants');
assert(api.includes('const MAX_RADIUS=50'),'Restaurant search must cap radius at 50 miles.');
assert(!/<option>100<\/option>/.test(html),'Restaurant radius UI must not expose 100 miles.');

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
assert(app.includes('id="restDetails"') && app.includes('icon-action') && app.includes('details-icon'),'Restaurant Details must be a working compact icon control');
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
assert(app.includes("let APP_BUILD = '142'"),'Current release build should be 138');
assert(css.includes('.card-card-action.icon-action{width:28px')&&css.includes('.details-icon{width:14px!important'),'CP250 Details styling should be present');
assert(foods.includes('14179985')&&foods.includes('31673757')&&foods.includes('2397401')&&foods.includes('6525832')&&foods.includes('29653177')&&foods.includes('goodnes.com')&&foods.includes('20234576')&&foods.includes('7974814')&&foods.includes('14542171')&&foods.includes('7181419')&&foods.includes('7813574')&&foods.includes('792027')&&foods.includes('36378584'),'CP257 food photo mappings should be present');

// CP258 food catalog expansion and Quick Cut contracts.
const byId=new Map(foodRows.map(x=>[x.id,x]));
assert(app.includes("const FOOD_QUICK = ['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Potato','Snack']"),'Food Quick Cuts should use the revised logical order');
assert(!/const\s+FOOD_QUICK\s*=\s*\[[^\]]*['"]Greek['"]/.test(app),'Food Quick Cut button list should not include Greek'); assert.deepEqual(foodRows.find(x=>x.id==='gyro')?.quickCuts,['Healthy'],'Gyro should use Healthy Quick Cut');
assert.deepEqual(byId.get('gyro')?.quickCuts,['Healthy']); assert.equal(byId.get('gyro')?.category,'Healthy');
assert.deepEqual(byId.get('stir-fry')?.quickCuts,['Mexican']); assert.equal(byId.get('stir-fry')?.name,'Fajitas');
const cp258Cuts={
'pot-pie':['Southern','American'],blt:['American'],reuben:['American'],'hot-dog':['American'],'corn-dog':['American'],nachos:['Mexican','Snack'],'orange-chicken':['Asian'],'chicken-teriyaki':['Asian','Healthy'],sushi:['Asian','Healthy'],pancakes:['Breakfast'],omelet:['Breakfast'],oatmeal:['Breakfast','Healthy'],shrimp:['Healthy','Southern'],'crab-cakes':['Southern','Healthy'],gumbo:['Southern','Soup/Stew'],'chicken-nuggets':['American'],ramen:['Asian','Soup/Stew'],'pimento-cheese-sandwich':['Southern','American'],'ice-cream':['Snack'],'protein-bar':['Snack','Healthy'],'candy-bar':['Snack'],banana:['Healthy','Snack'],apple:['Healthy','Snack']};
for(const [id,cuts] of Object.entries(cp258Cuts)) assert.deepEqual(byId.get(id)?.quickCuts,cuts,id+' Quick Cut mapping');
assert(!foodRows.some(x=>x.quickCuts?.includes('Pork')),'Food Pork Quick Cut must remain removed'); assert(!/const FOOD_QUICK\s*=\s*\[[^\]]*['"]Pork['"]/.test(app),'Food Quick Cut list must not reintroduce Pork');


// CP259 requested food catalog additions and ordering.
const cp259Cuts={
'turkey-dinner':['Southern','American'],
'ham-dinner':['Southern','American'],
'lobster':['Healthy'],
'crab-legs':['Healthy'],
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
'clam-chowder':['Soup/Stew'],
'turkey-sandwich-chips':['American'],
'masala-pasta':['Pasta'],
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

assert(html.includes('id="hungryNote"') && app.includes("hungryNote.textContent=hungry?'Fish Sticks?':''"),'Hungry winner must show the Fish Sticks? prompt');
assert(app.includes("const actionBar=item?.category==='Hungry'?'':"),'Hungry Details must conditionally omit its Hide action');


// CP260 UI contracts.
assert.deepEqual(foodRows.find(x=>x.id==='liver-and-onions')?.quickCuts,['Southern','Healthy'],'Liver & Onions should use Southern + Healthy');
for(const id of ['spaghetti','pasta-alfredo','lasagna','chicken-parmesan']) assert.deepEqual(foodRows.find(x=>x.id===id)?.quickCuts,['Pasta','Italian'],id+' should use Pasta + Italian');
assert(app.includes('card-cuisine-row') && app.includes('id="restDetails"') && app.indexOf('card-cuisine-row')<app.indexOf('card-card-actions'),'Restaurant Details icon should sit beside cuisine above action buttons');
assert(css.includes('.card-cuisine-row .icon-action{flex:0 0 auto;margin:0!important}'),'Restaurant Details icon should stay inline with cuisine');
assert(css.includes('.settings-system-action.diagnosis-action{background:linear-gradient(180deg,#19757b,#125258)'),'App Diagnosis should use the teal system action treatment');
assert(css.includes('.card-cuisine-row .icon-action{flex:0 0 auto;margin:0!important}'),'Restaurant Details icon should sit inline to the right of cuisine');
assert(app.includes("const quickCats=cats") && app.includes("cats=['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Potato','Snack','Other']"),'Custom Food Other must be a selectable cuisine/category and Quick Cut');
assert(app.includes('name="editQuickCut"') && app.includes("value=\"'+esc(x)+'\"") && app.includes("if(!quickCuts.includes(cat)) quickCuts.unshift(cat)"),'Custom Food Quick Cut editor should include Other and persist the selected category as a Quick Cut');

// CP261 Vercel image proxy contract.
const imageProxyHosts=['images.pexels.com','images.unsplash.com','commons.wikimedia.org','static.spotapps.co','www.goodnes.com','hips.hearstapps.com','calliesbiscuits.com','vinovoss.com','southernbite.com','snapcalorie-webflow-website.s3.us-east-2.amazonaws.com','butterhearth.com','slicelife.imgix.net','cdn.shopify.com','savouryflavor.com','resizer.otstatic.com','kookycrunch.com'];
assert(imageApi.includes('ALLOWED_HOSTS')&&imageApi.includes('MAX_BYTES'),'Vercel image proxy must use an explicit allowlist and response size cap');
assert(imageApi.includes("u.protocol!=='https:'"),'Vercel image proxy must reject non-HTTPS upstream URLs');
assert(imageProxyHosts.every(h=>imageApi.includes("'"+h+"'")),'Vercel image proxy allowlist must cover all current food image hosts');
assert(imageApi.includes("Cache-Control")&&imageApi.includes("s-maxage=604800"),'Vercel image proxy must be edge-cacheable');
assert(app.includes('function imageProxyUrl')&&app.includes('/api/image?url='),'App must route supported external images through the Vercel image proxy');
assert(html.includes('/api/image?url='),'Home images must use the Vercel image proxy');
console.log('Dinliminate CP261 Vercel image proxy QA: PASS');

assert(fs.readFileSync('vercel.json','utf8').includes('"api/image.js"') && fs.readFileSync('vercel.json','utf8').includes('"maxDuration": 10'),'Vercel image proxy function must have a 10-second max duration');

assert(!app.includes("openModal('diagnosisModal'") && app.includes("modal.classList.add('diagnosis-modal')"),'App Diagnosis must use only the existing Settings modal shell');
assert(app.includes("card.style.webkitUserSelect='none'") && app.includes("img.draggable=false"),'Tinder card swipe surface must suppress image drag interference on phones');

assert(app.includes("const cats=['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Potato','Snack','Other']"),'Food editor cuisine/category dropdown must include Other');
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
assert(html.includes('Dinner Decisions Simplified') && html.includes('Beautifully swipe until it’s revealed.') && html.includes('Add to iPhone'),'Current Home copy must be present');

// CP323 Restaurant Details visibility contract
assert(app.includes("openModal('detailsModal','Restaurant Details',body)"),'Restaurant Details modal must have an explicit Restaurant Details title');
assert(app.includes('restaurant-luxury-contact-card') && app.includes('detail-directions-action') && app.includes('contact-label') && app.includes('Phone'),'Restaurant Details must visibly expose a contact/directions section');
assert(css.includes('#detailsModal .restaurant-luxury-contact-card') && css.includes('#detailsModal .restaurant-luxury-actions'),'Restaurant Details contact/directions section must have dedicated premium styling');