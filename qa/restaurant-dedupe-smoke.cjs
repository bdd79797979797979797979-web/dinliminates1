const assert=require('assert/strict');
const handler=require('../api/restaurants');
const t=handler._test||{};
assert.equal(typeof t.dedupe,'function','dedupe test hook required');
assert.equal(typeof t.nameVariantMatch,'function','name variant test hook required');
assert.equal(typeof t.normAddress,'function','normAddress test hook required');

const rows=[
 {id:'osm-heads',name:"Head's BBQ",address:'100 Main Rd, Clarksville, TN 37043',lat:36.5300,lon:-87.3400,distance:.2,source:'OpenStreetMap',fastFood:false,menuItems:[],photo:''},
 {id:'arc-robert-heads',name:'Robert Head’s BBQ',address:'100 Main Rd, Clarksville, TN 37043',lat:36.5307,lon:-87.3403,distance:.2,source:'ArcGIS POI',fastFood:false,menuItems:[],photo:'better'},
 {id:'osm-chris',name:"Chris Pizza",address:'200 College St, Clarksville, TN 37043',lat:36.5310,lon:-87.3390,distance:.3,source:'OpenStreetMap',fastFood:false,menuItems:[],photo:''},
 {id:'pho-chris',name:"Chris's Pizza",address:'200 College St, Clarksville, TN 37043',lat:36.5314,lon:-87.3392,distance:.3,source:'Photon POI',fastFood:false,menuItems:['pizza'],photo:''},
 {id:'other',name:'Heads BBQ Express',address:'500 Rural Rd, Clarksville, TN 37043',lat:36.5400,lon:-87.3500,distance:.8,source:'ArcGIS POI',fastFood:false,menuItems:[],photo:''},
 {id:'heads-road-spelling',name:"Head's BBQ",address:'100 Main Rd, Clarksville, TN 37043',lat:36.5450,lon:-87.3500,distance:1.1,source:'Photon POI',fastFood:false,menuItems:[],photo:''},
 {id:'far-variant',name:"Head's BBQ",address:'900 River Rd, Clarksville, TN 37043',lat:36.7200,lon:-87.3500,distance:12,source:'ArcGIS POI',fastFood:false,menuItems:[],photo:''}
];
assert.equal(t.nameVariantMatch("Head's BBQ",'Robert Head’s BBQ'),true,'Robert Head’s BBQ should be recognized as a nearby name variant');
assert.equal(t.nameVariantMatch('Chris Pizza',"Chris's Pizza"),true,'Chris Pizza and Chris’s Pizza should normalize to the same name family');
const out=t.dedupe(rows);
assert.equal(t.normAddress('100 Main Road, Clarksville, TN 37043'),t.normAddress('100 Main Rd, Clarksville, TN 37043'),'Road/Rd address variants should normalize together');
assert.equal(out.length,4,'Three duplicate-provider cases should collapse while distinct venues remain');
assert.equal(out.some(x=>/Robert Head/i.test(x.name)),false,'Provider variant should not survive as a duplicate');
assert.equal(out.some(x=>/Chris.?s? Pizza/i.test(x.name)),true,'One Chris Pizza record should remain');
assert.equal(out.some(x=>x.id==='other'),true,'Distinct nearby restaurant should remain');
const chainStores=t.dedupe([
 {id:'m1',name:"McDonald's",address:'100 Main St, Clarksville, TN 37040',lat:36.5304,lon:-87.3601,distance:1,source:'Photon',website:'https://www.mcdonalds.com'},
 {id:'m2',name:"McDonald's",address:'500 Tiny Town Rd, Clarksville, TN 37042',lat:36.6204,lon:-87.2601,distance:8,source:'ArcGIS POI',website:'https://www.mcdonalds.com'}
]);
assert.equal(chainStores.length,2,'Two same-chain locations with the same corporate website must remain separate');
console.log('restaurant dedupe smoke: PASS',JSON.stringify(out.map(x=>({name:x.name,address:x.address,id:x.id}))));


const wendysNameForms=[
 {id:'w1',name:"Wendy's",address:'2330 Madison St, Clarksville, TN 37043',lat:36.53,lon:-87.36,source:'Google'},
 {id:'w2',name:'Wendys',address:'2330 Madison Street, Clarksville, TN 37043',lat:36.5303,lon:-87.3602,source:'Photon'},
 {id:'w3',name:"WENDY'S",address:'2330 Madison St, Clarksville, TN 37043',lat:36.5302,lon:-87.3601,source:'ArcGIS'}
];
const wendysNameMerged=dedupe(wendysNameForms);
assert.equal(wendysNameMerged.length,1,"Wendy's, Wendys, and WENDY'S at the same address must resolve to one venue");

const wendyAddressVariants=[
 {id:'wa',name:"Wendy's",address:'2330 Madison St, Clarksville, TN 37043',lat:36.5300,lon:-87.3600,source:'Google'},
 {id:'wb',name:'Wendys',address:'2330 Madison Street, Clarksville, Tennessee, 37043',lat:36.5302,lon:-87.3601,source:'Photon'},
 {id:'wc',name:"WENDY'S",address:'2330 Madison St., Clarksville, TN 37043, USA',lat:36.5301,lon:-87.36005,source:'ArcGIS'}
];
assert.equal(dedupe(wendyAddressVariants).length,1,"Equivalent Wendy's addresses with state/road formatting differences must collapse to one venue");


const countryAddressVariants=[
 {id:'ca',name:"Wendy's",address:'2330 Madison St, Clarksville, TN 37043',lat:36.5300,lon:-87.3600},
 {id:'cb',name:"Wendys",address:'2330 Madison Street, Clarksville, Tennessee, 37043 United States',lat:36.5302,lon:-87.3601},
 {id:'cc',name:"WENDY'S",address:'2330 Madison St., Clarksville, TN 37043, USA',lat:36.5301,lon:-87.36005}
];
assert.equal(dedupe(countryAddressVariants).length,1,"Country/state/road-format variants of the same Wendy's venue must collapse to one result");


const sameStreetPartialAddress=[
 {id:'ws1',name:"Wendy's",address:'2330 Madison St, Clarksville, TN 37043',lat:36.53,lon:-87.36,distance:6.90,source:'Google'},
 {id:'ws2',name:'Wendys',address:'Madison St, Clarksville, TN 37043',lat:36.5312,lon:-87.3590,distance:6.91,source:'Photon'}
];
assert.equal(dedupe(sameStreetPartialAddress).length,1,"Same-name restaurants on the same street with one partial street address and matching search distance must collapse to one venue");

const sameStreetTwoFullAddresses=[
 {id:'sf1',name:"Wendy's",address:'2330 Madison St, Clarksville, TN 37043',lat:36.53,lon:-87.36,distance:6.90,source:'Google'},
 {id:'sf2',name:"Wendy's",address:'2500 Madison St, Clarksville, TN 37043',lat:36.5312,lon:-87.3590,distance:6.91,source:'Photon'}
];
assert.equal(dedupe(sameStreetTwoFullAddresses).length,2,"Two separately numbered same-name locations on the same street must remain separate");


const concreteDuplicateFamilies=[
 [
  {id:'hb1',name:'Heads BBQ',address:'801 Iron Workers Rd, Clarksville, TN 37043',lat:36.5300,lon:-87.3600,distance:6.90},
  {id:'hb2',name:'Robert Heads BBQ',address:'Iron Workers Road, Clarksville, Tennessee 37043',lat:36.5304,lon:-87.3602,distance:6.91}
 ],
 [
  {id:'eb1',name:'Excell BBQ',address:'100 Madison St, Clarksville, TN 37043',lat:36.5300,lon:-87.3600,distance:6.90},
  {id:'eb2',name:"Excell's BBQ",address:'Madison Street, Clarksville, Tennessee 37043',lat:36.5304,lon:-87.3602,distance:6.91}
 ],
 [
  {id:'mb1',name:"McDonald's",address:'4201 Highway 41A S, Clarksville, TN 37043',lat:36.5300,lon:-87.3600,distance:6.90,brand:"McDonald's"},
  {id:'mb2',name:'McDonalds',address:'Highway 41A South, Clarksville, Tennessee 37043 USA',lat:36.5304,lon:-87.3602,distance:6.91,brand:'McDonalds'}
 ]
];
assert.equal(dedupe(concreteDuplicateFamilies[0]).length,1,'Heads BBQ provider variants must collapse to one venue');
assert.equal(dedupe(concreteDuplicateFamilies[1]).length,1,'Excell BBQ provider variants must collapse to one venue');
assert.equal(dedupe(concreteDuplicateFamilies[2]).length,1,'McDonalds Sango provider variants must collapse to one venue');
