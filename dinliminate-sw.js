const CACHE='dinliminate-shell-p636-clean-final';
const SHELL=['/','/index.html','/api/clean-entry','/dinliminate.webmanifest','/dinliminate-icon-180.png','/dinliminate-icon-512.png','/p636-clean-ui.css','/launch-hardening.css','/launch-hardening.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(e.request.method!=='GET')return;
  if(u.pathname.endsWith('/api/restaurant-search')){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||new Response(JSON.stringify({ok:false,code:'OFFLINE',message:'You are offline. Your last restaurant search may still be available.'}),{status:503,headers:{'Content-Type':'application/json'}}))));
    return;
  }
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('/',copy)).catch(()=>{});return r}).catch(()=>caches.match('/').then(r=>r||caches.match('/index.html'))));return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy)).catch(()=>{});return r})));
});
