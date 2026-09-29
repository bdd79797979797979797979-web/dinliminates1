import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../data/foods.js',import.meta.url),'utf8');
const sandbox={window:{},self:{},globalThis:{}};
vm.createContext(sandbox); vm.runInContext(src,sandbox);
const foods=sandbox.window.DINLIMINATE_FOODS||[];
assert.equal(foods.length,65,'Food image smoke requires the 65-food catalog');
const foodUrls=foods.map(x=>String(x.image||'').trim());
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
