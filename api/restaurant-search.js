const MAX_RADIUS_MI = 100;
const GOOGLE_MAX_RADIUS_MI = 31.0686; // 50,000m Places Nearby Search limit.
const CACHE_TTL_MS = 120 * 1000;
const RESULT_LIMIT = 1000;
const POSTPASS_QUERY_LIMIT = 5000;
const VERSION = 'restaurant-v636-final';

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
const POSTPASS_ENDPOINT = 'https://postpass.geofabrik.de/api/0.2/interpreter';
// One deliberately small Overpass fallback. Public Overpass infrastructure can shed
// load or block cloud IPs, so do not fan out to a large endpoint list.
const OVERPASS_FALLBACK_ENDPOINT = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';

const FAST_FOOD_BRANDS = /\b(?:mcdonald(?:'|’)?s|mcdonalds|taco bell|wendy(?:'|’)?s|burger king|kfc|chick[- ]?fil[- ]?a|popeyes|subway|sonic(?: drive[- ]?in)?|arby(?:'|’)?s|whataburger|five guys|culver(?:'|’)?s|raising cane(?:'|’)?s|wingstop|bojangles|cook out|jack in the box|dairy queen|hardee(?:'|’)?s|carvel|del taco|checkers|rally(?:'|’)?s|zaxby(?:'|’)?s|church(?:'|’)?s chicken|captain d(?:'|’)?s|long john silver(?:'|’)?s|jimmy john(?:'|’)?s|jersey mike(?:'|’)?s|firehouse subs|little caesars|domino(?:'|’)?s|papa john(?:'|’)?s|pizza hut|marco(?:'|’)?s pizza|krystal|steak ?n shake|white castle|a&w|freddy(?:'|’)?s|in[- ]?n[- ]?out|carl(?:'|’)?s jr|el pollo loco|panda express|jack'?s)\b/i;

const memoryCache = new Map();
const rateBuckets = new Map();
const RATE_RULES = { search: { max: 24, windowMs: 60_000 }, resolve: { max: 20, windowMs: 60_000 }, suggest: { max: 45, windowMs: 60_000 }, reverse: { max: 45, windowMs: 60_000 } };

function sweepCaches(now = Date.now()) {
  for (const [key, value] of memoryCache) { if (!value || now - value.at >= CACHE_TTL_MS) memoryCache.delete(key); }
  if (memoryCache.size > 500) { let extra = memoryCache.size - 500; for (const key of memoryCache.keys()) { if (extra-- <= 0) break; memoryCache.delete(key); } }
  for (const [key, value] of rateBuckets) { const rule = RATE_RULES[key.split(':', 1)[0]] || RATE_RULES.search; if (!value || now - value.started >= rule.windowMs) rateBuckets.delete(key); }
}

function clientKey(req) {
  const xf = String(req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || '').split(',')[0].trim();
  return xf || String(req?.socket?.remoteAddress || 'anonymous');
}
function rateLimit(req, mode) {
  const rule = RATE_RULES[mode] || RATE_RULES.search;
  const key = `${mode}:${clientKey(req)}`;
  const now = Date.now();
  const old = rateBuckets.get(key);
  if (!old || now - old.started >= rule.windowMs) { rateBuckets.set(key, { started: now, count: 1 }); return { limited: false, retryAfter: 0 }; }
  old.count += 1;
  if (old.count > rule.max) return { limited: true, retryAfter: Math.ceil((old.started + rule.windowMs - now) / 1000) };
  return { limited: false, retryAfter: 0 };
}
function publicCache(res, seconds=90) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=600, stale-if-error=21600`);
  res.setHeader('Vercel-CDN-Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=600, stale-if-error=21600`);
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

async function fetchJson(url, options = {}, timeout = 12000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctl.signal,
      headers: {
        Accept: 'application/json, application/geo+json',
        ...(options.headers || {})
      }
    });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch {}
    if (!res.ok) {
      throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function errorText(err) {
  if (!err) return 'request failed';
  if (err.name === 'AbortError') return 'timeout';
  return String(err?.status ? `HTTP ${err.status}` : err?.message || 'request failed');
}

function isFastFoodText(value) {
  return /\bfast[ _-]?food\b/i.test(String(value || '')) || /\bqsr\b/i.test(String(value || '')) || FAST_FOOD_BRANDS.test(String(value || ''));
}

function addressFromTags(t = {}) {
  return [t['addr:housenumber'], t['addr:street'], t['addr:city'], t['addr:state'], t['addr:postcode']].filter(Boolean).join(', ');
}

function slugStable(value) {
  let h = 2166136261;
  for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

function slugStable(value) {
  let h = 2166136261;
  for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

function osmRow(el) {
  const t = el?.tags || {};
  const lat = num(el?.lat ?? el?.center?.lat);
  const lon = num(el?.lon ?? el?.center?.lon);
  const name = String(t.name || '').trim();
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const amenity = String(t.amenity || 'restaurant').toLowerCase();
  const fast = amenity === 'fast_food' || isFastFoodText(`${name} ${t.brand || ''} ${t.operator || ''} ${t.cuisine || ''} ${t.fast_food || ''}`);
  let website = String(t.website || t['contact:website'] || '').trim();
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  const cuisine = String(t.cuisine || '').trim();

  return {
    id: el.osm_id ? `osm-${el.osm_type || el.type || 'feature'}-${el.osm_id}` : `osm-place-${slugStable(`${name}|${lat.toFixed(6)}|${lon.toFixed(6)}`)}`,
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
    menuItems: String(t['menu:items'] || t.menu_items || t['menu:item'] || '').split(/\n|\r|\||;|•/).map(x=>x.trim()).filter(Boolean).slice(0,10),
    menuUrl: String(t.menu || t['contact:menu'] || '').trim(),
    source: 'OpenStreetMap'
  };
}

function postpassRow(r) {
  const tags = r?.tags && typeof r.tags === 'object' ? r.tags : {};
  return osmRow({
    osm_type: r?.osm_type,
    osm_id: r?.osm_id,
    tags,
    lat: r?.lat,
    lon: r?.lon,
    center: { lat: r?.lat, lon: r?.lon }
  });
}

function googleRow(p, originLat, originLon) {
  const loc = p?.location || {};
  const lat = num(loc.latitude);
  const lon = num(loc.longitude);
  const name = String(p?.displayName?.text || '').trim();
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const types = Array.isArray(p.types) ? p.types : [];
  const primary = String(p.primaryType || '').toLowerCase();
  const fast = types.includes('fast_food_restaurant') || primary === 'fast_food_restaurant';
  const hours = p.regularOpeningHours || {};
  return {
    id: String(p.id || p.name || name),
    name,
    type: 'restaurant',
    amenity: fast ? 'fast_food' : 'restaurant',
    fastFood: fast,
    category: fast ? 'Fast Food' : (primary || 'Restaurant').replace(/_restaurant$|_/g, m => m === '_' ? ' ' : '').replace(/^./, c => c.toUpperCase()),
    cuisine: primary,
    tags: types,
    address: String(p.formattedAddress || ''),
    phone: String(p.nationalPhoneNumber || ''),
    website: String(p.websiteUri || ''),
    opening_hours: Array.isArray(hours.weekdayDescriptions) ? hours.weekdayDescriptions.join('; ') : '',
    openNow: typeof hours.openNow === 'boolean' ? hours.openNow : undefined,
    lat,
    lon,
    distanceMiles: miles(originLat, originLon, lat, lon),
    photo: '',
    photoName: Array.isArray(p.photos) && p.photos[0]?.name ? String(p.photos[0].name) : '',
    photoSource: Array.isArray(p.photos) && p.photos[0]?.name ? 'google-place' : 'unavailable',
    rating: num(p.rating, 0),
    priceLevel: '',
    menuUrl: '',
    googleMapsUri: String(p.googleMapsUri || ''),
    source: 'Google Places'
  };
}

function googleTileCenters(lat, lon, radiusMi) {
  const r = Math.min(radiusMi, GOOGLE_MAX_RADIUS_MI);
  if (r <= 4) return [{ lat, lon, radius: r, label: 'center' }];
  const tileRadius = Math.min(GOOGLE_MAX_RADIUS_MI, Math.max(3.5, r * 0.75));
  const offset = r * 0.5;
  const cos = Math.max(0.35, Math.cos(lat * Math.PI / 180));
  if (r <= 18) return [{ lat, lon, radius: r, label: 'center' }];
  return [
    { lat, lon, radius: tileRadius, label: 'center' },
    { lat: lat + offset / 69, lon, radius: tileRadius, label: 'north' },
    { lat: lat - offset / 69, lon, radius: tileRadius, label: 'south' }
  ];
}

async function googleNearby(lat, lon, radiusMi, types) {
  if (!GOOGLE_KEY) return [];
  const radiusMeters = Math.min(50000, Math.max(100, radiusMi * 1609.344));
  const body = {
    includedTypes: types,
    maxResultCount: 20,
    rankPreference: 'DISTANCE',
    locationRestriction: {
      circle: { center: { latitude: lat, longitude: lon }, radius: radiusMeters }
    }
  };
  const fields = 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.nationalPhoneNumber,places.websiteUri,places.rating,places.regularOpeningHours,places.googleMapsUri,places.photos';
  const data = await fetchJson('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': fields
    },
    body: JSON.stringify(body)
  }, 7000);
  return (data?.places || []).map(p => googleRow(p, lat, lon)).filter(Boolean);
}

async function googleSearch(lat, lon, radiusMi) {
  if (!GOOGLE_KEY) return { rows: [], tiles: 0, calls: 0, errors: [], ms: 0 };
  const started = Date.now();
  const centers = googleTileCenters(lat, lon, radiusMi);
  const rows = [];
  const errors = [];
  let calls = 0;

  // Keep bounded concurrency to avoid a thundering herd and API bursts.
  for (let i = 0; i < centers.length; i += 3) {
    const batch = centers.slice(i, i + 3);
    const jobs = batch.map(async (c) => {
      const t = Date.now();
      try {
        const result = await googleNearby(c.lat, c.lon, c.radius, ['restaurant','fast_food_restaurant']);
        return { ok: true, rows: result, type: 'restaurants', ms: Date.now() - t };
      } catch (e) {
        return { ok: false, rows: [], type: 'restaurants', error: errorText(e), ms: Date.now() - t };
      }
    });
    const settled = await Promise.all(jobs);
    for (const result of settled) {
      calls++;
      if (result.ok) rows.push(...result.rows);
      else errors.push({ type: result.type, error: result.error, ms: result.ms });
    }
  }
  return { rows, tiles: centers.length, calls, errors, ms: Date.now() - started };
}

function bboxForMiles(lat, lon, radiusMi) {
  const latDelta = radiusMi / 69;
  const lonDelta = radiusMi / (69 * Math.max(0.35, Math.cos(lat * Math.PI / 180)));
  return {
    west: lon - lonDelta,
    south: lat - latDelta,
    east: lon + lonDelta,
    north: lat + latDelta
  };
}

function sqlQuote(value) {
  return String(value).replace(/'/g, "''");
}

function postpassQuery(lat, lon, radiusMi) {
  const b = bboxForMiles(lat, lon, radiusMi);
  // Restaurant/fast-food amenities are the canonical food POI tags. The brand/name
  // checks are deliberately constrained to those food amenities to avoid the old
  // false-positive problem where any OSM object named after a chain became a restaurant.
  return `SELECT osm_type, osm_id, tags, ST_X(ST_PointOnSurface(geom)) AS lon, ST_Y(ST_PointOnSurface(geom)) AS lat
FROM postpass_pointpolygon
WHERE geom && ST_MakeEnvelope(${sqlQuote(b.west)},${sqlQuote(b.south)},${sqlQuote(b.east)},${sqlQuote(b.north)},4326)
  AND tags ? 'name'
  AND tags->>'amenity' IN ('restaurant','fast_food')
  AND (
    tags->>'amenity' IN ('restaurant','fast_food')
    OR lower(coalesce(tags->>'brand','')) ~ 'mcdonald|taco bell|wendy|burger king|kfc|chick|popeyes|subway|sonic|arby|whataburger|five guys|culver|raising cane|wingstop|bojangles|cook out|jack in the box|dairy queen|hardee|del taco|checkers|rally|zaxby|church.s chicken|captain d|long john silver|jimmy john|jersey mike|firehouse subs|little caesars|domino|papa john|pizza hut|marco.s pizza|krystal|steak ?n shake|white castle|freddy|in[- ]n[- ]out|carl.s jr|el pollo loco|panda express|jack.s'
    OR lower(coalesce(tags->>'operator','')) ~ 'mcdonald|taco bell|wendy|burger king|kfc|chick|popeyes|subway|sonic|arby|whataburger|five guys|culver|raising cane|wingstop|bojangles|cook out|jack in the box|dairy queen|hardee|del taco|checkers|rally|zaxby|church.s chicken|captain d|long john silver|jimmy john|jersey mike|firehouse subs|little caesars|domino|papa john|pizza hut|marco.s pizza|krystal|steak ?n shake|white castle|freddy|in[- ]n[- ]out|carl.s jr|el pollo loco|panda express|jack.s'
  )
LIMIT 12000`;
}

function postpassTileCenters(lat, lon, radiusMi) {
  if (radiusMi <= 50) return [{ lat, lon, radiusMi }];
  const tileRadius = Math.min(50, Math.max(25, radiusMi / 2)); // 3x3 tile grid covers the requested radius up to the 100 mi launch cap. // 3x3 tile grid covers the requested radius up to the 100 mi launch cap.
  const latStep = tileRadius / 69;
  const cos = Math.max(0.35, Math.cos(lat * Math.PI / 180));
  const lonStep = tileRadius / (69 * cos);
  const out = [];
  for (const dy of [-1, 0, 1]) {
    for (const dx of [-1, 0, 1]) {
      out.push({ lat: lat + dy * latStep, lon: lon + dx * lonStep, radiusMi: tileRadius });
    }
  }
  return out;
}

async function postpassOne(lat, lon, radiusMi) {
  try {
    const data = await fetchJson(POSTPASS_ENDPOINT, {
      method: 'POST',
      body: new URLSearchParams([
        ['options[geojson]', 'false'],
        ['data', postpassQuery(lat, lon, radiusMi)]
      ]),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
    }, 6000);
    return { elements: Array.isArray(data?.result) ? data.result : [], error: null };
  } catch (e) {
    return { elements: [], error: errorText(e) };
  }
}

async function postpassSearch(lat, lon, radiusMi) {
  const started = Date.now();
  const centers = postpassTileCenters(lat, lon, radiusMi);
  const elements = [];
  const errors = [];
  let calls = 0;
  for (let i = 0; i < centers.length; i += 3) {
    const results = await Promise.all(centers.slice(i, i + 3).map(c => postpassOne(c.lat, c.lon, c.radiusMi)));
    calls += results.length;
    for (const result of results) {
      elements.push(...result.elements);
      if (result.error) errors.push(result.error);
    }
  }
  return {
    elements, ms: Date.now() - started, endpoint: POSTPASS_ENDPOINT,
    error: errors.length && !elements.length ? errors[0] : null,
    errors: errors.slice(0, 6), tiles: centers.length, calls
  };
}

function overpassQuery(lat, lon, radiusMi) {
  const meters = Math.round(Math.min(50, Math.max(1, radiusMi)) * 1609.344);
  return `[out:json][timeout:8];(nwr[amenity~"^(restaurant|fast_food)$"][name](around:${meters},${lat},${lon}););out center tags;`;
}

async function overpassFallback(lat, lon, radiusMi) {
  const started = Date.now();
  const q = overpassQuery(lat, lon, radiusMi);
  for (const method of ['POST', 'GET']) {
    try {
      const data = method === 'POST'
        ? await fetchJson(OVERPASS_FALLBACK_ENDPOINT, {
            method: 'POST',
            body: `data=${encodeURIComponent(q)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
          }, 7000)
        : await fetchJson(`${OVERPASS_FALLBACK_ENDPOINT}?data=${encodeURIComponent(q)}`, {}, 7000);
      return {
        elements: Array.isArray(data?.elements) ? data.elements : [],
        ms: Date.now() - started,
        endpoint: OVERPASS_FALLBACK_ENDPOINT,
        method,
        error: null
      };
    } catch (e) {
      if (method === 'GET') {
        return { elements: [], ms: Date.now() - started, endpoint: OVERPASS_FALLBACK_ENDPOINT, method, error: errorText(e) };
      }
    }
  }
  return { elements: [], ms: Date.now() - started, endpoint: OVERPASS_FALLBACK_ENDPOINT, error: 'request failed' };
}

function identity(row) {
  const clean = s => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const n = clean(row.name);
  const a = clean(row.address);
  if (n && a) return `a:${n}|${a}`;
  const lat = num(row.lat);
  const lon = num(row.lon);
  if (n && Number.isFinite(lat) && Number.isFinite(lon)) return `c:${n}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
  return `i:${clean(row.id)}`;
}

function mergeRows(rows, originLat, originLon, radiusMi) {
  const map = new Map();
  for (const raw of rows) {
    if (!raw) continue;
    const lat = num(raw.lat);
    const lon = num(raw.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !String(raw.name || '').trim()) continue;
    const d = miles(originLat, originLon, lat, lon);
    if (d > radiusMi) continue;
    const text = [
      raw.name,
      raw.brand,
      raw.operator,
      raw.category,
      raw.cuisine,
      Array.isArray(raw.tags) ? raw.tags.join(' ') : raw.tags,
      raw.amenity
    ].join(' ');
    const fast = raw.fastFood === true || isFastFoodText(text);
    const row = {
      ...raw,
      lat,
      lon,
      distanceMiles: d,
      fastFood: fast,
      amenity: fast ? 'fast_food' : String(raw.amenity || 'restaurant'),
      category: fast ? 'Fast Food' : String(raw.category || raw.cuisine || 'Restaurant'),
      tags: [...new Set([
        ...(Array.isArray(raw.tags) ? raw.tags : []),
        'restaurant',
        ...(fast ? ['fast_food', 'fast food'] : [])
      ])]
    };
    const k = identity(row);
    if (!map.has(k)) map.set(k, row);
    else {
      const old = map.get(k);
      map.set(k, {
        ...old,
        ...Object.fromEntries(Object.entries(row).filter(([_, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length))),
        fastFood: old.fastFood || row.fastFood,
        tags: [...new Set([...(old.tags || []), ...(row.tags || [])])]
      });
    }
  }
  return [...map.values()].sort((a, b) => a.distanceMiles - b.distanceMiles);
}

function cacheKey(lat, lon, radius) {
  return `${lat.toFixed(3)}:${lon.toFixed(3)}:${radius.toFixed(1)}:${GOOGLE_KEY ? 'g1' : 'g0'}`;
}

async function doSearch(lat, lon, radius) {
  const key = cacheKey(lat, lon, radius);
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.data, diagnostics: { ...(hit.data.diagnostics || {}), cacheHit: true } };
  }

  const started = Date.now();
  // Small-radius searches get a parallel Overpass supplement instead of relying
  // on the Postpass provider alone. This makes 1–5 mile searches much more
  // tolerant of sparse/incomplete OSM indexing at the exact center point.
  const [googleResult, postpassResult, smallRadiusFallback] = await Promise.all([
    googleSearch(lat, lon, radius),
    postpassSearch(lat, lon, radius),
    radius <= 5 ? overpassFallback(lat, lon, radius) : Promise.resolve(null)
  ]);

  let googleBundle = googleResult;
  let postpassBundle = postpassResult;
  let fallbackBundle = smallRadiusFallback;
  let fallbackUsed = !!(fallbackBundle?.elements?.length);

  if (!fallbackBundle && !postpassBundle.elements.length) {
    fallbackBundle = await overpassFallback(lat, lon, Math.min(radius, 50));
    fallbackUsed = fallbackBundle.elements.length > 0;
  }

  const googleRows = googleBundle.rows || [];
  const postpassRows = (postpassBundle.elements || []).map(postpassRow).filter(Boolean);
  const fallbackRows = (fallbackBundle?.elements || []).map(osmRow).filter(Boolean);
  const osmRows = [...postpassRows, ...fallbackRows];
  const merged = mergeRows([...googleRows, ...osmRows], lat, lon, radius);

  const data = {
    results: merged.slice(0, RESULT_LIMIT),
    restaurants: merged.slice(0, RESULT_LIMIT),
    items: merged.slice(0, RESULT_LIMIT),
    total: merged.length,
    fastFoodCount: merged.filter(r => r.fastFood).length,
    providersUsed: [
      ...(googleRows.length ? ['Google Places'] : []),
      ...(postpassRows.length ? ['OpenStreetMap (Postpass)'] : []),
      ...(fallbackRows.length ? ['OpenStreetMap (Overpass fallback)'] : [])
    ],
    googleConfigured: !!GOOGLE_KEY,
    providerCounts: {
      google: googleRows.length,
      osmPostpass: postpassRows.length,
      osmOverpassFallback: fallbackRows.length,
      osm: osmRows.length
    },
    diagnostics: {
      elapsedMs: Date.now() - started,
      googleTiles: Number(googleBundle.tiles || 0),
      googleCalls: Number(googleBundle.calls || 0),
      googleMs: Number(googleBundle.ms || 0),
      googleErrors: Array.isArray(googleBundle.errors) ? googleBundle.errors.slice(0, 10) : [],
      fastFoodFromGoogle: googleRows.filter(r => r.fastFood).length,
      fastFoodFromOsmPostpass: postpassRows.filter(r => r.fastFood).length,
      fastFoodFromOsmOverpassFallback: fallbackRows.filter(r => r.fastFood).length,
      postpassMs: Number(postpassBundle.ms || 0),
      postpassError: postpassBundle.error || null,
      postpassEndpoint: POSTPASS_ENDPOINT,
      postpassTiles: Number(postpassBundle.tiles || 0),
      postpassCalls: Number(postpassBundle.calls || 0),
      postpassErrors: Array.isArray(postpassBundle.errors) ? postpassBundle.errors.slice(0, 6) : [],
      overpassFallbackUsed: fallbackUsed,
      overpassFallbackMs: Number(fallbackBundle?.ms || 0),
      overpassFallbackError: fallbackBundle?.error || null,
      overpassFallbackEndpoint: OVERPASS_FALLBACK_ENDPOINT,
      cacheHit: false
    }
  };

  memoryCache.set(key, { at: Date.now(), data });
  return data;
}

function featurePlace(f, fallback = '') {
  const p = f?.properties || {};
  const c = f?.geometry?.coordinates || [];
  const lon = num(c[0]);
  const lat = num(c[1]);
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const city = p.city || p.town || p.village || p.municipality || p.locality || '';
  const state = p.state || p.county || '';
  const postcode = p.postcode || '';
  const display = [street, city, state, postcode, p.country || ''].filter(Boolean).join(', ') || String(p.name || fallback).trim();
  return { lat, lon, display: String(display), city: String(city), state: String(state), postcode: String(postcode) };
}

function scoreAddress(q, x) {
  const s = String(q || '').toLowerCase();
  const d = String(x?.display || '').toLowerCase();
  let score = 0;
  const zip = (s.match(/\b\d{5}(?:-\d{4})?\b/) || [])[0];
  const house = (s.match(/^\s*(\d{1,8})\b/) || [])[1];
  if (zip && d.includes(zip)) score += 60;
  if (house && new RegExp(`\\b${house}\\b`).test(d)) score += 55;
  for (const w of s.replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(w => w.length > 2)) if (d.includes(w)) score++;
  return score;
}

async function suggest(q, limit = 7) {
  const query = String(q || '').trim();
  const capped = Math.min(8, Math.max(1, num(limit, 7)));
  if (!query) return [];
  const addressLike = /^\s*\d{1,8}\b/.test(query);
  const tasks = [
    fetchJson('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?' + new URLSearchParams({SingleLine:query,f:'json',maxLocations:String(capped),outFields:'Match_addr,Addr_type,City,Region,Postal',forStorage:'false',countryCode:'USA'}), {}, 8000)
      .then(data=>(data?.candidates||[]).map(c=>{const loc=c.location||{},attr=c.attributes||{},lat=num(loc.y),lon=num(loc.x),display=String(c.address||attr.Match_addr||query),type=String(attr.Addr_type||'').toLowerCase();const bias=/pointaddress|streetaddress|parcel/.test(type)?500:/locality|city|postal/.test(type)?300:0;return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon,display,query:display,precision:type||'address',source:'ArcGIS Address',score:num(c.score,0)+scoreAddress(query,{display})+bias}:null}).filter(Boolean)),
    fetchJson('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?' + new URLSearchParams({text:query,f:'json',maxSuggestions:String(capped),countryCode:'USA'}), {}, 7000)
      .then(data=>(data?.suggestions||[]).map(x=>({display:String(x.text||query),query:String(x.text||query),precision:addressLike?'address':'place',source:'ArcGIS',lat:null,lon:null,magicKey:String(x.magicKey||'')}))),
    fetchJson('https://photon.komoot.io/api/?' + new URLSearchParams({q:query,limit:String(capped),lang:'en',countrycode:'US'}), {}, 7000)
      .then(data=>(data?.features||[]).map(f=>{const x=featurePlace(f,query),p=String(f?.properties?.osm_value||f?.properties?.type||'').toLowerCase();return{...x,query:x.display,precision:(x.postcode||/house|street/i.test(p))?'address':'place',source:'Photon',score:scoreAddress(query,x)+(/city|town|village|postcode/.test(p)&&!addressLike?350:0)};}))
  ];
  const settled=await Promise.allSettled(tasks);const all=settled.flatMap(r=>r.status==='fulfilled'?r.value:[]).filter(Boolean);all.sort((a,b)=>Number(b.score||0)-Number(a.score||0));
  const seen=new Set(),out=[];for(const x of all){const k=String(x.display||'').toLowerCase().replace(/\s+/g,' ').trim();if(!k||seen.has(k))continue;seen.add(k);out.push(x);if(out.length>=capped)break;}return out;
}

async function resolve(q) {
  const query = String(q || '').trim();
  if (!query) throw Object.assign(new Error('Enter a location.'), { code: 'EMPTY_LOCATION' });
  const direct = [];
  try {
    const url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?' + new URLSearchParams({
      address: query,
      benchmark: 'Public_AR_Current',
      format: 'json'
    });
    const data = await fetchJson(url, {}, 9000);
    const m = data?.result?.addressMatches?.[0];
    const lat = num(m?.coordinates?.y), lon = num(m?.coordinates?.x);
    if (m && Number.isFinite(lat) && Number.isFinite(lon)) {
      direct.push({ lat, lon, display: String(m.matchedAddress || query), precision: 'address', score: 1000 + scoreAddress(query, { display: m.matchedAddress || query }) });
    }
  } catch {}

  if (!direct.length) {
    try {
      const url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?' + new URLSearchParams({
        SingleLine: query, f: 'json', maxLocations: '8', outFields: 'Match_addr,Addr_type,City,Region,Postal', forStorage: 'false', countryCode: 'USA'
      });
      const data = await fetchJson(url, {}, 9000);
      for (const c of data?.candidates || []) {
        const loc = c.location || {}, a = c.attributes || {};
        const lat = num(loc.y), lon = num(loc.x);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const type = String(a.Addr_type || 'place').toLowerCase();
          const bias = /pointaddress|streetaddress|parcel/.test(type) ? 500 : /locality|city|postal/.test(type) ? 300 : 0;
          direct.push({ lat, lon, display: String(c.address || a.Match_addr || query), precision: type || 'place', score: num(c.score, 0) + scoreAddress(query, { display: c.address || a.Match_addr || query }) + bias });
        }
      }
    } catch {}
  }

  if (!direct.length) {
    try {
      const data = await fetchJson('https://photon.komoot.io/api/?' + new URLSearchParams({ q: query, limit: '8', lang: 'en', countrycode: 'US' }), {}, 9000);
      for (const f of data?.features || []) {
        const x = featurePlace(f, query);
        if (Number.isFinite(x.lat) && Number.isFinite(x.lon)) direct.push({ ...x, precision: x.postcode ? 'address' : 'place', score: scoreAddress(query, x) });
      }
    } catch {}
  }

  if (!direct.length) {
    try {
      const data = await fetchJson('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: query, format: 'jsonv2', limit: '3', countrycodes: 'us' }), {
        headers: { 'User-Agent': 'Dinliminate/1.0 restaurant location resolver' }
      }, 9000);
      for (const hit of data || []) {
        const lat = num(hit?.lat), lon = num(hit?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) direct.push({ lat, lon, display: String(hit.display_name || query), precision: 'place', score: scoreAddress(query, { display: hit.display_name || query }) });
      }
    } catch {}
  }

  if (!direct.length) throw Object.assign(new Error('That address or area could not be located.'), { code: 'NOT_FOUND' });
  direct.sort((a, b) => b.score - a.score);
  const best = direct[0];
  return { location: { lat: best.lat, lon: best.lon }, display: best.display, precision: best.precision };
}
async function reverse(lat, lon) {
  const a = num(lat);
  const b = num(lon);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Coordinates unavailable.');
  try {
    const data = await fetchJson('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?' + new URLSearchParams({
      location: `${b},${a}`, f: 'json', distance: '1000', langCode: 'EN'
    }), {}, 7000);
    const addr = data?.address || {};
    const display = String(addr.Match_addr || [addr.Address, addr.City, addr.Region, addr.Postal].filter(Boolean).join(', ') || 'Your location');
    return { display, city: String(addr.City || '') };
  } catch {}
  try {
    const data = await fetchJson('https://photon.komoot.io/reverse?' + new URLSearchParams({
      lat: String(a), lon: String(b), limit: '1', lang: 'en'
    }), {}, 7000);
    const x = featurePlace(data?.features?.[0], 'Your location');
    return { display: x.display || 'Your location', city: x.city || '' };
  } catch {
    return { display: 'Your location', city: '' };
  }
}

async function probeProvider(url) {
  const started = Date.now();
  const q = 'SELECT osm_id FROM postpass_pointpolygon WHERE geom && ST_MakeEnvelope(-87.361,36.528,-87.358,36.532,4326) AND tags->>\'amenity\'=\'restaurant\' LIMIT 1';
  try {
    const data = await fetchJson(url, {
      method: 'POST',
      body: new URLSearchParams([['options[geojson]', 'false'], ['data', q]]),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
    }, 9000);
    return { endpoint: url, ok: true, rows: Array.isArray(data?.result) ? data.result.length : 0, ms: Date.now() - started };
  } catch (e) {
    return { endpoint: url, ok: false, error: errorText(e), ms: Date.now() - started };
  }
}

function publicSearchData(data) {
  const diagnostics = data?.diagnostics || {};
  return { ...data, diagnostics: {
    elapsedMs: diagnostics.elapsedMs, cacheHit: !!diagnostics.cacheHit,
    googleTiles: diagnostics.googleTiles || 0, googleCalls: diagnostics.googleCalls || 0,
    postpassTiles: diagnostics.postpassTiles || 0, postpassCalls: diagnostics.postpassCalls || 0,
    overpassFallbackUsed: !!diagnostics.overpassFallbackUsed
  }};
}

async function proxyGooglePhoto(res, photoName) {
  if (!GOOGLE_KEY || !photoName) return res.status(404).end();
  const safe = decodeURIComponent(String(photoName));
  if (!/^places\//.test(safe)) return res.status(400).end();
  const url = `https://places.googleapis.com/v1/${safe}/media?maxHeightPx=1000&maxWidthPx=1200&key=${encodeURIComponent(GOOGLE_KEY)}`;
  const upstream = await fetch(url, { redirect: 'follow' });
  if (!upstream.ok || !upstream.body) return res.status(upstream.status || 502).end();
  res.statusCode = 200;
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=2592000');
  const arr = Buffer.from(await upstream.arrayBuffer());
  return res.end(arr);
}

async function handler(req, res) {
  sweepCaches();
  const mode = String(req?.query?.mode || 'health').toLowerCase();
  const limited = rateLimit(req, mode);
  if (limited.limited) { res.setHeader('Retry-After', String(limited.retryAfter)); return res.status(429).json({ ok:false, code:'RATE_LIMITED', message:'Too many requests. Please try again shortly.' }); }
  try {
    if (mode === 'photo') return proxyGooglePhoto(res, req.query?.name || req.query?.photoName || '');
    if (mode === 'health') {
      publicCache(res, 60);
      return res.status(200).json({
        ok: true,
        version: VERSION,
        googleConfigured: !!GOOGLE_KEY,
        maxRadiusMiles: MAX_RADIUS_MI,
        providers: {
          primary: GOOGLE_KEY ? 'Google Places + OpenStreetMap Postpass' : 'OpenStreetMap Postpass',
          fallback: 'OpenStreetMap Overpass (single endpoint)',
          geocoding: 'ArcGIS + Photon'
        }
      });
    }

    if (mode === 'suggest') {
      const q = String(req.query.q || '').trim().slice(0, 180);
      if (q.length < 2) return res.status(200).json({ ok: true, version: VERSION, results: [] });
      publicCache(res, 20); return res.status(200).json({ ok: true, version: VERSION, results: await suggest(q, num(req.query.limit, 7)) });
    }

    if (mode === 'resolve') {
      const q = String(req.query.q || '').trim().slice(0, 240);
      if (q.length < 2) return res.status(400).json({ ok:false, code:'EMPTY_LOCATION', message:'Enter a location.' });
      publicCache(res, 300); return res.status(200).json({ ok: true, version: VERSION, ...(await resolve(q)) });
    }

    if (mode === 'reverse') {
      const lat = num(req.query.lat), lon = num(req.query.lon);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return res.status(400).json({ok:false,code:'BAD_COORDINATES',message:'Coordinates are invalid.'});
      publicCache(res, 300); return res.status(200).json({ ok: true, version: VERSION, ...(await reverse(lat, lon)) });
    }

    if (mode === 'probe' && process.env.NODE_ENV !== 'production') {
      const results = await Promise.all([
        probeProvider(POSTPASS_ENDPOINT),
        probeProvider(OVERPASS_FALLBACK_ENDPOINT)
      ]);
      return res.status(200).json({
        ok: true,
        version: VERSION,
        googleConfigured: !!GOOGLE_KEY,
        results
      });
    }

    if (mode === 'search') {
      const lat = num(req.query.lat);
      const lon = num(req.query.lon);
      const radius = clampRadius(req.query.radius);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) {
        return res.status(400).json({ ok: false, code: 'BAD_COORDINATES', message: 'Search coordinates are invalid.' });
      }
      const data = await doSearch(lat, lon, radius);
      publicCache(res, 90); return res.status(200).json({ ok: true, version: VERSION, radiusMiles: radius, ...publicSearchData(data) });
    }

    return res.status(400).json({ ok: false, code: 'UNKNOWN_MODE', message: 'Unknown restaurant search mode.' });
  } catch (err) {
    console.error('restaurant-search-v626', err);
    return res.status(502).json({
      ok: false,
      version: VERSION,
      code: String(err?.code || 'SERVICE'),
      message: String(err?.message || 'Restaurant search service unavailable.')
    });
  }
}

module.exports = handler;
