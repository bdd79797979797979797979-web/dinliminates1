const assert=require('assert/strict');
const handler=require('../api/restaurants');
const t=handler._test||{};
assert.equal(typeof t.dedupe,'function','dedupe test hook required');
assert.equal(typeof t.nameVariantMatch,'function','name variant test hook required');

const rows=[
 {id:'osm-heads',name:"Head's BBQ",address:'100 Main St, Clarksville, TN 37043',lat:36.5300,lon:-87.3400,distance:.2,source:'OpenStreetMap',fastFood:false,menuItems:[],photo:''},
 {id:'arc-robert-heads',name:'Robert Head’s BBQ',address:'100 Main St, Clarksville, TN 37043',lat:36.5307,lon:-87.3403,distance:.2,source:'ArcGIS POI',fastFood:false,menuItems:[],photo:'better'},
 {id:'osm-chris',name:"Chris Pizza",address:'200 College St, Clarksville, TN 37043',lat:36.5310,lon:-87.3390,distance:.3,source:'OpenStreetMap',fastFood:false,menuItems:[],photo:''},
 {id:'pho-chris',name:"Chris's Pizza",address:'200 College St, Clarksville, TN 37043',lat:36.5314,lon:-87.3392,distance:.3,source:'Photon POI',fastFood:false,menuItems:['pizza'],photo:''},
 {id:'other',name:'Heads BBQ Express',address:'500 Rural Rd, Clarksville, TN 37043',lat:36.5400,lon:-87.3500,distance:.8,source:'ArcGIS POI',fastFood:false,menuItems:[],photo:''},
 {id:'heads-road-spelling',name:"Head's BBQ",address:'100 Main Road, Clarksville, TN 37043',lat:36.5450,lon:-87.3500,distance:1.1,source:'Photon POI',fastFood:false,menuItems:[],photo:''},
 {id:'far-variant',name:"Head's BBQ",address:'100 Main Rd, Clarksville, TN 37043',lat:36.7200,lon:-87.3500,distance:12,source:'ArcGIS POI',fastFood:false,menuItems:[],photo:''}
];
assert.equal(t.nameVariantMatch("Head's BBQ",'Robert Head’s BBQ'),true,'Robert Head’s BBQ should be recognized as a nearby name variant');
assert.equal(t.nameVariantMatch('Chris Pizza',"Chris's Pizza"),true,'Chris Pizza and Chris’s Pizza should normalize to the same name family');
const out=t.dedupe(rows);
assert.equal(t.normAddress('100 Main Road, Clarksville, TN 37043'),t.normAddress('100 Main Rd, Clarksville, TN 37043'),'Road/Rd address variants should normalize together');
assert.equal(out.length,4,'Three duplicate-provider cases should collapse while distinct venues remain');
assert.equal(out.some(x=>/Robert Head/i.test(x.name)),false,'Provider variant should not survive as a duplicate');
assert.equal(out.some(x=>/Chris.?s? Pizza/i.test(x.name)),true,'One Chris Pizza record should remain');
assert.equal(out.some(x=>x.id==='other'),true,'Distinct nearby restaurant should remain');
console.log('restaurant dedupe smoke: PASS',JSON.stringify(out.map(x=>({name:x.name,address:x.address,id:x.id}))));
