'use strict';

const GOOGLE_KEY=String(process.env.GOOGLE_PLACES_API_KEY||process.env.GOOGLE_MAPS_API_KEY||'').trim();

function json(res,status,payload){
  res.statusCode=status;
  res.setHeader?.('Content-Type','application/json; charset=utf-8');
  res.end?.(JSON.stringify(payload));
  return res;
}

function decodeGoogleAttributions(value){
  try{return JSON.parse(Buffer.from(String(value||''),'base64url').toString('utf8'));}catch{return[]}
}

function normalizeAttributions(rows){
  return (Array.isArray(rows)?rows:[]).map(x=>{
    const displayName=String(x?.displayName||'').trim();
    const rawUri=String(x?.uri||'').trim();
    const uri=rawUri.startsWith('//')?'https:'+rawUri:rawUri;
    return displayName&&/^https?:\/\//i.test(uri)?{displayName,uri}:null;
  }).filter(Boolean).slice(0,5);
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

async function fetchJson(url,headers={},timeout=5500,method='GET',body=null){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const request={method,headers:{...headers,Accept:'application/json'},signal:ctl.signal};
    if(body!=null)request.body=body;
    const r=await fetch(url,request);
    if(!r.ok)throw new Error('Request failed ('+r.status+').');
    return await r.json();
  }finally{clearTimeout(timer)}
}

async function fetchText(url,headers={},timeout=6000,maxBytes=1500000){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{...headers,Accept:'text/html,application/xhtml+xml'},signal:ctl.signal});
    if(!r.ok)throw new Error('Page request failed ('+r.status+').');
    const data=Buffer.from(await r.arrayBuffer());
    if(data.length>maxBytes)throw new Error('Page too large.');
    return data.toString('utf8');
  }finally{clearTimeout(timer)}
}

async function fetchImage(url,headers={},timeout=6500){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{...headers,Accept:'image/avif,image/webp,image/apng,image/jpeg,image/png,image/gif,image/*;q=0.8'},signal:ctl.signal});
    if(!r.ok)throw new Error('Image request failed ('+r.status+').');
    const type=(r.headers.get('content-type')||'image/jpeg').split(';')[0].toLowerCase();
    if(!type.startsWith('image/'))throw new Error('Image response was not an image.');
    const bytes=Buffer.from(await r.arrayBuffer());
    if(bytes.length>8*1024*1024)throw new Error('Image is too large.');
    return {type,bytes};
  }finally{clearTimeout(timer)}
}

function extractMetaImage(html,pageUrl){
  const srcs=[];
  const patterns=[
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/ig,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/ig
  ];
  for(const re of patterns){
    let m;
    while((m=re.exec(html))&&srcs.length<8)srcs.push(m[1]);
  }
  for(const raw of srcs){
    const url=absoluteHttpsUrl(String(raw||'').replace(/&amp;/g,'&'),pageUrl);
    if(url)return url;
  }
  return '';
}

async function websiteOgImage(website){
  const page=absoluteHttpsUrl(website);
  if(!page)return null;
  try{
    const html=await fetchText(page,{'User-Agent':'Dinliminate/1.0 restaurant photo lookup'});
    const imageUrl=extractMetaImage(html,page);
    if(!imageUrl)return null;
    return await fetchImage(imageUrl,{},6500);
  }catch{return null}
}

async function wikimediaImage(name,address){
  const q=[name,address].filter(Boolean).join(' ').trim();
  if(!q)return null;
  try{
    const endpoint='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({
      action:'query',
      generator:'search',
      gsrsearch:q+' restaurant',
      gsrnamespace:'6',
      gsrlimit:'6',
      prop:'imageinfo',
      iiprop:'url',
      iiurlwidth:'1200',
      format:'json',
      origin:'*'
    }).toString();
    const data=await fetchJson(endpoint,{},6500);
    const pages=Object.values(data?.query?.pages||{});
    const imageUrl=pages.map(p=>String(p?.imageinfo?.[0]?.thumburl||p?.imageinfo?.[0]?.url||'')).map(x=>absoluteHttpsUrl(x)).find(Boolean);
    if(!imageUrl)return null;
    return await fetchImage(imageUrl,{},6500);
  }catch{return null}
}

module.exports=async function handler(req,res){
  const photoName=String(req?.query?.photoName||req?.queryStringParameters?.photoName||'').trim();
  const placeId=String(req?.query?.placeId||req?.queryStringParameters?.placeId||'').trim();
  const name=String(req?.query?.name||req?.queryStringParameters?.name||'').trim().slice(0,140);
  const address=String(req?.query?.address||req?.queryStringParameters?.address||'').trim().slice(0,220);
  const website=String(req?.query?.website||req?.queryStringParameters?.website||'').trim().slice(0,500);
  const lat=Number(req?.query?.lat||req?.queryStringParameters?.lat);
  const lon=Number(req?.query?.lon||req?.queryStringParameters?.lon);
  const validPhotoName=/^places\/[^/]+\/photos\/[^/]+$/.test(photoName);
  const validPlaceId=/^[A-Za-z0-9_-]{10,300}$/.test(placeId);
  const validCoords=Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
  if(!validPhotoName && !validPlaceId && !name)return json(res,400,{ok:false,error:'Restaurant name, photo reference, or Place ID is required'});

  // Google remains optional. With no key, try no-key sources instead.
  if(!GOOGLE_KEY){
    const websiteMedia=await websiteOgImage(website);
    if(websiteMedia){
      res.setHeader?.('Content-Type',websiteMedia.type);
      res.setHeader?.('Cache-Control','no-store');
      res.setHeader?.('X-Content-Type-Options','nosniff');
      res.setHeader?.('X-Restaurant-Photo-Source','website');
      res.statusCode=200;
      res.end?.(websiteMedia.bytes);
      return res;
    }
    const wikiMedia=await wikimediaImage(name,address);
    if(wikiMedia){
      res.setHeader?.('Content-Type',wikiMedia.type);
      res.setHeader?.('Cache-Control','no-store');
      res.setHeader?.('X-Content-Type-Options','nosniff');
      res.setHeader?.('X-Restaurant-Photo-Source','wikimedia');
      res.statusCode=200;
      res.end?.(wikiMedia.bytes);
      return res;
    }
    return json(res,404,{ok:false,error:'No no-key restaurant photo is available'});
  }

  try{
    let photo=null,matchedPlaceId=placeId;
    if(validPhotoName){
      photo={name:photoName};
      matchedPlaceId=String(photoName.split('/')[1]||'').trim();
    }else if(validPlaceId){
      const details=await fetchJson('https://places.googleapis.com/v1/places/'+encodeURIComponent(placeId),{'X-Goog-Api-Key':GOOGLE_KEY,'X-Goog-FieldMask':'photos'},5500);
      const photos=Array.isArray(details?.photos)?details.photos:[];
      photo=photos.find(x=>x?.name)||null;
    }else{
      const textQuery=[name,address].filter(Boolean).join(', ')+' restaurant';
      const headers={
        'Content-Type':'application/json',
        'X-Goog-Api-Key':GOOGLE_KEY,
        'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.photos'
      };
      const body={textQuery,pageSize:5,regionCode:'US'};
      if(validCoords)body.locationBias={circle:{center:{latitude:lat,longitude:lon},radius:5000}};
      const data=await fetchJson('https://places.googleapis.com/v1/places:searchText',headers,5500,'POST',JSON.stringify(body));
      const target=name.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      const candidates=(Array.isArray(data?.places)?data.places:[]).map(place=>{
        const placeName=String(place?.displayName?.text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
        const loc=place?.location||{};
        const plat=Number(loc.latitude),plon=Number(loc.longitude);
        const exact=placeName===target;
        const contains=placeName.includes(target)||target.includes(placeName);
        const distance=validCoords&&Number.isFinite(plat)&&Number.isFinite(plon)?Math.sqrt(Math.pow((plat-lat)*69,2)+Math.pow((plon-lon)*54.6,2)):Infinity;
        const score=(exact?100:contains?45:0)+(validCoords&&distance<0.5?35:validCoords&&distance<1.5?20:0)+((Array.isArray(place?.photos)&&place.photos.length)?12:0);
        return {...place,score,distance};
      }).filter(place=>place.score>=57 || (!validCoords && place.score>=45)).sort((a,b)=>b.score-a.score);
      const best=candidates[0];
      if(best){
        matchedPlaceId=String(best.id||'').trim();
        photo=Array.isArray(best.photos)?best.photos.find(x=>x?.name)||null:null;
      }
    }
    if(!photo)return json(res,404,{ok:false,error:'No restaurant photo is available'});
    if(!/^places\/[^/]+\/photos\/[^/]+$/.test(String(photo.name||'')))return json(res,502,{ok:false,error:'Google returned an invalid photo reference'});
    const mediaUrl='https://places.googleapis.com/v1/'+photo.name+'/media?maxWidthPx=1200';
    const media=await fetchImage(mediaUrl,{'X-Goog-Api-Key':GOOGLE_KEY},6500);
    const attributions=normalizeAttributions(photo.authorAttributions);
    res.setHeader?.('Content-Type',media.type);
    res.setHeader?.('Cache-Control','no-store');
    res.setHeader?.('X-Content-Type-Options','nosniff');
    res.setHeader?.('X-Restaurant-Photo-Source','google-places');
    if(matchedPlaceId)res.setHeader?.('X-Restaurant-Photo-Place-ID',matchedPlaceId);
    res.setHeader?.('X-Restaurant-Photo-Attributions',Buffer.from(JSON.stringify(attributions)).toString('base64url'));
    res.statusCode=200;
    res.end?.(media.bytes);
    return res;
  }catch(e){
    console.error('dinliminate-google-photo',e);
    return json(res,502,{ok:false,error:'Could not load the restaurant photo'});
  }
};

module.exports._test={normalizeAttributions,decodeGoogleAttributions,absoluteHttpsUrl,extractMetaImage};
