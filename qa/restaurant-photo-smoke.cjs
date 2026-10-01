'use strict';
const assert=require('node:assert/strict');
const restaurants=require('../api/restaurants.js');
const photoApi=require('../api/restaurant-photo.js');
const rt=restaurants._test;
const pt=photoApi._test;

assert.ok(typeof rt.restaurantPhotoMeta==='function','restaurantPhotoMeta export missing');
assert.ok(typeof pt.extractInternalLinks==='function','extractInternalLinks export missing');
assert.ok(typeof pt.extractVenueImageCandidates==='function','extractVenueImageCandidates export missing');

const osm=rt.restaurantPhotoMeta({
  name:'Exact OSM Venue',
  photo:'https://upload.wikimedia.org/wikipedia/commons/example.jpg',
  source:'OpenStreetMap'
});
assert.equal(osm.photo,'https://upload.wikimedia.org/wikipedia/commons/example.jpg');
assert.equal(osm.photoSource,'osm-poi');
assert.equal(osm.photoIsGeneric,false);

const provider=rt.restaurantPhotoMeta({
  name:'Local Bistro',
  photo:'https://example.com/venue.jpg',
  source:'Provider Directory'
});
assert.equal(provider.photo,'https://example.com/venue.jpg');
assert.equal(provider.photoSource,'provider');
assert.equal(provider.photoIsGeneric,false);

const empty=rt.restaurantPhotoMeta({name:'Unknown Neighborhood Restaurant',category:'Restaurant'});
assert.equal(empty.photo,'');
assert.equal(empty.photoFallback,'');
assert.equal(empty.photoSource,'none');
assert.equal(empty.photoIsGeneric,false);

const html=`
<!doctype html>
<a href="/locations/clarksville">Clarksville Location</a>
<a href="/menu">Menu</a>
<div itemscope itemtype="https://schema.org/Restaurant">
  <span itemprop="name">Exact Bistro</span>
  <span>123 Main Street, Clarksville, TN 37040</span>
  <img src="https://example.com/front.jpg" alt="Exact Bistro exterior storefront entrance">
  <img src="https://example.com/menu.jpg" alt="burger menu">
</div>`;
const links=pt.extractInternalLinks(html,'https://exactbistro.example/','Exact Bistro','123 Main Street, Clarksville, TN 37040');
assert.deepEqual(links,['https://exactbistro.example/locations/clarksville']);

const candidates=pt.extractVenueImageCandidates(html,'https://exactbistro.example/','Exact Bistro','123 Main Street, Clarksville, TN 37040','https://exactbistro.example/');
assert.ok(candidates.some(x=>x.url==='https://example.com/front.jpg'&&x.score>=65),'Venue exterior image should score as a candidate');
assert.ok(candidates.some(x=>x.url==='https://example.com/menu.jpg'),'Menu image should be detectable for rejection');

(async()=>{
  const originalFetch=global.fetch;
  const osmUrl='https://example.com/osm-venue.jpg';
  global.fetch=async function(url){
    const u=String(url);
    if(u===osmUrl){
      return {
        ok:true,status:200,
        headers:{get(name){return name.toLowerCase()==='content-type'?'image/jpeg':null}},
        async arrayBuffer(){return Uint8Array.from({length:5000},()=>7).buffer}
      };
    }
    throw new Error('network disabled for deterministic test');
  };
  try{
    const headers={};
    let status=0,body=Buffer.alloc(0);
    await photoApi(
      {query:{name:'OSM Venue',address:'123 Main St, Clarksville, TN',osmExact:'1',osmImage:osmUrl}},
      {setHeader(k,v){headers[k]=String(v)},statusCode:200,end(v){body=Buffer.isBuffer(v)?v:Buffer.from(String(v??''))}}
    );
    status=200;
    assert.equal(headers['X-Restaurant-Photo-Source'],'osm-exact-poi');
    assert.equal(body.length,5000);
  }finally{
    global.fetch=originalFetch;
  }
  console.log(JSON.stringify({
    ok:true,
    cases:8,
    verified:[
      'no generic restaurant photo fallback',
      'provider venue photo metadata',
      'exact OSM POI photo metadata',
      'official-site internal location discovery',
      'venue exterior candidate scoring',
      'food/menu candidate remains rejectable',
      'credential-free OSM photo tier',
      'restaurant-photo API no Google API dependency'
    ]
  },null,2));
})().catch(err=>{console.error(err);process.exitCode=1});
