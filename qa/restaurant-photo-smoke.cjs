'use strict';
const assert=require('node:assert/strict');
const handler=require('../api/restaurants.js');
const photoApi=require('../api/restaurant-photo.js');
const t=handler._test;
const pt=photoApi._test;
assert.ok(typeof t.restaurantPhotoMeta==='function','restaurantPhotoMeta export missing');
assert.ok(typeof pt.normalizeAttributions==='function','normalizeAttributions export missing');
const provider=t.restaurantPhotoMeta({name:'Local Bistro',photo:'https://images.unsplash.com/photo-x'});
assert.equal(provider.photoSource,'provider');
assert.equal(provider.photoIsGeneric,false);
assert.ok(provider.photo);
const google=t.restaurantPhotoMeta({name:'Google Grill',googlePlaceId:'ChIJ1234567890',category:'Seafood'});
assert.equal(google.photoSource,'google-places');
assert.equal(google.photoIsGeneric,false);
assert.equal(google.photo,'');
assert.ok(google.photoFallback,'Google rows need an immediate fallback while the venue photo loads.');
const known=t.restaurantPhotoMeta({name:"McDonald's",category:'Fast Food'});
assert.equal(known.photoSource,'known-entity');
assert.equal(known.photoIsGeneric,true);
const cuisine=t.restaurantPhotoMeta({name:'Harbor Catch',category:'Seafood'});
assert.equal(cuisine.photoSource,'cuisine-fallback');
assert.equal(cuisine.photoIsGeneric,true);
const generic=t.restaurantPhotoMeta({name:'Unknown Neighborhood Restaurant',category:'Restaurant'});
assert.equal(generic.photoSource,'generic-fallback');
assert.equal(generic.photoIsGeneric,true);
const merged=t.dedupe([
  {id:'osm-photo',name:'Photo Merge Grill',category:'Restaurant',fastFood:false,cuisine:'american',address:'1 Main St, Clarksville, TN',phone:'',website:'',lat:36.53,lon:-87.36,distance:1,photo:'https://images.unsplash.com/photo-provider',source:'OpenStreetMap'},
  {id:'google-photo',name:'Photo Merge Grill',category:'Restaurant',fastFood:false,cuisine:'',address:'1 Main St, Clarksville, TN',phone:'',website:'',lat:36.53,lon:-87.36,distance:1,photo:'',googlePlaceId:'ChIJ1234567890',source:'Google Places'}
]);
assert.equal(merged.length,1,'Provider duplicate should remain one venue.');
assert.equal(merged[0].photo,'https://images.unsplash.com/photo-provider','Existing venue-specific provider photo should win.');
assert.equal(merged[0].googlePlaceId,'ChIJ1234567890','Google Place ID should survive dedupe for photo enrichment.');
const attrs=pt.normalizeAttributions([{displayName:'Jane Doe',uri:'//maps.google.com/maps/contrib/123'},{displayName:'Bad',uri:'javascript:alert(1)'}]);
assert.deepEqual(attrs,[{displayName:'Jane Doe',uri:'https://maps.google.com/maps/contrib/123'}]);
console.log(JSON.stringify({ok:true,cases:7,verified:['provider photo metadata','Google venue-photo tier','known entity fallback','cuisine fallback','generic fallback','Google attribution normalization','no cached Google photo resource name in search rows']},null,2));