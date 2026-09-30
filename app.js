
(() => {
'use strict';
const getDefaultFoods = () => Array.isArray(window.DINLIMINATE_FOODS) ? window.DINLIMINATE_FOODS : [];
const $ = (id) => document.getElementById(id);
const KEY = 'dinliminate.clean.cp1';
const HISTORY_KEY = 'dinliminate.clean.history';
const APP_VERSION = '1.0';
let APP_BUILD = '149';
fetch('./release.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(meta=>{if(meta?.build)APP_BUILD=String(meta.build)}).catch(()=>{});
const HUNGRY_IMAGE = 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" rx="52" fill="#090909"/><circle cx="600" cy="400" r="170" fill="none" stroke="#f5f1e8" stroke-width="18"/><circle cx="535" cy="365" r="14" fill="#f5f1e8"/><circle cx="665" cy="365" r="14" fill="#f5f1e8"/><path d="M515 495c52-62 118-62 170 0" fill="none" stroke="#f5f1e8" stroke-width="18" stroke-linecap="round"/></svg>');
const RESTAURANT_TAXONOMY = window.DINLIMINATE_RESTAURANT_TAXONOMY;
if(!RESTAURANT_TAXONOMY) throw new Error('Restaurant taxonomy failed to load.');
const FOOD_QUICK = ['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Potato','Snack'];
const foodQuickLabels=()=>S.custom.some(x=>Array.isArray(x.quickCuts)&&x.quickCuts.includes('Other'))?[...FOOD_QUICK,'Other']:FOOD_QUICK;
const REST_QUICK = [...RESTAURANT_TAXONOMY.tags];
const QUICK_IMAGES = {
Southern:'https://images.pexels.com/photos/2397401/pexels-photo-2397401.jpeg?auto=compress&cs=tinysrgb&w=700', // Meatloaf & Mashed Potatoes
Pasta:'https://images.pexels.com/photos/6287520/pexels-photo-6287520.jpeg?auto=compress&cs=tinysrgb&w=700', // Spaghetti
Asian:'https://images.pexels.com/photos/32845321/pexels-photo-32845321.jpeg?auto=compress&cs=tinysrgb&w=700', // Fried Rice
Mexican:'https://images.pexels.com/photos/12317911/pexels-photo-12317911.jpeg?auto=compress&cs=tinysrgb&w=700', // Tacos / Mexican Stir Fry family
'Soup/Stew':'https://images.pexels.com/photos/15305397/pexels-photo-15305397.jpeg?auto=compress&cs=tinysrgb&w=700', // Soup & Sandwich
Healthy:'https://images.pexels.com/photos/11906476/pexels-photo-11906476.jpeg?auto=compress&cs=tinysrgb&w=700', // Salad Bowl
Breakfast:'https://images.pexels.com/photos/5852231/pexels-photo-5852231.jpeg?auto=compress&cs=tinysrgb&w=700', // Eggs & Toast
American:'https://images.pexels.com/photos/12034622/pexels-photo-12034622.jpeg?auto=compress&cs=tinysrgb&w=700', // Burger
Snack:'https://images.pexels.com/photos/6422042/pexels-photo-6422042.jpeg?auto=compress&cs=tinysrgb&w=700', // Popcorn
Italian:'https://images.pexels.com/photos/7813574/pexels-photo-7813574.jpeg?auto=compress&cs=tinysrgb&w=700', // Pizza
Potato:'https://images.pexels.com/photos/273825/pexels-photo-273825.jpeg?auto=compress&cs=tinysrgb&w=700' // Roasted potatoes
};
const REST_QUICK_IMAGES = {
'Fast Food':'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=85',
Burgers:'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85',
Pizza:'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=900&q=85',
Mexican:'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=85',
American:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
Italian:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85',
Asian:'https://images.unsplash.com/photo-1515669097368-22e681b4d36c?auto=format&fit=crop&w=900&q=85',
BBQ:'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85',
Seafood:'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=900&q=85',
Breakfast:'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=900&q=85'
};
const S = {
screen:'home',
hidden:new Set(),
deleted:new Set(),
hiddenRestaurants:{},
cutCats:new Set(),
foodCuts:new Set(),
maybe:new Set(),
foodMaybeRound:false,
custom:[],
pool:[],
index:0,
foodActions:[],
restaurantPool:[],
restaurantIndex:0,
restaurantCuts:new Set(),
restaurantActions:[],
restaurantMaybeRound:false,
restaurantQuery:'',
hoursMode:'openUnknown',
location:null,
locationSource:'none',
restaurantSearchLatencyMs:0,
saved:false,
storageWarning:false,
restaurantSearchDegraded:false,
locationFreshAt:null,
winnerItem:null,
winnerType:'food',
schemaVersion:4,
restaurantTimezone:'',
restaurantSearchOrigin:null
};
const IMAGE_PROXY_HOSTS=new Set(['images.pexels.com','images.unsplash.com','commons.wikimedia.org','static.spotapps.co','www.goodnes.com','hips.hearstapps.com','calliesbiscuits.com','vinovoss.com','southernbite.com','snapcalorie-webflow-website.s3.us-east-2.amazonaws.com','butterhearth.com','slicelife.imgix.net','cdn.shopify.com','savouryflavor.com','resizer.otstatic.com','kookycrunch.com']);
function imageProxyUrl(raw){
 const src=String(raw||'');
 if(!/^https:\/\//i.test(src)||src.startsWith('/api/image?')||src.startsWith('data:')||src.startsWith('blob:'))return src;
 try{const u=new URL(src);if(!IMAGE_PROXY_HOSTS.has(u.hostname))return src;return '/api/image?url='+encodeURIComponent(u.href);}catch{return src;}
}
function foodPhoto(item){
if(!item)return HUNGRY_IMAGE;
const src=String(item.image||'');
if(src && !src.startsWith('idb:'))return imageProxyUrl(src);
const groups=Array.isArray(item.quickCuts)&&item.quickCuts.length?item.quickCuts:[item.category];
for(const label of groups){if(QUICK_IMAGES[label])return QUICK_IMAGES[label];}
return QUICK_IMAGES.American;
}
function foodPhotoFallback(item){
const groups=Array.isArray(item?.quickCuts)&&item.quickCuts.length?item.quickCuts:[item?.category];
for(const label of groups){if(QUICK_IMAGES[label])return imageProxyUrl(QUICK_IMAGES[label]);}
return imageProxyUrl(QUICK_IMAGES.American);
}
const KNOWN_RESTAURANT_WEBSITES={
  "mcdonald's":'https://www.mcdonalds.com',"taco bell":'https://www.tacobell.com',"wendy's":'https://www.wendys.com',"burger king":'https://www.bk.com',"kfc":'https://www.kfc.com',"chick fil a":'https://www.chick-fil-a.com',"popeyes":'https://www.popeyes.com',"subway":'https://www.subway.com',"sonic":'https://www.sonicdrivein.com',"arby's":'https://www.arbys.com',"whataburger":'https://whataburger.com',"five guys":'https://www.fiveguys.com',"culver's":'https://www.culvers.com',"raising cane's":'https://www.raisingcanes.com',"wingstop":'https://www.wingstop.com',"bojangles":'https://www.bojangles.com',"cook out":'https://www.cookout.com',"dairy queen":'https://www.dairyqueen.com',"zaxby's":'https://www.zaxbys.com',"church's chicken":'https://www.churchs.com',"captain d's":'https://www.captainds.com',"long john silver's":'https://www.ljsilvers.com',"jimmy john's":'https://www.jimmyjohns.com',"jersey mike's":'https://www.jerseymikes.com',"firehouse subs":'https://www.firehousesubs.com',"little caesars":'https://littlecaesars.com',"domino's":'https://www.dominos.com',"papa john's":'https://www.papajohns.com',"pizza hut":'https://www.pizzahut.com',"marco's pizza":'https://www.marcos.com',"krystal":'https://www.krystal.com',"steak 'n shake":'https://www.steaknshake.com',"white castle":'https://www.whitecastle.com',"freddy's":'https://www.freddys.com',"panda express":'https://www.pandaexpress.com',"jack in the box":'https://www.jackinthebox.com',"hardee's":'https://www.hardees.com',"del taco":'https://www.deltaco.com',"checkers":'https://www.checkers.com',"rally's":'https://www.rallys.com',"chipotle":'https://www.chipotle.com',"applebee's":'https://www.applebees.com',"chili's":'https://www.chilis.com',"olive garden":'https://www.olivegarden.com',"waffle house":'https://www.wafflehouse.com'
};
function knownRestaurantWebsite(row){
 const name=normKey(row?.name),brand=normKey(row?.brand);
 for(const [key,url] of Object.entries(KNOWN_RESTAURANT_WEBSITES)){
  const k=normKey(key);
  if(name===k||name.includes(k)||brand===k||brand.includes(k))return url;
 }
 return '';
}
function restaurantWebsiteUrl(row){
const direct=safeExternalUrl(row?.website);
if(direct)return direct;
const known=knownRestaurantWebsite(row);
if(known)return known;
const q=[row?.name,row?.address].filter(Boolean).join(' ').trim();
return 'https://www.google.com/search?q='+encodeURIComponent((q||'restaurant')+' restaurant website');
}
function restaurantPhoneSearchUrl(row){
 const q=[row?.name,row?.address].filter(Boolean).join(' ').trim();
 return 'https://www.google.com/search?q='+encodeURIComponent((q||'restaurant')+' phone number');
}
function restaurantDirectionsUrl(row){
const lat=Number(row?.lat),lon=Number(row?.lon);
const destination=Number.isFinite(lat)&&Number.isFinite(lon)?lat+','+lon:(row?.address||row?.name||'restaurant');
return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(destination);
}
const FINAL_FOOD_IMAGE='./fallback-food.svg';
const FINAL_RESTAURANT_IMAGE='./fallback-restaurant.svg';
function bindImageFallbackAttrs(selector){
 document.querySelectorAll(selector).forEach(img=>{
  img.referrerPolicy='no-referrer';img.loading='eager';
  const final=img.dataset.finalFallback||FINAL_FOOD_IMAGE;
  img.addEventListener('error',()=>{
   const fallback=img.dataset.fallback||'',current=img.currentSrc||img.src;
   if(fallback&&current!==fallback){img.src=fallback;return;}
   if(final&&current!==final){img.dataset.imageFallback='true';img.src=final;return;}
   img.dataset.imageFallback='true';
  });
 });
}
function bindImageFallback(selector,fallback,finalFallback=FINAL_RESTAURANT_IMAGE){
 document.querySelectorAll(selector).forEach(img=>{
  img.referrerPolicy='no-referrer';img.loading='eager';img.dataset.fallback=img.dataset.fallback||fallback;
  const final=img.dataset.finalFallback||finalFallback;
  img.addEventListener('error',()=>{
   const fb=img.dataset.fallback||'',current=img.currentSrc||img.src;
   if(fb&&current!==fb){img.src=fb;return;}
   if(final&&current!==final){img.dataset.imageFallback='true';img.src=final;return;}
   img.dataset.imageFallback='true';
  });
 });
}
function bindHomeImageFallbacks(){
 document.querySelectorAll('.home-photo-img').forEach(img=>{
  const final=img.dataset.finalFallback||FINAL_FOOD_IMAGE;
  img.referrerPolicy='no-referrer';img.loading='eager';
  img.onerror=function(){const current=this.currentSrc||this.src;if(final&&current!==final){this.dataset.imageFallback='true';this.src=final;}};
 });
}
const restaurantGooglePhotoInflight=new Map();
function decodePhotoAttributions(raw){
 const value=String(raw||'').trim();if(!value)return[];
 try{
  let b64=value.replace(/-/g,'+').replace(/_/g,'/');while(b64.length%4)b64+='=';
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const data=JSON.parse(new TextDecoder().decode(bytes));
  return Array.isArray(data)?data.filter(x=>x&&x.displayName&&x.uri).slice(0,5):[];
 }catch{return[]}
}
function setRestaurantPhotoCredit(card,attributions){
 const credit=card?.querySelector('.restaurant-photo-credit');if(!credit)return;
 const safe=(attributions||[]).map(x=>({name:String(x.displayName||''),uri:safeExternalUrl(x.uri)})).filter(x=>x.name&&x.uri).slice(0,3);
 if(!safe.length){credit.textContent='';credit.classList.remove('is-visible');return;}
 credit.innerHTML='Photo by '+safe.map(x=>'<a href="'+esc(x.uri)+'" target="_blank" rel="noopener noreferrer">'+esc(x.name)+'</a>').join(', ');
 credit.classList.add('is-visible');
}
async function hydrateGoogleRestaurantPhoto(row,scope){
 if(!row?.googlePlaceId||row?.photoSource!=='google-places')return;
 const imgs=[...document.querySelectorAll(scope+' img[data-google-photo-id]')].filter(img=>img.dataset.googlePhotoId===String(row.googlePlaceId));
 if(!imgs.length)return;
 const key=String(row.googlePlaceId);
 let pending=restaurantGooglePhotoInflight.get(key);
 if(!pending){
  pending=fetch('/api/restaurant-photo?placeId='+encodeURIComponent(key),{cache:'no-store'}).then(async res=>{
   if(!res.ok)throw new Error('Google photo unavailable');
   const blob=await res.blob();
   if(!blob.type.startsWith('image/'))throw new Error('Google photo response was not an image');
   return {url:URL.createObjectURL(blob),attributions:decodePhotoAttributions(res.headers.get('X-Restaurant-Photo-Attributions'))};
  }).finally(()=>restaurantGooglePhotoInflight.delete(key));
  restaurantGooglePhotoInflight.set(key,pending);
 }
 try{
  const data=await pending;
  imgs.forEach(img=>{
   if(!img.isConnected)return;
   img.src=data.url;
   img.dataset.googlePhotoLoaded='true';
   setRestaurantPhotoCredit(img.closest('.card,.restaurant-detail-hero'),data.attributions);
  });
 }catch{}
}
function phoneHref(raw){
 const digits=String(raw||'').replace(/[^+0-9]/g,'');
 if(/^\+/.test(digits))return 'tel:'+digits;
 if(/^1\d{10}$/.test(digits))return 'tel:+'+digits;
 if(/^\d{10}$/.test(digits))return 'tel:+1'+digits;
 return digits?'tel:'+digits:'';
}
function safeExternalUrl(raw){
 try{
  const u=new URL(String(raw||''),location.origin);
  if(u.protocol!=='https:')return '';
  const host=u.hostname.toLowerCase(),current=String(location.hostname||'').toLowerCase();
  const appBrandHost=/(^|[.-])(?:dinliminate|diliminate)([.-]|$)/i.test(host);
  if(host===current||appBrandHost)return '';
  return u.href;
 }catch{return '';}
}
const normKey=(v)=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const removeAllById = (id) => document.querySelectorAll('#'+id).forEach(el => el.remove());
const removeFoodOverlays = () => ['manageFoodsModal','manageFoodsModalBg','foodEditorModal','foodEditorModalBg'].forEach(removeAllById);
const uniq = (a) => [...new Map((a || []).filter(Boolean).map(x => [String(x.id || x.name), x])).values()];
const allFoods = () => [...getDefaultFoods(), ...S.custom.map(x=>({...x,quickCuts:Array.isArray(x.quickCuts)&&x.quickCuts.length?x.quickCuts:[x.category||'American']}))];
const STORAGE_VERSION = 4;
const PHOTO_DB_NAME = 'dinliminate.photos';
const PHOTO_STORE = 'images';
let photoDbPromise = null;
const storedPhotoIds = new Set();
function openPhotoDB() {
if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
if (photoDbPromise) return photoDbPromise;
photoDbPromise = new Promise((resolve,reject) => {
const req = indexedDB.open(PHOTO_DB_NAME,1);
req.onupgradeneeded = () => {
if (!req.result.objectStoreNames.contains(PHOTO_STORE)) req.result.createObjectStore(PHOTO_STORE);
};
req.onsuccess = () => resolve(req.result);
req.onerror = () => reject(req.error || new Error('Could not open photo storage'));
});
return photoDbPromise;
}
async function putStoredPhoto(id,data) {
try {
const db=await openPhotoDB();
await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put(data,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Could not save photo'));});
storedPhotoIds.add(id); return true;
} catch { return false; }
}
async function getStoredPhoto(id) {
try {
const db=await openPhotoDB();
return await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readonly');const req=tx.objectStore(PHOTO_STORE).get(id);req.onsuccess=()=>resolve(req.result||'');req.onerror=()=>reject(req.error||new Error('Could not read photo'));});
} catch { return ''; }
}
async function deleteStoredPhoto(id) {
try {
const db=await openPhotoDB();
await new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Could not delete photo'));});
} catch {}
}
async function hydrateCustomPhotos() {
let changed=false;
for (const item of S.custom) {
if (String(item.image||'').startsWith('idb:')) {
const data=await getStoredPhoto(item.id);
if (data) { item.image=data; storedPhotoIds.add(item.id); changed=true; }
else item.image=HUNGRY_IMAGE;
}
}
if(changed && S.screen==='food'){ buildFood(); foodQuick(); drawFood(); }
}
function updateStorageIndicator() {
const el=$('storageIndicator'); if(!el)return;
el.classList.toggle('hidden', !S.storageWarning);
}
async function migrateCustomPhotos() {
let changed=false;
for(const item of S.custom){
if(typeof item.image==='string' && item.image.startsWith('data:image/')){
const ok=await putStoredPhoto(item.id,item.image);
if(ok){ item.image='idb:'+item.id; changed=true; }
}
}
if(changed){ save(); if(S.screen==='food'){ buildFood(); foodQuick(); drawFood(); } }
}
function save() {
const data = {
screen:S.screen, hidden:[...S.hidden], hiddenRestaurants:S.hiddenRestaurants,
cutCats:[...S.cutCats], foodCuts:[...S.foodCuts], maybe:[...S.maybe],
pool:S.pool, index:S.index, foodActions:S.foodActions,
restaurantPool:S.restaurantPool, restaurantIndex:S.restaurantIndex,
restaurantCuts:[...S.restaurantCuts], restaurantActions:S.restaurantActions,
restaurantQuery:S.restaurantQuery, hoursMode:S.hoursMode, location:S.location, locationSource:S.locationSource,
saved:S.saved, winnerItem:S.winnerItem, winnerType:S.winnerType, schemaVersion:STORAGE_VERSION,
restaurantTimezone:S.restaurantTimezone||'', restaurantSearchOrigin:S.restaurantSearchOrigin, restaurantSearchDegraded:!!S.restaurantSearchDegraded, locationFreshAt:S.locationFreshAt||null, foodMaybeRound:!!S.foodMaybeRound, restaurantMaybeRound:!!S.restaurantMaybeRound,
custom:S.custom.map(x=>({...x,image:(String(x.image||'').startsWith('data:image/') && storedPhotoIds.has(x.id))?'idb:'+x.id:x.image}))
};
try {
localStorage.setItem(KEY, JSON.stringify(data));
S.storageWarning=false;
updateStorageIndicator();
S.saved=true;
return true;
} catch {
S.storageWarning=true;
updateStorageIndicator();
S.saved=true;
return false;
}
}
function load() {
try {
const raw = localStorage.getItem(KEY);
if (!raw) return false;
const d = JSON.parse(raw);

if(!Array.isArray(d.foodCuts)) d.foodCuts=[];
if(!d.foodCuts.length && Array.isArray(d.foodActions))
for(const a of d.foodActions) if(a?.type==='cut'&&a.id) d.foodCuts.push(a.id);
delete d.cutPrimary;
const legacyKeys=['cutPrimary','allCut','foodAllCut','savedRound','savedRoundType','legacyRestaurantPool','restaurantResults','pass','passDraftCount','passDraftNames','passDraftMode','passStartVoter'];
legacyKeys.forEach(key=>{try{delete d[key]}catch{}});
Object.assign(S, d);
legacyKeys.forEach(key=>{try{delete S[key]}catch{}});
S.hidden = new Set([...(d.hidden || []), ...(Array.isArray(d.deleted) ? d.deleted : [])]);
S.deleted = new Set();
S.hiddenRestaurants = d.hiddenRestaurants || {};
S.cutCats = new Set(d.cutCats || []);
S.foodCuts = new Set(d.foodCuts || []);
S.maybe = new Set(d.maybe || []);
S.foodMaybeRound = !!d.foodMaybeRound;
S.restaurantCuts = new Set(d.restaurantCuts || []);
S.hoursMode = d.hoursMode === 'all' ? 'all' : 'openUnknown';
S.foodActions = Array.isArray(d.foodActions) ? d.foodActions : [];
S.restaurantActions = Array.isArray(d.restaurantActions) ? d.restaurantActions : [];
S.restaurantMaybeRound = !!d.restaurantMaybeRound;
S.restaurantPool = Array.isArray(d.restaurantPool) ? d.restaurantPool : [];
S.custom = Array.isArray(d.custom) ? d.custom : [];
S.winnerType = d.winnerType || 'food';
S.restaurantTimezone = String(d.restaurantTimezone||'');
S.restaurantSearchOrigin = d.restaurantSearchOrigin && Number.isFinite(Number(d.restaurantSearchOrigin.lat)) && Number.isFinite(Number(d.restaurantSearchOrigin.lon)) ? {lat:Number(d.restaurantSearchOrigin.lat),lon:Number(d.restaurantSearchOrigin.lon)} : null;
S.locationSource = String(d.locationSource||'none');
S.locationFreshAt = Number.isFinite(Number(d.locationFreshAt)) ? Number(d.locationFreshAt) : null;
if(S.locationSource==='device' && S.location)S.locationSource='last';
S.restaurantSearchDegraded = !!d.restaurantSearchDegraded;
S.schemaVersion = STORAGE_VERSION;
return true;
} catch { return false; }
}
function show(screen) {
document.querySelectorAll('.screen').forEach(x => x.classList.add('hidden'));
$(screen)?.classList.remove('hidden');
S.screen = screen;
$('globalBack')?.classList.add('hidden');
$('appTopbar')?.classList.toggle('hidden', screen === 'food' || screen === 'restaurant');
window.scrollTo?.(0,0);
}
function closeOverlays() {

['drawer','drawerBg','modal','modalBg'].forEach(id => $(id)?.classList.add('hidden'));
['manageFoodsModal','manageFoodsModalBg','foodEditorModal','foodEditorModalBg','settingsModal','settingsModalBg','historyModal','historyModalBg','aboutModal','aboutModalBg','iphoneModal','iphoneModalBg','detailsModal','detailsModalBg'].forEach(id => $(id)?.remove());
clearSuggestions();
}
function home() {
closeOverlays();
S.screen = 'home';
show('home');
}
function foodPool(){
 return allFoods().filter(item=>{
  if(S.hidden.has(item.id)||S.foodCuts.has(item.id))return false;
  const cuts=Array.isArray(item.quickCuts)?item.quickCuts:[item.category];
  if([...S.cutCats].some(label=>cuts.includes(label)))return false;
  return true;
 });
}
function buildFood() {
S.pool = foodPool();
S.index = Math.max(0, Math.min(S.index, Math.max(0, S.pool.length - 1)));
}
function foodQuick() {
$('foodQuick').innerHTML = foodQuickLabels().map(label => {
const cut = S.cutCats.has(label);
const src=imageProxyUrl(QUICK_IMAGES[label] || QUICK_IMAGES.American);
return '<button class="chip photo-chip '+(cut?'cut':'')+'" data-food-quick="'+esc(label)+'"><img class="quick-chip-photo" src="'+esc(src)+'" data-fallback="'+esc(imageProxyUrl(QUICK_IMAGES.American))+'" alt="'+esc(label)+' meal photo"><span>'+esc(label)+'</span></button>';
}).join('');
bindImageFallbackAttrs('[data-food-quick] img');
document.querySelectorAll('[data-food-quick]').forEach(btn => {
btn.onclick = () => {
const label = btn.dataset.foodQuick;
S.cutCats.has(label) ? S.cutCats.delete(label) : S.cutCats.add(label);
S.index = 0;
buildFood();
foodQuick();
drawFood();
save();
};
});
}
function maybeShowSwipeHint(){
try{if(localStorage.getItem('dinliminate.swipeHint.v1'))return;localStorage.setItem('dinliminate.swipeHint.v1','1');}catch{}
document.querySelector('#swipeHint')?.remove();
const el=document.createElement('div');el.id='swipeHint';el.className='swipe-hint';el.textContent='Swipe left to Cut · right to Keep';
document.body.appendChild(el);
setTimeout(()=>el.remove(),2600);
}
function startFood() {
S.foodActions = [];
S.maybe.clear();
S.foodMaybeRound = false;
S.cutCats.clear();
S.foodCuts.clear();
S.index = 0;
S.winnerItem = null;
buildFood();
foodQuick();
show('food');
drawFood();
save();
maybeShowSwipeHint();
}
function foodChoiceIndex(rows,start,keepState=false){
 const len=rows.length;if(!len)return -1;
 for(let step=0;step<len;step++){const i=(start+step)%len;if(keepState?S.maybe.has(rows[i].id):!S.maybe.has(rows[i].id))return i;}
 return -1;
}
function drawFood(){
 if(!S.pool.length){winner({name:'Nothing left — hungry mode',image:HUNGRY_IMAGE,category:'Hungry'});return;}
 if(!S.foodMaybeRound){const ni=foodChoiceIndex(S.pool,S.index,false);if(ni>=0)S.index=ni;else if(S.maybe.size)S.foodMaybeRound=true;}
 const item=S.pool[S.index],img=$('foodImg');if(!img)return;
 img.src=foodPhoto(item);img.dataset.fallback=foodPhotoFallback(item);img.dataset.finalFallback=FINAL_FOOD_IMAGE;img.alt=item.name;img.referrerPolicy='no-referrer';img.loading='eager';
 img.onerror=function(){const fb=this.dataset.fallback||'',final=this.dataset.finalFallback||FINAL_FOOD_IMAGE,current=this.currentSrc||this.src;if(fb&&current!==fb){this.src=fb;return;}if(final&&current!==final){this.dataset.imageFallback='true';this.src=final;}};
 $('foodName').textContent=item.name;$('foodCat').textContent=item.category;$('foodCount').textContent=S.pool.length+(S.pool.length===1?' choice':' choices');
 const nextCard=$('foodNextCard');
 if(nextCard){
  let ni=S.pool.length>1?(S.foodMaybeRound?foodChoiceIndex(S.pool,(S.index+1)%S.pool.length,true):foodChoiceIndex(S.pool,(S.index+1)%S.pool.length,false)):-1;
  if(ni<0&&S.pool.length>1)ni=(S.index+1)%S.pool.length;
  const next=ni>=0?S.pool[ni]:null;nextCard.classList.toggle('hidden',!next);nextCard.style.display=next?'block':'none';
  if(next){const nimg=$('foodNextImg');nimg.src=foodPhoto(next);nimg.dataset.fallback=foodPhotoFallback(next);nimg.dataset.finalFallback=FINAL_FOOD_IMAGE;nimg.alt=next.name;nimg.referrerPolicy='no-referrer';nimg.loading='eager';nimg.onerror=function(){const fb=this.dataset.fallback||'',final=this.dataset.finalFallback||FINAL_FOOD_IMAGE,current=this.currentSrc||this.src;if(fb&&current!==fb){this.src=fb;return;}if(final&&current!==final){this.dataset.imageFallback='true';this.src=final;}};nextCard.style.transform='scale(.96)';}
 }
 bindFoodSwipe();$('foodDetails').onclick=()=>detailsSheet(item,'food');
}

function foodCommit(type,item){const unkept=S.pool.filter(x=>!S.maybe.has(x.id)).length;S.foodActions.push({type,id:item.id,primary:item.primary,index:S.index,maybeRound:!!S.foodMaybeRound,hadMaybe:S.maybe.has(item.id),recycleOnUndo:type==='cut'&&S.maybe.size>0&&unkept===1});}
function foodCut(item=S.pool[S.index]){
 if(!item)return;
 const unkept=S.pool.filter(x=>!S.maybe.has(x.id)).length;
 foodCommit('cut',item);
 const roundAfter=!!S.foodMaybeRound|| (S.maybe.size>0 && unkept<=1);
 S.foodActions[S.foodActions.length-1].roundAfter=roundAfter;
 S.foodCuts.add(item.id);buildFood();resolveFoodAfterDecision();
}
function foodMaybe(item=S.pool[S.index]){
 if(!item)return;
 if(S.pool.length===1){foodCommit('maybe',item);winner(item);return;}
 foodCommit('maybe',item);S.maybe.add(item.id);
 if(!S.foodMaybeRound){
  const ni=foodChoiceIndex(S.pool,(S.index+1)%S.pool.length,false);
  if(ni>=0)S.index=ni;else{S.foodMaybeRound=true;S.index=foodChoiceIndex(S.pool,(S.index+1)%S.pool.length,true);}
 }else S.index=foodChoiceIndex(S.pool,(S.index+1)%S.pool.length,true);
 drawFood();save();
}
function resolveFoodAfterDecision(){
 if(!S.pool.length){winner({name:'Nothing left — hungry mode',image:HUNGRY_IMAGE,category:'Hungry'});return;}
 if(!S.foodMaybeRound){const ni=foodChoiceIndex(S.pool,S.index,false);if(ni>=0)S.index=ni;else if(S.maybe.size){S.foodMaybeRound=true;S.index=foodChoiceIndex(S.pool,0,true);}}
 S.index=Math.max(0,Math.min(S.index,S.pool.length-1));drawFood();save();
}
function foodBack(){
 const action=S.foodActions.pop();if(!action){home();return;}
 if(action.type==='cut')S.foodCuts.delete(action.id);
 if(action.type==='maybe'){if(action.hadMaybe)S.maybe.add(action.id);else S.maybe.delete(action.id);}
 S.foodMaybeRound=!!action.maybeRound||!!action.recycleOnUndo||!!action.roundAfter;buildFood();
 const restored=S.pool.findIndex(x=>x.id===action.id);S.index=restored>=0?restored:Math.max(0,Math.min(action.index||0,Math.max(0,S.pool.length-1)));drawFood();save();
}

function bindSwipeCard(cardId,nextId,onCut,onMaybe) {
 const card=$(cardId);if(!card)return;
 const next=$(nextId);
 let downX=0,active=false,committed=false,pointerId=null,suppressClickUntil=0;
 card.style.touchAction='none';card.style.userSelect='none';card.style.webkitUserSelect='none';card.style.webkitTouchCallout='none';card.querySelectorAll('img').forEach(img=>{img.draggable=false;img.addEventListener('dragstart',e=>e.preventDefault(),{passive:false});});
 const reset=()=>{card.style.transition='';card.style.transform='';card.style.opacity='';card.dataset.swipe='';if(next)next.style.transform='scale(.96)';};
 const cleanup=()=>{
  try{if(pointerId!=null&&card.hasPointerCapture?.(pointerId))card.releasePointerCapture(pointerId);}catch{}
  pointerId=null;
 };
 const cancel=()=>{if(!active)return;active=false;committed=false;cleanup();reset();};
 const commit=(dx)=>{
  if(committed||!active)return;
  committed=true;active=false;cleanup();suppressClickUntil=Date.now()+350;
  card.style.transition='transform .16s ease,opacity .16s ease';
  card.style.transform='translateX('+(dx<0?-520:520)+'px) rotate('+(dx<0?-18:18)+'deg)';
  const action=dx<0?onCut:onMaybe;
  window.setTimeout(()=>{reset();action();},100);
 };
 const finish=(e)=>{
  if(!active)return;
  const dx=Number(e?.clientX||downX)-downX;
  if(Math.abs(dx)>=90)commit(dx);else{active=false;cleanup();reset();}
 };
 card.onpointerdown=e=>{
  if(e.isPrimary===false)return;
  if(e.button!=null&&e.button!==0)return;
  if(e.target.closest?.('button,a,input,select'))return;
  downX=e.clientX;active=true;committed=false;pointerId=e.pointerId;card.dataset.swipe='';
  try{card.setPointerCapture?.(e.pointerId);}catch{}
  if(e.cancelable)e.preventDefault();
 };
 card.onpointermove=e=>{
  if(!active||e.isPrimary===false||e.pointerId!==pointerId)return;
  const dx=e.clientX-downX;
  if(Math.abs(dx)>8){
   if(e.cancelable)e.preventDefault();
   card.style.transform='translateX('+dx+'px) rotate('+(dx/22)+'deg)';
   card.style.opacity=String(Math.max(.76,1-Math.abs(dx)/900));
   card.dataset.swipe=dx<0?'cut':'maybe';
  }
 };
 card.onpointerup=e=>finish(e);
 card.onpointercancel=cancel;
 card.onlostpointercapture=()=>{if(active)cancel();};
 card.onclick=e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopPropagation();}};
}
function bindFoodSwipe(){bindSwipeCard('foodCard','foodNextCard',()=>foodCut(),()=>foodMaybe())}
function appToast(message){
document.querySelector('#appToast')?.remove();
const el=document.createElement('div'); el.id='appToast'; el.className='app-toast'; el.textContent=message;
document.body.appendChild(el);
setTimeout(()=>el.remove(),2200);
}
function appConfirm(title, message, confirmLabel='Confirm') {
return new Promise(resolve => {
document.querySelector('#appConfirmModal')?.remove();
document.querySelector('#appConfirmModalBg')?.remove();
const restoreFocus=document.activeElement instanceof HTMLElement ? document.activeElement : null;
const bg=document.createElement('div'); bg.id='appConfirmModalBg'; bg.className='modal-bg';
const modal=document.createElement('section'); modal.id='appConfirmModal'; modal.className='modal confirm-modal';
modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-labelledby','appConfirmTitle'); modal.setAttribute('aria-describedby','appConfirmMessage');
modal.innerHTML='<div class="confirm-hero"><span class="confirm-mark" aria-hidden="true">×</span><div><small>CONFIRM ACTION</small><h3 id="appConfirmTitle">'+esc(title)+'</h3></div><button class="menu" type="button" id="appConfirmClose" aria-label="Close confirmation">×</button></div>'+
'<div class="confirm-copy" id="appConfirmMessage">'+esc(message)+'</div>'+
'<div class="confirm-actions"><button type="button" class="secondary" id="appConfirmCancel">Cancel</button><button type="button" class="danger-action" id="appConfirmOk">'+esc(confirmLabel)+'</button></div>';
document.body.append(bg,modal);
const focusables=()=>[...modal.querySelectorAll('button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')];
let done=false;
const finish=v=>{
if(done)return; done=true; modal.remove(); bg.remove(); if(restoreFocus&&document.contains(restoreFocus))restoreFocus.focus(); resolve(v);
};
$('appConfirmCancel').onclick=()=>finish(false);
$('appConfirmClose').onclick=()=>finish(false);
$('appConfirmOk').onclick=()=>finish(true);
bg.onclick=()=>finish(false);
modal.onkeydown=e=>{
if(e.key==='Escape'){e.preventDefault();finish(false);return}
if(e.key==='Tab'){
const nodes=focusables(); if(!nodes.length)return;
const first=nodes[0],last=nodes[nodes.length-1];
if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}
};
queueMicrotask(()=>$('appConfirmCancel')?.focus());
});
}
async function foodHideItem(item) {
if (!item) return false;
if (!await appConfirm('Hide this meal?', 'Hide '+item.name+' until you restore it in Settings.', 'Hide')) return false;
S.hidden.add(item.id);
buildFood();
S.index = Math.min(S.index, Math.max(0, S.pool.length - 1));
drawFood();
save();
return true;
}
async function foodHide() {
const item = S.pool[S.index];
if (!item) return;
if (!await appConfirm('Hide this meal?', 'Hide '+item.name+' until you restore it in Settings.', 'Hide')) return;
S.hidden.add(item.id);
buildFood();
S.index = Math.min(S.index, Math.max(0, S.pool.length - 1));
drawFood();
save();
}
function milesBetween(lat1,lon1,lat2,lon2){
 const a=Number(lat1),b=Number(lon1),c=Number(lat2),d=Number(lon2);
 if(![a,b,c,d].every(Number.isFinite))return NaN;
 const R=3958.7613,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,z=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;
 return 2*R*Math.asin(Math.sqrt(z));
}
function restaurantNameFamily(value){
 return normKey(String(value||'').replace(/[’']s\b/gi,' '));
}
function restaurantAddressFamily(value){
 const replacements={street:'st',road:'rd',avenue:'ave',boulevard:'blvd',drive:'dr',lane:'ln',parkway:'pkwy',highway:'hwy',route:'rte',circle:'cir',court:'ct',place:'pl',trail:'trl',terrace:'ter'};
 return normKey(value).split(' ').map(x=>replacements[x]||x).join(' ');
}
function dedupeRestaurantPool(rows){
 const out=[];
 for(const row of (rows||[])){
  if(!row)continue;
  const name=restaurantNameFamily(row.name),address=restaurantAddressFamily(row.address||'');
  const phone=String(row.phone||'').replace(/\D/g,'').slice(-10),website=String(row.website||'').toLowerCase().replace(/^https?:\/\/(?:www\.)?/,'').replace(/\/$/,'');
  const lat=Number(row.lat),lon=Number(row.lon);
  let match=out.find(x=>{
   const xn=restaurantNameFamily(x.name),xa=restaurantAddressFamily(x.address||'');
   const xp=String(x.phone||'').replace(/\D/g,'').slice(-10),xw=String(x.website||'').toLowerCase().replace(/^https?:\/\/(?:www\.)?/,'').replace(/\/$/,'');
   const dist=milesBetween(x.lat,x.lon,lat,lon);
   const sameName=!!name&&name===xn;
   const variant=(name&&xn&&(name.includes(xn)||xn.includes(name))&&Math.min(name.split(' ').length,xn.split(' ').length)>=2);
   const sameAddr=!!address&&!!xa&&address===xa;
   const sameContact=(phone&&xp&&phone===xp)||(website&&xw&&website===xw);
   const close=Number.isFinite(dist)&&dist<=0.35;
   return (sameContact&&close)||(sameAddr&&(sameName||variant))||(sameName&&close);
  });
  if(!match){out.push({...row});continue;}
  match.fastFood=match.fastFood||row.fastFood;
  if(typeof row.openNow==='boolean' && typeof match.openNow!=='boolean')match.openNow=row.openNow;
  for(const key of ['address','phone','website','opening_hours','photo','cuisine','brand','operator'])if(!match[key]&&row[key])match[key]=row[key];
  match.menuItems=[...new Set([...(Array.isArray(match.menuItems)?match.menuItems:[]),...(Array.isArray(row.menuItems)?row.menuItems:[])])].slice(0,10);
  match.distance=Math.min(Number(match.distance)||Infinity,Number(row.distance)||Infinity);
 }
 return out.sort((a,b)=>Number(a.distance)-Number(b.distance));
}
function restaurantCanonicalId(row){
const name=normKey(row?.name);
const address=normKey(row?.address);
const geo=(Number.isFinite(Number(row?.lat))&&Number.isFinite(Number(row?.lon))) ? Number(row.lat).toFixed(4)+'-'+Number(row.lon).toFixed(4) : '';
return 'restaurant-'+(name+'|'+(address||geo)).replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,150);
}
function restaurantHidden(row){
if(!row)return false;
if(S.hiddenRestaurants[row.id] || (row.canonicalId && S.hiddenRestaurants[row.canonicalId]))return true;
const targetName=normKey(row.name),targetAddr=normKey(row.address),targetCanonical=row.canonicalId||restaurantCanonicalId(row);
return Object.values(S.hiddenRestaurants||{}).some(x=>{
if(x.canonicalId && x.canonicalId===targetCanonical)return true;
if(normKey(x.name)!==targetName)return false;
if(targetAddr&&normKey(x.address)===targetAddr)return true;
if(x.lat!=null&&x.lon!=null&&row.lat!=null&&row.lon!=null){
const dlat=Math.abs(Number(x.lat)-Number(row.lat)),dlon=Math.abs(Number(x.lon)-Number(row.lon));
return dlat<0.001&&dlon<0.001;
}
return false;
});
}
function restaurantSearchText(row){
 return [
  row?.name,row?.brand,row?.operator,row?.category,row?.cuisine,
  restaurantCategory(row),
  ...(Array.isArray(row?.menuItems)?row.menuItems:[])
 ].filter(Boolean).join(' ');
}
const normalizeRestaurantSearch = RESTAURANT_TAXONOMY.normalizeRestaurantSearch;
const restaurantIdentityHay = RESTAURANT_TAXONOMY.identityHay;
function restaurantIsFastFood(row){
 return RESTAURANT_TAXONOMY.isFastFood(row);
}
function restaurantCuisineTags(row){
 const preset=Array.isArray(row?.quickCutTags)?row.quickCutTags:null;
 return preset ? [...new Set(preset)] : RESTAURANT_TAXONOMY.classifyRestaurant(row).tags;
}
function restaurantCuisineEvidence(row){
 return RESTAURANT_TAXONOMY.classifyRestaurant(row).evidence;
}
function restaurantCategory(row){
 const tags=restaurantCuisineTags(row),raw=String(row?.category||'').trim();
 if(tags.includes('Pizza'))return 'Pizza';
 if(/^(American|Mexican|Asian|Italian|Southern|BBQ|Seafood|Breakfast|Burgers)$/i.test(raw))return raw;
 for(const label of ['Mexican','Asian','Italian','Southern','BBQ','Seafood','Breakfast','Burgers','American','Fast Food']) if(tags.includes(label)) return label;
 return raw||'Restaurant';
}
function restaurantQuickMatches(row,label){
 return restaurantCuisineTags(row).includes(label);
}

const DAY_NAMES=['Su','Mo','Tu','We','Th','Fr','Sa'];
function dayMatches(spec,day){
const names=DAY_NAMES.map(x=>x.toLowerCase());
const want=names[day];
return String(spec||'').split(',').some(part=>{
const p=part.trim().toLowerCase();
if(!p)return false;
if(p===want)return true;
const m=p.match(/^(su|mo|tu|we|th|fr|sa)-(su|mo|tu|we|th|fr|sa)$/);
if(!m)return false;
const a=names.indexOf(m[1]),b=names.indexOf(m[2]);
return a<=b ? day>=a&&day<=b : day>=a||day<=b;
});
}
function localClockForZone(zone,now=new Date()){
const opts={timeZone:zone||undefined,hour12:false,weekday:'short',hour:'2-digit',minute:'2-digit'};
try{
const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',opts).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
const dayIndex={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[parts.weekday];
let hour=Number(parts.hour); if(hour===24)hour=0;
return {day:Number.isFinite(dayIndex)?dayIndex:new Date().getDay(),minute:hour*60+Number(parts.minute||0)};
}catch{return {day:new Date().getDay(),minute:new Date().getHours()*60+new Date().getMinutes()};}
}
function parseTime(t){
const m=String(t||'').match(/^(\d{1,2}):?(\d{2})$/);if(!m)return NaN;
const h=Number(m[1]),min=Number(m[2]);return (h>=0&&h<24&&min>=0&&min<60)?h*60+min:NaN;
}
function hourStatus(row,now=new Date(),zoneOverride=''){
if(row&&typeof row.openNow==='boolean')return row.openNow?'open':'closed';
const raw=String(row?.opening_hours||'').trim();
if(!raw)return 'unknown';
const low=raw.toLowerCase();
if(low==='24/7'||low==='open')return 'open';
if(low==='closed'||low==='off')return 'closed';
const clock=localClockForZone(zoneOverride||S.restaurantTimezone,now),day=clock.day,minute=clock.minute;
let matched=false;
for(const block of raw.split(';')){
const part=block.trim();if(!part)continue;
const dm=part.match(/^((?:Su|Mo|Tu|We|Th|Fr|Sa)(?:-(?:Su|Mo|Tu|We|Th|Fr|Sa))?(?:,(?:Su|Mo|Tu|We|Th|Fr|Sa)(?:-(?:Su|Mo|Tu|We|Th|Fr|Sa))?)*)\s+(.+)$/i);
const daySpec=dm?dm[1]:null,timeSpec=dm?dm[2]:part;
const ranges=[...timeSpec.matchAll(/(\d{1,2}:?\d{2})-(\d{1,2}:?\d{2})/g)];
if(!ranges.length)continue;
matched=true;
for(const r of ranges){
const a=parseTime(r[1]),b=parseTime(r[2]);if(!Number.isFinite(a)||!Number.isFinite(b))continue;
if(b>=a){
if((!daySpec||dayMatches(daySpec,day)) && minute>=a && minute<=b)return 'open';
}else{
const sameDay=(!daySpec||dayMatches(daySpec,day)) && minute>=a;
const previousDay=(!daySpec||dayMatches(daySpec,(day+6)%7)) && minute<=b;
if(sameDay||previousDay)return 'open';
}
}
}
return matched ? 'closed' : 'unknown';
}
function explicitClosed(row) { return hourStatus(row) === 'closed'; }
const RESTAURANT_SEARCH_ALIASES = RESTAURANT_TAXONOMY.aliases;
function restaurantSearchTermMatches(row,term,hay){
 const normalized=normalizeRestaurantSearch(term);
 if(!normalized)return true;
 const classification=RESTAURANT_TAXONOMY.restaurantSearchClassification(normalized);
 if(classification.kind==='category'&&classification.tag) return restaurantCuisineTags(row).includes(classification.tag);
 const words=normalized.split(' ').filter(Boolean);
 if(words.length===1 && ['restaurant','restaurants','place','places'].includes(words[0]))return true;
 return words.every(word=>hay.includes(word));
}
function restaurantMatchesQuery(row){
 const q=String(S.restaurantQuery||'').trim();
 if(!q)return true;
 const classification=RESTAURANT_TAXONOMY.restaurantSearchClassification(q);
 if(classification.kind==='category'&&classification.tag)return restaurantCuisineTags(row).includes(classification.tag);
 const hay=normalizeRestaurantSearch(restaurantSearchText(row));
 return q.split(/\s+/).filter(Boolean).every(term=>restaurantSearchTermMatches(row,term,hay));
}

function restaurantChoiceIndex(rows,start,keepState=false){
 const len=rows.length;if(!len)return -1;
 for(let step=0;step<len;step++){const i=(start+step)%len;if(keepState?!!rows[i]._maybe:!rows[i]._maybe)return i;}
 return -1;
}
function restaurantHourState(row){
 const normalized=String(row?.hoursState||'').toLowerCase();
 if(normalized==='open'||normalized==='closed'||normalized==='unknown')return normalized;
 const state=hourStatus(row);
 return state==='open'||state==='closed'||state==='unknown' ? state : 'unknown';
}
function restaurantPoolBase(){
 return (S.restaurantPool||[]).filter(row=>{
  if([...S.restaurantCuts].some(label=>restaurantQuickMatches(row,label)))return false;
  if(row._cut||row._hidden||restaurantHidden(row))return false;
  return restaurantMatchesQuery(row);
 });
}
function restaurantPoolFiltered(){
 return restaurantPoolBase().filter(row=>restaurantHoursFilter(row));
}
function restaurantHoursFilter(row){
 return S.hoursMode==='all' || restaurantHourState(row)!=='closed';
}
function updateRestaurantStatus(){
 const el=$('status'); if(!el)return;
 const radius=Math.min(100,Number($('radius')?.value)||10);
 const base=restaurantPoolBase();
 const states={open:0,unknown:0,closed:0};
 for(const row of base){const state=restaurantHourState(row);states[state]=(states[state]||0)+1;}
 const total=base.length,degraded=S.restaurantSearchDegraded;
 if(!total){
  el.textContent=degraded?'Restaurant sources are unavailable. Try again.':'No restaurants match the current filters.';
      return;
 }
 if(S.hoursMode==='all'){
  el.textContent=states.open+' open · '+states.unknown+' unknown · '+states.closed+' closed · '+total+' total · '+radius+' mi';
 }else{
  el.textContent=(states.open+states.unknown)+' open/unknown · '+states.closed+' closed hidden · '+total+' total · '+radius+' mi';
 }
}

function restaurantQuick() {
$('restQuick').innerHTML = REST_QUICK.map(label => {
const cut = S.restaurantCuts.has(label);
const src=imageProxyUrl(REST_QUICK_IMAGES[label] || REST_QUICK_IMAGES.American);
return '<button class="chip photo-chip '+(cut?'cut':'')+'" data-rest-quick="'+esc(label)+'"><img class="quick-chip-photo" src="'+esc(src)+'" data-fallback="'+esc(imageProxyUrl(REST_QUICK_IMAGES.American))+'" alt="'+esc(label)+' restaurant photo"><span>'+esc(label)+'</span></button>';
}).join('');
bindImageFallbackAttrs('[data-rest-quick] img');
document.querySelectorAll('[data-rest-quick]').forEach(btn => {
btn.onclick = () => {
const label = btn.dataset.restQuick;
S.restaurantCuts.has(label) ? S.restaurantCuts.delete(label) : S.restaurantCuts.add(label);
S.restaurantIndex = 0;
restaurantQuick();
drawRestaurants();
save();
};
});
}
function renderLocationSource(){
const el=$('locationSourceLabel'); if(!el)return;
const labels={device:'Using your location',last:'Last used location',address:'Using selected address',typed:'Address needs selection',none:'No location selected'};
el.textContent=labels[S.locationSource]||labels.none;
el.classList.toggle('is-ready',S.locationSource==='device'||S.locationSource==='address');
renderFindButton();
}
function setLocation(lat, lon, label, source='address') {
S.location = {lat, lon, label};
S.locationSource = source;
if(source==='device')S.locationFreshAt=Date.now();
else S.locationFreshAt=null;
$('address').value = label || 'Current location';
renderLocationSource();
save();
}
let suggestController = null;
let restaurantSearchController = null;
let reverseLocationController = null;
let locationRequestActive = false;
let locationRequestSeq = 0;
function renderFindButton(){
 const btn=$('find');if(!btn)return;
 btn.textContent=S.location?'Refresh':'Find';
 btn.setAttribute('aria-label',S.location?'Refresh restaurant search':'Find restaurants');
}
function setFindBusy(busy) {
const btn=$('find'); if(!btn)return;
btn.disabled=busy; btn.setAttribute('aria-busy',String(busy)); btn.textContent=busy?'Searching…':(S.location?'Refresh':'Find');
}
function setLocationBusy(busy) {
const btn=$('locate');if(!btn)return;
btn.disabled=busy;
btn.setAttribute('aria-busy',String(busy));
btn.setAttribute('aria-label',busy?'Getting your location…':'Use My Location');
btn.title=busy?'Getting your location…':'Use My Location';
}
function requestBrowserPosition(options={}) {
return new Promise((resolve,reject)=>{
  navigator.geolocation.getCurrentPosition(resolve,reject,options);
});
}
function locationMovedMiles(a,b) {
return milesBetween(a?.lat,a?.lon,b?.lat,b?.lon);
}
async function reverseLocationLabel(lat,lon,seq) {
reverseLocationController?.abort();
const ctl=new AbortController();
reverseLocationController=ctl;
const timer=setTimeout(()=>ctl.abort(),5000);
try{
const r=await fetch('/api/restaurant-search?mode=reverse&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon),{signal:ctl.signal});
const d=await r.json();
if(seq!==locationRequestSeq||ctl.signal.aborted)return null;
if(!r.ok||!d.ok)return null;
return String(d.display||'Current location');
}catch{return null}
finally{clearTimeout(timer);if(reverseLocationController===ctl)reverseLocationController=null;}
}
async function useLocation() {
if (!navigator.geolocation) {
$('status').textContent='Location is not available in this browser.';
return;
}
if(locationRequestActive)return;
const seq=++locationRequestSeq;
locationRequestActive=true;
setLocationBusy(true);
invalidateAddressSuggestions();
$('status').textContent='Finding your location…';
try{
const first=await requestBrowserPosition({enableHighAccuracy:false,timeout:6000,maximumAge:60000});
if(seq!==locationRequestSeq)return;
const firstLoc={lat:Number(first.coords.latitude),lon:Number(first.coords.longitude)};
if(!Number.isFinite(firstLoc.lat)||!Number.isFinite(firstLoc.lon))throw new Error('Invalid location coordinates.');
setLocation(firstLoc.lat,firstLoc.lon,'Current location','device');
$('status').textContent='Location found. Searching restaurants…';
const initialSearch=searchRestaurants();
const labelPromise=reverseLocationLabel(firstLoc.lat,firstLoc.lon,seq);
let fresh=null;
try{
const pos=await requestBrowserPosition({enableHighAccuracy:true,timeout:10000,maximumAge:0});
if(seq===locationRequestSeq)fresh={lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)};
}catch{}
await initialSearch.catch(()=>{});
if(seq!==locationRequestSeq)return;
const label=await labelPromise;
if(label){
S.location={...S.location,label};
$('address').value=label;
save();
}
if(fresh&&Number.isFinite(fresh.lat)&&Number.isFinite(fresh.lon)){
const moved=locationMovedMiles(firstLoc,fresh);
if(Number.isFinite(moved)&&moved>=0.1){
const freshLabel=await reverseLocationLabel(fresh.lat,fresh.lon,seq);
if(seq!==locationRequestSeq)return;
setLocation(fresh.lat,fresh.lon,freshLabel||'Current location','device');
$('status').textContent='Location updated. Refreshing restaurants…';
await searchRestaurants().catch(()=>{});
}else{
S.locationFreshAt=Date.now();
S.locationSource='device';
renderLocationSource();
save();
}
}
if(seq===locationRequestSeq && !S.locationFreshAt)S.locationFreshAt=Date.now();
if(seq===locationRequestSeq && !/^Location updated/.test($('status').textContent))$('status').textContent='Location ready.';
}catch(err){
if(seq!==locationRequestSeq)return;
const code=Number(err?.code);
if(code===1)$('status').textContent='Location permission was denied. Enter an address instead.';
else if(code===3)$('status').textContent='Location timed out. Enter an address instead.';
else if(code===2)$('status').textContent='Location is temporarily unavailable. Enter an address instead.';
else $('status').textContent=err?.message||'Could not access your location. Enter an address instead.';
}finally{
if(seq===locationRequestSeq){
locationRequestActive=false;
setLocationBusy(false);
renderLocationSource();
}
}
}
let suggestTimer = 0;
let suggestSeq = 0;
let suggestionIndex = -1;
const suggestCache = new Map();
function invalidateAddressSuggestions() {
  suggestSeq++;
  clearTimeout(suggestTimer);
  suggestTimer=0;
  suggestController?.abort();
  suggestController=null;
  clearSuggestions();
}
function addressLooksComplete(value) {
  const q=String(value||'').trim().replace(/\s+/g,' ');
  if(!/^\d+\s+[^,]+/i.test(q))return false;
  if(/\b\d{5}(?:-\d{4})?\b/.test(q))return true;
  const parts=q.split(',').map(x=>x.trim()).filter(Boolean);
  if(parts.length>=3&&/\b[A-Z]{2}\b/i.test(parts[parts.length-2]))return true;
  const last=parts[parts.length-1]||'';
  return parts.length>=2&&/\b[A-Za-z][A-Za-z .'-]+\s+[A-Z]{2}\b/i.test(last);
}
async function chooseAddressSuggestion(index) {
  const opts=[...document.querySelectorAll('#suggestionsBox [data-suggestion]')];
  const btn=opts[index];
  if(!btn)return false;
  btn.click();
  return true;
}
async function suggestAddresses() {
const q = $('address').value.trim();
const seq = ++suggestSeq;
if (q.length < 2) { clearSuggestions(); $('status').textContent='Enter an address or use your location.'; return; }
const cached=suggestCache.get(q.toLowerCase());
if(cached&&Date.now()-cached.t<300000){ renderSuggestions(cached.rows); return; }
$('status').textContent='Searching addresses…';
clearTimeout(suggestTimer);
suggestTimer=setTimeout(async()=>{
suggestController?.abort();
suggestController=new AbortController();
try{
const r=await fetch('/api/restaurant-search?mode=suggest&q='+encodeURIComponent(q),{signal:suggestController.signal});
const d=await r.json();
if(seq!==suggestSeq)return;
const rows=Array.isArray(d.results)?d.results:[];
suggestCache.set(q.toLowerCase(),{t:Date.now(),rows});
renderSuggestions(rows);
}catch(e){
if(e?.name==='AbortError')return;
clearSuggestions();$('status').textContent='Address lookup is temporarily unavailable.';
}
},380);
}
function renderSuggestions(rows) {
suggestionIndex = -1;
let box = $('suggestionsBox');
if (!box) {
box = document.createElement('div');
box.id = 'suggestionsBox';
$('address').insertAdjacentElement('afterend', box);
}
box.innerHTML = (rows || []).map((row, i) =>
'<button type="button" role="option" aria-selected="false" id="addressSuggestion-'+i+'" data-suggestion="'+i+'">'+esc(row.display)+'</button>'
).join('');
const hasRows=!!rows?.length;
box.hidden=!hasRows;
box.style.display=hasRows ? 'grid' : 'none';
$('address')?.setAttribute('aria-expanded',String(hasRows));
$('address')?.removeAttribute('aria-activedescendant');
box.querySelectorAll('[data-suggestion]').forEach((btn, i) => {
  btn.onclick = async () => {
    const row = rows[i];
    suggestionIndex = -1;
    invalidateAddressSuggestions();
    setLocation(row.lat, row.lon, row.display,'address');
    $('status').textContent = 'Location selected. Searching restaurants…';
    await searchRestaurants();
  };
});
}
function clearSuggestions() {
suggestionIndex = -1;
const box = $('suggestionsBox');
if (box) { box.style.display = 'none'; box.hidden=true; }
$('address')?.setAttribute('aria-expanded','false');
$('address')?.removeAttribute('aria-activedescendant');
}
function moveSuggestion(delta){
const opts=[...document.querySelectorAll('#suggestionsBox [data-suggestion]')];
if(!opts.length)return false;
suggestionIndex=(suggestionIndex+delta+opts.length)%opts.length;
opts.forEach((el,i)=>el.setAttribute('aria-selected',String(i===suggestionIndex)));
const active=opts[suggestionIndex];
$('address')?.setAttribute('aria-activedescendant',active.id);
active.scrollIntoView?.({block:'nearest'});
return true;
}
let restaurantSearchSeq = 0;
async function responseJson(response, message){
let body=null;
try{body=await response.json();}catch{throw new Error(message||'The restaurant search returned an invalid response.');}
return body;
}
async function fetchRestaurantEndpoint(url,signal){
let lastError=null;
for(let attempt=0;attempt<2;attempt++){
  try{
    const response=await fetch(url,{signal});
    if(response.ok || attempt===1 || ![429,500,502,503,504].includes(response.status)) return response;
    await new Promise(resolve=>setTimeout(resolve,response.status===429?500:250));
    if(signal?.aborted) throw Object.assign(new Error('Aborted'),{name:'AbortError'});
  }catch(e){
    if(e?.name==='AbortError')throw e;
    lastError=e;
    if(attempt===1)throw e;
    await new Promise(resolve=>setTimeout(resolve,250));
    if(signal?.aborted) throw Object.assign(new Error('Aborted'),{name:'AbortError'});
  }
}
throw lastError||new Error('Restaurant service unavailable.');
}
async function searchRestaurants() {
invalidateAddressSuggestions();
const searchSeq = ++restaurantSearchSeq;
restaurantSearchController?.abort();
restaurantSearchController = new AbortController();
const signal=restaurantSearchController.signal;
let timedOut=false;
const deadline=setTimeout(()=>{timedOut=true;restaurantSearchController.abort()},14500);
clearSuggestions(); setFindBusy(true); $('status').textContent = 'Searching restaurants…';
$('restStage').innerHTML='';
try {
let loc = S.location;
if (!loc) {
const q = $('address').value.trim();
if (!q) { $('status').textContent = 'Enter an address or use your location.'; return; }
const rr = await fetchRestaurantEndpoint('/api/restaurant-search?mode=resolve&q='+encodeURIComponent(q),signal);
const rd = await responseJson(rr,'Could not locate that address. Please try another address.');
if (searchSeq !== restaurantSearchSeq) return;
if (!rr.ok || !rd.ok) throw new Error(rr.status===429 ? 'Address lookup is temporarily busy. Please try again.' : (rd.message || 'Could not locate that address.'));
loc = {lat:rd.lat, lon:rd.lon, label:rd.display}; S.location = loc; S.locationSource='address'; renderLocationSource(); $('address').value = rd.display;
}
const radius = Number($('radius').value) || 10;
const searchTerm = String(S.restaurantQuery||'').trim().slice(0,100);
const queryParam = searchTerm ? '&q='+encodeURIComponent(searchTerm) : '';
const rr = await fetchRestaurantEndpoint('/api/restaurant-search?mode=search&lat='+encodeURIComponent(loc.lat)+'&lon='+encodeURIComponent(loc.lon)+'&radius='+radius+queryParam,signal);
const d = await responseJson(rr,'Restaurant search returned an invalid response. Please try again.');
if (searchSeq !== restaurantSearchSeq) return;
if (!rr.ok || !d.ok) throw new Error(rr.status===429 ? 'Restaurant search is temporarily busy. Please try again.' : (d.message || 'Restaurant search failed.'));
S.restaurantTimezone = String(d.timezone||'');
S.restaurantSearchDegraded = !!(d.providerErrors?.length);
S.restaurantSearchLatencyMs = Number(d.searchLatencyMs)||0;
S.restaurantSearchQuery = String(d.searchQuery||searchTerm||'');
S.restaurantSearchBudgetMs = Number(d.searchBudgetMs)||12000;
const previousOrigin=S.restaurantSearchOrigin;
const sameSearchOrigin=previousOrigin&&Math.abs(Number(previousOrigin.lat)-Number(loc.lat))<0.0005&&Math.abs(Number(previousOrigin.lon)-Number(loc.lon))<0.0005;
const previousRows=sameSearchOrigin?(S.restaurantPool||[]).map(row=>({...row,distance:milesBetween(row.lat,row.lon,loc.lat,loc.lon)})).filter(row=>Number.isFinite(Number(row.distance))&&Number(row.distance)<=radius):[];
const incomingRows=(d.results || []).map(row => ({...row, providerId:row.id, canonicalId:restaurantCanonicalId(row), hoursState:restaurantHourState(row), _maybe:false, _cut:false, _hidden:false})).filter(row=>{
 const dist=milesBetween(row.lat,row.lon,loc.lat,loc.lon);
 return !Number.isFinite(dist) || dist<=radius+0.05;
});
S.restaurantPool = dedupeRestaurantPool([...incomingRows,...previousRows]);
S.restaurantSearchOrigin = {lat:Number(loc.lat),lon:Number(loc.lon)};
S.restaurantIndex = 0; S.restaurantActions = []; S.restaurantMaybeRound = false;
renderHours(); S.winnerItem = null;
const poolFastFoodCount=S.restaurantPool.filter(r=>restaurantIsFastFood(r)).length;
if(S.restaurantPool.length) {
  updateRestaurantStatus();
} else {
  $('status').textContent = d.providerErrors?.length ? 'Restaurant sources are unavailable. Try again.' : 'No restaurants found in this radius.';
}
restaurantQuick(); drawRestaurants(); save();
} catch (err) {
if (err?.name==='AbortError' || searchSeq !== restaurantSearchSeq) return;
S.restaurantSearchDegraded=true;
if(S.restaurantPool?.length){
  drawRestaurants();
  $('status').textContent = (timedOut ? 'Refresh took too long.' : (err?.message || 'Refresh failed.'))+' Showing the previous results.';
}else{
  S.restaurantPool=[]; S.restaurantIndex=0; S.restaurantActions=[]; drawRestaurants();
  $('status').textContent = timedOut ? 'The restaurant search took too long. Please try again.' : (err?.message || 'Could not complete the search.');
}
} finally {
clearTimeout(deadline);
if(searchSeq===restaurantSearchSeq) setFindBusy(false);
}
}
function openRestaurant() {
S.screen = 'restaurant';
S.restaurantActions = [];
S.restaurantMaybeRound = false;
S.restaurantQuery = '';
S.restaurantCuts.clear();
for (const row of S.restaurantPool || []) {
row._cut = false;
row._maybe = false;
}
S.winnerItem = null;
show('restaurant');
restaurantQuick();
renderHours();
$('restaurantSearchBox')?.classList.add('hidden');
$('restaurantQuery').value = '';
maybeShowSwipeHint();
}
function drawRestaurants() {
const rows = restaurantPoolFiltered();
updateRestaurantStatus();
const countEl = $('restaurantCount');
if (countEl) countEl.textContent = rows.length + (rows.length === 1 ? ' choice' : ' choices');
if (!rows.length) {
const hasResults=!!S.restaurantPool.length;
const message=hasResults ? 'No restaurants match the current cuts.' : (S.restaurantSearchDegraded ? 'Some restaurant sources are unavailable.' : (S.location ? 'No restaurants found in this radius.' : 'Set a location, then find restaurants.'));
const actions = (S.location || hasResults) ? '<div class="empty-actions">'+(hasResults?'<button class="secondary" id="clearRestaurantSearch">Clear filter</button>':'')+(S.location?'<button class="cut" id="retryRestaurantSearch">Retry Search</button>':'')+'</div>' : '';
$('restStage').innerHTML = '<div class="empty"><b>Hungry.</b><span>'+esc(message)+'</span>'+actions+'</div>';
if($('retryRestaurantSearch')) $('retryRestaurantSearch').onclick=searchRestaurants;
if($('clearRestaurantSearch')) $('clearRestaurantSearch').onclick=()=>{S.restaurantQuery=''; if($('restaurantQuery'))$('restaurantQuery').value=''; drawRestaurants(); save();};
return;
}
S.restaurantIndex = Math.max(0, Math.min(S.restaurantIndex, rows.length - 1));
if(!S.restaurantMaybeRound){const ni=restaurantChoiceIndex(rows,S.restaurantIndex,false);if(ni>=0)S.restaurantIndex=ni;else if(rows.some(x=>x._maybe)){S.restaurantMaybeRound=true;S.restaurantIndex=restaurantChoiceIndex(rows,0,true);}}
const row = rows[S.restaurantIndex];
const category = restaurantCategory(row);
const restaurantFallback = (r) => imageProxyUrl(r?.photo || r?.photoFallback || r?.image || FINAL_RESTAURANT_IMAGE);
const image = restaurantFallback(row);
const nextRow = rows[S.restaurantIndex + 1];
const nextImage = restaurantFallback(nextRow);
const cardLocation = row.address ? '<div class="restaurant-card-location" title="'+esc(row.address)+'">⌖ '+esc(String(row.address).split(',').slice(0,2).join(', '))+'</div>' : '';
const cardPhoneHref = row.phone ? phoneHref(row.phone) : restaurantPhoneSearchUrl(row);
const cardPhoneLabel = row.phone ? 'Call '+esc(row.name) : 'Find '+esc(row.name)+' phone on Google';
const cardPhoneAction = '<a class="restaurant-card-utility" href="'+esc(cardPhoneHref)+'" '+(row.phone?'':'target="_blank" rel="noopener noreferrer"')+' aria-label="'+cardPhoneLabel+'" title="'+(row.phone?'Call':'Phone lookup')+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 4.8 9.9 4a1.4 1.4 0 0 1 1.6.7l1.1 2.6a1.4 1.4 0 0 1-.3 1.5l-1.5 1.5a12.3 12.3 0 0 0 4.2 4.2l1.5-1.5a1.4 1.4 0 0 1 1.5-.3l2.6 1.1a1.4 1.4 0 0 1 .7 1.6l-.8 2.7a1.4 1.4 0 0 1-1.4 1.1C11.4 19.2 4.8 12.6 4.8 5.9A1.4 1.4 0 0 1 7.2 4.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></a>';
const directWebsite=!!safeExternalUrl(row.website)||!!safeExternalUrl(knownRestaurantWebsite(row));
const websiteUrl=restaurantWebsiteUrl(row);
const cardWebsite = '<a class="restaurant-card-utility" href="'+esc(websiteUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="'+(directWebsite?'Open '+esc(row.name)+' website':'Search '+esc(row.name)+' website on Google')+'" title="'+(directWebsite?'Website':'Website search')+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 10.5 18 6m0 0h-3.8M18 6v3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 13.5v3.25A1.25 1.25 0 0 1 15.75 18h-9.5A1.25 1.25 0 0 1 5 16.75v-9.5A1.25 1.25 0 0 1 6.25 6H9.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></a>';
const cardDetailsAction = '<button class="restaurant-card-utility" id="restDetails" type="button" aria-label="Details" title="Details"><svg class="details-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 7.25h2M11 7.25h7M6 12h2M11 12h7M6 16.75h2M11 16.75h5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
const cardUtilityRow='<div class="restaurant-card-meta-row"><span class="restaurant-card-meta">'+esc(category)+(row.distance != null ? ' · '+Number(row.distance).toFixed(1)+' mi' : '')+'</span><div class="restaurant-card-utilities">'+cardDetailsAction+cardPhoneAction+cardWebsite+'</div></div>';
$('restStage').innerHTML =
'<div class="restaurant-card-stack"><article class="card next-card '+(nextRow?'':'hidden')+'" id="restaurantNextCard" aria-hidden="true"><img src="'+esc(nextImage)+'" data-restaurant-photo-id="'+esc(nextRow?.googlePlaceId||'')+'" data-google-photo-id="'+esc(nextRow?.googlePlaceId&&nextRow?.photoSource==='google-places'?nextRow.googlePlaceId:'')+'" data-fallback="'+esc(nextRow?.photoFallback||FINAL_RESTAURANT_IMAGE)+'" data-final-fallback="'+FINAL_RESTAURANT_IMAGE+'" alt="'+esc(nextRow?.name||'')+'"><div class="shade"></div><div class="restaurant-photo-credit" aria-live="polite"></div></article><article class="card" id="restaurantCard"><img src="'+esc(image)+'" data-restaurant-photo-id="'+esc(row.googlePlaceId||'')+'" data-google-photo-id="'+esc(row.googlePlaceId&&row.photoSource==='google-places'?row.googlePlaceId:'')+'" data-fallback="'+esc(row.photoFallback||FINAL_RESTAURANT_IMAGE)+'" data-final-fallback="'+FINAL_RESTAURANT_IMAGE+'" alt="'+esc(row.name)+'"><div class="shade"></div><div class="restaurant-photo-credit" aria-live="polite"></div><div class="card-copy">'+cardUtilityRow+'<h3>'+esc(row.name)+'</h3>'+cardLocation+'</div></div></article></div>'+
'<div class="swipe-actions" aria-label="Restaurant decision controls"><button class="round-action round-back secondary" id="restBack" aria-label="Back"><span>↶</span></button><button class="round-action round-cut cut" id="restCut" aria-label="Cut"><span>✕</span></button><button class="round-action round-maybe maybe" id="restMaybe" aria-label="Maybe"><span>♥</span></button><button class="round-action round-hide secondary" id="restHide" aria-label="Hide"><span>⌁</span></button></div>';
const current = rows[S.restaurantIndex];
bindCardButton('restBack', restaurantBack);
bindCardButton('restMaybe', () => restaurantMaybe(current));
bindCardButton('restCut', () => restaurantCut(current));
bindCardButton('restHide', async () => { await restaurantHide(current); });
bindCardButton('restDetails', () => detailsSheet(current,'restaurant'));
bindRestaurantSwipe(current);
bindImageFallback('#restStage img',restaurantFallback(row),FINAL_RESTAURANT_IMAGE);
hydrateGoogleRestaurantPhoto(row,'#restStage #restaurantCard');
if(nextRow?.googlePlaceId&&nextRow?.photoSource==='google-places')hydrateGoogleRestaurantPhoto(nextRow,'#restStage #restaurantNextCard');
}
function restaurantCut(row){
 if(!row)return;
 const unkept=restaurantPoolFiltered().filter(x=>!x._maybe).length;
 S.restaurantActions.push({type:'cut',id:row.id,index:S.restaurantIndex,maybeRound:!!S.restaurantMaybeRound,hadMaybe:!!row._maybe,roundAfter:!!S.restaurantMaybeRound||(Array.isArray(S.restaurantPool)&&S.restaurantPool.some(x=>x._maybe)&&unkept<=1)});
 row._cut=true;
 const remaining=restaurantPoolFiltered();
 if(!remaining.length)winner({name:'Nothing left — hungry mode',image:HUNGRY_IMAGE,category:'Hungry'});else{S.restaurantIndex=Math.min(S.restaurantIndex,remaining.length-1);drawRestaurants();}
 save();
}

function restaurantMaybe(row){
 if(!row)return;const rows=restaurantPoolFiltered();if(rows.length===1){winner(row);return;}
 const wasRecycle=S.restaurantMaybeRound;S.restaurantActions.push({type:'maybe',id:row.id,index:S.restaurantIndex,maybeRound:wasRecycle,hadMaybe:!!row._maybe});row._maybe=true;
 const remaining=restaurantPoolFiltered(),next=restaurantChoiceIndex(remaining,(S.restaurantIndex+1)%Math.max(1,remaining.length),wasRecycle);
 if(next>=0)S.restaurantIndex=next;else{S.restaurantMaybeRound=true;S.restaurantIndex=restaurantChoiceIndex(remaining,0,true);}
 drawRestaurants();save();
}

function restaurantBack(){
 const action=S.restaurantActions.pop();if(!action){home();return;}
 const row=S.restaurantPool.find(x=>x.id===action.id);if(row){if(action.type==='cut')row._cut=false;if(action.type==='maybe')row._maybe=!!action.hadMaybe;}
 S.restaurantMaybeRound=!!action.maybeRound||!!action.roundAfter;const rows=restaurantPoolFiltered(),restored=rows.findIndex(x=>x.id===action.id);
 S.restaurantIndex=restored>=0?restored:Math.max(0,Math.min(action.index||0,Math.max(0,rows.length-1)));drawRestaurants();save();
}

async function restaurantHide(row) {
if (!row) return false;
if (!await appConfirm('Hide this restaurant?', 'Hide '+row.name+' until you restore it in Settings.', 'Hide')) return false;
row._hidden = true;
S.hiddenRestaurants[row.id] = {
id:row.id,canonicalId:row.canonicalId||restaurantCanonicalId(row),name:row.name,photo:row.photo||row.image||'',category:restaurantCategory(row),
address:row.address||'',phone:row.phone||'',lat:row.lat,lon:row.lon,website:row.website||''
};
drawRestaurants();
save();
return true;
}
function bindCardButton(id,handler){
 const el=$(id);
 if(!el)return;
 el.setAttribute('type',el.getAttribute('type')||'button');
 el.onclick=e=>{
  e.preventDefault();
  e.stopPropagation();
  try{const result=handler?.(e);if(result&&typeof result.catch==='function')result.catch(()=>{});}catch{}
 };
}
function bindRestaurantSwipe(row){bindSwipeCard('restaurantCard','restaurantNextCard',()=>restaurantCut(row),()=>restaurantMaybe(row))}
function setRestaurantHoursMode(mode){
 S.hoursMode=mode==='all'?'all':'openUnknown';
 S.restaurantIndex=0;
 renderHours();
 drawRestaurants();
 save();
}
function renderHours(){
 const openBtn=$('hoursOpenUnknown'),allBtn=$('hoursAll');
 if(!openBtn||!allBtn)return;
 const openMode=S.hoursMode==='openUnknown';
 openBtn.classList.toggle('active-tool',openMode);
 allBtn.classList.toggle('active-tool',!openMode);
 openBtn.setAttribute('aria-pressed',String(openMode));
 allBtn.setAttribute('aria-pressed',String(!openMode));
 openBtn.setAttribute('aria-label','Show open and unknown-hour restaurants');
 allBtn.setAttribute('aria-label','Show all restaurants including closed');
}
let restaurantQueryTimer = 0;
function scheduleRestaurantProviderSearch(){
 clearTimeout(restaurantQueryTimer);
 const q=String(S.restaurantQuery||'').trim();
 if(q.length<2)return;
 restaurantQueryTimer=setTimeout(()=>{searchRestaurants();},650);
}
function bindRestaurantTools(){
 $('restaurantSearch').onclick=()=>{const box=$('restaurantSearchBox');box.classList.toggle('hidden');$('restaurantQuery').value=S.restaurantQuery;if(!box.classList.contains('hidden'))$('restaurantQuery').focus();};
$('restaurantQuery').oninput=()=>{
   const previousQuery=String(S.restaurantQuery||'').trim();
   S.restaurantQuery=$('restaurantQuery').value;
   S.restaurantIndex=0;
   drawRestaurants();
   save();
   if(!String(S.restaurantQuery||'').trim() && previousQuery){
     clearTimeout(restaurantQueryTimer);
     searchRestaurants();
     return;
   }
   scheduleRestaurantProviderSearch();
};
 $('restaurantQuery').onkeydown=e=>{
   if(e.key==='Enter'){
     e.preventDefault();
     clearTimeout(restaurantQueryTimer);
     if(String(S.restaurantQuery||'').trim())searchRestaurants();
   }
 };
 const hoursOpenBtn=$('hoursOpenUnknown'),hoursAllBtn=$('hoursAll');
 if(hoursOpenBtn){
   hoursOpenBtn.onclick=e=>{e.preventDefault();e.stopPropagation();setRestaurantHoursMode('openUnknown');};
 }
 if(hoursAllBtn){
   hoursAllBtn.onclick=e=>{e.preventDefault();e.stopPropagation();setRestaurantHoursMode('all');};
 }
 renderHours();
}

function triggerCelebration() {
const el = $('celebration');
if (!el) return;
el.innerHTML = '';
const colors = ['#ffb04a','#ffd76a','#f5f1e8','#ff6b57','#9ee7ff'];
for (let b=0;b<3;b++) {
const burst = document.createElement('div');
burst.className='firework-burst burst-'+(b+1);
for (let i=0;i<18;i++) {
const p=document.createElement('span');
p.style.setProperty('--angle',(i*20)+'deg');
p.style.setProperty('--delay',(b*0.11 + (i%5)*0.015)+'s');
p.style.setProperty('--color',colors[i%colors.length]);
burst.appendChild(p);
}
el.appendChild(burst);
}
el.classList.remove('hidden');
window.setTimeout(()=>el.classList.add('hidden'),2400);
}
function winner(item) {
S.winnerItem = item;
S.winnerType = S.screen === 'restaurant' ? 'restaurant' : 'food';
if (item?.category !== 'Hungry' && item?.id) recordHistory(item, S.winnerType);
show('winner');
const hungry = item?.category === 'Hungry';
$('winName').textContent = hungry ? 'HUNGRY ☹' : item.name;
const winImg = $('winImg');
if (!winImg) return;
winImg.classList.toggle('hungry-image', hungry);
const winnerImage=item?.image || item?.photo || item?.photoFallback || HUNGRY_IMAGE;
winImg.src = winnerImage;
winImg.alt = item.name || 'Hungry';
winImg.dataset.googlePhotoId = item?.googlePlaceId && item?.photoSource==='google-places' ? String(item.googlePlaceId) : '';
if ($('celebration')) $('celebration').classList.toggle('hidden', hungry);
 const hungryNote=$('hungryNote'); if(hungryNote){hungryNote.textContent=hungry?'Fish Sticks?':''; hungryNote.classList.toggle('hidden',!hungry);}
 if (!hungry) {
   triggerCelebration();
   hydrateGoogleRestaurantPhoto(item,'#winner');
 }
save();
}
function openModal(id, title, body) {
const opener=document.activeElement;
$(id)?.remove();
$(id+'Bg')?.remove();
const bg = document.createElement('div');
bg.id = id+'Bg';
bg.className = 'modal-bg';
const modal = document.createElement('section');
modal.id = id;
modal.className = 'modal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-labelledby',id+'Title'); modal.setAttribute('tabindex','-1'); modal.innerHTML = '<div class="modal-head"><h3 id="'+id+'Title">'+esc(title)+'</h3><button class="menu" data-close aria-label="Close '+esc(title)+'">×</button></div>'+body;
document.body.append(bg, modal);
const close = () => {
modal.remove(); bg.remove();
if(opener&&typeof opener.focus==='function') queueMicrotask(()=>opener.focus());
if (id === 'settingsModal') removeFoodOverlays();
if (S.screen && $(S.screen)) show(S.screen);
};
bg.onclick = close;
modal.querySelector('[data-close]').onclick = close;
modal.addEventListener('keydown',e=>{
if(e.key==='Escape'){e.preventDefault();close();return;}
if(e.key==='Tab'){
const f=[...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled);
if(!f.length)return;
const first=f[0],last=f[f.length-1];
if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}
});
queueMicrotask(()=>modal.querySelector('[data-close]')?.focus());
return modal;
}
function detailsSheet(item,type){
 const image=imageProxyUrl(item.image||item.photo||item.photoFallback||HUNGRY_IMAGE),cat=type==='restaurant'?restaurantCategory(item):item.category||'',nut=item.nutrition||{};
 const nutrition=type==='food'&&item.nutrition?'<div class="nutrition-card"><div class="detail-section-title">Typical nutrition</div><div class="nutrition-grid"><div><b>'+esc(nut.calories)+' kcal</b><span>Calories</span></div><div><b>'+esc(nut.protein)+' g</b><span>Protein</span></div><div><b>'+esc(nut.carbs)+' g</b><span>Carbs</span></div><div><b>'+esc(nut.fat)+' g</b><span>Fat</span></div><div><b>'+esc(nut.sodium)+' mg</b><span>Sodium</span></div></div><p class="detail-note">'+esc(item.nutritionNote||'Typical estimate per serving.')+'</p></div>':'';
 const ingredients=type==='food'&&Array.isArray(item.ingredients)&&item.ingredients.length?'<div class="detail-section"><div class="detail-section-title">Ingredients</div><p class="detail-body-copy">'+esc(item.ingredients.join(' · '))+'</p></div>':'';
 const pm=item.menuItems||item.commonMenuItems||item.common_menu_items||[],menus=Array.isArray(pm)?pm.filter(Boolean):String(pm||'').split(/[|,;·]/).map(x=>x.trim()).filter(Boolean);
 const menu=type==='restaurant'&&menus.length?'<div class="detail-section"><div class="detail-section-title">Common menu items</div><p class="detail-body-copy">'+esc(menus.slice(0,8).join(' · '))+'</p></div>':'';
 const recipe=item.recipe?'<div class="detail-section"><div class="detail-section-title">Recipe / notes</div><p class="detail-body-copy">'+esc(item.recipe).replace(/\n/g,'<br>')+'</p></div>':'';
 if(type!=='restaurant'){
   const actionBar=item?.category==='Hungry'?'':'<div class="detail-actions-row"><button class="detail-hide-action" id="detailHide">Hide</button></div>';
   const body='<div class="detail-grid"><img class="history-detail-photo" src="'+esc(image)+'" data-final-fallback="'+FINAL_FOOD_IMAGE+'" alt="'+esc(item.name)+'"><div class="detail-title-block"><span class="detail-kicker">DETAILS</span><h2>'+esc(item.name)+'</h2></div><p class="status">'+esc(item.category||'')+'</p>'+nutrition+ingredients+menu+recipe+actionBar+'</div>';
   const modal=openModal('detailsModal','Details',body);bindImageFallback('#detailsModal img',foodPhoto(item),FINAL_FOOD_IMAGE);
   const detailHide=$('detailHide'); if(detailHide) detailHide.onclick=async()=>{const hidden=await foodHideItem(item);if(hidden){modal.remove();$('detailsModalBg')?.remove();}};
   return;
 }
 const detailPhone=String(item.phone||item.nationalPhoneNumber||item['contact:phone']||'').trim();
 const phoneRow=detailPhone?'<a class="restaurant-luxury-contact-row" href="'+esc(phoneHref(detailPhone))+'" aria-label="Call '+esc(item.name)+'"><span class="contact-label">Phone</span><strong>'+esc(detailPhone)+'</strong><span class="contact-arrow">↗</span></a>':'<a class="restaurant-luxury-contact-row restaurant-phone-fallback" href="'+esc(restaurantPhoneSearchUrl(item))+'" target="_blank" rel="noopener noreferrer" aria-label="Find '+esc(item.name)+' phone on Google"><span class="contact-label">Phone</span><strong>Find on Google</strong><span class="contact-arrow">↗</span></a>';
 const addressRow=item.address?'<div class="restaurant-luxury-contact-row"><span class="contact-label">Address</span><strong>'+esc(item.address)+'</strong></div>':'';
 const hours=String(item.opening_hours||'').trim();
 const websiteDirect=!!safeExternalUrl(item.website);
 const websiteHref=restaurantWebsiteUrl(item);
 const websiteAction='<a class="detail-icon-button detail-website-action" href="'+esc(websiteHref)+'" target="_blank" rel="noopener noreferrer" aria-label="'+(websiteDirect?'Open '+esc(item.name)+' website':'Search '+esc(item.name)+' website on Google')+'" title="'+(websiteDirect?'Website':'Google Search')+'"><svg class="detail-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 10.5 18 6m0 0h-3.8M18 6v3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 13.5v3.25A1.25 1.25 0 0 1 15.75 18h-9.5A1.25 1.25 0 0 1 5 16.75v-9.5A1.25 1.25 0 0 1 6.25 6H9.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span class="sr-only">'+(websiteDirect?'Website':'Google Search')+'</span></a>';
 const directionsAction='<a class="detail-icon-button restaurant-detail-action detail-directions-action" href="'+esc(restaurantDirectionsUrl(item))+'" target="_blank" rel="noopener noreferrer" aria-label="Get Google Maps directions to '+esc(item.name)+'" title="Directions"><svg class="detail-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 0 0 5 9c0 5.9 7 12 7 12Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/></svg><span class="sr-only">Directions</span></a>';
 const infoCards='<div class="restaurant-luxury-stat-grid"><div class="restaurant-luxury-stat"><span>Category</span><strong>'+esc(cat)+'</strong></div>'+(item.cuisine?'<div class="restaurant-luxury-stat"><span>Cuisine</span><strong>'+esc(item.cuisine)+'</strong></div>':'')+(item.distance!=null?'<div class="restaurant-luxury-stat"><span>Distance</span><strong>'+Number(item.distance).toFixed(1)+' mi</strong></div>':'')+'<div class="restaurant-luxury-stat"><span>Hours</span><strong>'+esc(hours||'Open/Unknown')+'</strong></div></div>';
 const contactSection='<div class="detail-section restaurant-luxury-section"><div class="detail-section-title">Visit & contact</div><div class="restaurant-luxury-contact-card">'+phoneRow+addressRow+'</div><div class="restaurant-luxury-actions">'+websiteAction+directionsAction+'</div></div>';
 const detailImage=imageProxyUrl(item.image||item.photo||item.photoFallback||FINAL_RESTAURANT_IMAGE);
 const body='<div class="detail-grid restaurant-luxury-details"><div class="restaurant-detail-hero"><img class="history-detail-photo" src="'+esc(detailImage)+'" data-restaurant-photo-id="'+esc(item.googlePlaceId||'')+'" data-google-photo-id="'+esc(item.googlePlaceId&&item.photoSource==='google-places'?item.googlePlaceId:'')+'" data-final-fallback="'+FINAL_RESTAURANT_IMAGE+'" alt="'+esc(item.name)+'"><div class="restaurant-detail-hero-shade"></div><div class="restaurant-photo-credit" aria-live="polite"></div></div><div class="detail-title-block restaurant-luxury-title"><span class="detail-kicker">RESTAURANT</span><h2>'+esc(item.name)+'</h2><p class="restaurant-luxury-subline">'+esc(cat)+(item.cuisine?' · '+esc(item.cuisine):'')+'</p></div><div class="detail-section restaurant-luxury-section"><div class="detail-section-title">Restaurant information</div>'+infoCards+'</div>'+contactSection+menu+'</div>';
 const modal=openModal('detailsModal','Restaurant Details',body);bindImageFallback('#detailsModal img',detailImage,FINAL_RESTAURANT_IMAGE);
hydrateGoogleRestaurantPhoto(item,'#detailsModal');
}

function historyImageSource(row){
 const fallback=row?.type==='restaurant'?FINAL_RESTAURANT_IMAGE:HUNGRY_IMAGE;
 return imageProxyUrl(row?.image||row?.photoFallback||fallback);
}
function recordHistory(item, type) {
const history = readHistory();
history.unshift({
id:String(Date.now())+'-'+Math.random().toString(36).slice(2),
date:(() => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })(),
type,
name:item.name,
image:item.image||item.photo||'',
photoFallback:item.photoFallback||'',
photoSource:item.photoSource||'',
googlePlaceId:item.googlePlaceId||'',
photoIsGeneric:item.photoIsGeneric!==false,
category:item.category||restaurantCategory(item),
cuisine:item.cuisine||'',
address:item.address||'',
phone:item.phone||item.nationalPhoneNumber||'',
website:item.website||'',
opening_hours:item.opening_hours||'',
hoursState:item.hoursState||'',
menuItems:Array.isArray(item.menuItems)?item.menuItems.slice(0,10):[],
lat:Number.isFinite(Number(item.lat))?Number(item.lat):null,
lon:Number.isFinite(Number(item.lon))?Number(item.lon):null,
distance:Number.isFinite(Number(item.distance))?Number(item.distance):null
});
writeHistory(history);
}
function readHistory() {
try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function writeHistory(rows) {
try {
localStorage.setItem(HISTORY_KEY, JSON.stringify((rows||[]).slice(0,120)));
S.storageWarning=false; updateStorageIndicator();
return true;
} catch {
S.storageWarning=true; updateStorageIndicator();
return false;
}
}
function historyView() {
let cursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const render = () => {
const history = readHistory();
const y = cursor.getFullYear(), m = cursor.getMonth();
const first = new Date(y,m,1).getDay(), last = new Date(y,m+1,0).getDate();
let body = '<div class="history-calendar"><div class="cal-nav"><button class="text-btn" id="calPrev">‹</button><b>'+cursor.toLocaleString(undefined,{month:'long',year:'numeric'})+'</b><button class="text-btn" id="calNext">›</button></div><div class="cal-grid cal-grid-20">';
['S','M','T','W','T','F','S'].forEach(d => body += '<span class="cal-d">'+d+'</span>');
for(let i=0;i<first;i++) body += '<span></span>';
for(let day=1;day<=last;day++) {
const key = y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
const entries = history.filter(x => x.date === key);
const entry = entries[0];
const more = entries.length>1 ? '<span class="cal-more">+'+(entries.length-1)+'</span>' : '';
body += '<div class="cal-cell">'+
(entry ? '<button class="cal-day has" data-history-date="'+esc(entry.id)+'"><b>'+day+'</b><img src="'+esc(historyImageSource(entry))+'" data-google-photo-id="'+esc(entry.googlePlaceId&&entry.photoSource==='google-places'?entry.googlePlaceId:'')+'" data-final-fallback="'+(entry.type==='restaurant'?FINAL_RESTAURANT_IMAGE:HUNGRY_IMAGE)+'" alt="'+esc(entry.name)+'">'+more+'</button><button class="cal-x" data-history-delete="'+esc(entry.id)+'" aria-label="Remove history entry for '+esc(key)+'">×</button>' :
'<div class="cal-day"><b>'+day+'</b></div>')+'</div>';
}
body += '</div></div><div class="history-list">';
body += history.length ? '<div class="history-toolbar"><span class="status">'+history.length+' saved decision'+(history.length===1?'':'s')+'</span><button class="secondary" id="historyClearAll" type="button">Clear all</button></div>'+history.slice(0,30).map(x => '<button class="history-row history-open" data-history-id="'+esc(x.id)+'"><img src="'+esc(historyImageSource(x))+'" data-google-photo-id="'+esc(x.googlePlaceId&&x.photoSource==='google-places'?x.googlePlaceId:'')+'" data-final-fallback="'+(x.type==='restaurant'?FINAL_RESTAURANT_IMAGE:HUNGRY_IMAGE)+'" alt="'+esc(x.name)+'"><span><b>'+esc(x.name)+'</b><small>'+esc(x.date)+' · '+esc(x.type)+'</small></span></button>').join('') : '<p class="status">No history yet.</p>';
body += '</div>';
const modal = openModal('historyModal','History',body);
bindImageFallback('#historyModal img',FINAL_RESTAURANT_IMAGE,FINAL_RESTAURANT_IMAGE);
for(const row of history.slice(0,30)) if(row?.googlePlaceId&&row?.photoSource==='google-places') hydrateGoogleRestaurantPhoto(row,'#historyModal');
$('calPrev').onclick = () => { cursor = new Date(y,m-1,1); modal.remove(); $('historyModalBg')?.remove(); render(); };
$('calNext').onclick = () => { cursor = new Date(y,m+1,1); modal.remove(); $('historyModalBg')?.remove(); render(); };
modal.querySelectorAll('[data-history-id]').forEach(btn => btn.onclick = () => {
const row = history.find(x => x.id === btn.dataset.historyId);
if (row) detailsSheet(row, row.type);
});
modal.querySelectorAll('[data-history-date]').forEach(btn => btn.onclick = () => {
const row = history.find(x => x.id === btn.dataset.historyDate);
if (row) detailsSheet(row, row.type);
});
if(history.length){
$('historyClearAll').onclick=async()=>{
if(!await appConfirm('Clear history?','This permanently removes all saved meal and restaurant decisions from this device.','Clear History'))return;
writeHistory([]); modal.remove(); $('historyModalBg')?.remove(); render();
};
}
modal.querySelectorAll('[data-history-delete]').forEach(btn => {
const remove = (e) => {
e.preventDefault(); e.stopPropagation();
writeHistory(history.filter(x => x.id !== btn.dataset.historyDelete));
modal.remove(); $('historyModalBg')?.remove(); render();
};
btn.onclick = remove;
btn.onpointerdown = (e) => e.stopPropagation();
});
};
render();
}
function readImageFile(file) {
return new Promise((resolve,reject) => {
if (!file) return resolve('');
if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
const reader = new FileReader();
reader.onerror = () => reject(new Error('Could not read that image.'));
reader.onload = () => {
const img = new Image();
img.onload = () => {
const max=1200, scale=Math.min(1,max/Math.max(img.width,img.height));
const canvas=document.createElement('canvas');
canvas.width=Math.max(1,Math.round(img.width*scale));
canvas.height=Math.max(1,Math.round(img.height*scale));
const ctx=canvas.getContext('2d');
ctx.drawImage(img,0,0,canvas.width,canvas.height);
resolve(canvas.toDataURL('image/jpeg',0.82));
};
img.onerror=()=>reject(new Error('Could not decode that image.'));
img.src=reader.result;
};
reader.readAsDataURL(file);
});
}
function foodEditor(item=null) {
const isEdit=!!item;


const managerWasOpen = !!$('manageFoodsModal');
if(managerWasOpen){ $('manageFoodsModal')?.remove(); $('manageFoodsModalBg')?.remove(); }
const cats=['American','Southern','Mexican','Italian','Asian','Pasta','Breakfast','Soup/Stew','Healthy','Potato','Snack','Other'];
const quickCats=cats;
const body='<form class="add" id="foodEditorForm">'+
'<input id="editFoodName" placeholder="Meal name" required value="'+esc(item?.name||'')+'">'+
'<select id="editFoodCat" aria-label="Cuisine type">'+cats.map(x=>'<option '+(x===(item?.category||'American')?'selected':'')+'>'+x+'</option>').join('')+'</select>'+
'<fieldset class="quick-cut-editor"><legend>Quick Cuts</legend><div class="quick-cut-editor-grid">'+quickCats.map(x=>'<label><input type="checkbox" name="editQuickCut" value="'+esc(x)+'" '+((item?.quickCuts||[]).includes(x)||(!item&&x===(item?.category||'American'))?'checked':'')+'><span>'+esc(x)+'</span></label>').join('')+'</div></fieldset>'+
'<label class="file-label">Photo from iPhone/device<input id="editFoodFile" type="file" accept="image/*" capture="environment"></label>'+
'<input id="editFoodPhoto" placeholder="Photo URL (optional)" inputmode="url" value="'+esc(item?.image && !item.image.startsWith('data:')?item.image:'')+'">'+
'<textarea id="editFoodRecipe" placeholder="Recipe or notes (optional)" rows="5">'+esc(item?.recipe||'')+'</textarea>'+
'<button class="cut">'+(isEdit?'Save Meal':'Add Meal')+'</button></form>';
const modal=openModal('foodEditorModal',isEdit?'Edit Meal':'Add Meal',body);
$('editFoodFile').onchange=async()=>{
try {
const data=await readImageFile($('editFoodFile').files?.[0]);
if(data) $('editFoodPhoto').value=data;
} catch(e) { appToast(e.message); }
};
$('editFoodCat').onchange=()=>{
 const category=$('editFoodCat').value;
 const quick=document.querySelector('input[name="editQuickCut"][value="'+category+'"]');
 if(quick) quick.checked=true;
};
$('foodEditorForm').onsubmit=async e=>{
e.preventDefault();
const name=$('editFoodName').value.trim(), cat=$('editFoodCat').value;
const quickCuts=[...document.querySelectorAll('input[name="editQuickCut"]:checked')].map(x=>x.value); if(!quickCuts.includes(cat)) quickCuts.unshift(cat);
let photo=$('editFoodPhoto').value.trim()||HUNGRY_IMAGE, recipe=$('editFoodRecipe').value.trim();
if(!name)return;
if(isEdit){
const idx=S.custom.findIndex(x=>x.id===item.id);
if(idx<0)return;
const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
if(id!==item.id && allFoods().some(x=>x.id===id)){appToast('A meal with that name already exists.');return;}
if(photo.startsWith('data:image/')) await putStoredPhoto(id,photo);
S.custom[idx]={...S.custom[idx],id,name,primary:id===item.id?S.custom[idx].primary:id,category:cat,quickCuts,image:photo,recipe};
if(id!==item.id) await deleteStoredPhoto(item.id);
S.maybe.delete(item.id); S.hidden.delete(item.id);
} else {
const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
if(allFoods().some(x=>x.id===id)){appToast('A meal with that name already exists.');return;}
if(photo.startsWith('data:image/')) await putStoredPhoto(id,photo);
S.custom.push({id,name,primary:id,category:cat,quickCuts,image:photo,recipe});
}
if(!S.custom.some(x=>Array.isArray(x.quickCuts)&&x.quickCuts.includes('Other')))S.cutCats.delete('Other');
buildFood(); foodQuick(); save(); modal.remove(); $('foodEditorModalBg')?.remove();


if(S.screen==='food' && !isEdit){ show('food'); foodQuick(); drawFood(); }
else manageFoodsView();
};
}
function manageFoodsView() {
const rows=allFoods();
const body='<div class="manage-intro">Add your own meal with a photo, recipe, or notes. Meals can be hidden and restored here.</div>'+
'<button class="cut" id="openFoodEditor" style="width:100%;min-height:46px;border-radius:13px">Add Meal</button>'+
'<div class="food-list">'+rows.map(item=>{
const hidden=S.hidden.has(item.id), custom=S.custom.some(x=>x.id===item.id);
const state=hidden?'Hidden':'Active';
return '<div class="food-row"><span><b>'+esc(item.name)+'</b><small class="row-state">'+esc(state)+(custom?' · Custom':'')+'</small></span><span class="food-row-actions">'+
(hidden?'<button class="restore" data-food-restore="'+esc(item.id)+'">Restore</button>':'<button class="restore" data-food-hide="'+esc(item.id)+'">Hide</button>')+
(custom?'<button class="restore" data-food-edit="'+esc(item.id)+'">Edit</button>':'')+
'</span></div>';
}).join('')+'</div>';
const modal=openModal('manageFoodsModal','Manage Meals',body);
$('openFoodEditor').onclick=()=>foodEditor();
modal.querySelectorAll('[data-food-restore]').forEach(btn=>btn.onclick=()=>{
S.hidden.delete(btn.dataset.foodRestore); buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView();
});
modal.querySelectorAll('[data-food-hide]').forEach(btn=>btn.onclick=()=>{
S.hidden.add(btn.dataset.foodHide); buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView();
});
modal.querySelectorAll('[data-food-edit]').forEach(btn=>btn.onclick=()=>{
const row=allFoods().find(x=>x.id===btn.dataset.foodEdit);
if(row){modal.remove(); $('manageFoodsModalBg')?.remove(); foodEditor(row);}
});
}
function settingsView(){
 removeFoodOverlays();
 const hiddenRestaurants=Object.values(S.hiddenRestaurants);
 const body='<div class="settings-stack"><h4>Hidden Restaurants</h4><div>'+(hiddenRestaurants.length?hiddenRestaurants.map(x=>'<div class="food-row"><span>'+esc(x.name)+'</span><button class="restore" data-setting-rest="'+esc(x.id)+'">Restore</button></div>').join(''):'<p class="status">No hidden restaurants.</p>')+'</div><h4>System</h4><button class="settings-system-action diagnosis-action" id="appDiagnosis" type="button" aria-label="Open App Diagnosis">App Diagnosis</button><p class="status">Checks the app and current device/runtime state.</p><button class="settings-system-action restore-action" id="systemRestore">System Restore</button><p class="status">Restores original meals and clears saved round changes. Custom foods remain.</p><button class="settings-system-action reset-action" id="resetAppData" type="button">Reset App Data</button><p class="status">Deletes custom meals, history, hidden choices, and saved settings from this device.</p></div>';
 const modal=openModal('settingsModal','Settings',body);
 modal.querySelectorAll('[data-setting-rest]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.settingRest;delete S.hiddenRestaurants[id];const row=S.restaurantPool.find(x=>x.id===id);if(row)row._hidden=false;save();modal.remove();$('settingsModalBg')?.remove();settingsView();});
 $('appDiagnosis').onclick=()=>{modal.classList.add('diagnosis-modal');modal.style.minHeight='min(78svh,720px)';modal.style.maxHeight='88svh';appDiagnosisView(modal);};$('systemRestore').onclick=systemRestoreFlow;$('resetAppData').onclick=resetAppDataFlow;
}
function diagnosisMiles(a,b,c,d){
 const R=3958.7613,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,z=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;
 return 2*R*Math.asin(Math.sqrt(z));
}
function diagnosisNameTokens(value){
 return String(value||'').toLowerCase().replace(/[’']s\b/gi,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
}
function diagnosisNameVariant(a,b){
 const aa=diagnosisNameTokens(a),bb=diagnosisNameTokens(b);if(!aa.length||!bb.length)return false;
 const as=new Set(aa),bs=new Set(bb),shared=aa.filter(t=>bs.has(t)).length;
 return shared===Math.min(as.size,bs.size)&&shared/new Set([...aa,...bb]).size>=0.6;
}
function diagnosisRestaurantDuplicates(rows){
 const out=[];
 for(let i=0;i<(rows||[]).length;i++)for(let j=i+1;j<(rows||[]).length;j++){
  const a=rows[i],b=rows[j];
  const d=Number.isFinite(Number(a?.lat))&&Number.isFinite(Number(a?.lon))&&Number.isFinite(Number(b?.lat))&&Number.isFinite(Number(b?.lon))?diagnosisMiles(Number(a.lat),Number(a.lon),Number(b.lat),Number(b.lon)):Infinity;
  const sameAddr=normKey(a?.address)&&normKey(a?.address)===normKey(b?.address),sameName=normKey(a?.name)===normKey(b?.name);
  if(d<=0.2&&(sameName||sameAddr||diagnosisNameVariant(a?.name,b?.name)))out.push([a?.name,b?.name,d]);
 }
 return out;
}
async function appDiagnosisView(existingModal){
 if(!existingModal||!document.body.contains(existingModal))return null;
 const shellClass='diagnosis-modal';
 const initialSections=['Core app','Meal system','Restaurant system','Device & runtime','Build & deployment']; const body='<div class="diagnosis-wrap"><div id="diagnosisBody" aria-busy="true"><div class="diagnosis-summary diagnosis-summary-strong"><span class="diagnosis-status-dot warn" aria-hidden="true"></span><div><b>App Diagnosis</b><small>Live checks are running in this panel.</small></div><strong>Live</strong></div>'+initialSections.map(label=>'<section class="diagnosis-section"><div class="diagnosis-section-head"><b>'+label+'</b><span>Checking…</span></div><div class="diagnosis-row info"><span class="diagnosis-mark" aria-hidden="true">i</span><span><b>Checking</b><small>Reading the current app and runtime state.</small></span></div></section>').join('')+'</div><div class="diagnosis-runbar"><span id="diagnosisRunStatus" class="diagnosis-run-status" aria-live="polite">Checking…</span><button class="secondary diagnosis-refresh" id="diagnosisRefresh" type="button" aria-pressed="false" disabled aria-label="Run diagnostics again">Run again</button></div></div>';
 const modal=existingModal;
 modal.classList.add(shellClass);
 if(existingModal){
  const head=modal.querySelector('.modal-head');
  [...modal.children].forEach(child=>{if(child!==head)child.remove();});
  const title=head?.querySelector('h3');
  if(title){title.textContent='App Diagnosis';}
  const close=head?.querySelector('[data-close]');
  if(close)close.setAttribute('aria-label','Close App Diagnosis');
  modal.insertAdjacentHTML('beforeend',body);
 }
 let running=false,run=0;
 const render=async()=>{
  if(running||!document.body.contains(modal))return;running=true;run++;
  const refresh=$('diagnosisRefresh'),runStatus=$('diagnosisRunStatus'),diagnosisBody=$('diagnosisBody');
  if(refresh){refresh.disabled=true;refresh.setAttribute('aria-pressed','true');refresh.classList.add('selected');refresh.classList.remove('complete');refresh.textContent='✓ Checking…';}
  if(runStatus){runStatus.textContent='Run '+run+' selected · checking now…';runStatus.classList.add('running');}
  if(diagnosisBody)diagnosisBody.setAttribute('aria-busy','true');
  const checks=[];
  const add=(section,state,label,detail)=>checks.push({section,state,label,detail});
  const pass=(s,l,d)=>add(s,'ok',l,d), warn=(s,l,d)=>add(s,'warn',l,d), info=(s,l,d)=>add(s,'info',l,d), fail=(s,l,d)=>add(s,'fail',l,d);
  const sectionLabels={core:'Core app',food:'Meal system',restaurant:'Restaurant system',runtime:'Device & runtime',release:'Build & deployment'};
  try{
   const foods=getDefaultFoods(),byId=new Map(foods.map(x=>[x.id,x])), ids=foods.map(x=>x.id), duplicateFoodIds=ids.length-new Set(ids).size;
   duplicateFoodIds?fail('food','Meal catalog','Duplicate meal IDs found',duplicateFoodIds+' duplicate ID(s) exist and can cause unstable card state.'):pass('food','Meal catalog',foods.length+' built-in meals loaded; IDs are unique.');
   const invalidFood=foods.filter(x=>!x?.name||!x?.category||!x?.image||!Array.isArray(x?.quickCuts)||!x.quickCuts.length||!Array.isArray(x?.ingredients)||!x.ingredients.length||!x?.nutrition||!x?.recipe);
   invalidFood.length?fail('food','Meal details',invalidFood.length+' meal(s) are missing required photo, Quick Cut, ingredient, nutrition, or recipe data.',invalidFood.slice(0,6).map(x=>x?.name||x?.id).join(', ')+(invalidFood.length>6?' + more':'')):pass('food','Meal details','All '+foods.length+' built-in meals have required Details data.');
   const quickLabels=foodQuickLabels(),missingQuickImages=quickLabels.filter(x=>!QUICK_IMAGES[x]);
   const quickDomCount=document.querySelectorAll('#foodQuick [data-food-quick]').length;
   missingQuickImages.length?fail('food','Meal Quick Cuts','Missing Quick Cut photo mapping: '+missingQuickImages.join(', '),'Fix the missing image mapping before launch.'):quickDomCount<11?warn('food','Meal Quick Cuts',quickDomCount+' rendered in the current page shell.','Expected 11 built-in Quick Cuts; the extra Other option appears only when a custom meal uses it.'):pass('food','Meal Quick Cuts','Meal Quick Cut mappings and photo sources are present.');
   const required=[['lasagna',['Pasta']],['vegetable-lasagna',['Pasta','Healthy']],['salisbury-steak',['Southern','American']],['stuffed-peppers',['Healthy','American']],['health-shake',['Healthy']]];
   const quickMismatches=required.filter(([id,cuts])=>{const got=byId.get(id)?.quickCuts||[];return cuts.some(x=>!got.includes(x));}).map(([id])=>id);
   quickMismatches.length?fail('food','Quick Cut assignments','Current mappings are incomplete: '+quickMismatches.join(', '),'Open Manage Meals and correct the affected Quick Cut groups.'):pass('food','Quick Cut assignments','Key Meal Quick Cut mappings match the current catalog.');
   const staleNames=foods.filter(x=>/stouffer/i.test(String(x.name||''))||x.id==='frozen');
   staleNames.length?fail('food','Removed choices','Stouffer/frozen-dinner data is still present.','Remove the legacy choice from the catalog.'):pass('food','Removed choices','Legacy Stouffer/frozen-dinner choice is absent.');
   const foodVisible=!!document.querySelector('#food:not(.hidden)'),foodControls=['foodCut','foodMaybe','foodBack','foodHide','foodDetails'].filter(id=>$(id)).length;
   foodVisible&&foodControls<5?fail('food','Meal decision controls',foodControls+'/5 required controls are present.','Cut, Maybe, Back, Hide, and Details should all be available.'):pass('food','Meal decision controls','Core Meal decision and Details controls are wired.');
   const visibleImgs=[...document.querySelectorAll('img')].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(i).display!=='none'}),broken=visibleImgs.filter(i=>i.complete&&i.naturalWidth===0),fallbacked=visibleImgs.filter(i=>i.dataset.imageFallback==='true');
   broken.length?fail('runtime','Visible images',broken.length+' visible image(s) have failed to decode.','Check the affected photo source or fallback mapping.'):fallbacked.length?warn('runtime','Visible images',fallbacked.length+' visible image(s) are currently using a fallback image.','The app is protected from broken images, but the original source should be reviewed.'):info('runtime','Visible images',visibleImgs.length+' visible image(s) are available to inspect on this screen.');
   const restaurants=S.restaurantPool||[],restaurantIds=restaurants.map(x=>x.id||x.name),restaurantDuplicates=diagnosisRestaurantDuplicates(restaurants),fastFood=restaurants.filter(x=>x.fastFood).length;
   restaurantDuplicates.length?warn('restaurant','Restaurant duplicates',restaurantDuplicates.length+' possible duplicate venue pair(s) are in the current pool.','Examples: '+restaurantDuplicates.slice(0,3).map(x=>x[0]+' ↔ '+x[1]+' ('+x[2].toFixed(1)+' mi)').join(' · ')+' . Review only if they are truly the same venue.'):pass('restaurant','Restaurant duplicates','No likely duplicates detected in the current pool.');
   const restQuickCount=document.querySelectorAll('#restQuick [data-rest-quick]').length,restQuickMissing=REST_QUICK.filter(x=>!REST_QUICK_IMAGES[x]);
   restQuickMissing.length?fail('restaurant','Restaurant Quick Cuts','Missing photo mapping: '+restQuickMissing.join(', '),'Fix the affected Quick Cut source mapping.'):restQuickCount<REST_QUICK.length?info('restaurant','Restaurant Quick Cuts',restQuickCount+' rendered in the page shell; '+REST_QUICK.length+' are defined.'):pass('restaurant','Restaurant Quick Cuts',REST_QUICK.length+' Quick Cuts are defined with photo mappings.');
   const restVisible=!!document.querySelector('#restaurant:not(.hidden)'),restControls=['restCut','restMaybe','restBack','restDetails'].filter(id=>$(id)).length;
   restVisible&&restControls<4?fail('restaurant','Restaurant decision controls',restControls+'/4 required controls are present.','Cut, Maybe, Back, and Details should all be available.'):pass('restaurant','Restaurant decision controls','Core Restaurant decision and Details controls are wired.');
   S.restaurantSearchDegraded?warn('restaurant','Search quality state','The last restaurant search was marked degraded.','Run a fresh search; if it repeats, inspect the search service/provider path.'):info('restaurant','Search quality state','No degraded-search flag is currently set.');
   restaurants.length?pass('restaurant','Current restaurant pool',restaurants.length+' result(s) loaded · '+fastFood+' marked fast food.','Only the currently loaded pool is being measured here.'):info('restaurant','Current restaurant pool','No restaurant results are loaded right now.','This is normal on the home screen; run a restaurant search to test the live result pool.');
   const source=S.locationSource||'none';
   S.location&&Number.isFinite(Number(S.location.lat))&&Number.isFinite(Number(S.location.lon))?pass('restaurant','Location state','A usable location is currently selected ('+source+').','The diagnosis does not replace or change your selected location.'):info('restaurant','Location state','No usable restaurant-search location is currently stored.','This is not an error until you try to search; choose an address or Use My Location on the Restaurant screen.');
   try{
    const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),5000),rr=await fetch('/api/restaurant-search?mode=health&diagnosis='+Date.now(),{cache:'no-store',signal:ctl.signal});clearTimeout(tm);
    const d=await rr.json().catch(()=>null);
    rr.ok&&d?.ok?pass('restaurant','Restaurant search service','Healthy · provider '+String(d.version||'unknown')+' · max radius '+String(d.maxRadiusMiles||'unknown')+' mi.','This checks the live health endpoint without changing your current search pool.'):warn('restaurant','Restaurant search service','Health endpoint returned HTTP '+rr.status+'.','Restaurant search may still work through a degraded path, but the service should be checked.');
   }catch(e){warn('restaurant','Restaurant search service','Health check failed or timed out.','The diagnosis did not change your search settings or location.');}
   let storageOk=true;try{void localStorage.length;}catch{storageOk=false;}
   storageOk?pass('runtime','Local storage','Browser storage is accessible.','Meal choices, hidden items, history, and settings depend on browser storage.'):fail('runtime','Local storage','Browser storage is unavailable.','Persistence features may not work in this browser/private mode.');
   ('indexedDB' in window)?pass('runtime','Photo storage','IndexedDB is available for custom meal photos.'):warn('runtime','Photo storage','IndexedDB is unavailable.','Custom uploaded meal photos may not persist correctly.');
   navigator.onLine?pass('runtime','Network','Browser reports online.','Restaurant search and third-party images still depend on their services.'):warn('runtime','Network','Browser reports offline.','Restaurant search and remote images may not work until connectivity returns.');
   const sw='serviceWorker' in navigator;
   sw?pass('runtime','PWA shell','Service-worker support is available.','Install/offline behavior can be tested separately on the target iPhone browser.'):warn('runtime','PWA shell','Service workers are unavailable in this browser.','PWA installation/offline behavior cannot be certified here.');
   const surface=document.querySelector('.screen:not(.hidden)'),ox=document.documentElement.scrollWidth>document.documentElement.clientWidth||(surface&&surface.scrollWidth>surface.clientWidth+1),oy=document.documentElement.scrollHeight>window.innerHeight+2||(surface&&surface.scrollHeight>surface.clientHeight+2);
   ox||oy?warn('runtime','Viewport overflow','Horizontal '+(ox?'overflow detected':'clear')+' · vertical '+(oy?'content exceeds the viewport':'clear')+'.','Check this screen at the target iPhone size.'):pass('runtime','Viewport overflow','No horizontal or vertical overflow detected at '+window.innerWidth+'×'+window.innerHeight+'.');
   const requiredIds=['foodQuick','restQuick','foodCut','foodMaybe','foodBack','foodHide','foodDetails','restCut','restMaybe','restBack','restDetails'];
   const missingUi=requiredIds.filter(id=>!$(id));
   missingUi.length?fail('core','Core UI contract','Missing '+missingUi.length+' required UI element(s): '+missingUi.join(', '),'A missing element can break the corresponding screen control.'):pass('core','Core UI contract','All core Meal/Restaurant decision and Quick Cut elements are present.');
   const maybeCount=S.maybe instanceof Set?S.maybe.size:Array.isArray(S.maybe)?S.maybe.length:0;
   pass('core','Decision persistence',maybeCount+' Maybe/Keep item(s) and '+S.foodCuts.size+' Meal Cut(s) are currently stored in memory.','This verifies the current decision state, not a new decision.');
   try{
    const [localResponse,apiResponse]=await Promise.all([
      fetch('./release.json?diagnosis='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch('./api/release?diagnosis='+Date.now(),{cache:'no-store'}).then(async r=>({ok:r.ok,status:r.status,data:await r.json().catch(()=>null)})).catch(()=>({ok:false,status:0,data:null}))
    ]);
    const localBuild=String(localResponse?.build||''),apiBuild=String(apiResponse?.data?.build||''),apiBranch=String(apiResponse?.data?.branch||apiResponse?.data?.sourceBranch||'');
    if(localBuild && apiResponse.ok && apiBuild && localBuild===apiBuild){
      pass('release','Runtime release identity','Build '+localBuild+' · source '+String(localResponse.sourceBranch||apiBranch||'unknown')+'.','The browser manifest and release API agree on the build.');
    }else if(!apiResponse.ok){
      warn('release','Runtime release identity','Release API returned HTTP '+apiResponse.status+'.','The local release file is available, but hosted runtime identity could not be confirmed from this browser.');
    }else{
      fail('release','Runtime release identity','Release metadata disagrees: local '+localBuild+' vs API '+apiBuild+'.','Do not treat the hosted build as verified until the release metadata matches.');
    }
   }catch{warn('release','Runtime release identity','Release metadata could not be read.','Hosted build identity is not confirmed.');}
   info('release','Deployment status','This panel reports what the current browser can verify.','CI, Netlify, Vercel, and real iPhone Safari certification are separate deployment checks.');
   info('release','Browser certification','This runtime can test browser behavior, but it cannot certify real iPhone Safari behavior from a desktop preview.','Use the installed iPhone PWA as the final device check.');
   info('core','Pass Around','Removed from the current build.','The normal Meal and Restaurant Tinder-style decision flow is now the group-free path.');
  }catch(e){fail('core','Diagnostic runtime','Unexpected diagnostic failure: '+String(e?.message||e),'The diagnosis itself encountered an error while checking the current runtime.');}
  const failures=checks.filter(x=>x.state==='fail').length,warnings=checks.filter(x=>x.state==='warn').length,passing=checks.filter(x=>x.state==='ok').length,infos=checks.filter(x=>x.state==='info').length;
  const overall=failures?'ACTION NEEDED':warnings?'REVIEW NEEDED':'HEALTHY';
  const bySection=[];
  for(const c of checks){let sec=bySection.find(x=>x.id===c.section);if(!sec){sec={id:c.section,items:[]};bySection.push(sec);}sec.items.push(c);}
  const stateIcon={ok:'✓',warn:'!',fail:'×',info:'i'};
  const sectionHtml=bySection.map(sec=>'<section class="diagnosis-section"><div class="diagnosis-section-head"><b>'+esc(sectionLabels[sec.id]||sec.id)+'</b><span>'+sec.items.filter(x=>x.state==='fail').length+' failed · '+sec.items.filter(x=>x.state==='warn').length+' warnings</span></div>'+sec.items.map(c=>'<div class="diagnosis-row '+c.state+'"><span class="diagnosis-mark" aria-hidden="true">'+stateIcon[c.state]+'</span><span><b>'+esc(c.label)+'</b><small>'+esc(c.detail)+'</small></span></div>').join('')+'</section>').join('');
  if(diagnosisBody){diagnosisBody.setAttribute('aria-busy','false');diagnosisBody.innerHTML='<div class="diagnosis-summary diagnosis-summary-strong"><span class="diagnosis-status-dot '+(failures?'bad':warnings?'warn':'good')+'" aria-hidden="true"></span><div><b>'+esc(overall)+'</b><small>'+failures+' failed · '+warnings+' warnings · '+passing+' passing · '+infos+' informational</small></div><strong>Run '+run+'</strong></div>'+sectionHtml+'<p class="diagnosis-footnote">Green means this runtime verified the check. Yellow means the app is usable but something deserves review. Red means the diagnosis found a concrete problem. Informational items are deliberately not counted as failures.</p>';}
  if(document.body.contains(modal)&&$('diagnosisRefresh')){$('diagnosisRefresh').disabled=false;$('diagnosisRefresh').setAttribute('aria-pressed','false');$('diagnosisRefresh').classList.remove('selected');$('diagnosisRefresh').classList.add('complete');$('diagnosisRefresh').textContent='↻ Run again';}
  if(document.body.contains(modal)&&$('diagnosisRunStatus')){$('diagnosisRunStatus').textContent='✓ Run '+run+' complete · '+(failures?'action needed':warnings?'review needed':'no actionable warnings');$('diagnosisRunStatus').classList.remove('running');}
  running=false;
 };
 $('diagnosisRefresh').onclick=()=>render();
 render();
 return modal;
}
function privacyView() {
const body = '<div class="info-copy"><h4>Privacy & Data</h4><p>Dinliminate uses your selected address or optional device location to find nearby restaurants. Location access is optional.</p><p>Restaurant/address results are retrieved through Dinliminate’s search service using third-party mapping and place providers. Your exact location or selected address is used for that search request.</p><p>Your meal choices, hidden items, history, and custom-meal information are stored on this device using browser storage. Custom food photos may be stored in IndexedDB on the device.</p><p>Restaurant and meal images may be loaded from third-party image hosts. Restaurant availability, hours, phone numbers, websites, and menu information can change and are supplied by external providers.</p></div>';
openModal('privacyModal','Privacy',body);
}
function aboutView(){
 const date=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date());
 const body='<div class="info-copy"><h4>Dinliminate</h4><p>Cut the dinner choices until one survives.</p><button class="secondary" id="privacyFromAbout" style="width:100%;min-height:42px;border-radius:12px;margin:10px 0 4px">Privacy & Data</button><p class="about-test">CURRENT BUILD</p><div class="about-meta"><p><span>Version</span><b>'+esc(APP_VERSION)+'</b></p><p><span>Build</span><b>'+esc(APP_BUILD)+'</b></p><p><span>Date</span><b>'+esc(date)+'</b></p></div><p class="about-credit">Made by Brian Dunn for Devona Dunn</p></div>';
 const modal=openModal('aboutModal','About Dinliminate',body);$('privacyFromAbout').onclick=()=>privacyView();return modal;
}
function iphoneHelp() {
openModal('iphoneModal','Add to iPhone','<div class="iphone-guide"><div class="iphone-guide-intro"><span class="iphone-guide-kicker">ADD TO HOME SCREEN</span><h4>One tap away.</h4><p>Use Safari on your iPhone, then follow these three steps.</p></div><div class="iphone-guide-steps"><div class="iphone-guide-step"><span>1</span><div><b>Open Dinliminate in Safari</b></div></div><div class="iphone-guide-step"><span>2</span><div><b>Tap Share</b></div></div><div class="iphone-guide-step"><span>3</span><div><b>Tap Add to Home Screen</b></div></div></div></div>');
}
function shareWinner() {
if (!S.winnerItem)return;
const text='Tonight: '+S.winnerItem.name;
if(navigator.share){navigator.share({title:'Dinliminate',text}).catch(()=>{});}
else if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>appToast('Decision copied.')).catch(()=>{});
}
function resetRound(){
S.winnerItem=null; S.winnerType='food'; S.foodActions=[]; S.restaurantActions=[];
S.maybe.clear(); S.foodMaybeRound=false; S.cutCats.clear(); S.foodCuts.clear(); S.deleted.clear(); S.restaurantCuts.clear(); S.restaurantMaybeRound=false;
S.pool=[]; S.restaurantPool=[]; S.restaurantSearchOrigin=null; S.index=0; S.restaurantIndex=0; S.saved=false;
try{localStorage.removeItem(KEY);}catch{}
home();
}
async function resetAppDataFlow(){
if(!await appConfirm('Reset all app data?', 'This permanently removes custom meals, history, hidden choices, saved round state, and device-stored app preferences.', 'Reset Everything'))return;
S.hidden.clear(); S.deleted.clear(); S.hiddenRestaurants={}; S.cutCats.clear(); S.foodCuts.clear(); S.maybe.clear(); S.foodMaybeRound=false; S.restaurantCuts.clear(); S.restaurantMaybeRound=false;
S.pool=[]; S.restaurantPool=[]; S.index=0; S.restaurantIndex=0; S.foodActions=[]; S.restaurantActions=[]; S.winnerItem=null; S.winnerType='food'; S.location=null; S.locationSource='none'; S.locationFreshAt=null; S.restaurantTimezone=''; S.restaurantSearchOrigin=null; S.restaurantSearchDegraded=false; S.storageWarning=false; S.saved=false; S.custom=[];
try{localStorage.removeItem(KEY);localStorage.removeItem(HISTORY_KEY);localStorage.removeItem('dinliminate.swipeHint.v1');}catch{}
try{const db=await openPhotoDB(); await new Promise(resolve=>{const tx=db.transaction(PHOTO_STORE,'readwrite'); tx.objectStore(PHOTO_STORE).clear(); tx.oncomplete=resolve; tx.onerror=resolve;});}catch{}
home();
}
async function systemRestoreFlow(){
if(!await appConfirm('Restore system defaults?', 'This restores the original meal deck and clears saved round changes. Custom meals remain on this device.', 'Restore'))return;
S.hidden.clear(); S.deleted.clear(); S.hiddenRestaurants={}; S.cutCats.clear(); S.foodCuts.clear(); S.maybe.clear(); S.foodMaybeRound=false; S.restaurantCuts.clear(); S.restaurantMaybeRound=false;
S.pool=[]; S.restaurantPool=[]; S.index=0; S.restaurantIndex=0; S.foodActions=[]; S.restaurantActions=[]; S.winnerItem=null; S.winnerType='food'; S.location=null; S.locationSource='none'; S.restaurantTimezone=''; S.restaurantSearchOrigin=null; S.restaurantSearchDegraded=false; S.storageWarning=false; S.saved=false;
try{localStorage.removeItem(KEY);}catch{}
document.querySelector('#settingsModal')?.remove();
document.querySelector('#settingsModalBg')?.remove();
document.querySelector('#drawer')?.classList.add('hidden');
document.querySelector('#drawerBg')?.classList.add('hidden');
save();
home();
}
$('foodStart').onclick = startFood;
$('restStart').onclick = openRestaurant;
['#foodStart .home-card-overlay','#foodStart .home-card-copy','#foodStart .arrow','#foodStart .home-photo-img'].forEach(sel=>{const el=document.querySelector(sel);if(el)el.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();startFood();},{capture:true});});
['#restStart .home-card-overlay','#restStart .home-card-copy','#restStart .arrow','#restStart .home-photo-img'].forEach(sel=>{const el=document.querySelector(sel);if(el)el.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();openRestaurant();},{capture:true});});
$('foodCut').onclick = () => foodCut();
$('foodMaybe').onclick = () => foodMaybe();
$('foodBack').onclick = foodBack;
$('foodHide').onclick = foodHide;
$('addFood').onclick = manageFoodsView;
document.querySelectorAll('[data-home]').forEach(btn => btn.onclick = home);
const openDrawer = () => { $('drawer').classList.remove('hidden'); $('drawerBg').classList.remove('hidden'); };
const appMenu = $('menu'); if (appMenu) appMenu.onclick = openDrawer;
const foodMenu = $('foodMenu'); if (foodMenu) foodMenu.onclick = openDrawer;
const restaurantMenu = $('restaurantMenu'); if (restaurantMenu) restaurantMenu.onclick = openDrawer;
const foodBackTop = $('foodBackTop'); if (foodBackTop) foodBackTop.onclick = home;
const restaurantBackTop = $('restaurantBackTop'); if (restaurantBackTop) restaurantBackTop.onclick = home;
$('drawerClose').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); };
$('drawerBg').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); };
$('manage').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); manageFoodsView(); };
$('settings').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); settingsView(); };
$('about').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); aboutView(); };
$('backToStart').onclick = () => home();
$('history').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); historyView(); };
$('iphoneHelp').onclick = iphoneHelp;
$('locate').onclick = useLocation;
$('find').onclick = searchRestaurants;
$('radius').addEventListener('change', () => {
 const hasLocation=!!S.location || !!$('address')?.value.trim();
 if(!hasLocation){$('status').textContent='Enter an address or use your location.';renderFindButton();return;}
 searchRestaurants();
});
$('address').addEventListener('input', () => {
  S.location=null;
  S.locationSource='typed';
  S.restaurantSearchOrigin=null;
  renderLocationSource();
  suggestAddresses();
});
$('address').addEventListener('focus', () => { if ($('address').value.trim().length>=2) suggestAddresses(); });
$('address').addEventListener('keydown', e => {
if(e.key==='ArrowDown'){ if(moveSuggestion(1)){e.preventDefault();return;} }
if(e.key==='ArrowUp'){ if(moveSuggestion(-1)){e.preventDefault();return;} }
if(e.key==='Enter'){
  const opts=[...document.querySelectorAll('#suggestionsBox [data-suggestion]')];
  if(suggestionIndex>=0&&opts[suggestionIndex]){
    e.preventDefault();
    chooseAddressSuggestion(suggestionIndex);
    return;
  }
  if(opts.length&&!addressLooksComplete($('address').value)){
    e.preventDefault();
    chooseAddressSuggestion(0);
    return;
  }
  e.preventDefault();
  invalidateAddressSuggestions();
  searchRestaurants();
}
if(e.key==='Escape'){ e.preventDefault(); invalidateAddressSuggestions(); }
});
bindRestaurantTools();
renderHours();
$('details').onclick = () => S.winnerItem && detailsSheet(S.winnerItem, S.winnerType || 'food');
$('share').onclick = shareWinner;
$('restart').onclick = resetRound;
const updateOffline = () => $('offlineIndicator')?.classList.toggle('hidden', navigator.onLine !== false);
window.addEventListener('online', updateOffline);
window.addEventListener('offline', updateOffline);
updateOffline();
bindHomeImageFallbacks();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
if(new URLSearchParams(location.search).get('qa')==='1') window.__DINLIMINATE_TEST__={hourStatus:(row,iso,zone)=>hourStatus(row,new Date(iso),zone),safeExternalUrl,restaurantWebsiteUrl,knownRestaurantWebsite,restaurantPhoneSearchUrl,phoneHref,restaurantCategory,restaurantCuisineTags,restaurantCuisineEvidence,restaurantQuickMatches,restaurantMatchesQuery,normalizeRestaurantSearch,restaurantSearchTermMatches,restaurantHourState,restaurantHoursFilter,setRestaurantHoursMode,addressLooksComplete,locationMovedMiles,winner,recordHistory};
load();
renderLocationSource();
renderFindButton();
updateStorageIndicator();
hydrateCustomPhotos();
migrateCustomPhotos();
if (S.saved && S.screen === 'food' && S.pool.length) {
show('food'); foodQuick(); drawFood();
} else if (S.saved && S.screen === 'restaurant' && S.restaurantPool.length) {
show('restaurant'); restaurantQuick(); renderHours(); drawRestaurants();
} else {
home();
}
if (new URLSearchParams(location.search).get('qa') === '1') {
window.__DINLIMINATE_QA__ = {
snapshot: () => ({
screen:S.screen,
foodCatalog:allFoods().length,
foodPool:foodPool().map(x=>x.id),
restaurantPool:restaurantPoolFiltered().map(x=>x.id),
custom:S.custom.map(x=>({...x})),
allRestaurantIds:(S.restaurantPool||[]).map(x=>x.id),
foodActions:S.foodActions.map(x=>({...x})),
restaurantActions:S.restaurantActions.map(x=>({...x})),
hiddenFoods:[...S.hidden],
hiddenRestaurants:{...S.hiddenRestaurants},
cutCats:[...S.cutCats],
maybe:[...S.maybe],
foodMaybeRound:!!S.foodMaybeRound,
restaurantMaybeRound:!!S.restaurantMaybeRound,
restaurantCuts:[...S.restaurantCuts],
winner:S.winnerItem ? {...S.winnerItem} : null,
winnerType:S.winnerType,
location:S.location ? {...S.location} : null,
locationSource:S.locationSource,
restaurantSearchOrigin:S.restaurantSearchOrigin ? {...S.restaurantSearchOrigin} : null
})
};
}
})();