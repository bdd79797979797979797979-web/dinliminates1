const assert=require('assert/strict');
const handler=require('../api/restaurants');
const isFast=handler._test?.isFastFoodName; const dedupe=handler._test?.dedupe;
assert.equal(typeof isFast,'function','fast-food classifier test hook should exist');
assert.equal(typeof dedupe,'function','restaurant dedupe test hook should exist');
for(const name of ["McDonald's","Wendy's","Burger King","KFC","Taco Bell","Chick-fil-A","Chipotle"]) assert.equal(isFast(name),true,name+' should classify as Fast Food');
for(const name of ["Applebee's","Ruby Tuesday","Olive Garden","Texas Roadhouse","Outback Steakhouse","Cracker Barrel","O'Charley's","Red Lobster","Panera Bread","The Thirsty Goat"]) assert.equal(isFast(name),false,name+' should not classify as Fast Food');
console.log('Dinliminate restaurant classification smoke: PASS');

const fixture=[
 {id:'a',name:'Heads BBQ',address:'801 Iron Workers Rd, Clarksville, TN 37043',lat:36.5304,lon:-87.3601,distance:0.1,source:'Photon',phone:'9315550101'},
 {id:'b',name:'Robert Heads BBQ',address:'801 Iron Workers Road, Clarksville, Tennessee 37043',lat:36.53045,lon:-87.36012,distance:0.1,source:'ArcGIS',phone:'9315550101'},
 {id:'c',name:"Chris Pizza",address:'100 Main St, Clarksville, TN 37040',lat:36.5300,lon:-87.3600,distance:0.2,source:'Photon'},
 {id:'d',name:"Chris Pizza & More",address:'100 Main St, Clarksville, TN 37040',lat:36.53002,lon:-87.36002,distance:0.2,source:'ArcGIS'}
];
const merged=dedupe(fixture);
assert.equal(merged.length,2,'Same-site provider name variants should merge without leaving duplicate cards');
assert.equal(merged.some(x=>/heads bbq/i.test(x.name)),true,'Heads BBQ family should remain discoverable after dedupe');
assert.equal(merged.filter(x=>/chris pizza/i.test(x.name)).length,1,'Chris Pizza variants should merge into one result');
console.log('Restaurant duplicate regression: PASS');
