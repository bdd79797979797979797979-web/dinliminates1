const assert = require('assert');
const handler = require('../api/restaurant-search.js');

function response(obj, status=200){
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type':'application/json' } });
}

global.fetch = async (url) => {
  const u = new URL(url);
  if (u.hostname === 'geocode.arcgis.com' && u.pathname.endsWith('/findAddressCandidates')) {
    const q = u.searchParams.get('SingleLine') || '';
    return response({candidates:[{
      address: q === 'Cla'
        ? 'Cla'
        : q.toLowerCase().startsWith('801')
        ? '801 Iron Workers Rd, Clarksville, Tennessee, 37043'
        : 'Clarksville, Tennessee',
      score: 100,
      location: q.toLowerCase().startsWith('801')
        ? {x:-87.178409279873,y:36.442677819376}
        : {x:-87.35945,y:36.52977},
      attributes:{Addr_type:q.toLowerCase().startsWith('801')?'PointAddress':'Locality',Match_addr:q}
    }]});
  }
  if (u.hostname === 'geocoding.geo.census.gov') return response({result:{addressMatches:[]}});
  if (u.hostname === 'photon.komoot.io') {
    const q = u.searchParams.get('q') || '';
    if (q === 'restaurant') return response({features:[
      {type:'Feature',geometry:{type:'Point',coordinates:[-87.1783,36.4428]},properties:{name:'Waffle House',osm_type:'N',osm_id:20,osm_key:'amenity',osm_value:'restaurant',street:'Iron Workers Rd',housenumber:'801',city:'Clarksville',state:'Tennessee',postcode:'37043',cuisine:'american'}},
    ]});
    if (q === 'fast food') return response({features:[]});
    if (/^wendy/i.test(q)) return response({features:[
      {type:'Feature',geometry:{type:'Point',coordinates:[-87.1781,36.4429]},properties:{name:"Wendy's",osm_type:'N',osm_id:21,osm_key:'amenity',osm_value:'fast_food',street:'Hankook Road',housenumber:'1630',city:'Clarksville',state:'Tennessee',postcode:'37043',cuisine:'burger'}}
    ]});
    if (/^burger/i.test(q)) return response({features:[
      {type:'Feature',geometry:{type:'Point',coordinates:[-87.1780,36.4430]},properties:{name:'Burger King',osm_type:'N',osm_id:22,osm_key:'amenity',osm_value:'fast_food',street:'Hankook Road',housenumber:'1700',city:'Clarksville',state:'Tennessee',postcode:'37043',cuisine:'burger'}}
    ]});
  }
  if (u.hostname === 'nominatim.openstreetmap.org') {
    assert.equal(u.searchParams.get('extratags'),'1');
    assert.equal(u.searchParams.get('limit'),'40');
    const nq = u.searchParams.get('q') || '';
    if (/^wendy/i.test(nq)) return response([
      {osm_type:'node',osm_id:21,lat:'36.4429',lon:'-87.1781',name:"Wendy's",type:'fast_food',class:'amenity',display_name:"Wendy's, Clarksville, Tennessee",extratags:{brand:"Wendy's"}}
    ]);
    return response([
      {osm_type:'node',osm_id:1,lat:'36.4427',lon:'-87.1784',name:"McDonald's",type:'fast_food',class:'amenity',display_name:"McDonald's, Clarksville, Tennessee",extratags:{opening_hours:'Mo-Su 06:00-23:00',website:'https://www.mcdonalds.com',phone:'+1 555 0100'}}
    ]);
  }
  throw new Error('Unexpected URL '+url);
};

function res(){
  return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(v){this.body=v;return this},end(){}};
}

(async()=>{
  let r=res(); await handler({method:'GET',query:{mode:'health'},headers:{}},r);
  assert.equal(r.statusCode,200); assert.equal(r.body.maxRadiusMiles,100); assert.equal(r.body.version,'restaurant-v759-search-quality');

  r=res(); await handler({method:'GET',query:{mode:'suggest',q:'801 Iron Workers Rd, Clarksville, TN'},headers:{}},r);
  assert.equal(r.statusCode,200); assert(r.body.results.length>=1);
  assert(r.body.results[0].precision==='address');

  r=res(); await handler({method:'GET',query:{mode:'suggest',q:'Cla'},headers:{}},r);
  assert.equal(r.statusCode,200); assert.equal(r.body.results.length,0);

  r=res(); await handler({method:'GET',query:{mode:'resolve',q:'801 Iron Workers Rd, Clarksville, TN'},headers:{}},r);
  assert.equal(r.statusCode,200); assert.equal(r.body.precision,'address');

  r=res(); await handler({method:'GET',query:{mode:'search',lat:'36.44268',lon:'-87.17841',radius:'25',q:"Wendy's"},headers:{}},r);
  assert.equal(r.statusCode,200);
  assert.equal(r.body.searchQuery,"Wendy's");
  assert.equal(r.body.searchContract,'combined-restaurant-fast-food');
  assert(r.body.results.length>=1);
  assert(r.body.results.every(x=>/wendy/i.test(x.name)));
  assert.equal(r.body.results.some(x=>/mcdonald|waffle|burger king/i.test(x.name)),false);

  r=res(); await handler({method:'GET',query:{mode:'search',lat:'36.44268',lon:'-87.17841',radius:'100'},headers:{}},r);
  assert.equal(r.statusCode,200);
  assert(r.body.results.some(x=>x.name==="McDonald's"));
  assert(r.body.results.some(x=>x.name==='Waffle House'));
  assert(Number(r.body.fastFoodCount)>0);
  const mc = r.body.results.find(x=>x.name==="McDonald's");
  assert(mc);
  assert.equal(mc.opening_hours,'Mo-Su 06:00-23:00');
  assert.equal(mc.website,'https://www.mcdonalds.com');
  assert(r.body.results.every(x=>Number(x.distanceMiles)<=100));
  assert(r.body.results.every(x=>/^osm-|^photon-|^nominatim-/.test(x.id)));
  assert(Array.isArray(r.body.providersUsed) && r.body.providersUsed.length>0);
  console.log('API_UNIT_TESTS_OK');
})().catch(e=>{console.error(e);process.exit(1)});