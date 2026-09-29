const assert=require('assert/strict');

async function callVercel(){
  const handler=require('../api/restaurant-search');
  let status=200, body=null;
  await handler({url:'/?mode=health',headers:{'x-forwarded-for':'qa-route-vercel'}},{
    status(code){status=code;return this;},
    json(payload){body=payload;return payload;}
  });
  return {status,body};
}

async function callNetlify(){
  const fn=require('../netlify/functions/restaurant-search');
  const out=await fn.handler({queryStringParameters:{mode:'health'},headers:{'x-forwarded-for':'qa-route-netlify'}});
  return {status:out.statusCode,body:JSON.parse(out.body)};
}

(async()=>{
  const v=await callVercel(), n=await callNetlify();
  assert.equal(v.status,200); assert.equal(v.body.ok,true); assert.equal(v.body.version,'r14');
  assert.equal(n.status,200); assert.equal(n.body.ok,true); assert.equal(n.body.version,'r14');
  console.log('restaurant route adapters: PASS');
})();
