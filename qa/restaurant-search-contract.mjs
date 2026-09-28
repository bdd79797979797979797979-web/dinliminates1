import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const fixed = [
  {id:1,name:'Burger King',lat:36.1733,lon:-86.7716,amenity:'fast_food',brand:'Burger King'},
  {id:2,name:'Local Grill',lat:36.2100,lon:-86.7716,amenity:'restaurant',cuisine:'burger'},
  {id:3,name:'Main Street Diner',lat:36.3100,lon:-86.7716,amenity:'restaurant','menu:items':'Burgers;Fries'},
  {id:4,name:'Pasta House',lat:36.4550,lon:-86.7716,amenity:'restaurant',cuisine:'italian','menu:items':'Pasta'},
  {id:5,name:'Thirty Mile Kitchen',lat:36.6020,lon:-86.7716,amenity:'restaurant',cuisine:'american'},
  {id:6,name:'Forty Five Grill',lat:36.8150,lon:-86.7716,amenity:'restaurant',cuisine:'american'},
  {id:7,name:'Sixty Mile Cafe',lat:37.0400,lon:-86.7716,amenity:'restaurant',cuisine:'american'},
  {id:8,name:'Eighty Mile House',lat:37.3260,lon:-86.7716,amenity:'restaurant',cuisine:'american'},
  {id:9,name:'Ninety Five Bistro',lat:37.5420,lon:-86.7716,amenity:'restaurant',cuisine:'american'}
];

function jsonResponse(data,status=200){
  return {ok:status>=200&&status<300,status, text:async()=>JSON.stringify(data)};
}

global.fetch = async (url, opts={}) => {
  const u=String(url);
  if(u.includes('photon.komoot.io')){
    return jsonResponse({
      features:[{
        type:'Feature',
        properties:{name:'Photon Burger',osm_value:'restaurant',cuisine:'burger',osm_id:999,osm_type:'N'},
        geometry:{type:'Point',coordinates:[-86.7716,36.1800]}
      }]
    });
  }
  if(u.includes('nominatim.openstreetmap.org')){
    return jsonResponse([]);
  }
  if(u.includes('overpass.')){
    return jsonResponse({
      elements:fixed.map(x=>({type:'node',id:x.id,lat:x.lat,lon:x.lon,tags:{
        name:x.name,amenity:x.amenity,brand:x.brand||'',cuisine:x.cuisine||'','menu:items':x['menu:items']||''
      }}))
    });
  }
  if(u.includes('geocoding.geo.census.gov')||u.includes('geocode.arcgis.com')||u.includes('geocode')){
    return jsonResponse({result:{addressMatches:[]}});
  }
  throw new Error('Unexpected provider URL in test: '+u);
};

process.env.GOOGLE_PLACES_API_KEY='';
const handler = require('../api/restaurant-search.js');

function call(query){
  return new Promise((resolve,reject)=>{
    const req={query};
    const res={
      statusCode:200,
      status(code){this.statusCode=code;return this;},
      setHeader(){},
      json(body){resolve({status:this.statusCode,body});}
    };
    Promise.resolve(handler(req,res)).catch(reject);
  });
}

const origin={lat:36.1661,lon:-86.7716};
const radii=[15,25,50,75,100];
const counts=[];
for(const radius of radii){
  const out=await call({mode:'search',lat:String(origin.lat),lon:String(origin.lon),radius:String(radius),limit:'1000'});
  if(out.status!==200)throw new Error('Radius '+radius+' returned HTTP '+out.status);
  const rows=out.body?.results||[];
  counts.push(rows.length);
  if(rows.some(r=>Number(r.distanceMiles)>radius+0.001))throw new Error('Radius '+radius+' returned an out-of-radius row.');
}
for(let i=1;i<counts.length;i++){
  if(counts[i]<counts[i-1])throw new Error('Radius count shrank: '+radii[i-1]+'mi='+counts[i-1]+' -> '+radii[i]+'mi='+counts[i]);
}
if(counts[1]<4)throw new Error('Provider merge did not bring in the broad pool at 25mi: '+counts[1]);

const burger=await call({mode:'search',lat:String(origin.lat),lon:String(origin.lon),radius:'25',q:'burger',limit:'1000'});
if(burger.status!==200)throw new Error('Burger search returned HTTP '+burger.status);
const names=(burger.body?.results||[]).map(r=>String(r.name));
for(const expected of ['Burger King','Local Grill','Main Street Diner','Photon Burger']){
  if(!names.some(n=>n===expected))throw new Error('Burger search missed '+expected+': '+names.join(', '));
}
if(names.includes('Pasta House'))throw new Error('Burger search incorrectly returned Pasta House.');

console.log(JSON.stringify({ok:true,radii,counts,burger:names,fastFoodCount:burger.body?.fastFoodCount||0},null,2));
