
const F=DINLIMINATE_FOODS;
const KEY='dinliminate.clean.cp1', $=id=>document.getElementById(id), cats=['Southern','Pasta','Asian','Mexican','Pork','Soup','Healthy','Breakfast','American','Greek','Snack'];
const S={screen:'home',hidden:new Set(),cutCats:new Set(),cutPrimary:new Set(),maybe:new Set(),custom:[],pool:[],index:0,restaurantCuts:new Set(),saved:false,restaurantPool:[]};
function active(){return [...F,...S.custom].filter(x=>!S.hidden.has(x.id));}
function persist(){localStorage.setItem(KEY,JSON.stringify({...S,hidden:[...S.hidden],cutCats:[...S.cutCats],cutPrimary:[...S.cutPrimary],maybe:[...S.maybe],restaurantCuts:[...S.restaurantCuts]}));S.saved=true;updateContinue();}
function hydrate(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(!x)return false;Object.assign(S,x,{hidden:new Set(x.hidden||[]),cutCats:new Set(x.cutCats||[]),cutPrimary:new Set(x.cutPrimary||[]),maybe:new Set(x.maybe||[]),restaurantCuts:new Set(x.restaurantCuts||[])});return true}catch{return false}}
function updateContinue(){$('continue').classList.toggle('hidden',!S.saved||!S.pool?.length)}
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.add('hidden'));$(id).classList.remove('hidden');scrollTo(0,0)}
function home(){S.screen='home';show('home');updateContinue()}
function build(){S.pool=active().filter(x=>!S.cutCats.has(x.category)&&!S.cutPrimary.has(x.primary)&&!S.maybe.has(x.id));S.index=Math.max(0,Math.min(S.index,S.pool.length-1))}
function drawQuick(){ $('foodQuick').innerHTML=cats.map(c=>'<button class="chip '+(S.cutCats.has(c)?'cut':'')+'" data-c="'+c+'">'+c+'</button>').join('');document.querySelectorAll('#foodQuick .chip').forEach(b=>b.onclick=()=>{const c=b.dataset.c;S.cutCats.has(c)?S.cutCats.delete(c):S.cutCats.add(c);build();S.index=0;drawQuick();drawFood();persist()}); $('restQuick').innerHTML=cats.map(c=>'<button class="chip '+(S.restaurantCuts.has(c)?'cut':'')+'" data-c="'+c+'">'+c+'</button>').join('');document.querySelectorAll('#restQuick .chip').forEach(b=>b.onclick=()=>{const c=b.dataset.c;S.restaurantCuts.has(c)?S.restaurantCuts.delete(c):S.restaurantCuts.add(c);drawQuick();drawRestaurants()})}
function startFood(){S.screen='food';S.maybe.clear();S.cutCats.clear();S.cutPrimary.clear();S.index=0;build();drawQuick();show('food');drawFood();persist()}
function drawFood(){if(!S.pool.length){winner({name:'Nothing left — hungry mode',image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85'});return}const x=S.pool[S.index];$('foodImg').src=x.image;$('foodImg').alt=x.name;$('foodName').textContent=x.name;$('foodCat').textContent=x.category;$('foodCount').textContent=S.pool.length+' choices'}
function cut(){const x=S.pool[S.index];S.cutPrimary.add(x.primary);S.maybe.delete(x.id);build();if(S.pool.length===1){persist();winner(S.pool[0])}else{S.index=Math.min(S.index,S.pool.length-1);drawFood();persist()}}
function maybe(){const x=S.pool[S.index];S.maybe.add(x.id);S.pool=S.pool.filter(y=>y.id!==x.id);S.index=Math.min(S.index,Math.max(0,S.pool.length-1));if(S.pool.length===1){persist();winner(S.pool[0])}else if(!S.pool.length){winner({name:'Nothing left — hungry mode',image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85'})}else{drawFood();persist()}}
function back(){if(S.index>0){S.index--;drawFood();persist()}else home()}
function hide(){const x=S.pool[S.index];if(confirm('Hide '+x.name+' until you restore it in Manage Foods?')){S.hidden.add(x.id);build();S.index=Math.min(S.index,Math.max(0,S.pool.length-1));drawFood();persist()}}
function winner(x){S.screen='winner';$('winName').textContent=x.name;$('winImg').src=x.image;$('winImg').alt=x.name;show('winner')}
function openDrawer(v){$('drawer').classList.toggle('hidden',!v);$('drawerBg').classList.toggle('hidden',!v)}
function openModal(v){$('modal').classList.toggle('hidden',!v);$('modalBg').classList.toggle('hidden',!v);if(v)drawList()}
function drawList(){$('foodList').innerHTML=active().map(x=>'<div class="food-row"><span>'+x.name+'</span>'+(S.hidden.has(x.id)?'<button class="restore" data-r="'+x.id+'">Restore</button>':'')+'</div>').join('');document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{S.hidden.delete(b.dataset.r);drawList();build();drawFood();persist()})}
function drawRestaurants(){const p=S.restaurantPool.filter(x=>!S.restaurantCuts.has(x.category));if(!p.length){$('restStage').innerHTML='<div class="empty"><b>Hungry.</b><span>No restaurants match the current cuts.</span></div>';return}const r=p[0];$('restStage').innerHTML='<article class="card"><img src="'+r.image+'" alt="'+r.name+'"><div class="shade"></div><div class="card-copy"><small>'+r.category+' · '+r.distance+' mi</small><h3>'+r.name+'</h3></div></article>'}
function searchRestaurants(){const q=$('address').value.trim();if(!q&& !S.location){$('status').textContent='Enter an address or use your location.';return}$('status').textContent='Restaurant search is next in checkpoint 2.';S.restaurantPool=[{id:'w',name:'Waffle House',category:'American',distance:'1.2',image:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85'},{id:'a',name:'Applebee’s',category:'American',distance:'2.1',image:'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85'},{id:'m',name:'McDonald’s',category:'Fast Food',distance:'2.4',image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85'}];drawRestaurants();persist()}
function useLocation(){if(!navigator.geolocation){$('status').textContent='Location is not available in this browser.';return}$('status').textContent='Finding your location…';navigator.geolocation.getCurrentPosition(p=>{S.location={lat:p.coords.latitude,lng:p.coords.longitude};$('address').value='Current location';$('status').textContent='Location ready.';persist()},()=>{$('status').textContent='Could not access your location. Enter an address instead.'},{enableHighAccuracy:true,timeout:12000})}
$('foodStart').onclick=startFood;$('restStart').onclick=()=>{S.screen='restaurant';show('restaurant');drawQuick()};document.querySelectorAll('[data-home]').forEach(b=>b.onclick=home);$('foodCut').onclick=cut;$('foodMaybe').onclick=maybe;$('foodBack').onclick=back;$('foodHide').onclick=hide;$('menu').onclick=()=>openDrawer(true);$('drawerClose').onclick=()=>openDrawer(false);$('drawerBg').onclick=()=>openDrawer(false);$('manage').onclick=()=>{openDrawer(false);openModal(true)};$('modalClose').onclick=()=>openModal(false);$('modalBg').onclick=()=>openModal(false);$('locate').onclick=useLocation;$('find').onclick=searchRestaurants;$('continue').onclick=()=>{if(!hydrate())return startFood();S.saved=true;if(S.screen==='food'){show('food');drawQuick();drawFood()}else if(S.screen==='restaurant'){show('restaurant');drawQuick();drawRestaurants()}else startFood()};$('restart').onclick=()=>{localStorage.removeItem(KEY);Object.assign(S,{hidden:new Set(),cutCats:new Set(),cutPrimary:new Set(),maybe:new Set(),pool:[],index:0,saved:false});startFood()};$('share').onclick=async()=>{try{await navigator.share({title:'Dinliminate',text:'Tonight: '+$('winName').textContent})}catch{}};$('details').onclick=()=>alert('The clean Details view is part of the next milestone.');$('addForm').onsubmit=e=>{e.preventDefault();const n=$('newName').value.trim();if(!n)return;const id=n.toLowerCase().replace(/[^a-z0-9]+/g,'-');S.custom.push({id,name:n,primary:id,category:$('newCat').value,image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85'});$('newName').value='';build();drawList();drawFood();persist()};
let downX=0;let dragging=false;$('foodCard').addEventListener('pointerdown',e=>{downX=e.clientX;dragging=true;$('foodCard').setPointerCapture(e.pointerId)});$('foodCard').addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;const dx=e.clientX-downX;if(Math.abs(dx)>90){dx<0?cut():maybe()}});$('foodCard').addEventListener('pointercancel',()=>dragging=false);
S.saved=hydrate()||false;if(S.saved){drawQuick();updateContinue()}else updateContinue();

/* CHECKPOINT 2 runtime: live restaurant flow */
const REST_CATS=['American','Fast Food','Mexican','Asian','Pasta','Southern','Healthy','Soup','Greek','Pork','BBQ'];
function restCategory(r){
  if(r.fastFood || String(r.category||'').toLowerCase().includes('fast food')) return 'Fast Food';
  const s=(String(r.category||'')+' '+String(r.cuisine||'')).toLowerCase();
  if(/mexican|tex mex|taco|burrito/.test(s))return'Mexican';
  if(/asian|chinese|japanese|thai|korean|sushi|vietnamese/.test(s))return'Asian';
  if(/italian|pasta|pizza/.test(s))return'Pasta';
  if(/southern|soul|country/.test(s))return'Southern';
  if(/healthy|salad|vegetarian|vegan/.test(s))return'Healthy';
  if(/soup|stew|chili|chowder/.test(s))return'Soup';
  if(/greek|mediterranean|gyro/.test(s))return'Greek';
  if(/pork|barbecue|bbq/.test(s))return/PORK/.test(s.toUpperCase())?'Pork':'BBQ';
  return 'American';
}
function renderRestaurantQuickCuts(){
  $('restQuick').innerHTML=REST_CATS.map(c=>'<button class="chip '+(S.restaurantCuts.has(c)?'cut':'')+'" data-rq="'+c+'">'+c+'</button>').join('');
  document.querySelectorAll('#restQuick .chip').forEach(b=>b.onclick=()=>{const c=b.dataset.rq;S.restaurantCuts.has(c)?S.restaurantCuts.delete(c):S.restaurantCuts.add(c);renderRestaurantQuickCuts();cleanDrawRestaurants();persist()});
}
function restaurantFiltered(){return (S.restaurantPool||[]).filter(r=>!S.restaurantCuts.has(restCategory(r))&& !r._maybe);}
function cleanDrawRestaurants(){
  const p=restaurantFiltered();
  if(!p.length){$('restStage').innerHTML='<div class="empty"><b>Hungry.</b><span>No restaurants match the current cuts.</span></div>';return;}
  S.restaurantIndex=Math.max(0,Math.min(S.restaurantIndex||0,p.length-1));
  const r=p[S.restaurantIndex], cat=restCategory(r);
  $('restStage').innerHTML='<article class="card" id="restaurantCard"><img src="'+(r.photo||r.image||'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85')+'" alt="'+r.name.replace(/"/g,'&quot;')+'"><div class="shade"></div><div class="card-copy"><small>'+cat+' · '+(Number.isFinite(Number(r.distance))?Number(r.distance).toFixed(1)+' mi':'')+'</small><h3>'+r.name+'</h3></div></article><div class="result-count" style="position:relative;margin-top:8px;text-align:center;color:#666;font-size:11px">'+p.length+' restaurants</div><div class="actions" style="width:100%"><button class="secondary" id="restBack">Back</button><button class="maybe" id="restMaybe">Maybe</button><button class="cut" id="restCut">Cut</button><button class="secondary" id="restHide">Hide</button></div><div class="card-links" style="display:flex;gap:8px;margin-top:8px"><button class="small" id="restDetails" style="flex:1">Details</button><button class="small" id="restWebsite" style="flex:1">Website</button></div>';
  $('restBack').onclick=()=>{if(S.restaurantIndex>0){S.restaurantIndex--;cleanDrawRestaurants();persist()}};
  $('restMaybe').onclick=()=>{const x=p[S.restaurantIndex];x._maybe=true;S.restaurantIndex=Math.min(S.restaurantIndex,p.length-1);cleanDrawRestaurants();persist()};
  $('restCut').onclick=()=>{const x=p[S.restaurantIndex];S.restaurantPool=S.restaurantPool.filter(z=>z.id!==x.id);S.restaurantIndex=Math.min(S.restaurantIndex,Math.max(0,restaurantFiltered().length-1));if(!restaurantFiltered().length){$('restStage').innerHTML='<div class="empty"><b>Hungry.</b><span>You cut the last restaurant.</span></div>'}else cleanDrawRestaurants();persist()};
  $('restHide').onclick=()=>{const x=p[S.restaurantIndex];if(confirm('Hide '+x.name+' until you restore it in Manage Foods?')){S.restaurantPool=S.restaurantPool.filter(z=>z.id!==x.id);cleanDrawRestaurants();persist()}};
  $('restDetails').onclick=()=>alert([r.name, r.address||'', r.cuisine||cat, r.phone||''].filter(Boolean).join('\n'));
  $('restWebsite').onclick=()=>{if(r.website)location.href=r.website;else alert('No website is listed for this restaurant.')};
  let sx=0,drag=false;const card=$('restaurantCard');card.onpointerdown=e=>{sx=e.clientX;drag=true;try{card.setPointerCapture(e.pointerId)}catch{}};card.onpointerup=e=>{if(!drag)return;drag=false;const dx=e.clientX-sx;if(Math.abs(dx)>90){if(dx<0)$('restCut').click();else $('restMaybe').click()}};card.onpointercancel=()=>drag=false;
}
function renderSuggestions(rows){
  let box=$('suggestionsBox');if(!box){box=document.createElement('div');box.id='suggestionsBox';$('address').insertAdjacentElement('afterend',box)}
  box.innerHTML=(rows||[]).map((x,i)=>'<button type="button" data-i="'+i+'">'+x.display.replace(/</g,'&lt;')+'</button>').join('');
  box.style.display=rows&&rows.length?'grid':'none';
  box.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{const x=rows[i];S.location={lat:x.lat,lon:x.lon,label:x.display};$('address').value=x.display;box.style.display='none';$('status').textContent='Location selected.';persist()});
}
let suggestTimer=0,suggestRows=[];
$('address').addEventListener('input',()=>{
  S.location=null;$('status').textContent='Searching addresses…';clearTimeout(suggestTimer);
  const q=$('address').value.trim();if(q.length<2){renderSuggestions([]);$('status').textContent='Enter an address or use your location.';return}
  suggestTimer=setTimeout(async()=>{try{const r=await fetch('./api/restaurants?mode=suggest&q='+encodeURIComponent(q));const d=await r.json();suggestRows=d.results||[];renderSuggestions(suggestRows);$('status').textContent=suggestRows.length?'Choose an address suggestion.':'No address suggestions yet.'}catch{renderSuggestions([]);$('status').textContent='Address lookup is temporarily unavailable.'}},280);
});
function setLocation(lat,lon,label){S.location={lat,lon,label};$('address').value=label||(''+lat+', '+lon);persist()}
async function cleanSearch(){
  let loc=S.location;
  $('status').textContent='Searching restaurants…';
  try{
    if(!loc){const q=$('address').value.trim();if(!q){$('status').textContent='Enter an address or use your location.';return}const rr=await fetch('./api/restaurants?mode=resolve&q='+encodeURIComponent(q));const dd=await rr.json();if(!rr.ok||!dd.ok)throw new Error(dd.message||'Could not locate that address.');loc={lat:dd.lat,lon:dd.lon,label:dd.display};S.location=loc;$('address').value=dd.display}
    const radius=Number($('radius').value)||10;
    const rr=await fetch('./api/restaurants?mode=search&lat='+encodeURIComponent(loc.lat)+'&lon='+encodeURIComponent(loc.lon)+'&radius='+encodeURIComponent(radius));
    const dd=await rr.json();if(!rr.ok||!dd.ok)throw new Error(dd.message||'Restaurant search failed.');
    S.restaurantPool=(dd.results||[]).map(x=>({...x,_maybe:false,category:restCategory(x)}));S.restaurantIndex=0;$('status').textContent=dd.total?((dd.total)+' restaurants found'+(dd.fastFoodCount?' · '+dd.fastFoodCount+' fast food':'')):'No restaurants found in this radius.';renderRestaurantQuickCuts();cleanDrawRestaurants();persist();
  }catch(e){S.restaurantPool=[];cleanDrawRestaurants();$('status').textContent=e.message||'Could not complete the search.'}
}
async function cleanLocate(){
  if(!navigator.geolocation){$('status').textContent='Location is not available in this browser.';return}
  $('status').textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(async p=>{try{const label=await fetch('./api/restaurants?mode=reverse&lat='+p.coords.latitude+'&lon='+p.coords.longitude).then(r=>r.json());setLocation(p.coords.latitude,p.coords.longitude,label.display||'Current location');$('status').textContent='Location ready.';await cleanSearch()}catch{$('status').textContent='Location found, but restaurant search could not start.'}},()=>{$('status').textContent='Could not access your location. Enter an address instead.'},{enableHighAccuracy:true,timeout:12000,maximumAge:60000})
}
$('find').onclick=cleanSearch;$('locate').onclick=cleanLocate;window.drawRestaurants=cleanDrawRestaurants;window.searchRestaurants=cleanSearch;renderRestaurantQuickCuts();


/* CP2 cleanup: one Quick Cut renderer + phone-sized suggestions */
const style=document.createElement('style');style.textContent='#suggestionsBox{display:none;position:absolute;left:14px;right:14px;margin-top:3px;background:#181818;border:1px solid #303030;border-radius:13px;overflow:hidden;z-index:8}#suggestionsBox button{background:#181818;color:#eee;border:0;border-bottom:1px solid #292929;text-align:left;padding:12px;font-size:12px;line-height:1.25}#suggestionsBox button:last-child{border-bottom:0}.panel{position:relative}';document.head.appendChild(style);
drawQuick=function(){ $('foodQuick').innerHTML=cats.map(c=>'<button class="chip '+(S.cutCats.has(c)?'cut':'')+'" data-c="'+c+'">'+c+'</button>').join('');document.querySelectorAll('#foodQuick .chip').forEach(b=>b.onclick=()=>{const c=b.dataset.c;S.cutCats.has(c)?S.cutCats.delete(c):S.cutCats.add(c);build();S.index=0;drawFood();drawQuick();persist()});renderRestaurantQuickCuts() };
drawQuick();


/* CP3: visual Quick Cuts + richer restaurant card */
const FOOD_CAT_IMG={
  Southern:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80',
  Pasta:'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=500&q=80',
  Asian:'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=500&q=80',
  Mexican:'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=500&q=80',
  Pork:'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=500&q=80',
  Soup:'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=500&q=80',
  Healthy:'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=500&q=80',
  Breakfast:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=80',
  American:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
  Greek:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=500&q=80',
  Snack:'https://images.unsplash.com/photo-1578849278619-7d347d3ed1f8?auto=format&fit=crop&w=500&q=80'
};
const quickButton=(label,cut,data,prefix,bg)=>'<button class="chip photo-chip '+(cut?'cut':'')+'" data-'+prefix+'="'+label.replace(/"/g,'&quot;')+'" style="background-image:linear-gradient(#0005,#0008),url("'+bg+'")"><span>'+label+'</span></button>';
function renderRestaurantQuickCuts(){
  $('restQuick').innerHTML=REST_CATS.map(c=>quickButton(c,S.restaurantCuts.has(c),null,'rq',FOOD_CAT_IMG[c]||FOOD_CAT_IMG.American)).join('');
  document.querySelectorAll('#restQuick .chip').forEach(b=>b.onclick=()=>{const c=b.dataset.rq;S.restaurantCuts.has(c)?S.restaurantCuts.delete(c):S.restaurantCuts.add(c);renderRestaurantQuickCuts();cleanDrawRestaurants();persist()});
}
drawQuick=function(){
  $('foodQuick').innerHTML=cats.map(c=>quickButton(c,S.cutCats.has(c),null,'c',FOOD_CAT_IMG[c]||FOOD_CAT_IMG.American)).join('');
  document.querySelectorAll('#foodQuick .chip').forEach(b=>b.onclick=()=>{const c=b.dataset.c;S.cutCats.has(c)?S.cutCats.delete(c):S.cutCats.add(c);build();S.index=0;drawQuick();drawFood();persist()});
  renderRestaurantQuickCuts();
};
const cp3Style=document.createElement('style');cp3Style.textContent='.photo-chip{width:76px;height:54px;min-width:76px;padding:0 7px;border-radius:14px;background-size:cover;background-position:center;display:grid;place-items:end center;overflow:hidden}.photo-chip span{font-size:11px;font-weight:700;color:#fff;text-shadow:0 1px 3px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.photo-chip.cut{filter:grayscale(.8);opacity:.62}.rest-card-extra{padding:0 15px 15px}.rest-meta{font-size:11px;color:#8c8c8c;line-height:1.45;margin-top:8px}.status-badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:#222;color:#bbb;font-size:10px}.card-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.card-actions button{min-height:44px}.mini-back{margin-top:8px;font-size:11px;color:#777;text-align:center}.result-count{margin-top:8px}';document.head.appendChild(cp3Style);
function enrichRestaurantStage(){
  const p=restaurantFiltered();if(!p.length)return;
  const r=p[Math.min(S.restaurantIndex||0,p.length-1)];const card=$('restaurantCard');if(!card)return;
  const article=card.parentElement;
  const extra=document.createElement('div');extra.className='rest-card-extra';
  const hours=String(r.opening_hours||'').trim();extra.innerHTML='<div class="rest-meta">'+(r.address?'<div>'+r.address+'</div>':'')+(r.cuisine?'<div>'+r.cuisine+'</div>':'')+'<div style="margin-top:7px"><span class="status-badge">'+(hours?'Hours listed':'Open/Unknown Hours')+'</span></div></div><div class="card-actions"><button class="small" id="restDetails2">Details</button><button class="small" id="restWebsite2">Website</button></div>';
  article.appendChild(extra);
  if($('restDetails2'))$('restDetails2').onclick=()=>alert([r.name,r.address||'',r.cuisine||restCategory(r),r.phone||'',hours?'Hours: '+hours:''].filter(Boolean).join('\\n'));
  if($('restWebsite2'))$('restWebsite2').onclick=()=>{if(r.website)window.open(r.website,'_blank','noopener');else alert('No website is listed for this restaurant.')};
}
const oldCleanDraw=cleanDrawRestaurants;
cleanDrawRestaurants=function(){oldCleanDraw();enrichRestaurantStage()};
window.drawRestaurants=cleanDrawRestaurants;
drawQuick();


/* CP4: persistence polish — Potato/Soup semantics, History, Settings */
cats.splice(Math.max(0,cats.indexOf('Soup')),1,'Soup/Stew');cats.push('Potato');
const oldBuild=build;
build=function(){
  S.pool=active().filter(x=>{
    if(S.maybe.has(x.id))return false;
    if(S.cutPrimary.has(x.primary))return false;
    if(S.cutCats.has(x.category))return false;
    if(S.cutCats.has('Soup/Stew') && (x.category==='Soup'||x.primary==='soup'||x.primary==='stew'))return false;
    if(S.cutCats.has('Potato') && x.primary==='potato')return false;
    return true;
  });
  S.index=Math.max(0,Math.min(S.index,S.pool.length-1));
};
const potato=F.find(x=>x.id==='potato-soup');if(potato)potato.primary='potato';
const HISTORY_KEY='dinliminate.clean.history',SETTINGS_KEY='dinliminate.clean.settings';
function readHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return[]}}
function writeHistory(x){localStorage.setItem(HISTORY_KEY,JSON.stringify(x.slice(0,120)))}
function recordHistory(item,type){const h=readHistory(),day=new Date().toISOString().slice(0,10);h.unshift({id:Date.now()+Math.random(),date:day,type,name:item.name,image:item.image||item.photo||''});writeHistory(h)}
const baseWinner=winner;
winner=function(x){recordHistory(x,S.screen==='restaurant'?'restaurant':'food');baseWinner(x)};
function addOverlay(id,title,body){
  let bg=$(id+'Bg');if(bg)return;
  bg=document.createElement('div');bg.id=id+'Bg';bg.className='modal-bg hidden';document.body.appendChild(bg);
  const m=document.createElement('section');m.id=id;m.className='modal hidden';m.innerHTML='<div class="modal-head"><h3>'+title+'</h3><button class="menu" data-close="'+id+'">×</button></div><div id="'+id+'Body">'+body+'</div>';document.body.appendChild(m);
  bg.onclick=()=>{m.classList.add('hidden');bg.classList.add('hidden')};m.querySelector('[data-close]').onclick=()=>{m.classList.add('hidden');bg.classList.add('hidden')};
  return m;
}
function showOverlay(id){$(id).classList.remove('hidden');$(id+'Bg').classList.remove('hidden')}
function historyView(){
  const h=readHistory(),today=new Date(),y=today.getFullYear(),mo=today.getMonth(),last=new Date(y,mo+1,0).getDate(),first=new Date(y,mo,1).getDay();
  let html='<div class="calendar"><div class="cal-head"><b>'+today.toLocaleString(undefined,{month:'long',year:'numeric'})+'</b></div><div class="cal-grid">';
  ['S','M','T','W','T','F','S'].forEach(d=>html+='<span class="cal-d">'+d+'</span>');
  for(let i=0;i<first;i++)html+='<span></span>';
  for(let d=1;d<=last;d++){const key=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),entry=h.find(x=>x.date===key);html+='<button class="cal-day '+(entry?'has':'')+'" data-date="'+key+'"><b>'+d+'</b>'+(entry?'<img src="'+entry.image+'" alt="">':'')+'</button>'}
  html+='</div></div><div class="history-list">'+(h.length?h.slice(0,20).map(x=>'<div class="history-row"><img src="'+x.image+'" alt=""><div><b>'+x.name+'</b><small>'+x.date+' · '+x.type+'</small></div></div>').join(''):'<p class="status">No history yet.</p>')+'</div>';
  const m=addOverlay('historyModal','History',html);showOverlay('historyModal');
  m.querySelectorAll('.cal-day.has').forEach(b=>b.onclick=()=>{const e=h.find(x=>x.date===b.dataset.date);if(e)alert(e.name+'\\n'+e.date)});
}
function settingsView(){
  const all=[...F,...S.custom],hidden=all.filter(x=>S.hidden.has(x.id));
  const body='<div class="settings-stack"><h4>Hidden Choices</h4><div id="hiddenRows">'+(hidden.length?hidden.map(x=>'<div class="food-row"><span>'+x.name+'</span><button class="restore" data-restore="'+x.id+'">Restore</button></div>').join(''):'<p class="status">Nothing hidden.</p>')+'</div><h4>System</h4><button class="secondary" id="systemRestore" style="width:100%;min-height:46px;border-radius:13px">System Restore</button><p class="status">Restores the clean default food list and clears saved round changes.</p></div>';
  const m=addOverlay('settingsModal','Settings',body);showOverlay('settingsModal');
  m.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{S.hidden.delete(b.dataset.restore);persist();settingsView()});
  m.querySelector('#systemRestore').onclick=()=>{if(confirm('Restore the default Dinliminate setup and clear this saved round?')){S.hidden.clear();S.custom=[];S.cutCats.clear();S.cutPrimary.clear();S.maybe.clear();S.pool=[];S.index=0;localStorage.removeItem(KEY);persist();settingsView();home()}};
}
$('settings').onclick=()=>{openDrawer(false);settingsView()};
const historyButton=document.createElement('button');historyButton.className='drawer-row';historyButton.id='historyDynamic';historyButton.innerHTML='History <span>›</span>';$('settings').insertAdjacentElement('beforebegin',historyButton);historyButton.onclick=()=>{openDrawer(false);historyView()};
$('details').onclick=()=>alert('Details will use the saved item record in the next cleanup pass.');
const cp4=document.createElement('style');cp4.textContent='.calendar{margin-bottom:15px}.cal-head{padding:4px 0 12px;color:#eee}.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.cal-d{font-size:9px;color:#666;text-align:center;padding:3px}.cal-day{position:relative;min-height:47px;border-radius:9px;background:#1b1b1b;color:#ddd;text-align:left;padding:5px;border:1px solid #282828;overflow:hidden}.cal-day.has{border-color:#555}.cal-day b{position:relative;z-index:2;font-size:10px}.cal-day img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5}.cal-day img~b{color:#fff;text-shadow:0 1px 3px #000}.history-row{display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:center;border-top:1px solid #292929;padding:9px 0}.history-row img{width:48px;height:48px;object-fit:cover;border-radius:10px}.history-row b{display:block;font-size:13px}.history-row small{display:block;color:#666;margin-top:2px}.settings-stack h4{margin:16px 0 7px;color:#aaa;font-size:11px;text-transform:uppercase;letter-spacing:.1em}';document.head.appendChild(cp4);


/* CP5: unified decision history + real Back undo + restaurant winner */
S.foodActions=S.foodActions||[];S.restaurantActions=S.restaurantActions||[];S.restaurantIndex=Number(S.restaurantIndex)||0;
function foodBackUndo(){
  const a=S.foodActions.pop();
  if(!a){home();return}
  if(a.type==='cut' && !a.primaryAlready){S.cutPrimary.delete(a.primary)}
  if(a.type==='maybe')S.maybe.delete(a.id)
  S.index=Math.max(0,Number(a.index)||0);build();drawQuick();drawFood();persist();
}
function applyFoodCut(){
  const x=S.pool[S.index];if(!x)return;
  const had=S.cutPrimary.has(x.primary);S.foodActions.push({type:'cut',id:x.id,primary:x.primary,primaryAlready:had,index:S.index});
  S.cutPrimary.add(x.primary);build();
  if(S.pool.length===0){winner({name:'Nothing left — hungry mode',image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85'})}
  else if(S.pool.length===1){winner(S.pool[0])}
  else {S.index=Math.min(S.index,S.pool.length-1);drawFood()}
  persist();
}
function applyFoodMaybe(){
  const x=S.pool[S.index];if(!x)return;
  S.foodActions.push({type:'maybe',id:x.id,index:S.index});S.maybe.add(x.id);build();
  if(S.pool.length===0){winner({name:'Nothing left — hungry mode',image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85'})}
  else if(S.pool.length===1){winner(S.pool[0])}
  else {S.index=Math.min(S.index,S.pool.length-1);drawFood()}
  persist();
}
$('foodCut').onclick=applyFoodCut;$('foodMaybe').onclick=applyFoodMaybe;$('foodBack').onclick=foodBackUndo;
function restRestoreForBack(a){
  const row=(S.restaurantPool||[]).find(x=>x.id===a.id);if(!row)return;
  if(a.type==='cut')row._cut=false;
  if(a.type==='maybe')row._maybe=false;
}
function restaurantBackUndo(){
  const a=S.restaurantActions.pop();
  if(!a){home();return}
  restRestoreForBack(a);S.restaurantIndex=Math.max(0,Number(a.index)||0);cleanDrawRestaurants();persist();
}
function restGoWinner(p){
  if(p.length!==1)return false;
  const r=p[0];if(S.lastRestaurantWinner===r.id)return true;
  S.lastRestaurantWinner=r.id;winner({...r,image:r.photo||r.image});persist();return true;
}
function cleanDrawRestaurants(){
  const p=restaurantFiltered().filter(r=>!r._cut);
  if(!p.length){$('restStage').innerHTML='<div class="empty"><b>Hungry.</b><span>No restaurants remain with these choices.</span></div>';return}
  if(restGoWinner(p))return;
  S.restaurantIndex=Math.max(0,Math.min(S.restaurantIndex,p.length-1));
  const r=p[S.restaurantIndex],cat=restCategory(r);
  $('restStage').innerHTML='<article class="card" id="restaurantCard"><img src="'+(r.photo||r.image||'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85')+'" alt="'+r.name.replace(/"/g,'&quot;')+'"><div class="shade"></div><div class="card-copy"><small>'+cat+' · '+(Number.isFinite(Number(r.distance))?Number(r.distance).toFixed(1)+' mi':'')+'</small><h3>'+r.name+'</h3></div></article><div class="result-count" style="position:relative;margin-top:8px;text-align:center;color:#666;font-size:11px">'+p.length+' restaurants</div><div class="actions" style="width:100%"><button class="secondary" id="restBack">Back</button><button class="maybe" id="restMaybe">Maybe</button><button class="cut" id="restCut">Cut</button><button class="secondary" id="restHide">Hide</button></div><div class="card-links" style="display:flex;gap:8px;margin-top:8px"><button class="small" id="restDetails" style="flex:1">Details</button><button class="small" id="restWebsite" style="flex:1">Website</button></div>';
  $('restBack').onclick=restaurantBackUndo;
  $('restMaybe').onclick=()=>{S.restaurantActions.push({type:'maybe',id:r.id,index:S.restaurantIndex});r._maybe=true;cleanDrawRestaurants();persist()};
  $('restCut').onclick=()=>{S.restaurantActions.push({type:'cut',id:r.id,index:S.restaurantIndex});r._cut=true;S.restaurantIndex=Math.min(S.restaurantIndex,Math.max(0,restaurantFiltered().filter(x=>!x._cut).length-1));cleanDrawRestaurants();persist()};
  $('restHide').onclick=()=>{if(confirm('Hide '+r.name+' until you restore it in Settings?')){S.hidden.add('restaurant:'+r.id);r._hidden=true;r._cut=true;cleanDrawRestaurants();persist()}};
  $('restDetails').onclick=()=>alert([r.name,r.address||'',r.cuisine||cat,r.phone||'',r.opening_hours?'Hours: '+r.opening_hours:''].filter(Boolean).join('\\n'));
  $('restWebsite').onclick=()=>{if(r.website)window.open(r.website,'_blank','noopener');else alert('No website is listed for this restaurant.')};
  let sx=0,drag=false;const card=$('restaurantCard');card.onpointerdown=e=>{sx=e.clientX;drag=true;try{card.setPointerCapture(e.pointerId)}catch{}};card.onpointerup=e=>{if(!drag)return;drag=false;const dx=e.clientX-sx;if(Math.abs(dx)>90){if(dx<0)$('restCut').click();else $('restMaybe').click()}};card.onpointercancel=()=>drag=false;
  enrichRestaurantStage();
}
function restaurantFiltered(){return (S.restaurantPool||[]).filter(r=>!S.restaurantCuts.has(restCategory(r))&&!r._maybe&&!r._cut&&!r._hidden)}
const oldStartFood=startFood;
startFood=function(){S.foodActions=[];S.screen='food';S.maybe.clear();S.cutCats.clear();S.cutPrimary.clear();S.index=0;build();drawQuick();show('food');drawFood();persist()};
$('restStart').onclick=()=>{S.screen='restaurant';S.restaurantActions=[];S.lastRestaurantWinner=null;show('restaurant');drawQuick();renderRestaurantQuickCuts()};
const oldContinue=$('continue').onclick;
$('continue').onclick=()=>{if(!hydrate())return startFood();S.saved=true;if(S.screen==='food'){show('food');drawQuick();drawFood()}else if(S.screen==='restaurant'){show('restaurant');drawQuick();renderRestaurantQuickCuts();cleanDrawRestaurants()}else startFood()};


/* CP6: restaurant hours filter + real Details sheet */
S.hoursMode=S.hoursMode||'openUnknown';
function explicitClosed(r){
  const h=String(r?.opening_hours||'').trim().toLowerCase();
  return h==='closed'||h==='off'||h==='24/7'&&false||/\boff\b/.test(h);
}
function hourMatches(r){return S.hoursMode==='closed'?explicitClosed(r):!explicitClosed(r)}
const prevRestaurantFiltered=restaurantFiltered;
restaurantFiltered=function(){return (S.restaurantPool||[]).filter(r=>!S.restaurantCuts.has(restCategory(r))&&!r._maybe&&!r._cut&&!r._hidden&&hourMatches(r))};
function detailsSheet(r){
  const body='<div class="detail-grid"><div class="detail-hero"><img src="'+(r.photo||r.image||'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85')+'" alt="'+r.name.replace(/"/g,'&quot;')+'"></div><h2 style="margin:12px 0 4px;font-size:29px;letter-spacing:-.04em">'+r.name+'</h2><p class="status">'+(r.address||'Address not listed')+'</p><p class="status">'+(r.cuisine||restCategory(r))+'</p><p class="status">'+(r.opening_hours?'Hours: '+r.opening_hours:'Open/Unknown Hours')+'</p>'+(r.phone?'<p class="status">Phone: '+r.phone+'</p>':'')+((r.menuItems||[]).length?'<div class="panel" style="margin-top:12px"><b style="font-size:12px">Common menu items</b><p class="status">'+r.menuItems.slice(0,8).join(' · ')+'</p></div>':'')+'<div class="winner-actions" style="margin-top:12px"><button class="small" id="detailClose2">Close</button>'+(r.website?'<button class="cut" id="detailWeb2">Website</button>':'')+'</div></div>';
  const m=addOverlay('restaurantDetails','Details',body);showOverlay('restaurantDetails');
  if($('detailClose2'))$('detailClose2').onclick=()=>{$('restaurantDetails').classList.add('hidden');$('restaurantDetailsBg').classList.add('hidden')};
  if($('detailWeb2'))$('detailWeb2').onclick=()=>window.open(r.website,'_blank','noopener');
}
function injectHoursControl(){
  let b=$('hoursToggle');if(b)return;
  b=document.createElement('button');b.id='hoursToggle';b.className='small';b.style.cssText='width:100%;margin-top:8px';$('status').insertAdjacentElement('afterend',b);
  b.onclick=()=>{S.hoursMode=S.hoursMode==='openUnknown'?'closed':'openUnknown';renderHoursControl();cleanDrawRestaurants();persist()};
  renderHoursControl();
}
function renderHoursControl(){const b=$('hoursToggle');if(b)b.textContent=S.hoursMode==='openUnknown'?'Open/Unknown Hours':'Closed';}
const cp6style=document.createElement('style');cp6style.textContent='.detail-hero img{width:100%;aspect-ratio:1.5;object-fit:cover;border-radius:16px}.detail-grid p{margin:6px 0}.detail-grid .panel{background:#1a1a1a}';document.head.appendChild(cp6style);
const previousRestStart=$('restStart').onclick;
$('restStart').onclick=()=>{S.screen='restaurant';S.restaurantActions=[];S.lastRestaurantWinner=null;show('restaurant');drawQuick();renderRestaurantQuickCuts();injectHoursControl()};
injectHoursControl();
const oldCleanSearch2=cleanSearch;
cleanSearch=async function(){S.lastRestaurantWinner=null;await oldCleanSearch2();injectHoursControl();renderHoursControl()};
const currentCore=cleanDrawRestaurants;
cleanDrawRestaurants=function(){currentCore();const p=restaurantFiltered();if(p.length&&$('restDetails')){$('restDetails').onclick=()=>detailsSheet(p[Math.min(S.restaurantIndex,p.length-1)])}};
window.drawRestaurants=cleanDrawRestaurants;


/* CP7: winner detail data + duplicate card cleanup */
const priorWinner=winner;
winner=function(x){S.winnerItem=x;priorWinner(x)};
$('details').onclick=()=>{if(S.winnerItem&&S.screen==='winner'&&S.winnerItem.name&&!/^Nothing left/.test(S.winnerItem.name))detailsSheet(S.winnerItem);else alert('No additional details are available for this result.')};
const latestDraw=cleanDrawRestaurants;
cleanDrawRestaurants=function(){latestDraw();const extras=document.querySelectorAll('#restaurantCard .rest-card-extra');extras.forEach((el,i)=>{if(i>0)el.remove()});const p=restaurantFiltered();if(p.length&&$('restDetails'))$('restDetails').onclick=()=>detailsSheet(p[Math.min(S.restaurantIndex,p.length-1)])};
window.drawRestaurants=cleanDrawRestaurants;
const cp7=document.createElement('style');cp7.textContent='.rest-card-extra .rest-card-extra{display:none}';document.head.appendChild(cp7);


/* CP11: persistent restaurant Hide + Settings restore + remove redundant count */
const previousSearch2=cleanSearch;
cleanSearch=async function(){
  S.lastRestaurantWinner=null;
  await previousSearch2();
  S.restaurantPool=(S.restaurantPool||[]).map(r=>({...r,_hidden:S.hidden.has('restaurant:'+r.id)}));
  cleanDrawRestaurants();
  injectHoursControl();renderHoursControl();persist();
};
const previousSettings=settingsView;
settingsView=function(){
  const all=[...F,...S.custom],hiddenFoods=all.filter(x=>S.hidden.has(x.id)),hiddenRestaurants=(S.restaurantPool||[]).filter(x=>S.hidden.has('restaurant:'+x.id));
  const body='<div class="settings-stack"><h4>Hidden Choices</h4><div id="hiddenRows">'+(hiddenFoods.length?hiddenFoods.map(x=>'<div class="food-row"><span>'+x.name+'</span><button class="restore" data-restore="'+x.id+'">Restore</button></div>').join(''):'<p class="status">No hidden foods.</p>')+'</div><h4>Hidden Restaurants</h4><div id="hiddenRestaurantRows">'+(hiddenRestaurants.length?hiddenRestaurants.map(x=>'<div class="food-row"><span>'+x.name+'</span><button class="restore" data-rrest="'+x.id+'">Restore</button></div>').join(''):'<p class="status">No hidden restaurants in this saved search.</p>')+'</div><h4>System</h4><button class="secondary" id="systemRestore" style="width:100%;min-height:46px;border-radius:13px">System Restore</button><p class="status">Restores the clean default food list and clears saved round changes.</p></div>';
  const m=addOverlay('settingsModal','Settings',body);showOverlay('settingsModal');
  m.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{S.hidden.delete(b.dataset.restore);persist();settingsView()});
  m.querySelectorAll('[data-rrest]').forEach(b=>b.onclick=()=>{const key='restaurant:'+b.dataset.rrest;S.hidden.delete(key);const r=(S.restaurantPool||[]).find(x=>x.id===b.dataset.rrest);if(r)r._hidden=false;persist();settingsView()});
  m.querySelector('#systemRestore').onclick=()=>{if(confirm('Restore the default Dinliminate setup and clear this saved round?')){S.hidden.clear();S.custom=[];S.cutCats.clear();S.cutPrimary.clear();S.maybe.clear();S.pool=[];S.restaurantPool=[];S.restaurantCuts.clear();S.restaurantActions=[];S.index=0;S.restaurantIndex=0;localStorage.removeItem(KEY);persist();settingsView();home()}};
};
const cleanSearchOrig=searchRestaurants;
const latestCoreDraw=cleanDrawRestaurants;
cleanDrawRestaurants=function(){
  latestCoreDraw();
  const extras=document.querySelectorAll('#restaurantCard .rest-card-extra');extras.forEach((el,i)=>{if(i>0)el.remove()});
  document.querySelectorAll('#restaurantCard + .result-count').forEach(el=>el.remove());
};
window.drawRestaurants=cleanDrawRestaurants;
const oldPersist=persist;
persist=function(){if(Array.isArray(S.restaurantPool))S.restaurantPool=S.restaurantPool.map(r=>r&&r.id?{...r,_hidden:S.hidden.has('restaurant:'+r.id)||!!r._hidden}:r);oldPersist()};


/* CP12: deterministic overlay lifecycle */
addOverlay=function(id,title,body){
  $(id)?.remove();$(id+'Bg')?.remove();
  const bg=document.createElement('div');bg.id=id+'Bg';bg.className='modal-bg hidden';document.body.appendChild(bg);
  const m=document.createElement('section');m.id=id;m.className='modal hidden';m.innerHTML='<div class="modal-head"><h3>'+title+'</h3><button class="menu" data-close="'+id+'">×</button></div><div id="'+id+'Body">'+body+'</div>';document.body.appendChild(m);
  bg.onclick=()=>{m.classList.add('hidden');bg.classList.add('hidden')};m.querySelector('[data-close]').onclick=()=>{m.classList.add('hidden');bg.classList.add('hidden')};
  return m;
};
const cp12=document.createElement('style');cp12.textContent='button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #ff7a1a;outline-offset:2px}.modal{scrollbar-width:thin}';document.head.appendChild(cp12);



const cleanRandom=document.createElement('style');cleanRandom.textContent='.round-tools{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:8px}.round-tools .text-btn{font-size:11px;color:#999}.round-tools .tiny{font-size:9px}';document.head.appendChild(cleanRandom);
$('addFood').onclick=()=>openModal(true);
$('randomOne').onclick=()=>{
 const candidates=S.pool.filter(Boolean);if(candidates.length<2)return;
 const pick=candidates[Math.floor(Math.random()*candidates.length)];
 const had=S.cutPrimary.has(pick.primary);
 S.foodActions.push({type:'cut',id:pick.id,primary:pick.primary,primaryAlready:had,index:S.index});
 S.cutPrimary.add(pick.primary);build();
 if(S.pool.length===1)winner(S.pool[0]);else if(S.pool.length===0)winner({name:'Nothing left — hungry mode',image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85'});else{S.index=Math.min(S.index,S.pool.length-1);drawFood()}
 persist();
};


/* CP15: clean Pass Around social voting */
const PASS_KEY='dinliminate.clean.pass';
S.pass=null;
function currentPassPool(){
  return S.screen==='restaurant'?restaurantFiltered():S.pool;
}
function passCandidates(){
  const p=currentPassPool()||[];
  return p.filter(Boolean);
}
function passSetup(){
  const countOptions=[2,3,4,5,6,7,8];
  const body='<div class="pass-setup"><p class="status">Each person gets a turn on every choice. One Cut removes the choice; only choices everyone keeps survive the pass.</p><label class="pass-label">People</label><div class="pass-counts">'+countOptions.map(n=>'<button class="chip pass-count '+(S.passDraftCount===n?'selected':'')+'" data-pc="'+n+'">'+n+'</button>').join('')+'</div><div id="passNames"></div><button class="cut" id="passBegin" style="width:100%;margin-top:12px;min-height:48px;border-radius:14px">Start Pass Around</button></div>';
  const m=addOverlay('passSetup','Pass Around',body);showOverlay('passSetup');
  S.passDraftCount=S.passDraftCount||2;
  const renderNames=()=>{const n=S.passDraftCount||2;$('passNames').innerHTML='<div class="pass-name-grid">'+Array.from({length:n},(_,i)=>'<input class="pass-name" data-pn="'+i+'" placeholder="Person '+(i+1)+'" maxlength="24">').join('')+'</div>';document.querySelectorAll('.pass-count').forEach(b=>b.classList.toggle('selected',Number(b.dataset.pc)===n));document.querySelectorAll('.pass-name').forEach((x,i)=>x.value=(S.passDraftNames||[])[i]||'')};
  renderNames();
  document.querySelectorAll('.pass-count').forEach(b=>b.onclick=()=>{S.passDraftCount=Number(b.dataset.pc);renderNames()});
  $('passBegin').onclick=()=>{S.passDraftNames=[...document.querySelectorAll('.pass-name')].map((x,i)=>x.value.trim()||'Person '+(i+1));startPass()};
}
function startPass(){
  const pool=passCandidates();if(pool.length<1){alert('There are no choices left to pass around.');return}
  S.pass={type:S.screen==='restaurant'?'restaurant':'food',players:S.passDraftNames||['Person 1','Person 2'],choiceIndex:0,voterIndex:0,decisions:[],history:[],poolIds:pool.map(x=>x.id)};
  $('passSetup').classList.add('hidden');$('passSetupBg').classList.add('hidden');drawPass();
}
function passItem(){const id=S.pass?.poolIds?.[S.pass.choiceIndex];return passCandidates().find(x=>x.id===id)}
function drawPass(){
  const p=S.pass;if(!p)return;
  if(p.choiceIndex>=p.poolIds.length){endPassWinner();return}
  const item=passItem();if(!item){p.choiceIndex++;p.voterIndex=0;return drawPass()}
  let m=$('passModal');if(!m){m=addOverlay('passModal','Pass Around','');}
  showOverlay('passModal');
  const voter=p.players[p.voterIndex]||('Person '+(p.voterIndex+1));
  const voterNo=p.voterIndex+1;
  const body='<div class="pass-view"><div class="pass-progress"><span>Choice '+(p.choiceIndex+1)+' of '+p.poolIds.length+'</span><span>'+voterNo+' / '+p.players.length+'</span></div><img class="pass-photo" src="'+(item.image||item.photo||'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80')+'" alt="'+item.name.replace(/"/g,'&quot;')+'"><h2>'+item.name+'</h2><p class="status">Pass to <strong style="color:#eee">'+voter+'</strong>. Keep or cut this choice.</p><div class="pass-actions"><button class="secondary" id="passBack">Back</button><button class="maybe" id="passKeep">Keep</button><button class="cut" id="passCut">Cut</button></div><button class="text-btn" id="passEnd">End Pass & keep survivors</button></div>';
  m.innerHTML='<div class="modal-head"><h3>Pass Around</h3><button class="menu" id="passClose">×</button></div>'+body;
  $('passClose').onclick=()=>endPass(false);
  $('passEnd').onclick=()=>endPass(false);
  $('passCut').onclick=()=>passVote(false);
  $('passKeep').onclick=()=>passVote(true);
  $('passBack').onclick=passUndo;
}
function passVote(keep){
  const p=S.pass;if(!p)return;const item=passItem();if(!item)return;
  p.history.push({choiceIndex:p.choiceIndex,voterIndex:p.voterIndex,decisionCount:p.decisions.length});
  p.decisions.push({choiceId:item.id,voter:p.voterIndex,keep});
  if(!keep){p.poolIds=p.poolIds.filter(id=>id!==item.id);if(p.poolIds.length===1){endPassWinner();return}p.choiceIndex=Math.min(p.choiceIndex,p.poolIds.length-1);p.voterIndex=0;drawPass();return}
  if(p.voterIndex<p.players.length-1){p.voterIndex++;drawPass();return}
  p.choiceIndex++;
  p.voterIndex=0;
  if(p.poolIds.length===1){endPassWinner();return}
  drawPass();
}
function passUndo(){
  const p=S.pass;if(!p||!p.history.length)return;
  const h=p.history.pop();const d=p.decisions[h.decisionCount];
  if(d&&!d.keep&&!p.poolIds.includes(d.choiceId)){
    const insertAt=Math.min(h.choiceIndex,p.poolIds.length);p.poolIds.splice(insertAt,0,d.choiceId);
  }
  p.choiceIndex=h.choiceIndex;p.voterIndex=h.voterIndex;p.decisions=p.decisions.slice(0,h.decisionCount);drawPass();
}
function endPassWinner(){
  const p=S.pass;if(!p)return;const rows=p.poolIds.map(id=>passCandidates().find(x=>x.id===id)).filter(Boolean);
  S.pass=null;
  $('passModal')?.classList.add('hidden');$('passModalBg')?.classList.add('hidden');
  if(rows.length===1){winner({...rows[0],image:rows[0].image||rows[0].photo});return}
  if(!rows.length){winner({name:'Nothing left — hungry mode',image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85'});return}
  if(S.screen==='restaurant'){S.restaurantPool=S.restaurantPool.filter(r=>rows.some(x=>x.id===r.id));S.restaurantIndex=0;cleanDrawRestaurants()}else{S.pool=rows;S.index=0;drawFood()}
  persist();
}
function endPass(reopen=false){const p=S.pass;if(!p)return;const rows=p.poolIds.map(id=>passCandidates().find(x=>x.id===id)).filter(Boolean);S.pass=null;$('passModal')?.classList.add('hidden');$('passModalBg')?.classList.add('hidden');if(S.screen==='restaurant'){S.restaurantPool=S.restaurantPool.filter(r=>rows.some(x=>x.id===r.id));S.restaurantIndex=0;cleanDrawRestaurants()}else{S.pool=rows;S.index=0;drawFood()}persist()}
$('foodPassAround').onclick=passSetup;
$('restaurantPassAround').onclick=passSetup;


const previousUpdateContinue=updateContinue;
updateContinue=function(){
 const hasFood=Array.isArray(S.pool)&&S.pool.length>0;
 const hasRest=Array.isArray(S.restaurantPool)&&S.restaurantPool.length>0;
 $('continue').classList.toggle('hidden',!S.saved||(!hasFood&&!hasRest));
 if(hasFood||hasRest)$('continue').textContent='Continue saved round';
};
const previousRestEnter=$('restStart').onclick;
$('restStart').onclick=()=>{S.screen='restaurant';S.restaurantActions=[];S.lastRestaurantWinner=null;S.saved=true;show('restaurant');drawQuick();renderRestaurantQuickCuts();injectHoursControl();updateContinue();persist()};
const originalWinnerForSave=S.winnerItem;
