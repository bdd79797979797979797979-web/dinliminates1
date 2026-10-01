'use strict';

const NO_PHOTO_HOSTS=new Set([
  'google.com','www.google.com','googleusercontent.com','lh3.googleusercontent.com',
  'bing.com','www.bing.com','tse1.mm.bing.net','tse2.mm.bing.net','tse3.mm.bing.net','tse4.mm.bing.net',
  'unsplash.com','images.unsplash.com','pexels.com','images.pexels.com',
  'shutterstock.com','istockphoto.com','gettyimages.com','depositphotos.com','alamy.com','stock.adobe.com'
]);

const BLOCKED_IMAGE_HINTS=/\b(?:logo|favicon|sprite|icon|avatar|placeholder|default[-_ ]?image|brandmark|wordmark|advert|banner)\b/i;
const VENUE_IMAGE_HINTS=/\b(?:exterior|outside|outdoor|front|entrance|entry|building|storefront|facade|façade|sign|signage|location|drive[- ]?thru|drive through|parking lot|parking|street view|patio|terrace|inside|interior|dining room|bar|counter)\b/i;
const FOOD_IMAGE_HINTS=/\b(?:menu|food|dish|meal|burger|pizza|salad|steak|wings|tacos?|sushi|pasta|chicken|fries|dessert|cake|sandwich|plate|entrée|entree|appetizer|breakfast|lunch|dinner|drink|cocktail|coffee|beer|wine|recipe)\b/i;

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
    },signal:ctl.signal,redirect:'follow'});
    if(!r.ok)throw new Error('Page request failed ('+r.status+').');
    const data=Buffer.from(await r.arrayBuffer());
    if(data.length>maxBytes)throw new Error('Page too large.');
    return data.toString('utf8');
  }finally{clearTimeout(timer)}
}

function imageDimensions(bytes,type){
  try{
    if(type==='image/png'&&bytes.length>=24&&bytes.readUInt32BE(0)===0x89504e47)return{width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
    if(type==='image/gif'&&bytes.length>=10)return{width:bytes.readUInt16LE(6),height:bytes.readUInt16LE(8)};
    if(type==='image/webp'&&bytes.length>=30){
      if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'){
        const kind=bytes.toString('ascii',12,16);
        if(kind==='VP8X')return{width:1+bytes.readUIntLE(24,3),height:1+bytes.readUIntLE(27,3)};
      }
    }
    if(type==='image/jpeg'){
      let p=2;
      while(p+9<bytes.length){
        if(bytes[p]!==0xff){p++;continue}
        const marker=bytes[p+1];p+=2;
        if(marker===0xd8||marker===0xd9||marker===0x01)continue;
        if(p+2>bytes.length)break;
        const len=bytes.readUInt16BE(p);
        if(len<2||p+len>bytes.length)break;
        if((marker>=0xc0&&marker<=0xc3)||(marker>=0xc5&&marker<=0xc7)||(marker>=0xc9&&marker<=0xcb)||(marker>=0xcd&&marker<=0xcf)){
          return{height:bytes.readUInt16BE(p+3),width:bytes.readUInt16BE(p+5)};
        }
        p+=len;
      }
    }
  }catch{}
  return null;
}

async function fetchImage(url,headers={},timeout=6500){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{
      'Accept':'image/avif,image/webp,image/apng,image/jpeg,image/png,image/gif,image/*;q=0.8',
      'User-Agent':'Mozilla/5.0 (compatible; Dinliminate/1.0; restaurant-photo)',
      ...headers
    },redirect:'follow',signal:ctl.signal});
    if(!r.ok)throw new Error('Image request failed ('+r.status+').');
    const type=(r.headers.get('content-type')||'').split(';')[0].toLowerCase();
    if(!type.startsWith('image/'))throw new Error('Image response was not an image.');
    const bytes=Buffer.from(await r.arrayBuffer());
    if(bytes.length<4000||bytes.length>10*1024*1024)throw new Error('Image size is outside the accepted range.');
    const dimensions=imageDimensions(bytes,type);
    if(dimensions&&((dimensions.width||0)<260||(dimensions.height||0)<180))throw new Error('Image dimensions are too small.');
    return {type,bytes,dimensions};
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
  for(const part of String(raw||'').split(',')){
    const value=String(part||'').trim().split(/\s+/)[0];
    const url=absoluteHttpsUrl(value,base);
    if(url&&!isBlockedHost(url)&&!BLOCKED_IMAGE_HINTS.test(url))return url;
  }
  return '';
}

function extractImgCandidates(html,pageUrl){
  const out=[],seen=new Set(),re=/<img\b[^>]*>/ig;let m;
  while((m=re.exec(String(html||'')))&&out.length<140){
    const attrs=htmlAttrs(m[0]);
    const url=[
      attrs.src,attrs['data-src'],attrs['data-lazy-src'],attrs['data-original'],
      attrs['data-image-url'],attrs['data-photo-url'],firstSrcsetUrl(attrs.srcset,pageUrl),
      firstSrcsetUrl(attrs['data-srcset'],pageUrl)
    ].map(v=>absoluteHttpsUrl(v,pageUrl)).find(v=>v&&!isBlockedHost(v)&&!BLOCKED_IMAGE_HINTS.test(v));
    if(!url||seen.has(url))continue;
    seen.add(url);
    const htmlText=String(html||'');
    const nearby=htmlText.slice(Math.max(0,m.index-700),Math.min(htmlText.length,m.index+m[0].length+950));
    const evidence=[attrs.alt,attrs.title,attrs['data-caption'],attrs['data-alt'],attrs['data-filename']].filter(Boolean).join(' ');
    out.push({url,evidence,context:[evidence,attrs.class,attrs.id,nearby,url].filter(Boolean).join(' '),source:'img'});
  }
  return out;
}

function extractSourceCandidates(html,pageUrl){
  const out=[],seen=new Set(),re=/<source\b[^>]*>/ig;let m;
  while((m=re.exec(String(html||'')))&&out.length<80){
    const attrs=htmlAttrs(m[0]);
    const url=[firstSrcsetUrl(attrs.srcset,pageUrl),absoluteHttpsUrl(attrs.src,pageUrl)]
      .find(v=>v&&!isBlockedHost(v)&&!BLOCKED_IMAGE_HINTS.test(v));
    if(!url||seen.has(url))continue;
    seen.add(url);
    out.push({url,evidence:[attrs.media,attrs.type].filter(Boolean).join(' '),context:m[0]+' '+url,source:'source'});
  }
  return out;
}

function extractMetaImages(html,pageUrl){
  const urls=[],patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/ig,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/ig
  ];
  for(const re of patterns){let m;while((m=re.exec(String(html||'')))&&urls.length<14)urls.push(m[1]);}
  return urls.map(raw=>absoluteHttpsUrl(String(raw||''),pageUrl)).filter(Boolean).filter(url=>!isBlockedHost(url)&&!BLOCKED_IMAGE_HINTS.test(url));
}

function extractJsonLdImageCandidates(html,pageUrl){
  const out=[],seen=new Set(),re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig;let m;
  const push=(raw,context)=>{
    const url=absoluteHttpsUrl(raw,pageUrl);
    if(!url||seen.has(url)||isBlockedHost(url)||BLOCKED_IMAGE_HINTS.test(url))return;
    seen.add(url);out.push({url,evidence:String(context||''),context:String(context||'')+' '+url,source:'jsonld'});
  };
  const walk=(value,context='')=>{
    if(value==null||out.length>=100)return;
    if(typeof value==='string'){if(/^(?:https?:)?\/\//i.test(value)||/^\//.test(value))push(value,context);return}
    if(Array.isArray(value)){for(const item of value)walk(item,context);return}
    if(typeof value==='object'){
      const local=[value.name,value.caption,value.description,value.alt,value.title].filter(v=>typeof v==='string').join(' ');
      for(const key of ['image','photo','photos','contentUrl','thumbnailUrl','associatedMedia'])if(value[key])walk(value[key],context+' '+local);
      for(const key of ['itemListElement','subjectOf','about'])if(value[key])walk(value[key],context+' '+local);
    }
  };
  while((m=re.exec(String(html||'')))&&out.length<100){try{walk(JSON.parse(m[1]),'jsonld')}catch{}}
  return out;
}

function extractStyleImageCandidates(html,pageUrl){
  const out=[],seen=new Set(),re=/background-image\s*:\s*url\(\s*['"]?([^'")\s]+)['"]?\s*\)/ig;let m;
  while((m=re.exec(String(html||'')))&&out.length<70){
    const url=absoluteHttpsUrl(m[1],pageUrl);
    if(!url||seen.has(url)||isBlockedHost(url)||BLOCKED_IMAGE_HINTS.test(url))continue;
    seen.add(url);
    const context=String(html||'').slice(Math.max(0,m.index-450),Math.min(String(html||'').length,m.index+600));
    out.push({url,evidence:context,context,source:'background'});
  }
  return out;
}

function significantNameTokens(name){
  const stop=new Set(['the','a','an','restaurant','restaurants','llc','inc','co','company','and','of','at','in']);
  return normalizeText(name).split(' ').filter(t=>t.length>=3&&!stop.has(t));
}

function normalizeText(value){
  return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

function addressParts(address){
  const raw=String(address||'');
  const number=(raw.match(/^\s*(\d{1,6}[a-z]?)/i)||[])[1]||((raw.match(/\b\d{1,6}\b/)||[])[0]||'');
  const pieces=raw.split(',').map(x=>normalizeText(x)).filter(Boolean);
  const street=pieces[0]||'';
  const city=pieces[1]||'';
  const state=pieces.find(x=>/\b(?:tn|tennessee|ky|kentucky|ga|georgia|al|alabama|il|illinois)\b/.test(x))||pieces[2]||'';
  const zip=(raw.match(/\b\d{5}(?:-\d{4})?\b/)||[])[0]||'';
  return{number:normalizeText(number),street,city,state,zip:normalizeText(zip)};
}

function pageMatchesRestaurant(html,name,address){
  const body=normalizeText(String(html||'').slice(0,1800000));
  const nameTokens=significantNameTokens(name);
  if(!nameTokens.length)return false;
  const matched=nameTokens.filter(t=>body.includes(t)).length;
  if(matched<Math.max(1,Math.ceil(nameTokens.length*0.8)))return false;

  const a=addressParts(address);
  if(!a.number)return matched===nameTokens.length&&!!a.city&&body.includes(a.city);
  if(!body.includes(a.number))return false;

  const streetTokens=a.street.split(' ').filter(t=>t.length>=3&&t!==a.number);
  const streetHits=streetTokens.filter(t=>body.includes(t)).length;
  const cityOk=!a.city||body.includes(a.city);
  const zipOk=!a.zip||body.includes(a.zip);
  return (streetHits>=Math.min(2,streetTokens.length)||zipOk) && cityOk;
}

function imageEvidenceScore(candidate,name,address,pageUrl,isOfficial){
  const context=String(candidate?.context||'');
  const evidence=String(candidate?.evidence||'');
  const url=String(candidate?.url||'');
  const proof=normalizeText(evidence+' '+url);
  const venueContext=normalizeText(context+' '+evidence+' '+url);
  const nameTokens=significantNameTokens(name);
  const nameHits=nameTokens.filter(t=>proof.includes(t)).length;
  const a=addressParts(address);
  let score=0;
  if(nameTokens.length&&nameHits===nameTokens.length)score+=70;
  else score+=Math.min(45,nameHits*16);
  if(a.number&&proof.includes(a.number))score+=30;
  if(a.city&&proof.includes(a.city))score+=20;
  if(a.zip&&proof.includes(a.zip))score+=30;
  if(VENUE_IMAGE_HINTS.test(evidence+' '+url))score+=65;
  // Food/menu wording in the surrounding page is not evidence that this image is food.
  if(FOOD_IMAGE_HINTS.test(evidence+' '+url))score-=105;
  if(BLOCKED_IMAGE_HINTS.test(evidence+' '+url))score-=200;
  if(VENUE_IMAGE_HINTS.test(context))score+=12;
  if(candidate.source==='img')score+=15;
  if(candidate.source==='source')score+=8;
  if(candidate.source==='jsonld')score+=5;
  if(candidate.source==='meta')score+=2;
  if(isOfficial)score+=30;
  if(hostOf(candidate.url)===hostOf(pageUrl))score+=8;
  return score;
}

function collectPageImages(html,pageUrl,name,address,isOfficial){
  const list=[
    ...extractImgCandidates(html,pageUrl),
    ...extractSourceCandidates(html,pageUrl),
    ...extractStyleImageCandidates(html,pageUrl),
    ...extractJsonLdImageCandidates(html,pageUrl),
    ...extractMetaImages(html,pageUrl).map(url=>({url,evidence:url,context:url+' '+name,source:'meta'}))
  ];
  const seen=new Set();
  return list.map(x=>({...x,score:imageEvidenceScore(x,name,address,pageUrl,isOfficial)}))
    .filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return x.score>=55})
    .sort((a,b)=>b.score-a.score);
}

function extractBingWebResultUrls(html){
  const out=[],source=String(html||'');
  const patterns=[
    /<li[^>]+class=["'][^"']*b_algo[^"']*["'][^>]*>[\s\S]*?<h2[^>]*>\s*<a[^>]+href=["']([^"']+)["']/gi,
    /<h2[^>]*>\s*<a[^>]+href=["'](https?:\/\/[^"']+)["']/gi,
    /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>[^<]{2,160}<\/a>/gi
  ];
  for(const re of patterns){
    let m;
    while((m=re.exec(source))&&out.length<30){
      const raw=decodeHtml(String(m[1]||'')).replace(/&amp;/g,'&');
      const url=absoluteHttpsUrl(raw);
      if(!url||isBlockedHost(url)||url.includes('bing.com/ck/'))continue;
      if(!out.includes(url))out.push(url);
    }
    if(out.length>=30)break;
  }
  return out;
}

function extractDuckDuckGoResultUrls(html){
  const out=[],source=String(html||'');
  const re=/<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["']/gi;
  let m;
  while((m=re.exec(source))&&out.length<30){
    let raw=decodeHtml(String(m[1]||'')).replace(/&amp;/g,'&');
    try{
      const u=new URL(raw,'https://html.duckduckgo.com');
      const redirected=u.searchParams.get('uddg');
      raw=redirected||raw;
    }catch{}
    const url=absoluteHttpsUrl(raw);
    if(url&&!isBlockedHost(url)&&!out.includes(url))out.push(url);
  }
  return out;
}

async function findExactPages(name,address,website){
  const safeName=String(name||'').replace(/"/g,'');
  const safeAddress=String(address||'').replace(/"/g,'');
  const queries=[];
  const direct=[];
  const websiteUrl=absoluteHttpsUrl(website);
  if(websiteUrl){
    const html=await verifiedPage(websiteUrl,name,address);
    if(html)direct.push({url:websiteUrl,html,isOfficial:true});
    const host=hostOf(websiteUrl);
    if(host)queries.push('site:'+host+' "'+safeName+'" "'+safeAddress+'"');
  }
  if(safeName&&safeAddress){
    queries.push('"'+safeName+'" "'+safeAddress+'" restaurant');
    queries.push('site:tripadvisor.com "'+safeName+'" "'+safeAddress+'"');
    queries.push('site:tripadvisor.co.uk "'+safeName+'" "'+safeAddress+'"');
    queries.push('site:usarestaurants.info "'+safeName+'" "'+safeAddress+'"');
    queries.push('site:restaurantji.com "'+safeName+'" "'+safeAddress+'"');
    queries.push('site:yelp.com "'+safeName+'" "'+safeAddress+'"');
  }
  const unique=[...new Set(queries)].filter(Boolean).slice(0,7);
  const searches=await Promise.allSettled(unique.flatMap(query=>[
    fetchText('https://www.bing.com/search?'+new URLSearchParams({q:query,mkt:'en-US',first:'1'}).toString(),{},4800,1000000),
    fetchText('https://html.duckduckgo.com/html/?'+new URLSearchParams({q:query,t:'dinliminate'}).toString(),{},4800,1000000)
  ]));
  const urls=[];
  for(let i=0;i<searches.length;i++){
    const result=searches[i];
    if(result.status!=='fulfilled')continue;
    const found=[...extractBingWebResultUrls(result.value),...extractDuckDuckGoResultUrls(result.value)];
    for(const url of found){
      if(!urls.includes(url))urls.push(url);
      if(urls.length>=24)break;
    }
    if(urls.length>=24)break;
  }
  const pages=await Promise.allSettled(urls.slice(0,18).map(async url=>{
    const html=await verifiedPage(url,name,address);
    return html?{url,html,isOfficial:false}:null;
  }));
  const found=pages.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);
  const out=[];
  for(const item of [...direct,...found]){
    const host=hostOf(item.url);
    const duplicate=out.some(x=>x.url===item.url);
    if(duplicate)continue;
    out.push({...item,isOfficial:item.isOfficial||host===hostOf(websiteUrl)});
    if(out.length>=8)break;
  }
  return out;
}

async function verifiedPage(url,name,address){
  const page=absoluteHttpsUrl(url);
  if(!page||isBlockedHost(page))return null;
  try{
    const html=await fetchText(page,{},6200,1800000);
    return pageMatchesRestaurant(html,name,address)?html:null;
  }catch{return null}
}

function parseQuery(req){
  return req?.query&&typeof req.query==='object'?req.query:(req?.queryStringParameters&&typeof req.queryStringParameters==='object'?req.queryStringParameters:{});
}

async function tryImageCandidates(res,page,name,address){
  const candidates=collectPageImages(page.html,page.url,name,address,page.isOfficial);
  for(const candidate of candidates.slice(0,18)){
    try{
      const media=await fetchImage(candidate.url,{'Referer':page.url},5500);
      const score=imageEvidenceScore({...candidate,context:candidate.context+' '+(media.dimensions?media.dimensions.width+'x'+media.dimensions.height:'')},name,address,page.url,page.isOfficial);
      if(score<55)continue;
      return {media,source:page.isOfficial?'official-restaurant-site':'exact-venue-page',sourceUrl:page.url,sourceName:hostOf(page.url),score};
    }catch{}
  }
  return null;
}

function sendMedia(res,found){
  res.setHeader?.('Content-Type',found.media.type);
  res.setHeader?.('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader?.('X-Content-Type-Options','nosniff');
  res.setHeader?.('X-Restaurant-Photo-Source',found.source);
  if(found.sourceUrl)res.setHeader?.('X-Restaurant-Photo-Source-URL',found.sourceUrl);
  res.statusCode=200;
  res.end?.(found.media.bytes);
  return res;
}

module.exports=async function handler(req,res){
  const q=parseQuery(req);
  const name=String(q.name||'').trim().slice(0,160);
  const address=String(q.address||'').trim().slice(0,240);
  const website=String(q.website||'').trim().slice(0,700);
  const osmPhoto=absoluteHttpsUrl(q.osmPhoto||'');
  if(!name)return json(res,400,{ok:false,error:'Restaurant name is required'});

  try{
    if(osmPhoto&&!isBlockedHost(osmPhoto)&&!BLOCKED_IMAGE_HINTS.test(osmPhoto)&&!FOOD_IMAGE_HINTS.test(osmPhoto)){
      try{
        const media=await fetchImage(osmPhoto,{},5500);
        return sendMedia(res,{media,source:'openstreetmap-poi-image',sourceUrl:'https://www.openstreetmap.org/',sourceName:'OpenStreetMap'});
      }catch{}
    }

    const pages=await findExactPages(name,address,website);
    for(const page of pages){
      const found=await tryImageCandidates(res,page,name,address);
      if(found)return sendMedia(res,found);
    }

    return json(res,404,{ok:false,error:'No verified venue photo was found'});
  }catch(e){
    console.error('dinliminate-restaurant-photo',e);
    return json(res,502,{ok:false,error:'Could not load the restaurant photo'});
  }
};

module.exports._test={
  absoluteHttpsUrl,extractImgCandidates,extractSourceCandidates,extractMetaImages,extractJsonLdImageCandidates,
  extractStyleImageCandidates,pageMatchesRestaurant,addressParts,collectPageImages,imageEvidenceScore,extractBingWebResultUrls,
  isBlockedHost,extractDuckDuckGoResultUrls,findExactPages,collectPageImages
};
