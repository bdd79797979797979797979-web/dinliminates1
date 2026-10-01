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

async function fetchJson(url,headers={},timeout=5500,method='GET',body=null){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const request={method,headers:{...headers,Accept:'application/json'},signal:ctl.signal};
    if(body!=null)request.body=body;
    const r=await fetch(url,request);
    if(!r.ok)throw new Error('Google Places request failed ('+r.status+').');
    return await r.json();
  }finally{clearTimeout(timer)}
}

async function fetchImage(url,headers,timeout=6500){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
  try{
    const r=await fetch(url,{headers:{...headers,Accept:'image/avif,image/webp,image/apng,image/jpeg,image/png,image/gif,image/*;q=0.8'},signal:ctl.signal});
    if(!r.ok)throw new Error('Google photo request failed ('+r.status+').');
    const type=(r.headers.get('content-type')||'image/jpeg').split(';')[0].toLowerCase();
    if(!type.startsWith('image/'))throw new Error('Google photo response was not an image.');
    const bytes=Buffer.from(await r.arrayBuffer());
    if(bytes.length>8*1024*1024)throw new Error('Google photo is too large.');
    return {type,bytes};
  }finally{clearTimeout(timer)}
}

module.exports=async function handler(req,res){
  const placeId=String(req?.query?.placeId||req?.queryStringParameters?.placeId||'').trim();
  const name=String(req?.query?.name||req?.queryStringParameters?.name||'').trim().slice(0,140);
  const address=String(req?.query?.address||req?.queryStringParameters?.address||'').trim().slice(0,220);
  const lat=Number(req?.query?.lat||req?.queryStringParameters?.lat);
  const lon=Number(req?.query?.lon||req?.queryStringParameters?.lon);
  const validPlaceId=/^[A-Za-z0-9_-]{10,300}$/.test(placeId);
  const validCoords=Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
  if(!validPlaceId && !name)return json(res,400,{ok:false,error:'Place ID or restaurant name is required'});
  if(!GOOGLE_KEY)return json(res,503,{ok:false,error:'Google Places photos are not configured'});
  try{
    let photo=null,matchedPlaceId=placeId;
    if(validPlaceId){
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
    const mediaUrl='https://places.googleapis.com/v1/'+photo.name+'/media?maxWidthPx=1200&key='+encodeURIComponent(GOOGLE_KEY);
    const media=await fetchImage(mediaUrl,{},6500);
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

module.exports._test={normalizeAttributions,decodeGoogleAttributions};