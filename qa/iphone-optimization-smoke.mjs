import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl=(process.env.BASE_URL||'https://deploy-preview-94--diliminate.netlify.app').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});

try{
  for(const viewport of [{width:393,height:852},{width:375,height:667}]){
    const context=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/Chicago'});
    const page=await context.newPage();
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));

    await page.goto(baseUrl+'/?iphone-smoke='+viewport.width+'x'+viewport.height+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(350);

    const home=await page.evaluate(()=>({width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));
    assert.equal(home.scrollWidth,home.clientWidth,'Home should not horizontally overflow');
    assert.ok(home.scrollHeight<=home.height+2,'Home should fit in one viewport');

    const install=await page.locator('#iphoneHelp').boundingBox();
    assert.ok(install&&install.height>=44,'Add to iPhone should have a 44px-or-larger touch target');

    await page.locator('#foodStart').click();
    await page.waitForTimeout(150);
    const foodButtons=await page.evaluate(()=>{const ids=['foodBack','foodCut','foodMaybe','foodHide','addFood'];const out={};for(const id of ids){const el=document.getElementById(id);if(!el)continue;const r=el.getBoundingClientRect();out[id]={width:r.width,height:r.height};}return out;});
    assert.ok(foodButtons.foodCut.width>=60&&foodButtons.foodCut.height>=60,'Meal Cut should remain large');
    assert.ok(foodButtons.foodMaybe.width>=60&&foodButtons.foodMaybe.height>=60,'Meal Maybe should remain large');
    for(const id of ['foodBack','foodHide','addFood']) assert.ok(foodButtons[id].width>=44&&foodButtons[id].height>=44,id+' should have an iPhone-safe target');

    const foodViewport=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,scrollHeight:document.documentElement.scrollHeight,innerHeight}));
    assert.equal(foodViewport.scrollWidth,foodViewport.clientWidth,'Meal screen should not horizontally overflow');
    assert.ok(foodViewport.scrollHeight<=foodViewport.innerHeight+2,'Meal screen should fit in one viewport');

    await page.locator('#foodBackTop').click();
    await page.locator('#restStart').click();
    await page.waitForTimeout(150);

    const formSizes=await page.evaluate(()=>{const ids=['address','radius','restaurantQuery'];const out={};for(const id of ids){const el=document.getElementById(id);if(!el)continue;const cs=getComputedStyle(el),r=el.getBoundingClientRect();out[id]={fontSize:parseFloat(cs.fontSize),height:r.height,width:r.width};}return out;});
    assert.ok(formSizes.address.fontSize>=16,'Restaurant address field must use 16px+ text on iPhone');
    assert.ok(formSizes.radius.fontSize>=16,'Restaurant radius selector must use 16px+ text on iPhone');

    const hours=page.locator('#hoursToggle [data-hours-mode]');
    assert.equal(await hours.count(),2,'Restaurant Open/All controls should both exist');
    assert.deepEqual(await hours.allTextContents(),['Open','All']);
    assert.equal(await hours.nth(0).getAttribute('aria-pressed'),'true');

    const restaurantControls=await page.evaluate(()=>{const ids=['restaurantBackTop','restaurantMenu','locate','find','restaurantSearch'];const out={};for(const id of ids){const el=document.getElementById(id);if(!el)continue;const r=el.getBoundingClientRect();out[id]={width:r.width,height:r.height};}return out;});
    for(const id of Object.keys(restaurantControls)) assert.ok(restaurantControls[id].width>=32&&restaurantControls[id].height>=32,id+' should remain usable');

    const restViewport=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
    assert.equal(restViewport.scrollWidth,restViewport.clientWidth,'Restaurant screen should not horizontally overflow');

    await hours.nth(1).click();
    assert.equal(await hours.nth(1).getAttribute('aria-pressed'),'true');
    await hours.nth(0).click();
    assert.equal(await hours.nth(0).getAttribute('aria-pressed'),'true');

    assert.equal(pageErrors.length,0,'No page errors at '+viewport.width+'x'+viewport.height+': '+pageErrors.join(' | '));
    console.log(JSON.stringify({viewport,home:'PASS',meal:'PASS',restaurant:'PASS',formSizes}));
    await context.close();
  }
}catch(err){
  console.error(String(err?.stack||err));
  process.exitCode=1;
}finally{
  await browser.close();
}
