const CACHE='dinliminate-shell-v1';
const SHELL=['./','./index.html','./styles.css','./app.js','./data/foods.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const imageHosts=['images.pexels.com','images.unsplash.com','commons.wikimedia.org','www.cooksoups.com','snapcalorie-webflow-website.s3.us-east-2.amazonaws.com'];
  if(url.origin!==self.location.origin && !imageHosts.includes(url.hostname))return;
  if(url.origin===self.location.origin && url.pathname.startsWith('/api/'))return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>fetch(req).then(res=>{
    if(res.ok || res.type==='opaque'){
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
    }
    return res;
  }).catch(()=>cached||Response.error())));
});
