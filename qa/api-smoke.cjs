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
 if(health.statusCode!==200||!health.body?.ok)throw new Error('health failed');
 const suggestion=await call({mode:'suggest',q:'37040'});
 if(suggestion.statusCode!==200||!suggestion.body?.ok||!suggestion.body.results?.length)throw new Error('address suggestions failed');
 const resolved=await call({mode:'resolve',q:'Clarksville, TN 37040'});
 if(resolved.statusCode!==200||!resolved.body?.ok)throw new Error('address resolve failed: '+JSON.stringify(resolved.body));
 const search=await call({mode:'search',lat:resolved.body.lat,lon:resolved.body.lon,radius:'10'});
 if(search.statusCode!==200||!search.body?.ok)throw new Error('restaurant search failed: '+JSON.stringify(search.body));
 if(!Array.isArray(search.body.results))throw new Error('restaurant results missing');
 console.log(JSON.stringify({health:health.body,suggestions:suggestion.body.results.length,resolved:resolved.body.display,restaurantCount:search.body.total,fastFoodCount:search.body.fastFoodCount,providers:search.body.providers}));
})().catch(err=>{console.error(err);process.exit(1)});
