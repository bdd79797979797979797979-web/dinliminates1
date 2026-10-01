'use strict';

const NO_PHOTO_HOSTS=new Set(['google.com','www.google.com','googleusercontent.com','lh3.googleusercontent.com','bing.com','www.bing.com','tse1.mm.bing.net','tse2.mm.bing.net','tse3.mm.bing.net','tse4.mm.bing.net','unsplash.com','images.unsplash.com','pexels.com','images.pexels.com','shutterstock.com','istockphoto.com','gettyimages.com','depositphotos.com','alamy.com']);
const BLOCKED_IMAGE_HINTS=/\b(?:logo|favicon|sprite|icon|avatar|placeholder|default[-_ ]?image)\b/i;

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
function isBlockedHost(raw){const host=hostOf(raw);if(!host)return true;for(const blocked of NO_PHOTO_HOSTS)if(host===blocked||host.endsWith('.'+blocked))return true;return false}

function decodeHtml(raw){return String(raw||'').replace(/&quot;/g,'"').replace(/&#34;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')}

async function fetchText(url,headers={},timeout=7000,maxBytes=2200000){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{'Accept':'text/html,application/xhtml+xml','Accept-Language':'en-US,en;q=0.8','User-Agent':'Mozilla/5.0 (compatible; Dinliminate/1.0; restaurant-photo)',...headers},signal:ctl.signal});
    if(!r.ok)throw new Error('Page request failed ('+r.status+').');
    const data=Buffer.from(await r.arrayBuffer());
    if(data.length>maxBytes)throw new Error('Page too large.');
    return data.toString('utf8');
  }finally{clearTimeout(timer)}
}

async function fetchImage(url,headers={},timeout=7000){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{'Accept':'image/avif,image/webp,image/apng,image/jpeg,image/png,image/gif,image/*;q=0.8','User-Agent':'Mozilla/5.0 (compatible; Dinliminate/1.0; restaurant-photo)',...headers},redirect:'follow',signal:ctl.signal});
    if(!r.ok)throw new Error('Image request failed ('+r.status+').');
    const type=(r.headers.get('content-type')||'image/jpeg').split(';')[0].toLowerCase();
    if(!type.startsWith('image/'))throw new Error('Image response was not an image.');
    const bytes=Buffer.from(await r.arrayBuffer());
    if(bytes.length<4000)throw new Error('Image response was too small.');
    if(bytes.length>10*1024*1024)throw new Error('Image is too large.');
    return {type,bytes};
  }finally{clearTimeout(timer)}
}

function extractMetaImages(html,pageUrl){
  const urls=[];
  const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/ig,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/ig
  ];
  for(const re of patterns){let m;while((m=re.exec(html))&&urls.length<10)urls.push(m[1]);}
  return urls.map(raw=>absoluteHttpsUrl(String(raw||'').replace(/&amp;/g,'&'),pageUrl)).filter(Boolean).filter(url=>!BLOCKED_IMAGE_HINTS.test(url));
}

function extractBingImageCandidates(html){
  const candidates=[],re=/\bm="([^"]+)"/gi;
  let match;
  while((match=re.exec(html))&&candidates.length<40){
    try{
      const raw=JSON.parse(decodeHtml(match[1]));
      const contentUrl=absoluteHttpsUrl(raw?.murl||raw?.contentUrl||'');
      const hostPageUrl=absoluteHttpsUrl(raw?.purl||raw?.hostPageUrl||'');
      if(!contentUrl||isBlockedHost(contentUrl)||BLOCKED_IMAGE_HINTS.test(contentUrl))continue;
      candidates.push({contentUrl,hostPageUrl,title:String(raw?.t||raw?.name||'').trim(),description:String(raw?.desc||'').trim(),host:hostOf(hostPageUrl||contentUrl)});
    }catch{}
  }
  return candidates;
}

function queryTokens(text){return String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').map(x=>x.trim()).filter(x=>x.length>=3&&!new Set(['the','and','restaurant','restaurants','road','rd','street','st','avenue','ave','drive','dr','highway','hwy']).has(x))}

function scoreImage(candidate,name,address,website){
  const nameTokens=queryTokens(name),addrTokens=queryTokens(address);
  const hay=(candidate.title+' '+candidate.description+' '+candidate.host+' '+candidate.hostPageUrl).toLowerCase();
  let score=0;
  const matchedName=nameTokens.filter(t=>hay.includes(t)).length;
  score+=matchedName*16;
  if(nameTokens.length&&matchedName===nameTokens.length)score+=55;
  const number=(String(address||'').match(/\b\d{1,6}\b/)||[])[0];
  if(number&&hay.includes(number))score+=30;
  const websiteHost=hostOf(website);
  if(websiteHost&&(candidate.host===websiteHost||candidate.host.endsWith('.'+websiteHost)||websiteHost.endsWith('.'+candidate.host)))score+=80;
  if(/(?:facebook|instagram|tiktok|pinterest|youtube)\./i.test(candidate.host))score-=40;
  if(addrTokens.some(t=>hay.includes(t)))score+=Math.min(24,addrTokens.filter(t=>hay.includes(t)).length*4);
  return score;
}

function normalizeMatchText(text){
  return String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function significantNameTokens(name){
  const stop=new Set(['the','a','an','restaurant','restaurants','llc','inc','co','company','and','of','at','in']);
  return normalizeMatchText(name).split(' ').filter(t=>t.length>=3&&!stop.has(t));
}
function pageMatchesRestaurant(html,name,address){
  const hay=normalizeMatchText(String(html||'').slice(0,1200000));
  const tokens=significantNameTokens(name);
  if(!tokens.length)return false;
  const hits=tokens.filter(t=>hay.includes(t)).length;
  if(hits/tokens.length<0.8)return false;
  const number=(String(address||'').match(/\b\d{1,6}\b/)||[])[0];
  if(number&&hay.includes(normalizeMatchText(number)))return true;
  const loc=normalizeMatchText(address).split(' ').filter(t=>t.length>=3).slice(-4);
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

function extractBingWebResultUrls(html){
  const out=[];
  const re=/<li[^>]+class=["'][^"']*b_algo[^"']*["'][^>]*>[\s\S]*?<h2[^>]*>\s*<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while((m=re.exec(String(html||'')))&&out.length<15){
    const url=absoluteHttpsUrl(String(m[1]||'').replace(/&amp;/g,'&'));
    if(url&&!isBlockedHost(url))out.push(url);
  }
  return [...new Set(out)];
}
function extractJsonLdImages(html,pageUrl){
  const urls=[];
  const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig;
  let m;
  while((m=re.exec(String(html||'')))&&urls.length<20){
    try{
      const data=JSON.parse(m[1]);
      const rows=Array.isArray(data)?data:[data];
      const walk=value=>{
        if(value==null||urls.length>=20)return;
        if(typeof value==='string'&&/^(?:https?:)?\/\//i.test(value)){const u=absoluteHttpsUrl(value,pageUrl);if(u&&!isBlockedHost(u)&&!BLOCKED_IMAGE_HINTS.test(u))urls.push(u);return}
        if(Array.isArray(value)){value.forEach(walk);return}
        if(typeof value==='object'){for(const key of ['image','photo','contentUrl','thumbnailUrl'])if(value[key])walk(value[key])}
      };
      rows.forEach(walk);
    }catch{}
  }
  return [...new Set(urls)];
}
function extractPageImageCandidates(html,pageUrl){
  const urls=[...extractMetaImages(html,pageUrl),...extractJsonLdImages(html,pageUrl)];
  return [...new Set(urls)].filter(url=>!BLOCKED_IMAGE_HINTS.test(url));
}
async function findVerifiedRestaurantPages(name,address,website){
  const queries=[],safeName=String(name||'').replace(/"/g,''),safeAddress=String(address||'').replace(/"/g,'');
  const websiteHost=hostOf(website);
  if(websiteHost&&!isBlockedHost(website))queries.push('site:'+websiteHost+' "'+safeName+'"');
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant photos');
  if(safeName)queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:restaurantguru.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'"');
  const unique=[...new Set(queries.filter(Boolean))].slice(0,6);
  const pages=await Promise.allSettled(unique.map(q=>fetchText('https://www.bing.com/search?'+new URLSearchParams({q:q,mkt:'en-US',first:'1'}).toString(),{},7000)));
  const candidates=[];
  pages.forEach(p=>{if(p.status!=='fulfilled')return;for(const url of extractBingWebResultUrls(p.value))if(!candidates.includes(url))candidates.push(url)});
  const verified=[];
  for(const url of candidates.slice(0,25)){
    const html=await verifiedRestaurantPage(url,name,address);
    if(html)verified.push({url,html});
    if(verified.length>=10)break;
  }
  return verified;
}
async function bingImages(name,address,website){
  const queries=[],websiteHost=hostOf(website);
  const safeName=String(name||'').replace(/"/g,'');
  const safeAddress=String(address||'').replace(/"/g,'');
  if(websiteHost&&!isBlockedHost(website))queries.push('site:'+websiteHost+' "'+safeName+'"');
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant exterior photos');
  if(safeName&&safeAddress)queries.push('"'+safeName+'" "'+safeAddress+'" restaurant photos');
  if(safeName)queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:restaurantguru.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'"');
  if(safeName)queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'"');
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

async function tryWebsiteImage(website){
  const page=absoluteHttpsUrl(website);
  if(!page||isBlockedHost(page))return null;
  try{
    const html=await fetchText(page,{},6500,1800000);
    for(const imageUrl of extractMetaImages(html,page)){
      try{return {media:await fetchImage(imageUrl,{'Referer':page},6500),source:'restaurant-website',sourceUrl:page,sourceName:hostOf(page)}}catch{}
    }
  }catch{}
  return null;
}

async function tryWikimedia(name,address){
  if(!name)return null;
  const q=[name,address].filter(Boolean).join(' ').trim();
  try{
    const endpoint='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',generator:'search',gsrsearch:'"'+q+'" restaurant',gsrnamespace:'6',gsrlimit:'10',prop:'imageinfo',iiprop:'url',iiurlwidth:'1400',format:'json',origin:'*'}).toString();
    const r=await fetch(endpoint,{headers:{Accept:'application/json','User-Agent':'Dinliminate/1.0 restaurant photo lookup'}});
    if(!r.ok)return null;
    const data=await r.json();
    const pages=Object.values(data?.query?.pages||{});
    for(const page of pages){
      const imageUrl=absoluteHttpsUrl(page?.imageinfo?.[0]?.thumburl||page?.imageinfo?.[0]?.url||'');
      if(!imageUrl||BLOCKED_IMAGE_HINTS.test(imageUrl))continue;
      try{
        const media=await fetchImage(imageUrl,{},6500);
        const title=String(page?.title||'').replace(/^File:/,'');
        return {media,source:'wikimedia',sourceUrl:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(title),sourceName:'Wikimedia Commons'};
      }catch{}
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
  if(found.sourceName&&found.sourceUrl){res.setHeader?.('X-Restaurant-Photo-Attributions',Buffer.from(JSON.stringify([{displayName:found.sourceName,uri:found.sourceUrl}])).toString('base64url'));}
  res.statusCode=200;res.end?.(found.media.bytes);return res;
}

module.exports=async function handler(req,res){
  const q=req?.query&&typeof req.query==='object'?req.query:(req?.queryStringParameters||{});
  const name=String(q.name||'').trim().slice(0,160),address=String(q.address||'').trim().slice(0,240),website=String(q.website||'').trim().slice(0,700);
  if(!name)return json(res,400,{ok:false,error:'Restaurant name is required'});
  try{
    // First: find and verify the exact restaurant page, then use that page's own photo.
    const verifiedPages=await findVerifiedRestaurantPages(name,address,website);
    for(const entry of verifiedPages){
      for(const imageUrl of extractPageImageCandidates(entry.html,entry.url).slice(0,12)){
        try{
          const media=await fetchImage(imageUrl,{'Referer':entry.url},6500);
          return sendMedia(res,{media,source:'verified-restaurant-page',sourceUrl:entry.url,sourceName:hostOf(entry.url)});
        }catch{}
      }
    }
    const bing=await bingImages(name,address,website);
    for(const candidate of bing.slice(0,30)){
      if(candidate.score<110||!candidate.hostPageUrl)continue;
      const html=await verifiedRestaurantPage(candidate.hostPageUrl,name,address);
      if(!html)continue;
      try{
        const media=await fetchImage(candidate.contentUrl,{'Referer':candidate.hostPageUrl},6500);
        return sendMedia(res,{media,source:'restaurant-page',sourceUrl:candidate.hostPageUrl,sourceName:hostOf(candidate.hostPageUrl)});
      }catch{}
      for(const imageUrl of extractMetaImages(html,candidate.hostPageUrl).slice(0,10)){
        try{
          const media=await fetchImage(imageUrl,{'Referer':candidate.hostPageUrl},6500);
          return sendMedia(res,{media,source:'restaurant-page',sourceUrl:candidate.hostPageUrl,sourceName:hostOf(candidate.hostPageUrl)});
        }catch{}
      }
    }
    if(website){
      const websiteHtml=await verifiedRestaurantPage(website,name,address);
      if(websiteHtml){
        for(const imageUrl of extractMetaImages(websiteHtml,website).slice(0,10)){
          try{
            const media=await fetchImage(imageUrl,{'Referer':website},6500);
            return sendMedia(res,{media,source:'restaurant-website',sourceUrl:website,sourceName:hostOf(website)});
          }catch{}
        }
      }
    }
    const wiki=await tryWikimedia(name,address);if(wiki)return sendMedia(res,wiki);
    return json(res,404,{ok:false,error:'No real restaurant photo was found from non-Google sources'});
  }catch(e){console.error('dinliminate-restaurant-photo',e);return json(res,502,{ok:false,error:'Could not load the restaurant photo'});}
};

module.exports._test={absoluteHttpsUrl,extractMetaImages,extractBingImageCandidates,scoreImage,extractBingWebResultUrls,extractJsonLdImages,pageMatchesRestaurant};