import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../data/foods.js',import.meta.url),'utf8');
const sandbox={window:{},self:{},globalThis:{}};
vm.createContext(sandbox); vm.runInContext(src,sandbox);
const foods=sandbox.window.DINLIMINATE_FOODS||[];
assert.equal(foods.length,64,'Food image smoke requires the 64-food catalog');
const foodUrls=foods.map(x=>String(x.image||'').trim());
const byId=new Map(foods.map(x=>[x.id,x]));
assert(!byId.has('frozen'),'Stouffer’s Frozen Dinner must be removed');
for(const [id,cuts] of [['lasagna',['Pasta']],['vegetable-lasagna',['Pasta','Healthy']],['salisbury-steak',['Southern','American']],['stuffed-peppers',['Healthy','American']]]){
  assert.ok(byId.has(id),id+' must exist');
  for(const cut of cuts) assert.ok(byId.get(id).quickCuts?.includes(cut),id+' must include Quick Cut '+cut);
  assert.ok(/^https?:\/\//.test(byId.get(id).image||''),id+' must have a real image URL');
}
assert.match(byId.get('stroganoff')?.image||'',/28503619/,'Stroganoff should use the refreshed Pexels image');
assert.equal(foodUrls.length,64,'Each built-in food should be present in the image audit');
assert.equal(foodUrls.filter(x=>/^https?:\/\//.test(x)).length,64,'Each built-in food should have an external image URL');
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
