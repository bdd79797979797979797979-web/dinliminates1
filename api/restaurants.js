const MAX_RADIUS=100;
const DEFAULT_RADIUS=10;
const DINING_AMENITIES='restaurant|fast_food';
const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter'];
const TARGETED_FAST=["McDonald's","Taco Bell","Wendy's","Burger King","KFC","Chick-fil-A","Popeyes","Subway","Sonic","Arby's","Whataburger","Five Guys","Raising Cane's","Wingstop","Bojangles","Cook Out","Dairy Queen","Zaxby's","Church's Chicken","Captain D's","Long John Silver's","Jimmy John's","Jersey Mike's","Firehouse Subs","Little Caesars","Domino's","Papa John's","Pizza Hut","Marco's Pizza","Krystal","Steak 'n Shake","White Castle","Freddy's","In-N-Out","Carl's Jr.","Panda Express","Jack in the Box","Hardee's","Del Taco","Checkers","Rally's"];
const FAST=/\b(?:mcdonald|taco bell|wendy|burger king|kfc|chick[- ]?fil[- ]?a|popeye|subway|sonic|arby|whataburger|five guys|culver|raising cane|wingstop|bojangles|cook ?out|dairy queen|jack in the box|hardee|del taco|checkers|rally|zaxby|churchs|captain ds|long john silver|jimmy john|jersey mike|firehouse subs|little caesars|domino|papa john|pizza hut|marcos pizza|krystal|steak ?n shake|white castle|freddy|in[- ]?n[- ]?out|carl.?s jr|panda express|jacks|chipotle)\b/i;
const timezoneCache=new Map(),cache=new Map(),buckets=new Map();
const SEARCH_BUDGET_MS=18000;
const GOOGLE_KEY=String(process.env.GOOGLE_PLACES_API_KEY||process.env.GOOGLE_MAPS_API_KEY||'').trim();
async function withinBudget(promise,ms,label){
 const wait=Math.max(250,ms);
 return Promise.race([promise,new Promise(resolve=>setTimeout(()=>resolve({__timeout:true,label}),wait))]);
}
function n(v,d=NaN){const x=Number(v);return Number.isFinite(x)?x:d}
function clamp(v){return Math.min(MAX_RADIUS,Math.max(1,n(v,DEFAULT_RADIUS)))}
function validCoords(lat,lon){return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180}
async function timezone(lat,lon){
 const key=lat.toFixed(2)+':'+lon.toFixed(2),hit=timezoneCache.get(key);
 if(hit&&Date.now()-hit.t<21600000)return hit.zone;
 try{
  const d=await json('https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m',timezone:'auto'}).toString(),{},4500);
  const zone=String(d?.timezone||'').trim();
  if(zone){timezoneCache.set(key,{t:Date.now(),zone});return zone}
 }catch{}
 return '';
}
function isFastFoodName(name,brand='',operator=''){return FAST.test(String(name||'')+' '+String(brand||'')+' '+String(operator||''))}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function miles(a,b,c,d){const R=3958.7613,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,z=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(z))}
async function json(url,opt={},timeout=9000){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),timeout);try{const r=await fetch(url,{...opt,signal:ctl.signal,headers:{Accept:'application/json',...(opt.headers||{})}});const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{}if(!r.ok)throw new Error('HTTP '+r.status);return data}finally{clearTimeout(t)}}
function rate(req,mode){const headers=req?.headers||{},client=String(headers['x-forwarded-for']||headers['client-ip']||headers['x-nf-client-connection-ip']||headers['cf-connecting-ip']||'anon').split(',')[0].trim()||'anon',key=mode+':'+client,now=Date.now(),old=buckets.get(key),max=(mode==='suggest'||mode==='reverse'||mode==='resolve')?40:18;if(!old||now-old.t>60000){buckets.set(key,{t:now,c:1});return false}old.c++;return old.c>max}
function osmRow(el,origin){const t=el?.tags||{},lat=n(el?.lat??el?.center?.lat),lon=n(el?.lon??el?.center?.lon),name=String(t.name||'').trim();if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))return null;const amen=String(t.amenity||'restaurant').toLowerCase(),fast=amen==='fast_food'||isFastFoodName(name,String(t.brand||''),String(t.operator||''));let website=String(t.website||t['contact:website']||'').trim();if(website&&!/^https?:\/\//i.test(website))website='https://'+website;const key=norm(name)+'|'+lat.toFixed(4)+'|'+lon.toFixed(4);return{id:el?.osm_id?'osm-'+el.osm_id:'osm-'+key.replace(/ /g,'-'),name,category:fast?'Fast Food':(String(t.cuisine||'').trim()||'Restaurant'),fastFood:fast,cuisine:String(t.cuisine||''),address:[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state'],t['addr:postcode']].filter(Boolean).join(', '),phone:String(t.phone||t['contact:phone']||''),website,opening_hours:String(t.opening_hours||''),lat,lon,distance:miles(origin.lat,origin.lon,lat,lon),photo:String(t.image||t.image_url||''),menuItems:[t.dish,t['dish:name'],t['menu:items'],t.menu_items].flatMap(v=>String(v||'').split(/[|;•,]/)).map(x=>x.trim()).filter(Boolean).slice(0,10),brand:String(t.brand||''),source:'OpenStreetMap'} }
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
 const osmValue=String(p.osm_value||'').toLowerCase(),amenity=String(p.type||p.osm_key||'').toLowerCase(),fast=osmValue==='fast_food'||amenity==='fast_food'||isFastFoodName(name,String(p.brand||''),String(p.operator||''));
 const website=String(p.website||p.url||'').trim(),dist=miles(origin.lat,origin.lon,lat,lon);
 return {id:p.osm_id?'photon-'+p.osm_id:'photon-'+norm(name)+'-'+lat.toFixed(5)+'-'+lon.toFixed(5),name,category:fast?'Fast Food':(String(p.cuisine||'').trim()||'Restaurant'),fastFood:fast,cuisine:String(p.cuisine||''),address:[p.street,p.housenumber,p.city||p.town||p.village,p.state,p.postcode].filter(Boolean).join(', '),phone:String(p.phone||''),website:(/^https?:/.test(website)?website:(website?'https://'+website:'')),opening_hours:String(p.opening_hours||''),lat,lon,distance:dist,photo:String(p.image||p.image_url||''),menuItems:[p.dish,p['dish:name'],p.menu_items,p['menu:items']].flatMap(v=>String(v||'').split(/[|;•,]/)).map(x=>x.trim()).filter(Boolean).slice(0,10),brand:String(p.brand||''),source:'Photon POI'};
}
async function photonPlaces(lat,lon,radius){
 const r=Math.min(MAX_RADIUS,Math.max(1,radius)),latD=r/69,lonD=r/(69*Math.max(.35,Math.cos(lat*Math.PI/180))),bbox=[lon-lonD,lat-latD,lon+lonD,lat+latD].join(',');
 const limit=radius>25?'250':'120';
 const base=[
   new URLSearchParams({q:'restaurant',osm_tag:'amenity:restaurant',bbox,limit,lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}),
   new URLSearchParams({q:'fast food',osm_tag:'amenity:fast_food',bbox,limit,lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'})
 ];
 const rows=[],errors=[];
 const consume=(result)=>{if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason));return}for(const feature of result.value?.features||[]){const pv=feature?.properties||{},ov=String(pv.osm_value||'').toLowerCase(),ok=String(pv.osm_key||'').toLowerCase();if(ok==='amenity'&&!DINING_AMENITIES.split('|').includes(ov)&&!FAST.test(String(pv.name||pv.brand||pv.operator||'')))continue;const row=photonRow(feature,{lat,lon});if(row&&row.distance<=radius)rows.push(row)}};
 for(const result of await Promise.allSettled(base.map(p=>json('https://photon.komoot.io/api/?'+p.toString(),{},6500))))consume(result);

 const primaryFastCount=rows.filter(r=>r.fastFood).length;
 const missingKnown=primaryFastCount<3 ? TARGETED_FAST.filter(name=>!rows.some(r=>norm(r.name)===norm(name)||norm(r.name).includes(norm(name)))).slice(0,4) : [];
 if(missingKnown.length){
   const qs=missingKnown.map(q=>new URLSearchParams({q,bbox,limit:'10',lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}));
   for(const result of await Promise.allSettled(qs.map(p=>json('https://photon.komoot.io/api/?'+p.toString(),{},4500))))consume(result);
 }
 return {rows,errors};
}

async function arcgisPlaces(lat,lon,radius){
 const r=Math.min(MAX_RADIUS,Math.max(1,radius)),latD=r/69,lonD=r/(69*Math.max(.35,Math.cos(lat*Math.PI/180)));
 const extent=[lon-lonD,lat-latD,lon+lonD,lat+latD].join(',');
 const categories=['Restaurant','Fast Food'];
 const rows=[],errors=[];
 const results=await Promise.allSettled(categories.map(async category=>{
   const params=new URLSearchParams({SingleLine:'',category,location:lon+','+lat,searchExtent:extent,maxLocations:'50',outFields:'PlaceName,Type,Place_addr,City,Region,Country,Phone,URL',forStorage:'false',f:'json'});
   return {category,data:await json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?'+params.toString(),{},7000)};
 }));
 for(const result of results){
   if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason));continue}
   const category=result.value.category;
   for(const cand of result.value.data?.candidates||[]){
     const a=cand?.location||{},cl=n(a.y),cn=n(a.x),attrs=cand?.attributes||{},name=String(attrs.PlaceName||cand.address||'').trim();
     if(!name||!Number.isFinite(cl)||!Number.isFinite(cn))continue;
     const fast=category==='Fast Food'||isFastFoodName(name,String(attrs.Type||''));
     const row={id:'arcgis-'+norm(name)+'-'+cl.toFixed(5)+'-'+cn.toFixed(5),name,category:fast?'Fast Food':'Restaurant',fastFood:fast,cuisine:'',address:String(attrs.Place_addr||cand.address||''),phone:String(attrs.Phone||attrs.phone||''),website:String(attrs.URL||attrs.Url||attrs.url||''),opening_hours:'',lat:cl,lon:cn,distance:miles(lat,lon,cl,cn),photo:'',menuItems:[],brand:'',source:'ArcGIS POI'};
     if(row.distance<=r)rows.push(row);
   }
 }
 return {rows,errors};
}

async function overpass(lat,lon,radius,types='restaurant|fast_food'){const els=[],errs=[];for(const ep of OVERPASS){const cs=centers(lat,lon,radius);for(let i=0;i<cs.length;i+=3){const got=await Promise.allSettled(cs.slice(i,i+3).map(c=>json(ep+'?data='+encodeURIComponent(query(c.lat,c.lon,c.radius,types)),{},7000)));for(const g of got){if(g.status==='fulfilled')els.push(...(g.value?.elements||[]));else errs.push(String(g.reason?.message||g.reason))}}if(els.length)break}const rows=[];for(const el of els){const r=osmRow(el,{lat,lon});if(r&&r.distance<=radius)rows.push(r)}return{rows,errors:errs}}
const KNOWN_RESTAURANT_WEBSITES={
  "mcdonald's":'https://www.mcdonalds.com',"taco bell":'https://www.tacobell.com',"wendy's":'https://www.wendys.com',"burger king":'https://www.bk.com',"kfc":'https://www.kfc.com',"chick fil a":'https://www.chick-fil-a.com',"popeyes":'https://www.popeyes.com',"subway":'https://www.subway.com',"sonic":'https://www.sonicdrivein.com',"arby's":'https://www.arbys.com',"whataburger":'https://whataburger.com',"five guys":'https://www.fiveguys.com',"culver's":'https://www.culvers.com',"raising cane's":'https://www.raisingcanes.com',"wingstop":'https://www.wingstop.com',"bojangles":'https://www.bojangles.com',"cook out":'https://www.cookout.com',"dairy queen":'https://www.dairyqueen.com',"zaxby's":'https://www.zaxbys.com',"church's chicken":'https://www.churchs.com',"captain d's":'https://www.captainds.com',"long john silver's":'https://www.ljsilvers.com',"jimmy john's":'https://www.jimmyjohns.com',"jersey mike's":'https://www.jerseymikes.com',"firehouse subs":'https://www.firehousesubs.com',"little caesars":'https://littlecaesars.com',"domino's":'https://www.dominos.com',"papa john's":'https://www.papajohns.com',"pizza hut":'https://www.pizzahut.com',"marco's pizza":'https://www.marcos.com',"krystal":'https://www.krystal.com',"steak 'n shake":'https://www.steaknshake.com',"white castle":'https://www.whitecastle.com',"freddy's":'https://www.freddys.com',"panda express":'https://www.pandaexpress.com',"jack in the box":'https://www.jackinthebox.com',"hardee's":'https://www.hardees.com',"del taco":'https://www.deltaco.com',"checkers":'https://www.checkers.com',"rally's":'https://www.rallys.com',"chipotle":'https://www.chipotle.com',"applebee's":'https://www.applebees.com',"chili's":'https://www.chilis.com',"olive garden":'https://www.olivegarden.com',"waffle house":'https://www.wafflehouse.com'
};
function knownRestaurantWebsite(row){
 const name=norm(row?.name),brand=norm(row?.brand);
 for(const [key,url] of Object.entries(KNOWN_RESTAURANT_WEBSITES)){
  const k=norm(key); if(name===k||name.includes(k)||brand===k||brand.includes(k))return url;
 }
 return '';
}
function escapeOverpassRegex(value){return String(value||'').replace(/[\\^$.*+?()[\\]{}|]/g,'\\\\function escapeOverpassRegex(value){return String(value||'').replace(/[\\^$.*+?()[\\]{}|]/g,'\\\\function escapeOverpassRegex(value){return String(value||'').replace(/[\\^$.*+?()[\\]{}|]/g,'\\\\function escapeOverpassRegex(value){return String(value||'').replace(/[\\^$.*+?()[\\]{}|]/g,'\\\\$&');}').replace(/"/g,'\\\"');}
function contactQuery').replace(/"/g,'\\\"');}
function contactQuery(lat,lon,radius,names){
 const pattern=names.map(escapeOverpassRegex).filter(Boolean).join('|');
 const m=Math.round(Math.min(25,Math.max(1,radius))*1609.344);
 return '[out:json][timeout:5];nwr[amenity~"^(restaurant|fast_food)$"][name~"^('+pattern+')$",i](around:'+m+','+lat+','+lon+');out center tags;';
}
async function contactEnrichment(lat,lon,radius,names){
 if(!names.length)return{rows:[],errors:[]};
 const data=contactQuery(lat,lon,radius,names),rows=[],errors=[];
 const settled=await Promise.allSettled(OVERPASS.map(ep=>json(ep+'?data='+encodeURIComponent(data),{},3200)));
 for(const result of settled){
  if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason||'request failed'));continue;}
  for(const el of result.value?.elements||[]){const r=osmRow(el,{lat,lon});if(r&&r.distance<=radius)rows.push(r);}
 }
 return{rows:dedupe(rows),errors};
}
async function googlePlaces(lat,lon,radius){
 if(!GOOGLE_KEY)return{rows:[],errors:[]};
 const meters=Math.round(Math.min(50000,Math.max(1609,radius*1609.344))),rows=[],errors=[];
 try{
  const data=await json('https://places.googleapis.com/v1/places:searchNearby',{
   method:'POST',
   headers:{
    'Content-Type':'application/json',
    'X-Goog-Api-Key':GOOGLE_KEY,
    'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.types'
   },
   body:JSON.stringify({
    includedTypes:['restaurant','fast_food'],
    maxResultCount:20,
    locationRestriction:{circle:{center:{latitude:lat,longitude:lon},radius:meters}}
   })
  },6500);
  for(const p of data?.places||[]){
   const loc=p?.location||{},plat=n(loc.latitude),plon=n(loc.longitude),name=String(p?.displayName?.text||'').trim();
   if(!name||!Number.isFinite(plat)||!Number.isFinite(plon))continue;
   const types=Array.isArray(p?.types)?p.types.map(String):[];
   const fast=types.includes('fast_food')||isFastFoodName(name);
   rows.push({id:p.id?'google-'+p.id:'google-'+norm(name)+'-'+plat.toFixed(5)+'-'+plon.toFixed(5),name,
    category:fast?'Fast Food':'Restaurant',fastFood:fast,cuisine:'',
    address:String(p?.formattedAddress||''),phone:String(p?.nationalPhoneNumber||''),website:String(p?.websiteUri||''),
    opening_hours:'',lat:plat,lon:plon,distance:miles(lat,lon,plat,plon),photo:'',menuItems:[],brand:'',source:'Google Places'});
  }
 }catch(e){errors.push(String(e?.message||e||'Google Places failed'));}
 return{rows,errors};
}
function providerPriority').replace(/"/g,'\\\"');}
function contactQuery(lat,lon,radius,names){
 const pattern=names.map(escapeOverpassRegex).filter(Boolean).join('|');
 const m=Math.round(Math.min(25,Math.max(1,radius))*1609.344);
 return '[out:json][timeout:5];nwr[amenity~"^(restaurant|fast_food)$"][name~"^('+pattern+')$",i](around:'+m+','+lat+','+lon+');out center tags;';
}
async function contactEnrichment(lat,lon,radius,names){
 if(!names.length)return{rows:[],errors:[]};
 const data=contactQuery(lat,lon,radius,names),rows=[],errors=[];
 const settled=await Promise.allSettled(OVERPASS.map(ep=>json(ep+'?data='+encodeURIComponent(data),{},3200)));
 for(const result of settled){
  if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason||'request failed'));continue;}
  for(const el of result.value?.elements||[]){const r=osmRow(el,{lat,lon});if(r&&r.distance<=radius)rows.push(r);}
 }
 return{rows:dedupe(rows),errors};
}
async function googlePlaces(lat,lon,radius){
 if(!GOOGLE_KEY)return{rows:[],errors:[]};
 const meters=Math.round(Math.min(50000,Math.max(1609,radius*1609.344))),rows=[],errors=[];
 try{
  const data=await json('https://places.googleapis.com/v1/places:searchNearby',{
   method:'POST',
   headers:{
    'Content-Type':'application/json',
    'X-Goog-Api-Key':GOOGLE_KEY,
    'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.types'
   },
   body:JSON.stringify({
    includedTypes:['restaurant','fast_food'],
    maxResultCount:20,
    locationRestriction:{circle:{center:{latitude:lat,longitude:lon},radius:meters}}
   })
  },6500);
  for(const p of data?.places||[]){
   const loc=p?.location||{},plat=n(loc.latitude),plon=n(loc.longitude),name=String(p?.displayName?.text||'').trim();
   if(!name||!Number.isFinite(plat)||!Number.isFinite(plon))continue;
   const types=Array.isArray(p?.types)?p.types.map(String):[];
   const fast=types.includes('fast_food')||isFastFoodName(name);
   rows.push({id:p.id?'google-'+p.id:'google-'+norm(name)+'-'+plat.toFixed(5)+'-'+plon.toFixed(5),name,
    category:fast?'Fast Food':'Restaurant',fastFood:fast,cuisine:'',
    address:String(p?.formattedAddress||''),phone:String(p?.nationalPhoneNumber||''),website:String(p?.websiteUri||''),
    opening_hours:'',lat:plat,lon:plon,distance:miles(lat,lon,plat,plon),photo:'',menuItems:[],brand:'',source:'Google Places'});
  }
 }catch(e){errors.push(String(e?.message||e||'Google Places failed'));}
 return{rows,errors};
}
function providerPriority(r){const s=String(r?.source||'');return s.startsWith('OpenStreetMap')?0:s.startsWith('Photon')?1:2}
function restaurantNameTokens(value){
  return norm(String(value||'').replace(/[’']s\\b/gi,' ')).split(' ').filter(Boolean);
}
function nameVariantMatch(a,b){
  const aa=restaurantNameTokens(a),bb=restaurantNameTokens(b);
  if(!aa.length||!bb.length)return false;
  const as=new Set(aa),bs=new Set(bb);
  const shared=aa.filter(t=>bs.has(t)).length;
  const shorter=Math.min(as.size,bs.size),union=new Set([...aa,...bb]).size;
  if(as.size===bs.size&&shared===as.size)return true;
  return shared===shorter && shared/union>=0.6;
}
function sameContact(x,r){
  const xp=norm(String(x?.phone||'').replace(/[^0-9]/g,''));
  const rp=norm(String(r?.phone||'').replace(/[^0-9]/g,''));
  if(xp&&rp&&xp.length>=10&&rp.length>=10&&xp.slice(-10)===rp.slice(-10))return true;
  const xw=norm(x?.website||''),rw=norm(r?.website||'');
  if(xw&&rw&&xw===rw)return true;
  return false;
}
function sameRestaurant(x,r){
  if(!x||!r)return false;
  const sameName=norm(x.name)===norm(r.name);
  const dist=Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&Number.isFinite(r.lat)&&Number.isFinite(r.lon) ? miles(x.lat,x.lon,r.lat,r.lon) : Infinity;
  if(dist>0.2)return false;
  const ax=norm(x.address||''), ar=norm(r.address||'');
  const sameAddress=!!ax&&!!ar&&ax===ar;
  const variant=nameVariantMatch(x.name,r.name);
  if(sameName)return dist<=0.15 || sameAddress || sameContact(x,r);
  if(sameContact(x,r))return dist<=0.2;
  if(sameAddress&&variant)return true;
  // Different names must share a verified address/contact match before merging.
  // This prevents nearby businesses with similar names from collapsing into one card.
  return false;
}
function dedupe(rows){
  rows=[...(rows||[])].sort((a,b)=>providerPriority(a)-providerPriority(b));
  const map=new Map();
  for(const r of rows){
    let key=null;
    for(const [k,x] of map){if(sameRestaurant(x,r)){key=k;break}}
    if(!key){
      const nameKey=norm(r.name),addr=norm(r.address||''),geo=Math.round(r.lat*1000)+'|'+Math.round(r.lon*1000);
      key=addr?(nameKey+'|'+addr):(nameKey+'|'+geo);
      while(map.has(key)) key=key+'|'+Math.round(r.lat*100000)+'|'+Math.round(r.lon*100000);
    }
    if(!map.has(key))map.set(key,{...r});
    else{
      const x=map.get(key);
      x.fastFood=x.fastFood||r.fastFood;
      for(const f of ['address','phone','website','opening_hours','photo','cuisine','brand','operator'])if(!x[f]&&r[f])x[f]=r[f];
      x.menuItems=[...new Set([...(x.menuItems||[]),...(r.menuItems||[])])].slice(0,10);
    }
  }
  return[...map.values()].sort((a,b)=>a.distance-b.distance);
}
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
async function suggest(q){
 const clean=String(q||'').trim().slice(0,180);if(clean.length<2)return[];
 const rows=[];
 const [arc,pho]=await Promise.allSettled([
  json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?'+new URLSearchParams({SingleLine:clean,f:'json',maxLocations:'7',outFields:'*',forStorage:'false',countryCode:'USA'}),{},6000),
  json('https://photon.komoot.io/api/?'+new URLSearchParams({q:clean,limit:'7',lang:'en',countrycode:'US'}),{},6000)
 ]);
 if(arc.status==='fulfilled')for(const c of arc.value?.candidates||[]){const lat=n(c?.location?.y),lon=n(c?.location?.x);if(validCoords(lat,lon))rows.push({lat,lon,display:String(c.address||c.attributes?.Match_addr||clean),source:'ArcGIS'})}
 if(pho.status==='fulfilled')for(const f of pho.value?.features||[]){const c=f?.geometry?.coordinates||[],lon=n(c[0]),lat=n(c[1]);if(validCoords(lat,lon))rows.push({lat,lon,display:[f?.properties?.name,f?.properties?.city||f?.properties?.town,f?.properties?.state,f?.properties?.postcode].filter(Boolean).join(', ')||clean,source:'Photon'})}
 const seen=new Set();return rows.filter(x=>{const k=norm(x.display);if(seen.has(k))return false;seen.add(k);return true}).slice(0,7)
}
async function reverse(lat,lon){try{const d=await json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?'+new URLSearchParams({location:lon+','+lat,f:'json'}),{},7000);return String(d?.address?.Match_addr||'Current location')}catch{return'Current location'}}
function requestQuery(req){
 const source=req?.query&&typeof req.query==='object'?req.query:(req?.queryStringParameters&&typeof req.queryStringParameters==='object'?req.queryStringParameters:null);
 if(source){
  const out=new URLSearchParams();
  for(const [key,value] of Object.entries(source)){
   if(value==null)continue;
   const val=Array.isArray(value)?value[0]:value;
   if(val!=null)out.set(key,String(val));
  }
  return out;
 }
 try{return new URL(String(req?.url||'/'),'https://dinliminate.local').searchParams}catch{return new URLSearchParams()}
}
async function handler(req,res){const q=requestQuery(req),mode=String(q.get('mode')||'health').toLowerCase();if(rate(req,mode))return res.status(429).json({ok:false,code:'RATE_LIMITED',message:'Too many requests. Try again shortly.'});try{
if(mode==='health'){if(res.setHeader)res.setHeader('Cache-Control','public, max-age=60, s-maxage=60, stale-while-revalidate=120');return res.status(200).json({ok:true,version:'r15',maxRadiusMiles:MAX_RADIUS,googlePlacesConfigured:!!GOOGLE_KEY,providers:['OpenStreetMap Overpass','ArcGIS','Photon',...(GOOGLE_KEY?['Google Places']:[]),'Open-Meteo timezone']});}
if(mode==='suggest'){if(res.setHeader)res.setHeader('Cache-Control','public, max-age=30, s-maxage=30, stale-while-revalidate=60');return res.status(200).json({ok:true,results:await suggest(q.get('q'))});}
if(mode==='resolve'){const x=await geocode(q.get('q'));return res.status(200).json({ok:true,...x})}
if(mode==='reverse'){const lat=n(q.get('lat')),lon=n(q.get('lon'));if(!validCoords(lat,lon))return res.status(400).json({ok:false,message:'Coordinates are invalid.'});if(res.setHeader)res.setHeader('Cache-Control','public, max-age=300, s-maxage=300, stale-while-revalidate=600');return res.status(200).json({ok:true,display:await reverse(lat,lon)})}
if(mode==='search'){
 const startedAt=Date.now();
 const lat=n(q.get('lat')),lon=n(q.get('lon')),radius=clamp(q.get('radius'));
 if(!validCoords(lat,lon))return res.status(400).json({ok:false,message:'Coordinates are invalid.'});
 const key=lat.toFixed(4)+':'+lon.toFixed(4)+':'+radius,hit=cache.get(key);
 if(hit&&Date.now()-hit.t<60000)return res.status(200).json(hit.data);
 if(res.setHeader)res.setHeader('Cache-Control','public, max-age=30, s-maxage=30, stale-while-revalidate=60');
 const timezonePromise=timezone(lat,lon);
 const primaryBatch=await withinBudget(Promise.allSettled([photonPlaces(lat,lon,radius),arcgisPlaces(lat,lon,radius),googlePlaces(lat,lon,radius)]),Math.max(1000,SEARCH_BUDGET_MS-(Date.now()-startedAt)),'Primary restaurant providers timed out');
 const photonResult=Array.isArray(primaryBatch)?primaryBatch[0]:{status:'rejected',reason:new Error('Primary restaurant providers timed out')};
 const arcgisResult=Array.isArray(primaryBatch)?primaryBatch[1]:{status:'rejected',reason:new Error('Primary restaurant providers timed out')};
 const googleResult=Array.isArray(primaryBatch)?primaryBatch[2]:{status:'rejected',reason:new Error('Primary restaurant providers timed out')};
 const photonOut=photonResult.status==='fulfilled'?photonResult.value:{rows:[],errors:[String(photonResult.reason?.message||photonResult.reason||'Photon unavailable')]};
 const arcgisOut=arcgisResult.status==='fulfilled'?arcgisResult.value:{rows:[],errors:[String(arcgisResult.reason?.message||arcgisResult.reason||'ArcGIS unavailable')]};
 const googleOut=googleResult.status==='fulfilled'?googleResult.value:{rows:[],errors:[String(googleResult.reason?.message||googleResult.reason||'Google Places unavailable')]};
 const preliminary=dedupe([...(googleOut.rows||[]),...(photonOut.rows||[]),...(arcgisOut.rows||[])]);
 const preliminaryFast=preliminary.filter(r=>r.fastFood).length;
 let osmOut={rows:[],errors:[]};
 const needsFallback=!preliminary.length||preliminaryFast===0||(radius<=25&&preliminaryFast<2);
 if(needsFallback){
  const fallbackRadius=Math.min(radius,50);
  const remaining=Math.max(0,SEARCH_BUDGET_MS-(Date.now()-startedAt));
  if(remaining>1000){
    const got=await withinBudget(overpass(lat,lon,fallbackRadius,'restaurant|fast_food'),remaining,'Overpass fallback timed out');
    if(got&&!got.__timeout){osmOut.rows.push(...(got.rows||[]));osmOut.errors.push(...(got.errors||[]))}
    else osmOut.errors.push('Overpass fallback timed out');
  }else osmOut.errors.push('Search budget reached before Overpass fallback.');
 }
 if(radius>50&&(!preliminary.length||preliminaryFast===0)){
  const remaining=Math.max(0,SEARCH_BUDGET_MS-(Date.now()-startedAt));
  if(remaining>1000){
    const extra=await withinBudget(overpass(lat,lon,radius,DINING_AMENITIES),remaining,'Wide restaurant search timed out');
    if(extra&&!extra.__timeout){osmOut.rows.push(...(extra.rows||[]));osmOut.errors.push(...(extra.errors||[]))}
    else osmOut.errors.push('Wide restaurant search timed out');
  }else osmOut.errors.push('Search budget reached before wide restaurant search.');
 }
 let contactOut={rows:[],errors:[]};
 const contactCandidates=dedupe([...preliminary,...osmOut.rows]);
 const missingContactNames=contactCandidates
   .filter(r=>!r.phone||!r.website)
   .sort((a,b)=>Number(b.fastFood)-Number(a.fastFood)||Number(a.distance||0)-Number(b.distance||0))
   .map(r=>r.name)
   .filter(Boolean)
   .filter((name,i,a)=>a.findIndex(x=>norm(x)===norm(name))===i)
   .slice(0,15);
 const contactRemaining=Math.max(0,SEARCH_BUDGET_MS-(Date.now()-startedAt));
 if(missingContactNames.length&&contactRemaining>2200){
   const expandedNames=[...new Set(contactCandidates.filter(r=>missingContactNames.some(n=>norm(n)===norm(r.name))).flatMap(r=>[r.name,r.brand,r.operator]).filter(Boolean))].slice(0,24);
   const got=await withinBudget(contactEnrichment(lat,lon,Math.min(radius,25),expandedNames),contactRemaining,'Restaurant contact enrichment timed out');
   if(got&&!got.__timeout)contactOut=got; else contactOut.errors.push('Contact enrichment timed out');
  }
  const rows=dedupe([...contactCandidates,...contactOut.rows]).map(r=>{
   const website=r.website||knownRestaurantWebsite(r);
   const phone=String(r.phone||'').trim();
   return {...r,photo:image(r),website,phone,websiteSource:r.website?'provider':(website?'official-brand':'google-search-fallback'),phoneSource:phone?'provider':'google-search-fallback'};
  });
 const zone=await timezonePromise;
 const data={ok:true,version:'r15',googlePlacesConfigured:!!GOOGLE_KEY,radiusMiles:radius,total:rows.length,fastFoodCount:rows.filter(r=>r.fastFood).length,timezone:zone,lat,lon,searchLatencyMs:Date.now()-startedAt,searchBudgetMs:SEARCH_BUDGET_MS,providers:{google:(googleOut.rows||[]).length,photon:(photonOut.rows||[]).length,arcgis:(arcgisOut.rows||[]).length,overpass:(osmOut.rows||[]).length,contact:(contactOut.rows||[]).length},providerErrors:[...googleOut.errors,...photonOut.errors,...arcgisOut.errors,...osmOut.errors,...contactOut.errors].slice(0,8),results:rows};
 cache.set(key,{t:Date.now(),data});return res.status(200).json(data)}
return res.status(400).json({ok:false,message:'Unknown mode.'})
}catch(e){console.error('dinliminate-r15',e);return res.status(502).json({ok:false,code:String(e?.code||'SERVICE'),message:String(e?.message||'Restaurant service unavailable.')})}}
handler._test={isFastFoodName,dedupe,restaurantNameTokens,nameVariantMatch,sameRestaurant,requestQuery};
module.exports=handler;