import assert from 'node:assert/strict';
import handler from '../api/restaurant-search.js';

function call(query) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.statusCode = code; return this; },
      json(data) { resolve({statusCode:this.statusCode, data}); return this; },
      end() { resolve({statusCode:this.statusCode, data:null}); return this; }
    };
    Promise.resolve(handler({query,headers:{},socket:{remoteAddress:'qa-live-search'}},res)).catch(reject);
  });
}

const center = { lat: 36.5277608, lon: -87.3588703, radius: 25 };

const wendy = await call({mode:'search', ...center, q:"Wendy's"});
assert.equal(wendy.statusCode,200,JSON.stringify(wendy.data));
assert.equal(wendy.data.ok,true);
const wRows = wendy.data.results || [];
assert.ok(wRows.length > 0, "Wendy's search returned no restaurants");
assert.ok(wRows.every(r => /wendy/i.test([r.name,r.brand,r.operator].filter(Boolean).join(' '))),
  "Wendy's search returned a non-Wendy result: "+wRows.map(r=>r.name).join(', '));

const burger = await call({mode:'search', ...center, q:'burger'});
assert.equal(burger.statusCode,200,JSON.stringify(burger.data));
assert.equal(burger.data.ok,true);
const bRows = burger.data.results || [];
assert.ok(bRows.length >= 2, 'Burger search should return multiple burger restaurants when the provider data supports them; got '+bRows.length);
assert.ok(bRows.length > 0, 'Burger search returned no restaurants');
const burgerBrands = /\b(?:mcdonalds?|wendys?|burger king|five guys|whataburger|culvers?|sonic|steak n shake|shake shack|hardees?|carls jr|checkers|rallys|white castle|jack in the box|freddys?)\b/i;
for (const r of bRows) {
  const hay=[r.name,r.brand,r.operator,r.category,r.cuisine,...(r.tags||[]),...(r.menuItems||[])].filter(Boolean).join(' ');
  assert.ok(/burger|hamburger/i.test(hay)||burgerBrands.test(hay),
    'Burger search returned non-burger result: '+r.name+' ['+hay+']');
}


const radiusChecks=[];
for(const radius of [15,25,50,75,100]){
  const out=await call({mode:'search',lat:center.lat,lon:center.lon,radius});
  assert.equal(out.statusCode,200,JSON.stringify(out.data));
  const rows=out.data.results||[];
  assert.ok(rows.every(r=>Number(r.distanceMiles)<=radius+0.001),'Radius '+radius+' returned an out-of-radius result.');
  radiusChecks.push({radius,count:rows.length});
}
for(const check of radiusChecks) assert.ok(Number.isInteger(check.count) && check.count>=0);

const pasta = await call({mode:'search', ...center, q:'pasta'});
assert.equal(pasta.statusCode,200,JSON.stringify(pasta.data));
assert.equal(pasta.data.ok,true);
const pRows=pasta.data.results||[];
assert.ok(pRows.length>0,'Pasta search returned no restaurants');
assert.ok(pRows.every(r=>/pasta|italian/i.test([r.name,r.brand,r.operator,r.category,r.cuisine,...(r.tags||[]),...(r.menuItems||[])].filter(Boolean).join(' '))),
  'Pasta search returned a non-pasta result: '+pRows.map(r=>r.name).join(', '));

console.log(JSON.stringify({
  ok:true,
  wendysCount:wRows.length,
  wendysNames:wRows.slice(0,12).map(r=>r.name),
  burgerCount:bRows.length,
  burgerNames:bRows.slice(0,12).map(r=>r.name),
  pastaCount:pRows.length,
  radiusChecks,
  elapsed:{wendys:wendy.data?.diagnostics?.elapsedMs,burger:burger.data?.diagnostics?.elapsedMs,pasta:pasta.data?.diagnostics?.elapsedMs}
},null,2));