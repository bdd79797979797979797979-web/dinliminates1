const handler=require('../api/restaurants.js');
function call(query){
  return new Promise((resolve,reject)=>{
    let out={statusCode:200,body:null};
    const res={status(code){out.statusCode=code;return res},json(body){out.body=body;resolve(out);return res}};
    Promise.resolve(handler({query,headers:{}},res)).catch(reject);
  });
}
(async()=>{
 const health=await call({mode:'health'});
 if(health.statusCode!==200||!health.body?.ok||health.body.version!=='r13')throw new Error('health failed: '+JSON.stringify(health.body));
 const suggestion=await call({mode:'suggest',q:'37040'});
 if(suggestion.statusCode!==200||!suggestion.body?.ok||!suggestion.body.results?.length)throw new Error('address suggestions failed');
 const resolved=await call({mode:'resolve',q:'Clarksville, TN 37040'});
 if(resolved.statusCode!==200||!resolved.body?.ok)throw new Error('address resolve failed: '+JSON.stringify(resolved.body));
 const search=await call({mode:'search',lat:resolved.body.lat,lon:resolved.body.lon,radius:'10'});
 if(search.statusCode!==200||!search.body?.ok)throw new Error('restaurant search failed: '+JSON.stringify(search.body));
 if(search.body.version!=='r13')throw new Error('search version mismatch: '+search.body.version);
 if(typeof search.body.timezone!=='string'||!search.body.timezone)throw new Error('search timezone missing');
 const falseFast=(search.body.results||[]).filter(x=>/(ruby tuesday|applebee|chili.?s|olive garden|longhorn|outback|cracker barrel|texas roadhouse|red lobster|panera)/i.test(String(x.name||''))&&x.fastFood);
 if(falseFast.length)throw new Error('full-service chain incorrectly classified as fast food: '+falseFast.map(x=>x.name).join(', '));
 if(Number(search.body.fastFoodCount)>=2 && Number(search.body.providers?.overpass||0)!==0)throw new Error('Overpass should not run when primary providers already return multiple fast-food results');
 if(!Array.isArray(search.body.results))throw new Error('restaurant results missing');
 if(!(Number(search.body.fastFoodCount)>=1))throw new Error('live restaurant search returned no fast-food results: '+JSON.stringify({total:search.body.total,fastFoodCount:search.body.fastFoodCount,providers:search.body.providers}));
 const badCoords=await call({mode:'search',lat:999,lon:-87,radius:'10'}); if(badCoords.statusCode!==400)throw new Error('invalid latitude should return 400');
 const exact=await call({mode:'resolve',q:'801 Iron Workers Rd, Clarksville, TN 37043'});
 if(exact.statusCode!==200||!exact.body?.ok)throw new Error('Iron Workers address resolve failed: '+JSON.stringify(exact.body));
 const local=await call({mode:'search',lat:exact.body.lat,lon:exact.body.lon,radius:'10'});
 if(local.statusCode!==200||!local.body?.ok)throw new Error('Iron Workers restaurant search failed: '+JSON.stringify(local.body));
 const localNames=(local.body.results||[]).map(x=>String(x.name||'').toLowerCase());
 const required=['ruby tuesday','chipotle','thirsty goat'];
 for(const name of required) if(!localNames.some(x=>x.includes(name))) throw new Error('Iron Workers search missing '+name+': '+JSON.stringify({total:local.body.total,names:localNames.slice(0,80),providers:local.body.providers}));
 const tight=await call({mode:'search',lat:resolved.body.lat,lon:resolved.body.lon,radius:'1'}); if(tight.statusCode!==200||!tight.body?.ok||tight.body.radiusMiles!==1)throw new Error('1-mile radius failed: '+JSON.stringify(tight.body));
 const wide=await call({mode:'search',lat:resolved.body.lat,lon:resolved.body.lon,radius:'100'}); if(wide.statusCode!==200||!wide.body?.ok||wide.body.radiusMiles!==100)throw new Error('100-mile radius failed: '+JSON.stringify(wide.body));
 console.log(JSON.stringify({health:health.body,suggestions:suggestion.body.results.length,resolved:resolved.body.display,restaurantCount:search.body.total,fastFoodCount:search.body.fastFoodCount,providers:search.body.providers,ironWorkers:{display:exact.body.display,total:local.body.total,names:(local.body.results||[]).filter(x=>required.some(n=>String(x.name||'').toLowerCase().includes(n))).map(x=>x.name)}}));
})().catch(err=>{console.error(err);process.exit(1)});
