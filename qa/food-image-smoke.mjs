import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../data/foods.js',import.meta.url),'utf8');
const sandbox={window:{},self:{},globalThis:{}};
vm.createContext(sandbox); vm.runInContext(src,sandbox);
const foods=sandbox.window.DINLIMINATE_FOODS||[];
assert.equal(foods.length,65,'Food image smoke requires the 65-food catalog');
const foodUrls=foods.map(x=>String(x.image||'').trim());
const byId=new Map(foods.map(x=>[x.id,x]));
assert(!byId.has('frozen'),'Stouffer’s Frozen Dinner must be removed');
for(const [id,cuts] of [['lasagna',['Pasta']],['vegetable-lasagna',['Pasta','Healthy']],['salisbury-steak',['Southern','American']],['stuffed-peppers',['Healthy','American']]]){
  assert.ok(byId.has(id),id+' must exist');
  for(const cut of cuts) assert.ok(byId.get(id).quickCuts?.includes(cut),id+' must include Quick Cut '+cut);
  assert.ok(/^https?:\/\//.test(byId.get(id).image||''),id+' must have a real image URL');
}
assert.match(byId.get('stroganoff')?.image||'',/29935503/,'Stroganoff should use the refreshed stroganoff image');
assert.equal(foodUrls.length,65,'Each built-in food should be present in the image audit');
assert.equal(foodUrls.filter(x=>/^https?:\/\//.test(x)).length,65,'Each built-in food should have an external image URL');
const urls=[...new Set(foodUrls.filter(x=>/^https?:\/\//.test(x)))];

const bad=[];
let cursor=0;
async function worker(){
  while(true){
    const i=cursor++; if(i>=urls.length)return;
    const url=urls[i];
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),7000);
    try{
      const res=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'Dinliminate-Image-QA/1.0'}});
      if(!res.ok)bad.push({url,status:res.status});
      else {
        const type=String(res.headers.get('content-type')||'');
        if(!type.startsWith('image/'))bad.push({url,status:res.status,type});
      }
    }catch(e){bad.push({url,error:String(e?.message||e)});}
    finally{clearTimeout(timer);}
  }
}
await Promise.all(Array.from({length:8},()=>worker()));
assert.equal(bad.length,0,'Broken food image URLs: '+JSON.stringify(bad.slice(0,12)));
console.log(JSON.stringify({foodCount:foods.length,checked:urls.length,broken:bad.length}));

assert.match(byId.get('lasagna')?.image||'',/5949921/,'Lasagna should use the refreshed plated-lasagna photo');
assert.match(byId.get('vegetable-lasagna')?.image||'',/29050589/,'Vegetable Lasagna should use the refreshed vegetable-lasagna photo');
assert.match(byId.get('stuffed-peppers')?.image||'',/19359972/,'Stuffed Peppers should use the refreshed stuffed-peppers photo');

const imageExpectations={
 tacos:/33614195/,
 "stir-fry":/31673757/,
 meatloaf:/2397401/,
 "buttermilk-cornbread":/9704174/,
 "potato-soup":/29653177/,
 "health-shake":/5946722/
};
for(const [id,re] of Object.entries(imageExpectations)) assert.match(byId.get(id)?.image||'',re,id+' should use its refreshed accurate image');
assert.equal(byId.get('cheerios')?.name,'Cereal','Cheerios Cereal should be renamed to Cereal');
assert.ok(Array.isArray(byId.get('health-shake')?.quickCuts)&&byId.get('health-shake').quickCuts.length===1&&byId.get('health-shake').quickCuts[0]==='Healthy','Health Shake should be associated with Healthy Quick Cut');
assert.ok(byId.get('health-shake')?.ingredients?.length&&byId.get('health-shake')?.nutrition&&byId.get('health-shake')?.recipe,'Health Shake should have Details-ready nutrition, ingredients, and recipe data');
