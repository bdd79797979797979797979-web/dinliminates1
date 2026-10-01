'use strict';

const NO_PHOTO_HOSTS=new Set(['google.com','www.google.com','googleusercontent.com','lh3.googleusercontent.com','bing.com','www.bing.com','tse1.mm.bing.net','tse2.mm.bing.net','tse3.mm.bing.net','tse4.mm.bing.net','unsplash.com','images.unsplash.com','pexels.com','images.pexels.com','shutterstock.com','istockphoto.com','gettyimages.com','depositphotos.com','alamy.com','stock.adobe.com']);
const BLOCKED_IMAGE_HINTS=/\b(?:logo|favicon|sprite|icon|avatar|placeholder|default[-_ ]?image|brandmark|wordmark)\b/i;
const VENUE_IMAGE_HINTS=/\b(?:exterior|outside|outdoor|front|entrance|entry|building|storefront|facade|façade|sign|signage|location|drive[- ]?thru|drive through|parking lot|parking|street view|patio|terrace)\b/i;
const FOOD_IMAGE_HINTS=/\b(?:menu|food|dish|meal|burger|pizza|salad|steak|wings|tacos?|sushi|pasta|chicken|fries|dessert|cake|sandwich|plate|entrée|entree|appetizer|breakfast|lunch|dinner|drink|cocktail|coffee|beer|wine)\b/i;

function json(res,status,payload){
  res.statusCode=status;
  res.setHeader?.('Content-Type','application/json; charset=utf-8');
  res.end?.(JSON.stringify(payload));
  return res;
}

function absoluteHttpsUrl(raw,base=''){
  try{
    const u=new URL(String(raw||''),base||undefined);
    if(u.protocol!=='https:')return '';
    const host=u.hostname.toLowerCase();
    if(host==='localhost'||host==='127.0.0.1'||host==='0.0.0.0'||host==='::1')return '';
    if(/^10\./.test(host)||/^192\.168\./.test(host)||/^169\.254\./.test(host)||/^172\.(1[6-9]|2\d|3[0-1])\./.test(host))return '';
    return u.href;
  }catch{return ''}
}

function hostOf(raw){try{return new URL(raw).hostname.toLowerCase()}catch{return ''}}
function isBlockedHost(raw){
  const host=hostOf(raw);
  if(!host)return true;
  for(const blocked of NO_PHOTO_HOSTS)if(host===blocked||host.endsWith('.'+blocked))return true;
  return false;
}

function decodeHtml(raw){
  return String(raw||'')
    .replace(/&quot;/g,'"').replace(/&#34;/g,'"')
    .replace(/&#39;|&#x27;/g,"'")
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}

async function fetchText(url,headers={},timeout=7000,maxBytes=2200000){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{
      'Accept':'text/html,application/xhtml+xml',
      'Accept-Language':'en-US,en;q=0.8',
      'User-Agent':'Mozilla/5.0 (compatible; Dinliminate/1.0; restaurant-photo)',
      ...headers
    },signal:ctl.signal});
    if(!r.ok)throw new Error('Page request failed ('+r.status+').');
    const data=Buffer.from(await r.arrayBuffer());
    if(data.length>maxBytes)throw new Error('Page too large.');
    return data.toString('utf8');
  }finally{clearTimeout(timer)}
}

async function fetchImage(url,headers={},timeout=7000){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{
      'Accept':'image/avif,image/webp,image/apng,image/jpeg,image/png,image/gif,image/*;q=0.8',
      'User-Agent':'Mozilla/5.0 (compatible; Dinliminate/1.0; restaurant-photo)',
      ...headers
    },redirect:'follow',signal:ctl.signal});
    if(!r.ok)throw new Error('Image request failed ('+r.status+').');
    const type=(r.headers.get('content-type')||'image/jpeg').split(';')[0].toLowerCase();
    if(!type.startsWith('image/'))throw new Error('Image response was not an image.');
    const bytes=Buffer.from(await r.arrayBuffer());
    if(bytes.length<4000)throw new Error('Image response was too small.');
    if(bytes.length>10*1024*1024)throw new Error('Image is too large.');
    return {type,bytes};
  }finally{clearTimeout(timer)}
}

function htmlAttrs(tag){
  const out={};
  const re=/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let m;
  while((m=re.exec(String(tag||''))))out[m[1].toLowerCase()]=decodeHtml(m[2]??m[3]??m[4]??'');
  return out;
}

function firstSrcsetUrl(raw,base){
  const parts=String(raw||'').split(',');
  for(const part of parts){
    const value=String(part||'').trim().split(/\s+/)[0];
    const url=absoluteHttpsUrl(value,base);
    if(url&&!isBlockedHost(url)&&!BLOCKED_IMAGE_HINTS.test(url))return url;
  }
  return '';
}

function extractImgCandidates(html,pageUrl){
  const candidates=[],seen=new Set(),re=/<img\b[^>]*>/ig;
  let m;
  while((m=re.exec(String(html||'')))&&candidates.length<120){
    const attrs=htmlAttrs(m[0]);
    const rawSrcs=[
      attrs.src,attrs['data-src'],attrs['data-lazy-src'],attrs['data-original'],
      attrs['data-image-url'],attrs['data-photo-url'],firstSrcsetUrl(attrs.srcset,pageUrl),
      firstSrcsetUrl(attrs['data-srcset'],pageUrl)
    ];
    const url=rawSrcs.map(v=>absoluteHttpsUrl(v,pageUrl)).find(v=>v&&!isBlockedHost(v)&&!BLOCKED_IMAGE_HINTS.test(v));
    if(!url||seen.has(url))continue;
    seen.add(url);
    const sourceHtml=String(html||'');
    const nearby=sourceHtml.slice(Math.max(0,m.index-650),Math.min(sourceHtml.length,m.index+m[0].length+850));
    const context=[attrs.alt,attrs.title,attrs.class,attrs.id,attrs['data-caption'],attrs['data-alt'],attrs['data-filename'],nearby,url].filter(Boolean).join(' ');
    candidates.push({url,context,source:'img'});
  }
  return candidates;
}

function extractStyleImageCandidates(html,pageUrl){
  const candidates=[],seen=new Set(),re=/background-image\s*:\s*url\(\s*['"]?([^'")\s]+)['"]?\s*\)/ig;
  let m;
  while((m=re.exec(String(html||'')))&&candidates.length<60){
    const url=absoluteHttpsUrl(m[1],pageUrl);
    if(!url||seen.has(url)||isBlockedHost(url)||BLOCKED_IMAGE_HINTS.test(url))continue;
    seen.add(url);
    const context=String(html||'').slice(Math.max(0,m.index-260),Math.min(String(html||'').length,m.index+420));
    candidates.push({url,context,source:'background'});
  }
  return candidates;
}

function extractMetaImages(html,pageUrl){
  const urls=[];
  const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/ig,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/ig
  ];
  for(const re of patterns){let m;while((m=re.exec(html))&&urls.length<12)urls.push(m[1]);}
  return urls.map(raw=>absoluteHttpsUrl(String(raw||'').replace(/&amp;/g,'&'),pageUrl)).filter(Boolean).filter(url=>!isBlockedHost(url)&&!BLOCKED_IMAGE_HINTS.test(url));
}

function extractJsonLdImageCandidates(html,pageUrl){
  const out=[],seen=new Set(),re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig;
  let m;
  const push=(raw,context='')=>{
    const url=absoluteHttpsUrl(raw,pageUrl);
    if(!url||seen.has(url)||isBlockedHost(url)||BLOCKED_IMAGE_HINTS.test(url))return;
    seen.add(url);
    out.push({url,context:context+' '+url,source:'jsonld'});
  };
  const walk=(value,context='')=>{
    if(value==null||out.length>=100)return;
    if(typeof value==='string'){
      if(/^(?:https?:)?\/\//i.test(value)||/^\//.test(value))push(value,context);
      return;
    }
    if(Array.isArray(value)){for(const item of value)walk(item,context);return;}
    if(typeof value==='object'){
      const local=[value.name,value.caption,value.description,value.alt,value.title,value.contentUrl,value.thumbnailUrl,value.url].filter(v=>typeof v==='string').join(' ');
      for(const key of ['image','photo','photos','contentUrl','thumbnailUrl','associatedMedia']){
        if(value[key])walk(value[key],context+' '+local);
      }
      for(const key of ['itemListElement','subjectOf','about']){
        if(value[key])walk(value[key],context+' '+local);
      }
    }
  };
  while((m=re.exec(String(html||'')))&&out.length<100){
    try{
      const data=JSON.parse(m[1]);
      walk(data,'jsonld');
    }catch{}
  }
  return out;
}

function normalizeMatchText(text){
  return String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

function significantNameTokens(name){
  const stop=new Set(['the','a','an','restaurant','restaurants','llc','inc','co','company','and','of','at','in']);
  return normalizeMatchText(name).split(' ').filter(t=>t.length>=3&&!stop.has(t));
}

function structuredRestaurantMatches(html,name,address){
  const tokens=significantNameTokens(name);
  if(!tokens.length)return false;
  const addrNorm=normalizeMatchText(address);
  const addrNumber=(String(address||'').match(/\b\d{1,6}\b/)||[])[0];
  const zip=(String(address||'').match(/\b\d{5}(?:-\d{4})?\b/)||[])[0];
  const city=(addrNorm.split(' ').findIndex(x=>x==='clarksville')>=0)?'clarksville':'';
  const blocks=[];
  const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig;
  let m;
  while((m=re.exec(String(html||''))))blocks.push(m[1]);
  const inspect=(value)=>{
    if(value==null)return false;
    if(Array.isArray(value))return value.some(inspect);
    if(typeof value!=='object')return false;
    const type=Array.isArray(value['@type'])?value['@type'].join(' '):String(value['@type']||'');
    const business=/restaurant|foodestablishment|localbusiness/i.test(type);
    const itemName=normalizeMatchText(value.name||'');
    const nameHits=tokens.filter(t=>itemName.includes(t)).length;
    if(business&&nameHits/tokens.length>=0.8){
      const a=value.address;
      const addressText=normalizeMatchText(typeof a==='string'?a:[a?.streetAddress,a?.addressLocality,a?.addressRegion,a?.postalCode].filter(Boolean).join(' '));
      const numberOk=!!addrNumber&&addressText.includes(normalizeMatchText(addrNumber));
      const zipOk=!!zip&&addressText.includes(normalizeMatchText(zip));
      const cityOk=!!city&&addressText.includes(city);
      const locParts=addrNorm.split(' ').filter(t=>t.length>=3).slice(-5);
      const locHits=locParts.filter(t=>addressText.includes(t)).length;
      if(numberOk||zipOk||(cityOk&&locHits>=2)||locHits>=3)return true;
    }
    for(const key of ['mainEntity','about','subject','item','itemListElement','address','location']){
      if(value[key]&&inspect(value[key]))return true;
    }
    return false;
  };
  for(const raw of blocks){
    try{if(inspect(JSON.parse(raw)))return true;}catch{}
  }
  return false;
}

function pageMatchesRestaurant(html,name,address){
  const source=String(html||'');
  if(structuredRestaurantMatches(source,name,address))return true;
  const hay=normalizeMatchText(source.slice(0,1400000));
  const tokens=significantNameTokens(name);
  if(!tokens.length)return false;
  const hits=tokens.filter(t=>hay.includes(t)).length;
  if(hits/tokens.length<0.8)return false;
  const number=(String(address||'').match(/\b\d{1,6}\b/)||[])[0];
  if(number&&hay.includes(normalizeMatchText(number)))return true;
  const loc=normalizeMatchText(address).split(' ').filter(t=>t.length>=3).slice(-5);
  return loc.filter(t=>hay.includes(t)).length>=2;
}

async function verifiedRestaurantPage(url,name,address){
  const page=absoluteHttpsUrl(url);
  if(!page||isBlockedHost(page))return null;
  try{
    const html=await fetchText(page,{},6000,1800000);
    return pageMatchesRestaurant(html,name,address)?html:null;
  }catch{return null}
}

function venueScore(candidate,name,address,website){
  const context=String(candidate?.context||'')+' '+String(candidate?.url||'');
  const hay=normalizeMatchText(context);
  const nameTokens=significantNameTokens(name);
  const matchedName=nameTokens.filter(t=>hay.includes(t)).length;
  const addrNumber=(String(address||'').match(/\b\d{1,6}\b/)||[])[0];
  const venueHits=(normalizeMatchText(context).match(/exterior|outside|outdoor|front|entrance|entry|building|storefront|facade|sign|signage|location|drive thru|parking lot|parking|street view|patio|terrace/g)||[]).length;
  const foodHits=(normalizeMatchText(context).match(/menu|food|dish|meal|burger|pizza|salad|steak|wings|tacos|sushi|pasta|chicken|fries|dessert|cake|sandwich|plate|entree|appetizer|breakfast|lunch|dinner|drink|cocktail|coffee|beer|wine/g)||[]).length;
  let score=0;
  score+=matchedName*24;
  if(nameTokens.length&&matchedName===nameTokens.length)score+=70;
  if(addrNumber&&hay.includes(normalizeMatchText(addrNumber)))score+=34;
  if(VENUE_IMAGE_HINTS.test(context))score+=Math.min(90,venueHits*22);
  if(FOOD_IMAGE_HINTS.test(context))score-=Math.min(120,foodHits*24);
  if(candidate.source==='img')score+=8;
  if(candidate.source==='background')score+=3;
  const websiteHost=hostOf(website);
  const candidateHost=hostOf(candidate.url);
  if(websiteHost&&candidateHost&&(candidateHost===websiteHost||candidateHost.endsWith('.'+websiteHost)))score+=18;
  return score;
}

function hasVenueSignal(candidate){
  const context=String(candidate?.context||'');
  if(!context.trim())return false;
  // The page itself has already been verified as the exact restaurant/location.
  // For page-level image metadata (og:image / JSON-LD), that verification is
  // sufficient; forcing venue words into the image tag context rejects many
  // legitimate restaurant hero photos.
  if(candidate?.source==='meta'||candidate?.source==='jsonld')return true;
  const hay=normalizeMatchText(context);
  const venueHits=(hay.match(/exterior|outside|outdoor|front|entrance|entry|building|storefront|facade|sign|signage|location|drive thru|parking lot|parking|street view|patio|terrace/g)||[]).length;
  const foodHits=(hay.match(/menu|food|dish|meal|burger|pizza|salad|steak|wings|tacos|sushi|pasta|chicken|fries|dessert|cake|sandwich|plate|entree|appetizer|breakfast|lunch|dinner|drink|cocktail|coffee|beer|wine/g)||[]).length;
  // Require venue evidence, but allow normal restaurant-page copy around a
  // real venue photo instead of rejecting it because the page mentions food.
  return venueHits>=1 && foodHits <= (venueHits*3+4);
}

function extractVenueImageCandidates(html,pageUrl,name,address,website){
  const raw=[
    ...extractImgCandidates(html,pageUrl),
    ...extractStyleImageCandidates(html,pageUrl),
    ...extractJsonLdImageCandidates(html,pageUrl)
  ];
  const meta=extractMetaImages(html,pageUrl).map(url=>({url,context:url+' '+normalizeMatchText(name)+' restaurant',source:'meta'}));
  const seen=new Set();
  const all=[...raw,...meta].map(item=>({...item,score:venueScore(item,name,address,website)}))
    .filter(item=>{
      if(seen.has(item.url))return false;
      seen.add(item.url);
      return !BLOCKED_IMAGE_HINTS.test(item.url);
    });
  return all.sort((a,b)=>b.score-a.score);
}

function extractBingImageCandidates(html){
  const candidates=[],re=/\bm="([^"]+)"/gi;
  let match;
  while((match=re.exec(html))&&candidates.length<60){
    try{
      const raw=JSON.parse(decodeHtml(match[1]));
      const contentUrl=absoluteHttpsUrl(raw?.murl||raw?.contentUrl||'');
      const hostPageUrl=absoluteHttpsUrl(raw?.purl||raw?.hostPageUrl||'');
      if(!contentUrl||isBlockedHost(contentUrl)||BLOCKED_IMAGE_HINTS.test(contentUrl))continue;
      candidates.push({
        contentUrl,
        hostPageUrl,
        title:String(raw?.t||raw?.name||'').trim(),
        description:String(raw?.desc||'').trim(),
        host:hostOf(hostPageUrl||contentUrl)
      });
    }catch{}
  }
  return candidates;
}

function scoreImage(candidate,name,address,website){
  return venueScore({url:candidate?.contentUrl||'',context:[candidate?.title,candidate?.description,candidate?.hostPageUrl,candidate?.query].filter(Boolean).join(' '),source:'bing'},name,address,website)
      + (candidate?.hostPageUrl?12:0);
}

function extractBingWebResultUrls(html){
  const out=[];
  const re=/<li[^>]+class=["'][^"']*b_algo[^"']*["'][^>]*>[\s\S]*?<h2[^>]*>\s*<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while((m=re.exec(String(html||'')))&&out.length<20){
    const url=absoluteHttpsUrl(String(m[1]||'').replace(/&amp;/g,'&'));
    if(url&&!isBlockedHost(url))out.push(url);
  }
  return [...new Set(out)];
}

async function fetchVerifiedPages(urls,name,address){
  const results=await Promise.allSettled(urls.map(async url=>{
    const html=await verifiedRestaurantPage(url,name,address);
    return html?{url,html}:null;
  }));
  return results.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);
}
function sameHost(a,b){
  const ah=hostOf(a),bh=hostOf(b);
  return !!ah&&!!bh&&(ah===bh||ah.endsWith('.'+bh)||bh.endsWith('.'+ah));
}
function extractInternalLinks(html,pageUrl,name,address){
  const out=[],seen=new Set(),re=/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/ig;
  const nameTokens=significantNameTokens(name),addressTokens=normalizeMatchText(address).split(' ').filter(t=>t.length>=3).slice(0,10);
  let m;
  while((m=re.exec(String(html||'')))&&out.length<80){
    const raw=m[1]??m[2]??m[3]??'',url=absoluteHttpsUrl(raw,pageUrl);
    if(!url||isBlockedHost(url)||!sameHost(url,pageUrl)||seen.has(url))continue;
    const text=String(m[4]||'').replace(/<[^>]+>/g,' ');
    const context=normalizeMatchText([text,url].join(' '));
    const locationSignal=/location|locations|find us|store locator|where we are|contact|our restaurant|restaurants?/i.test(context);
    const photoSignal=/gallery|photo|photos|about|visit|inside|outside|exterior/i.test(context);
    const nameSignal=nameTokens.filter(t=>context.includes(t)).length>=Math.max(1,Math.ceil(nameTokens.length*0.5));
    const addressSignal=addressTokens.filter(t=>context.includes(t)).length>=2;
    const score=(locationSignal?50:0)+(photoSignal?20:0)+(nameSignal?30:0)+(addressSignal?35:0);
    if(score<=0)continue;
    seen.add(url);out.push({url,score});
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,12).map(x=>x.url);
}
async function officialRestaurantPages(name,address,website){
  const official=absoluteHttpsUrl(website);
  if(!official||isBlockedHost(official))return [];
  try{
    const html=await fetchText(official,{},3000,1800000);
    const pages=[];
    const direct=pageMatchesRestaurant(html,name,address)?html:null;
    if(direct)pages.push({url:official,html:direct});
    const links=extractInternalLinks(html,official,name,address);
    const internal=await fetchVerifiedPages(links.slice(0,4),name,address);
    for(const item of internal)if(!pages.some(x=>sameHost(x.url,item.url)))pages.push(item);
    return pages.slice(0,12);
  }catch{return []}
}
async function findVerifiedRestaurantPages(name,address,website){
  const safeName=String(name||'').replace(/"/g,''),safeAddress=String(address||'').replace(/"/g,''),websiteHost=hostOf(website);
  const queries=[];
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant photos exterior');
  if(websiteHost&&safeName&&safeAddress)queries.push('site:'+websiteHost+' "'+safeName+'" "'+safeAddress+'"');
  if(safeName&&safeAddress)queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName&&safeAddress)queries.push('site:restaurantguru.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName&&safeAddress)queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName&&safeAddress)queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'"');
  const officialPromise=officialRestaurantPages(name,address,website);
  const searchPages=await Promise.allSettled(queries.map(q=>fetchText('https://www.bing.com/search?'+new URLSearchParams({q:q,mkt:'en-US',first:'1'}).toString(),{},3500,700000)));
  const candidates=[];
  for(const page of searchPages){
    if(page.status!=='fulfilled')continue;
    for(const url of extractBingWebResultUrls(page.value))if(!candidates.includes(url))candidates.push(url);
  }
  const verified=await fetchVerifiedPages(candidates.slice(0,16),name,address);
  const official=await officialPromise;
  const officialFromSearch=verified.filter(x=>websiteHost&&sameHost(x.url,websiteHost));
  const publicPages=verified.filter(x=>!websiteHost||!sameHost(x.url,websiteHost));
  const officialMerged=[...official,...officialFromSearch].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i).slice(0,12);
  return {official:officialMerged,public:publicPages.slice(0,12)};
}

async function bingExactImageCandidates(name,address,website){
  const safeName=String(name||'').replace(/"/g,''),safeAddress=String(address||'').replace(/"/g,''),websiteHost=hostOf(website);
  if(!safeName||!safeAddress)return [];
  const queries=['"'+safeName+'" "'+safeAddress+'" restaurant exterior'];
  if(websiteHost)queries.push('site:'+websiteHost+' "'+safeName+'" "'+safeAddress+'"');
  const pages=await Promise.allSettled(queries.map(q=>fetchText('https://www.bing.com/images/search?'+new URLSearchParams({q:q,form:'HDRSC2'}).toString(),{},5000,1200000)));
  const raw=[];
  for(const page of pages){
    if(page.status!=='fulfilled')continue;
    for(const item of extractBingImageCandidates(page.value))raw.push({...item,query:safeName+' '+safeAddress});
  }
  const seen=new Set();
  const candidates=raw.filter(x=>{
    if(seen.has(x.contentUrl))return false;
    seen.add(x.contentUrl);
    return !!x.contentUrl;
  }).map(x=>({...x,score:scoreImage(x,name,address,website)})).filter(x=>x.score>=55);
  return candidates.sort((a,b)=>b.score-a.score).slice(0,20);
}

async function exactImageFromBing(name,address,website){
  const candidates=await bingExactImageCandidates(name,address,website);
  const checks=await Promise.allSettled(candidates.slice(0,10).map(async candidate=>{
    const hostPage=candidate.hostPageUrl;
    if(hostPage){
      const verified=await verifiedRestaurantPage(hostPage,name,address);
      if(!verified)return null;
    }
    try{
      const media=await fetchImage(candidate.contentUrl,{'Referer':hostPage||undefined},4000);
      return {media,source:'exact-public-venue-image',sourceUrl:hostPage||candidate.contentUrl,sourceName:hostOf(hostPage||candidate.contentUrl)};
    }catch{return null}
  }));
  for(const result of checks)if(result.status==='fulfilled'&&result.value)return result.value;
  return null;
}
function sendMedia(res,found){
  res.setHeader?.('Content-Type',found.media.type);
  res.setHeader?.('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader?.('X-Content-Type-Options','nosniff');
  res.setHeader?.('X-Restaurant-Photo-Source',found.source);
  if(found.sourceUrl)res.setHeader?.('X-Restaurant-Photo-Source-URL',found.sourceUrl);
  if(found.sourceName&&found.sourceUrl){
    res.setHeader?.('X-Restaurant-Photo-Attributions',Buffer.from(JSON.stringify([{displayName:found.sourceName,uri:found.sourceUrl}])).toString('base64url'));
  }
  res.statusCode=200;
  res.end?.(found.media.bytes);
  return res;
}

module.exports=async function handler(req,res){
  const q=req?.query&&typeof req.query==='object'?req.query:(req?.queryStringParameters||{});
  const name=String(q.name||'').trim().slice(0,160);
  const address=String(q.address||'').trim().slice(0,240);
  const website=String(q.website||'').trim().slice(0,700);
  const officialWebsite=String(q.officialWebsite||website).trim().slice(0,700);
  const osmImage=String(q.osmImage||'').trim().slice(0,1200);
  const osmExact=q.osmExact==='1';
  if(!name)return json(res,400,{ok:false,error:'Restaurant name is required'});
  try{
    const pages=await findVerifiedRestaurantPages(name,address,officialWebsite);

    // Tier 1: exact restaurant/location images from the restaurant's own website.
    for(const entry of pages.official){
      const candidates=extractVenueImageCandidates(entry.html,entry.url,name,address,officialWebsite)
        .filter(item=>item.score>=65&&item.score>0&&hasVenueSignal(item));
      const attempts=await Promise.allSettled(candidates.slice(0,8).map(async candidate=>{
        try{return {media:await fetchImage(candidate.url,{'Referer':entry.url},4000)}}catch{return null}
      }));
      for(const hit of attempts)if(hit.status==='fulfilled'&&hit.value){
        return sendMedia(res,{media:hit.value.media,source:'official-venue-page',sourceUrl:entry.url,sourceName:hostOf(entry.url)});
      }
    }

    // Tier 2: exact-location public restaurant pages.
    for(const entry of pages.public){
      const candidates=extractVenueImageCandidates(entry.html,entry.url,name,address,officialWebsite)
        .filter(item=>item.score>=65&&item.score>0&&hasVenueSignal(item));
      const attempts=await Promise.allSettled(candidates.slice(0,8).map(async candidate=>{
        try{return {media:await fetchImage(candidate.url,{'Referer':entry.url},4000)}}catch{return null}
      }));
      for(const hit of attempts)if(hit.status==='fulfilled'&&hit.value){
        return sendMedia(res,{media:hit.value.media,source:'exact-public-venue-page',sourceUrl:entry.url,sourceName:hostOf(entry.url)});
      }
    }

    // Tier 3: exact-location image discovered by Bing Images, but only when
    // the image's host page verifies this exact restaurant and address.
    const bingImage=await exactImageFromBing(name,address,officialWebsite);
    if(bingImage)return sendMedia(res,bingImage);

    // Tier 4: the image already attached to the exact OSM POI.
    if(osmExact&&/^https:\/\//i.test(osmImage)&&!isBlockedHost(osmImage)&&!BLOCKED_IMAGE_HINTS.test(osmImage)){
      try{
        const media=await fetchImage(osmImage,{'Referer':'https://www.openstreetmap.org/'},4000);
        return sendMedia(res,{media,source:'osm-exact-poi'});
      }catch{}
    }

    return json(res,404,{ok:false,error:'No verified venue photo was found from the allowed non-Google sources'});
  }catch(e){
    console.error('dinliminate-restaurant-photo',e);
    return json(res,502,{ok:false,error:'Could not load the restaurant photo'});
  }
};

module.exports._test={
  absoluteHttpsUrl,
  extractMetaImages,
  extractBingWebResultUrls,
  extractJsonLdImageCandidates,
  extractImgCandidates,
  extractVenueImageCandidates,
  pageMatchesRestaurant,
  venueScore,
  hasVenueSignal,
  extractInternalLinks,
  sameHost,
  structuredRestaurantMatches
};