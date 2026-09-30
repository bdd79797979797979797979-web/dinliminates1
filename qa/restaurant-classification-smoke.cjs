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


const genericProviderCases=[
 ['Pizza type',{name:'Local Bistro',category:'Restaurant',cuisine:'',primaryType:'pizza_restaurant',providerTypes:['pizza_restaurant']}],
 ['BBQ type',{name:'Local Smokehouse',category:'Restaurant',cuisine:'',primaryType:'barbecue_restaurant',providerTypes:['barbecue_restaurant']}],
 ['Seafood type',{name:'Local Fish House',category:'Restaurant',cuisine:'',primaryType:'seafood_restaurant',providerTypes:['seafood_restaurant']}],
 ['Breakfast type',{name:'Local Cafe',category:'Restaurant',cuisine:'',primaryType:'breakfast_restaurant',providerTypes:['breakfast_restaurant']}],
 ['Chinese type',{name:'Local Place',category:'Restaurant',cuisine:'',primaryType:'chinese_restaurant',providerTypes:['chinese_restaurant']}],
 ['Mexican cuisine',{name:'Local Place',category:'Restaurant',cuisine:'mexican',primaryType:'restaurant',providerTypes:['restaurant']}],
 ['Italian cuisine',{name:'Local Place',category:'Restaurant',cuisine:'italian',primaryType:'restaurant',providerTypes:['restaurant']}]
];
for(const [label,row] of genericProviderCases){
 const tags=classifyRestaurant(row).tags;
 assert.ok(tags.length>0,label+' must not fall back to Restaurant when provider identity exists');
}
assert.ok(classifyRestaurant({name:'The Thirsty Goat',category:'Restaurant'}).tags.includes('Pizza'),'The Thirsty Goat must classify as Pizza');
assert.ok(classifyRestaurant({name:'Heads BBQ',category:'Restaurant'}).tags.includes('BBQ'),'Heads BBQ must classify as BBQ');
assert.ok(classifyRestaurant({name:'Excell BBQ',category:'Restaurant'}).tags.includes('BBQ'),'Excell BBQ must classify as BBQ');
console.log('restaurant classification hardening extended smoke: PASS');


const additionalTypeCases=[
 ['Fast food type',{name:'Local Place',category:'Restaurant',primaryType:'fast_food_restaurant',providerTypes:['fast_food_restaurant']},'Fast Food'],
 ['Burger type',{name:'Local Place',category:'Restaurant',primaryType:'hamburger_restaurant',providerTypes:['hamburger_restaurant']},'Burgers'],
 ['Pizza cuisine',{name:'Local Place',category:'Restaurant',cuisine:'pizza',primaryType:'restaurant',providerTypes:['restaurant']},'Pizza'],
 ['Burger cuisine',{name:'Local Place',category:'Restaurant',cuisine:'burger',primaryType:'restaurant',providerTypes:['restaurant']},'Burgers']
];
for(const [label,row,tag] of additionalTypeCases)assert.ok(classifyRestaurant(row).tags.includes(tag),label+' must classify as '+tag);
