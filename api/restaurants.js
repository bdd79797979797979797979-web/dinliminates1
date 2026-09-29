const MAX_RADIUS=100;
const DEFAULT_RADIUS=10;
const DINING_AMENITIES='restaurant|fast_food|cafe|pub|food_court';
const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter'];
const FAST=/\b(?:mcdonald|taco bell|wendy|burger king|kfc|chick[- ]?fil[- ]?a|popeye|subway|sonic|arby|whataburger|five guys|culver|raising cane|wingstop|bojangles|cook ?out|dairy queen|jack in the box|hardee|del taco|checkers|rally|zaxby|churchs|captain ds|long john silver|jimmy john|jersey mike|firehouse subs|little caesars|domino|papa john|pizza hut|marcos pizza|krystal|steak ?n shake|white castle|freddy|in[- ]?n[- ]?out|carl.?s jr|panda express|jacks|chipotle|ruby tuesday|applebee|chili.?s|olive garden|longhorn steakhouse|outback steakhouse|cracker barrel|texas roadhouse|o charley|logans road|red lobster|panera bread)\b/i;
const cache=new Map(),buckets=new Map();
function n(v,d=NaN){const x=Number(v);return Number.isFinite(x)?x:d}
function clamp(v){return Math.min(MAX_RADIUS,Math.max(1,n(v,DEFAULT_RADIUS)))}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function miles(a,b,c,d){const R=3958.7613,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,z=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(z))}
async function json(url,opt={},timeout=9000){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),timeout);try{const r=await fetch(url,{...opt,signal:ctl.signal,headers:{Accept:'application/json',...(opt.headers||{})}});const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{}if(!r.ok)throw new Error('HTTP '+r.status);return data}finally{clearTimeout(t)}}
function rate(req,mode){const key=mode+':'+String(req?.headers?.['x-forwarded-for']||'anon').split(',')[0].trim(),now=Date.now(),old=buckets.get(key),max=(mode==='suggest'||mode==='reverse'||mode==='resolve')?40:18;if(!old||now-old.t>60000){buckets.set(key,{t:now,c:1});return false}old.c++;return old.c>max}
function osmRow(el,origin){const t=el?.tags||{},lat=n(el?.lat??el?.center?.lat),lon=n(el?.lon??el?.center?.lon),name=String(t.name||'').trim();if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))return null;const amen=String(t.amenity||'restaurant').toLowerCase(),fast=amen==='fast_food'||FAST.test(name+' '+String(t.brand||'')+' '+String(t.operator||''));let website=String(t.website||t['contact:website']||'').trim();if(website&&!/^https?:\/\//i.test(website))website='https://'+website;const key=norm(name)+'|'+lat.toFixed(4)+'|'+lon.toFixed(4);return{id:el?.osm_id?'osm-'+el.osm_id:'osm-'+key.replace(/ /g,'-'),name,category:fast?'Fast Food':(String(t.cuisine||'').trim()||'Restaurant'),fastFood:fast,cuisine:String(t.cuisine||''),address:[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state'],t['addr:postcode']].filter(Boolean).join(', '),phone:String(t.phone||t['contact:phone']||''),website,opening_hours:String(t.opening_hours||''),lat,lon,distance:miles(origin.lat,origin.lon,lat,lon),photo:String(t.image||t.image_url||''),menuItems:[t.dish,t['dish:name'],t['menu:items'],t.menu_items].flatMap(v=>String(v||'').split(/[|;•,]/)).map(x=>x.trim()).filter(Boolean).slice(0,10),brand:String(t.brand||''),source:'OpenStreetMap'} }
function query(lat,lon,radius,types=DINING_AMENITIES){
 const m=Math.round(Math.min(50,radius)*1609.344);
 if(types==='fast_food'){
   const pattern='mcdonald|taco bell|wendy|burger king|kfc|chick[- ]?fil[- ]?a|popeye|subway|sonic|arby|whataburger|five guys|culver|raising cane|wingstop|bojangles|cook ?out|dairy queen|jack in the box|hardee|del taco|checkers|rally|zaxby|churchs|captain ds|long john silver|jimmy john|jersey mike|firehouse subs|little caesars|domino|papa john|pizza hut|marcos pizza|krystal|steak ?n shake|white castle|freddy|in[- ]?n[- ]?out|carl.?s jr|panda express|jacks|chipotle';
   return '[out:json][timeout:16];(nwr[amenity="fast_food"][name](around:'+m+','+lat+','+lon+');nwr[name~"'+pattern+'",i](around:'+m+','+lat+','+lon+');nwr[brand~"'+pattern+'",i](around:'+m+','+lat+','+lon+'););out center tags;';
 }
 return '[out:json][timeout:16];nwr[amenity~"^('+types+')$"][name](around:'+m+','+lat+','+lon+');out center tags;';
}
function centers(lat,lon,r){if(r<=50)return[{lat,lon,radius:r}];const out=[{lat,lon,radius:50}],ring=Math.min(70,r-35),a=ring/69,b=ring/(69*Math.max(.35,Math.cos(lat*Math.PI/180)));for(let i=0;i<6;i++){const ang=i*Math.PI/3;out.push({lat:lat+Math.sin(ang)*a,lon:lon+Math.cos(ang)*b,radius:50})}return out}

function photonRow(feature,origin){
 const p=feature?.properties||{},c=feature?.geometry?.coordinates||[],lon=n(c[0]),lat=n(c[1]),name=String(p.name||p.label||'').split(',')[0].trim();
 if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))return null;
 const osmValue=String(p.osm_value||'').toLowerCase(),amenity=String(p.type||p.osm_key||'').toLowerCase(),fast=osmValue==='fast_food'||amenity==='fast_food'||FAST.test(name+' '+String(p.brand||'')+' '+String(p.operator||'')+' '+String(p.cuisine||''));
 const website=String(p.website||p.url||'').trim(),dist=miles(origin.lat,origin.lon,lat,lon);
 return {id:p.osm_id?'photon-'+p.osm_id:'photon-'+norm(name)+'-'+lat.toFixed(5)+'-'+lon.toFixed(5),name,category:fast?'Fast Food':(String(p.cuisine||'').trim()||'Restaurant'),fastFood:fast,cuisine:String(p.cuisine||''),address:[p.street,p.housenumber,p.city||p.town||p.village,p.state,p.postcode].filter(Boolean).join(', '),phone:String(p.phone||''),website:(/^https?:/.test(website)?website:(website?'https://'+website:'')),opening_hours:String(p.opening_hours||''),lat,lon,distance:dist,photo:String(p.image||p.image_url||''),menuItems:[p.dish,p['dish:name'],p.menu_items,p['menu:items']].flatMap(v=>String(v||'').split(/[|;•,]/)).map(x=>x.trim()).filter(Boolean).slice(0,10),brand:String(p.brand||''),source:'Photon POI'};
}
async function photonPlaces(lat,lon,radius){
 const r=Math.min(MAX_RADIUS,Math.max(1,radius)),latD=r/69,lonD=r/(69*Math.max(.35,Math.cos(lat*Math.PI/180))),bbox=[lon-lonD,lat-latD,lon+lonD,lat+latD].join(',');
 const limit=radius>25?'250':'120';
 const base=[
   new URLSearchParams({q:'restaurant',osm_tag:'amenity:restaurant',bbox,limit,lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}),
   new URLSearchParams({q:'fast food',osm_tag:'amenity:fast_food',bbox,limit,lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}),
   new URLSearchParams({q:'cafe',osm_tag:'amenity:cafe',bbox,limit:'80',lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}),
   new URLSearchParams({q:'pub',osm_tag:'amenity:pub',bbox,limit:'80',lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}),
   new URLSearchParams({q:'food',osm_tag:'amenity:food_court',bbox,limit:'50',lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'})
 ];
 const rows=[],errors=[];
 const consume=(result)=>{if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason));return}for(const feature of result.value?.features||[]){const pv=feature?.properties||{},ov=String(pv.osm_value||'').toLowerCase(),ok=String(pv.osm_key||'').toLowerCase();if(ok==='amenity'&&![...DINING_AMENITIES.split('|'),'fast_food'].includes(ov)&&!FAST.test(String(pv.name||pv.brand||pv.operator||'')))continue;const row=photonRow(feature,{lat,lon});if(row&&row.distance<=radius)rows.push(row)}};
 for(const result of await Promise.allSettled(base.map(p=>json('https://photon.komoot.io/api/?'+p.toString(),{},6500))))consume(result);

 const targeted=["Ruby Tuesday","Chipotle","The Thirsty Goat","Applebee's","Chili's","Olive Garden","LongHorn Steakhouse","Outback Steakhouse","Cracker Barrel","Texas Roadhouse","O'Charley's","Logan's Roadhouse","Red Lobster","Panera Bread"];
 const missingKnown=targeted.filter(name=>!rows.some(r=>norm(r.name)===norm(name)||norm(r.name).includes(norm(name)))).slice(0,10);
 if(missingKnown.length){
   const qs=missingKnown.map(q=>new URLSearchParams({q,bbox,limit:'10',lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}));
   for(const result of await Promise.allSettled(qs.map(p=>json('https://photon.komoot.io/api/?'+p.toString(),{},4500))))consume(result);
 }
 return {rows,errors};
}

async function overpass(lat,lon,radius,types='restaurant|fast_food'){const els=[],errs=[];for(const ep of OVERPASS){const cs=centers(lat,lon,radius);for(let i=0;i<cs.length;i+=3){const got=await Promise.allSettled(cs.slice(i,i+3).map(c=>json(ep+'?data='+encodeURIComponent(query(c.lat,c.lon,c.radius,types)),{},7000)));for(const g of got){if(g.status==='fulfilled')els.push(...(g.value?.elements||[]));else errs.push(String(g.reason?.message||g.reason))}}if(els.length)break}const rows=[];for(const el of els){const r=osmRow(el,{lat,lon});if(r&&r.distance<=radius)rows.push(r)}return{rows,errors:errs}}
function dedupe(rows){const map=new Map();for(const r of rows){const addr=norm(r.address||''),geo=Math.round(r.lat*1000)+'|'+Math.round(r.lon*1000),key=addr?(norm(r.name)+'|'+addr):(norm(r.name)+'|'+geo);if(!map.has(key))map.set(key,r);else{const x=map.get(key);x.fastFood=x.fastFood||r.fastFood;for(const f of ['address','phone','website','opening_hours','photo','cuisine','brand'])if(!x[f]&&r[f])x[f]=r[f]}}return[...map.values()].sort((a,b)=>a.distance-b.distance)}
function namedImage(s){
  const q=norm(s||'');
  const map=[
    [/mcdonald/, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85'],
    [/taco bell/, 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85'],
    [/wendy/, 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=85'],
    [/burger king/, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1200&q=85'],
    [/kfc/, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=85'],
    [/popeye/, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=85'],
    [/chick fil a|chickfila/, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=85'],
    [/subway|jimmy john|jersey mike|firehouse subs/, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=85'],
    [/sonic/, 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=1200&q=85'],
    [/five guys/, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=1200&q=85'],
    [/whataburger/, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=85'],
    [/waffle house|ihop|denny/, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=85'],
    [/applebee/, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85'],
    [/chili.?s/, 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85'],
    [/olive garden/, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=85'],
    [/chipotle/, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85'],
    [/pizza|pizzeria|domino|papa john|pizza hut|marcos pizza|little caesars/, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85'],
    [/mexican|taco|burrito/, 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85']
  ];
  for(const [re,url] of map) if(re.test(q)) return url;
  return '';
}
function image(r){
  if(r.photo&&/^https?:\/\//i.test(r.photo)) return r.photo;
  const byName=namedImage(r.name);
  if(byName) return byName;
  const byBrand=namedImage(r.brand);
  if(byBrand) return byBrand;
  const byOperator=namedImage(r.operator);
  if(byOperator) return byOperator;
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85';
}
async function geocode(q){const clean=String(q||'').trim().slice(0,180);if(!clean)throw Object.assign(new Error('Enter a location.'),{code:'EMPTY_LOCATION'});let rows=[];try{const d=await json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?'+new URLSearchParams({SingleLine:clean,f:'json',maxLocations:'6',outFields:'*',forStorage:'false',countryCode:'USA'}),{},8000);for(const c of d?.candidates||[]){const lat=n(c?.location?.y),lon=n(c?.location?.x);if(Number.isFinite(lat)&&Number.isFinite(lon))rows.push({lat,lon,display:String(c.address||c.attributes?.Match_addr||clean),score:n(c.score,0)+500})}}catch{}if(!rows.length){try{const d=await json('https://photon.komoot.io/api/?'+new URLSearchParams({q:clean,limit:'6',lang:'en',countrycode:'US'}),{},8000);for(const f of d?.features||[]){const c=f?.geometry?.coordinates||[],lon=n(c[0]),lat=n(c[1]);if(Number.isFinite(lat)&&Number.isFinite(lon))rows.push({lat,lon,display:[f?.properties?.name,f?.properties?.city||f?.properties?.town,f?.properties?.state,f?.properties?.postcode].filter(Boolean).join(', ')||clean,score:100})}}catch{}}if(!rows.length)throw Object.assign(new Error('That address or area could not be located.'),{code:'NOT_FOUND'});rows.sort((a,b)=>b.score-a.score);return rows[0]}
async function suggest(q){const clean=String(q||'').trim().slice(0,180);if(clean.length<2)return[];const rows=[];try{const d=await json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?'+new URLSearchParams({SingleLine:clean,f:'json',maxLocations:'7',outFields:'*',forStorage:'false',countryCode:'USA'}),{},7000);for(const c of d?.candidates||[]){const lat=n(c?.location?.y),lon=n(c?.location?.x);if(Number.isFinite(lat)&&Number.isFinite(lon))rows.push({lat,lon,display:String(c.address||c.attributes?.Match_addr||clean),source:'ArcGIS'})}}catch{}try{const d=await json('https://photon.komoot.io/api/?'+new URLSearchParams({q:clean,limit:'7',lang:'en',countrycode:'US'}),{},7000);for(const f of d?.features||[]){const c=f?.geometry?.coordinates||[],lon=n(c[0]),lat=n(c[1]);if(Number.isFinite(lat)&&Number.isFinite(lon))rows.push({lat,lon,display:[f?.properties?.name,f?.properties?.city||f?.properties?.town,f?.properties?.state,f?.properties?.postcode].filter(Boolean).join(', ')||clean,source:'Photon'})}}catch{}const seen=new Set();return rows.filter(x=>{const k=norm(x.display);if(seen.has(k))return false;seen.add(k);return true}).slice(0,7)}
async function reverse(lat,lon){try{const d=await json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?'+new URLSearchParams({location:lon+','+lat,f:'json'}),{},7000);return String(d?.address?.Match_addr||'Current location')}catch{return'Current location'}}
async function handler(req,res){const mode=String(req?.query?.mode||'health').toLowerCase();if(rate(req,mode))return res.status(429).json({ok:false,code:'RATE_LIMITED',message:'Too many requests. Try again shortly.'});try{
if(mode==='health')return res.status(200).json({ok:true,version:'r11',maxRadiusMiles:MAX_RADIUS,providers:['OpenStreetMap Overpass','ArcGIS','Photon']});
if(mode==='suggest')return res.status(200).json({ok:true,results:await suggest(req.query.q)});
if(mode==='resolve'){const x=await geocode(req.query.q);return res.status(200).json({ok:true,...x})}
if(mode==='reverse'){const lat=n(req.query.lat),lon=n(req.query.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))return res.status(400).json({ok:false,message:'Coordinates are invalid.'});return res.status(200).json({ok:true,display:await reverse(lat,lon)})}
if(mode==='search'){const lat=n(req.query.lat),lon=n(req.query.lon),radius=clamp(req.query.radius);if(!Number.isFinite(lat)||!Number.isFinite(lon))return res.status(400).json({ok:false,message:'Coordinates are invalid.'});const key=lat.toFixed(3)+':'+lon.toFixed(3)+':'+radius,hit=cache.get(key);if(hit&&Date.now()-hit.t<60000)return res.status(200).json(hit.data);const photonPromise=photonPlaces(lat,lon,radius);const fallbackRadius=Math.min(radius,50);const fallbackPromise=radius<=50?Promise.allSettled([overpass(lat,lon,fallbackRadius,'restaurant|fast_food|cafe|pub|food_court'),overpass(lat,lon,fallbackRadius,'fast_food')]):Promise.resolve([]);const [photonResult,fallbackResult]=await Promise.allSettled([photonPromise,fallbackPromise]);const photonOut=photonResult.status==='fulfilled'?photonResult.value:{rows:[],errors:[String(photonResult.reason?.message||photonResult.reason||'Photon unavailable')]};let osmOut={rows:[],errors:[]};if(fallbackResult.status==='fulfilled'){for(const x of fallbackResult.value||[])if(x.status==='fulfilled'){osmOut.rows.push(...(x.value?.rows||[]));osmOut.errors.push(...(x.value?.errors||[]))}else osmOut.errors.push(String(x.reason?.message||x.reason||'Overpass unavailable'))}else osmOut.errors.push(String(fallbackResult.reason?.message||fallbackResult.reason||'Overpass unavailable'));if(!photonOut.rows.length&&radius>50){const extra=await overpass(lat,lon,radius,DINING_AMENITIES);osmOut.rows.push(...(extra.rows||[]));osmOut.errors.push(...(extra.errors||[]))}const rows=dedupe([...(photonOut.rows||[]),...(osmOut.rows||[])]).map(r=>({...r,photo:image(r)}));if(!rows.length&&photonOut.errors.length&&osmOut.errors.length)throw Object.assign(new Error('Restaurant providers are temporarily unavailable. Please try again.'),{code:'PROVIDER_UNAVAILABLE'});const data={ok:true,version:'clean-r9',radiusMiles:radius,total:rows.length,fastFoodCount:rows.filter(r=>r.fastFood).length,providers:{photon:(photonOut.rows||[]).length,overpass:(osmOut.rows||[]).length},providerErrors:[...photonOut.errors,...osmOut.errors].slice(0,6),results:rows};cache.set(key,{t:Date.now(),data});return res.status(200).json(data)}
return res.status(400).json({ok:false,message:'Unknown mode.'})
}catch(e){console.error('dinliminate-r10',e);return res.status(502).json({ok:false,code:String(e?.code||'SERVICE'),message:String(e?.message||'Restaurant service unavailable.')})}}
module.exports=handler;