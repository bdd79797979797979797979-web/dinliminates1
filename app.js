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
  };