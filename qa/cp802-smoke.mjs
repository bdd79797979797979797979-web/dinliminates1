import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.b64':'text/plain','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
  const raw=req.url||'/';
  const pathname=decodeURIComponent(raw.split('?')[0]);
  if(pathname.startsWith('/api/image')){
    const tiny=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    res.writeHead(200,{'Content-Type':'image/png'});res.end(tiny);return;
  }
  const rel=pathname==='/'?'index.html':pathname.replace(/^\//,'');
  const file=path.join(root,rel);
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/?qa=1',{waitUntil:'networkidle'});
assert.equal(errors.length,0,'CP802 Home must have no JS page errors');

const homeBg=await page.evaluate(()=>{
 const app=document.querySelector('.app'), c=getComputedStyle(app);
 return {bg:c.backgroundImage,homeClass:app.classList.contains('home-active')};
});
assert.ok(homeBg.homeClass,'Home shell must be active initially');
assert.ok(homeBg.bg.includes('1758568938040-fb8b7275ca5f'),'Exact door background photo must be the Home shell background');

for(const id of ['menu']){
 const c=await page.locator('#'+id).evaluate(el=>{const s=getComputedStyle(el);return {bg:s.backgroundColor,border:s.borderTopColor,blur:s.backdropFilter,color:s.color}});
 assert.ok(c.bg.includes('rgba') || c.bg.startsWith('rgba'),'Menu must be translucent');
 assert.ok(c.border.toLowerCase().includes('198'),'Menu border must use gold');
}
await page.locator('#foodStart').click();
await page.waitForTimeout(120);
assert.equal(await page.locator('#food').isVisible(),true);
const foodTop=await page.locator('#food .decision-back').evaluate(el=>{const s=getComputedStyle(el);return {color:s.color,bg:s.backgroundColor,border:s.borderTopColor}});
assert.ok(foodTop.color.includes('242, 213, 155') || foodTop.color.includes('rgb(242, 213, 155)') || /242, 213, 155/.test(foodTop.color),'Top-left Back must be gold');
await page.locator('#foodBackTop').click();
await page.waitForTimeout(120);
const homeBg2=await page.evaluate(()=>getComputedStyle(document.querySelector('.app')).backgroundImage);
assert.ok(homeBg2.includes('1758568938040-fb8b7275ca5f'),'Door background must persist after returning Home');

await page.locator('#restStart').click();
await page.waitForTimeout(300);
assert.equal(await page.locator('#restaurant').isVisible(),true);
const restBack=await page.locator('#restaurant .decision-back').evaluate(el=>getComputedStyle(el).color);
assert.equal(restBack,foodTop.color,'Restaurant Back must use the same gold color as Meals Back: '+restBack);
await page.locator('#restaurantBackTop').click();
await page.waitForTimeout(120);
const homeBg3=await page.evaluate(()=>getComputedStyle(document.querySelector('.app')).backgroundImage);
assert.ok(homeBg3.includes('1758568938040-fb8b7275ca5f'),'Door background must persist after restaurant return');

await page.evaluate(()=>{
 const panel=document.querySelector('#hungryWheelPanel');
 panel.classList.remove('hidden');
 panel.setAttribute('aria-hidden','false');
 window.__DINLIMINATE_TEST__.renderHungryWheel();
});
await page.waitForTimeout(100);
assert.equal(await page.locator('#hungryWheel .wheel-segment').count(),116,'Wheel must use all 116 active meals as slices');
assert.equal(await page.locator('#hungryWheel .wheel-label').count(),0,'Wheel must contain no meal-name labels');
assert.equal(await page.locator('#hungryWheel').locator('title').count(),0,'Wheel must contain no hidden meal-name titles');

const spin=page.locator('#hungryWheelSpin');
assert.equal(await spin.innerText(),'Spin the Wheel');
await spin.click();
await page.waitForTimeout(500);
assert.equal(await spin.innerText(),'Tap Again to Slow','First tap must start a continuous spin and invite the second tap');
assert.equal(await spin.isDisabled(),false,'Spin button must remain tappable during first phase');

await spin.click();
assert.equal(await spin.innerText(),'Slowing…','Second tap must begin the automatic slowdown');
assert.equal(await spin.isDisabled(),true,'Spin button must lock during slowdown');
await page.waitForFunction(()=>document.querySelector('#hungryWheelSpin')?.textContent==='Spin Again',{timeout:7000});
assert.equal(await page.locator('#hungryWheelResult').isVisible(),true,'Wheel must stop itself on a meal');
assert.equal(await page.locator('#hungryWheel .wheel-segment.is-landed').count(),1,'Exactly one final slice must be highlighted');
assert.equal(await page.locator('#hungryWheelChoose').isVisible(),true,'Choose This must appear after the self-stop');

await page.locator('#hungryWheelChoose').click();
await page.waitForTimeout(150);
assert.equal(await page.locator('#winner').isVisible(),true,'Choosing the wheel result must open the winner');
assert.equal(await page.locator('#celebration').isVisible(),true,'Wheel choice must trigger fireworks');
const colors=await page.locator('#celebration .firework-burst span').evaluateAll(xs=>xs.map(x=>x.style.getPropertyValue('--color')).filter(Boolean));
assert.ok(colors.length>0,'Firework particles must exist');
const allowed=['#c6a46a','#f1d894','#fff7df','#d8b86b','#fffaf0'];
assert.ok(colors.every(c=>allowed.includes(c)),'Wheel fireworks must be gold/white only');

console.log('CP802_DOOR_MENU_WHEEL_SMOKE_OK');
await browser.close();
server.close();
