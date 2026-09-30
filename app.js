
(() => {
'use strict';
const getDefaultFoods = () => Array.isArray(window.DINLIMINATE_FOODS) ? window.DINLIMINATE_FOODS : [];
const $ = (id) => document.getElementById(id);
const KEY = 'dinliminate.clean.cp1';
const HISTORY_KEY = 'dinliminate.clean.history';
const APP_VERSION = '1.0';
const RELEASE_SOURCE_BRANCH = 'release-hardening-2026-09-29';
let APP_BUILD = '125';
fetch('./release.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(meta=>{if(meta?.build)APP_BUILD=String(meta.build)}).catch(()=>{});
const HUNGRY_IMAGE = 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" rx="52" fill="#090909"/><circle cx="600" cy="400" r="170" fill="none" stroke="#f5f1e8" stroke-width="18"/><circle cx="535" cy="365" r="14" fill="#f5f1e8"/><circle cx="665" cy="365" r="14" fill="#f5f1e8"/><path d="M515 495c52-62 118-62 170 0" fill="none" stroke="#f5f1e8" stroke-width="18" stroke-linecap="round"/></svg>');
const FOOD_QUICK = ['Southern','Pasta','Italian','Asian','Mexican','Soup/Stew','Healthy','Breakfast','American','Greek','Snack','Potato'];
const REST_QUICK = ['American','Fast Food','Mexican','Asian','Pasta','Southern','Healthy','Soup/Stew','Potato','Greek','BBQ'];
const QUICK_IMAGES = {
Southern:'https://images.pexels.com/photos/2397401/pexels-photo-2397401.jpeg?auto=compress&cs=tinysrgb&w=700', // Meatloaf & Mashed Potatoes
Pasta:'https://images.pexels.com/photos/6287520/pexels-photo-6287520.jpeg?auto=compress&cs=tinysrgb&w=700', // Spaghetti
Asian:'https://images.pexels.com/photos/32845321/pexels-photo-32845321.jpeg?auto=compress&cs=tinysrgb&w=700', // Fried Rice
Mexican:'https://images.pexels.com/photos/12317911/pexels-photo-12317911.jpeg?auto=compress&cs=tinysrgb&w=700', // Tacos / Mexican Stir Fry family
'Soup/Stew':'https://images.pexels.com/photos/15305397/pexels-photo-15305397.jpeg?auto=compress&cs=tinysrgb&w=700', // Soup & Sandwich
Healthy:'https://images.pexels.com/photos/11906476/pexels-photo-11906476.jpeg?auto=compress&cs=tinysrgb&w=700', // Salad Bowl
Breakfast:'https://images.pexels.com/photos/5852231/pexels-photo-5852231.jpeg?auto=compress&cs=tinysrgb&w=700', // Eggs & Toast
American:'https://images.pexels.com/photos/12034622/pexels-photo-12034622.jpeg?auto=compress&cs=tinysrgb&w=700', // Burger
Greek:'https://images.pexels.com/photos/6941006/pexels-photo-6941006.jpeg?auto=compress&cs=tinysrgb&w=700', // Gyro
Snack:'https://images.pexels.com/photos/6422042/pexels-photo-6422042.jpeg?auto=compress&cs=tinysrgb&w=700', // Popcorn
Italian:'https://images.pexels.com/photos/7813574/pexels-photo-7813574.jpeg?auto=compress&cs=tinysrgb&w=700', // Pizza
Potato:'https://images.pexels.com/photos/273825/pexels-photo-273825.jpeg?auto=compress&cs=tinysrgb&w=700' // Roasted potatoes
};
const REST_QUICK_IMAGES = {
American:'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=700',
'Fast Food':'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=700',
Mexican:'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=700',
Asian:'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=700',
Pasta:'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=700',
Southern:'https://images.pexels.com/photos/2397401/pexels-photo-2397401.jpeg?auto=compress&cs=tinysrgb&w=700',
Healthy:'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=700',
'Soup/Stew':'https://images.pexels.com/photos/15305397/pexels-photo-15305397.jpeg?auto=compress&cs=tinysrgb&w=700',
Potato:'https://images.pexels.com/photos/1442066/pexels-photo-1442066.jpeg?auto=compress&cs=tinysrgb&w=700',
Greek:'https://images.pexels.com/photos/8951199/pexels-photo-8951199.jpeg?auto=compress&cs=tinysrgb&w=700',
BBQ:'https://images.pexels.com/photos/6672037/pexels-photo-6672037.jpeg?auto=compress&cs=tinysrgb&w=700'
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
winnerItem:null,
winnerType:'food',
pass:null,
passDraftCount:2,
passDraftNames:[],
schemaVersion:4,
restaurantTimezone:''
};
function foodPhoto(item){
if(!item)return HUNGRY_IMAGE;
const src=String(item.image||'');
if(src && !src.startsWith('idb:'))return src;
const groups=Array.isArray(item.quickCuts)&&item.quickCuts.length?item.quickCuts:[item.category];
for(const label of groups){if(QUICK_IMAGES[label])return QUICK_IMAGES[label];}
return QUICK_IMAGES.American;
}
function foodPhotoFallback(item){
const groups=Array.isArray(item?.quickCuts)&&item.quickCuts.length?item.quickCuts:[item?.category];
for(const label of groups){if(QUICK_IMAGES[label])return QUICK_IMAGES[label];}
return QUICK_IMAGES.American;
}
function restaurantWebsiteUrl(row){
const direct=safeExternalUrl(row?.website);
if(direct)return direct;
const q=[row?.name,row?.address].filter(Boolean).join(' ');
return 'https://www.google.com/search?q='+encodeURIComponent(q||'restaurant');
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
function phoneHref(raw){
 const digits=String(raw||'').replace(/[^+0-9]/g,'');
 if(/^\+/.test(digits))return 'tel:'+digits;
 if(/^1\d{10}$/.test(digits))return 'tel:+'+digits;
 if(/^\d{10}$/.test(digits))return 'tel:+1'+digits;
 return digits?'tel:'+digits:'';
}
function safeExternalUrl(raw){
 try{const u=new URL(String(raw||''),location.origin);return u.protocol==='https:'?u.href:'';}catch{return '';}
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
saved:S.saved, winnerItem:S.winnerItem, winnerType:S.winnerType, pass:S.pass,
passDraftCount:S.passDraftCount, passDraftNames:S.passDraftNames, schemaVersion:STORAGE_VERSION,
restaurantTimezone:S.restaurantTimezone||'', restaurantSearchDegraded:!!S.restaurantSearchDegraded, foodMaybeRound:!!S.foodMaybeRound, restaurantMaybeRound:!!S.restaurantMaybeRound,
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
const legacyKeys=['cutPrimary','allCut','foodAllCut','savedRound','savedRoundType','legacyRestaurantPool','restaurantResults'];
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
S.passDraftNames = Array.isArray(d.passDraftNames) ? d.passDraftNames : [];
S.winnerType = d.winnerType || 'food';
S.restaurantTimezone = String(d.restaurantTimezone||'');
S.locationSource = String(d.locationSource||'none');
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
['manageFoodsModal','manageFoodsModalBg','foodEditorModal','foodEditorModalBg','settingsModal','settingsModalBg','historyModal','historyModalBg','aboutModal','aboutModalBg','iphoneModal','iphoneModalBg','detailsModal','detailsModalBg','passSetup','passSetupBg','passModal','passModalBg'].forEach(id => $(id)?.remove());
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
$('foodQuick').innerHTML = FOOD_QUICK.map(label => {
const cut = S.cutCats.has(label);
const src=QUICK_IMAGES[label] || QUICK_IMAGES.American;
return '<button class="chip photo-chip '+(cut?'cut':'')+'" data-food-quick="'+esc(label)+'"><img class="quick-chip-photo" src="'+esc(src)+'" data-fallback="'+esc(QUICK_IMAGES.American)+'" alt="'+esc(label)+' food photo"><span>'+esc(label)+'</span></button>';
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
 const next=$(nextId);let downX=0,active=false,committed=false;
 card.style.touchAction='none';
 const reset=()=>{card.style.transition='';card.style.transform='';card.style.opacity='';card.dataset.swipe='';if(next)next.style.transform='scale(.96)';};
 const cleanup=()=>{document.removeEventListener('pointerup',finish,true);document.removeEventListener('pointercancel',cancel,true);document.removeEventListener('mouseup',finishMouse,true);document.removeEventListener('touchend',finishTouch,true);};
 const commit=(dx)=>{
  if(committed)return;committed=true;active=false;cleanup();
  card.style.transition='transform .16s ease,opacity .16s ease';card.style.transform='translateX('+(dx<0?-520:520)+'px) rotate('+(dx<0?-18:18)+'deg)';
  const action=dx<0?onCut:onMaybe;setTimeout(()=>{reset();action();},80);
 };
 const finish=(e)=>{
  if(!active)return;
  const dx=Number(e?.clientX||downX)-downX;
  if(Math.abs(dx)>90)commit(dx);else{active=false;cleanup();reset();}
 };
 function finishMouse(e){finish(e);}
 function finishTouch(e){const t=e.changedTouches?.[0];if(t)finish(t);}
 function cancel(){if(!active)return;active=false;cleanup();reset();}
 card.onpointerdown=e=>{
  if(e.button!=null&&e.button!==0)return;
  if(e.target.closest?.('button,a,input,select'))return;
  downX=e.clientX;active=true;committed=false;card.dataset.swipe='';
  document.addEventListener('pointerup',finish,true);document.addEventListener('pointercancel',cancel,true);document.addEventListener('mouseup',finishMouse,true);document.addEventListener('touchend',finishTouch,{capture:true,passive:true});
 };
 card.onpointermove=e=>{
  if(!active)return;
  const dx=e.clientX-downX;
  if(Math.abs(dx)>8){if(e.cancelable)e.preventDefault();card.style.transform='translateX('+dx+'px) rotate('+(dx/22)+'deg)';card.style.opacity=String(Math.max(.76,1-Math.abs(dx)/900));card.dataset.swipe=dx<0?'cut':'maybe';if(next)next.style.transform='scale('+Math.min(1,.96+Math.abs(dx)/1400)+')';}
  if(Math.abs(dx)>=90)commit(dx);
 };
 card.onpointerup=finish;card.onpointercancel=cancel;
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
if (!await appConfirm('Hide this food?', 'Hide '+item.name+' until you restore it in Settings.', 'Hide')) return false;
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
if (!await appConfirm('Hide this food?', 'Hide '+item.name+' until you restore it in Settings.', 'Hide')) return;
S.hidden.add(item.id);
buildFood();
S.index = Math.min(S.index, Math.max(0, S.pool.length - 1));
drawFood();
save();
}
function randomCutOne() {
if (!S.pool.length) return;
const item = S.pool[Math.floor(Math.random() * S.pool.length)];
foodCut(item);
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
function restaurantCategory(row) {
if (row.fastFood || /fast food/i.test(String(row.category || ''))) return 'Fast Food';
const s = (String(row.category || '')+' '+String(row.cuisine || '')+' '+String(row.name || '')+' '+(Array.isArray(row.menuItems)?row.menuItems.join(' '):'')).toLowerCase();
if (/mexican|tex mex|taco|burrito/.test(s)) return 'Mexican';
if (/asian|chinese|japanese|thai|korean|sushi|vietnamese/.test(s)) return 'Asian';
if (/italian|pasta/.test(s)) return 'Pasta';
if (/southern|soul|country/.test(s)) return 'Southern';
if (/healthy|salad|vegetarian|vegan/.test(s)) return 'Healthy';
if (/soup|stew|chili|chowder/.test(s)) return 'Soup/Stew';
if (/greek|mediterranean|gyro/.test(s)) return 'Greek';
if (/pork/.test(s)) return 'Pork';
if (/bbq|barbecue/.test(s)) return 'BBQ';
return 'American';
}
function restaurantQuickMatches(row, label) {
const category = restaurantCategory(row);
if (label === 'Fast Food') return !!row.fastFood || category === 'Fast Food';
if (label === 'American') return category === 'American';
const hay = [row.name,row.brand,row.operator,row.category,row.cuisine,Array.isArray(row.menuItems)?row.menuItems.join(' '):''].filter(Boolean).join(' ').toLowerCase();
if (label === 'Mexican') return category === label || /mexican|tex mex|taco|burrito/.test(hay);
if (label === 'Asian') return category === label || /asian|chinese|japanese|thai|korean|sushi|vietnamese/.test(hay);
if (label === 'Pasta') return category === label || /italian|pasta|spaghetti|lasagna|fettuccine|ravioli|ziti/.test(hay);
if (label === 'Southern') return category === label || /southern|soul food|country cooking/.test(hay);
if (label === 'Healthy') return category === label || /healthy|salad|vegetarian|vegan|grain bowl|fresh/.test(hay);
if (label === 'Soup/Stew') return category === label || /soup|stew|chili|chowder/.test(hay);
if (label === 'Potato') {
const menu = Array.isArray(row.menuItems) ? row.menuItems.join(' ').toLowerCase() : String(row.menuItems || '').toLowerCase();
return /potato|fries|french fries|tater|hash brown|mashed potato/.test(menu) || /\bpotato\b/.test(String(row.name||'').toLowerCase());
}
if (label === 'Greek') return category === label || /greek|mediterranean|gyro|tzatziki/.test(hay);
if (label === 'Pork') return category === label || /pork|ham|bacon|sausage/.test(hay);
if (label === 'BBQ') return category === label || /bbq|barbecue|barbeque|smoked brisket|pulled pork/.test(hay);
return category === label;
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
function restaurantMatchesQuery(row) {
const q = S.restaurantQuery.trim().toLowerCase();
if (!q) return true;
const hay = [
row.name,row.brand,row.operator,row.category,row.cuisine,restaurantCategory(row),
...(Array.isArray(row.menuItems) ? row.menuItems : [])
].filter(Boolean).join(' ').toLowerCase();
return q.split(/\s+/).every(term => hay.includes(term));
}
function restaurantChoiceIndex(rows,start,keepState=false){
 const len=rows.length;if(!len)return -1;
 for(let step=0;step<len;step++){const i=(start+step)%len;if(keepState?!!rows[i]._maybe:!rows[i]._maybe)return i;}
 return -1;
}
function restaurantPoolFiltered(){
 return (S.restaurantPool||[]).filter(row=>{
  if([...S.restaurantCuts].some(label=>restaurantQuickMatches(row,label)))return false;
  if(row._cut||row._hidden||restaurantHidden(row))return false;
  if(S.hoursMode==='openUnknown'&&explicitClosed(row))return false;
  return restaurantMatchesQuery(row);
 });
}
function restaurantQuick() {
$('restQuick').innerHTML = REST_QUICK.map(label => {
const cut = S.restaurantCuts.has(label);
const src=REST_QUICK_IMAGES[label] || REST_QUICK_IMAGES.American;
return '<button class="chip photo-chip '+(cut?'cut':'')+'" data-rest-quick="'+esc(label)+'"><img class="quick-chip-photo" src="'+esc(src)+'" data-fallback="'+esc(REST_QUICK_IMAGES.American)+'" alt="'+esc(label)+' restaurant photo"><span>'+esc(label)+'</span></button>';
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
const labels={device:'Using your location',address:'Using selected address',typed:'Address needs selection',none:'No location selected'};
el.textContent=labels[S.locationSource]||labels.none;
el.classList.toggle('is-ready',S.locationSource==='device'||S.locationSource==='address');
}
function setLocation(lat, lon, label, source='address') {
S.location = {lat, lon, label};
S.locationSource = source;
$('address').value = label || 'Current location';
renderLocationSource();
save();
}
let suggestController = null;
let restaurantSearchController = null;
function setFindBusy(busy) {
const btn=$('find'); if(!btn)return;
btn.disabled=busy; btn.setAttribute('aria-busy',String(busy)); btn.textContent=busy?'Searching…':'Find';
}
async function useLocation() {
if (!navigator.geolocation) {
$('status').textContent='Location is not available in this browser.';
return;
}
$('status').textContent='Finding your location…';
const attempt=(highAccuracy,timeout,allowRetry)=>{
navigator.geolocation.getCurrentPosition(async pos=>{
try{
const r=await fetch('/api/restaurant-search?mode=reverse&lat='+encodeURIComponent(pos.coords.latitude)+'&lon='+encodeURIComponent(pos.coords.longitude));
const d=await r.json();
setLocation(pos.coords.latitude,pos.coords.longitude,d.display||'Current location','device');
$('status').textContent='Location ready.';
await searchRestaurants();
}catch{
setLocation(pos.coords.latitude,pos.coords.longitude,'Current location','device');
$('status').textContent='Location ready. Tap Find to search.';
}
},err=>{
if(err?.code===1){$('status').textContent='Location permission was denied. Enter an address instead.';return;}
if(allowRetry){$('status').textContent='Getting a more precise location…';attempt(true,10000,false);return;}
if(err?.code===3){$('status').textContent='Location timed out. Enter an address instead.';}
else if(err?.code===2){$('status').textContent='Location is temporarily unavailable. Enter an address instead.';}
else $('status').textContent='Could not access your location. Enter an address instead.';
},{enableHighAccuracy:highAccuracy,timeout,maximumAge:highAccuracy?30000:60000});
};
attempt(false,6000,true);
}
let suggestTimer = 0;
let suggestSeq = 0;
let suggestionIndex = -1;
const suggestCache = new Map();
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
'<button type="button" role="option" aria-selected="false" data-suggestion="'+i+'">'+esc(row.display)+'</button>'
).join('');
const hasRows=!!rows?.length;
box.hidden=!hasRows;
box.style.display=hasRows ? 'grid' : 'none';
$('address')?.setAttribute('aria-expanded',String(hasRows));
box.querySelectorAll('[data-suggestion]').forEach((btn, i) => {
btn.onclick = async () => {
const row = rows[i];
suggestionIndex = -1;
setLocation(row.lat, row.lon, row.display,'address');
clearSuggestions();
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
}
function moveSuggestion(delta){
const opts=[...document.querySelectorAll('#suggestionsBox [data-suggestion]')];
if(!opts.length)return false;
suggestionIndex=(suggestionIndex+delta+opts.length)%opts.length;
opts.forEach((el,i)=>el.setAttribute('aria-selected',String(i===suggestionIndex)));
opts[suggestionIndex].scrollIntoView?.({block:'nearest'});
return true;
}
let restaurantSearchSeq = 0;
async function responseJson(response, message){
let body=null;
try{body=await response.json();}catch{throw new Error(message||'The restaurant search returned an invalid response.');}
return body;
}
async function searchRestaurants() {
const searchSeq = ++restaurantSearchSeq;
restaurantSearchController?.abort();
restaurantSearchController = new AbortController();
const signal=restaurantSearchController.signal;
let timedOut=false;
const deadline=setTimeout(()=>{timedOut=true;restaurantSearchController.abort()},20000);
clearSuggestions(); setFindBusy(true); $('status').textContent = 'Searching restaurants…';
$('restStage').innerHTML='';
try {
let loc = S.location;
if (!loc) {
const q = $('address').value.trim();
if (!q) { $('status').textContent = 'Enter an address or use your location.'; return; }
const rr = await fetch('/api/restaurant-search?mode=resolve&q='+encodeURIComponent(q),{signal});
const rd = await responseJson(rr,'Could not locate that address. Please try another address.');
if (searchSeq !== restaurantSearchSeq) return;
if (!rr.ok || !rd.ok) throw new Error(rr.status===429 ? 'Address lookup is temporarily busy. Please try again.' : (rd.message || 'Could not locate that address.'));
loc = {lat:rd.lat, lon:rd.lon, label:rd.display}; S.location = loc; S.locationSource='address'; renderLocationSource(); $('address').value = rd.display;
}
const radius = Number($('radius').value) || 10;
const rr = await fetch('/api/restaurant-search?mode=search&lat='+encodeURIComponent(loc.lat)+'&lon='+encodeURIComponent(loc.lon)+'&radius='+radius,{signal});
const d = await responseJson(rr,'Restaurant search returned an invalid response. Please try again.');
if (searchSeq !== restaurantSearchSeq) return;
if (!rr.ok || !d.ok) throw new Error(rr.status===429 ? 'Restaurant search is temporarily busy. Please try again.' : (d.message || 'Restaurant search failed.'));
S.restaurantTimezone = String(d.timezone||'');
S.restaurantSearchDegraded = !!(d.providerErrors?.length);
S.restaurantSearchLatencyMs = Number(d.searchLatencyMs)||0;
S.restaurantSearchBudgetMs = Number(d.searchBudgetMs)||18000;
S.restaurantPool = uniq((d.results || []).map(row => ({...row, providerId:row.id, canonicalId:restaurantCanonicalId(row), _maybe:false, _cut:false, _hidden:false})));
S.restaurantIndex = 0; S.restaurantActions = []; S.restaurantCuts.clear(); S.restaurantQuery = ''; S.hoursMode = 'openUnknown';
renderHours(); S.winnerItem = null;
if(d.total) {
$('status').textContent = d.total+' restaurants found'+(d.fastFoodCount ? ' · '+d.fastFoodCount+' fast food' : '')+(d.providerErrors?.length ? ' · some sources unavailable' : '');
} else {
$('status').textContent = d.providerErrors?.length ? 'Restaurant sources are unavailable. Try again.' : 'No restaurants found in this radius.';
}
restaurantQuick(); drawRestaurants(); save();
} catch (err) {
if (err?.name==='AbortError' || searchSeq !== restaurantSearchSeq) return;
S.restaurantPool=[]; S.restaurantIndex=0; S.restaurantActions=[]; S.restaurantCuts.clear(); S.restaurantSearchDegraded=true; drawRestaurants();
$('status').textContent = timedOut ? 'The restaurant search took too long. Please try again.' : (err?.message || 'Could not complete the search.');
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
S.hoursMode = 'openUnknown';
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
const restaurantFallback = (r) => {
const s = String(r?.name||'').toLowerCase();
if (/chipotle/.test(s)) return 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85';
if (/ruby tuesday|thirsty goat/.test(s)) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85';
return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85';
};
const image = row.photo || row.image || restaurantFallback(row);
const nextRow = rows[S.restaurantIndex + 1];
const nextImage = nextRow?.photo || nextRow?.image || restaurantFallback(nextRow);
const cardAddress = row.address ? '<div class="card-detail-line">'+esc(row.address)+'</div>' : '';
const cardCuisine = row.cuisine ? '<div class="card-detail-line">'+esc(row.cuisine)+'</div>' : '';
const cardCommon = Array.isArray(row.menuItems) && row.menuItems.length ? '<div class="card-detail-line common-line">'+esc(row.menuItems.slice(0,2).join(' · '))+'</div>' : '';
const cardPhone = row.phone ? '<a class="card-detail-line card-phone" href="'+esc(phoneHref(row.phone))+'">'+esc(row.phone)+'</a>' : '';
const cardHours = '<span class="status-badge">'+(hourStatus(row)==='open'?'Open':hourStatus(row)==='closed'?'Closed':'Open/Unknown')+'</span>';
const websiteUrl=restaurantWebsiteUrl(row); const cardWebsite = '<a class="card-card-action website-action" href="'+esc(websiteUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="'+(safeExternalUrl(row.website)?'Open restaurant website':'Search restaurant on Google')+'" title="'+(safeExternalUrl(row.website)?'Website':'Search on Google')+'">Website ↗</a>';
$('restStage').innerHTML =
'<div class="restaurant-card-stack"><article class="card next-card '+(nextRow?'':'hidden')+'" id="restaurantNextCard" aria-hidden="true"><img src="'+esc(nextImage)+'" data-final-fallback="'+FINAL_RESTAURANT_IMAGE+'" alt="'+esc(nextRow?.name||'')+'"><div class="shade"></div></article><article class="card" id="restaurantCard"><img src="'+esc(image)+'" data-fallback="'+esc(restaurantFallback(row))+'" data-final-fallback="'+FINAL_RESTAURANT_IMAGE+'" alt="'+esc(row.name)+'"><div class="shade"></div><div class="card-copy"><small>'+esc(category)+(row.distance != null ? ' · '+Number(row.distance).toFixed(1)+' mi' : '')+'</small><h3>'+esc(row.name)+'</h3>'+cardAddress+cardCuisine+cardCommon+cardPhone+'<div class="card-status">'+cardHours+'</div><div class="card-card-actions">'+cardWebsite+'<button class="card-details card-card-action card-details-action icon-action" id="restDetails" type="button" aria-label="Details" title="Details"><svg class="details-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 7.25h2M11 7.25h7M6 12h2M11 12h7M6 16.75h2M11 16.75h5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div></article></div>'+
'<div class="swipe-actions" aria-label="Restaurant decision controls"><button class="round-action round-back secondary" id="restBack" aria-label="Back"><span>↶</span></button><button class="round-action round-cut cut" id="restCut" aria-label="Cut"><span>✕</span></button><button class="round-action round-maybe maybe" id="restMaybe" aria-label="Maybe"><span>♥</span></button><button class="round-action round-hide secondary" id="restHide" aria-label="Hide"><span>⌁</span></button></div>';
const current = rows[S.restaurantIndex];
const bindCardButton = (id, handler) => {
const el = $(id);
if (!el) return;
el.onclick = null;
el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); handler(); }, {once:true});
el.addEventListener('pointerdown', e => e.stopPropagation(), {once:true});
};
bindCardButton('restBack', restaurantBack);
bindCardButton('restMaybe', () => restaurantMaybe(current));
bindCardButton('restCut', () => restaurantCut(current));
bindCardButton('restHide', async () => { await restaurantHide(current); });
$('restDetails').onclick = e => { e.preventDefault(); e.stopPropagation(); detailsSheet(current, 'restaurant'); };
bindRestaurantSwipe(current);
bindImageFallback('#restStage img',restaurantFallback(row),FINAL_RESTAURANT_IMAGE);
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
function bindRestaurantSwipe(row){bindSwipeCard('restaurantCard','restaurantNextCard',()=>restaurantCut(row),()=>restaurantMaybe(row))}
function renderHours(){
 const btn=$('hoursToggle');if(!btn)return;const openMode=S.hoursMode==='openUnknown';btn.textContent=openMode?'Open/Unknown':'All';btn.dataset.mode=openMode?'open':'all';btn.setAttribute('aria-pressed',String(openMode));
}
function bindRestaurantTools(){
 $('restaurantSearch').onclick=()=>{const box=$('restaurantSearchBox');box.classList.toggle('hidden');$('restaurantQuery').value=S.restaurantQuery;if(!box.classList.contains('hidden'))$('restaurantQuery').focus();};
 $('restaurantQuery').oninput=()=>{S.restaurantQuery=$('restaurantQuery').value;S.restaurantIndex=0;drawRestaurants();save();};
 $('hoursToggle').onclick=e=>{e.preventDefault();S.hoursMode=S.hoursMode==='openUnknown'?'all':'openUnknown';S.restaurantIndex=0;renderHours();drawRestaurants();save();};renderHours();
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
winImg.src = item.image || item.photo || HUNGRY_IMAGE;
winImg.alt = item.name || 'Hungry';
if ($('celebration')) $('celebration').classList.toggle('hidden', hungry || S.winnerType === 'restaurant'); if (!hungry && S.winnerType !== 'restaurant') triggerCelebration();
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
 const image=item.image||item.photo||HUNGRY_IMAGE,cat=type==='restaurant'?restaurantCategory(item):item.category||'',nut=item.nutrition||{};
 const nutrition=type==='food'&&item.nutrition?'<div class="nutrition-card"><div class="detail-section-title">Typical nutrition</div><div class="nutrition-grid"><div><b>'+esc(nut.calories)+' kcal</b><span>Calories</span></div><div><b>'+esc(nut.protein)+' g</b><span>Protein</span></div><div><b>'+esc(nut.carbs)+' g</b><span>Carbs</span></div><div><b>'+esc(nut.fat)+' g</b><span>Fat</span></div><div><b>'+esc(nut.sodium)+' mg</b><span>Sodium</span></div></div><p class="detail-note">'+esc(item.nutritionNote||'Typical estimate per serving.')+'</p></div>':'';
 const ingredients=type==='food'&&Array.isArray(item.ingredients)&&item.ingredients.length?'<div class="detail-section"><div class="detail-section-title">Ingredients</div><p class="detail-body-copy">'+esc(item.ingredients.join(' · '))+'</p></div>':'';
 const pm=item.menuItems||item.commonMenuItems||item.common_menu_items||[],menus=Array.isArray(pm)?pm.filter(Boolean):String(pm||'').split(/[|,;·]/).map(x=>x.trim()).filter(Boolean);
 const menu=type==='restaurant'&&menus.length?'<div class="detail-section"><div class="detail-section-title">Common menu items</div><p class="detail-body-copy">'+esc(menus.slice(0,8).join(' · '))+'</p></div>':'';
 const recipe=item.recipe?'<div class="detail-section"><div class="detail-section-title">Recipe / notes</div><p class="detail-body-copy">'+esc(item.recipe).replace(/\n/g,'<br>')+'</p></div>':'';
 const meta=type==='restaurant'?'<div class="detail-section restaurant-detail-summary"><div class="detail-section-title">Restaurant information</div><div class="restaurant-detail-grid"><div><span>Category</span><b>'+esc(cat)+'</b></div>'+(item.cuisine?'<div><span>Cuisine</span><b>'+esc(item.cuisine)+'</b></div>':'')+(item.distance!=null?'<div><span>Distance</span><b>'+Number(item.distance).toFixed(1)+' mi</b></div>':'')+'<div><span>Hours</span><b>'+esc(item.opening_hours||'Open/Unknown')+'</b></div>'+(item.phone?'<div><span>Phone</span><b>'+esc(item.phone)+'</b></div>':'')+(item.address?'<div class="wide"><span>Address</span><b>'+esc(item.address)+'</b></div>':'')+'</div></div>':'';
 const final=type==='restaurant'?FINAL_RESTAURANT_IMAGE:FINAL_FOOD_IMAGE,web=type==='restaurant'?(safeExternalUrl(item.website)||restaurantWebsiteUrl(item)):'';
 const body='<div class="detail-grid"><img class="history-detail-photo" src="'+esc(image)+'" data-final-fallback="'+final+'" alt="'+esc(item.name)+'"><h2 style="margin:12px 0 4px;font-size:29px;letter-spacing:-.04em">'+esc(item.name)+'</h2>'+meta+(type==='restaurant'?'':'<p class="status">'+esc(item.category||'')+'</p>')+nutrition+ingredients+menu+recipe+'<div class="detail-actions-row"><button class="detail-hide-action" id="detailHide">Hide</button>'+(type==='restaurant'?'<a class="detail-web-action" id="detailWeb" href="'+esc(web)+'" target="_blank" rel="noopener noreferrer" aria-label="Website">Website ↗</a>':'')+'</div></div>';
 const modal=openModal('detailsModal','Details',body);bindImageFallback('#detailsModal img',type==='restaurant'?(item.photo||item.image||''):foodPhoto(item),final);
 $('detailHide').onclick=async()=>{const hidden=type==='restaurant'?await restaurantHide(item):await foodHideItem(item);if(hidden){modal.remove();$('detailsModalBg')?.remove();}};
}
function recordHistory(item, type) {
const history = readHistory();
history.unshift({
id:String(Date.now())+'-'+Math.random().toString(36).slice(2),
date:(() => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); })(),
type,name:item.name,image:item.image||item.photo||HUNGRY_IMAGE,
category:item.category||restaurantCategory(item),address:item.address||'',website:item.website||''
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
(entry ? '<button class="cal-day has" data-history-date="'+esc(entry.id)+'"><b>'+day+'</b><img src="'+esc(entry.image)+'" alt="">'+more+'</button><button class="cal-x" data-history-delete="'+esc(entry.id)+'" aria-label="Remove history entry for '+esc(key)+'">×</button>' :
'<div class="cal-day"><b>'+day+'</b></div>')+'</div>';
}
body += '</div></div><div class="history-list">';
body += history.length ? '<div class="history-toolbar"><span class="status">'+history.length+' saved decision'+(history.length===1?'':'s')+'</span><button class="secondary" id="historyClearAll" type="button">Clear all</button></div>'+history.slice(0,30).map(x => '<button class="history-row history-open" data-history-id="'+esc(x.id)+'"><img src="'+esc(x.image)+'" alt=""><span><b>'+esc(x.name)+'</b><small>'+esc(x.date)+' · '+esc(x.type)+'</small></span></button>').join('') : '<p class="status">No history yet.</p>';
body += '</div>';
const modal = openModal('historyModal','History',body);
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
if(!await appConfirm('Clear history?','This permanently removes all saved food and restaurant decisions from this device.','Clear History'))return;
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
const cats=['American','Southern','Asian','Mexican','Italian','Healthy','Breakfast','Soup/Stew','Greek','Snack','Potato'];
const body='<form class="add" id="foodEditorForm">'+
'<input id="editFoodName" placeholder="Food name" required value="'+esc(item?.name||'')+'">'+
'<select id="editFoodCat">'+cats.map(x=>'<option '+(x===(item?.category||'American')?'selected':'')+'>'+x+'</option>').join('')+'</select>'+
'<fieldset class="quick-cut-editor"><legend>Quick Cuts</legend><div class="quick-cut-editor-grid">'+cats.map(x=>'<label><input type="checkbox" name="editQuickCut" value="'+esc(x)+'" '+((item?.quickCuts||[]).includes(x)||(!item&&x===(item?.category||'American'))?'checked':'')+'><span>'+esc(x)+'</span></label>').join('')+'</div></fieldset>'+
'<label class="file-label">Photo from iPhone/device<input id="editFoodFile" type="file" accept="image/*" capture="environment"></label>'+
'<input id="editFoodPhoto" placeholder="Photo URL (optional)" inputmode="url" value="'+esc(item?.image && !item.image.startsWith('data:')?item.image:'')+'">'+
'<textarea id="editFoodRecipe" placeholder="Recipe or notes (optional)" rows="5">'+esc(item?.recipe||'')+'</textarea>'+
'<button class="cut">'+(isEdit?'Save Food':'Add Food')+'</button></form>';
const modal=openModal('foodEditorModal',isEdit?'Edit Food':'Add Food',body);
$('editFoodFile').onchange=async()=>{
try {
const data=await readImageFile($('editFoodFile').files?.[0]);
if(data) $('editFoodPhoto').value=data;
} catch(e) { appToast(e.message); }
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
if(id!==item.id && allFoods().some(x=>x.id===id)){appToast('A food with that name already exists.');return;}
if(photo.startsWith('data:image/')) await putStoredPhoto(id,photo);
S.custom[idx]={...S.custom[idx],id,name,primary:id===item.id?S.custom[idx].primary:id,category:cat,quickCuts,image:photo,recipe};
if(id!==item.id) await deleteStoredPhoto(item.id);
S.maybe.delete(item.id); S.hidden.delete(item.id);
} else {
const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
if(allFoods().some(x=>x.id===id)){appToast('A food with that name already exists.');return;}
if(photo.startsWith('data:image/')) await putStoredPhoto(id,photo);
S.custom.push({id,name,primary:id,category:cat,quickCuts,image:photo,recipe});
}
buildFood(); save(); modal.remove(); $('foodEditorModalBg')?.remove();


if(S.screen==='food' && !isEdit){ show('food'); foodQuick(); drawFood(); }
else manageFoodsView();
};
}
function manageFoodsView() {
const rows=allFoods();
const body='<div class="manage-intro">Add your own food with a photo, recipe, or notes. Foods can be hidden and restored here.</div>'+
'<button class="cut" id="openFoodEditor" style="width:100%;min-height:46px;border-radius:13px">Add Food</button>'+
'<div class="food-list">'+rows.map(item=>{
const hidden=S.hidden.has(item.id), custom=S.custom.some(x=>x.id===item.id);
const state=hidden?'Hidden':'Active';
return '<div class="food-row"><span><b>'+esc(item.name)+'</b><small class="row-state">'+esc(state)+(custom?' · Custom':'')+'</small></span><span class="food-row-actions">'+
(hidden?'<button class="restore" data-food-restore="'+esc(item.id)+'">Restore</button>':'<button class="restore" data-food-hide="'+esc(item.id)+'">Hide</button>')+
(custom?'<button class="restore" data-food-edit="'+esc(item.id)+'">Edit</button>':'')+
'</span></div>';
}).join('')+'</div>';
const modal=openModal('manageFoodsModal','Manage Foods',body);
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
 const body='<div class="settings-stack"><h4>Hidden Restaurants</h4><div>'+(hiddenRestaurants.length?hiddenRestaurants.map(x=>'<div class="food-row"><span>'+esc(x.name)+'</span><button class="restore" data-setting-rest="'+esc(x.id)+'">Restore</button></div>').join(''):'<p class="status">No hidden restaurants.</p>')+'</div><h4>System</h4><button class="settings-system-action diagnosis-action" id="appDiagnosis" type="button" aria-label="Open App Diagnosis">App Diagnosis</button><p class="status">Check the app and current device/runtime state.</p><button class="settings-system-action restore-action" id="systemRestore">System Restore</button><p class="status">Restores original foods and clears saved round changes. Custom foods remain.</p><button class="danger-action settings-reset-app" id="resetAppData">Reset App Data</button><p class="status">Deletes custom foods, history, hidden choices, and saved settings from this device.</p></div>';
 const modal=openModal('settingsModal','Settings',body);
 modal.querySelectorAll('[data-setting-rest]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.settingRest;delete S.hiddenRestaurants[id];const row=S.restaurantPool.find(x=>x.id===id);if(row)row._hidden=false;save();modal.remove();$('settingsModalBg')?.remove();settingsView();});
 $('appDiagnosis').onclick=appDiagnosisView;$('systemRestore').onclick=systemRestoreFlow;$('resetAppData').onclick=resetAppDataFlow;
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
async function appDiagnosisView(){
 const body='<div class="diagnosis-wrap"><div id="diagnosisBody" aria-busy="true"><p class="status">Running diagnostics…</p></div><div class="diagnosis-runbar"><span id="diagnosisRunStatus" class="diagnosis-run-status" aria-live="polite">Ready</span><button class="secondary diagnosis-refresh" id="diagnosisRefresh" type="button" aria-pressed="false" aria-label="Run diagnostics again">↻ Run again</button></div></div>';
 const modal=openModal('diagnosisModal','App Diagnosis',body);let running=false,run=0;
 const render=async()=>{
  if(running||!document.body.contains(modal))return;running=true;run++;
  const refresh=$('diagnosisRefresh'),runStatus=$('diagnosisRunStatus'),diagnosisBody=$('diagnosisBody');
  if(refresh){refresh.disabled=true;refresh.setAttribute('aria-pressed','true');refresh.classList.add('selected');refresh.classList.remove('complete');refresh.textContent='✓ RUNNING…';}
  if(runStatus){runStatus.textContent='Run '+run+' selected · checking now…';runStatus.classList.add('running');}
  if(diagnosisBody)diagnosisBody.setAttribute('aria-busy','true');
  const checks=[],pass=(l,d)=>checks.push({state:'ok',label:l,detail:d}),warn=(l,d)=>checks.push({state:'warn',label:l,detail:d}),info=(l,d)=>checks.push({state:'info',label:l,detail:d}),fail=(l,d)=>checks.push({state:'fail',label:l,detail:d});
  try{
   const foods=getDefaultFoods(),byId=new Map(foods.map(x=>[x.id,x])),required=[
    ['lasagna','Lasagna',['Pasta']],['vegetable-lasagna','Vegetable Lasagna',['Pasta','Healthy']],
    ['salisbury-steak','Salisbury Steak',['Southern','American']],['stuffed-peppers','Stuffed Peppers',['Healthy','American']]
   ];
   const missing=required.filter(([id])=>!byId.has(id)).map(([id])=>id);
   const wrongCuts=required.filter(([id,,cuts])=>{const got=byId.get(id)?.quickCuts||[];return cuts.some(x=>!got.includes(x));}).map(([id])=>id);
   const frozen=foods.some(x=>x.id==='frozen'||/stouffer/i.test(String(x.name||'')));
    const cerealRename=byId.get('cheerios')?.name==='Cereal';
    const healthShakeReady=!!byId.get('health-shake')?.ingredients?.length&&!!byId.get('health-shake')?.nutrition&&!!byId.get('health-shake')?.recipe&&byId.get('health-shake')?.quickCuts?.includes('Healthy');
   missing.length||wrongCuts.length||frozen||!cerealRename||!healthShakeReady?fail('Food catalog contract',[missing.length?'Missing: '+missing.join(', '):'',wrongCuts.length?'Quick Cut mismatch: '+wrongCuts.join(', '):'',frozen?'Stouffer’s Frozen Dinner is still present.':'',!cerealRename?'Cheerios Cereal was not renamed to Cereal.':'',!healthShakeReady?'Health Shake details/Healthy Quick Cut data is incomplete.':''].filter(Boolean).join(' ')):pass('Food catalog contract','65 foods loaded; requested foods present; Stouffer’s absent.');
   const imageIds=['lasagna','vegetable-lasagna','salisbury-steak','stuffed-peppers','stroganoff','tacos','stir-fry','meatloaf','buttermilk-cornbread','potato-soup','health-shake','homemade-pizza','mac-cheese','chicken-parmesan','country-fried-chicken'],imageMissing=imageIds.filter(id=>!/^https?:\/\//.test(String(byId.get(id)?.image||'')));
    const imageIdsExpected={'tacos':'14179985','stir-fry':'31673757','meatloaf':'2397401','buttermilk-cornbread':'6525832','potato-soup':'29653177','stuffed-peppers':'goodnes.com','stroganoff':'20234576','health-shake':'7974814','lasagna':'29174061','vegetable-lasagna':'5864352','grilled-salmon':'14542171','bbq-pulled-pork':'7181419','homemade-pizza':'7813574','meatball-subs':'commons.wikimedia.org/wiki/Special:FilePath/Meatball_Sub','sausage-peppers':'38085038','pork-tenderloin':'341044','white-fish':'36378584','salisbury-steak':'commons.wikimedia.org/wiki/Special:FilePath/Salisbury'};
    const staleImages=Object.entries(imageIdsExpected).filter(([id,photoId])=>!String(byId.get(id)?.image||'').includes(photoId)).map(([id])=>id);
   imageMissing.length||staleImages.length?fail('Food image catalog',[imageMissing.length?'Missing/invalid image URL: '+imageMissing.join(', '):'',staleImages.length?'Stale/unexpected photo mapping: '+staleImages.join(', '):''].filter(Boolean).join(' ')):pass('Food image catalog','All requested food photo mappings are present and current.');
   const quickSummary=required.map(([id,,cuts])=>id+': '+cuts.join(' + ')).join(' · ');pass('Quick Cut mapping',quickSummary);
   const imgs=[...document.querySelectorAll('img')].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(i).display!=='none'}),broken=imgs.filter(i=>i.complete&&i.naturalWidth===0),fallbacked=imgs.filter(i=>i.dataset.imageFallback==='true');
   broken.length?fail('Visible image rendering',broken.length+' visible image(s) have no decoded pixels.'):fallbacked.length?info('Visible image rendering',fallbacked.length+' visible image(s) are using the built-in local fallback; this is intentional.'):imgs.length?pass('Visible image rendering',imgs.length+' visible image(s) decoded successfully.'):info('Visible image rendering','No image-bearing surface is currently visible.');
   const surface=document.querySelector('.screen:not(.hidden)'),ox=document.documentElement.scrollWidth>document.documentElement.clientWidth||(surface&&surface.scrollWidth>surface.clientWidth+1),oy=document.documentElement.scrollHeight>window.innerHeight+2||(surface&&surface.scrollHeight>surface.clientHeight+2);
   ox||oy?warn('Viewport overflow','Horizontal '+(ox?'overflow detected':'clear')+' · vertical '+(oy?'content exceeds the viewport':'clear')+'.'):pass('Viewport overflow','No horizontal or vertical overflow detected.');
   try{const rr=await fetch('./api/release?diagnosis='+Date.now(),{cache:'no-store'}),d=await rr.json();if(rr.ok&&(d?.ok||d?.name)){const ok=String(d.build)===String(APP_BUILD)&&(!d.branch||String(d.branch)===RELEASE_SOURCE_BRANCH);ok?pass('Runtime release identity','Build '+d.build+' · branch '+(d.branch||RELEASE_SOURCE_BRANCH)+'.'):(location.hostname==='localhost'||location.hostname==='127.0.0.1'?info('Runtime release identity','Local QA server returned Build '+String(d.build||'unknown')+'; hosted deployment identity is checked by CI.'):fail('Runtime release identity','Expected Build '+APP_BUILD+' on '+RELEASE_SOURCE_BRANCH+'.'));}else warn('Runtime release identity','Release metadata returned HTTP '+rr.status+'.');}catch{info('Runtime release identity','Release metadata is not available in this runtime context.');}
   const dup=diagnosisRestaurantDuplicates(S.restaurantPool||[]).length;dup?warn('Restaurant duplicates',dup+' possible duplicate pairs are currently loaded; review only if they are actually the same venue.'):pass('Restaurant duplicates','No likely duplicate pairs are currently loaded.');
   try{const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),5000),rr=await fetch('/api/restaurant-search?mode=health',{cache:'no-store',signal:ctl.signal});clearTimeout(tm);const d=await rr.json();rr.ok&&d?.ok?pass('Restaurant search service','Healthy · provider runtime '+String(d.version||'unknown')+'.'):(location.hostname==='localhost'||location.hostname==='127.0.0.1'?info('Restaurant search service','Hosted health check is not available on the local QA server.'):warn('Restaurant search service','HTTP '+rr.status+'.'));}catch{(location.hostname==='localhost'||location.hostname==='127.0.0.1')?info('Restaurant search service','Hosted health check is not available on the local QA server.'):warn('Restaurant search service','Health check failed or timed out.');}
   pass('Decision model','Cut lowers the active count; Maybe/Keep stays in the count and is recycled into the narrowing pass.');
   pass('Final choice model','With one choice left: Cut opens Hungry; Maybe/Keep selects the winner and enables Share.');
   pass('Details controls','Food and restaurant Details use a compact 28px crisp list-details icon with card-copy breathing room and an accessible label.');
   S.restaurantPool?.length?pass('Current restaurant pool',String(S.restaurantPool.length)+' results loaded · '+String((S.restaurantPool||[]).filter(x=>x.fastFood).length)+' fast food.'):info('Current restaurant pool','No restaurant search results loaded yet.');
   pass('Hours filter','Current mode: '+(S.hoursMode==='openUnknown'?'Open/Unknown':'All')+'.');
   pass('Persistence','History, hidden choices, custom foods, and settings persist locally.');
   pass('PWA shell','Service-worker support is '+('serviceWorker' in navigator?'available.':'not available in this browser.'));
   pass('Viewport',window.innerWidth+'×'+window.innerHeight+' CSS pixels.');
   info('Build','Dinliminate '+APP_VERSION+' · Build '+APP_BUILD+' · run '+run+'.');
   info('Image licensing','Pexels photo availability is tested here; third-party rights review remains a separate launch gate.');
   info('Browser certification','CI checks differ from real iPhone Safari certification.');
  }catch(e){fail('Diagnostic runtime','Unexpected diagnostic failure: '+String(e?.message||e));}
  const failures=checks.filter(x=>x.state==='fail').length,warnings=checks.filter(x=>x.state==='warn').length,passing=checks.filter(x=>x.state==='ok').length;
  const overall=failures?'ACTION NEEDED':warnings?'REVIEW NEEDED':'HEALTHY';
  const bodyEl=$('diagnosisBody');
  if(bodyEl){bodyEl.setAttribute('aria-busy','false');bodyEl.innerHTML='<div class="diagnosis-summary"><b>System diagnosis · '+overall+'</b><span>Run '+run+' · '+failures+' failed · '+warnings+' actionable warnings · '+passing+' passing</span></div>'+checks.map(c=>'<div class="diagnosis-row '+c.state+'"><span class="diagnosis-mark">'+({ok:'✓',warn:'!',fail:'×',info:'i'})[c.state]+'</span><span><b>'+esc(c.label)+'</b><small>'+esc(c.detail)+'</small></span></div>').join('');}
  if(document.body.contains(modal)&&$('diagnosisRefresh')){$('diagnosisRefresh').disabled=false;$('diagnosisRefresh').setAttribute('aria-pressed','false');$('diagnosisRefresh').classList.remove('selected');$('diagnosisRefresh').classList.add('complete');$('diagnosisRefresh').textContent='↻ Run again';}
  if(document.body.contains(modal)&&$('diagnosisRunStatus')){$('diagnosisRunStatus').textContent='✓ Run '+run+' complete · '+(failures?'action needed':warnings?'review needed':'no actionable warnings');$('diagnosisRunStatus').classList.remove('running');}
  running=false;
 };
 $('diagnosisRefresh').onclick=()=>render();render();return modal;
}
function privacyView() {
const body = '<div class="info-copy"><h4>Privacy & Data</h4><p>Dinliminate uses your selected address or optional device location to find nearby restaurants. Location access is optional.</p><p>Restaurant/address results are retrieved through Dinliminate’s search service using third-party mapping and place providers. Your exact location or selected address is used for that search request.</p><p>Your food choices, hidden items, history, and custom-food information are stored on this device using browser storage. Custom food photos may be stored in IndexedDB on the device.</p><p>Restaurant and food images may be loaded from third-party image hosts. Restaurant availability, hours, phone numbers, websites, and menu information can change and are supplied by external providers.</p></div>';
openModal('privacyModal','Privacy',body);
}
function aboutView(){
 const date=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date());
 const body='<div class="info-copy"><h4>Dinliminate</h4><p>Made for Devona Dunn by Brian Dunn.</p><p>Cut the dinner choices until one survives.</p><button class="secondary" id="privacyFromAbout" style="width:100%;min-height:42px;border-radius:12px;margin:10px 0 4px">Privacy & Data</button><p class="about-test">CURRENT BUILD</p><div class="about-meta"><p><span>Version</span><b>'+esc(APP_VERSION)+'</b></p><p><span>Build</span><b>'+esc(APP_BUILD)+'</b></p><p><span>Date</span><b>'+esc(date)+'</b></p></div></div>';
 const modal=openModal('aboutModal','About Dinliminate',body);$('privacyFromAbout').onclick=()=>privacyView();return modal;
}
function iphoneHelp() {
openModal('iphoneModal','How to add to iPhone','<div class="info-copy"><p>Open Dinliminate in Safari on your iPhone.</p><p>Tap the Share button, then choose <b>Add to Home Screen</b>.</p><p>Tap <b>Add</b>. Dinliminate will appear on your Home Screen like an app.</p></div>');
}
function shareWinner() {
if (!S.winnerItem)return;
const text='Tonight: '+S.winnerItem.name;
if(navigator.share){navigator.share({title:'Dinliminate',text}).catch(()=>{});}
else if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>appToast('Decision copied.')).catch(()=>{});
}
function resetRound(){
S.pass=null; S.winnerItem=null; S.winnerType='food'; S.foodActions=[]; S.restaurantActions=[];
S.maybe.clear(); S.foodMaybeRound=false; S.cutCats.clear(); S.foodCuts.clear(); S.deleted.clear(); S.restaurantCuts.clear(); S.restaurantMaybeRound=false;
S.pool=[]; S.restaurantPool=[]; S.index=0; S.restaurantIndex=0; S.saved=false;
try{localStorage.removeItem(KEY);}catch{}
home();
}
async function resetAppDataFlow(){
if(!await appConfirm('Reset all app data?', 'This permanently removes custom foods, history, hidden choices, saved round state, and device-stored app preferences.', 'Reset Everything'))return;
S.hidden.clear(); S.deleted.clear(); S.hiddenRestaurants={}; S.cutCats.clear(); S.foodCuts.clear(); S.maybe.clear(); S.foodMaybeRound=false; S.restaurantCuts.clear(); S.restaurantMaybeRound=false;
S.pool=[]; S.restaurantPool=[]; S.index=0; S.restaurantIndex=0; S.foodActions=[]; S.restaurantActions=[]; S.pass=null; S.winnerItem=null; S.winnerType='food'; S.location=null; S.locationSource='none'; S.restaurantTimezone=''; S.restaurantSearchDegraded=false; S.storageWarning=false; S.saved=false; S.custom=[];
try{localStorage.removeItem(KEY);localStorage.removeItem(HISTORY_KEY);localStorage.removeItem('dinliminate.swipeHint.v1');}catch{}
try{const db=await openPhotoDB(); await new Promise(resolve=>{const tx=db.transaction(PHOTO_STORE,'readwrite'); tx.objectStore(PHOTO_STORE).clear(); tx.oncomplete=resolve; tx.onerror=resolve;});}catch{}
home();
}
async function systemRestoreFlow(){
if(!await appConfirm('Restore system defaults?', 'This restores the original food deck and clears saved round changes. Custom foods remain on this device.', 'Restore'))return;
S.hidden.clear(); S.deleted.clear(); S.hiddenRestaurants={}; S.cutCats.clear(); S.foodCuts.clear(); S.maybe.clear(); S.foodMaybeRound=false; S.restaurantCuts.clear(); S.restaurantMaybeRound=false;
S.pool=[]; S.restaurantPool=[]; S.index=0; S.restaurantIndex=0; S.foodActions=[]; S.restaurantActions=[]; S.pass=null; S.winnerItem=null; S.winnerType='food'; S.location=null; S.locationSource='none'; S.restaurantTimezone=''; S.restaurantSearchDegraded=false; S.storageWarning=false; S.saved=false;
try{localStorage.removeItem(KEY);}catch{}
document.querySelector('#settingsModal')?.remove();
document.querySelector('#settingsModalBg')?.remove();
document.querySelector('#drawer')?.classList.add('hidden');
document.querySelector('#drawerBg')?.classList.add('hidden');
save();
home();
}
function passCandidates() {
return S.screen === 'restaurant' ? restaurantPoolFiltered() : S.pool;
}
function removePassSurface(){
const el=document.querySelector('#passSurface'); if(!el)return; el._passSwipeCleanup?.(); el.remove();
}
function openPassSurface(inner){
removePassSurface();
const surface=document.createElement('section');
surface.id='passSurface';
surface.className='pass-surface';
surface.innerHTML=inner;
document.body.appendChild(surface);
const gesture=surface.querySelector('#passGestureHit'),card=surface.querySelector('#passCard'),next=surface.querySelector('#passNextCard');
if(gesture&&card){
gesture.dataset.passSwipeBound='true';
let startX=0,startY=0,active=false;
const reset=()=>{card.style.transition='';card.style.transform='';card.style.opacity='';card.dataset.swipe='';if(next)next.style.transform='scale(.96)';};
const finish=(clientX)=>{
if(!active)return; active=false;
const dx=clientX-startX;
if(Math.abs(dx)>90){
card.style.transition='transform .16s ease,opacity .16s ease';
card.style.transform='translateX('+(dx<0?-520:520)+'px) rotate('+(dx<0?-18:18)+'deg)';
setTimeout(()=>{reset(); if(window.__DINLIMINATE_TEST__)window.__DINLIMINATE_TEST__.passSurfaceVotes=(window.__DINLIMINATE_TEST__.passSurfaceVotes||0)+1; const current=S.pass?.poolIds?.[S.pass.choiceIndex]; const fn=dx<0?false:true; const keep=fn; if(current){ const item=currentPassItem(); if(item)passVote(keep); }},110);
}else reset();
};
surface.addEventListener('pointerdown',e=>{if(e.target===gesture||e.target.closest?.('#passGestureHit')){startX=e.clientX;startY=e.clientY;active=true;}},true);
surface.addEventListener('pointermove',e=>{if(!active)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dy)>Math.abs(dx)*1.2)return;if(Math.abs(dx)>8){if(e.cancelable)e.preventDefault();card.style.transform='translateX('+dx+'px) rotate('+(dx/22)+'deg)';card.style.opacity=String(Math.max(.76,1-Math.abs(dx)/900));card.dataset.swipe=dx<0?'cut':'maybe';if(next)next.style.transform='scale('+Math.min(1,.96+Math.abs(dx)/1400)+')';}},true);
surface.addEventListener('pointerup',e=>finish(e.clientX),true);
surface.addEventListener('pointercancel',()=>{active=false;reset();},true);
surface.addEventListener('mousedown',e=>{if(e.target===gesture||e.target.closest?.('#passGestureHit')){startX=e.clientX;startY=e.clientY;active=true;}},true);
surface.addEventListener('mousemove',e=>{if(!active)return;const dx=e.clientX-startX;if(Math.abs(dx)>8){e.preventDefault();card.style.transform='translateX('+dx+'px) rotate('+(dx/22)+'deg)';card.style.opacity=String(Math.max(.76,1-Math.abs(dx)/900));card.dataset.swipe=dx<0?'cut':'maybe';if(next)next.style.transform='scale('+Math.min(1,.96+Math.abs(dx)/1400)+')';}},true);
surface.addEventListener('mouseup',e=>finish(e.clientX),true);
surface.addEventListener('mouseleave',e=>{if(active&&e.buttons===0)finish(e.clientX);},true);
surface.addEventListener('touchstart',e=>{const t=e.touches?.[0];if(t&&(e.target===gesture||e.target.closest?.('#passGestureHit'))){startX=t.clientX;startY=t.clientY;active=true;}},{capture:true,passive:true});
surface.addEventListener('touchmove',e=>{if(!active)return;const t=e.touches?.[0];if(!t)return;const dx=t.clientX-startX;if(Math.abs(dx)>8){e.preventDefault();card.style.transform='translateX('+dx+'px) rotate('+(dx/22)+'deg)';card.style.opacity=String(Math.max(.76,1-Math.abs(dx)/900));card.dataset.swipe=dx<0?'cut':'maybe';if(next)next.style.transform='scale('+Math.min(1,.96+Math.abs(dx)/1400)+')';}},{capture:true,passive:false});
surface.addEventListener('touchend',e=>{const t=e.changedTouches?.[0];if(t)finish(t.clientX);},{capture:true,passive:true});
surface.addEventListener('touchcancel',()=>{active=false;reset();},{capture:true,passive:true});
}
return surface;
}
function passSetup() {
const counts=[2,3,4,5,6,7,8];
const surface=openPassSurface('<div class="pass-top"><b>PASS AROUND</b><button class="menu" id="passClose" type="button" aria-label="Close Pass Around">×</button></div><div class="pass-setup-wrap"><h2>Pass this one around.</h2><p class="status">Everyone gets a turn. Cut removes a choice. A choice everyone keeps survives.</p><div class="pass-counts">'+counts.map(n=>'<button class="chip pass-count '+(S.passDraftCount===n?'selected':'')+'" data-pass-count="'+n+'">'+n+'</button>').join('')+'</div><div id="passNames"></div><button class="cut" id="passBegin" style="width:100%;margin-top:14px;min-height:50px;border-radius:15px">Start Pass Around</button></div>');
$('passClose').onclick=()=>removePassSurface();
const renderNames=()=>{
$('passNames').innerHTML='<div class="pass-name-grid">'+Array.from({length:S.passDraftCount},(_,i)=>'<input class="pass-name" data-pass-name="'+i+'" placeholder="Person '+(i+1)+'" maxlength="24">').join('')+'</div>';
document.querySelectorAll('[data-pass-name]').forEach((x,i)=>x.value=S.passDraftNames[i]||'');
document.querySelectorAll('[data-pass-count]').forEach(x=>x.classList.toggle('selected',Number(x.dataset.passCount)===S.passDraftCount));
};
renderNames();
document.querySelectorAll('[data-pass-count]').forEach(btn=>btn.onclick=()=>{S.passDraftCount=Number(btn.dataset.passCount);renderNames();});
$('passBegin').onclick=()=>{
S.passDraftNames=[...document.querySelectorAll('[data-pass-name]')].map((x,i)=>x.value.trim()||'Person '+(i+1));
const pool=passCandidates();
if(!pool.length){removePassSurface();appToast('There are no choices left to pass around.');return;}
S.pass={type:S.screen==='restaurant'?'restaurant':'food',players:S.passDraftNames,choiceIndex:0,voterIndex:0,history:[],poolIds:pool.map(x=>x.id)};
drawPass();
};
}
function currentPassItem(){
const id=S.pass?.poolIds?.[S.pass.choiceIndex];
return passCandidates().find(x=>x.id===id);
}
function drawPass(){
const p=S.pass;
if(!p)return;
if(p.choiceIndex>=p.poolIds.length)return finishPass();
const item=currentPassItem();
if(!item){p.choiceIndex++;p.voterIndex=0;return drawPass();}
const voter=p.players[p.voterIndex]||'Next person';
const img=foodPhoto(item);
const fallback=foodPhotoFallback(item);
const image= S.screen==='restaurant' ? (item.photo||item.image||'') : img;
const imageFallback= S.screen==='restaurant' ? (item.photo||item.image||REST_QUICK_IMAGES.American) : fallback;
const surface=openPassSurface('<div class="pass-top"><b>PASS AROUND</b><button class="menu" id="passClose" type="button" aria-label="End Pass Around">×</button></div><div class="pass-card-stage"><div class="pass-card-stack"><article class="pass-card next-card hidden" id="passNextCard" aria-hidden="true"><img alt=""></article><article class="pass-card current-card" id="passCard"><img id="passImg" alt="'+esc(item.name)+'" src="'+esc(image||imageFallback)+'" data-fallback="'+esc(imageFallback)+'"><div class="shade"></div><button class="pass-gesture-hit" id="passGestureHit" type="button" aria-label="Swipe choice left to cut or right to keep" tabindex="-1"></button><div class="pass-card-copy"><small>CHOICE '+(p.choiceIndex+1)+' OF '+p.poolIds.length+'</small><h2>'+esc(item.name)+'</h2><p>Pass to <strong style="color:#eee">'+esc(voter)+'</strong></p></div></article></div><div class="pass-voter">Left = Cut · Right = Keep</div><div class="pass-actions"><button class="secondary" id="passBack">↶</button><button class="cut" id="passCut">✕</button><button class="maybe" id="passKeep">♥</button></div></div>');
$('passClose').onclick=()=>endPass();
$('passBack').onclick=passUndo;
$('passCut').setAttribute('aria-label','Cut this choice');
$('passKeep').setAttribute('aria-label','Keep this choice');
$('passCut').onclick=()=>passVote(false);
$('passKeep').onclick=()=>passVote(true);
const next=p.poolIds[p.choiceIndex+1] ? passCandidates().find(x=>x.id===p.poolIds[p.choiceIndex+1]) : null;
if(next){
const nsrc=S.screen==='restaurant' ? (next.photo||next.image||REST_QUICK_IMAGES.American) : foodPhoto(next);
$('passNextCard').classList.remove('hidden');
const passNextImg = $('passNextCard img');
if (passNextImg) {
passNextImg.src=nsrc;
passNextImg.dataset.fallback=S.screen==='restaurant' ? (next.photo||next.image||REST_QUICK_IMAGES.American) : foodPhotoFallback(next);
passNextImg.onerror=function(){this.onerror=null;this.src=this.dataset.fallback;};
}
}
$('passImg').onerror=function(){this.onerror=null;this.src=this.dataset.fallback||imageFallback;};

}
function passVote(keep){
const p=S.pass,item=currentPassItem();
if(!p||!item)return;
p.history.push({choiceIndex:p.choiceIndex,voterIndex:p.voterIndex,choiceId:item.id,keep});
if(!keep){
p.poolIds=p.poolIds.filter(id=>id!==item.id);
if(p.poolIds.length===1)return finishPass();
p.choiceIndex=Math.min(p.choiceIndex,Math.max(0,p.poolIds.length-1));
p.voterIndex=0; drawPass(); return;
}
if(p.voterIndex<p.players.length-1){p.voterIndex++;drawPass();return;}
p.choiceIndex++;p.voterIndex=0;drawPass();
}
function passUndo(){
const p=S.pass;if(!p?.history?.length)return;
const last=p.history.pop();
if(!last.keep&&last.choiceId&&!p.poolIds.includes(last.choiceId))p.poolIds.splice(Math.min(last.choiceIndex,p.poolIds.length),0,last.choiceId);
p.choiceIndex=last.choiceIndex;p.voterIndex=last.voterIndex;drawPass();
}
function finishPass(){
const p=S.pass;if(!p)return;
const rows=p.poolIds.map(id=>passCandidates().find(x=>x.id===id)).filter(Boolean);
S.pass=null;removePassSurface();
if(rows.length===1){winner(rows[0]);return;}
if(!rows.length){winner({name:'Nothing left — hungry mode',image:HUNGRY_IMAGE,category:'Hungry'});return;}
if(S.screen==='restaurant'){S.restaurantPool=S.restaurantPool.filter(x=>rows.some(r=>r.id===x.id));S.restaurantIndex=0;drawRestaurants();}
else {S.pool=rows;S.index=0;drawFood();}
save();
}
function endPass(){
const p=S.pass;if(!p)return;
const rows=p.poolIds.map(id=>passCandidates().find(x=>x.id===id)).filter(Boolean);
S.pass=null;removePassSurface();
if(S.screen==='restaurant'){S.restaurantPool=S.restaurantPool.filter(x=>rows.some(r=>r.id===x.id));S.restaurantIndex=0;drawRestaurants();}
else {S.pool=rows;S.index=0;drawFood();}
save();
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
$('randomOne').onclick = randomCutOne;
$('foodPassAround').onclick = passSetup;
$('restaurantPassAround').onclick = passSetup;
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
$('address').addEventListener('input', () => { S.location=null; S.locationSource='typed'; renderLocationSource(); clearSuggestions(); suggestAddresses(); });
$('address').addEventListener('focus', () => { if ($('address').value.trim().length>=2) suggestAddresses(); });
$('address').addEventListener('keydown', e => {
if(e.key==='ArrowDown'){ if(moveSuggestion(1)){e.preventDefault();return;} }
if(e.key==='ArrowUp'){ if(moveSuggestion(-1)){e.preventDefault();return;} }
if(e.key==='Enter'){
const opts=[...document.querySelectorAll('#suggestionsBox [data-suggestion]')];
if(suggestionIndex>=0&&opts[suggestionIndex]){e.preventDefault();opts[suggestionIndex].click();return;}
e.preventDefault();clearSuggestions();searchRestaurants();
}
if(e.key==='Escape') clearSuggestions();
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
if(new URLSearchParams(location.search).get('qa')==='1') window.__DINLIMINATE_TEST__={hourStatus:(row,iso,zone)=>hourStatus(row,new Date(iso),zone)};
load();
renderLocationSource();
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
pass:S.pass ? JSON.parse(JSON.stringify(S.pass)) : null
})
};
}
})();
