/* Dinliminate clean app — single-source implementation. */
(() => {
  'use strict';

  const F = Array.isArray(window.DINLIMINATE_FOODS) ? window.DINLIMINATE_FOODS : [];
  const $ = (id) => document.getElementById(id);
  const KEY = 'dinliminate.clean.cp1';
  const HISTORY_KEY = 'dinliminate.clean.history';
  const HUNGRY_IMAGE = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85';
  const FOOD_QUICK = ['Southern','Pasta','Asian','Mexican','Pork','Soup/Stew','Healthy','Breakfast','American','Greek','Snack','Potato'];
  const REST_QUICK = ['American','Fast Food','Mexican','Asian','Pasta','Southern','Healthy','Soup','Greek','Pork','BBQ'];

  const QUICK_IMAGES = {
    Southern:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80',
    Pasta:'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=500&q=80',
    Asian:'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=500&q=80',
    Mexican:'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=500&q=80',
    Pork:'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=500&q=80',
    'Soup/Stew':'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=500&q=80',
    Healthy:'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=500&q=80',
    Breakfast:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=80',
    American:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
    Greek:'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=500&q=80',
    Snack:'https://images.unsplash.com/photo-1578849278619-7d347d3ed1f8?auto=format&fit=crop&w=500&q=80',
    Potato:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80'
  };

  const S = {
    screen:'home',
    hidden:new Set(),
    hiddenRestaurants:{},
    cutCats:new Set(),
    cutPrimary:new Set(),
    maybe:new Set(),
    custom:[],
    pool:[],
    index:0,
    foodActions:[],
    restaurantPool:[],
    restaurantIndex:0,
    restaurantCuts:new Set(),
    restaurantActions:[],
    restaurantQuery:'',
    hoursMode:'openUnknown',
    location:null,
    saved:false,
    winnerItem:null,
    winnerType:'food',
    pass:null,
    passDraftCount:2,
    passDraftNames:[]
  };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uniq = (a) => [...new Map((a || []).filter(Boolean).map(x => [String(x.id || x.name), x])).values()];
  const allFoods = () => [...F, ...S.custom];

  function save() {
    const data = {
      screen:S.screen, hidden:[...S.hidden], hiddenRestaurants:S.hiddenRestaurants,
      cutCats:[...S.cutCats], cutPrimary:[...S.cutPrimary], maybe:[...S.maybe],
      custom:S.custom, pool:S.pool, index:S.index, foodActions:S.foodActions,
      restaurantPool:S.restaurantPool, restaurantIndex:S.restaurantIndex,
      restaurantCuts:[...S.restaurantCuts], restaurantActions:S.restaurantActions,
      restaurantQuery:S.restaurantQuery, hoursMode:S.hoursMode, location:S.location,
      saved:S.saved, winnerItem:S.winnerItem, pass:S.pass,
      passDraftCount:S.passDraftCount, passDraftNames:S.passDraftNames
    };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
    S.saved = true;
    updateContinue();
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      Object.assign(S, d);
      S.hidden = new Set(d.hidden || []);
      S.hiddenRestaurants = d.hiddenRestaurants || {};
      S.cutCats = new Set(d.cutCats || []);
      S.cutPrimary = new Set(d.cutPrimary || []);
      S.maybe = new Set(d.maybe || []);
      S.restaurantCuts = new Set(d.restaurantCuts || []);
      S.foodActions = Array.isArray(d.foodActions) ? d.foodActions : [];
      S.restaurantActions = Array.isArray(d.restaurantActions) ? d.restaurantActions : [];
      S.restaurantPool = Array.isArray(d.restaurantPool) ? d.restaurantPool : [];
      S.custom = Array.isArray(d.custom) ? d.custom : [];
      S.passDraftNames = Array.isArray(d.passDraftNames) ? d.passDraftNames : [];
      S.winnerType = d.winnerType || 'food';
      return true;
    } catch { return false; }
  }

  function updateContinue() {
    const active = (S.screen !== 'winner') && ((S.pool?.length || 0) > 0 || (S.restaurantPool?.length || 0) > 0);
    $('continue')?.classList.toggle('hidden', !S.saved || !active);
  }

  function show(screen) {
    document.querySelectorAll('.screen').forEach(x => x.classList.add('hidden'));
    $(screen)?.classList.remove('hidden');
    S.screen = screen;
    window.scrollTo?.(0,0);
  }

  function home() {
    S.screen = 'home';
    show('home');
    updateContinue();
  }

  function foodPool() {
    return allFoods().filter(item => {
      if (S.hidden.has(item.id) || S.maybe.has(item.id)) return false;
      if (S.cutPrimary.has(item.primary)) return false;
      if (S.cutCats.has(item.category)) return false;
      if (S.cutCats.has('Soup/Stew') && (item.category === 'Soup' || item.category === 'Stew' || item.primary === 'soup' || item.primary === 'stew')) return false;
      if (S.cutCats.has('Potato') && item.primary === 'potato') return false;
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
      return '<button class="chip photo-chip '+(cut?'cut':'')+'" data-food-quick="'+esc(label)+'" style="background-image:linear-gradient(#0005,#0008),url("'+(QUICK_IMAGES[label] || QUICK_IMAGES.American)+'")"><span>'+esc(label)+'</span></button>';
    }).join('');
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

  function startFood() {
    S.foodActions = [];
    S.maybe.clear();
    S.cutCats.clear();
    S.cutPrimary.clear();
    S.index = 0;
    S.winnerItem = null;
    buildFood();
    foodQuick();
    show('food');
    drawFood();
    save();
  }

  function drawFood() {
    if (!S.pool.length) {
      winner({name:'Nothing left — hungry mode', image:HUNGRY_IMAGE, category:'Hungry'});
      return;
    }
    const item = S.pool[S.index];
    $('foodImg').src = item.image;
    $('foodImg').alt = item.name;
    $('foodName').textContent = item.name;
    $('foodCat').textContent = item.category;
    $('foodCount').textContent = S.pool.length + (S.pool.length === 1 ? ' choice' : ' choices');
  }

  function foodCommit(type, item) {
    S.foodActions.push({type, id:item.id, primary:item.primary, index:S.index});
  }

  function foodCut(item = S.pool[S.index]) {
    if (!item) return;
    foodCommit('cut', item);
    S.cutPrimary.add(item.primary);
    buildFood();
    resolveFoodAfterDecision();
  }

  function foodMaybe(item = S.pool[S.index]) {
    if (!item) return;
    foodCommit('maybe', item);
    S.maybe.add(item.id);
    buildFood();
    resolveFoodAfterDecision();
  }

  function resolveFoodAfterDecision() {
    if (S.pool.length === 1) winner(S.pool[0]);
    else if (!S.pool.length) winner({name:'Nothing left — hungry mode', image:HUNGRY_IMAGE, category:'Hungry'});
    else {
      S.index = Math.min(S.index, S.pool.length - 1);
      drawFood();
    }
    save();
  }

  function foodBack() {
    const action = S.foodActions.pop();
    if (!action) { home(); return; }
    if (action.type === 'cut') S.cutPrimary.delete(action.primary);
    if (action.type === 'maybe') S.maybe.delete(action.id);
    S.index = action.index || 0;
    buildFood();
    foodQuick();
    drawFood();
    save();
  }

  function foodHide() {
    const item = S.pool[S.index];
    if (!item) return;
    if (!confirm('Hide '+item.name+' until you restore it in Settings?')) return;
    S.hidden.add(item.id);
    buildFood();
    S.index = Math.min(S.index, Math.max(0, S.pool.length - 1));
    drawFood();
    save();
  }

  function randomCutOne() {
    if (S.pool.length < 2) return;
    const item = S.pool[Math.floor(Math.random() * S.pool.length)];
    foodCut(item);
  }

  function restaurantCategory(row) {
    if (row.fastFood || /fast food/i.test(String(row.category || ''))) return 'Fast Food';
    const s = (String(row.category || '')+' '+String(row.cuisine || '')+' '+String(row.name || '')).toLowerCase();
    if (/mexican|tex mex|taco|burrito/.test(s)) return 'Mexican';
    if (/asian|chinese|japanese|thai|korean|sushi|vietnamese/.test(s)) return 'Asian';
    if (/italian|pasta|pizza/.test(s)) return 'Pasta';
    if (/southern|soul|country/.test(s)) return 'Southern';
    if (/healthy|salad|vegetarian|vegan/.test(s)) return 'Healthy';
    if (/soup|stew|chili|chowder/.test(s)) return 'Soup';
    if (/greek|mediterranean|gyro/.test(s)) return 'Greek';
    if (/pork|bbq|barbecue/.test(s)) return /pork/.test(s) ? 'Pork' : 'BBQ';
    return 'American';
  }

  
/* CP29: lightweight opening-hours interpreter */
const DAY_NAMES=['Su','Mo','Tu','We','Th','Fr','Sa'];
function dayMatches(spec,day){
  const want=DAY_NAMES[day];
  return String(spec||'').split(',').some(part=>{
    const p=part.trim();
    if(!p)return false;
    if(p===want)return true;
    const m=p.match(/^(Su|Mo|Tu|We|Th|Fr|Sa)-(Su|Mo|Tu|We|Th|Fr|Sa)$/);
    if(!m)return false;
    const a=DAY_NAMES.indexOf(m[1]),b=DAY_NAMES.indexOf(m[2]);
    return a<=b ? day>=a&&day<=b : day>=a||day<=b;
  });
}
function parseTime(t){
  const m=String(t||'').match(/^(\d{1,2}):?(\d{2})$/);if(!m)return NaN;
  const h=Number(m[1]),min=Number(m[2]);return (h>=0&&h<24&&min>=0&&min<60)?h*60+min:NaN;
}
function hourStatus(row){
  const raw=String(row?.opening_hours||'').trim();
  if(!raw)return 'unknown';
  const low=raw.toLowerCase();
  if(low==='24/7'||low==='open')return 'open';
  if(low==='closed'||low==='off')return 'closed';
  const now=new Date(),day=now.getDay(),minute=now.getHours()*60+now.getMinutes();
  let matched=false;
  for(const block of raw.split(';')){
    const part=block.trim();if(!part)continue;
    const dm=part.match(/^((?:Su|Mo|Tu|We|Th|Fr|Sa)(?:-(?:Su|Mo|Tu|We|Th|Fr|Sa))?(?:,(?:Su|Mo|Tu|We|Th|Fr|Sa)(?:-(?:Su|Mo|Tu|We|Th|Fr|Sa))?)*)\s+(.+)$/i);
    const daySpec=dm?dm[1]:null,timeSpec=dm?dm[2]:part;
    if(daySpec&&!dayMatches(daySpec,day))continue;
    const ranges=[...timeSpec.matchAll(/(\d{1,2}:?\d{2})-(\d{1,2}:?\d{2})/g)];
    if(!ranges.length)continue;
    matched=true;
    for(const r of ranges){
      const a=parseTime(r[1]),b=parseTime(r[2]);if(!Number.isFinite(a)||!Number.isFinite(b))continue;
      if(b>=a ? (minute>=a&&minute<=b) : (minute>=a||minute<=b))return 'open';
    }
  }
  return matched ? 'closed' : 'unknown';
}

  function explicitClosed(row) { return hourStatus(row) === 'closed'; }

  function restaurantMatchesQuery(row) {
    const q = S.restaurantQuery.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      row.name,row.brand,row.operator,row.category,row.cuisine,
      ...(Array.isArray(row.menuItems) ? row.menuItems : [])
    ].filter(Boolean).join(' ').toLowerCase();
    return q.split(/\s+/).every(term => hay.includes(term));
  }

  function restaurantPoolFiltered() {
    return (S.restaurantPool || []).filter(row => {
      if (S.restaurantCuts.has(restaurantCategory(row))) return false;
      if (row._maybe || row._cut || row._hidden) return false;
      if (S.hiddenRestaurants[row.id]) return false;
      if (S.hoursMode === 'closed' ? !explicitClosed(row) : explicitClosed(row)) return false;
      return restaurantMatchesQuery(row);
    });
  }

  function restaurantQuick() {
    $('restQuick').innerHTML = REST_QUICK.map(label => {
      const cut = S.restaurantCuts.has(label);
      return '<button class="chip photo-chip '+(cut?'cut':'')+'" data-rest-quick="'+esc(label)+'" style="background-image:linear-gradient(#0005,#0008),url("'+(QUICK_IMAGES[label] || QUICK_IMAGES.American)+'")"><span>'+esc(label)+'</span></button>';
    }).join('');
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

  function setLocation(lat, lon, label) {
    S.location = {lat, lon, label};
    $('address').value = label || 'Current location';
    save();
  }

  async function useLocation() {
    if (!navigator.geolocation) {
      $('status').textContent = 'Location is not available in this browser.';
      return;
    }
    $('status').textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const r = await fetch('./api/restaurants?mode=reverse&lat='+encodeURIComponent(pos.coords.latitude)+'&lon='+encodeURIComponent(pos.coords.longitude));
        const d = await r.json();
        setLocation(pos.coords.latitude, pos.coords.longitude, d.display || 'Current location');
        $('status').textContent = 'Location ready.';
        await searchRestaurants();
      } catch {
        setLocation(pos.coords.latitude, pos.coords.longitude, 'Current location');
        $('status').textContent = 'Location ready. Tap Find to search.';
      }
    }, () => {
      $('status').textContent = 'Could not access your location. Enter an address instead.';
    }, {enableHighAccuracy:true, timeout:12000, maximumAge:60000});
  }

  let suggestTimer = 0;
  async function suggestAddresses() {
    const q = $('address').value.trim();
    if (q.length < 2) { clearSuggestions(); $('status').textContent = 'Enter an address or use your location.'; return; }
    $('status').textContent = 'Searching addresses…';
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(async () => {
      try {
        const r = await fetch('./api/restaurants?mode=suggest&q='+encodeURIComponent(q));
        const d = await r.json();
        renderSuggestions(d.results || []);
      } catch {
        clearSuggestions();
        $('status').textContent = 'Address lookup is temporarily unavailable.';
      }
    }, 250);
  }

  function renderSuggestions(rows) {
    let box = $('suggestionsBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'suggestionsBox';
      $('address').insertAdjacentElement('afterend', box);
    }
    box.innerHTML = (rows || []).map((row, i) =>
      '<button type="button" data-suggestion="'+i+'">'+esc(row.display)+'</button>'
    ).join('');
    box.style.display = rows?.length ? 'grid' : 'none';
    box.querySelectorAll('[data-suggestion]').forEach((btn, i) => {
      btn.onclick = () => {
        const row = rows[i];
        setLocation(row.lat, row.lon, row.display);
        clearSuggestions();
        $('status').textContent = 'Location selected.';
      };
    });
  }

  function clearSuggestions() {
    const box = $('suggestionsBox');
    if (box) box.style.display = 'none';
  }

  async function searchRestaurants() {
    clearSuggestions();
    $('status').textContent = 'Searching restaurants…';
    try {
      let loc = S.location;
      if (!loc) {
        const q = $('address').value.trim();
        if (!q) { $('status').textContent = 'Enter an address or use your location.'; return; }
        const rr = await fetch('./api/restaurants?mode=resolve&q='+encodeURIComponent(q));
        const rd = await rr.json();
        if (!rr.ok || !rd.ok) throw new Error(rd.message || 'Could not locate that address.');
        loc = {lat:rd.lat, lon:rd.lon, label:rd.display};
        S.location = loc;
        $('address').value = rd.display;
      }
      const radius = Number($('radius').value) || 10;
      const rr = await fetch('./api/restaurants?mode=search&lat='+encodeURIComponent(loc.lat)+'&lon='+encodeURIComponent(loc.lon)+'&radius='+radius);
      const d = await rr.json();
      if (!rr.ok || !d.ok) throw new Error(d.message || 'Restaurant search failed.');
      S.restaurantPool = uniq((d.results || []).map(row => ({...row, _maybe:false, _cut:false, _hidden:false})));
      S.restaurantIndex = 0;
      S.restaurantActions = [];
      S.winnerItem = null;
      $('status').textContent = d.total ? (d.total+' restaurants found'+(d.fastFoodCount ? ' · '+d.fastFoodCount+' fast food' : '')) : 'No restaurants found in this radius.';
      restaurantQuick();
      drawRestaurants();
      save();
    } catch (err) {
      S.restaurantPool = [];
      drawRestaurants();
      $('status').textContent = err?.message || 'Could not complete the search.';
    }
  }

  function openRestaurant() {
    S.screen = 'restaurant';
    S.restaurantActions = [];
    S.restaurantQuery = '';
    S.winnerItem = null;
    show('restaurant');
    restaurantQuick();
    renderHours();
    $('restaurantSearchBox')?.classList.add('hidden');
    $('restaurantQuery').value = '';
  }

  function drawRestaurants() {
    const rows = restaurantPoolFiltered();
    if (!rows.length) {
      $('restStage').innerHTML = '<div class="empty"><b>Hungry.</b><span>'+esc(S.restaurantPool.length ? 'No restaurants match the current cuts.' : 'Set a location, then find restaurants.')+'</span></div>';
      return;
    }
    S.restaurantIndex = Math.max(0, Math.min(S.restaurantIndex, rows.length - 1));
    const row = rows[S.restaurantIndex];
    const category = restaurantCategory(row);
    const image = row.photo || row.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85';
    $('restStage').innerHTML =
      '<article class="card" id="restaurantCard"><img src="'+esc(image)+'" alt="'+esc(row.name)+'"><div class="shade"></div><div class="card-copy"><small>'+esc(category)+(row.distance != null ? ' · '+Number(row.distance).toFixed(1)+' mi' : '')+'</small><h3>'+esc(row.name)+'</h3></div></article>'+
      '<div class="rest-card-extra"><div class="rest-meta">'+
      (row.address ? '<div>'+esc(row.address)+'</div>' : '')+
      (row.cuisine ? '<div>'+esc(row.cuisine)+'</div>' : '')+
      '<div style="margin-top:7px"><span class="status-badge">'+(hourStatus(row)==='open'?'Open':hourStatus(row)==='closed'?'Closed':'Open/Unknown Hours')+'</span></div></div>'+
      '<div class="card-actions"><button class="small" id="restDetails">Details</button><button class="small" id="restWebsite">Website</button></div></div>'+
      '<div class="actions"><button class="secondary" id="restBack">Back</button><button class="maybe" id="restMaybe">Maybe</button><button class="cut" id="restCut">Cut</button><button class="secondary" id="restHide">Hide</button></div>';
    const current = rows[S.restaurantIndex];
    $('restBack').onclick = restaurantBack;
    $('restMaybe').onclick = () => restaurantMaybe(current);
    $('restCut').onclick = () => restaurantCut(current);
    $('restHide').onclick = () => restaurantHide(current);
    $('restDetails').onclick = () => detailsSheet(current, 'restaurant');
    $('restWebsite').onclick = () => current.website ? window.open(current.website, '_blank', 'noopener') : alert('No website is listed for this restaurant.');
    bindRestaurantSwipe();
  }

  function restaurantCut(row) {
    S.restaurantActions.push({type:'cut', id:row.id, index:S.restaurantIndex});
    row._cut = true;
    const remaining = restaurantPoolFiltered();
    if (remaining.length === 1) winner(remaining[0]);
    else if (!remaining.length) drawRestaurants();
    else { S.restaurantIndex = Math.min(S.restaurantIndex, remaining.length - 1); drawRestaurants(); }
    save();
  }

  function restaurantMaybe(row) {
    S.restaurantActions.push({type:'maybe', id:row.id, index:S.restaurantIndex});
    row._maybe = true;
    const remaining = restaurantPoolFiltered();
    if (remaining.length === 1) winner(remaining[0]);
    else if (!remaining.length) drawRestaurants();
    else { S.restaurantIndex = Math.min(S.restaurantIndex, remaining.length - 1); drawRestaurants(); }
    save();
  }

  function restaurantBack() {
    const action = S.restaurantActions.pop();
    if (!action) { home(); return; }
    const row = S.restaurantPool.find(x => x.id === action.id);
    if (row) {
      if (action.type === 'cut') row._cut = false;
      if (action.type === 'maybe') row._maybe = false;
    }
    S.restaurantIndex = action.index || 0;
    drawRestaurants();
    save();
  }

  function restaurantHide(row) {
    if (!confirm('Hide '+row.name+' until you restore it in Settings?')) return;
    row._hidden = true;
    S.hiddenRestaurants[row.id] = {
      id:row.id,name:row.name,photo:row.photo||row.image||'',category:restaurantCategory(row),
      address:row.address||'',website:row.website||''
    };
    drawRestaurants();
    save();
  }

  function bindRestaurantSwipe() {
    const card = $('restaurantCard');
    if (!card) return;
    let downX = 0;
    card.onpointerdown = e => { downX = e.clientX; try { card.setPointerCapture(e.pointerId); } catch {} };
    card.onpointerup = e => {
      const dx = e.clientX - downX;
      if (Math.abs(dx) > 90) dx < 0 ? $('restCut').click() : $('restMaybe').click();
    };
  }

  function renderHours() {
    const btn = $('hoursToggle');
    if (btn) btn.textContent = S.hoursMode === 'openUnknown' ? 'Open/Unknown Hours' : 'Closed';
  }

  function bindRestaurantTools() {
    $('restaurantSearch').onclick = () => {
      const box = $('restaurantSearchBox');
      box.classList.toggle('hidden');
      $('restaurantQuery').value = S.restaurantQuery;
      if (!box.classList.contains('hidden')) $('restaurantQuery').focus();
    };
    $('restaurantQuery').oninput = () => {
      S.restaurantQuery = $('restaurantQuery').value;
      S.restaurantIndex = 0;
      drawRestaurants();
      save();
    };
    $('hoursToggle').onclick = () => {
      S.hoursMode = S.hoursMode === 'openUnknown' ? 'closed' : 'openUnknown';
      renderHours();
      S.restaurantIndex = 0;
      drawRestaurants();
      save();
    };
  }

  function winner(item) {
    S.winnerItem = item;
    S.winnerType = S.screen === 'restaurant' ? 'restaurant' : 'food';
    recordHistory(item, S.winnerType);
    show('winner');
    $('winName').textContent = item.name;
    $('winImg').src = item.image || item.photo || HUNGRY_IMAGE;
    $('winImg').alt = item.name;
    save();
  }

  function openModal(id, title, body) {
    $(id)?.remove();
    $(id+'Bg')?.remove();
    const bg = document.createElement('div');
    bg.id = id+'Bg';
    bg.className = 'modal-bg';
    const modal = document.createElement('section');
    modal.id = id;
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-head"><h3>'+esc(title)+'</h3><button class="menu" data-close>×</button></div>'+body;
    document.body.append(bg, modal);
    const close = () => { modal.remove(); bg.remove(); };
    bg.onclick = close;
    modal.querySelector('[data-close]').onclick = close;
    return modal;
  }

  function detailsSheet(item, type) {
    const image = item.image || item.photo || HUNGRY_IMAGE;
    const category = type === 'restaurant' ? restaurantCategory(item) : item.category || '';
    const body = '<div class="detail-grid"><img class="history-detail-photo" src="'+esc(image)+'" alt="'+esc(item.name)+'"><h2 style="margin:12px 0 4px;font-size:29px;letter-spacing:-.04em">'+esc(item.name)+'</h2>'+
      '<p class="status">'+esc(item.address || category || '')+'</p>'+
      (item.cuisine ? '<p class="status">'+esc(item.cuisine)+'</p>' : '')+
      (item.opening_hours ? '<p class="status">Hours: '+esc(item.opening_hours)+'</p>' : type === 'restaurant' ? '<p class="status">Open/Unknown Hours</p>' : '')+
      (item.phone ? '<p class="status">Phone: '+esc(item.phone)+'</p>' : '')+
      ((item.menuItems||[]).length ? '<div class="panel"><b style="font-size:12px">Common menu items</b><p class="status">'+esc(item.menuItems.slice(0,8).join(' · '))+'</p></div>' : '')+
      '<div class="winner-actions" style="margin-top:12px"><button class="small" id="detailDone">Close</button>'+
      (item.website ? '<button class="cut" id="detailWeb">Website</button>' : '')+'</div></div>';
    const modal = openModal('detailsModal', 'Details', body);
    $('detailDone').onclick = () => { modal.remove(); $('detailsModalBg')?.remove(); };
    if ($('detailWeb')) $('detailWeb').onclick = () => window.open(item.website, '_blank', 'noopener');
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
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify((rows||[]).slice(0,120))); } catch {}
  }

  function historyView() {
    const history = readHistory();
    let cursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const render = () => {
      const y = cursor.getFullYear(), m = cursor.getMonth();
      const first = new Date(y,m,1).getDay(), last = new Date(y,m+1,0).getDate();
      let body = '<div class="history-calendar"><div class="cal-nav"><button class="text-btn" id="calPrev">‹</button><b>'+cursor.toLocaleString(undefined,{month:'long',year:'numeric'})+'</b><button class="text-btn" id="calNext">›</button></div><div class="cal-grid cal-grid-20">';
      ['S','M','T','W','T','F','S'].forEach(d => body += '<span class="cal-d">'+d+'</span>');
      for(let i=0;i<first;i++) body += '<span></span>';
      for(let day=1;day<=last;day++) {
        const key = y+'-'+String(m+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
        const entry = history.find(x => x.date === key);
        body += '<div class="cal-cell">'+
          (entry ? '<button class="cal-day has" data-history-date="'+key+'"><b>'+day+'</b><img src="'+esc(entry.image)+'" alt=""></button><button class="cal-x" data-history-delete="'+key+'" aria-label="Remove history for '+key+'">×</button>' :
            '<div class="cal-day"><b>'+day+'</b></div>')+'</div>';
      }
      body += '</div></div><div class="history-list">';
      body += history.length ? history.slice(0,30).map(x => '<button class="history-row history-open" data-history-id="'+esc(x.id)+'"><img src="'+esc(x.image)+'" alt=""><span><b>'+esc(x.name)+'</b><small>'+esc(x.date)+' · '+esc(x.type)+'</small></span></button>').join('') : '<p class="status">No history yet.</p>';
      body += '</div>';
      const modal = openModal('historyModal','History',body);
      $('calPrev').onclick = () => { cursor = new Date(y,m-1,1); modal.remove(); $('historyModalBg')?.remove(); render(); };
      $('calNext').onclick = () => { cursor = new Date(y,m+1,1); modal.remove(); $('historyModalBg')?.remove(); render(); };
      modal.querySelectorAll('[data-history-id]').forEach(btn => btn.onclick = () => {
        const row = history.find(x => x.id === btn.dataset.historyId);
        if (row) detailsSheet(row, row.type);
      });
      modal.querySelectorAll('[data-history-date]').forEach(btn => btn.onclick = () => {
        const row = history.find(x => x.date === btn.dataset.historyDate);
        if (row) detailsSheet(row, row.type);
      });
      modal.querySelectorAll('[data-history-delete]').forEach(btn => btn.onclick = () => {
        writeHistory(history.filter(x => x.date !== btn.dataset.historyDelete));
        modal.remove(); $('historyModalBg')?.remove(); render();
      });
    };
    render();
  }

  function manageFoodsView() {
    const rows = allFoods();
    const body = '<form class="add" id="foodAddForm"><input id="newFoodName" placeholder="Food name" required><select id="newFoodCat"><option>American</option><option>Southern</option><option>Asian</option><option>Mexican</option><option>Pasta</option><option>Pork</option><option>Healthy</option><option>Breakfast</option><option>Soup</option><option>Greek</option><option>Snack</option></select><button class="cut">Add Food</button></form><div class="food-list">'+rows.map(item => {
      const hidden = S.hidden.has(item.id);
      const custom = S.custom.some(x => x.id === item.id);
      return '<div class="food-row"><span>'+esc(item.name)+'</span><span class="food-row-actions">'+
        (hidden ? '<button class="restore" data-food-restore="'+esc(item.id)+'">Restore</button>' : '<button class="restore" data-food-hide="'+esc(item.id)+'">Hide</button>')+
        (custom ? '<button class="restore danger-lite" data-food-delete="'+esc(item.id)+'">Delete</button>' : '')+
        '</span></div>';
    }).join('')+'</div>';
    const modal = openModal('manageFoodsModal','Manage Foods',body);
    $('foodAddForm').onsubmit = e => {
      e.preventDefault();
      const name = $('newFoodName').value.trim();
      if (!name) return;
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
      if (allFoods().some(x => x.id === id)) return;
      S.custom.push({id,name,primary:id,category:$('newFoodCat').value,image:HUNGRY_IMAGE});
      buildFood();
      save();
      modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView();
    };
    modal.querySelectorAll('[data-food-restore]').forEach(btn => btn.onclick = () => { S.hidden.delete(btn.dataset.foodRestore); buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView(); });
    modal.querySelectorAll('[data-food-hide]').forEach(btn => btn.onclick = () => { S.hidden.add(btn.dataset.foodHide); buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView(); });
    modal.querySelectorAll('[data-food-delete]').forEach(btn => btn.onclick = () => {
      if (!confirm('Delete this custom food permanently?')) return;
      S.custom = S.custom.filter(x => x.id !== btn.dataset.foodDelete);
      S.hidden.delete(btn.dataset.foodDelete);
      buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView();
    });
  }

  function settingsView() {
    const hiddenFoods = allFoods().filter(x => S.hidden.has(x.id));
    const hiddenRestaurants = Object.values(S.hiddenRestaurants);
    const body = '<div class="settings-stack"><h4>Hidden Choices</h4><div>'+
      (hiddenFoods.length ? hiddenFoods.map(x => '<div class="food-row"><span>'+esc(x.name)+'</span><button class="restore" data-setting-food="'+esc(x.id)+'">Restore</button></div>').join('') : '<p class="status">No hidden foods.</p>')+
      '</div><h4>Hidden Restaurants</h4><div>'+
      (hiddenRestaurants.length ? hiddenRestaurants.map(x => '<div class="food-row"><span>'+esc(x.name)+'</span><button class="restore" data-setting-rest="'+esc(x.id)+'">Restore</button></div>').join('') : '<p class="status">No hidden restaurants.</p>')+
      '</div><h4>System</h4><button class="secondary" id="systemRestore" style="width:100%;min-height:46px;border-radius:13px">System Restore</button><p class="status">Restores the default food list and clears saved round changes.</p></div>';
    const modal = openModal('settingsModal','Settings',body);
    modal.querySelectorAll('[data-setting-food]').forEach(btn => btn.onclick = () => { S.hidden.delete(btn.dataset.settingFood); save(); modal.remove(); $('settingsModalBg')?.remove(); settingsView(); });
    modal.querySelectorAll('[data-setting-rest]').forEach(btn => btn.onclick = () => { const id = btn.dataset.settingRest; delete S.hiddenRestaurants[id]; const row = S.restaurantPool.find(x => x.id === id); if(row) row._hidden = false; save(); modal.remove(); $('settingsModalBg')?.remove(); settingsView(); });
    $('systemRestore').onclick = () => {
      if (!confirm('Restore the default Dinliminate setup and clear saved round changes?')) return;
      S.hidden.clear(); S.hiddenRestaurants = {}; S.custom = []; S.cutCats.clear(); S.cutPrimary.clear(); S.maybe.clear(); S.pool = []; S.restaurantPool=[]; S.restaurantCuts.clear(); S.restaurantActions=[]; S.foodActions=[]; S.index=0; S.restaurantIndex=0; S.restaurantQuery=''; S.location=null; S.saved=false; S.winnerItem=null; S.pass=null;
      try { localStorage.removeItem(KEY); } catch {}
      home(); updateContinue();
      modal.remove(); $('settingsModalBg')?.remove();
    };
  }

  function aboutView() {
    openModal('aboutModal','About Dinliminate','<div class="info-copy"><h4>Dinliminate</h4><p>Cut the dinner choices until one survives.</p><p class="status">Made by Brian Dunn for Devona Dunn.</p></div>');
  }

  function iphoneHelp() {
    openModal('iphoneModal','How to add to iPhone','<div class="info-copy"><p>Open Dinliminate in Safari on your iPhone.</p><p>Tap the Share button, then choose <b>Add to Home Screen</b>.</p><p>Tap <b>Add</b>. Dinliminate will appear on your Home Screen like an app.</p></div>');
  }

  function shareWinner() {
    if (!S.winnerItem) return;
    const text = 'Tonight: '+S.winnerItem.name;
    if (navigator.share) navigator.share({title:'Dinliminate',text}).catch(()=>{});
    else navigator.clipboard?.writeText(text).then(()=>alert('Decision copied to clipboard.')).catch(()=>{});
  }

  function startOver() {
    S.pass = null; S.winnerItem = null; S.winnerType='food'; S.foodActions=[]; S.restaurantActions=[];
    S.maybe.clear(); S.cutCats.clear(); S.cutPrimary.clear(); S.restaurantCuts.clear();
    S.pool=[]; S.restaurantPool=[]; S.index=0; S.restaurantIndex=0; S.saved=false;
    try { localStorage.removeItem(KEY); } catch {}
    home();
  }

  function passCandidates() {
    return S.screen === 'restaurant' ? restaurantPoolFiltered() : S.pool;
  }

  function passSetup() {
    const counts = [2,3,4,5,6,7,8];
    const body = '<div class="pass-setup"><p class="status">Each person gets a turn on every choice. One Cut removes the choice; only choices everyone keeps survive the pass.</p><label class="pass-label">People</label><div class="pass-counts">'+counts.map(n => '<button class="chip pass-count '+(S.passDraftCount===n?'selected':'')+'" data-pass-count="'+n+'">'+n+'</button>').join('')+'</div><div id="passNames"></div><button class="cut" id="passBegin" style="width:100%;margin-top:12px;min-height:48px;border-radius:14px">Start Pass Around</button></div>';
    const modal = openModal('passSetup','Pass Around',body);
    const renderNames = () => {
      $('passNames').innerHTML = '<div class="pass-name-grid">'+Array.from({length:S.passDraftCount},(_,i)=>'<input class="pass-name" data-pass-name="'+i+'" placeholder="Person '+(i+1)+'" maxlength="24">').join('')+'</div>';
      document.querySelectorAll('[data-pass-name]').forEach((x,i) => x.value = S.passDraftNames[i] || '');
      document.querySelectorAll('[data-pass-count]').forEach(x => x.classList.toggle('selected', Number(x.dataset.passCount)===S.passDraftCount));
    };
    renderNames();
    document.querySelectorAll('[data-pass-count]').forEach(btn => btn.onclick = () => { S.passDraftCount=Number(btn.dataset.passCount); renderNames(); });
    $('passBegin').onclick = () => {
      S.passDraftNames = [...document.querySelectorAll('[data-pass-name]')].map((x,i)=>x.value.trim() || 'Person '+(i+1));
      const pool = passCandidates();
      if (!pool.length) { modal.remove(); $('passSetupBg')?.remove(); alert('There are no choices left to pass around.'); return; }
      S.pass = {type:S.screen==='restaurant'?'restaurant':'food', players:S.passDraftNames, choiceIndex:0, voterIndex:0, history:[], poolIds:pool.map(x=>x.id)};
      modal.remove(); $('passSetupBg')?.remove();
      drawPass();
    };
  }

  function currentPassItem() {
    const id = S.pass?.poolIds?.[S.pass.choiceIndex];
    return passCandidates().find(x => x.id === id);
  }

  function drawPass() {
    const p = S.pass;
    if (!p) return;
    if (p.choiceIndex >= p.poolIds.length) return finishPass();
    const item = currentPassItem();
    if (!item) { p.choiceIndex++; p.voterIndex=0; return drawPass(); }
    const voter = p.players[p.voterIndex] || 'Next person';
    const body = '<div class="pass-view"><div class="pass-progress"><span>Choice '+(p.choiceIndex+1)+' of '+p.poolIds.length+'</span><span>'+(p.voterIndex+1)+' / '+p.players.length+'</span></div><img class="pass-photo" src="'+esc(item.image||item.photo||HUNGRY_IMAGE)+'" alt="'+esc(item.name)+'"><h2>'+esc(item.name)+'</h2><p class="status">Pass to <strong style="color:#eee">'+esc(voter)+'</strong>. Keep or cut this choice.</p><div class="pass-actions"><button class="secondary" id="passBack">Back</button><button class="maybe" id="passKeep">Keep</button><button class="cut" id="passCut">Cut</button></div><button class="text-btn" id="passEnd">End Pass & keep survivors</button></div>';
    const modal = openModal('passModal','Pass Around',body);
    $('passBack').onclick = passUndo;
    $('passKeep').onclick = () => passVote(true);
    $('passCut').onclick = () => passVote(false);
    $('passEnd').onclick = () => endPass();
    modal.querySelector('[data-close]').onclick = () => endPass();
  }

  function passVote(keep) {
    const p = S.pass, item = currentPassItem();
    if (!p || !item) return;
    p.history.push({choiceIndex:p.choiceIndex,voterIndex:p.voterIndex,choiceId:item.id,keep});
    if (!keep) {
      p.poolIds = p.poolIds.filter(id => id !== item.id);
      if (p.poolIds.length === 1) return finishPass();
      p.choiceIndex = Math.min(p.choiceIndex, Math.max(0,p.poolIds.length-1));
      p.voterIndex=0;
      drawPass();
      return;
    }
    if (p.voterIndex < p.players.length-1) { p.voterIndex++; drawPass(); return; }
    p.choiceIndex++; p.voterIndex=0; drawPass();
  }

  function passUndo() {
    const p = S.pass;
    if (!p?.history?.length) return;
    const last = p.history.pop();
    if (!last.keep && last.choiceId && !p.poolIds.includes(last.choiceId)) p.poolIds.splice(Math.min(last.choiceIndex,p.poolIds.length),0,last.choiceId);
    p.choiceIndex=last.choiceIndex;
    p.voterIndex=last.voterIndex;
    drawPass();
  }

  function finishPass() {
    const p = S.pass;
    if (!p) return;
    const rows = p.poolIds.map(id => passCandidates().find(x=>x.id===id)).filter(Boolean);
    S.pass=null;
    $('passModal')?.remove(); $('passModalBg')?.remove();
    if (rows.length === 1) { winner(rows[0]); return; }
    if (!rows.length) { winner({name:'Nothing left — hungry mode',image:HUNGRY_IMAGE,category:'Hungry'}); return; }
    if (S.screen === 'restaurant') {
      S.restaurantPool = S.restaurantPool.filter(x => rows.some(r=>r.id===x.id));
      S.restaurantIndex=0;
      drawRestaurants();
    } else {
      S.pool = rows; S.index=0; drawFood();
    }
    save();
  }

  function endPass() {
    const p=S.pass;
    if (!p) return;
    const rows=p.poolIds.map(id => passCandidates().find(x=>x.id===id)).filter(Boolean);
    S.pass=null;
    $('passModal')?.remove(); $('passModalBg')?.remove();
    if (S.screen==='restaurant') { S.restaurantPool=S.restaurantPool.filter(x=>rows.some(r=>r.id===x.id)); S.restaurantIndex=0; drawRestaurants(); }
    else { S.pool=rows; S.index=0; drawFood(); }
    save();
  }

  $('foodStart').onclick = startFood;
  $('restStart').onclick = openRestaurant;
  $('foodCut').onclick = () => foodCut();
  $('foodMaybe').onclick = () => foodMaybe();
  $('foodBack').onclick = foodBack;
  $('foodHide').onclick = foodHide;
  $('addFood').onclick = manageFoodsView;
  $('randomOne').onclick = randomCutOne;
  $('foodPassAround').onclick = passSetup;
  $('restaurantPassAround').onclick = passSetup;
  document.querySelectorAll('[data-home]').forEach(btn => btn.onclick = home);

  $('menu').onclick = () => { $('drawer').classList.remove('hidden'); $('drawerBg').classList.remove('hidden'); };
  $('drawerClose').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); };
  $('drawerBg').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); };
  $('manage').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); manageFoodsView(); };
  $('settings').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); settingsView(); };
  $('about').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); aboutView(); };
  $('history').onclick = () => { $('drawer').classList.add('hidden'); $('drawerBg').classList.add('hidden'); historyView(); };
  $('iphoneHelp').onclick = iphoneHelp;

  $('locate').onclick = useLocation;
  $('find').onclick = searchRestaurants;
  $('address').addEventListener('input', () => { S.location=null; suggestAddresses(); });
  $('address').addEventListener('focus', () => { if ($('address').value.trim().length>=2) suggestAddresses(); });
  $('address').addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();clearSuggestions();searchRestaurants();} if(e.key==='Escape') clearSuggestions(); });

  bindRestaurantTools();
  renderHours();

  $('details').onclick = () => S.winnerItem && detailsSheet(S.winnerItem, S.winnerType || 'food');
  $('share').onclick = shareWinner;
  $('restart').onclick = startOver;



  S.saved = load() || false;
  if (S.saved && S.screen === 'food' && S.pool.length) {
    show('food'); foodQuick(); drawFood();
  } else if (S.saved && S.screen === 'restaurant' && S.restaurantPool.length) {
    show('restaurant'); restaurantQuick(); renderHours(); drawRestaurants();
  } else {
    home();
  }
  updateContinue();
})();