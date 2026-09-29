/* Dinliminate P900 production service worker.
   Network-first navigation; versioned shell cache; old Dinliminate caches retired on activate. */
const CACHE='dinliminate-p900-2026-09-29';
const SHELL=['/','/index.html','/p636-clean-ui.css','/launch-hardening.css','/launch-hardening.js','/dinliminate.webmanifest'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    await self.skipWaiting();
    try{
      const cache=await caches.open(CACHE);
      await cache.addAll(SHELL.map(path=>new Request(path,{cache:'reload'})));
    }catch{}
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('dinliminate-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(req,{cache:'no-store'});
        if(response.ok){
          caches.open(CACHE).then(cache=>cache.put('/',response.clone())).catch(()=>{});
        }
        return response;
      }catch{
        return (await caches.match(req)) || (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }
  if(req.destination==='style'||req.destination==='script'||req.destination==='manifest'){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      try{
        const response=await fetch(req,{cache:'no-store'});
        if(response.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});
        return response;
      }catch{
        return cached || Response.error();
      }
    })());
  }
});
