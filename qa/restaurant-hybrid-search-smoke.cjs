const assert=require('assert/strict');
const fs=require('fs'),vm=require('vm');
const app=fs.readFileSync('app.js','utf8');
const apiSrc=fs.readFileSync('api/restaurants.js','utf8');

assert(app.includes("const searchTerm = String(S.restaurantQuery||'').trim().slice(0,100);"));
assert(app.includes("const queryParam = searchTerm ? '&q='+encodeURIComponent(searchTerm) : '';"));
assert(app.includes("setTimeout(()=>{searchRestaurants();},650)"));
assert(apiSrc.includes("async function googleSearchPlaces(lat,lon,radius,searchTerm)"));
assert(apiSrc.includes("textQuery:term+' restaurant'"));
assert(apiSrc.includes('searchQueryMany'));
assert(apiSrc.includes('[cuisine~"'));
assert(apiSrc.includes('[brand~"'));
assert(apiSrc.includes('[operator~"'));

const context={module:{exports:{}},exports:{},require,process,fetch};
vm.runInNewContext(apiSrc,context,{filename:'api/restaurants.js'});
const t=context.module.exports._test||{};
assert.equal(typeof t.normalizeSearchQuery,'function');
assert.equal(typeof t.searchRegex,'function');
assert.equal(typeof t.searchQueryClause,'function');

assert.equal(t.normalizeSearchQuery("McDonald's"),'mcdonalds');
const namePattern=new RegExp(t.searchRegex("McDonald's"),'i');
assert(namePattern.test("McDonald's"),'Provider search regex must match McDonald\'s');
assert(namePattern.test('McDonalds'),'Provider search regex must match McDonalds');
const burgerClause=t.searchQueryClause(36.53,-87.34,10,'burger');
assert(burgerClause.includes('[name~') && burgerClause.includes('[brand~') && burgerClause.includes('[operator~') && burgerClause.includes('[cuisine~'),'Burger provider query must cover name, brand, operator, and cuisine');
const mexicanClause=t.searchQueryClause(36.53,-87.34,10,'Mexican');
const mexicanPattern=new RegExp(t.searchRegex('Mexican'),'i');
assert(mexicanPattern.test('Mexican'),'Cuisine provider regex should match the normalized cuisine term');
assert(mexicanClause.includes('[cuisine~'),'Cuisine provider query should target the cuisine field');
console.log('restaurant hybrid search smoke: PASS');
