const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');

const photo=require('../api/restaurant-photo');
assert.equal(typeof photo._test?.fastOfficialVenuePhoto,'function','fast official photo helper should exist');
assert.equal(typeof photo._test?.knownPublicPhotoPage,'function','known public photo hint helper should exist');
assert.equal(photo._test.knownPublicPhotoPage('Excell Market & BBQ'),'https://www.visitclarksvilletn.com/listing/excell-bar-b-q/128/','Excell should have a verified fast public photo-page hint');

const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
assert.match(app,/async function loadRestaurantPhoto\(row\)/,'shared restaurant photo loader should exist');
assert.match(app,/prefetchRestaurantPhotos\(rows,S\.restaurantIndex,RESTAURANT_PHOTO_PREFETCH_COUNT\)/,'restaurant card rendering should trigger photo prefetch');
assert.match(app,/const run=\(\)=>targets\.forEach\(row=>\{loadRestaurantPhoto\(row\)/,'prefetch should load rows without requiring DOM image elements');
assert.match(app,/"the thirsty goat":'https:\/\/www\.thirstygoatsango\.com'/,'Thirsty Goat official site hint should exist');
assert.match(app,/"sweet p's":'https:\/\/sweetpssouthernstyle\.com'/,'Sweet P official site hint should exist');
console.log('CP676 restaurant photo speed smoke: PASS');
