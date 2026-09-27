/* Dinliminate P636 FINAL — launch interaction layer. */
(function(){
  'use strict';
  const VERSION='p648-passaround-click-fix';
  const $=id=>document.getElementById(id);
  const html=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const foodKey=x=>`food::${String(x?.id||x?.name||'').trim().toLowerCase()}`;
  const restKey=x=>`restaurant::${String(x?.id||x?.name||'').trim().toLowerCase()}`;
  const uniq=(arr,keyFn)=>{const m=new Map();for(const x of arr||[]){if(!x)continue;const k=keyFn(x);if(!m.has(k))m.set(k,x);}return [...m.values()];};

  const FOOD_ROUND_KEY='dinliminateFoodRound';
  const FOOD_ROUND_MAX_AGE=7*24*60*60*1000;
  const RESTAURANT_ROUND_KEY='dinliminateRestaurantRound';
  const RESTAURANT_ROUND_MAX_AGE=7*24*60*60*1000;
  async function idbGet(key,store='records'){try{const db=await openDinliminateIDB?.();if(!db)return null;return await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const req=tx.objectStore(store).get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=reject;});}catch{return null;}}
  function roundSnapshot(){return {version:VERSION,savedAt:Date.now(),base:foodBase,active:activeItems||[],holding:holdingItems||[],finalist:!!finalistMode,originalCount,searchQuery:String(searchQuery||''),quick:[...foodQuickHidden],manual:[...foodManual]};}
  function saveFoodRoundState(){if(!foodInProgress){safeWrite(FOOD_ROUND_KEY,'');idbDelete?.('foodRound');return;}const state=roundSnapshot();safeWrite(FOOD_ROUND_KEY,JSON.stringify(state));idbPut?.('foodRound',state);}
  async function hydrateFoodRound(){
    let state=null;
    try{const raw=safeRead(FOOD_ROUND_KEY,'');if(raw)state=JSON.parse(raw);}catch{}
    if(!state){const row=await idbGet('foodRound');state=row?.value||null;if(state)safeWrite(FOOD_ROUND_KEY,JSON.stringify(state));}
    if(!state || !['p633','p634','p636-launch','p636-final','p636-clean-final','p648-passaround-click-fix'].includes(state.version) || !Number.isFinite(state.savedAt) || Date.now()-state.savedAt>FOOD_ROUND_MAX_AGE || !Array.isArray(state.base) || state.base.length<2)return false;
    foodBase=uniq(state.base,foodKey);activeItems=uniq(state.active||[],foodKey);holdingItems=uniq(state.holding||[],foodKey);foodManual=new Set(Array.isArray(state.manual)?state.manual:[]);foodQuickHidden=new Set(Array.isArray(state.quick)?state.quick:[]);foodInProgress=true;finalistMode=!!state.finalist;originalCount=Number(state.originalCount)||foodBase.length;searchQuery=String(state.searchQuery||'');
    return true;
  }

  let foodBase=[], foodManual=new Set(), foodQuickHidden=new Set(), foodInProgress=false;
  let foodHydrationDone=false;
  let foodHydrationPromise=Promise.resolve(false);
  let restaurantBase=[], restaurantManual=new Set();
  let restaurantRoundInProgress=false;
  let restaurantHydrationDone=false;
  let restaurantHydrationPromise=Promise.resolve(false);
  const PASS_STATE_KEY='dinliminatePassAroundState';
  let pass=null;
  function serializePassState(){if(!pass)return null;return {mode:pass.mode,count:pass.count,current:pass.current,pool:pass.pool,snapshot:pass.snapshot,votes:(pass.votes||[]).map(m=>[...m.entries()]),activeFood:[...(activeItems||[])],holdingFood:[...(holdingItems||[])],activeRestaurants:[...(activeRestaurants||[])],holdingRestaurants:[...(holdingRestaurants||[]) ]};}
  function savePassState(){try{if(pass)safeWrite(PASS_STATE_KEY,JSON.stringify(serializePassState()));else localStorage.removeItem(PASS_STATE_KEY);}catch{}}
  function clearPassState(){try{localStorage.removeItem(PASS_STATE_KEY);}catch{}}
  function restorePassState(){let s=null;try{const raw=safeRead(PASS_STATE_KEY,'');if(raw)s=JSON.parse(raw);}catch{} if(!s||!Array.isArray(s.pool)||s.pool.length<2||!Number.isFinite(Number(s.count))||!Number.isFinite(Number(s.current))||!['food','restaurant'].includes(s.mode))return false;
    pass={mode:s.mode,count:Number(s.count),current:Number(s.current),pool:s.pool,snapshot:s.snapshot||{},votes:Array.from({length:Number(s.count)},(_,i)=>new Map(Array.isArray(s.votes?.[i])?s.votes[i]:[]))};
    if(pass.mode==='food'){activeItems=uniq(s.activeFood||s.pool,foodKey);holdingItems=uniq(s.holdingFood||[],foodKey);foodInProgress=true;foodShowUI(null);renderStage();}
    else{activeRestaurants=uniq(s.activeRestaurants||s.pool,restKey);holdingRestaurants=uniq(s.holdingRestaurants||[],restKey);restaurantRoundInProgress=true;showRestaurantUIForPass();renderRestaurantStage();}
    renderPassStatus();toast(`Pass Around restored · Person ${pass.current} of ${pass.count}.`);return true;}
  let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let legacyShowGame,legacyResetList,legacyRenderStage,legacyUndo,legacyCut,legacyHold,legacyShowRestaurant,legacyApplyRestaurant,legacyRenderRestaurant,legacyRestaurantCut,legacyRestaurantKeep,legacyRestaurantUndo,legacyRenderLibrary,legacyShowWinner;

  function restaurantRoundSnapshot(){
    return {version:VERSION,savedAt:Date.now(),items:uniq([...(restaurantItems||[]),...(activeRestaurants||[]),...(holdingRestaurants||[])],restKey),active:[...(activeRestaurants||[])],holding:[...(holdingRestaurants||[])],finalist:!!restaurantFinalistMode,exhausted:!!restaurantEliminationExhausted,quick:[...(restaurantQuickCuts||new Set())],filters:{...(restaurantFilters||{}),query:String(restaurantFilters?.query||'')},radius:Number(restaurantRadiusMiles)||10,locationMode:restaurantLocationMode,area:restaurantAreaCoords,userCity:String(userCity||'')};
  }
  function saveRestaurantRoundState(){
    if(!restaurantRoundInProgress||!(restaurantItems||[]).length){try{localStorage.removeItem(RESTAURANT_ROUND_KEY);}catch{};return;}
    try{safeWrite(RESTAURANT_ROUND_KEY,JSON.stringify(restaurantRoundSnapshot()));}catch{}
  }
  function clearRestaurantRoundState(){restaurantRoundInProgress=false;try{localStorage.removeItem(RESTAURANT_ROUND_KEY);}catch{};}
  async function hydrateRestaurantRound(){
    let state=null;try{const raw=safeRead(RESTAURANT_ROUND_KEY,'');if(raw)state=JSON.parse(raw);}catch{}
    if(!state||!['p633','p634','p636-launch','p636-final','p636-clean-final'].includes(state.version)||!Number.isFinite(state.savedAt)||Date.now()-state.savedAt>RESTAURANT_ROUND_MAX_AGE||!Array.isArray(state.items)||!state.items.length)return false;
    restaurantItems=uniq(state.items,restKey);activeRestaurants=uniq(state.active||[],restKey);holdingRestaurants=uniq(state.holding||[],restKey);restaurantFinalistMode=!!state.finalist;restaurantEliminationExhausted=!!state.exhausted;restaurantQuickCuts=new Set(Array.isArray(state.quick)?state.quick:[]);restaurantFilters={query:String(state.filters?.query||''),sort:state.filters?.sort==='closest'?'closest':'shuffle'};restaurantRadiusMiles=Math.min(RESTAURANT_MAX_MILES,Math.max(1,Number(state.radius)||10));restaurantLocationMode=state.locationMode==='device'?'device':'area';restaurantAreaCoords=state.area&&Number.isFinite(Number(state.area.lat))&&Number.isFinite(Number(state.area.lon))?state.area:null;userCity=String(state.userCity||'');restaurantBase=uniq([...(restaurantItems||[]),...(activeRestaurants||[]),...(holdingRestaurants||[])],restKey);restaurantManual=new Set();restaurantRoundInProgress=true;return !!activeRestaurants.length||!!holdingRestaurants.length;
  }
  function foodQuickMatch(item,k){return typeof quickCutMatches==='function'&&QUICK_CUT_RULES?.[k]&&quickCutMatches(item,QUICK_CUT_RULES[k]);}
  function restQuickMatch(item,k){return typeof restaurantQuickCutMatches==='function'&&restaurantQuickCutMatches(item,k);}
  function addFoodBase(){for(const x of [...(activeItems||[]),...(holdingItems||[])])if(x&&!foodBase.some(y=>foodKey(y)===foodKey(x)))foodBase.push(x);}
  function foodVisible(){const held=new Set((holdingItems||[]).map(foodKey));return foodBase.filter(x=>!foodManual.has(foodKey(x))&&!held.has(foodKey(x))&&!Array.from(foodQuickHidden).some(k=>foodQuickMatch(x,k)));}
  function recomputeFoodManual(){const present=new Set([...(activeItems||[]),...(holdingItems||[])].map(foodKey));foodManual=new Set(foodBase.filter(x=>!present.has(foodKey(x))&&!Array.from(foodQuickHidden).some(k=>foodQuickMatch(x,k))).map(foodKey));}

  function renderFoodQuickCuts(){
    const host=$('quickCutsBar'); if(!host)return;
    const title=host.closest('.quick-cuts-panel')?.querySelector('.quick-cuts-title');
    if(title)title.textContent=finalistMode?'FINALISTS':'Quick Cuts';
    if(finalistMode){host.innerHTML='';return;}
    const keys=['burgers','pizza','chicken','mexican','italian','pasta','potato','southern','healthy','soupstew','sandwiches','seafood','steak','bbq','breakfast','american'];
    host.innerHTML=keys.filter(k=>QUICK_CUT_RULES?.[k]).map(k=>{
      const r=QUICK_CUT_RULES[k],n=foodBase.filter(x=>foodQuickMatch(x,k)).length,h=foodQuickHidden.has(k);
      return `<button type="button" class="quick-cut${h?' is-quick-hidden':''}" data-launch-quick="${html(k)}" ${(!n||pass)?'disabled':''} aria-pressed="${h}" title="${h?'Show '+html(r.label):'Hide '+html(r.label)}"><span class="quick-cut-copy"><strong>${html(r.label)}</strong><em>${h?'show':'hide'} · ${n}</em></span><span class="quick-cut-x" aria-hidden="true">${h?'↺':'×'}</span></button>`;
    }).join('');
    host.querySelectorAll('[data-launch-quick]').forEach(b=>{const photoKey=QUICK_CUT_RULES[b.dataset.launchQuick]?.photo;const photo=photoKey&&PHOTO_LIBRARY?.[photoKey];if(photo)b.style.setProperty('--quick-photo',`url("${photo.replace(/"/g,'&quot;')}")`);b.onclick=()=>toggleFoodQuick(b.dataset.launchQuick);});
  }
  function toggleFoodQuick(k){
    if(pass){toast('Quick Cuts are locked during Pass Around.');return;}
    addFoodBase(); if(!foodBase.some(x=>foodQuickMatch(x,k))){toast('No matching choices in this round.');return;}
    foodQuickHidden.has(k)?foodQuickHidden.delete(k):foodQuickHidden.add(k);
    activeItems=foodVisible(); holdingItems=[]; searchQuery=''; saveFoodRoundState(); renderStage(); renderFoodQuickCuts(); setStatus(`${activeItems.length} options left`,'live');
    toast(`${QUICK_CUT_RULES[k].label} ${foodQuickHidden.has(k)?'hidden':'brought back'}.`);
  }

  function freshFood(){
    const base=uniq([...(homeMeals||[]),...(customItems||[])],foodKey).filter(x=>x.type!=='restaurant'&&!isDeletedFood(x)&&(!hideEnabled||!isHidden(x)));
    foodBase=[...base]; foodManual.clear(); foodQuickHidden.clear(); foodInProgress=true;
    activeItems=[...base]; holdingItems=[]; finalistMode=false; undoStack=[]; searchQuery=''; originalCount=Math.max(1,base.length);
    saveFoodRoundState(); foodShowUI(`${base.length} fresh options ready`);
  }
  function resumeFood(){
    if(!foodBase.length||(!activeItems.length&&!holdingItems.length)){freshFood();return;}
    foodInProgress=true; foodShowUI(`${activeItems.length} options left`);
  }
  function foodShowUI(status){
    currentWinnerMode='food'; document.body.classList.remove('restaurant-mode','finalist-mode'); document.body.classList.add('game-mode');
    $('homePanel')?.classList.add('hidden');$('winnerPanel')?.classList.add('hidden');$('restaurantPanel')?.classList.add('hidden');$('gamePanel')?.classList.remove('hidden');
    updateBackButton();syncDecisionActionLabels();renderStage();renderFoodQuickCuts();if(status)setStatus(status,'live');
  }

  function dedupeRestaurantControls(){
    const host=$('restaurantPanel'); if(!host)return;
    const keepFirst=(id)=>{const nodes=[...host.querySelectorAll('#'+id)]; if(nodes.length<=1)return; const visible=nodes.find(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(n).display!=='none';}); const keep=visible||nodes[0]; nodes.filter(n=>n!==keep).forEach(n=>n.remove());};
    ['restaurantSearchBtn','restaurantPassAroundBtn','restaurantInlineSearch','restaurantInlineSearchInput','restaurantRadiusFilter','restaurantRadiusDisplay','restaurantUseLocationBtn','restaurantLoadBtn'].forEach(keepFirst);
    host.querySelectorAll('#restaurantOpenNowBtn,.restaurant-open-chip,#restaurantResetFilters,[data-legacy-restaurant-tools]').forEach(n=>n.remove());
    host.querySelectorAll('.restaurant-utility-row').forEach((row,i)=>{if(i>0)row.remove();});
    host.querySelectorAll('#restaurantInlineSearch button[aria-label*="Clear" i]').forEach(n=>n.remove());
  }
  function cleanRestaurantLabels(){
    document.querySelectorAll('#restaurantStage button,.winner button,.detail-sheet button').forEach(b=>{
      const t=String(b.textContent||'').trim();
      if(!t)return;
      const next=t.replace(/Search\s*\/\s*Order/gi,'Search').replace(/Website\s*\/\s*Order/gi,'Website').replace(/Visit\s*\/\s*Order/gi,'Visit website');
      if(next!==t)b.textContent=next;
    });
  }
  function watchRestaurantUtilityCleanup(){
    const host=$('restaurantPanel'); if(!host || host.__dinliminateUtilityObserver)return;
    const clean=()=>{
      const canonical=host.querySelector('#restaurantUtilityBar');
      if(canonical) host.querySelectorAll('.restaurant-utility-row').forEach(row=>row.remove());
      dedupeRestaurantControls();
    };
    host.__dinliminateUtilityObserver=new MutationObserver(()=>clean());
    host.__dinliminateUtilityObserver.observe(host,{subtree:true,childList:true});
    clean();
  }
  function setupRestaurantTools(){ watchRestaurantUtilityCleanup(); dedupeRestaurantControls(); syncRestaurantTools(); }
  function syncRestaurantTools(){
    dedupeRestaurantControls();
    const b=$('restaurantUtilityBar'),q=$('restaurantInlineQuery'),s=$('restaurantSearchBtn');
    if(!b)return;
    if(q)q.value=restaurantFilters.query||''; b.classList.toggle('search-open',!!restaurantFilters.query);
    s?.classList.toggle('active',!!restaurantFilters.query);s?.setAttribute('aria-expanded',String(b.classList.contains('search-open')));
    const l=$('restaurantLocationLabel'); if(l){const loc=restaurantLocationMode==='device'&&userCoords?'Using your device location':(userCity?`Near ${userCity}`:'Pick an area');const filt=[restaurantFilters.sort==='closest'?'nearest first':''].filter(Boolean);l.textContent=`${loc}${filt.length?' · '+filt.join(' · '):''} · cut until one is left`;}
  }
  function filterRestaurants(){
    let a=[...(activeRestaurants||[])];
    const q=String(restaurantFilters.query||'').trim().toLowerCase();
    if(q)a=a.filter(r=>`${r.name||''} ${r.address||''} ${r.brand||''} ${r.operator||''} ${r.category||''}`.toLowerCase().includes(q));
    if(restaurantFilters.sort==='closest')a.sort((x,y)=>(Number(x.distanceMiles)||Infinity)-(Number(y.distanceMiles)||Infinity));
    return a;
  }
  function renderRestaurantQuickCuts(){
    const host=$('restaurantQuickCuts'),title=$('restaurantQuickCutsTitle');if(!host)return;
    if(restaurantFinalistMode){host.innerHTML='';if(title)title.textContent='FINALISTS';return;}
    if(title)title.textContent='Quick Cuts';
    const list=Array.isArray(RESTAURANT_QUICK_CUTS)?RESTAURANT_QUICK_CUTS:[];
    host.innerHTML=list.map(([label,k,photoKey])=>{const n=restaurantBase.filter(x=>restQuickMatch(x,k)).length,h=restaurantQuickCuts.has(k),photo=PHOTO_LIBRARY?.[photoKey]||RESTAURANT_FALLBACK_PHOTO;return `<button type="button" class="quick-cut restaurant-quick-cut${h?' is-quick-hidden':''}" data-launch-rq="${html(k)}" ${(!n||pass)?'disabled':''} aria-pressed="${h}" title="${h?'Show '+html(label):'Hide '+html(label)}" style="--quick-photo:url('${html(photo)}')"><span class="quick-cut-copy"><strong>${html(label)}</strong><em>${h?'show':'hide'} · ${n}</em></span><span class="quick-cut-x" aria-hidden="true">${h?'↺':'×'}</span></button>`;}).join('');
    host.querySelectorAll('[data-launch-rq]').forEach(b=>b.onclick=()=>toggleRestaurantQuick(b.dataset.launchRq));
  }
  function visibleRestaurants(){return restaurantBase.filter(x=>!restaurantManual.has(restKey(x))&&!Array.from(restaurantQuickCuts||[]).some(k=>restQuickMatch(x,k)));}
  function recomputeRestaurantManual(){const present=new Set([...(activeRestaurants||[]),...(holdingRestaurants||[])].map(restKey));restaurantManual=new Set(restaurantBase.filter(x=>!present.has(restKey(x))&&!Array.from(restaurantQuickCuts||[]).some(k=>restQuickMatch(x,k))).map(restKey));}
  function toggleRestaurantQuick(k){
    if(pass){toast('Quick Cuts are locked during Pass Around.');return;}
    if(!restaurantBase.length)restaurantBase=uniq([...(activeRestaurants||[]),...(holdingRestaurants||[])],restKey);
    if(!restaurantBase.some(x=>restQuickMatch(x,k))){toast('No matching restaurants in this round.');return;}
    restaurantQuickCuts.has(k)?restaurantQuickCuts.delete(k):restaurantQuickCuts.add(k);
    activeRestaurants=visibleRestaurants();holdingRestaurants=[];restaurantFilters.query='';restaurantRoundInProgress=true;saveRestaurantRoundState();renderRestaurantQuickCuts();renderRestaurantStage();syncRestaurantTools();
    const label=RESTAURANT_QUICK_CUTS.find(x=>x[1]===k)?.[0]||k;toast(`${label} ${restaurantQuickCuts.has(k)?'hidden':'brought back'}.`);
  }

  const PASS_SCHEMA='p647-passaround-v2';
  const PASS_MAX_AGE=7*24*60*60*1000;
  const PASS_PHASES=new Set(['voting','handoff','no_finalists']);
  function passKey(item){return String(item?.type||'home').toLowerCase()+'::'+String(item?.id||item?.name||'').trim().toLowerCase();}
  function compactPassItem(item){
    if(!item)return null;
    const base={id:item.id??null,name:String(item.name||''),type:item.type||'home',tags:Array.isArray(item.tags)?item.tags.slice(0,20):[],category:item.category||'',mealType:item.mealType||'',cuisine:item.cuisine||'',subcategory:item.subcategory||'',notes:item.notes||'',recipe:item.recipe||'',photo:item.photo||'',icon:item.icon||'',prep:item.prep||'',budget:item.budget||'',accent:item.accent||'',createdAt:item.createdAt||null,updatedAt:item.updatedAt||null};
    if(item.type==='restaurant')Object.assign(base,{address:item.address||'',website:item.website||'',phone:item.phone||'',lat:Number.isFinite(Number(item.lat))?Number(item.lat):null,lon:Number.isFinite(Number(item.lon))?Number(item.lon):null,distanceMiles:Number.isFinite(Number(item.distanceMiles))?Number(item.distanceMiles):null,brand:item.brand||'',operator:item.operator||'',fastFood:item.fastFood===true,amenity:item.amenity||'',openingHours:item.openingHours||'',opening_hours:item.opening_hours||'',hours:item.hours||'',openNow:typeof item.openNow==='boolean'?item.openNow:null,currentlyOpen:typeof item.currentlyOpen==='boolean'?item.currentlyOpen:null,timeZone:item.timeZone||item.timezone||'',photoName:item.photoName||'',photoUrl:item.photoUrl||'',menuItems:Array.isArray(item.menuItems)?item.menuItems.slice(0,6):undefined,menu_items:Array.isArray(item.menu_items)?item.menu_items.slice(0,6):undefined,commonMenuItems:Array.isArray(item.commonMenuItems)?item.commonMenuItems.slice(0,6):undefined,common_menu_items:Array.isArray(item.common_menu_items)?item.common_menu_items.slice(0,6):undefined,searchArea:item.searchArea||''});
    return base;
  }
  function compactPassList(list){return uniq((list||[]).map(compactPassItem).filter(Boolean),passKey);}
  function passSnapshot(mode){
    if(mode==='restaurant')return {active:compactPassList(activeRestaurants),holding:compactPassList(holdingRestaurants),finalist:!!restaurantFinalistMode,exhausted:!!restaurantEliminationExhausted,quick:[...restaurantQuickCuts],filters:{query:String(restaurantFilters?.query||''),sort:restaurantFilters?.sort==='closest'?'closest':'shuffle'}};
    return {active:compactPassList(activeItems),holding:compactPassList(holdingItems),finalist:!!finalistMode,originalCount:Number(originalCount)||0,searchQuery:String(searchQuery||''),quick:[...foodQuickHidden],manual:[...foodManual]};
  }
  function serializePassState(){
    if(!pass)return null;
    return {schema:PASS_SCHEMA,savedAt:Date.now(),startedAt:pass.startedAt,mode:pass.mode,count:pass.count,participant:pass.participant,phase:pass.phase,pool:compactPassList(pass.pool),votes:(pass.votes||[]).map(m=>[...m.entries()]),snapshot:pass.snapshot||{},finalists:compactPassList(pass.finalists||[])};
  }
  function savePassState(){
    const payload=serializePassState();
    try{
      if(payload){safeWrite(PASS_STATE_KEY,JSON.stringify(payload));idbPut?.('passState',payload);}
      else{localStorage.removeItem(PASS_STATE_KEY);idbDelete?.('passState');}
    }catch(e){console.warn('Pass Around state save failed',e);}
  }
  function clearPassState(){try{localStorage.removeItem(PASS_STATE_KEY);}catch{}try{idbDelete?.('passState');}catch{}}
  function validatePassState(s){
    if(!s||s.schema!==PASS_SCHEMA||!['food','restaurant'].includes(s.mode))return false;
    if(!Number.isFinite(Number(s.savedAt))||Date.now()-Number(s.savedAt)>PASS_MAX_AGE)return false;
    const count=Number(s.count),participant=Number(s.participant);
    if(!Number.isInteger(count)||count<2||count>6||!Number.isInteger(participant)||participant<1||participant>count)return false;
    if(!PASS_PHASES.has(s.phase)||!Array.isArray(s.pool)||s.pool.length<2||s.pool.length>2000)return false;
    if(!Array.isArray(s.votes)||s.votes.length!==count)return false;
    const keys=new Set(s.pool.map(passKey));if(keys.size!==s.pool.length||[...keys].some(k=>!k||/^(food|restaurant)::$/i.test(k)))return false;
    return true;
  }
  async function restorePassState(){
    let s=null;
    try{const raw=safeRead(PASS_STATE_KEY,'');if(raw)s=JSON.parse(raw);}catch{}
    if(!validatePassState(s)){
      s=null;
      try{const row=await idbGet('passState');s=row?.value||null;}catch{}
    }
    if(!validatePassState(s)){clearPassState();return false;}
    const pool=compactPassList(s.pool);if(pool.length<2){clearPassState();return false;}
    const votes=Array.from({length:s.count},(_,i)=>new Map(Array.isArray(s.votes?.[i])?s.votes[i]:[]));
    const validKeys=new Set(pool.map(passKey));
    for(const map of votes)for(const [k,v] of map)if(!validKeys.has(k)||typeof v!=='boolean')map.delete(k);
    pass={schema:PASS_SCHEMA,startedAt:Number(s.startedAt)||Number(s.savedAt),mode:s.mode,count:Number(s.count),participant:Number(s.participant),phase:s.phase,pool,votes,snapshot:s.snapshot||{},finalists:compactPassList(s.finalists||[]),busy:false};
    if(pass.phase==='voting')syncPassParticipantView();else if(pass.phase==='handoff')showPassHandoff();else showPassNoFinalists();
    renderPassStatus();
    const msg=pass.phase==='handoff'?'Pass Around restored · waiting for Person '+(pass.participant+1)+'.':pass.phase==='no_finalists'?'Pass Around restored · no unanimous finalists.':'Pass Around restored · Person '+pass.participant+' of '+pass.count+'.';
    toast(msg);return true;
  }
  function lockPassControls(){
    const selectors=pass?.mode==='restaurant'
      ? ['#restaurantBackAction','#restaurantHideBtn','#restaurantChooseBtn','#restaurantSearchBtn','#restaurantInlineSearchInput','#restaurantUseLocationBtn','#restaurantLoadBtn','#restaurantRadiusFilter','#restaurantRadiusDisplay','#restaurantMenuBtn','#restaurantPassAroundBtn','.restaurant-card-choose-btn','.restaurant-detail-btn-v240','.restaurant-order-btn-v240']
      : ['#backBtn','#hideBtn','#chooseBtn','#randomBtn','#addDuringBtn','#menuBtn','#homeMenuTopBtn','#foodPassAroundBtn','.card-choose-btn','.choice-utilities button'];
    document.querySelectorAll(selectors.join(',')).forEach(el=>{
      if(el.id==='passEndBtn'||el.id==='cutBtn'||el.id==='holdBtn'||el.id==='restaurantCutBtn'||el.id==='restaurantKeepBtn')return;
      if(!el.dataset.passPrevDisabled)el.dataset.passPrevDisabled=el.disabled?'1':'0';
      el.disabled=true;el.setAttribute('aria-disabled','true');
    });
  }
  function unlockPassControls(){
    document.querySelectorAll('[data-pass-prev-disabled]').forEach(el=>{el.disabled=el.dataset.passPrevDisabled==='1';delete el.dataset.passPrevDisabled;el.removeAttribute('aria-disabled');});
  }
  function applyPassLock(){
    document.body.classList.remove('pass-setup','pass-voting','pass-handoff','pass-no-finalists');
    const cls=pass?.phase==='voting'?'pass-voting':pass?.phase==='handoff'?'pass-handoff':'pass-no-finalists';
    document.body.classList.add('pass-active',cls,'overlay-open');lockPassControls();
  }
  function clearPassLock(){unlockPassControls();document.body.classList.remove('pass-active','pass-setup','pass-voting','pass-handoff','pass-no-finalists','overlay-open');}
  function passViewItems(){if(!pass)return [];const voter=pass.votes?.[pass.participant-1];if(!voter)return [];return pass.pool.filter(item=>!voter.has(passKey(item)));}
  function syncPassParticipantView(){
    if(!pass||pass.phase!=='voting')return;
    applyPassLock();const view=passViewItems();
    if(pass.mode==='restaurant'){activeRestaurants=[...view];holdingRestaurants=[];restaurantFinalistMode=false;restaurantEliminationExhausted=false;restaurantFilters={...(restaurantFilters||{}),query:'',sort:'shuffle'};showRestaurantUIForPass();renderRestaurantStage();lockPassControls();}
    else{activeItems=[...view];holdingItems=[];finalistMode=false;searchQuery='';foodInProgress=true;foodShowUI(null);lockPassControls();}
    renderPassStatus();savePassState();
  }
  function openPass(mode){
    if(pass){toast('Pass Around is already in progress.');return;}
    let pool=mode==='restaurant'?uniq([...(activeRestaurants||[]),...(holdingRestaurants||[])],restKey):uniq([...(activeItems||[]),...(holdingItems||[])].filter(x=>x&&!isDeletedFood(x)),foodKey);
    pool=uniq(pool.map(compactPassItem).filter(Boolean),passKey);if(pool.length<2){toast('Pass Around needs at least two choices.');return;}
    const b=document.createElement('div');b.id='passSetupBackdrop';b.className='pass-modal-backdrop';document.body.classList.add('pass-active','pass-setup','overlay-open');
    b.innerHTML='<div class="pass-modal" role="dialog" aria-modal="true" aria-labelledby="passSetupTitle"><h3 id="passSetupTitle">Pass Around</h3><p>Everyone gets the exact same list. Swipe left or tap Cut to remove a choice. Swipe right or tap Maybe to keep it. Only choices kept by everyone become finalists.</p><div class="pass-count-grid">'+[2,3,4,5,6].map(n=>'<button type="button" class="pass-count-btn" data-pass-n="'+n+'">'+n+' people</button>').join('')+'</div><div class="pass-modal-actions"><button type="button" class="pass-cancel-btn" data-pass-cancel>Cancel</button></div></div>';
    document.body.appendChild(b);
    b.querySelector('[data-pass-cancel]')?.addEventListener('click',()=>{b.remove();document.body.classList.remove('pass-active','pass-setup','overlay-open');});
    b.querySelectorAll('[data-pass-n]').forEach(btn=>btn.addEventListener('click',()=>startPass(mode,Number(btn.dataset.passN),pool)));
  }
  window.DinliminateOpenPassAround=openPass;
  function startPass(mode,count,pool){
    $('passSetupBackdrop')?.remove();document.body.classList.remove('pass-setup');
    const snapshot=passSnapshot(mode);
    pass={schema:PASS_SCHEMA,startedAt:Date.now(),mode,count,participant:1,phase:'voting',pool:uniq(pool.map(compactPassItem).filter(Boolean),passKey),votes:Array.from({length:count},()=>new Map()),snapshot,finalists:[],busy:false};
    if(mode==='restaurant'){activeRestaurants=[...pass.pool];holdingRestaurants=[];restaurantFinalistMode=false;restaurantEliminationExhausted=false;restaurantFilters={...(restaurantFilters||{}),query:'',sort:'shuffle'};restaurantRoundInProgress=true;renderRestaurantQuickCuts();renderRestaurantStage();syncRestaurantActionLabels?.();saveRestaurantRoundState();}
    else{activeItems=[...pass.pool];holdingItems=[];finalistMode=false;searchQuery='';originalCount=pass.pool.length;foodInProgress=true;saveFoodRoundState();foodShowUI(null);}
    applyPassLock();savePassState();renderPassStatus();toast('Person 1 of '+count+': start swiping.');
  }
  function showRestaurantUIForPass(){legacyShowRestaurant?.();document.body.classList.add('restaurant-mode');setupRestaurantTools();renderRestaurantStage();syncRestaurantActionLabels?.();}
  function passCurrent(){return pass?.phase==='voting'?(passViewItems()[0]||null):null;}
  function passAct(kind,card){
     if(kind!=='cut'&&kind!=='hold')return false;
     if(!pass||pass.phase!=='voting'||pass.busy)return false;
     const item=passCurrent();if(!item)return true;
     const key=passKey(item),voter=pass.votes?.[pass.participant-1];
     if(!voter||voter.has(key))return false;
     voter.set(key,kind==='cut');
     pass.busy=true;
     savePassState();
     lockPassControls();
     try{
       const remaining=passViewItems();
       if(remaining.length===0){finishPassParticipant();return true;}
       pass.busy=false;
       if(pass.mode==='restaurant')activeRestaurants=[...remaining];else activeItems=[...remaining];
       if(pass.mode==='restaurant')renderRestaurantStage();else renderStage();
       renderPassStatus();
       lockPassControls();
       savePassState();
       return true;
     }catch(e){
       pass.busy=false;
       voter.delete(key);
       savePassState();
       throw e;
     }
   }
  function finishPassParticipant(){
    if(!pass)return;pass.busy=false;
    if(pass.participant<pass.count){pass.phase='handoff';savePassState();applyPassLock();showPassHandoff();renderPassStatus();return;}
    completePass();
  }
  function showPassHandoff(){
    $('passHandoffBackdrop')?.remove();if(!pass||pass.phase!=='handoff')return;applyPassLock();
    const next=pass.participant+1,b=document.createElement('div');b.id='passHandoffBackdrop';b.className='pass-modal-backdrop';
    b.innerHTML='<div class="pass-modal pass-handoff" role="dialog" aria-modal="true" aria-labelledby="handoffTitle"><div class="pass-icon">↔</div><h4 id="handoffTitle">Pass the phone to Person '+next+'</h4><p>Person '+pass.participant+' is finished. Person '+next+' gets the exact same complete list.</p><button type="button" class="pass-primary-btn" data-pass-start>Start Person '+next+'</button><div class="pass-modal-actions"><button type="button" class="pass-cancel-btn" data-pass-end>End Pass Around</button></div></div>';
    document.body.appendChild(b);const startBtn=b.querySelector('[data-pass-start]'),endBtn=b.querySelector('[data-pass-end]');
    startBtn?.addEventListener('click',()=>{b.remove();pass.participant=next;pass.phase='voting';pass.busy=false;savePassState();syncPassParticipantView();toast('Person '+next+' of '+pass.count+': your turn.');});
    endBtn?.addEventListener('click',()=>cancelPass());startBtn?.focus?.();
  }
  function completePass(){
    const p=pass;if(!p)return;
    const finals=p.pool.filter(item=>p.votes.every(v=>v.has(passKey(item))&&v.get(passKey(item))===false));p.finalists=finals;
    if(!finals.length){p.phase='no_finalists';p.busy=false;savePassState();applyPassLock();showPassNoFinalists();renderPassStatus();return;}
    pass=null;clearPassState();clearPassLock();$('passStatus')?.remove();
    if(p.mode==='restaurant'){activeRestaurants=[...finals];holdingRestaurants=[];restaurantFinalistMode=true;restaurantEliminationExhausted=false;restaurantUndoStack=[];restaurantQuickCuts.clear();restaurantFilters={query:'',sort:p.snapshot.filters?.sort==='closest'?'closest':'shuffle'};restaurantRoundInProgress=true;renderRestaurantQuickCuts();renderRestaurantStage();syncRestaurantActionLabels?.();saveRestaurantRoundState();setStatus(finals.length+' finalists left · choose one','live');}
    else{activeItems=[...finals];holdingItems=[];finalistMode=true;undoStack=[];originalCount=p.pool.length;searchQuery='';foodInProgress=true;saveFoodRoundState();renderStage();renderFoodQuickCuts();syncDecisionActionLabels();document.body.classList.add('finalist-mode');setStatus(finals.length+' finalists left · choose one','live');}
    toast('Everyone finished. Only the choices everyone kept are finalists.');
  }
  function restorePassSnapshot(p){
    if(!p)return;
    if(p.mode==='restaurant'){activeRestaurants=compactPassList(p.snapshot?.active||[]);holdingRestaurants=compactPassList(p.snapshot?.holding||[]);restaurantFinalistMode=!!p.snapshot?.finalist;restaurantEliminationExhausted=!!p.snapshot?.exhausted;restaurantQuickCuts=new Set(Array.isArray(p.snapshot?.quick)?p.snapshot.quick:[]);restaurantFilters={query:String(p.snapshot?.filters?.query||''),sort:p.snapshot?.filters?.sort==='closest'?'closest':'shuffle'};restaurantRoundInProgress=true;renderRestaurantQuickCuts();renderRestaurantStage();syncRestaurantActionLabels?.();saveRestaurantRoundState();}
    else{activeItems=compactPassList(p.snapshot?.active||[]);holdingItems=compactPassList(p.snapshot?.holding||[]);finalistMode=!!p.snapshot?.finalist;originalCount=Number(p.snapshot?.originalCount)||activeItems.length+holdingItems.length||1;searchQuery=String(p.snapshot?.searchQuery||'');foodQuickHidden=new Set(Array.isArray(p.snapshot?.quick)?p.snapshot.quick:[]);foodManual=new Set(Array.isArray(p.snapshot?.manual)?p.snapshot.manual:[]);foodInProgress=true;saveFoodRoundState();renderStage();renderFoodQuickCuts();syncDecisionActionLabels();}
  }
  function cancelPass(){
    const p=pass;if(!p)return;pass=null;clearPassState();$('passSetupBackdrop')?.remove();$('passHandoffBackdrop')?.remove();$('passNoFinalistsBackdrop')?.remove();restorePassSnapshot(p);clearPassLock();toast('Pass Around ended. Your round is restored.');
  }
  function restartPass(){const p=pass;if(!p)return;const mode=p.mode;pass=null;clearPassState();$('passNoFinalistsBackdrop')?.remove();restorePassSnapshot(p);clearPassLock();openPass(mode);}
  function showPassNoFinalists(){
    $('passNoFinalistsBackdrop')?.remove();if(!pass||pass.phase!=='no_finalists')return;applyPassLock();
    const b=document.createElement('div');b.id='passNoFinalistsBackdrop';b.className='pass-modal-backdrop';
    b.innerHTML='<div class="pass-modal pass-no-finalists" role="dialog" aria-modal="true" aria-labelledby="noFinalistsTitle"><div class="pass-icon">↔</div><h4 id="noFinalistsTitle">No unanimous finalists</h4><p>No choice was kept by everyone. Pass Around will not invent a winner. You can run the group round again or end it and restore your previous choices.</p><div class="pass-modal-actions pass-no-finalist-actions"><button type="button" class="pass-primary-btn" data-pass-restart>Run Pass Around Again</button><button type="button" class="pass-cancel-btn" data-pass-end>End Pass Around</button></div></div>';
    document.body.appendChild(b);b.querySelector('[data-pass-restart]')?.addEventListener('click',restartPass);b.querySelector('[data-pass-end]')?.addEventListener('click',cancelPass);b.querySelector('[data-pass-restart]')?.focus?.();
  }
  function renderPassStatus(){
    const old=$('passStatus');if(!pass){old?.remove();return;}
    const host=pass.mode==='restaurant'?$('restaurantStage'):$('stage');if(!host)return;
    let bar=old;if(!bar){bar=document.createElement('div');bar.id='passStatus';bar.className='pass-status';host.parentNode?.insertBefore(bar,host);}
    const remaining=pass.phase==='voting'?passViewItems().length:0,done=Math.max(0,pass.pool.length-remaining);
    const label=pass.phase==='voting'?'Person '+pass.participant+' of '+pass.count+' · '+done+' of '+pass.pool.length:pass.phase==='handoff'?'Person '+pass.participant+' finished · '+pass.count+' people':'No unanimous finalists';
    bar.innerHTML='<span><strong>Pass Around</strong><span class="pass-status-detail"> · '+label+'</span></span><button type="button" id="passEndBtn">End pass</button>';
    $('passEndBtn').onclick=(e)=>{e.preventDefault();e.stopImmediatePropagation();cancelPass();};
  }

  function historyDayKey(value){const d=new Date(value||Date.now());return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function renderHistoryCalendar(){
    const host=$('libraryList');if(!host)return;const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),days=new Date(y,m+1,0).getDate(),start=new Date(y,m,1).getDay(),by=new Map();
    (historyItems||[]).forEach((it,i)=>{const k=historyDayKey(it.date);if(!by.has(k))by.set(k,[]);by.get(k).push({it,i});});
    let cells='';for(let n=0;n<42;n++){const day=n-start+1,d=new Date(y,m,day),other=day<1||day>days,k=historyDayKey(d),events=by.get(k)||[],today=historyDayKey(new Date())===k;
      cells+=`<div class="history-day${other?' other-month':''}${today?' today':''}" role="gridcell" aria-label="${d.toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}${events.length?`, ${events.length} decision${events.length===1?'':'s'}`:''}"><div class="history-day-number"><span>${d.getDate()}</span>${events.length?`<span>${events.length}</span>`:''}</div><div class="history-events">${events.slice(0,4).map(({it,i})=>`<div class="history-event"><button type="button" class="history-event-main" data-history-open="${i}" title="View ${html(it.name||'decision')}"><img src="${html(it.photo||photoFor(it))}" alt="${html(it.name||'Decision')}" loading="lazy" decoding="async"></button><button type="button" class="history-event-x" data-history-remove="${i}" aria-label="Remove ${html(it.name||'decision')} from history">×</button></div>`).join('')}${events.length>4?`<span class="history-more">+${events.length-4}</span>`:''}</div></div>`;
    }
    host.innerHTML=`<div class="history-calendar-wrap"><div class="history-calendar-toolbar"><div><div class="history-calendar-kicker">DECISIONS</div><h4 id="historyCalendarTitle">${calendarCursor.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h4></div><div class="history-calendar-nav"><button type="button" data-cal-prev aria-label="Previous month">‹</button><button type="button" data-cal-today>Today</button><button type="button" data-cal-next aria-label="Next month">›</button></div></div><div class="history-weekdays" role="row">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div role="columnheader">${x}</div>`).join('')}</div><div class="history-calendar-grid" role="grid" aria-labelledby="historyCalendarTitle">${cells}</div><div class="history-legend"><span>Tap a photo for details</span><span>× removes the decision</span></div></div>`;
    host.querySelector('[data-cal-prev]').onclick=()=>{calendarCursor=new Date(y,m-1,1);renderHistoryCalendar();};host.querySelector('[data-cal-next]').onclick=()=>{calendarCursor=new Date(y,m+1,1);renderHistoryCalendar();};host.querySelector('[data-cal-today]').onclick=()=>{const d=new Date();calendarCursor=new Date(d.getFullYear(),d.getMonth(),1);renderHistoryCalendar();};
    host.querySelectorAll('[data-history-open]').forEach(b=>b.onclick=e=>{e.stopPropagation();const it=historyItems[Number(b.dataset.historyOpen)];if(it){closeLibrary();openDetails(it);}});
    host.querySelectorAll('[data-history-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();const i=Number(b.dataset.historyRemove);if(historyItems[i]){const n=historyItems[i].name;historyItems.splice(i,1);saveHistoryItems();renderHistoryCalendar();toast(`${n||'Decision'} removed from history.`);}});
  }
  function renderLibraryLaunch(){if(libraryTab==='history'){const b=$('clearLibraryBtn');if(b){b.classList.add('show');b.textContent='Reset history';}renderHistoryCalendar();return;}legacyRenderLibrary?.apply(this,arguments);}

  function wrapRestaurantRender(){
    return function(){
      legacyRenderRestaurant.apply(this,arguments);
      setupRestaurantTools();renderRestaurantQuickCuts();
      const q=String(restaurantFilters.query||'').trim();
      if(q&&!filterRestaurants().length){
        $('restaurantStage').innerHTML=`<div class="restaurant-empty-v240 restaurant-search-empty"><div class="restaurant-empty-icon">⌕</div><strong>No restaurants match “${html(q)}”.</strong><p>Try another name, brand, address, or clear Search.</p><div class="restaurant-empty-actions"><button class="restaurant-empty-btn" type="button" id="restaurantSearchEmptyClear">Clear search</button></div></div>`;
        $('restaurantSearchEmptyClear').onclick=()=>{$('restaurantInlineQuery').value='';restaurantFilters.query='';renderRestaurantStage();syncRestaurantTools();};
      }
      syncRestaurantTools();cleanRestaurantLabels();if(pass?.mode==='restaurant')renderPassStatus();
    };
  }

  function backToStartFresh(){
    clearPassState();pass=null;
    clearRestaurantRoundState();
    try{localStorage.removeItem(FOOD_ROUND_KEY);}catch{}
    foodInProgress=false;try{idbDelete?.('foodRound');}catch{}
    activeItems=[...(allItems||[])].filter(i=>i.type!=='restaurant'&&!isDeletedFood(i)&&(!hideEnabled||!isHidden(i)));
    holdingItems=[];finalistMode=false;undoStack=[];searchQuery='';
    restaurantQuickCuts.clear();restaurantFinalistMode=false;restaurantEliminationExhausted=false;activeRestaurants=[];restaurantItems=[];holdingRestaurants=[];restaurantUndoStack=[];
    document.body.classList.remove('game-mode','restaurant-mode','finalist-mode','overlay-open','gesture-active');
    ['winnerPanel','gamePanel','restaurantPanel','scrim','drawer','searchBackdrop','infoBackdrop','detailBackdrop','modalBackdrop','settingsBackdrop','confirmBackdrop','restoreBackdrop','libraryBackdrop','passSetupBackdrop','passHandoffBackdrop'].forEach(id=>$(id)?.classList.add('hidden'));
    $('homePanel')?.classList.remove('hidden');
    document.title='Dinliminate — Dinner Decisions';
    setNavActive?.('navHome');
    updateHomeCount?.();syncWinnerAccess?.();
    closeMenu?.();closeLibrary?.();closeSearch?.();closeInfo?.();
    window.scrollTo?.(0,0);
    setStatus?.(`${activeItems.length} options ready`,'live');
    toast('Back to start.');
  }
  window.DinliminateBackToStart=backToStartFresh;

  let passActionCaptureInstalled=false;
  function installPassActionCapture(){
    if(passActionCaptureInstalled)return;
    passActionCaptureInstalled=true;
    document.addEventListener('click',e=>{
      const btn=e.target?.closest?.('#foodPassAroundBtn,#restaurantPassAroundBtn,#cutBtn,#holdBtn,#restaurantCutBtn,#restaurantKeepBtn');
      if(!btn)return;
      const id=btn.id;
      const activePass=!!pass&&pass.phase==='voting';
      const passOpen=id==='foodPassAroundBtn'||id==='restaurantPassAroundBtn';
      const decision= id==='cutBtn'||id==='restaurantCutBtn' ? 'cut' : id==='holdBtn'||id==='restaurantKeepBtn' ? 'hold' : null;
      if(passOpen || (activePass&&decision)){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(passOpen)openPass(id==='restaurantPassAroundBtn'?'restaurant':'food');
        else passAct(decision,btn);
      }
    },true);
  }

  function replaceTapControl(id,handler){
    const el=$(id);
    if(!el)return null;
    const clone=el.cloneNode(true);
    el.replaceWith(clone);
    clone.onclick=handler;
    return clone;
  }
  function install(){
    safeWrite('dinliminateLaunchVersion',VERSION);
    installPassActionCapture();
    $('startOverBtn')?.replaceChildren(document.createTextNode('Start fresh'));
    legacyShowGame=window.showGame;legacyResetList=window.resetList;legacyRenderStage=window.renderStage;legacyUndo=window.undoLast;legacyCut=window.cutCurrent;legacyHold=window.holdCurrent;legacyShowRestaurant=window.showRestaurantMode;legacyApplyRestaurant=window.applyRestaurantData;legacyRenderRestaurant=window.renderRestaurantStage;legacyRestaurantCut=window.restaurantCut;legacyRestaurantKeep=window.restaurantKeep;legacyRestaurantUndo=window.restaurantUndo;legacyRenderLibrary=window.renderLibrary;legacyShowWinner=window.showWinner;
    window.showGame=()=>{if(!foodHydrationDone){foodHydrationPromise.then(()=>window.showGame());return;}return foodInProgress&&((activeItems||[]).length+(holdingItems||[]).length)>0?resumeFood():freshFood();};window.resetList=()=>{foodHydrationDone=true;return freshFood();};
    window.renderStage=function(){addFoodBase();legacyRenderStage.apply(this,arguments);renderFoodQuickCuts();if(pass?.mode==='food')renderPassStatus();};
    window.cutCurrent=function(card){if(pass?.mode==='food')return passAct('cut',card);const it=activeItems?.[currentIndex()];if(it)foodManual.add(foodKey(it));const r=legacyCut.apply(this,arguments);setTimeout(()=>{recomputeFoodManual();saveFoodRoundState();renderFoodQuickCuts();},220);return r;};
    window.holdCurrent=function(card){if(pass?.mode==='food')return passAct('hold',card);const r=legacyHold.apply(this,arguments);setTimeout(()=>saveFoodRoundState(),220);return r;};
    window.undoLast=function(){const r=legacyUndo.apply(this,arguments);recomputeFoodManual();saveFoodRoundState();renderFoodQuickCuts();return r;};
    window.showRestaurantMode=()=>{
      if(!restaurantHydrationDone){restaurantHydrationPromise.then(()=>window.showRestaurantMode());return true;}
      const hasRound=restaurantRoundInProgress&&((activeRestaurants||[]).length+(holdingRestaurants||[]).length)>0;
      const v3State=window.DinliminateRestaurantSearchV3?.state?.();
      const searchInFlight=!!v3State?.searching;
      const r=legacyShowRestaurant.apply(this,arguments);setupRestaurantTools();renderRestaurantQuickCuts();
      // A V3 search calls applyRestaurantData(), and the legacy renderer calls showRestaurantMode().
      // Never refresh from inside that in-flight search or it recursively starts another search,
      // causing the restaurant card to cycle rapidly on its own.
      if(hasRound&&!searchInFlight){window.DinliminateRestaurantSearchV3?.refresh?.();renderRestaurantStage();syncRestaurantTools();setStatus(`${activeRestaurants.length} restaurants left · continuing your round`,'live');}
      return r;
    };
    window.applyRestaurantData=function(){const r=legacyApplyRestaurant.apply(this,arguments);restaurantBase=uniq([...(activeRestaurants||[]),...(holdingRestaurants||[])],restKey);restaurantManual.clear();restaurantRoundInProgress=!!restaurantItems.length;saveRestaurantRoundState();renderRestaurantQuickCuts();return r;};
    window.renderRestaurantStage=wrapRestaurantRender();
    window.filteredRestaurants=filterRestaurants;window.renderRestaurantQuickCuts=renderRestaurantQuickCuts;window.eliminateRestaurantCategory=toggleRestaurantQuick;
    window.restaurantCut=function(card){if(pass?.mode==='restaurant')return passAct('cut',card);const it=filterRestaurants()[0];if(it)restaurantManual.add(restKey(it));const r=legacyRestaurantCut.apply(this,arguments);setTimeout(()=>{recomputeRestaurantManual();restaurantRoundInProgress=true;saveRestaurantRoundState();renderRestaurantQuickCuts();},250);return r;};
    window.restaurantKeep=function(card){if(pass?.mode==='restaurant')return passAct('hold',card);const r=legacyRestaurantKeep.apply(this,arguments);setTimeout(()=>{restaurantRoundInProgress=true;saveRestaurantRoundState();},250);return r;};window.restaurantUndo=function(){const r=legacyRestaurantUndo.apply(this,arguments);recomputeRestaurantManual();restaurantRoundInProgress=true;saveRestaurantRoundState();renderRestaurantQuickCuts();return r;};
    window.showWinner=function(){foodInProgress=false;safeWrite(FOOD_ROUND_KEY,'');idbDelete('foodRound');return legacyShowWinner.apply(this,arguments);};window.renderLibrary=renderLibraryLaunch;
    // Replace static tap controls so older inline listeners cannot swallow or duplicate taps.
    replaceTapControl('cutBtn',e=>{e.preventDefault();window.cutCurrent?.($('stage')?.querySelector('.active'));});
    replaceTapControl('holdBtn',e=>{e.preventDefault();window.holdCurrent?.($('stage')?.querySelector('.active'));});
    replaceTapControl('foodPassAroundBtn',e=>{e.preventDefault();e.stopPropagation();openPass('food');});
    replaceTapControl('restaurantCutBtn',e=>{e.preventDefault();window.restaurantCut?.($('restaurantStage')?.querySelector('.active'));});
    replaceTapControl('restaurantKeepBtn',e=>{e.preventDefault();window.restaurantKeep?.($('restaurantStage')?.querySelector('.active'));});
    replaceTapControl('restaurantPassAroundBtn',e=>{e.preventDefault();e.stopPropagation();openPass('restaurant');});

    const foodBottom=$('gamePanel')?.querySelector('.game-bottom');
    const foodPass=$('foodPassAroundBtn');
    const legacyPass=$('passAroundBtn');
    if(legacyPass)legacyPass.remove();
    if(foodPass){
      foodPass.classList.add('pass-food-btn');
      foodPass.setAttribute('aria-label','Pass Around with other people');
      foodPass.onclick=(e)=>{e?.preventDefault?.();e?.stopImmediatePropagation?.();openPass('food');};
    } else if(foodBottom){
      const b=document.createElement('button');
      b.id='foodPassAroundBtn';b.type='button';b.className='text-btn food-secondary-action pass-around-btn pass-food-btn';b.textContent='Pass Around';b.setAttribute('aria-label','Pass Around with other people');b.onclick=()=>openPass('food');
      foodBottom.appendChild(b);
    }
    $('restaurantPassAroundWrap')?.remove();dedupeRestaurantControls();
    const restaurantPassButton=$('restaurantPassAroundBtn');
    if(restaurantPassButton){
      restaurantPassButton.type='button';
      restaurantPassButton.onclick=(e)=>{e?.preventDefault?.();e?.stopImmediatePropagation?.();openPass('restaurant');};
      restaurantPassButton.setAttribute('aria-label','Pass Around restaurant choices');
    }
    const winnerHomeButton=$('winnerHomeBtn');
    if(winnerHomeButton){
      winnerHomeButton.type='button';
      winnerHomeButton.addEventListener('click',(e)=>{e?.preventDefault?.();e?.stopImmediatePropagation?.();if(typeof window.DinliminateBackToStart==='function')window.DinliminateBackToStart();else if(typeof goHome==='function')goHome();},true);
    }
    document.querySelectorAll('[data-library-tab]').forEach(b=>b.addEventListener('click',()=>{libraryTab=b.dataset.libraryTab;renderLibraryLaunch();}));$('historyMenuBtn')?.addEventListener('click',()=>setTimeout(renderLibraryLaunch,0));
    // Disable the legacy website-metadata image hydrator so it cannot substitute another restaurant's photo.
    window.restaurantPhotoIsReal=typeof restaurantPhotoIsReal==='function'?restaurantPhotoIsReal:undefined;
    setupRestaurantTools();renderFoodQuickCuts();renderRestaurantQuickCuts();cleanRestaurantLabels();
    foodHydrationPromise=hydrateFoodRound().then(restored=>{foodHydrationDone=true;if(restored && document.body.classList.contains('game-mode')){foodShowUI(`${activeItems.length} options left · continuing your round`);}return restored;}).catch(()=>{foodHydrationDone=true;return false;});
    restaurantHydrationPromise=hydrateRestaurantRound().then(restored=>{restaurantHydrationDone=true;return restored;}).catch(()=>{restaurantHydrationDone=true;return false;});
    Promise.all([foodHydrationPromise,restaurantHydrationPromise]).then(()=>{if(document.body.classList.contains('game-mode')||document.body.classList.contains('restaurant-mode'))return;restorePassState();}).catch(()=>{});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
