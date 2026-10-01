const RESTAURANT_TAXONOMY=require('../data/restaurant-taxonomy');
const MAX_RADIUS=100;
const API_VERSION='r22';
const DEFAULT_RADIUS=10;
const DINING_AMENITIES='restaurant|fast_food';
const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter'];
const TARGETED_FAST=["McDonald's","Taco Bell","Wendy's","Burger King","KFC","Chick-fil-A","Popeyes","Subway","Sonic","Arby's","Whataburger","Five Guys","Raising Cane's","Wingstop","Bojangles","Cook Out","Dairy Queen","Zaxby's","Church's Chicken","Captain D's","Long John Silver's","Jimmy John's","Jersey Mike's","Firehouse Subs","Little Caesars","Domino's","Papa John's","Pizza Hut","Marco's Pizza","Krystal","Steak 'n Shake","White Castle","Freddy's","In-N-Out","Carl's Jr.","Panda Express","Jack in the Box","Hardee's","Del Taco","Checkers","Rally's"];
const FAST=/\b(?:mcdonald|taco bell|wendy|burger king|kfc|chick[- ]?fil[- ]?a|popeye|subway|sonic|arby|whataburger|five guys|culver|raising cane|wingstop|bojangles|cook ?out|dairy queen|jack in the box|hardee|del taco|checkers|rally|zaxby|churchs|captain ds|long john silver|jimmy john|jersey mike|firehouse subs|little caesars|domino|papa john|pizza hut|marcos pizza|krystal|steak ?n shake|white castle|freddy|in[- ]?n[- ]?out|carl.?s jr|panda express|jacks|chipotle)\b/i;
const timezoneCache=new Map(),cache=new Map(),buckets=new Map();
const SEARCH_BUDGET_MS=12000;
const WIDE_DISCOVERY_RESERVE_MS=4500;
const WIDE_RADIUS_THRESHOLD=25;
const OVERPASS_HTTP_TIMEOUT_MS=4800;
const MAX_SEARCH_PER_MINUTE=60;
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
function serverLocalClock(zone,now=new Date()){
 const opts={timeZone:zone||undefined,hour12:false,weekday:'short',hour:'2-digit',minute:'2-digit'};
 try{
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',opts).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  const dayIndex={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[parts.weekday];
  let hour=Number(parts.hour); if(hour===24)hour=0;
  return {day:Number.isFinite(dayIndex)?dayIndex:new Date().getDay(),minute:hour*60+Number(parts.minute||0)};
 }catch{return {day:new Date().getDay(),minute:new Date().getHours()*60+new Date().getMinutes()};}
}
function serverDayMatches(spec,day){
 const names=['su','mo','tu','we','th','fr','sa'],want=names[day];
 return String(spec||'').split(',').some(part=>{
  const p=part.trim().toLowerCase(); if(!p)return false;
  if(p===want)return true;
  const m=p.match(/^(su|mo|tu|we|th|fr|sa)-(su|mo|tu|we|th|fr|sa)$/);
  if(!m)return false;
  const a=names.indexOf(m[1]),b=names.indexOf(m[2]);
  return a<=b?day>=a&&day<=b:day>=a||day<=b;
 });
}
function serverParseTime(t){
 const m=String(t||'').match(/^(\d{1,2}):?(\d{2})$/); if(!m)return NaN;
 const h=Number(m[1]),min=Number(m[2]); return h>=0&&h<24&&min>=0&&min<60?h*60+min:NaN;
}
function serverHoursState(row,zone='',now=new Date()){
 if(row&&typeof row.hoursState==='string'&&/^(open|closed|unknown)$/.test(row.hoursState))return row.hoursState;
 if(row&&typeof row.openNow==='boolean')return row.openNow?'open':'closed';
 const raw=String(row?.opening_hours||'').trim();
 if(!raw)return 'unknown';
 const low=raw.toLowerCase();
 if(low==='24/7'||low==='open')return 'open';
 if(low==='closed'||low==='off')return 'closed';
 const clock=serverLocalClock(zone,now),day=clock.day,minute=clock.minute;
 let matched=false;
 for(const block of raw.split(';')){
  const part=block.trim();if(!part)continue;
  const dm=part.match(/^((?:Su|Mo|Tu|We|Th|Fr|Sa)(?:-(?:Su|Mo|Tu|We|Th|Fr|Sa))?(?:,(?:Su|Mo|Tu|We|Th|Fr|Sa)(?:-(?:Su|Mo|Tu|We|Th|Fr|Sa))?)*)\s+(.+)$/i);
  const daySpec=dm?dm[1]:null,timeSpec=dm?dm[2]:part;
  const ranges=[...timeSpec.matchAll(/(\d{1,2}:?\d{2})-(\d{1,2}:?\d{2})/g)];
  if(!ranges.length)continue;
  matched=true;
  for(const rr of ranges){
   const a=serverParseTime(rr[1]),b=serverParseTime(rr[2]);if(!Number.isFinite(a)||!Number.isFinite(b))continue;
   if(b>=a){
    if((!daySpec||serverDayMatches(daySpec,day))&&minute>=a&&minute<=b)return 'open';
   }else{
    const sameDay=(!daySpec||serverDayMatches(daySpec,day))&&minute>=a;
    const previousDay=(!daySpec||serverDayMatches(daySpec,(day+6)%7))&&minute<=b;
    if(sameDay||previousDay)return 'open';
   }
  }
 }
 return matched?'closed':'unknown';
}
function normalizeRestaurantHours(row,zone,checkedAt=new Date()){
 const state=serverHoursState(row,zone,checkedAt);
 const source=typeof row.openNow==='boolean'?'provider-openNow':(String(row.opening_hours||'').trim()?'opening_hours':'unknown');
 return {...row,hoursState:state,hoursSource:row.hoursSource||source,hoursCheckedAt:checkedAt.toISOString()};
}
function normalizeSearchQuery(s){return RESTAURANT_TAXONOMY.normalizeRestaurantSearch(s)}
function classifySearchTerm(s){return RESTAURANT_TAXONOMY.restaurantSearchClassification(s)}
function providerSearchTerms(s){
 const terms=RESTAURANT_TAXONOMY.searchAliasesFor(s).slice(0,3);
 const classification=RESTAURANT_TAXONOMY.restaurantSearchClassification(s);
 if(classification.kind==='category'&&classification.tag==='Burgers'&&!terms.includes('fast food'))terms.push('fast food');
 return terms.slice(0,4);
}
function searchRegexAlternatives(values){return '(?:'+values.map(searchRegex).filter(Boolean).join('|')+')';}
function searchRegex(value){return normalizeSearchQuery(value).split(' ').filter(Boolean).map(word=>word.split('').map(ch=>escapeOverpassRegex(ch)).join('[^a-z0-9]*')).join('[^a-z0-9]+')}
function miles(a,b,c,d){const R=3958.7613,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,z=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(z))}
async function json(url,opt={},timeout=9000){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),timeout);try{const r=await fetch(url,{...opt,signal:ctl.signal,headers:{Accept:'application/json',...(opt.headers||{})}});const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{}if(!r.ok)throw new Error('HTTP '+r.status);return data}finally{clearTimeout(t)}}
function rate(req,mode){const headers=req?.headers||{},client=String(headers['x-forwarded-for']||headers['client-ip']||headers['x-nf-client-connection-ip']||headers['cf-connecting-ip']||'anon').split(',')[0].trim()||'anon',key=mode+':'+client,now=Date.now(),old=buckets.get(key),max=(mode==='suggest'||mode==='reverse'||mode==='resolve')?40:(mode==='search'?MAX_SEARCH_PER_MINUTE:18);if(!old||now-old.t>60000){buckets.set(key,{t:now,c:1});return false}old.c++;return old.c>max}
function osmRow(el,origin){const t=el?.tags||{},lat=n(el?.lat??el?.center?.lat),lon=n(el?.lon??el?.center?.lon),name=String(t.name||'').trim();if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))return null;const amen=String(t.amenity||'restaurant').toLowerCase(),fast=amen==='fast_food'||isFastFoodName(name,String(t.brand||''),String(t.operator||''));let website=String(t.website||t['contact:website']||'').trim();if(website&&!/^https?:\/\//i.test(website))website='https://'+website;const key=norm(name)+'|'+lat.toFixed(4)+'|'+lon.toFixed(4);return{id:el?.osm_id?'osm-'+el.osm_id:'osm-'+key.replace(/ /g,'-'),name,category:fast?'Fast Food':(String(t.cuisine||'').trim()||'Restaurant'),fastFood:fast,cuisine:String(t.cuisine||''),providerType:String(t.amenity||''),address:[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state'],t['addr:postcode']].filter(Boolean).join(', '),phone:String(t.phone||t['contact:phone']||''),website,opening_hours:String(t.opening_hours||''),lat,lon,distance:miles(origin.lat,origin.lon,lat,lon),photo:String(t.image||t.image_url||''),menuItems:[t.dish,t['dish:name'],t['menu:items'],t.menu_items].flatMap(v=>String(v||'').split(/[|;•,]/)).map(x=>x.trim()).filter(Boolean).slice(0,10),brand:String(t.brand||''),source:'OpenStreetMap'} }
function queryClause(lat,lon,radius,types=DINING_AMENITIES){
 const m=Math.round(Math.min(50,radius)*1609.344);
 if(types==='fast_food'){
   const pattern='mcdonald|taco bell|wendy|burger king|kfc|chick[- ]?fil[- ]?a|popeye|subway|sonic|arby|whataburger|five guys|culver|raising cane|wingstop|bojangles|cook ?out|dairy queen|jack in the box|hardee|del taco|checkers|rally|zaxby|churchs|captain ds|long john silver|jimmy john|jersey mike|firehouse subs|little caesars|domino|papa john|pizza hut|marcos pizza|krystal|steak ?n shake|white castle|freddy|in[- ]?n[- ]?out|carl.?s jr|panda express|jacks|chipotle';
   return 'nwr[amenity="fast_food"][name](around:'+m+','+lat+','+lon+');nwr[name~"'+pattern+'",i](around:'+m+','+lat+','+lon+');nwr[brand~"'+pattern+'",i](around:'+m+','+lat+','+lon+');';
 }
 return 'nwr[amenity~"^('+types+')$"][name](around:'+m+','+lat+','+lon+');';
}
function query(lat,lon,radius,types=DINING_AMENITIES){
 return '[out:json][timeout:16];('+queryClause(lat,lon,radius,types)+');out center tags;';
}
function queryMany(points,types=DINING_AMENITIES,timeoutSeconds=10){
 return '[out:json][timeout:'+Math.max(6,Math.min(16,Number(timeoutSeconds)||10))+'];('+points.map(c=>queryClause(c.lat,c.lon,c.radius,types)).join('')+');out center tags;';
}
function centers(lat,lon,r){
 const radius=clamp(r);
 if(radius<=25)return[{lat,lon,radius}];
 if(radius<=50)return[{lat,lon,radius:50}];
 // Overpass is queried in <=50-mile circles. A 12-point ring at 60 miles,
 // plus the origin circle, covers the requested 100-mile disk with overlap;
 // final filtering is always done from the true origin distance.
 const ring=60,count=12,out=[{lat,lon,radius:50}];
 const a=ring/69,b=ring/(69*Math.max(.35,Math.cos(lat*Math.PI/180)));
 for(let i=0;i<count;i++){
  const ang=i*2*Math.PI/count;
  out.push({lat:lat+Math.sin(ang)*a,lon:lon+Math.cos(ang)*b,radius:50});
 }
 return out;
}

function photonRow(feature,origin){
 const p=feature?.properties||{},c=feature?.geometry?.coordinates||[],lon=n(c[0]),lat=n(c[1]),name=String(p.name||p.label||'').split(',')[0].trim();
 if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))return null;
 const osmValue=String(p.osm_value||'').toLowerCase(),amenity=String(p.type||p.osm_key||'').toLowerCase(),fast=osmValue==='fast_food'||amenity==='fast_food'||isFastFoodName(name,String(p.brand||''),String(p.operator||''));
 const website=String(p.website||p.url||'').trim(),dist=miles(origin.lat,origin.lon,lat,lon);
 return {id:p.osm_id?'photon-'+p.osm_id:'photon-'+norm(name)+'-'+lat.toFixed(5)+'-'+lon.toFixed(5),name,category:fast?'Fast Food':(String(p.cuisine||'').trim()||'Restaurant'),fastFood:fast,cuisine:String(p.cuisine||''),providerType:String(p.osm_value||p.osm_key||p.type||''),address:[p.street,p.housenumber,p.city||p.town||p.village,p.state,p.postcode].filter(Boolean).join(', '),phone:String(p.phone||''),website:(/^https?:/.test(website)?website:(website?'https://'+website:'')),opening_hours:String(p.opening_hours||''),lat,lon,distance:dist,photo:String(p.image||p.image_url||''),menuItems:[p.dish,p['dish:name'],p.menu_items,p['menu:items']].flatMap(v=>String(v||'').split(/[|;•,]/)).map(x=>x.trim()).filter(Boolean).slice(0,10),brand:String(p.brand||''),source:'Photon POI'};
}
async function photonPlaces(lat,lon,radius,searchTerm=''){
 const r=Math.min(MAX_RADIUS,Math.max(1,radius)),latD=r/69,lonD=r/(69*Math.max(.35,Math.cos(lat*Math.PI/180))),bbox=[lon-lonD,lat-latD,lon+lonD,lat+latD].join(',');
 const limit=radius>25?'250':'120',term=normalizeSearchQuery(searchTerm);
 const terms=providerSearchTerms(term);
 const base=[];
 for(const qTerm of terms){
   base.push(new URLSearchParams({q:qTerm||'restaurant',osm_tag:'amenity:restaurant',bbox,limit,lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}));
   base.push(new URLSearchParams({q:qTerm||'fast food',osm_tag:'amenity:fast_food',bbox,limit,lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}));
 }
 const rows=[],errors=[];
 const consume=(result)=>{if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason));return}for(const feature of result.value?.features||[]){const pv=feature?.properties||{},ov=String(pv.osm_value||'').toLowerCase(),ok=String(pv.osm_key||'').toLowerCase();if(ok==='amenity'&&!DINING_AMENITIES.split('|').includes(ov)&&!FAST.test(String(pv.name||pv.brand||pv.operator||'')))continue;const row=photonRow(feature,{lat,lon});if(row&&row.distance<=radius)rows.push(row)}};
 for(const result of await Promise.allSettled(base.map(p=>json('https://photon.komoot.io/api/?'+p.toString(),{},6500))))consume(result);
 const primaryFastCount=rows.filter(r=>r.fastFood).length;
 const missingKnown=!term && radius<=25 && primaryFastCount<3 ? TARGETED_FAST.filter(name=>!rows.some(r=>norm(r.name)===norm(name)||norm(r.name).includes(norm(name)))).slice(0,4) : [];
 if(missingKnown.length){
   const qs=missingKnown.map(q=>new URLSearchParams({q,bbox,limit:'10',lang:'en',countrycode:'US',dedupe:'1',lat:String(lat),lon:String(lon),zoom:'12'}));
   for(const result of await Promise.allSettled(qs.map(p=>json('https://photon.komoot.io/api/?'+p.toString(),{},4500))))consume(result);
 }
 return {rows,errors};
}

async function arcgisPlaces(lat,lon,radius,searchTerm=''){
 const r=Math.min(MAX_RADIUS,Math.max(1,radius)),latD=r/69,lonD=r/(69*Math.max(.35,Math.cos(lat*Math.PI/180)));
 const extent=[lon-lonD,lat-latD,lon+lonD,lat+latD].join(',');
 const terms=providerSearchTerms(searchTerm),categories=['Restaurant','Fast Food'],rows=[],errors=[];
 const jobs=[];
 for(const category of categories)for(const term of terms)jobs.push((async()=>{
   const params=new URLSearchParams({SingleLine:term,category,location:lon+','+lat,searchExtent:extent,maxLocations:'50',outFields:'PlaceName,Type,Place_addr,City,Region,Country,Phone,URL',forStorage:'false',f:'json'});
   return {category,data:await json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?'+params.toString(),{},7000)};
 })());
 const results=await Promise.allSettled(jobs);
 for(const result of results){
   if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason));continue}
   const category=result.value.category;
   for(const cand of result.value.data?.candidates||[]){
     const a=cand?.location||{},cl=n(a.y),cn=n(a.x),attrs=cand?.attributes||{},name=String(attrs.PlaceName||cand.address||'').trim();
     if(!name||!Number.isFinite(cl)||!Number.isFinite(cn))continue;
     const fast=category==='Fast Food'||isFastFoodName(name,String(attrs.Type||''));
     const row={id:'arcgis-'+norm(name)+'-'+cl.toFixed(5)+'-'+cn.toFixed(5),name,category:fast?'Fast Food':'Restaurant',fastFood:fast,cuisine:'',providerType:String(attrs.Type||''),address:String(attrs.Place_addr||cand.address||''),phone:String(attrs.Phone||attrs.phone||''),website:String(attrs.URL||attrs.Url||attrs.url||''),opening_hours:'',lat:cl,lon:cn,distance:miles(lat,lon,cl,cn),photo:'',menuItems:[],brand:'',source:'ArcGIS POI'};
     if(row.distance<=r)rows.push(row);
   }
 }
 return {rows,errors};
}

function searchQueryClause(lat,lon,radius,searchTerm){
 const m=Math.round(Math.min(50,radius)*1609.344),pattern=searchRegexAlternatives(providerSearchTerms(searchTerm));
 if(!pattern)return '';
 return 'nwr[amenity~"^(restaurant|fast_food)$"][name~"'+pattern+'",i](around:'+m+','+lat+','+lon+');nwr[amenity~"^(restaurant|fast_food)$"][brand~"'+pattern+'",i](around:'+m+','+lat+','+lon+');nwr[amenity~"^(restaurant|fast_food)$"][operator~"'+pattern+'",i](around:'+m+','+lat+','+lon+');nwr[amenity~"^(restaurant|fast_food)$"][cuisine~"'+pattern+'",i](around:'+m+','+lat+','+lon+');';
}
function searchQueryMany(points,searchTerm,timeoutSeconds=10){return '[out:json][timeout:'+Math.max(6,Math.min(16,Number(timeoutSeconds)||10))+'];('+points.map(c=>searchQueryClause(c.lat,c.lon,c.radius,searchTerm)).join('')+');out center tags;'}
function radiusDiscoveryPlan(lat,lon,radius){
 const r=clamp(radius),coverage=centers(lat,lon,r);
 if(r<=WIDE_RADIUS_THRESHOLD)return {mode:'nearby',reserveMs:0,coveragePoints:coverage.length,groups:[coverage]};
 // Keep each request small enough for the upstream timeout while covering
 // the entire requested disk with overlapping <=50-mile circles.
 const groups=[];
 for(let i=0;i<coverage.length;i+=4)groups.push(coverage.slice(i,i+4));
 return {mode:'wide',reserveMs:WIDE_DISCOVERY_RESERVE_MS,coveragePoints:coverage.length,groups};
}
async function overpassPoints(points,originLat,originLon,radius,types='restaurant|fast_food',searchTerm='',endpoints=OVERPASS,timeout=OVERPASS_HTTP_TIMEOUT_MS){
 const term=normalizeSearchQuery(searchTerm),seconds=Math.max(6,Math.min(10,Math.ceil(Number(timeout||OVERPASS_HTTP_TIMEOUT_MS)/1000)));
 const data=term?searchQueryMany(points,term,seconds):queryMany(points,types,seconds),rows=[],errors=[];
 const settled=await Promise.allSettled(endpoints.map(ep=>json(ep+'?data='+encodeURIComponent(data),{},timeout)));
 for(const result of settled){
   if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason||'request failed'));continue;}
   for(const el of result.value?.elements||[]){const r=osmRow(el,{lat:originLat,lon:originLon});if(r&&r.distance<=radius)rows.push(r);}
 }
 return{rows:dedupe(rows),errors};
}
async function overpass(lat,lon,radius,types='restaurant|fast_food',searchTerm=''){
 return overpassPoints(centers(lat,lon,radius),lat,lon,radius,types,searchTerm,OVERPASS,8500);
}
async function wideRadiusOverpass(lat,lon,radius,searchTerm=''){
 const plan=radiusDiscoveryPlan(lat,lon,radius),rows=[],errors=[];
 const tasks=plan.groups.map((group,i)=>overpassPoints(group,lat,lon,radius,'restaurant|fast_food',searchTerm,[OVERPASS[i%OVERPASS.length]],OVERPASS_HTTP_TIMEOUT_MS));
 const settled=await Promise.allSettled(tasks);
 for(const result of settled){
   if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason||'wide discovery failed'));continue;}
   rows.push(...(result.value.rows||[])); errors.push(...(result.value.errors||[]));
 }
 return{rows:dedupe(rows),errors,groups:plan.groups.length,coveragePoints:plan.coveragePoints};
}
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
function escapeOverpassRegex(value){return String(value||'').replace(/[\\^$.*+?()[\\]{}|]/g,'\\\\$&').replace(/"/g,'\\\"');}
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
async function googleSearchPlaces(lat,lon,radius,searchTerm){
 if(!GOOGLE_KEY)return{rows:[],errors:[]};
 const term=normalizeSearchQuery(searchTerm),meters=Math.round(Math.min(50000,Math.max(1609,radius*1609.344))),rows=[],errors=[];
 if(!term)return googlePlaces(lat,lon,radius);
 const terms=providerSearchTerms(term);
 const requests=await Promise.allSettled(terms.map(termVariant=>json('https://places.googleapis.com/v1/places:searchText',{
   method:'POST',
   headers:{
     'Content-Type':'application/json',
     'X-Goog-Api-Key':GOOGLE_KEY,
     'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.types,places.currentOpeningHours.openNow,places.businessStatus,places.photos'
   },
   body:JSON.stringify({
     textQuery:termVariant+' restaurant',
     pageSize:20,
     locationBias:{circle:{center:{latitude:lat,longitude:lon},radius:meters}},
     regionCode:'US'
   })
 },6500)));
 for(const result of requests){
   if(result.status!=='fulfilled'){errors.push(String(result.reason?.message||result.reason||'Google text search failed'));continue}
   const data=result.value;
   for(const p of data?.places||[]){
    const loc=p?.location||{},plat=n(loc.latitude),plon=n(loc.longitude),name=String(p?.displayName?.text||'').trim();
    if(!name||!Number.isFinite(plat)||!Number.isFinite(plon))continue;
    const types=Array.isArray(p?.types)?p.types.map(String):[];
    const fast=types.includes('fast_food_restaurant')||types.includes('fast_food')||isFastFoodName(name);
    const openNow=typeof p?.currentOpeningHours?.openNow==='boolean'?p.currentOpeningHours.openNow:undefined;
    const businessStatus=String(p?.businessStatus||'');
    if(businessStatus==='CLOSED_PERMANENTLY')continue;
    const distance=miles(lat,lon,plat,plon);
    if(distance>radius)continue;
    rows.push({id:p.id?'google-search-'+p.id:'google-search-'+norm(name)+'-'+plat.toFixed(5)+'-'+plon.toFixed(5),name,category:fast?'Fast Food':'Restaurant',fastFood:fast,cuisine:'',address:String(p?.formattedAddress||''),phone:String(p?.nationalPhoneNumber||''),website:String(p?.websiteUri||''),opening_hours:'',openNow,hoursSource:typeof openNow==='boolean'?'Google Places':'',lat:plat,lon:plon,distance,photo:'',menuItems:[],brand:'',source:'Google Places Search',googlePlaceId:p.id||''});
   }
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
    'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.types,places.currentOpeningHours.openNow,places.businessStatus,places.photos'
   },
   body:JSON.stringify({includedTypes:['restaurant','fast_food_restaurant'],maxResultCount:20,locationRestriction:{circle:{center:{latitude:lat,longitude:lon},radius:meters}}})
  },6500);
  for(const p of data?.places||[]){
   const loc=p?.location||{},plat=n(loc.latitude),plon=n(loc.longitude),name=String(p?.displayName?.text||'').trim();
   if(!name||!Number.isFinite(plat)||!Number.isFinite(plon))continue;
   const types=Array.isArray(p?.types)?p.types.map(String):[];
   const fast=types.includes('fast_food_restaurant')||types.includes('fast_food')||isFastFoodName(name);
   const openNow=typeof p?.currentOpeningHours?.openNow==='boolean'?p.currentOpeningHours.openNow:undefined;
   const businessStatus=String(p?.businessStatus||'');
   if(businessStatus==='CLOSED_PERMANENTLY')continue;
   rows.push({id:p.id?'google-'+p.id:'google-'+norm(name)+'-'+plat.toFixed(5)+'-'+plon.toFixed(5),name,category:fast?'Fast Food':'Restaurant',fastFood:fast,cuisine:'',primaryType:String(p.primaryType||''),types,providerType:types.join(' '),address:String(p?.formattedAddress||''),phone:String(p?.nationalPhoneNumber||''),website:String(p?.websiteUri||''),opening_hours:'',openNow,hoursSource:typeof openNow==='boolean'?'Google Places':'',lat:plat,lon:plon,distance:miles(lat,lon,plat,plon),photo:'',menuItems:[],brand:'',source:'Google Places',googlePlaceId:p.id||''});
  }
 }catch(e){errors.push(String(e?.message||e||'Google Places failed'));}
 return{rows,errors};
}
async function googleContactEnrichment(rows,originLat,originLon){
 if(!GOOGLE_KEY)return{rows:[],errors:[]};
 const targets=(rows||[]).filter(r=>!r.phone||!r.website).slice(0,12);
 if(!targets.length)return{rows:[],errors:[]};
 const errors=[],out=[];
 let cursor=0;
 async function one(r){
  const q=[r.name,r.address].filter(Boolean).join(', ');
  try{
   const data=await json('https://places.googleapis.com/v1/places:searchText',{
    method:'POST',
    headers:{
     'Content-Type':'application/json',
     'X-Goog-Api-Key':GOOGLE_KEY,
     'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType,places.types,places.currentOpeningHours.openNow,places.businessStatus,places.photos'
    },
    body:JSON.stringify({
     textQuery:q+' restaurant',
     pageSize:3,
     locationBias:{circle:{center:{latitude:originLat,longitude:originLon},radius:Math.min(25000,Math.max(3000,Number(r.distance||0)*1609+5000))}},
     regionCode:'US'
    })
   },5200);
   const candidates=Array.isArray(data?.places)?data.places:[];
   const baseLat=Number(r.lat),baseLon=Number(r.lon);
   const best=candidates.map(p=>{
    const loc=p?.location||{},lat=n(loc.latitude),lon=n(loc.longitude),name=String(p?.displayName?.text||'').trim();
    if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))return null;
    const types=Array.isArray(p?.types)?p.types.map(String):[];
    const openNow=typeof p?.currentOpeningHours?.openNow==='boolean'?p.currentOpeningHours.openNow:undefined;
    const businessStatus=String(p?.businessStatus||'');
    if(businessStatus==='CLOSED_PERMANENTLY')return null;
    const distance=Number.isFinite(baseLat)&&Number.isFinite(baseLon)?miles(baseLat,baseLon,lat,lon):miles(originLat,originLon,lat,lon);
    const target=norm(r.name),candidate=norm(name);
    const nameMatch=target===candidate||candidate.includes(target)||target.includes(candidate);
    return !nameMatch||distance>1.5?null:{id:p.id?'google-contact-'+p.id:'google-contact-'+norm(name),name,address:String(p?.formattedAddress||r.address||''),phone:String(p?.nationalPhoneNumber||''),website:String(p?.websiteUri||''),openNow,hoursSource:typeof openNow==='boolean'?'Google Places':'',lat,lon,distance:miles(originLat,originLon,lat,lon),category:types.includes('fast_food_restaurant')||types.includes('fast_food')?'Fast Food':(r.category||'Restaurant'),primaryType:String(p.primaryType||''),types,providerType:types.join(' '),fastFood:types.includes('fast_food_restaurant')||types.includes('fast_food')||!!r.fastFood,cuisine:r.cuisine||'',opening_hours:r.opening_hours||'',photo:'',menuItems:r.menuItems||[],brand:r.brand||'',source:'Google Places Search',googlePlaceId:p.id||''};
   }).filter(Boolean).sort((a,b)=>Number(a.distance)-Number(b.distance))[0];
   if(best)out.push({...best,_targetId:r.id});
  }catch(e){errors.push(String(e?.message||e||'Google contact lookup failed'));}
 }
 const workers=Array.from({length:Math.min(3,targets.length)},async()=>{
  while(cursor<targets.length){const i=cursor++;await one(targets[i]);}
 });
 await Promise.all(workers);
 return{rows:dedupe(out),errors};
}
function applyGoogleContactPatches(rows,patches){
 const byId=new Map((rows||[]).map(row=>[String(row?.id||''),row]));
 for(const patch of (patches||[])){
  const target=byId.get(String(patch?._targetId||''));
  if(!target)continue;
  for(const key of ['address','phone','website','opening_hours','hoursSource','openNow','googlePlaceId']){
   if(key==='openNow'){
    if(typeof patch.openNow==='boolean')target.openNow=patch.openNow;
   }else if(!target[key]&&patch[key])target[key]=patch[key];
  }
  if(patch.googlePlaceId)target.googlePlaceId=patch.googlePlaceId;
  target.contactEnriched=true;
 }
 return rows;
}
function providerPriority(r){const s=String(r?.source||'');return s.startsWith('OpenStreetMap')?0:s.startsWith('Photon')?1:2}
const RESTAURANT_NAME_VARIANT_BLOCKERS=new Set(['express','market','grill','kitchen','cafe','coffee','bar','deli','bakery','house','shop','and','at','inside','food','foods','eatery','restaurant','restaurants']);
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
  if(shared!==shorter || shared/union<0.6)return false;
  const longer=aa.length>=bb.length?aa:bb;
  const shorterSet=aa.length>=bb.length?bs:as;
  const extras=longer.filter(token=>!shorterSet.has(token));
  return !extras.some(token=>RESTAURANT_NAME_VARIANT_BLOCKERS.has(token));
}
function normAddress(s){
  const map={
   street:'st',st:'st',road:'rd',rd:'rd',avenue:'ave',ave:'ave',boulevard:'blvd',blvd:'blvd',
   drive:'dr',dr:'dr',lane:'ln',ln:'ln',parkway:'pkwy',pkwy:'pkwy',highway:'hwy',hwy:'hwy',
   route:'rte',rte:'rte',circle:'cir',cir:'cir',court:'ct',ct:'ct',place:'pl',pl:'pl',
   trail:'trl',trl:'trl',terrace:'ter',ter:'ter',way:'way',
   north:'n',n:'n',south:'s',s:'s',east:'e',e:'e',west:'w',w:'w',
   alabama:'al',alaska:'ak',arizona:'az',arkansas:'ar',california:'ca',colorado:'co',
   connecticut:'ct',delaware:'de',florida:'fl',georgia:'ga',hawaii:'hi',idaho:'id',
   illinois:'il',indiana:'in',iowa:'ia',kansas:'ks',kentucky:'ky',louisiana:'la',
   maine:'me',maryland:'md',massachusetts:'ma',michigan:'mi',minnesota:'mn',
   mississippi:'ms',missouri:'mo',montana:'mt',nebraska:'ne',nevada:'nv',
   'new-hampshire':'nh',newhampshire:'nh','new-jersey':'nj',newjersey:'nj',
   'new-mexico':'nm',newmexico:'nm','new-york':'ny',newyork:'ny',
   northcarolina:'nc','north-dakota':'nd',northdakota:'nd',ohio:'oh',oklahoma:'ok',
   oregon:'or',pennsylvania:'pa',rhodeisland:'ri','rhode-island':'ri',
   southcarolina:'sc','south-dakota':'sd',southdakota:'sd',tennessee:'tn',tn:'tn',
   texas:'tx',utah:'ut',vermont:'vt',virginia:'va',washington:'wa',
   westvirginia:'wv','west-virginia':'wv',wisconsin:'wi',wyoming:'wy',
   'district-of-columbia':'dc',districtcolumbia:'dc',dc:'dc'
  };
  const tokens=norm(String(s||'')).split(' ').filter(Boolean).map(x=>map[x]||x);
  return tokens.join(' ').replace(/\b(?:usa|united\s+states)\b/g,'').replace(/\s+/g,' ').trim();
}
function phoneKey(value){return norm(String(value||'').replace(/[^0-9]/g,''));}
function websiteKey(value){
  try{
    const u=new URL(String(value||''));
    return (u.hostname||'').toLowerCase().replace(/^www\./,'')+u.pathname.replace(/\/$/,'').toLowerCase();
  }catch{return norm(value||'')}
}
function sameContact(x,r){
  const xp=phoneKey(x?.phone),rp=phoneKey(r?.phone);
  if(xp&&rp&&xp.length>=10&&rp.length>=10&&xp.slice(-10)===rp.slice(-10))return true;
  const xw=websiteKey(x?.website),rw=websiteKey(r?.website);
  if(xw&&rw&&xw===rw)return true;
  return false;
}
function restaurantNameKey(value){return norm(String(value||'').replace(/[’']s\b/gi,'s'));}
function restaurantStreetKey(value){
  const raw=normAddress(value||'');
  if(!raw)return '';
  const first=raw.split(',')[0].trim();
  return first.replace(/^\d+[a-z]?\s+/,'').trim().split(' ').slice(0,4).join(' ').trim();
}
function addressHasStreetNumber(value){return /^\s*\d+[a-z]?\b/i.test(String(value||''));}
function sameRestaurant(x,r){
  if(!x||!r)return false;
  const sameName=restaurantNameKey(x.name)===restaurantNameKey(r.name);
  const variant=nameVariantMatch(x.name,r.name);
  const sameNameFamily=sameName||variant;
  const sameBrand=!!norm(x.brand)&&!!norm(r.brand)&&norm(x.brand)===norm(r.brand);
  const identityKey=RESTAURANT_TAXONOMY.restaurantIdentityKey(x);
  const rowIdentityKey=RESTAURANT_TAXONOMY.restaurantIdentityKey(r);
  const dist=Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&Number.isFinite(r.lat)&&Number.isFinite(r.lon) ? miles(x.lat,x.lon,r.lat,r.lon) : Infinity;
  const ax=normAddress(x.address||''), ar=normAddress(r.address||'');
  const sameAddress=!!ax&&!!ar&&ax===ar;
  const conflictingAddress=!!ax&&!!ar&&!sameAddress;
  const sameStreet=!!restaurantStreetKey(x.address)&&restaurantStreetKey(x.address)===restaurantStreetKey(r.address);
  const partialAddress=!addressHasStreetNumber(x.address)||!addressHasStreetNumber(r.address);
  const originDistanceClose=Number.isFinite(Number(x.distance))&&Number.isFinite(Number(r.distance))&&Math.abs(Number(x.distance)-Number(r.distance))<=0.05;
  const sameNameStreet=sameStreet&&originDistanceClose&&partialAddress&&(variant||sameName);
  const sameCanonicalIdentity=!!identityKey&&identityKey===rowIdentityKey&&((sameAddress)||(sameStreet&&originDistanceClose&&partialAddress));
  if(sameAddress && (sameNameFamily||sameBrand))return true;
  if(sameCanonicalIdentity)return true;
  if(sameNameStreet)return true;
  if(sameName && !conflictingAddress && dist<=0.08)return true;
  if(sameContact(x,r) && !conflictingAddress && dist<=0.12)return true;
  if(variant && sameBrand && !conflictingAddress && dist<=0.12)return true;
  return false;
}
function dedupe(rows){
  const ordered=[...(rows||[])].filter(Boolean).sort((a,b)=>providerPriority(a)-providerPriority(b));
  const map=new Map();
  for(const r of ordered){
    let key=null;
    for(const [k,x] of map){if(sameRestaurant(x,r)){key=k;break}}
    if(!key){
      const nameKey=norm(r.name),addr=normAddress(r.address||''),phone=phoneKey(r.phone),website=websiteKey(r.website);
      key=(nameKey+'|'+(addr||phone||website||('geo-'+Math.round(r.lat*1000)+'|'+Math.round(r.lon*1000)))).slice(0,220);
      let suffix=1;
      while(map.has(key)) key=key+'|'+(++suffix);
    }
    if(!map.has(key))map.set(key,{...r});
    else{
      const x=map.get(key);
      x.fastFood=x.fastFood||r.fastFood;
      if(typeof r.openNow==='boolean' && (typeof x.openNow!=='boolean' || String(r.source||'').startsWith('Google')))x.openNow=r.openNow;
      for(const f of ['address','phone','website','opening_hours','photo','cuisine','brand','operator'])if(!x[f]&&r[f])x[f]=r[f];
      if(!x.googlePlaceId&&r.googlePlaceId)x.googlePlaceId=r.googlePlaceId;
      x.menuItems=[...new Set([...(x.menuItems||[]),...(r.menuItems||[])])].slice(0,10);
      if(!x.hoursSource&&r.hoursSource)x.hoursSource=r.hoursSource;
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
const CATEGORY_IMAGES={
  'Fast Food':'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85',
  Burgers:'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85',
  Pizza:'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=1200&q=85',
  Mexican:'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=85',
  American:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
  Italian:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
  Asian:'https://images.unsplash.com/photo-1515669097368-22e681b4d36c?auto=format&fit=crop&w=1200&q=85',
  BBQ:'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85',
  Seafood:'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=1200&q=85',
  Breakfast:'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=85'
};
function restaurantPhotoMeta(r){
  const raw=String(r?.photo||'').trim();
  const knownFallback=()=>{
    const byName=namedImage(r?.name); if(byName)return byName;
    const byBrand=namedImage(r?.brand); if(byBrand)return byBrand;
    const byOperator=namedImage(r?.operator); if(byOperator)return byOperator;
    const keys=[String(r?.cuisine||''),String(r?.category||'')];
    for(const key of keys){
      const k=Object.keys(CATEGORY_IMAGES).find(x=>norm(x)===norm(key)||norm(key).includes(norm(x)));
      if(k)return CATEGORY_IMAGES[k];
    }
    return CATEGORY_IMAGES.American;
  };
  // A verified Google Place photo is preferred over any provider/generic image.
  // Keep the provider image as the immediate fallback if Google photo hydration fails.
  if(String(r?.googlePlaceId||'').trim())return{photo:'',photoFallback:/^https:\/\//i.test(raw)?raw:knownFallback(),photoSource:'google-places',photoIsGeneric:false,photoConfidence:0.95};
  if(/^https:\/\//i.test(raw))return{photo:raw,photoFallback:'',photoSource:'provider',photoIsGeneric:false,photoConfidence:0.85};
  const fallback=knownFallback(),named=String(r?.name||'').trim();
  const matchedKnown=!!namedImage(named)||!!namedImage(r?.brand)||!!namedImage(r?.operator);
  if(matchedKnown)return{photo:fallback,photoFallback:'',photoSource:'known-entity',photoIsGeneric:true,photoConfidence:0.55};
  const hasCategory=Object.keys(CATEGORY_IMAGES).some(x=>[String(r?.cuisine||''),String(r?.category||'')].some(v=>norm(x)===norm(v)||norm(v).includes(norm(x))));
  if(hasCategory)return{photo:fallback,photoFallback:'',photoSource:'cuisine-fallback',photoIsGeneric:true,photoConfidence:0.4};
  return{photo:fallback,photoFallback:'',photoSource:'generic-fallback',photoIsGeneric:true,photoConfidence:0.2};
}
function image(r){return restaurantPhotoMeta(r).photo;}
function geocodeCandidateScore(query,display,baseScore=0){
 const qNorm=normalizeSearchQuery(query),dNorm=normalizeSearchQuery(display);
 const qTokens=qNorm.split(' ').filter(Boolean),dTokens=new Set(dNorm.split(' ').filter(Boolean));
 let score=Number(baseScore)||0;
 for(const token of qTokens){
   if(dTokens.has(token))score+=18;
   else if(token.length>=4&&dNorm.includes(token))score+=8;
   else score-=4;
 }
 const numberMatch=qNorm.match(/^([0-9]+[a-z]?)(?:\\s|$)/i);
 if(numberMatch){
   const nTok=numberMatch[1].toLowerCase();
   if(new RegExp('^'+nTok+'\\b').test(dNorm))score+=100;
   else if(/^[0-9]+/.test(dNorm))score-=140;
 }
 const zip=(qNorm.match(/\\b\\d{5}\\b/)||[])[0];
 if(zip)score += dNorm.includes(zip)?70:-35;
 if(qNorm.includes('clarksville'))score += dNorm.includes('clarksville')?35:-60;
 if(qNorm.includes('tn'))score += /\\btn\\b|tennessee/.test(dNorm)?20:-25;
 if(qNorm.includes('iron workers'))score += dNorm.includes('iron workers')?70:-100;
 return score;
}
async function geocode(q){
 const clean=String(q||'').trim().slice(0,180);
 if(!clean)throw Object.assign(new Error('Enter a location.'),{code:'EMPTY_LOCATION'});
 const rows=[];
 const [arc,pho]=await Promise.allSettled([
  json('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?'+new URLSearchParams({SingleLine:clean,f:'json',maxLocations:'8',outFields:'*',forStorage:'false',countryCode:'USA'}),{},8000),
  json('https://photon.komoot.io/api/?'+new URLSearchParams({q:clean,limit:'8',lang:'en',countrycode:'US'}),{},8000)
 ]);
 if(arc.status==='fulfilled'){
  for(const c of arc.value?.candidates||[]){
   const lat=n(c?.location?.y),lon=n(c?.location?.x),display=String(c.address||c.attributes?.Match_addr||clean);
   if(validCoords(lat,lon))rows.push({lat,lon,display,source:'ArcGIS',score:geocodeCandidateScore(clean,display,n(c.score,0))});
  }
 }
 if(pho.status==='fulfilled'){
  for(const f of pho.value?.features||[]){
   const c=f?.geometry?.coordinates||[],lon=n(c[0]),lat=n(c[1]);
   if(!validCoords(lat,lon))continue;
   const display=[f?.properties?.name,f?.properties?.housenumber,f?.properties?.street,f?.properties?.city||f?.properties?.town,f?.properties?.state,f?.properties?.postcode].filter(Boolean).join(', ')||clean;
   rows.push({lat,lon,display,source:'Photon',score:geocodeCandidateScore(clean,display,100)});
  }
 }
 if(!rows.length)throw Object.assign(new Error('That address or area could not be located.'),{code:'NOT_FOUND'});
 const exactNumber=normalizeSearchQuery(clean).match(/^([0-9]+[a-z]?)(?:\\s|$)/i);
 const ranked=rows
  .sort((a,b)=>b.score-a.score)
  .filter((row,i,all)=>all.findIndex(x=>normalizeSearchQuery(x.display)===normalizeSearchQuery(row.display))===i);
 if(exactNumber){
   const matching=ranked.filter(row=>new RegExp('^'+exactNumber[1].toLowerCase()+'\\b').test(normalizeSearchQuery(row.display)));
   if(matching.length)return matching[0];
   throw Object.assign(new Error('That street address could not be matched exactly. Please choose the matching address from the suggestions.'),{code:'ADDRESS_MISMATCH'});
 }
 return ranked[0];
}
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
async function handler(req,res){const q=requestQuery(req),mode=String(q.get('mode')||'health').toLowerCase();if(mode!=='search'&&rate(req,mode))return res.status(429).json({ok:false,code:'RATE_LIMITED',message:'Too many requests. Try again shortly.'});try{
if(mode==='health'){if(res.setHeader)res.setHeader('Cache-Control','public, max-age=60, s-maxage=60, stale-while-revalidate=120');return res.status(200).json({ok:true,version:API_VERSION,maxRadiusMiles:MAX_RADIUS,googlePlacesConfigured:!!GOOGLE_KEY,providers:['OpenStreetMap Overpass','ArcGIS','Photon',...(GOOGLE_KEY?['Google Places']:[]),'Open-Meteo timezone']});}
if(mode==='suggest'){if(res.setHeader)res.setHeader('Cache-Control','public, max-age=30, s-maxage=30, stale-while-revalidate=60');return res.status(200).json({ok:true,results:await suggest(q.get('q'))});}
if(mode==='resolve'){const x=await geocode(q.get('q'));return res.status(200).json({ok:true,...x})}
if(mode==='reverse'){const lat=n(q.get('lat')),lon=n(q.get('lon'));if(!validCoords(lat,lon))return res.status(400).json({ok:false,message:'Coordinates are invalid.'});if(res.setHeader)res.setHeader('Cache-Control','public, max-age=300, s-maxage=300, stale-while-revalidate=600');return res.status(200).json({ok:true,display:await reverse(lat,lon)})}
if(mode==='search'){
 const startedAt=Date.now();
 const lat=n(q.get('lat')),lon=n(q.get('lon')),radius=clamp(q.get('radius')),searchTerm=normalizeSearchQuery(q.get('q')||'');
 if(!validCoords(lat,lon))return res.status(400).json({ok:false,message:'Coordinates are invalid.'});
 const key=lat.toFixed(4)+':'+lon.toFixed(4)+':'+radius+':'+searchTerm,hit=cache.get(key);
 if(hit&&Date.now()-hit.t<60000)return res.status(200).json(hit.data);
 if(rate(req,mode))return res.status(429).json({ok:false,code:'RATE_LIMITED',message:'Restaurant search is temporarily busy. Please try again.'});
 if(res.setHeader)res.setHeader('Cache-Control','public, max-age=30, s-maxage=30, stale-while-revalidate=60');
 const timezonePromise=timezone(lat,lon);
 const wideSearch=radius>WIDE_RADIUS_THRESHOLD;
 const discoveryPlan=radiusDiscoveryPlan(lat,lon,radius);
 const primaryBudget=Math.max(9000,SEARCH_BUDGET_MS-(wideSearch?discoveryPlan.reserveMs:0));
 const discoveryPromise=wideSearch||searchTerm ? (wideSearch ? wideRadiusOverpass(lat,lon,radius,searchTerm) : overpass(lat,lon,radius,'restaurant|fast_food',searchTerm)) : null;
 const primaryPromise=Promise.allSettled([photonPlaces(lat,lon,radius,searchTerm),arcgisPlaces(lat,lon,radius,searchTerm),searchTerm?googleSearchPlaces(lat,lon,radius,searchTerm):googlePlaces(lat,lon,radius)]);
 let primaryBatch,parallelWide=null;
 if(wideSearch){
   [primaryBatch,parallelWide]=await Promise.all([
     withinBudget(primaryPromise,7600,'Primary restaurant providers timed out'),
     withinBudget(discoveryPromise,7600,'Wide radius discovery timed out')
   ]);
 }else{
   primaryBatch=await withinBudget(primaryPromise,Math.max(1000,primaryBudget-(Date.now()-startedAt)),'Primary restaurant providers timed out');
 }
 const photonResult=Array.isArray(primaryBatch)?primaryBatch[0]:{status:'rejected',reason:new Error('Primary restaurant providers timed out')};
 const arcgisResult=Array.isArray(primaryBatch)?primaryBatch[1]:{status:'rejected',reason:new Error('Primary restaurant providers timed out')};
 const googleResult=Array.isArray(primaryBatch)?primaryBatch[2]:{status:'rejected',reason:new Error('Primary restaurant providers timed out')};
 const photonOut=photonResult.status==='fulfilled'?photonResult.value:{rows:[],errors:[String(photonResult.reason?.message||photonResult.reason||'Photon unavailable')]};
 const arcgisOut=arcgisResult.status==='fulfilled'?arcgisResult.value:{rows:[],errors:[String(arcgisResult.reason?.message||arcgisResult.reason||'ArcGIS unavailable')]};
 const googleOut=googleResult.status==='fulfilled'?googleResult.value:{rows:[],errors:[String(googleResult.reason?.message||googleResult.reason||'Google Places unavailable')]};
 const preliminary=dedupe([...(googleOut.rows||[]),...(photonOut.rows||[]),...(arcgisOut.rows||[])]);
 const preliminaryFast=preliminary.filter(r=>r.fastFood).length;
 let osmOut={rows:[],errors:[]};
 const needsOverpass=!!searchTerm||radius>WIDE_RADIUS_THRESHOLD||!preliminary.length||preliminaryFast===0;
 if(discoveryPromise){
   if(wideSearch){
     const got=parallelWide;
     if(got&&!got.__timeout){osmOut.rows.push(...(got.rows||[]));osmOut.errors.push(...(got.errors||[]))}
     else osmOut.errors.push('Wide radius discovery timed out');
   }else{
     const remaining=Math.max(0,SEARCH_BUDGET_MS-(Date.now()-startedAt));
     const discoveryBudget=Math.min(5000,remaining);
     if(discoveryBudget>1200){
       const got=await withinBudget(discoveryPromise,discoveryBudget,'Provider-backed query expansion timed out');
       if(got&&!got.__timeout){osmOut.rows.push(...(got.rows||[]));osmOut.errors.push(...(got.errors||[]))}
       else osmOut.errors.push('Provider-backed query expansion timed out');
     }else osmOut.errors.push('Search budget reached before provider expansion.');
   }
 }else if(needsOverpass){
   const remaining=Math.max(0,SEARCH_BUDGET_MS-(Date.now()-startedAt));
   if(remaining>1200){
     const got=await withinBudget(overpass(lat,lon,radius,'restaurant|fast_food',searchTerm),Math.min(5000,remaining),'Overpass expansion timed out');
     if(got&&!got.__timeout){osmOut.rows.push(...(got.rows||[]));osmOut.errors.push(...(got.errors||[]))}
     else osmOut.errors.push('Overpass expansion timed out');
   }else osmOut.errors.push('Search budget reached before restaurant discovery expansion.');
 }
 let contactOut={rows:[],errors:[]};
 const contactCandidates=dedupe([...preliminary,...osmOut.rows]);
 const contactAllowed=!wideSearch;
 const missingContactNames=contactCandidates
   .filter(r=>!r.phone)
   .sort((a,b)=>Number(b.fastFood)-Number(a.fastFood)||Number(a.distance||0)-Number(b.distance||0))
   .map(r=>r.name)
   .filter(Boolean)
   .filter((name,i,a)=>a.findIndex(x=>norm(x)===norm(name))===i)
   .slice(0,12);
 const contactRemaining=Math.max(0,SEARCH_BUDGET_MS-(Date.now()-startedAt));
 if(contactAllowed&&missingContactNames.length&&contactRemaining>2600){
   const expandedNames=[...new Set(contactCandidates.filter(r=>missingContactNames.some(n=>norm(n)===norm(r.name))).flatMap(r=>[r.name,r.brand,r.operator]).filter(Boolean))].slice(0,24);
   const got=await withinBudget(contactEnrichment(lat,lon,Math.min(radius,25),expandedNames),contactRemaining,'Restaurant contact enrichment timed out');
   if(got&&!got.__timeout)contactOut=got; else contactOut.errors.push('Contact enrichment timed out');
  }
 let googleContactOut={rows:[],errors:[]};
 const contactRemaining2=Math.max(0,SEARCH_BUDGET_MS-(Date.now()-startedAt));
 if(contactAllowed&&GOOGLE_KEY&&contactRemaining2>3600){
   const got=await withinBudget(googleContactEnrichment(dedupe([...contactCandidates,...contactOut.rows]),lat,lon),contactRemaining2,'Google contact enrichment timed out');
   if(got&&!got.__timeout){googleContactOut=got;applyGoogleContactPatches(contactCandidates,googleContactOut.rows)} else googleContactOut.errors.push('Google contact enrichment timed out');
 }
 const zone=await timezonePromise;
 const checkedAt=new Date();
 const rows=dedupe([...contactCandidates,...contactOut.rows]).map(r=>{
   const distance=miles(lat,lon,n(r.lat),n(r.lon));
   return {...r,distance};
 }).filter(r=>Number.isFinite(r.distance)&&r.distance<=radius+0.001).map(r=>{
   const website=r.website||knownRestaurantWebsite(r);
   const phone=String(r.phone||'').trim();
   const classification=RESTAURANT_TAXONOMY.classifyRestaurant({...r,website,phone}); const canonicalCategory=classification.primary||r.category||'American'; const classifiedFastFood=classification.tags.includes('Fast Food'); const photo=restaurantPhotoMeta(r); return normalizeRestaurantHours({...r,category:canonicalCategory,fastFood:classifiedFastFood,quickCutTags:classification.tags,quickCutEvidence:classification.evidence,...photo,website,phone,websiteSource:r.website?'provider':(website?'official-brand':'google-search-fallback'),phoneSource:phone?'provider':'google-search-fallback'},zone,checkedAt);
  });
 const data={ok:true,version:API_VERSION,googlePlacesConfigured:!!GOOGLE_KEY,radiusMiles:radius,searchQuery:searchTerm,total:rows.length,fastFoodCount:rows.filter(r=>RESTAURANT_TAXONOMY.classifyRestaurant(r).tags.includes('Fast Food')).length,timezone:zone,lat,lon,searchLatencyMs:Date.now()-startedAt,searchBudgetMs:SEARCH_BUDGET_MS,discoveryMode:discoveryPlan.mode,discoveryReserveMs:discoveryPlan.reserveMs,discoveryGroups:discoveryPlan.groups.length,discoveryCoveragePoints:discoveryPlan.coveragePoints,providers:{google:(googleOut.rows||[]).length,googleContact:(googleContactOut.rows||[]).length,photon:(photonOut.rows||[]).length,arcgis:(arcgisOut.rows||[]).length,overpass:(osmOut.rows||[]).length,contact:(contactOut.rows||[]).length},providerErrors:[...googleOut.errors,...photonOut.errors,...arcgisOut.errors,...osmOut.errors,...contactOut.errors,...googleContactOut.errors].slice(0,8),results:rows};
 cache.set(key,{t:Date.now(),data});return res.status(200).json(data)}
return res.status(400).json({ok:false,message:'Unknown mode.'})
}catch(e){console.error('dinliminate-'+API_VERSION,e);return res.status(502).json({ok:false,code:String(e?.code||'SERVICE'),message:String(e?.message||'Restaurant service unavailable.')})}}
handler._test={isFastFoodName,dedupe,restaurantNameTokens,nameVariantMatch,sameRestaurant,restaurantStreetKey,addressHasStreetNumber,normAddress,phoneKey,websiteKey,requestQuery,centers,radiusDiscoveryPlan,normalizeSearchQuery,searchRegex,searchRegexAlternatives,searchQueryClause,providerSearchTerms,classifySearchTerm,rate,serverHoursState,normalizeRestaurantHours,restaurantPhotoMeta,image,googleContactEnrichment,applyGoogleContactPatches,restaurantIdentityKey:RESTAURANT_TAXONOMY.restaurantIdentityKey,classifyRestaurant:RESTAURANT_TAXONOMY.classifyRestaurant};
module.exports=handler;