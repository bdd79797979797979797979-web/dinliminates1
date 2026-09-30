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
const separate=dedupe([{id:'e',name:'Heads BBQ',address:'801 Iron Workers Rd, Clarksville, TN 37043',lat:36.5304,lon:-87.3601,distance:0.1,source:'Photon'},{id:'f',name:'Robert Heads BBQ',address:'200 College St, Clarksville, TN 37040',lat:36.545,lon:-87.350,distance:1.1,source:'ArcGIS'}]);
assert.equal(separate.length,2,'Same-named restaurant variants at different locations must remain separate');
console.log('Restaurant duplicate regression: PASS');


const classify=handler._test?.classifyRestaurant;
assert.equal(typeof classify,'function','restaurant taxonomy classifier test hook should exist');
const taxonomyCases=[
 {row:{name:'Thirsty Goat',category:'Restaurant',cuisine:'',fastFood:true,menuItems:[]},tag:'Pizza'},
 {row:{name:'Heads BBQ',category:'Restaurant',cuisine:'',fastFood:false,menuItems:[]},tag:'BBQ'},
 {row:{name:'Excell BBQ',category:'Restaurant',cuisine:'',fastFood:false,menuItems:[]},tag:'BBQ'},
 {row:{name:"McDonald's",category:'Restaurant',cuisine:'',fastFood:true,menuItems:[]},tag:'Fast Food'},
 {row:{name:'Tokyo Grill',category:'Restaurant',cuisine:'',fastFood:false,menuItems:[]},tag:'Asian'},
 {row:{name:'River House Cafe',category:'Restaurant',cuisine:'',fastFood:false,menuItems:[]},tag:'American'},
 {row:{name:'Pasta Kitchen',category:'Restaurant',cuisine:'',fastFood:false,menuItems:[]},tag:'Italian'}
];
for(const c of taxonomyCases){
 const result=classify(c.row);
 assert.equal(result.tags.includes(c.tag),true,c.row.name+' should classify as '+c.tag);
}
assert.equal(classify({name:'Thirsty Goat',category:'Restaurant',cuisine:'',fastFood:true,menuItems:[]}).tags.includes('Fast Food'),false,'Thirsty Goat must not inherit an incorrect Fast Food provider tag');
console.log('Restaurant taxonomy regression: PASS');
