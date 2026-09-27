const assert = require('assert');
const handler = require('../api/restaurant-search.js');

let calls = [];
let fallbackSupplementMode = false;
function jsonResponse(obj, status=200){ return new Response(JSON.stringify(obj), {status, headers:{'content-type':'application/json'}}); }

global.fetch = async (url, opts={}) => {
  const u = new URL(url); calls.push({url:u.toString(), method:opts.method||'GET'});
  if(u.hostname==='geocode.arcgis.com'){
    if(u.pathname.endsWith('/suggest')) return jsonResponse({suggestions:[{text:'801 Iron Workers Rd, Clarksville, Tennessee, 37043',magicKey:'k1'}]});
    if(u.pathname.endsWith('/findAddressCandidates')){
      const q=u.searchParams.get('SingleLine')||'';
      if(/^801/i.test(q)) return jsonResponse({candidates:[{address:'801 Iron Workers Rd, Clarksville, Tennessee, 37043',score:100,location:{x:-87.178409279873,y:36.442677819376},attributes:{Addr_type:'PointAddress',Match_addr:'801 Iron Workers Rd, Clarksville, Tennessee, 37043'}}]});
      return jsonResponse({candidates:[{address:'Clarksville, Tennessee',score:100,location:{x:-87.35945,y:36.52977},attributes:{Addr_type:'Locality',Match_addr:'Clarksville, Tennessee'}}]});
    }
  }
  if(u.hostname==='geocoding.geo.census.gov') return jsonResponse({result:{addressMatches:[]}});
  if(u.hostname==='photon.komoot.io') return jsonResponse({features:[]});
  if(u.hostname==='nominatim.openstreetmap.org') return jsonResponse([]);
  if(u.hostname==='maps.mail.ru'){
    if(!fallbackSupplementMode) throw new Error('Unexpected Overpass fallback call');
    return jsonResponse({elements:[{type:'node',id:9001,lat:36.4427,lon:-87.1784,tags:{name:'Burger King',amenity:'fast_food',brand:'Burger King'}}]});
  }
  if(u.hostname==='postpass.geofabrik.de'){
    const body=decodeURIComponent(String(opts.body||''));
    const m=body.match(/options\[geojson\]=false/); assert(m);
    const result = fallbackSupplementMode
      ? [
          {osm_type:'node',osm_id:'20',lat:36.45,lon:-87.18,tags:{name:'Waffle House',amenity:'restaurant',cuisine:'american'}}
        ]
      : [
          {osm_type:'node',osm_id:'1',lat:36.44268,lon:-87.17841,tags:{name:"McDonald's",amenity:'fast_food'}},
          {osm_type:'node',osm_id:'2',lat:36.45,lon:-87.18,tags:{name:'Waffle House',amenity:'restaurant',cuisine:'american'}},
          {osm_type:'node',osm_id:'3',lat:37.9,lon:-87.18,tags:{name:'Outside',amenity:'restaurant'}}
        ];
    return jsonResponse({result});
  }
  throw new Error('Unexpected URL '+url);
};

function res(){
  const chunks=[]; return {
    statusCode:200, headers:{}, setHeader(k,v){this.headers[k]=v;}, status(n){this.statusCode=n;return this;}, json(v){this.body=v;return this;}, send(v){this.body=v;return this;}, end(){return this;}
  };
}
(async()=>{
  let r=res(); await handler({method:'GET',query:{mode:'health'},headers:{}},r); assert.equal(r.statusCode,200); assert.equal(r.body.maxRadiusMiles,100);
  calls=[]; r=res(); await handler({method:'GET',query:{mode:'suggest',q:'801 Iron Workers Rd, Clarksville, TN',limit:'7'},headers:{}},r); assert.equal(r.statusCode,200); assert(r.body.results.length>=1); assert.equal(r.body.results[0].display,'801 Iron Workers Rd, Clarksville, Tennessee, 37043'); assert(Number.isFinite(r.body.results[0].lat));
  r=res(); await handler({method:'GET',query:{mode:'resolve',q:'801 Iron Workers Rd, Clarksville, TN'},headers:{}},r); assert.equal(r.statusCode,200); assert.equal(r.body.location.lon,-87.178409279873); assert.equal(r.body.precision,'pointaddress');
  r=res(); await handler({method:'GET',query:{mode:'resolve',q:'Clarksville, TN'},headers:{}},r); assert.equal(r.statusCode,200); assert.equal(r.body.precision,'locality');
  calls=[]; r=res(); await handler({method:'GET',query:{mode:'search',lat:'36.44268',lon:'-87.17841',radius:'100'},headers:{}},r); assert.equal(r.statusCode,200); assert.equal(r.body.radiusMiles,100); console.log('status',r.statusCode,'body',JSON.stringify(r.body),'calls',JSON.stringify(calls)); assert(r.body.results.some(x=>x.name==="McDonald's")); assert(r.body.results.some(x=>x.name==='Waffle House')); assert.equal(r.body.fastFoodCount,1); assert(r.body.results.every(x=>Number(x.distanceMiles)<=100)); assert(r.body.results.every(x=>/^osm-(node|way|relation)-/.test(x.id))); assert(calls.filter(x=>x.url.includes('postpass.geofabrik.de')).length>=1);
  console.log('API_UNIT_TESTS_OK');
})().catch(e=>{console.error(e);process.exit(1)});
