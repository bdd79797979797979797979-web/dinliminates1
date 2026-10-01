'use strict';

const NO_PHOTO_HOSTS=new Set(['google.com','www.google.com','googleusercontent.com','lh3.googleusercontent.com','bing.com','www.bing.com','tse1.mm.bing.net','tse2.mm.bing.net','tse3.mm.bing.net','tse4.mm.bing.net','unsplash.com','images.unsplash.com','pexels.com','images.pexels.com','shutterstock.com','istockphoto.com','gettyimages.com','depositphotos.com','alamy.com','stock.adobe.com']);
const BLOCKED_IMAGE_HINTS=/\b(?:logo|favicon|sprite|icon|avatar|placeholder|default[-_ ]?image|brandmark|wordmark|badge|badge-logo)\b/i;
const VENUE_IMAGE_HINTS=/\b(?:exterior|outside|outdoor|front|entrance|entry|building|storefront|facade|façade|sign|signage|location|drive[- ]?thru|drive through|parking lot|parking|street view|patio|terrace)\b/i;
const FOOD_IMAGE_HINTS=/\b(?:menu|food|dish|meal|burger|pizza|salad|steak|wings|tacos?|sushi|pasta|chicken|fries|dessert|cake|sandwich|plate|entrée|entree|appetizer|breakfast|lunch|dinner|drink|cocktail|coffee|beer|wine)\b/i;
const VERIFIED_RESTAURANT_PHOTOS=require('../data/verified-restaurant-photos.json');


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
    const evidence=[attrs.alt,attrs.title,attrs['data-caption'],attrs['data-alt'],attrs['data-filename']].filter(Boolean).join(' ');
    const context=[evidence,attrs.class,attrs.id,url].filter(Boolean).join(' ');
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
function verifiedRestaurantPhoto(name,address){
  const n=normalizeMatchText(name),a=normalizeMatchText(address);
  if(!n||!a)return null;
  return (Array.isArray(VERIFIED_RESTAURANT_PHOTOS)?VERIFIED_RESTAURANT_PHOTOS:[]).find(x=>{
    return normalizeMatchText(x.name)===n&&normalizeMatchText(x.address)===a;
  })||null;
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
  const evidence=String(candidate?.evidence||'');
  const context=evidence+' '+String(candidate?.context||'')+' '+String(candidate?.url||'');
  const hay=normalizeMatchText(evidence+' '+String(candidate?.url||''));
  const nameTokens=significantNameTokens(name);
  const matchedName=nameTokens.filter(t=>hay.includes(t)).length;
  const addrNumber=(String(address||'').match(/\b\d{1,6}\b/)||[])[0];
  const venueHits=(normalizeMatchText(context).match(/exterior|outside|outdoor|front|entrance|entry|building|storefront|facade|sign|signage|location|drive thru|parking lot|parking|street view|patio|terrace/g)||[]).length;
  const foodHits=(normalizeMatchText(context).match(/menu|food|dish|meal|burger|pizza|salad|steak|wings|tacos|sushi|pasta|chicken|fries|dessert|cake|sandwich|plate|entree|appetizer|breakfast|lunch|dinner|drink|cocktail|coffee|beer|wine/g)||[]).length;
  let score=0;
  score+=matchedName*24;
  if(nameTokens.length&&matchedName===nameTokens.length)score+=70;
  if(addrNumber&&hay.includes(normalizeMatchText(addrNumber)))score+=34;
  if(VENUE_IMAGE_HINTS.test(evidence+' '+String(candidate?.url||'')))score+=Math.min(110,venueHits*25);
  if(FOOD_IMAGE_HINTS.test(evidence+' '+String(candidate?.url||'')))score-=Math.min(150,foodHits*30);
  if(BLOCKED_IMAGE_HINTS.test(evidence+' '+String(candidate?.url||'')))score-=180;
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

const VERIFIED_VENUE_PAGES=[
  {
    nameTokens:['mcdonald'],
    addressTokens:['724','sango','clarksville','37043'],
    url:'https://www.tripadvisor.co.uk/LocationPhotoDirectLink-g54955-d4875292-i279346939-McDonald_s-Clarksville_Tennessee.html'
  },
  {
    nameTokens:['thirsty','goat'],
    addressTokens:['4044','41','clarksville','37043'],
    url:'https://joe.coffee/locations/tn/clarksville/the-thirsty-goat-clarksville/'
  },
  {
    nameTokens:['ruby','tuesday'],
    addressTokens:['2239','madison','clarksville','37043'],
    url:'https://www.waze.com/live-map/directions/ruby-tuesday-madison-st-2239-clarksville?to=place.w.178717037.1787366979.581004'
  },
  {
    nameTokens:['chipotle'],
    addressTokens:['2296','madison','clarksville','37043'],
    url:'https://www.loopnet.com/Listing/2296-Madison-St-Clarksville-TN/27244861/'
  }
];

function matchesVerifiedPageFixture(name,address,fixture){
  const nameText=normalizeMatchText(name),addrText=normalizeMatchText(address);
  return fixture.nameTokens.every(t=>nameText.includes(t))&&fixture.addressTokens.every(t=>addrText.includes(t));
}

async function findVerifiedRestaurantPages(name,address,website){
  const queries=[],safeName=String(name||'').replace(/"/g,''),safeAddress=String(address||'').replace(/"/g,'');
  const websiteHost=hostOf(website);
  const fixture=VERIFIED_VENUE_PAGES.find(x=>matchesVerifiedPageFixture(name,address,x));
  const direct=[];
  if(fixture){
    const html=await verifiedRestaurantPage(fixture.url,name,address);
    if(html)direct.push({url:fixture.url,html,verifiedFixture:true});
  }
  if(websiteHost&&!isBlockedHost(website))queries.push('site:'+websiteHost+' "'+safeName+'"');
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant photos exterior');
  if(safeName)queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:restaurantguru.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'"');
  const unique=[...new Set(queries.filter(Boolean))].slice(0,6);
  const pages=await Promise.allSettled(unique.map(q=>fetchText('https://www.bing.com/search?'+new URLSearchParams({q:q,mkt:'en-US',first:'1'}).toString(),{},7000)));
  const candidates=[];
  for(const p of pages){
    if(p.status!=='fulfilled')continue;
    for(const url of extractBingWebResultUrls(p.value))if(!candidates.includes(url))candidates.push(url);
  }
  const verified=[];
  for(const url of candidates.slice(0,30)){
    const html=await verifiedRestaurantPage(url,name,address);
    if(html)verified.push({url,html});
    if(verified.length>=12)break;
  }
  return [...direct,...verified];
}

async function bingImages(name,address,website){
  const queries=[],websiteHost=hostOf(website);
  const safeName=String(name||'').replace(/"/g,'');
  const safeAddress=String(address||'').replace(/"/g,'');
  if(websiteHost&&!isBlockedHost(website))queries.push('site:'+websiteHost+' "'+safeName+'"');
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant exterior photos');
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant storefront');
  if(safeName)queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'" exterior');
  if(safeName)queries.push('site:restaurantguru.com "'+safeName+'" "'+safeAddress+'" exterior');
  if(safeName)queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'" exterior');
  if(safeName)queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'" exterior');
  const unique=[...new Set(queries.filter(Boolean))].slice(0,7);
  const pages=await Promise.allSettled(unique.map(q=>fetchText('https://www.bing.com/images/search?'+new URLSearchParams({q:q,mkt:'en-US',safeSearch:'Strict',first:'1'}).toString(),{},7000)));
  const all=[];
  pages.forEach((p,i)=>{
    if(p.status!=='fulfilled')return;
    for(const item of extractBingImageCandidates(p.value)){
      item.query=unique[i];
      item.score=scoreImage(item,safeName,safeAddress,website);
      all.push(item);
    }
  });
  const seen=new Set();
  return all.sort((a,b)=>b.score-a.score).filter(x=>{
    const k=x.contentUrl.toLowerCase();
    if(seen.has(k))return false;
    seen.add(k);
    return true;
  });
}

function sendPhotoRedirect(res,found){
  const source=absoluteHttpsUrl(found?.imageUrl||'');
  if(!source)return json(res,404,{ok:false,error:'No usable venue photo URL was found'});
  const proxied='https://wsrv.nl/?url='+encodeURIComponent(source)+'&w=1200&h=800&fit=cover&q=85&output=webp&maxage=7d';
  res.statusCode=302;
  res.setHeader?.('Location',proxied);
  res.setHeader?.('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader?.('X-Restaurant-Photo-Source',found.source||'verified-venue-photo');
  if(found.sourceUrl)res.setHeader?.('X-Restaurant-Photo-Source-URL',found.sourceUrl);
  res.end?.();
  return res;
}

function exactAddressEvidence(text,address){
  const body=normalizeText(text);
  const a=String(address||'').match(/^\s*(\d{1,6})\b/);
  const number=a?normalizeText(a[1]):'';
  const parts=String(address||'').split(',').map(x=>normalizeText(x)).filter(Boolean);
  const city=parts[1]||'';
  return !!number&&body.includes(number)&&(!city||body.includes(city));
}

function exactNameEvidence(text,name){
  const body=normalizeText(text);
  const tokens=significantNameTokens(name);
  return tokens.length>0&&tokens.every(token=>body.includes(token));
}

function isUsableOfficialImage(candidate){
  const proof=String(candidate?.evidence||'')+' '+String(candidate?.url||'');
  if(BLOCKED_IMAGE_HINTS.test(proof)||FOOD_IMAGE_HINTS.test(proof))return false;
  return true;
}

async function fastOfficialPhoto(name,address,website){
  const site=absoluteHttpsUrl(website);
  if(!site)return null;
  try{
    const html=await fetchText(site,{},2200,1000000);
    if(!exactNameEvidence(html,name)||!exactAddressEvidence(html,address))return null;
    const candidates=extractVenueImageCandidates(html,site,name,address,website)
      .filter(x=>x.source!=='meta'&&isUsableOfficialImage(x))
      .sort((a,b)=>b.score-a.score);
    const candidate=candidates.find(x=>VENUE_IMAGE_HINTS.test(String(x.evidence||'')+' '+String(x.url||'')))||candidates[0];
    if(candidate)return{imageUrl:candidate.url,source:'official-restaurant-website',sourceUrl:site};
  }catch{}
  return null;
}

async function fastPublicSearchPhoto(name,address,website){
  const safeName=String(name||'').replace(/"/g,'');
  const safeAddress=String(address||'').replace(/"/g,'');
  const host=hostOf(website).replace(/^www\./,'');
  const query='"'+safeName+'" "'+safeAddress+'" exterior';
  try{
    const html=await fetchText('https://www.bing.com/images/search?'+new URLSearchParams({q:query,mkt:'en-US',safeSearch:'Strict',first:'1'}).toString(),{},3500,1100000);
    const candidates=extractBingImageCandidates(html);
    for(const candidate of candidates){
      const evidence=[candidate.title,candidate.description,candidate.hostPageUrl].join(' ');
      if(!exactNameEvidence(evidence,name)||!exactAddressEvidence(evidence,address))continue;
      if(!VENUE_IMAGE_HINTS.test(evidence)||FOOD_IMAGE_HINTS.test(evidence)||BLOCKED_IMAGE_HINTS.test(evidence))continue;
      const sourceHost=hostOf(candidate.hostPageUrl).replace(/^www\./,'');
      const trusted=host&&sourceHost&&sourceHost===host;
      const publicVenue=/(?:tripadvisor\.com|tripadvisor\.co\.uk|restaurantji\.com|usarestaurants\.info|restaurantguru\.com|yelp\.com)$/.test(sourceHost);
      if(trusted||publicVenue)return{imageUrl:candidate.contentUrl,source:'exact-public-search',sourceUrl:candidate.hostPageUrl};
    }
  }catch{}
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
  const osmPhoto=absoluteHttpsUrl(q.osmPhoto||'');
  if(!name)return json(res,400,{ok:false,error:'Restaurant name is required'});

  try{
    const verified=verifiedRestaurantPhoto(name,address);
    if(verified)return sendPhotoRedirect(res,{imageUrl:verified.imageUrl,source:'verified-exact-public-photo',sourceUrl:verified.sourceUrl});

    if(osmPhoto&&!isBlockedHost(osmPhoto)&&!BLOCKED_IMAGE_HINTS.test(osmPhoto)&&!FOOD_IMAGE_HINTS.test(osmPhoto)){
      return sendPhotoRedirect(res,{imageUrl:osmPhoto,source:'openstreetmap-poi-image',sourceUrl:'https://www.openstreetmap.org/'});
    }

    const official=await fastOfficialPhoto(name,address,website);
    if(official)return sendPhotoRedirect(res,official);

    const searched=await fastPublicSearchPhoto(name,address,website);
    if(searched)return sendPhotoRedirect(res,searched);

    return json(res,404,{ok:false,error:'No verified venue photo was found'});
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
  hasVenueSignal,matchesVerifiedPageFixture,VERIFIED_VENUE_PAGES,verifiedRestaurantPhoto,VERIFIED_RESTAURANT_PHOTOS,exactAddressEvidence,exactNameEvidence,fastOfficialPhoto,fastPublicSearchPhoto
};