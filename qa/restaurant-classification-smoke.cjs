const assert=require('assert/strict');
const handler=require('../api/restaurants');
const isFast=handler._test?.isFastFoodName; const dedupe=handler._test?.dedupe; const isNonDining=handler._test?.isClearlyNonDiningBusiness; const filterNonDining=handler._test?.filterNonDiningRows; const knownWebsite=handler._test?.knownRestaurantWebsite;
assert.equal(typeof isFast,'function','fast-food classifier test hook should exist');
assert.equal(typeof dedupe,'function','restaurant dedupe test hook should exist');
assert.equal(typeof isNonDining,'function','non-dining business filter test hook should exist');
assert.equal(typeof filterNonDining,'function','non-dining row filter test hook should exist');
assert.equal(typeof knownWebsite,'function','known restaurant website test hook should exist');
assert.equal(knownWebsite({name:"Camacho's Famous"}),'https://www.camachosfamous.com','Camacho\'s Famous must use its official website');
for(const name of ["McDonald's","Wendy's","Burger King","KFC","Taco Bell","Chick-fil-A","Chipotle"]) assert.equal(isFast(name),true,name+' should classify as Fast Food');
for(const name of ["Applebee's","Ruby Tuesday","Olive Garden","Texas Roadhouse","Outback Steakhouse","Cracker Barrel","O'Charley's","Red Lobster","Panera Bread","The Thirsty Goat"]) assert.equal(isFast(name),false,name+' should not classify as Fast Food');
const classify=handler._test.classifyRestaurant;
assert.equal(classify({name:'The Thirsty Goat',category:'Restaurant',cuisine:'',providerType:'restaurant'}).tags.includes('Pizza'),true,'The Thirsty Goat should classify as Pizza');
assert.equal(classify({name:'Heads BBQ',category:'Restaurant',cuisine:'',providerType:'restaurant'}).tags.includes('BBQ'),true,'Heads BBQ should classify as BBQ');
assert.equal(classify({name:'Excell BBQ',category:'Restaurant',cuisine:'',providerType:'restaurant'}).tags.includes('BBQ'),true,'Excell BBQ should classify as BBQ');
console.log('Dinliminate restaurant classification smoke: PASS');

const fixture=[
 {id:'a',name:'Heads BBQ',address:'801 Iron Workers Rd, Clarksville, TN 37043',lat:36.5304,lon:-87.3601,distance:0.1,source:'Photon',phone:'9315550101'},
 {id:'b',name:'Robert Heads BBQ',address:'801 Iron Workers Road, Clarksville, Tennessee 37043',lat:36.53045,lon:-87.36012,distance:0.1,source:'ArcGIS',phone:'9315550101'},
 {id:'c',name:"Chris Pizza",address:'100 Main St, Clarksville, TN 37040',lat:36.5300,lon:-87.3600,distance:0.2,source:'Photon'},
 {id:'d',name:"Chris's Pizza",address:'100 Main St, Clarksville, TN 37040',lat:36.53002,lon:-87.36002,distance:0.2,source:'ArcGIS'}
];
const merged=dedupe(fixture);
assert.equal(merged.length,2,'Same-site provider name variants should merge without leaving duplicate cards');
assert.equal(merged.some(x=>/heads bbq/i.test(x.name)),true,'Heads BBQ family should remain discoverable after dedupe');
assert.equal(merged.filter(x=>/chris pizza/i.test(x.name)).length,1,'Chris Pizza variants should merge into one result');
const separate=dedupe([{id:'e',name:'Heads BBQ',address:'801 Iron Workers Rd, Clarksville, TN 37043',lat:36.5304,lon:-87.3601,distance:0.1,source:'Photon'},{id:'f',name:'Robert Heads BBQ',address:'200 College St, Clarksville, TN 37040',lat:36.545,lon:-87.350,distance:1.1,source:'ArcGIS'}]);
assert.equal(separate.length,2,'Same-named restaurant variants at different locations must remain separate');
console.log('Restaurant duplicate regression: PASS');

const nonDiningFixtures=[
 {id:'supplier',name:"Larson's Enterprise Inc",category:'Restaurant',providerType:'Food Supplier',address:'123 Example Rd, Clarksville, TN'},
 {id:'distributor',name:'Regional Food Distribution',category:'Restaurant',providerType:'Food Distributor',address:'125 Example Rd, Clarksville, TN'},
 {id:'warehouse',name:'Clarksville Food Warehouse',category:'Restaurant',providerType:'Warehouse',address:'127 Example Rd, Clarksville, TN'},
 {id:'restaurant',name:'Camacho Taco Grill',category:'Restaurant',providerType:'restaurant',cuisine:'Mexican',address:'129 Example Rd, Clarksville, TN'}
];
assert.equal(isNonDining(nonDiningFixtures[0]),true,"Larson's Enterprise Inc food-supplier record must be excluded");
assert.equal(isNonDining(nonDiningFixtures[1]),true,'Food distributor must be excluded');
assert.equal(isNonDining(nonDiningFixtures[2]),true,'Warehouse must be excluded');
assert.equal(isNonDining(nonDiningFixtures[3]),false,'Actual dining venue must remain eligible');
const filtered=filterNonDining(nonDiningFixtures);
assert.deepEqual(filtered.map(x=>x.id),['restaurant'],'Non-dining rows must be removed while dining rows remain');
console.log('Restaurant non-dining business regression: PASS');
