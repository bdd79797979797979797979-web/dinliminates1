const MAX_RADIUS_MI = 100;
const RESULT_LIMIT = 1000;
const CACHE_TTL_MS = 90 * 1000;
const VERSION = 'restaurant-v700-location-search';

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

const FAST_FOOD_BRANDS = /\b(?:mcdonald(?:'|’)?s|mcdonalds|taco bell|wendy(?:'|’)?s|burger king|kfc|chick[- ]?fil[- ]?a|popeyes|subway|sonic(?: drive[- ]?in)?|arby(?:'|’)?s|whataburger|five guys|culver(?:'|’)?s|raising cane(?:'|’)?s|wingstop|bojangles|cook out|dairy queen|jack in the box|hardee(?:'|’)?s|del taco|checkers|rally(?:'|’)?s|zaxby(?:'|’)?s|church(?:'|’)?s chicken|captain d(?:'|’)?s|long john silver(?:'|’)?s|jimmy john(?:'|’)?s|jersey mike(?:'|’)?s|firehouse subs|little caesars|domino(?:'|’)?s|papa john(?:'|’)?s|pizza hut|marco(?:'|’)?s pizza|krystal|steak ?n shake|white castle|freddy(?:'|’)?s|in[- ]?n[- ]?out|carl(?:'|’)?s jr|el pollo loco|panda express|jack'?s)\b/i;

const memoryCache = new Map();
const rateBuckets = new Map();
const RATE_RULES = {
  search: { max: 18, windowMs: 60_000 },
  resolve: { max: 24, windowMs: 60_000 },
  suggest: { max: 45, windowMs: 60_000 },
  reverse: { max: 45, windowMs: 60_000 },
  health: { max: 90, windowMs: 60_000 }
};

function sweep(now = Date.now()) {
  for (const [k, v] of memoryCache) if (!v || now - v.at >= CACHE_TTL_MS) memoryCache.delete(k);
  if (memoryCache.size > 300) {
    let extra = memoryCache.size - 300;
    for (const k of memoryCache.keys()) {
      if (extra-- <= 0) break;
      memoryCache.delete(k);
    }
  }
  for (const [k, v] of rateBuckets) {
    const rule = RATE_RULES[k.split(':', 1)[0]] || RATE_RULES.search;
    if (!v || now - v.started >= rule.windowMs) rateBuckets.delete(k);
  }
}

function clientKey(req) {
  const xf = String(req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || '').split(',')[0].trim();
  return xf || String(req?.socket?.remoteAddress || 'anonymous');
}

function rateLimit(req, mode) {
  const rule = RATE_RULES[mode] || RATE_RULES.search;
  const key = mode + ':' + clientKey(req);
  const now = Date.now();
  const old = rateBuckets.get(key);
  if (!old || now - old.started >= rule.windowMs) {
    rateBuckets.set(key, { started: now, count: 1 });
    return { limited: false, retryAfter: 0 };
  }
  old.count += 1;
  if (old.count > rule.max) return { limited: true, retryAfter: Math.ceil((old.started + rule.windowMs - now) / 1000) };
  return { limited: false, retryAfter: 0 };
}

function publicCache(res, seconds = 90) {
  res.setHeader('Cache-Control', 'public, s-maxage=' + seconds + ', stale-while-revalidate=600, stale-if-error=21600');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=' + seconds + ', stale-while-revalidate=600, stale-if-error=21600');
}

function num(v, fallback = NaN) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampRadius(v) {
  return Math.min(MAX_RADIUS_MI, Math.max(1, num(v, 10)));
}

function miles(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const R = 3958.7613;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchJson(url, options = {}, timeout = 10_000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctl.signal,
      redirect: 'follow',
      headers: {
        Accept: 'application/json, application/geo+json, text/plain',
        ...(options.headers || {})
      }
    });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch {}
    if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status), { status: res.status });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function errorText(err) {
  if (!err) return 'request failed';
  if (err.name === 'AbortError') return 'timeout';
  return String(err?.status ? 'HTTP ' + err.status : err?.message || 'request failed');
}

function isFastFoodText(value) {
  const s = String(value || '');
  return /\bfast[ _-]?food\b/i.test(s) || /\bqsr\b/i.test(s) || FAST_FOOD_BRANDS.test(s);
}

function addressFromTags(t = {}) {
  return [
    t['addr:housenumber'],
    t['addr:street'],
    t['addr:city'],
    t['addr:state'],
    t['addr:postcode']
  ].filter(Boolean).join(', ');
}

function slugStable(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function osmRow(el) {
  const t = el?.tags || {};
  const lat = num(el?.lat ?? el?.center?.lat);
  const lon = num(el?.lon ?? el?.center?.lon);
  const name = String(t.name || '').trim();
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const amenity = String(t.amenity || 'restaurant').toLowerCase();
  const fast = amenity === 'fast_food' || isFastFoodText(name + ' ' + (t.brand || '') + ' ' + (t.operator || '') + ' ' + (t.cuisine || ''));

  let website = String(t.website || t['contact:website'] || '').trim();
  if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;

  const cuisine = String(t.cuisine || '').trim();

  return {
    id: el.osm_id ? 'osm-' + (el.osm_type || el.type || 'feature') + '-' + el.osm_id : 'osm-place-' + slugStable(name + '|' + lat.toFixed(6) + '|' + lon.toFixed(6)),
    name,
    type: 'restaurant',
    amenity: fast ? 'fast_food' : amenity,
    fastFood: fast,
    category: fast ? 'Fast Food' : (cuisine || 'Restaurant'),
    cuisine,
    tags: fast ? ['restaurant', 'fast_food', 'fast food'] : ['restaurant'],
    brand: String(t.brand || '').trim(),
    operator: String(t.operator || '').trim(),
    address: addressFromTags(t),
    phone: String(t.phone || t['contact:phone'] || '').trim(),
    website,
    opening_hours: String(t.opening_hours || '').trim(),
    lat,
    lon,
    photo: String(t.image || t.image_url || '').trim(),
    rating: num(t.stars, 0),
    priceLevel: String(t.price || '').trim(),
    menuItems: String(t['menu:items'] || t.menu_items || t['menu:item'] || '').split(/\n|\r|\||;|•/).map(x => x.trim()).filter(Boolean).slice(0, 10),
    menuUrl: String(t.menu || t['contact:menu'] || '').trim(),
    timeZone: String(t['timezone'] || '').trim(),
    source: 'OpenStreetMap'
  };
}

function normalizeRows(elements, originLat, originLon, radiusMi) {
  const map = new Map();
  for (const el of elements || []) {
    const row = osmRow(el);
    if (!row) continue;
    const distanceMiles = miles(originLat, originLon, row.lat, row.lon);
    if (!Number.isFinite(distanceMiles) || distanceMiles > radiusMi) continue;
    row.distanceMiles = distanceMiles;

    const key = [
      String(row.name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      String(row.address || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    ].join('|');

    const existing = map.get(key);
    if (!existing) map.set(key, row);
    else {
      existing.fastFood = existing.fastFood || row.fastFood;
      existing.tags = [...new Set([...(existing.tags || []), ...(row.tags || [])])];
      for (const k of ['address','phone','website','opening_hours','cuisine','brand','operator','photo','menuUrl']) {
        if (!existing[k] && row[k]) existing[k] = row[k];
      }
    }
  }
  return [...map.values()].sort((a, b) => a.distanceMiles - b.distanceMiles);
}

function overpassQuery(lat, lon, radiusMi) {
  const meters = Math.round(Math.min(50, Math.max(1, radiusMi)) * 1609.344);
  return '[out:json][timeout:12];(' +
    'nwr[amenity~"^(restaurant|fast_food)$"][name](around:' + meters + ',' + lat + ',' + lon + ');' +
    'nwr[shop=bakery][name](around:' + Math.min(meters, 20 * 1609.344) + ',' + lat + ',' + lon + ');' +
    ');out center tags;';
}

function tileCenters(lat, lon, radiusMi) {
  if (radiusMi <= 50) return [{ lat, lon, radiusMi }];
  const tileRadius = 50;
  const latStep = tileRadius / 69;
  const lonStep = tileRadius / (69 * Math.max(0.35, Math.cos(lat * Math.PI / 180)));
  const out = [];
  for (const dy of [-1, 0, 1]) {
    for (const dx of [-1, 0, 1]) {
      out.push({ lat: lat + dy * latStep, lon: lon + dx * lonStep, radiusMi: tileRadius });
    }
  }
  return out;
}

async function overpassProvider(endpoint, lat, lon, radiusMi) {
  const started = Date.now();
  const centers = tileCenters(lat, lon, radiusMi);
  const elements = [];
  const errors = [];

  // Query a provider's tiles with bounded concurrency. We only use the first
  // response batch that produces usable restaurant rows, then merge additional
  // tiles from the same provider.
  for (let i = 0; i < centers.length; i += 3) {
    const batch = centers.slice(i, i + 3);
    const settled = await Promise.all(batch.map(async c => {
      try {
        const data = await fetchJson(endpoint, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(overpassQuery(c.lat, c.lon, c.radiusMi)),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
        }, radiusMi > 50 ? 11_000 : 8_500);
        return { elements: Array.isArray(data?.elements) ? data.elements : [], error: null };
      } catch (e) {
        return { elements: [], error: errorText(e) };
      }
    }));
    for (const result of settled) {
      elements.push(...result.elements);
      if (result.error) errors.push(result.error);
    }
    if (radiusMi <= 50 && normalizeRows(elements, lat, lon, radiusMi).length >= 160) break;
  }

  return {
    endpoint,
    elements,
    rows: normalizeRows(elements, lat, lon, radiusMi),
    tiles: centers.length,
    ms: Date.now() - started,
    errors
  };
}

async function googleSearch(lat, lon, radiusMi) {
  if (!GOOGLE_KEY) return { endpoint: 'Google Places', rows: [], ms: 0, errors: ['not configured'] };
  const started = Date.now();
  const meters = Math.round(Math.min(50, radiusMi) * 1609.344);
  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  try {
    const res = await fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.types,currentOpeningHours,places.photos'
      },
      body: JSON.stringify({
        includedTypes: ['restaurant'],
        maxResultCount: 20,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius: meters } }
      })
    }, 9_000);
    const rows = (res?.places || []).map(p => {
      const loc = p?.location || {};
      const la = num(loc.latitude), lo = num(loc.longitude);
      const name = String(p?.displayName?.text || '').trim();
      if (!name || !Number.isFinite(la) || !Number.isFinite(lo)) return null;
      return {
        id: 'google-' + String(p.id || slugStable(name + la + lo)),
        name,
        type: 'restaurant',
        amenity: 'restaurant',
        fastFood: /fast_food|meal_takeaway/i.test(String(p.primaryType || '')) || isFastFoodText(name),
        category: isFastFoodText(name) ? 'Fast Food' : 'Restaurant',
        cuisine: '',
        tags: isFastFoodText(name) ? ['restaurant','fast_food','fast food'] : ['restaurant'],
        address: String(p.formattedAddress || ''),
        phone: String(p.nationalPhoneNumber || ''),
        website: String(p.websiteUri || ''),
        opening_hours: p.currentOpeningHours?.weekdayDescriptions || '',
        lat: la,
        lon: lo,
        distanceMiles: miles(lat, lon, la, lo),
        source: 'Google Places'
      };
    }).filter(Boolean);
    return { endpoint: 'Google Places', rows, ms: Date.now() - started, errors: [] };
  } catch (e) {
    return { endpoint: 'Google Places', rows: [], ms: Date.now() - started, errors: [errorText(e)] };
  }
}

async function doSearch(lat, lon, radiusMi) {
  const key = lat.toFixed(3) + ':' + lon.toFixed(3) + ':' + radiusMi.toFixed(1);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.data, diagnostics: { ...(cached.data.diagnostics || {}), cacheHit: true } };
  }

  const started = Date.now();
  const providerResults = await Promise.all([
    googleSearch(lat, lon, radiusMi),
    ...OVERPASS_ENDPOINTS.map(endpoint => overpassProvider(endpoint, lat, lon, radiusMi))
  ]);

  const providerStats = providerResults.map(x => ({
    endpoint: x.endpoint,
    rows: Number(x.rows?.length || 0),
    ms: Number(x.ms || 0),
    errors: Array.isArray(x.errors) ? x.errors.slice(0, 3) : []
  }));

  const allRows = providerResults.flatMap(x => x.rows || []);
  const mergedMap = new Map();
  for (const row of allRows) {
    const keyRow = [
      String(row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      String(row.address || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    ].join('|');
    if (!mergedMap.has(keyRow)) mergedMap.set(keyRow, row);
    else {
      const existing = mergedMap.get(keyRow);
      existing.fastFood = existing.fastFood || row.fastFood;
      existing.tags = [...new Set([...(existing.tags || []), ...(row.tags || [])])];
      if ((existing.source || '').startsWith('OpenStreetMap') && row.source === 'Google Places') Object.assign(existing, { ...existing, ...row });
      for (const k of ['address','phone','website','opening_hours','cuisine','brand','operator','photo','menuUrl']) {
        if (!existing[k] && row[k]) existing[k] = row[k];
      }
    }
  }

  let merged = [...mergedMap.values()]
    .filter(row => {
      const d = Number(row.distanceMiles);
      return Number.isFinite(d) && d <= radiusMi;
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  const data = {
    results: merged.slice(0, RESULT_LIMIT),
    restaurants: merged.slice(0, RESULT_LIMIT),
    items: merged.slice(0, RESULT_LIMIT),
    total: merged.length,
    fastFoodCount: merged.filter(r => r.fastFood).length,
    providersUsed: providerResults.filter(x => (x.rows || []).length).map(x => x.endpoint),
    googleConfigured: !!GOOGLE_KEY,
    providerCounts: Object.fromEntries(providerStats.map(x => [x.endpoint, x.rows])),
    diagnostics: {
      elapsedMs: Date.now() - started,
      cacheHit: false,
      providers: providerStats
    }
  };

  memoryCache.set(key, { at: Date.now(), data });
  return data;
}

function addressText(f, fallback = '') {
  const p = f?.properties || {};
  const c = f?.geometry?.coordinates || [];
  const lon = num(c[0]), lat = num(c[1]);
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const city = p.city || p.town || p.village || p.municipality || p.locality || '';
  const state = p.state || '';
  const postcode = p.postcode || '';
  return {
    lat,
    lon,
    display: [street, city, state, postcode, p.country || ''].filter(Boolean).join(', ') || String(p.name || fallback).trim(),
    city: String(city),
    state: String(state),
    postcode: String(postcode)
  };
}

function scoreAddress(query, candidate) {
  const q = String(query || '').toLowerCase();
  const d = String(candidate?.display || '').toLowerCase();
  let score = Number(candidate?.score || 0);
  const house = (q.match(/^\s*(\d{1,8})\b/) || [])[1];
  const zip = (q.match(/\b\d{5}(?:-\d{4})?\b/) || [])[0];
  const qWords = q.replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(w => w.length > 2);
  if (house && new RegExp('\\b' + house + '\\b').test(d)) score += 120;
  if (zip && d.includes(zip)) score += 120;
  for (const word of qWords) if (d.includes(word)) score += 4;
  return score;
}

async function suggest(query, limit = 7) {
  const q = String(query || '').trim();
  const capped = Math.min(8, Math.max(1, num(limit, 7)));
  if (!q) return [];

  const [arcgis, photon] = await Promise.allSettled([
    fetchJson('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?' + new URLSearchParams({
      SingleLine: q,
      f: 'json',
      maxLocations: String(capped),
      outFields: 'Match_addr,Addr_type,City,Region,Postal',
      forStorage: 'false',
      countryCode: 'USA'
    }), {}, 8_000),
    fetchJson('https://photon.komoot.io/api/?' + new URLSearchParams({
      q,
      limit: String(capped),
      lang: 'en',
      countrycode: 'US'
    }), {}, 8_000)
  ]);

  const rows = [];

  if (arcgis.status === 'fulfilled') {
    for (const c of arcgis.value?.candidates || []) {
      const loc = c.location || {};
      const attr = c.attributes || {};
      const lat = num(loc.y), lon = num(loc.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const type = String(attr.Addr_type || '').toLowerCase();
      rows.push({
        lat,
        lon,
        display: String(c.address || attr.Match_addr || q),
        query: String(c.address || attr.Match_addr || q),
        precision: /pointaddress|streetaddress|parcel/.test(type) ? 'address' : /locality|city|postal/.test(type) ? 'place' : 'match',
        source: 'ArcGIS',
        score: scoreAddress(q, {
          display: c.address || attr.Match_addr || q,
          score: num(c.score, 0) + (/pointaddress|streetaddress|parcel/.test(type) ? 500 : 0) + (/locality|city|postal/.test(type) ? 200 : 0)
        })
      });
    }
  }

  if (photon.status === 'fulfilled') {
    for (const f of photon.value?.features || []) {
      const x = addressText(f, q);
      if (!Number.isFinite(x.lat) || !Number.isFinite(x.lon)) continue;
      const rawType = String(f?.properties?.osm_value || f?.properties?.type || '').toLowerCase();
      rows.push({
        ...x,
        query: x.display,
        precision: x.postcode || /house|street|road|residential/i.test(rawType) ? 'address' : 'place',
        source: 'Photon',
        score: scoreAddress(q, x) + (/house|street|road|residential/i.test(rawType) ? 350 : 0)
      });
    }
  }

  rows.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const k = String(row.display || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(row);
    if (out.length >= capped) break;
  }
  return out;
}

async function resolve(query) {
  const q = String(query || '').trim();
  if (!q) throw Object.assign(new Error('Enter a location.'), { code: 'EMPTY_LOCATION' });

  const candidates = [];

  try {
    const data = await fetchJson('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?' + new URLSearchParams({
      address: q,
      benchmark: 'Public_AR_Current',
      format: 'json'
    }), {}, 8_000);
    for (const m of data?.result?.addressMatches || []) {
      const lat = num(m?.coordinates?.y), lon = num(m?.coordinates?.x);
      if (Number.isFinite(lat) && Number.isFinite(lon)) candidates.push({
        lat, lon,
        display: String(m.matchedAddress || q),
        precision: 'address',
        score: 2000 + scoreAddress(q, { display: m.matchedAddress || q })
      });
    }
  } catch {}

  if (!candidates.length) {
    try {
      const data = await fetchJson('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?' + new URLSearchParams({
        SingleLine: q,
        f: 'json',
        maxLocations: '8',
        outFields: 'Match_addr,Addr_type,City,Region,Postal',
        forStorage: 'false',
        countryCode: 'USA'
      }), {}, 8_000);
      for (const c of data?.candidates || []) {
        const loc = c.location || {};
        const attr = c.attributes || {};
        const lat = num(loc.y), lon = num(loc.x);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const type = String(attr.Addr_type || '').toLowerCase();
        candidates.push({
          lat,
          lon,
          display: String(c.address || attr.Match_addr || q),
          precision: /pointaddress|streetaddress|parcel/.test(type) ? 'address' : 'place',
          score: scoreAddress(q, {
            display: c.address || attr.Match_addr || q,
            score: num(c.score, 0) + (/pointaddress|streetaddress|parcel/.test(type) ? 500 : 0)
          })
        });
      }
    } catch {}
  }

  if (!candidates.length) {
    try {
      const data = await fetchJson('https://photon.komoot.io/api/?' + new URLSearchParams({
        q, limit: '8', lang: 'en', countrycode: 'US'
      }), {}, 8_000);
      for (const f of data?.features || []) {
        const x = addressText(f, q);
        if (Number.isFinite(x.lat) && Number.isFinite(x.lon)) candidates.push({
          ...x,
          precision: x.postcode ? 'address' : 'place',
          score: scoreAddress(q, x)
        });
      }
    } catch {}
  }

  if (!candidates.length) {
    try {
      const data = await fetchJson('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
        q, format: 'jsonv2', limit: '6', countrycodes: 'us'
      }), {
        headers: { 'User-Agent': 'Dinliminate/1.0 restaurant location resolver' }
      }, 8_000);
      for (const hit of data || []) {
        const lat = num(hit?.lat), lon = num(hit?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) candidates.push({
          lat, lon,
          display: String(hit.display_name || q),
          precision: 'place',
          score: scoreAddress(q, { display: hit.display_name || q })
        });
      }
    } catch {}
  }

  if (!candidates.length) throw Object.assign(new Error('That address or area could not be located.'), { code: 'NOT_FOUND' });
  candidates.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  const best = candidates[0];
  return { location: { lat: best.lat, lon: best.lon }, display: best.display, precision: best.precision };
}

async function reverse(lat, lon) {
  const a = num(lat), b = num(lon);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Coordinates unavailable.');

  try {
    const data = await fetchJson('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?' + new URLSearchParams({
      location: b + ',' + a, f: 'json', distance: '1000', langCode: 'EN'
    }), {}, 7_000);
    const addr = data?.address || {};
    return { display: String(addr.Match_addr || [addr.Address, addr.City, addr.Region, addr.Postal].filter(Boolean).join(', ') || 'Your location'), city: String(addr.City || '') };
  } catch {}

  try {
    const data = await fetchJson('https://photon.komoot.io/reverse?' + new URLSearchParams({
      lat: String(a), lon: String(b), limit: '1', lang: 'en'
    }), {}, 7_000);
    const x = addressText(data?.features?.[0], 'Your location');
    return { display: x.display || 'Your location', city: x.city || '' };
  } catch {
    return { display: 'Your location', city: '' };
  }
}

async function probeEndpoint(endpoint) {
  const started = Date.now();
  const q = '[out:json][timeout:5];nwr[amenity~"^(restaurant|fast_food)$"][name](around:800,36.5277608,-87.3588703);out center tags 1;';
  try {
    const data = await fetchJson(endpoint, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(q),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
    }, 7_000);
    return { endpoint, ok: true, rows: Array.isArray(data?.elements) ? data.elements.length : 0, ms: Date.now() - started };
  } catch (e) {
    return { endpoint, ok: false, rows: 0, error: errorText(e), ms: Date.now() - started };
  }
}

async function handler(req, res) {
  sweep();
  const mode = String(req?.query?.mode || 'health').toLowerCase();
  const limited = rateLimit(req, mode);
  if (limited.limited) {
    res.setHeader('Retry-After', String(limited.retryAfter));
    return res.status(429).json({ ok: false, code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' });
  }

  try {
    if (mode === 'health') {
      publicCache(res, 60);
      return res.status(200).json({
        ok: true,
        version: VERSION,
        googleConfigured: !!GOOGLE_KEY,
        maxRadiusMiles: MAX_RADIUS_MI,
        providers: { primary: 'OpenStreetMap Overpass (multi-endpoint)', optional: GOOGLE_KEY ? 'Google Places' : 'Google Places not configured', geocoding: 'Census + ArcGIS + Photon + Nominatim' }
      });
    }

    if (mode === 'suggest') {
      const q = String(req.query.q || '').trim().slice(0, 180);
      if (q.length < 2) return res.status(200).json({ ok: true, version: VERSION, results: [] });
      publicCache(res, 15);
      return res.status(200).json({ ok: true, version: VERSION, results: await suggest(q, num(req.query.limit, 7)) });
    }

    if (mode === 'resolve') {
      const q = String(req.query.q || '').trim().slice(0, 240);
      if (q.length < 2) return res.status(400).json({ ok: false, code: 'EMPTY_LOCATION', message: 'Enter a location.' });
      publicCache(res, 180);
      return res.status(200).json({ ok: true, version: VERSION, ...(await resolve(q)) });
    }

    if (mode === 'reverse') {
      const lat = num(req.query.lat), lon = num(req.query.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return res.status(400).json({ ok: false, code: 'BAD_COORDINATES', message: 'Coordinates are invalid.' });
      publicCache(res, 180);
      return res.status(200).json({ ok: true, version: VERSION, ...(await reverse(lat, lon)) });
    }

    if (mode === 'probe') {
      const results = await Promise.all(OVERPASS_ENDPOINTS.map(probeEndpoint));
      return res.status(200).json({ ok: true, version: VERSION, results });
    }

    if (mode === 'search') {
      const lat = num(req.query.lat);
      const lon = num(req.query.lon);
      const radius = clampRadius(req.query.radius);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return res.status(400).json({ ok: false, code: 'BAD_COORDINATES', message: 'Search coordinates are invalid.' });
      }

      const data = await doSearch(lat, lon, radius);
      publicCache(res, 60);
      return res.status(200).json({
        ok: true,
        version: VERSION,
        radiusMiles: radius,
        ...data
      });
    }

    return res.status(400).json({ ok: false, code: 'UNKNOWN_MODE', message: 'Unknown restaurant search mode.' });
  } catch (err) {
    console.error('restaurant-search-v700', err);
    return res.status(502).json({
      ok: false,
      version: VERSION,
      code: String(err?.code || 'SERVICE'),
      message: String(err?.message || 'Restaurant search service unavailable.')
    });
  }
}

module.exports = handler;
