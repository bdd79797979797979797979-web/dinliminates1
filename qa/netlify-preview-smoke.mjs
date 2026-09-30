import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl=process.env.BASE_URL||'https://deploy-preview-53--diliminate.netlify.app';
const url=baseUrl.replace(/\/$/,'')+'/?remote-smoke='+Date.now();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,timezoneId:'America/Chicago'});
await context.grantPermissions(['geolocation'],{origin:baseUrl.replace(/\/$/,'')});
await context.setGeolocation({latitude:40,longitude:-75});
const page=await context.newPage();
const pageErrors=[]; const consoleErrors=[]; const failed=[]; const badResponses=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});