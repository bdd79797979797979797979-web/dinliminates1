const assert=require('assert/strict');
const handler=require('../api/restaurants');
const isFast=handler._test?.isFastFoodName;
assert.equal(typeof isFast,'function','fast-food classifier test hook should exist');
for(const name of ["McDonald's","Wendy's","Burger King","KFC","Taco Bell","Chick-fil-A","Chipotle"]) assert.equal(isFast(name),true,name+' should classify as Fast Food');
for(const name of ["Applebee's","Ruby Tuesday","Olive Garden","Texas Roadhouse","Outback Steakhouse","Cracker Barrel","O'Charley's","Red Lobster","Panera Bread","The Thirsty Goat"]) assert.equal(isFast(name),false,name+' should not classify as Fast Food');
console.log('Dinliminate restaurant classification smoke: PASS');
