/* Dinliminate app — single-source implementation. */
(() => {
  'use strict';

  const getDefaultFoods = () => Array.isArray(window.DINLIMINATE_FOODS) ? window.DINLIMINATE_FOODS : [];
  const $ = (id) => document.getElementById(id);
  const KEY = 'dinliminate.clean.cp1';
  const HISTORY_KEY = 'dinliminate.clean.history';
  const APP_VERSION = '1.0';
  const APP_BUILD = '111';
  const HUNGRY_IMAGE = 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" rx="52" fill="#090909"/><circle cx="600" cy="400" r="170" fill="none" stroke="#f5f1e8" stroke-width="18"/><circle cx="535" cy="365" r="14" fill="#f5f1e8"/><circle cx="665" cy="365" r="14" fill="#f5f1e8"/><path d="M515 495c52-62 118-62 170 0" fill="none" stroke="#f5f1e8" stroke-width="18" stroke-linecap="round"/></svg>');
  const FOOD_QUICK = ['Southern','Pasta','Asian','Mexican','Pork','Soup/Stew','Healthy','Breakfast','American','Greek','Snack','Potato'];
  const REST_QUICK = ['American','Fast Food','Mexican','Asian','Pasta','Southern','Healthy','Soup/Stew','Potato','Greek','Pork','BBQ'];

  const QUICK_IMAGES = {
    Southern:'https://images.pexels.com/photos/2397401/pexels-photo-2397401.jpeg?auto=compress&cs=tinysrgb&w=700', // Meatloaf & Mashed Potatoes
    Pasta:'https://images.pexels.com/photos/6287520/pexels-photo-6287520.jpeg?auto=compress&cs=tinysrgb&w=700', // Spaghetti
    Asian:'https://images.pexels.com/photos/32845321/pexels-photo-32845321.jpeg?auto=compress&cs=tinysrgb&w=700', // Fried Rice
    Mexican:'https://images.pexels.com/photos/12317911/pexels-photo-12317911.jpeg?auto=compress&cs=tinysrgb&w=700', // Tacos / Mexican Stir Fry family
    Pork:'https://images.pexels.com/photos/332784/pexels-photo-332784.jpeg?auto=compress&cs=tinysrgb&w=700', // Pork Chops
    'Soup/Stew':'https://www.cooksoups.com/assets/images/potato-bacon-soup.jpg', // Potato Soup
    Healthy:'https://images.pexels.com/photos/11906476/pexels-photo-11906476.jpeg?auto=compress&cs=tinysrgb&w=700', // Salad Bowl
    Breakfast:'https://commons.wikimedia.org/wiki/Special:FilePath/Eggs%20and%20bacon.jpg?width=700', // Bacon & Eggs
    American:'https://images.pexels.com/photos/12034622/pexels-photo-12034622.jpeg?auto=compress&cs=tinysrgb&w=700', // Burger
    Greek:'https://images.pexels.com/photos/6941006/pexels-photo-6941006.jpeg?auto=compress&cs=tinysrgb&w=700', // Gyro
    Snack:'https://images.unsplash.com/photo-1578849278619-7d347d3ed1f8?auto=format&fit=crop&w=700&q=85', // Popcorn
    Potato:'https://snapcalorie-webflow-website.s3.us-east-2.amazonaws.com/media/food_pics_v2/medium/loaded_baked_potato.jpg' // Loaded Baked Potato
  };

  const REST_QUICK_IMAGES = {
    American:'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=700',
    'Fast Food':'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=700',
    Mexican:'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=700',
    Asian:'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=700',
    Pasta:'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=700',
    Southern:'https://images.pexels.com/photos/2397401/pexels-photo-2397401.jpeg?auto=compress&cs=tinysrgb&w=700',
    Healthy:'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=700',
    'Soup/Stew':'https://www.cooksoups.com/assets/images/potato-bacon-soup.jpg',
    Potato:'https://images.pexels.com/photos/1442066/pexels-photo-1442066.jpeg?auto=compress&cs=tinysrgb&w=700',
    Greek:'https://images.pexels.com/photos/8951199/pexels-photo-8951199.jpeg?auto=compress&cs=tinysrgb&w=700',
    Pork:'https://images.pexels.com/photos/332784/pexels-photo-332784.jpeg?auto=compress&cs=tinysrgb&w=700',
    BBQ:'https://images.pexels.com/photos/6672037/pexels-photo-6672037.jpeg?auto=compress&cs=tinysrgb&w=700'
  };

  const S = {
    screen:'home',
    hidden:new Set(),
    deleted:new Set(),
    hiddenRestaurants:{},
    cutCats:new Set(),
    cutPrimary:new Set(),
    foodCuts:new Set(),
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
  const removeAllById = (id) => document.querySelectorAll('#'+id).forEach(el => el.remove());
  const removeFoodOverlays = () => ['manageFoodsModal','manageFoodsModalBg','foodEditorModal','foodEditorModalBg'].forEach(removeAllById);
  const uniq = (a) => [...new Map((a || []).filter(Boolean).map(x => [String(x.id || x.name), x])).values()];
  const allFoods = () => [...getDefaultFoods(), ...S.custom];

  function save() {
    const data = {
      screen:S.screen, hidden:[...S.hidden], deleted:[...S.deleted], hiddenRestaurants:S.hiddenRestaurants,
      cutCats:[...S.cutCats], cutPrimary:[...S.cutPrimary], foodCuts:[...S.foodCuts], maybe:[...S.maybe],
      custom:S.custom, pool:S.pool, index:S.index, foodActions:S.foodActions,
      restaurantPool:S.restaurantPool, restaurantIndex:S.restaurantIndex,
      restaurantCuts:[...S.restaurantCuts], restaurantActions:S.restaurantActions,
      restaurantQuery:S.restaurantQuery, hoursMode:S.hoursMode, location:S.location,
      saved:S.saved, winnerItem:S.winnerItem, pass:S.pass,
      passDraftCount:S.passDraftCount, passDraftNames:S.passDraftNames
    };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
    S.saved = true;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      Object.assign(S, d);
      S.hidden = new Set(d.hidden || []);
      S.deleted = new Set(d.deleted || []);
      S.hiddenRestaurants = d.hiddenRestaurants || {};
      S.cutCats = new Set(d.cutCats || []);
      S.foodCuts = new Set(d.foodCuts || []);
      if (!S.foodCuts.size && Array.isArray(d.foodActions)) for (const a of d.foodActions) if (a?.type === 'cut' && a.id) S.foodCuts.add(a.id);
      // Retire the legacy primary-wide Cut state after migrating saved rounds to exact IDs.
      S.cutPrimary = new Set();
      S.maybe = new Set(d.maybe || []);
      S.restaurantCuts = new Set(d.restaurantCuts || []);
      S.hoursMode = d.hoursMode === 'all' ? 'all' : 'openUnknown';
      S.foodActions = Array.isArray(d.foodActions) ? d.foodActions : [];
      S.restaurantActions = Array.isArray(d.restaurantActions) ? d.restaurantActions : [];
      S.restaurantPool = Array.isArray(d.restaurantPool) ? d.restaurantPool : [];
      S.custom = Array.isArray(d.custom) ? d.custom : [];
      S.passDraftNames = Array.isArray(d.passDraftNames) ? d.passDraftNames : [];
      S.winnerType = d.winnerType || 'food';
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
    // Drawer and the legacy base modal are permanent DOM elements; hide them instead of deleting them.
    ['drawer','drawerBg','modal','modalBg'].forEach(id => $(id)?.classList.add('hidden'));
    ['manageFoodsModal','manageFoodsModalBg','foodEditorModal','foodEditorModalBg','settingsModal','settingsModalBg','historyModal','historyModalBg','aboutModal','aboutModalBg','iphoneModal','iphoneModalBg','detailsModal','detailsModalBg','passSetup','passSetupBg','passModal','passModalBg'].forEach(id => $(id)?.remove());
    clearSuggestions();
  }

  function home() {
    closeOverlays();
    S.screen = 'home';
    show('home');
  }

  function foodPool() {
    return allFoods().filter(item => {
      if (S.hidden.has(item.id) || S.deleted.has(item.id) || S.maybe.has(item.id)) return false;
      if (S.foodCuts.has(item.id)) return false;
      // Legacy rounds may still carry primary-based cuts; new rounds use exact item IDs.
      if (S.cutPrimary.has(item.primary)) return false;
      const cuts = Array.isArray(item.quickCuts) ? item.quickCuts : [item.category];
      if ([...S.cutCats].some(label => cuts.includes(label))) return false;
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
    S.foodCuts.clear();
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
    const next = S.pool[S.index + 1];
    const nextCard = $('foodNextCard');
    if (nextCard) {
      nextCard.classList.toggle('hidden', !next);
      if (next) {
        $('foodNextImg').src = next.image;
        $('foodNextImg').alt = next.name;
        nextCard.style.transform = 'scale(.96)';
      }
    }
    bindFoodSwipe();
    $('foodDetails').onclick = () => detailsSheet(item, 'food');
  }

  function foodCommit(type, item) {
    S.foodActions.push({type, id:item.id, primary:item.primary, index:S.index});
  }

  function foodCut(item = S.pool[S.index]) {
    if (!item) return;
    foodCommit('cut', item);
    S.foodCuts.add(item.id);
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
    if (!S.pool.length) {
      winner({name:'Nothing left — hungry mode', image:HUNGRY_IMAGE, category:'Hungry'});
    } else {
      // Keep the final choice on-screen so the user can still Cut it.
      S.index = Math.min(S.index, S.pool.length - 1);
      drawFood();
    }
    save();
  }

  function foodBack() {
    const action = S.foodActions.pop();
    if (!action) { home(); return; }
    if (action.type === 'cut') {
      S.foodCuts.delete(action.id);
      S.cutPrimary.delete(action.primary); // legacy primary-based rounds
    }
    if (action.type === 'maybe') S.maybe.delete(action.id);
    buildFood();
    const restoredIndex = S.pool.findIndex(x => x.id === action.id);
    S.index = restoredIndex >= 0 ? restoredIndex : Math.max(0, Math.min(action.index || 0, Math.max(0, S.pool.length - 1)));
    foodQuick();
    drawFood();
    save();
  }

  function bindFoodSwipe() {
    const card = $('foodCard');
    if (!card) return;
    let downX = 0, active = false;
    const next=$('foodNextCard');
    const reset=()=>{card.style.transform='';card.style.opacity='';card.dataset.swipe='';if(next)next.style.transform='scale(.96)';};
    card.onpointerdown = e => {
      if (e.target.closest('button,a,input,select')) return;
      downX = e.clientX; active = true;
      try { card.setPointerCapture(e.pointerId); } catch {}
    };
    card.onpointermove = e => {
      if(!active) return;
      const dx=e.clientX-downX;
      if(Math.abs(dx)>8){
        card.style.transform='translateX('+dx+'px) rotate('+(dx/22)+'deg)';
        card.style.opacity=String(Math.max(.76,1-Math.abs(dx)/900));
        card.dataset.swipe=dx<0?'cut':'maybe';
        if(next) next.style.transform='scale('+Math.min(1,.96+Math.abs(dx)/1400)+')';
        if(next) next.style.transform='scale('+Math.min(1,.96+Math.abs(dx)/1400)+')';
      }
    };
    card.onpointerup = e => {
      if(!active)return;
      active=false;
      const dx=e.clientX-downX;
      if(Math.abs(dx)>90) {
        card.style.transition='transform .16s ease,opacity .16s ease';
        card.style.transform='translateX('+(dx<0?-520:520)+'px) rotate('+(dx<0?-18:18)+'deg)';
        setTimeout(()=>{reset();dx<0 ? $('foodCut').click() : $('foodMaybe').click();},110);
      } else { reset(); }
    };
    card.onpointercancel=()=>{active=false;reset();};
  }

  function foodHideItem(item) {
    if (!item) return false;
    if (!confirm('Hide '+item.name+' until you restore it in Settings?')) return false;
    S.hidden.add(item.id);
    buildFood();
    S.index = Math.min(S.index, Math.max(0, S.pool.length - 1));
    drawFood();
    save();
    return true;
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
    if (!S.pool.length) return;
    const item = S.pool[Math.floor(Math.random() * S.pool.length)];
    foodCut(item);
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

  
/* CP29: lightweight opening-hours interpreter */
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
      row.name,row.brand,row.operator,row.category,row.cuisine,restaurantCategory(row),
      ...(Array.isArray(row.menuItems) ? row.menuItems : [])
    ].filter(Boolean).join(' ').toLowerCase();
    return q.split(/\s+/).every(term => hay.includes(term));
  }

  function restaurantPoolFiltered() {
    return (S.restaurantPool || []).filter(row => {
      if ([...S.restaurantCuts].some(label => restaurantQuickMatches(row, label))) return false;
      if (row._maybe || row._cut || row._hidden) return false;
      if (S.hiddenRestaurants[row.id]) return false;
      if (S.hoursMode === 'openUnknown' && explicitClosed(row)) return false;
      return restaurantMatchesQuery(row);
    });
  }

  function restaurantQuick() {
    $('restQuick').innerHTML = REST_QUICK.map(label => {
      const cut = S.restaurantCuts.has(label);
      return '<button class="chip photo-chip '+(cut?'cut':'')+'" data-rest-quick="'+esc(label)+'" style="background-image:linear-gradient(#0005,#0008),url("'+(REST_QUICK_IMAGES[label] || REST_QUICK_IMAGES.American)+'")"><span>'+esc(label)+'</span></button>';
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
        const r = await fetch('/api/restaurant-search?mode=reverse&lat='+encodeURIComponent(pos.coords.latitude)+'&lon='+encodeURIComponent(pos.coords.longitude));
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
  let suggestSeq = 0;
  async function suggestAddresses() {
    const q = $('address').value.trim();
    const seq = ++suggestSeq;
    if (q.length < 2) { clearSuggestions(); $('status').textContent = 'Enter an address or use your location.'; return; }
    $('status').textContent = 'Searching addresses…';
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(async () => {
      try {
        const r = await fetch('/api/restaurant-search?mode=suggest&q='+encodeURIComponent(q));
        const d = await r.json();
        if (seq !== suggestSeq) return;
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
      btn.onclick = async () => {
        const row = rows[i];
        setLocation(row.lat, row.lon, row.display);
        clearSuggestions();
        $('status').textContent = 'Location selected. Searching restaurants…';
        await searchRestaurants();
      };
    });
  }

  function clearSuggestions() {
    const box = $('suggestionsBox');
    if (box) box.style.display = 'none';
  }

  let restaurantSearchSeq = 0;
  async function searchRestaurants() {
    const searchSeq = ++restaurantSearchSeq;
    clearSuggestions();
    $('status').textContent = 'Searching restaurants…';
    try {
      let loc = S.location;
      if (!loc) {
        const q = $('address').value.trim();
        if (!q) { $('status').textContent = 'Enter an address or use your location.'; return; }
        const rr = await fetch('/api/restaurant-search?mode=resolve&q='+encodeURIComponent(q));
        const rd = await rr.json();
        if (searchSeq !== restaurantSearchSeq) return;
        if (!rr.ok || !rd.ok) throw new Error(rd.message || 'Could not locate that address.');
        loc = {lat:rd.lat, lon:rd.lon, label:rd.display};
        S.location = loc;
        $('address').value = rd.display;
      }
      const radius = Number($('radius').value) || 10;
      const rr = await fetch('/api/restaurant-search?mode=search&lat='+encodeURIComponent(loc.lat)+'&lon='+encodeURIComponent(loc.lon)+'&radius='+radius);
      const d = await rr.json();
      if (searchSeq !== restaurantSearchSeq) return;
      if (!rr.ok || !d.ok) throw new Error(d.message || 'Restaurant search failed.');
      S.restaurantPool = uniq((d.results || []).map(row => ({...row, _maybe:false, _cut:false, _hidden:false})));
      S.restaurantIndex = 0;
      S.restaurantActions = [];
      S.restaurantCuts.clear();
      S.restaurantQuery = '';
      S.hoursMode = 'openUnknown';
      renderHours();
      S.winnerItem = null;
      $('status').textContent = d.total ? (d.total+' restaurants found'+(d.fastFoodCount ? ' · '+d.fastFoodCount+' fast food' : '')) : 'No restaurants found in this radius.';
      restaurantQuick();
      drawRestaurants();
      save();
    } catch (err) {
      if (searchSeq !== restaurantSearchSeq) return;
      S.restaurantPool = [];
      S.restaurantIndex = 0;
      S.restaurantActions = [];
      S.restaurantCuts.clear();
      drawRestaurants();
      $('status').textContent = err?.message || 'Could not complete the search.';
    }
  }

  function openRestaurant() {
    S.screen = 'restaurant';
    S.restaurantActions = [];
    S.restaurantQuery = '';
    S.restaurantCuts.clear();
    S.hoursMode = 'openUnknown';
    S.winnerItem = null;
    show('restaurant');
    restaurantQuick();
    renderHours();
    $('restaurantSearchBox')?.classList.add('hidden');
    $('restaurantQuery').value = '';
  }

  function drawRestaurants() {
    const rows = restaurantPoolFiltered();
    const countEl = $('restaurantCount');
    if (countEl) countEl.textContent = rows.length + (rows.length === 1 ? ' choice' : ' choices');
    if (!rows.length) {
      $('restStage').innerHTML = '<div class="empty"><b>Hungry.</b><span>'+esc(S.restaurantPool.length ? 'No restaurants match the current cuts.' : 'Set a location, then find restaurants.')+'</span></div>';
      return;
    }
    S.restaurantIndex = Math.max(0, Math.min(S.restaurantIndex, rows.length - 1));
    const row = rows[S.restaurantIndex];
    const category = restaurantCategory(row);
    const restaurantFallback = (r) => {
      const s = String(r?.name||'').toLowerCase();
      if (/ruby tuesday/.test(s)) return 'https://s.wsj.net/public/resources/images/BN-VP628_31fHe_OR_20171016100013.jpg';
      if (/chipotle/.test(s)) return 'https://photos.zillowstatic.com/fp/524675e3749c32d6b928e285dabf619f-cc_ft_960.jpg';
      if (/thirsty goat/.test(s)) return 'https://pub-ba1a74be17d7442a9f2541946eb9510e.r2.dev/shops/4aa35af7-c5cd-4fa5-b3ff-d673c8c692ff/2.jpg';
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85';
    };
    const image = row.photo || row.image || restaurantFallback(row);
    const nextRow = rows[S.restaurantIndex + 1];
    const nextImage = nextRow?.photo || nextRow?.image || restaurantFallback(nextRow);
    const cardAddress = row.address ? '<div class="card-detail-line">'+esc(row.address)+'</div>' : '';
    const cardCuisine = row.cuisine ? '<div class="card-detail-line">'+esc(row.cuisine)+'</div>' : '';
    const cardCommon = Array.isArray(row.menuItems) && row.menuItems.length ? '<div class="card-detail-line common-line">'+esc(row.menuItems.slice(0,2).join(' · '))+'</div>' : '';
    const cardHours = '<span class="status-badge">'+(hourStatus(row)==='open'?'Open':hourStatus(row)==='closed'?'Closed':'Open/Unknown')+'</span>';
    $('restStage').innerHTML =
      '<div class="restaurant-card-stack"><article class="card next-card '+(nextRow?'':'hidden')+'" id="restaurantNextCard" aria-hidden="true"><img src="'+esc(nextImage)+'" alt="'+esc(nextRow?.name||'')+'"><div class="shade"></div></article><article class="card" id="restaurantCard"><img src="'+esc(image)+'" alt="'+esc(row.name)+'"><div class="shade"></div><div class="card-copy"><small>'+esc(category)+(row.distance != null ? ' · '+Number(row.distance).toFixed(1)+' mi' : '')+'</small><h3>'+esc(row.name)+'</h3>'+cardAddress+cardCuisine+cardCommon+'<div class="card-status">'+cardHours+'</div><button class="card-details" id="restDetails" type="button" aria-label="Details">i</button></div></article></div>'+
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
    bindCardButton('restHide', () => restaurantHide(current));
    bindCardButton('restDetails', () => detailsSheet(current, 'restaurant'));
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
    if (!row) return;
    const rowsBefore = restaurantPoolFiltered();
    if (rowsBefore.length === 1) {
      // A right-swipe/Maybe on the final restaurant means Keep it: it is the winner.
      winner(row);
      return;
    }
    S.restaurantActions.push({type:'maybe', id:row.id, index:S.restaurantIndex});
    row._maybe = true;
    const remaining = restaurantPoolFiltered();
    if (!remaining.length) drawRestaurants();
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
    const rows = restaurantPoolFiltered();
    const restoredIndex = rows.findIndex(x => x.id === action.id);
    S.restaurantIndex = restoredIndex >= 0 ? restoredIndex : Math.max(0, Math.min(action.index || 0, Math.max(0, rows.length - 1)));
    drawRestaurants();
    save();
  }

  function restaurantHide(row) {
    if (!row) return false;
    if (!confirm('Hide '+row.name+' until you restore it in Settings?')) return false;
    row._hidden = true;
    S.hiddenRestaurants[row.id] = {
      id:row.id,name:row.name,photo:row.photo||row.image||'',category:restaurantCategory(row),
      address:row.address||'',website:row.website||''
    };
    drawRestaurants();
    save();
    return true;
  }

  function bindRestaurantSwipe() {
    const card = $('restaurantCard');
    if (!card) return;
    let downX = 0, active = false;
    const next=$('restaurantNextCard');
    const reset=()=>{card.style.transform='';card.style.opacity='';card.dataset.swipe='';if(next)next.style.transform='scale(.96)';};
    card.onpointerdown = e => {
      downX = e.clientX; active = true;
      try { card.setPointerCapture(e.pointerId); } catch {}
    };
    card.onpointermove = e => {
      if(!active) return;
      const dx=e.clientX-downX;
      if(Math.abs(dx)>8){
        card.style.transform='translateX('+dx+'px) rotate('+(dx/22)+'deg)';
        card.style.opacity=String(Math.max(.76,1-Math.abs(dx)/900));
        card.dataset.swipe=dx<0?'cut':'maybe';
      }
    };
    card.onpointerup = e => {
      if(!active)return;
      active=false;
      const dx=e.clientX-downX;
      if(Math.abs(dx)>90) {
        card.style.transition='transform .16s ease,opacity .16s ease';
        card.style.transform='translateX('+(dx<0?-520:520)+'px) rotate('+(dx<0?-18:18)+'deg)';
        setTimeout(()=>{reset();dx<0 ? $('restCut').click() : $('restMaybe').click();},110);
      } else { reset(); }
    };
    card.onpointercancel=()=>{active=false;reset();};
  }

  function renderHours() {
    const btn = $('hoursToggle');
    if (btn) btn.textContent = S.hoursMode === 'openUnknown' ? 'Open/Unknown' : 'All';
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
      S.hoursMode = S.hoursMode === 'openUnknown' ? 'all' : 'openUnknown';
      renderHours();
      S.restaurantIndex = 0;
      drawRestaurants();
      save();
    };
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
    $('winImg').classList.toggle('hungry-image', hungry);
    $('winImg').src = item.image || item.photo || HUNGRY_IMAGE;
    $('winImg').alt = item.name || 'Hungry';
    if (!hungry) triggerCelebration(); else $('celebration')?.classList.add('hidden');
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
    const close = () => {
      modal.remove(); bg.remove();
      if (id === 'settingsModal') removeFoodOverlays();
      if (S.screen && $(S.screen)) show(S.screen);
    };
    bg.onclick = close;
    modal.querySelector('[data-close]').onclick = close;
    return modal;
  }

  function detailsSheet(item, type) {
    const image = item.image || item.photo || HUNGRY_IMAGE;
    const category = type === 'restaurant' ? restaurantCategory(item) : item.category || '';
    const nut = item.nutrition || {};
    const nutritionBlock = type === 'food' && item.nutrition ? '<div class="nutrition-card"><div class="detail-section-title">Typical nutrition</div><div class="nutrition-grid">'+
      '<div><b>'+esc(nut.calories)+' kcal</b><span>Calories</span></div>'+
      '<div><b>'+esc(nut.protein)+' g</b><span>Protein</span></div>'+
      '<div><b>'+esc(nut.carbs)+' g</b><span>Carbs</span></div>'+
      '<div><b>'+esc(nut.fat)+' g</b><span>Fat</span></div>'+
      '<div><b>'+esc(nut.sodium)+' mg</b><span>Sodium</span></div></div><p class="detail-note">'+esc(item.nutritionNote||'Typical estimate per serving.')+'</p></div>' : '';
    const ingredientsBlock = type === 'food' && Array.isArray(item.ingredients) && item.ingredients.length ? '<div class="detail-section"><div class="detail-section-title">Ingredients</div><p class="detail-body-copy">'+esc(item.ingredients.join(' · '))+'</p></div>' : '';
    const providerMenu = item.menuItems || item.commonMenuItems || item.common_menu_items || [];
    const menuItems = Array.isArray(providerMenu) ? providerMenu.filter(Boolean) : String(providerMenu||'').split(/[|,;·]/).map(x=>x.trim()).filter(Boolean);
    const menuBlock = type === 'restaurant' && menuItems.length ? '<div class="detail-section"><div class="detail-section-title">Common menu items</div><p class="detail-body-copy">'+esc(menuItems.slice(0,8).join(' · '))+'</p></div>' : '';
    const recipeBlock = item.recipe ? '<div class="detail-section"><div class="detail-section-title">Recipe / notes</div><p class="detail-body-copy">'+esc(item.recipe).replace(/\n/g,'<br>')+'</p></div>' : '';
    const restaurantMeta = type === 'restaurant' ? '<div class="detail-section restaurant-detail-summary"><div class="detail-section-title">Restaurant information</div><div class="restaurant-detail-grid">'+
      '<div><span>Category</span><b>'+esc(category)+'</b></div>'+
      (item.cuisine ? '<div><span>Cuisine</span><b>'+esc(item.cuisine)+'</b></div>' : '')+
      (item.distance != null ? '<div><span>Distance</span><b>'+Number(item.distance).toFixed(1)+' mi</b></div>' : '')+
      '<div><span>Hours</span><b>'+esc(item.opening_hours || 'Open/Unknown')+'</b></div>'+
      (item.phone ? '<div><span>Phone</span><b>'+esc(item.phone)+'</b></div>' : '')+
      (item.address ? '<div class="wide"><span>Address</span><b>'+esc(item.address)+'</b></div>' : '')+
      '</div></div>' : '';
    const body = '<div class="detail-grid"><img class="history-detail-photo" src="'+esc(image)+'" alt="'+esc(item.name)+'"><h2 style="margin:12px 0 4px;font-size:29px;letter-spacing:-.04em">'+esc(item.name)+'</h2>'+
      restaurantMeta+
      (type === 'restaurant' ? '' : '<p class="status">'+esc(item.category || '')+'</p>')+
      nutritionBlock+ingredientsBlock+menuBlock+recipeBlock+
      '<div class="detail-actions-row"><button class="detail-hide-action" id="detailHide">Hide</button>'+
      (item.website ? '<button class="detail-web-action" id="detailWeb">Website</button>' : '')+'</div></div>';
    const modal = openModal('detailsModal', 'Details', body);
    $('detailHide').onclick = () => {
      const hidden = type === 'restaurant' ? restaurantHide(item) : foodHideItem(item);
      if (hidden) {
        modal.remove(); $('detailsModalBg')?.remove();
      }
    };
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
      modal.querySelectorAll('[data-history-delete]').forEach(btn => {
        const remove = (e) => {
          e.preventDefault(); e.stopPropagation();
          writeHistory(history.filter(x => x.date !== btn.dataset.historyDelete));
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
    // Manage Foods is a parent modal; remove it before opening the editor so save/close
    // can never leave a live backdrop sitting over the Food swipe deck.
    const managerWasOpen = !!$('manageFoodsModal');
    if(managerWasOpen){ $('manageFoodsModal')?.remove(); $('manageFoodsModalBg')?.remove(); }
    const cats=['American','Southern','Asian','Mexican','Pasta','Pork','Healthy','Breakfast','Soup','Greek','Snack','Potato'];
    const body='<form class="add" id="foodEditorForm">'+
      '<input id="editFoodName" placeholder="Food name" required value="'+esc(item?.name||'')+'">'+
      '<select id="editFoodCat">'+cats.map(x=>'<option '+(x===(item?.category||'American')?'selected':'')+'>'+x+'</option>').join('')+'</select>'+
      '<label class="file-label">Photo from iPhone/device<input id="editFoodFile" type="file" accept="image/*" capture="environment"></label>'+
      '<input id="editFoodPhoto" placeholder="Photo URL (optional)" inputmode="url" value="'+esc(item?.image && !item.image.startsWith('data:')?item.image:'')+'">'+
      '<textarea id="editFoodRecipe" placeholder="Recipe or notes (optional)" rows="5">'+esc(item?.recipe||'')+'</textarea>'+
      '<button class="cut">'+(isEdit?'Save Food':'Add Food')+'</button></form>';
    const modal=openModal('foodEditorModal',isEdit?'Edit Food':'Add Food',body);
    $('editFoodFile').onchange=async()=>{
      try {
        const data=await readImageFile($('editFoodFile').files?.[0]);
        if(data) $('editFoodPhoto').value=data;
      } catch(e) { alert(e.message); }
    };
    $('foodEditorForm').onsubmit=e=>{
      e.preventDefault();
      const name=$('editFoodName').value.trim(), cat=$('editFoodCat').value;
      const photo=$('editFoodPhoto').value.trim()||HUNGRY_IMAGE, recipe=$('editFoodRecipe').value.trim();
      if(!name)return;
      if(isEdit){
        const idx=S.custom.findIndex(x=>x.id===item.id);
        if(idx<0)return;
        const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        if(id!==item.id && allFoods().some(x=>x.id===id))return alert('A food with that name already exists.');
        S.custom[idx]={...S.custom[idx],id,name,primary:id===item.id?S.custom[idx].primary:id,category:cat,image:photo,recipe};
        S.maybe.delete(item.id); S.hidden.delete(item.id); S.deleted.delete(item.id);
      } else {
        const id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        if(allFoods().some(x=>x.id===id))return alert('A food with that name already exists.');
        S.custom.push({id,name,primary:id,category:cat,image:photo,recipe});
      }
      buildFood(); save(); modal.remove(); $('foodEditorModalBg')?.remove();
      // Adding from the Food deck should return directly to the swipe experience.
      // Editing an existing food is managed from the menu, so reopen the manager after save.
      if(S.screen==='food' && !isEdit){ show('food'); foodQuick(); drawFood(); }
      else manageFoodsView();
    };
  }

  function manageFoodsView() {
    const rows=allFoods();
    const body='<div class="manage-intro">Add your own food with a photo, recipe, or notes. Built-in foods can be hidden or removed.</div>'+
      '<button class="cut" id="openFoodEditor" style="width:100%;min-height:46px;border-radius:13px">Add Food</button>'+
      '<div class="food-list">'+rows.map(item=>{
        const hidden=S.hidden.has(item.id), deleted=S.deleted.has(item.id), custom=S.custom.some(x=>x.id===item.id);
        const state=deleted?'Deleted':hidden?'Hidden':'Active';
        return '<div class="food-row"><span><b>'+esc(item.name)+'</b><small class="row-state">'+esc(state)+(custom?' · Custom':'')+'</small></span><span class="food-row-actions">'+
          (!deleted?(hidden?'<button class="restore" data-food-restore="'+esc(item.id)+'">Restore</button>':'<button class="restore" data-food-hide="'+esc(item.id)+'">Hide</button>'):'<button class="restore" data-food-restore-deleted="'+esc(item.id)+'">Restore</button>')+
          (custom?'<button class="restore" data-food-edit="'+esc(item.id)+'">Edit</button>':'')+
          '<button class="restore danger-lite" data-food-delete="'+esc(item.id)+'">Delete</button></span></div>';
      }).join('')+'</div>';
    const modal=openModal('manageFoodsModal','Manage Foods',body);
    $('openFoodEditor').onclick=()=>foodEditor();
    modal.querySelectorAll('[data-food-restore]').forEach(btn=>btn.onclick=()=>{
      S.hidden.delete(btn.dataset.foodRestore); buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView();
    });
    modal.querySelectorAll('[data-food-restore-deleted]').forEach(btn=>btn.onclick=()=>{
      S.deleted.delete(btn.dataset.foodRestoreDeleted); buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove();
      if(S.screen==='food'){ closeOverlays(); show('food'); foodQuick(); drawFood(); }
      else manageFoodsView();
    });
    modal.querySelectorAll('[data-food-hide]').forEach(btn=>btn.onclick=()=>{
      S.hidden.add(btn.dataset.foodHide); buildFood(); save(); modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView();
    });
    modal.querySelectorAll('[data-food-edit]').forEach(btn=>btn.onclick=()=>{
      const row=allFoods().find(x=>x.id===btn.dataset.foodEdit);
      if(row){modal.remove(); $('manageFoodsModalBg')?.remove(); foodEditor(row);}
    });
    modal.querySelectorAll('[data-food-delete]').forEach(btn=>btn.onclick=()=>{
      const row=allFoods().find(x=>x.id===btn.dataset.foodDelete);
      if(!row)return;
      if(!confirm((S.custom.some(x=>x.id===row.id)?'Delete custom food permanently? ':'Remove '+row.name+' from choices? ')+'You can restore deleted built-in foods here.'))return;
      if(S.custom.some(x=>x.id===row.id))S.custom=S.custom.filter(x=>x.id!==row.id);
      else S.deleted.add(row.id);
      S.hidden.delete(row.id); S.maybe.delete(row.id); buildFood(); save();
      modal.remove(); $('manageFoodsModalBg')?.remove(); manageFoodsView();
    });
  }

  function settingsView() {
    // Never stack Settings on top of a Manage/Edit Food modal.
    removeFoodOverlays();
    const hiddenFoods=allFoods().filter(x=>S.hidden.has(x.id));
    const deletedFoods=allFoods().filter(x=>S.deleted.has(x.id));
    const hiddenRestaurants=Object.values(S.hiddenRestaurants);
    const body='<div class="settings-stack">'+
      '<h4>Food Choices</h4><div class="settings-food-choices">'+
      ((hiddenFoods.length||deletedFoods.length)?hiddenFoods.map(x=>'<div class="food-row"><span><b>'+esc(x.name)+'</b><small class="settings-state">Hidden</small></span><span class="food-row-actions"><button class="restore" data-setting-food="'+esc(x.id)+'">Restore</button><button class="restore danger-lite" data-setting-food-delete="'+esc(x.id)+'">Delete</button></span></div>').join(''):'')+
      deletedFoods.map(x=>'<div class="food-row"><span><b>'+esc(x.name)+'</b><small class="settings-state">Deleted</small></span><button class="restore" data-setting-deleted="'+esc(x.id)+'">Restore</button></div>').join('')+
      ((!hiddenFoods.length&&!deletedFoods.length)?'<p class="status">No hidden or deleted foods.</p>':'')+
      '</div><h4>Hidden Restaurants</h4><div>'+
      (hiddenRestaurants.length?hiddenRestaurants.map(x=>'<div class="food-row"><span>'+esc(x.name)+'</span><button class="restore" data-setting-rest="'+esc(x.id)+'">Restore</button></div>').join(''):'<p class="status">No hidden restaurants.</p>')+
      '</div><h4>System</h4><button class="secondary" id="systemRestore" style="width:100%;min-height:46px;border-radius:13px">System Restore</button><p class="status">Restores the original foods and clears saved round changes.</p></div>';
    const modal=openModal('settingsModal','Settings',body);
    modal.querySelectorAll('[data-setting-food]').forEach(btn=>btn.onclick=()=>{
      S.hidden.delete(btn.dataset.settingFood); buildFood(); save(); modal.remove(); $('settingsModalBg')?.remove(); settingsView();
    });
    modal.querySelectorAll('[data-setting-food-delete]').forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.settingFoodDelete, row=allFoods().find(x=>x.id===id);
      if(!row)return;
      if(!confirm('Remove '+row.name+' from the food choices?'))return;
      if(S.custom.some(x=>x.id===id))S.custom=S.custom.filter(x=>x.id!==id); else S.deleted.add(id);
      S.hidden.delete(id); S.maybe.delete(id); buildFood(); save(); modal.remove(); $('settingsModalBg')?.remove(); settingsView();
    });
    modal.querySelectorAll('[data-setting-deleted]').forEach(btn=>btn.onclick=()=>{
      S.deleted.delete(btn.dataset.settingDeleted); buildFood(); save(); modal.remove(); $('settingsModalBg')?.remove(); settingsView();
    });
    modal.querySelectorAll('[data-setting-rest]').forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.settingRest; delete S.hiddenRestaurants[id];
      const row=S.restaurantPool.find(x=>x.id===id); if(row)row._hidden=false;
      save(); modal.remove(); $('settingsModalBg')?.remove(); settingsView();
    });
    $('systemRestore').onclick=()=>{
      if(!confirm('Restore the default Dinliminate setup and clear saved round changes?'))return;
      S.hidden.clear(); S.deleted.clear(); S.hiddenRestaurants={}; S.custom=[]; S.cutCats.clear(); S.cutPrimary.clear(); S.maybe.clear(); S.pool=[]; S.restaurantPool=[]; S.restaurantCuts.clear(); S.restaurantActions=[]; S.foodActions=[]; S.index=0; S.restaurantIndex=0; S.restaurantQuery=''; S.location=null; S.saved=false; S.winnerItem=null; S.pass=null;
      try{localStorage.removeItem(KEY)}catch{}
      home();  modal.remove(); $('settingsModalBg')?.remove();
    };
  }

  function aboutView() {
    const date = new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date());
    const body = '<div class="info-copy"><h4>Dinliminate</h4><p>Cut the dinner choices until one survives.</p><p class="about-test">TEST BUILD</p><div class="about-meta"><p><span>Version</span><b>'+esc(APP_VERSION)+'</b></p><p><span>Build</span><b>'+esc(APP_BUILD)+'</b></p><p><span>Date</span><b>'+esc(date)+'</b></p></div></div>';
    openModal('aboutModal','About Dinliminate',body);
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
    S.maybe.clear(); S.cutCats.clear(); S.cutPrimary.clear(); S.foodCuts.clear(); S.restaurantCuts.clear();
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
  $('address').addEventListener('input', () => { S.location=null; clearSuggestions(); suggestAddresses(); });
  $('address').addEventListener('focus', () => { if ($('address').value.trim().length>=2) suggestAddresses(); });
  $('address').addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();clearSuggestions();searchRestaurants();} if(e.key==='Escape') clearSuggestions(); });

  bindRestaurantTools();
  renderHours();

  $('details').onclick = () => S.winnerItem && detailsSheet(S.winnerItem, S.winnerType || 'food');
  $('share').onclick = shareWinner;
  $('restart').onclick = startOver;



  load();
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
        cutPrimary:[...S.cutPrimary],
        maybe:[...S.maybe],
        restaurantCuts:[...S.restaurantCuts],
        winner:S.winnerItem ? {...S.winnerItem} : null,
        location:S.location ? {...S.location} : null,
        pass:S.pass ? JSON.parse(JSON.stringify(S.pass)) : null
      })
    };
  }
})();