const RESTAURANT_MAX_MILES=100;
let restaurantRadiusMiles=10;
let restaurantItems=[];
let restaurantBase=[];
let activeRestaurants=[];
let holdingRestaurants=[];
let restaurantManual=new Set();
let restaurantFilters={query:''};
function restKey(x){return `restaurant::${String(x?.id||x?.name||'').trim().toLowerCase()}`;}
function uniq(arr,keyFn){const m=new Map();for(const x of arr||[]){if(!x)continue;const k=keyFn(x);if(!m.has(k))m.set(k,x);}return [...m.values()];}
function read(){return 'open-unknown';}
function restaurantOpenStatus(){return null;}
function restQuickMatch(x,k){if(k==='fast_food')return x.fastFood===true;if(k==='american')return String(x.category||'').toLowerCase()==='american';return false;}
function currentRestaurantQuickCutUniverse(){
  const radius=Math.min(Number(RESTAURANT_MAX_MILES)||100,Math.max(1,Number(restaurantRadiusMiles)||10));
  const source=Array.isArray(restaurantItems)?restaurantItems:uniq([...(restaurantBase||[]),...(activeRestaurants||[]),...(holdingRestaurants||[])],restKey);
  return uniq(source.filter(r=>{const d=Number(r?.distanceMiles);return !Number.isFinite(d)||d<=radius;}),restKey);
}
function syncRestaurantQuickCutScope(){const pool=currentRestaurantQuickCutUniverse();restaurantBase=[...pool];return restaurantBase;}
function restaurantQuickCutDisplayPool(){
  let pool=[...syncRestaurantQuickCutScope()];
  const q=String(restaurantFilters?.query||'').trim().toLowerCase();
  if(q)pool=pool.filter(r=>`${r?.name||''} ${r?.address||''} ${r?.brand||''} ${r?.operator||''} ${r?.category||''} ${r?.cuisine||''} ${Array.isArray(r?.tags)?r.tags.join(' '):r?.tags||''}`.toLowerCase().includes(q));
  const hours=read('dinliminateRestaurantHoursFilter','open-unknown')==='closed'?'closed':'open-unknown';
  if(hours==='closed')pool=pool.filter(r=>restaurantOpenStatus?.(r)===false); else pool=pool.filter(r=>restaurantOpenStatus?.(r)!==false);
  const manual=new Set(restaurantManual||[]); const held=new Set((holdingRestaurants||[]).map(restKey));
  return pool.filter(r=>!manual.has(restKey(r))&&!held.has(restKey(r)));
}
const count=k=>restaurantQuickCutDisplayPool().filter(x=>restQuickMatch(x,k)).length;
const a={id:'a',name:"McDonald's",distanceMiles:2,fastFood:true};
const b={id:'b',name:'Waffle House',distanceMiles:7,category:'american'};
const c={id:'c',name:'Burger Place',distanceMiles:4,fastFood:true};
const stale={id:'stale',name:'Old Fast Food',distanceMiles:20,fastFood:true};
restaurantItems=[a,b,c];restaurantBase=[stale];
if(count('fast_food')!==2)throw new Error('10mi fast-food count wrong');
restaurantRadiusMiles=5;
if(count('fast_food')!==2)throw new Error('5mi fast-food count wrong');
restaurantManual.add(restKey(a));
if(count('fast_food')!==1)throw new Error('Cut did not update count');
holdingRestaurants=[c];
if(count('fast_food')!==0)throw new Error('Maybe did not update count');
restaurantItems=[];restaurantBase=[stale,a];restaurantManual.clear();holdingRestaurants=[];
if(count('fast_food')!==0)throw new Error('empty current results resurrected stale pool');
console.log('P683_QUICKCUT_LOGIC_OK');