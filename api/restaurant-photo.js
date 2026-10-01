'use strict';

const NO_PHOTO_HOSTS=new Set(['google.com','www.google.com','googleusercontent.com','lh3.googleusercontent.com','bing.com','www.bing.com','tse1.mm.bing.net','tse2.mm.bing.net','tse3.mm.bing.net','tse4.mm.bing.net','unsplash.com','images.unsplash.com','pexels.com','images.pexels.com','shutterstock.com','istockphoto.com','gettyimages.com','depositphotos.com','alamy.com','stock.adobe.com']);
const BLOCKED_IMAGE_HINTS=/\b(?:logo|favicon|sprite|icon|avatar|placeholder|default[-_ ]?image|brandmark|wordmark)\b/i;
const VENUE_IMAGE_HINTS=/\b(?:exterior|outside|outdoor|front|entrance|entry|building|storefront|facade|façade|sign|signage|location|drive[- ]?thru|drive through|parking lot|parking|street view|patio|terrace)\b/i;
const FOOD_IMAGE_HINTS=/\b(?:menu|food|dish|meal|burger|pizza|salad|steak|wings|tacos?|sushi|pasta|chicken|fries|dessert|cake|sandwich|plate|entrée|entree|appetizer|breakfast|lunch|dinner|drink|cocktail|coffee|beer|wine)\b/i;
const KNOWN_CHAIN_NAMES=[
  "mcdonald's","taco bell","wendy's","burger king","kfc","chick fil a","popeyes","subway","sonic","arby's",
  "whataburger","five guys","culver's","raising cane's","wingstop","bojangles","cook out","dairy queen",
  "zaxby's","church's chicken","captain d's","long john silver's","jimmy john's","jersey mike's","firehouse subs",
  "little caesars","domino's","papa john's","pizza hut","marco's pizza","krystal","steak 'n shake","white castle",
  "freddy's","panda express","jack in the box","hardee's","del taco","checkers","rally's","chipotle","applebee's",
  "chili's","olive garden","waffle house"
];

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
    const evidence=[attrs.alt,attrs.title,attrs['data-caption'],attrs['data-alt'],attrs['data-filename']].filter(Boolean).join(' ');
    const context=[evidence,attrs.class,attrs.id,nearby,url].filter(Boolean).join(' ');
    candidates.push({url,context,evidence,source:'img'});
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
    candidates.push({url,context,evidence:context,source:'background'});
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
    out.push({url,context:context+' '+url,evidence:context,source:'jsonld'});
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

function pageMatchesRestaurant(html,name,address){
  const hay=normalizeMatchText(String(html||'').slice(0,1400000));
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
  const evidence=String(candidate?.source==='img' ? (candidate?.evidence||'') : (candidate?.context||''));
  const context=evidence+' '+String(candidate?.url||'');
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
  return VENUE_IMAGE_HINTS.test(context) && !/^.*(?:menu|food|dish|meal).*(?:menu|food|dish|meal).*$/i.test(context);
}

function imageMatchesExactVenue(candidate,name,address){
  if(!candidate||candidate.source!=='img')return false;
  const evidence=normalizeMatchText(String(candidate.evidence||''));
  const url=normalizeMatchText(String(candidate.url||''));
  if(!evidence && !url)return false;
  if(FOOD_IMAGE_HINTS.test(evidence))return false;
  const nameTokens=significantNameTokens(name);
  const evidenceMatched=nameTokens.filter(t=>evidence.includes(t)).length;
  const urlMatched=nameTokens.filter(t=>url.includes(t)).length;
  const exactName=evidenceMatched===nameTokens.length && nameTokens.length>0;
  const exactUrlName=urlMatched===nameTokens.length && nameTokens.length>0;
  const addrNumber=normalizeMatchText((String(address||'').match(/\b\d{1,6}\b/)||[])[0]||'');
  const hasAddress=!!addrNumber && (evidence.includes(addrNumber)||url.includes(addrNumber));
  const hasVenueEvidence=VENUE_IMAGE_HINTS.test(evidence);
  const chainName=normalizeMatchText(name);
  const knownChain=KNOWN_CHAIN_NAMES.some(k=>{
    const ck=normalizeMatchText(k);
    return chainName===ck || chainName.includes(ck);
  });
  if(knownChain){
    return (exactName||exactUrlName||evidenceMatched>0) && (hasAddress||hasVenueEvidence);
  }
  return exactName || exactUrlName || (hasVenueEvidence && (evidenceMatched>0 || urlMatched>0 || /(?:photo|image|picture|gallery)/.test(evidence+' '+url)));
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

function slugPart(value){
  return normalizeMatchText(String(value||''))
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,90);
}

function directJoeCoffeeCandidate(name,address){
  const m=String(address||'').match(/,\s*([^,]+),\s*([A-Za-z]{2})\s+\d{5}(?:-\d{4})?/);
  if(!m)return '';
  const city=slugPart(m[1]);
  const state=String(m[2]||'').toLowerCase();
  const rest=slugPart(name);
  if(!city||!state||!rest)return '';
  return 'https://joe.coffee/locations/'+state+'/'+city+'/'+rest+'-'+city+'/';
}

async function findVerifiedRestaurantPages(name,address,website){
  const queries=[];
  const directPages=[];
  const safeName=String(name||'').replace(/"/g,'');
  const safeAddress=String(address||'').replace(/"/g,'');
  const websiteHost=hostOf(website);
  const directJoe=directJoeCoffeeCandidate(name,address);

  if(directJoe&&!isBlockedHost(directJoe)){
    try{
      const html=await verifiedRestaurantPage(directJoe,name,address);
      if(html)directPages.push({url:directJoe,html});
    }catch{}
  }

  if(websiteHost&&!isBlockedHost(website))queries.push('site:'+websiteHost+' "'+safeName+'"');
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant photos');
  if(safeName)queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:joe.coffee/locations "'+safeName+'" "'+safeAddress+'"');

  const unique=[...new Set(queries.filter(Boolean))].slice(0,6);
  const pages=await Promise.allSettled(unique.map(q=>fetchText(
    'https://www.bing.com/search?'+new URLSearchParams({q:q,mkt:'en-US',first:'1'}).toString(),
    {},4500,1100000
  )));

  const candidates=[];
  for(const p of pages){
    if(p.status!=='fulfilled')continue;
    for(const url of extractBingWebResultUrls(p.value)){
      if(!candidates.includes(url))candidates.push(url);
      if(candidates.length>=12)break;
    }
    if(candidates.length>=12)break;
  }

  const checks=await Promise.allSettled(
    candidates.slice(0,12).map(async url=>({url,html:await verifiedRestaurantPage(url,name,address)}))
  );
  const searched=checks
    .filter(x=>x.status==='fulfilled'&&x.value.html)
    .map(x=>x.value);
  return [...directPages,...searched].slice(0,6);
}

async function bingImages(name,address,website){
  const queries=[];
  const safeName=String(name||'').replace(/"/g,'');
  const safeAddress=String(address||'').replace(/"/g,'');
  const websiteHost=hostOf(website);

  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant exterior');
  if(safeName&&safeAddress)queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'"');
  if(safeName&&safeAddress)queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName&&safeAddress)queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName&&safeAddress)queries.push('site:joe.coffee/locations "'+safeName+'" "'+safeAddress+'"');

  const unique=[...new Set(queries)].slice(0,5);
  const pages=await Promise.allSettled(unique.map(q=>fetchText(
    'https://www.bing.com/images/search?'+new URLSearchParams({q:q,mkt:'en-US',safeSearch:'Strict',first:'1'}).toString(),
    {},4500,1200000
  )));
  const all=[];
  pages.forEach((p,i)=>{
    if(p.status!=='fulfilled')return;
    for(const item of extractBingImageCandidates(p.value)){
      item.query=unique[i];
      item.score=scoreImage(item,safeName,safeAddress,website);
      all.push(item);
      if(all.length>=24)break;
    }
  });
  const seen=new Set();
  return all.sort((a,b)=>b.score-a.score).filter(x=>{
    const k=x.contentUrl.toLowerCase();
    if(seen.has(k))return false;
    seen.add(k);
    return true;
  }).slice(0,24);
}

function photoProxyUrl(raw){
  const src=absoluteHttpsUrl(raw);
  if(!src)return '';
  return 'https://wsrv.nl/?url='+encodeURIComponent(src)+'&w=1200&h=800&fit=cover&q=85&output=webp&maxage=30d';
}

function sendPhotoReference(res,found){
  const url=photoProxyUrl(found?.imageUrl||'');
  if(!url)return json(res,404,{ok:false,error:'No usable venue photo URL was found'});
  res.setHeader?.('Content-Type','application/json; charset=utf-8');
  res.setHeader?.('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader?.('X-Restaurant-Photo-Source',found.source||'verified-venue-page');
  if(found.sourceUrl)res.setHeader?.('X-Restaurant-Photo-Source-URL',found.sourceUrl);
  res.statusCode=200;
  res.end?.(JSON.stringify({ok:true,url,source:found.source||'verified-venue-page',sourceUrl:found.sourceUrl||''}));
  return res;
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
  if(!name)return json(res,400,{ok:false,error:'Restaurant name is required'});
  try{
    const verifiedPages=await findVerifiedRestaurantPages(name,address,website);

    // 1) Exact restaurant pages: only use images that look like the venue itself.
    for(const entry of verifiedPages){
      const pageText=normalizeMatchText(String(entry.html||'').slice(0,700000));
      const candidates=extractVenueImageCandidates(entry.html,entry.url,name,address,website)
        .filter(item=>{
          if(item.score<65 || item.score<=0)return false;
          if(item.source==='meta')return false;
          return imageMatchesExactVenue(item,name,address);
        });
      for(const candidate of candidates.slice(0,14)){
        try{
          const media=await fetchImage(candidate.url,{'Referer':entry.url},5500);
          return sendMedia(res,{media,source:'verified-venue-page',sourceUrl:entry.url,sourceName:hostOf(entry.url)});
        }catch{}
      }
      const proxyCandidate=candidates.find(Boolean);
      if(proxyCandidate) return sendPhotoReference(res,{imageUrl:proxyCandidate.url,source:'verified-venue-page-proxy',sourceUrl:entry.url});
    }

    // 2) Bing is discovery only; image must point back to a verified exact restaurant page
    // and carry strong venue/exterior evidence.
    const bing=await bingImages(name,address,website);
    for(const candidate of bing.slice(0,40)){
      if(candidate.score<115||!candidate.hostPageUrl)continue;
      const html=await verifiedRestaurantPage(candidate.hostPageUrl,name,address);
      if(!html)continue;
      const pageCandidates=extractVenueImageCandidates(html,candidate.hostPageUrl,name,address,website);
      const bestPage=pageCandidates.find(item=>item.url===candidate.contentUrl && item.score>=65 && item.source!=='meta' && imageMatchesExactVenue(item,name,address));
      try{
        if(bestPage){
          const media=await fetchImage(candidate.contentUrl,{'Referer':candidate.hostPageUrl},6500);
          return sendMedia(res,{media,source:'verified-venue-image',sourceUrl:candidate.hostPageUrl,sourceName:hostOf(candidate.hostPageUrl)});
        }
      }catch{}
      const proxyCandidates=pageCandidates.filter(item=>item.score>=65 && item.source!=='meta' && imageMatchesExactVenue(item,name,address)).slice(0,10);
      for(const pageCandidate of proxyCandidates){
        try{
          const media=await fetchImage(pageCandidate.url,{'Referer':candidate.hostPageUrl},5500);
          return sendMedia(res,{media,source:'verified-venue-image',sourceUrl:candidate.hostPageUrl,sourceName:hostOf(candidate.hostPageUrl)});
        }catch{}
      }
      const proxyCandidate=proxyCandidates[0];
      if(proxyCandidate) return sendPhotoReference(res,{imageUrl:proxyCandidate.url,source:'verified-venue-image-proxy',sourceUrl:candidate.hostPageUrl});
    }

    return json(res,404,{ok:false,error:'No verified venue photo was found from non-Google sources'});
  }catch(e){
    console.error('dinliminate-restaurant-photo',e);
    return json(res,502,{ok:false,error:'Could not load the restaurant photo'});
  }
};

module.exports._test={
  absoluteHttpsUrl,
  extractMetaImages,
  extractBingImageCandidates,
  scoreImage,
  extractBingWebResultUrls,
  extractJsonLdImageCandidates,
  extractImgCandidates,
  extractVenueImageCandidates,
  pageMatchesRestaurant,
  venueScore,
  hasVenueSignal
};