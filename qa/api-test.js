process.env.GOOGLE_PLACES_API_KEY='qa-key';
const assert=require('node:assert/strict');
const modPath=require.resolve('../api/restaurant-search.js');
delete require.cache[modPath];
const handler=require('../api/restaurant-search.js');

const calls=[];
class MockResponse{
  constructor(body,status=200,headers={}){this._body=body;this.status=status;this.headers=new Map(Object.entries(headers));this.body=body;this.ok=status>=200&&status<300;}
  async text(){return typeof this._body==='string'?this._body:JSON.stringify(this._body);}
  async arrayBuffer(){return Buffer.isBuffer(this._body)?this._body:Buffer.from(String(this._body));}
}
global.fetch=async (url,options={})=>{
  calls.push({url,method:options.method||'GET'});
  if(String(url).includes('places.googleapis.com/v1/places:searchNearby')){
    return new MockResponse({places:[{id:'g1',displayName:{text:'QA Burger King'},formattedAddress:'1 Main St, QA City',location:{latitude:36.53,longitude:-87.36},primaryType:'american_restaurant',types:['american_restaurant','restaurant'],rating:4.2,regularOpeningHours:{openNow:true,weekdayDescriptions:['Mon: 10 AM–10 PM']},googleMapsUri:'https://maps.google.com/?q=qa',photos:[{name:'places/qa-photo'}]}]});
  }
  if(String(url).includes('postpass.geofabrik.de')){
    return new MockResponse({result:[{osm_type:'n',osm_id:2,lat:36.531,lon:-87.361,tags:{name:'QA Diner',amenity:'restaurant','addr:housenumber':'2','addr:street':'Main St','addr:city':'QA City'}}]});
  }
  if(String(url).includes('/media?')) return new MockResponse(Buffer.from('JPEGDATA'),200,{'content-type':'image/jpeg'});
  throw new Error('Unexpected URL '+url);
};

function makeReq(query={},headers={}){return {query,headers,socket:{remoteAddress:'127.0.0.9'}};}
function makeRes(){
  const out={statusCode:200,headers:{},body:null};
  return Object.assign(out,{setHeader(k,v){out.headers[k]=v},status(c){out.statusCode=c;return out},json(v){out.body=v;return out},end(v){out.body=v;return out}});
}

(async()=>{
  let req=makeReq({mode:'health'}),res=makeRes();await handler(req,res);assert.equal(res.statusCode,200);assert.equal(res.body.version,'restaurant-v636-final');
  req=makeReq({mode:'search',lat:'36.5298',lon:'-87.3595',radius:'5'});res=makeRes();await handler(req,res);assert.equal(res.statusCode,200);assert.equal(res.body.results.length,2);assert.equal(res.body.results[0].photoName,'places/qa-photo');assert.match(res.headers['Cache-Control'],/s-maxage=90/);assert.equal('postpassEndpoint' in res.body.diagnostics,false);
  const photoReq=makeReq({mode:'photo',name:'places/qa-photo'});res=makeRes();await handler(photoReq,res);assert.equal(res.statusCode,200);assert.equal(Buffer.from(res.body).toString(),'JPEGDATA');assert.equal(res.headers['Content-Type'],'image/jpeg');
  // Bad-coordinate protection.
  req=makeReq({mode:'search',lat:'999',lon:'0',radius:'5'});res=makeRes();await handler(req,res);assert.equal(res.statusCode,400);assert.equal(res.body.code,'BAD_COORDINATES');
  // Same-client rate-limit protection for search.
  let limited=0;for(let i=0;i<25;i++){req=makeReq({mode:'search',lat:'0',lon:'0',radius:'1'},{'x-forwarded-for':'127.0.0.10'});res=makeRes();await handler(req,res);if(res.statusCode===429)limited++;}
  assert.equal(limited,1);
  console.log(JSON.stringify({ok:true,googleCalls:calls.filter(x=>x.url.includes('places:searchNearby')).length,postpassCalls:calls.filter(x=>x.url.includes('postpass')).length,photoCalls:calls.filter(x=>x.url.includes('/media?')).length,rateLimited:limited}));
})().catch(e=>{console.error(e);process.exit(1)});
