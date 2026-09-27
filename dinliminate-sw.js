/* Dinliminate P641 recovery service worker.
   Purpose: retire the older P636 shell/cache cleanly.
   This service worker unregisters itself after clearing old caches. */
const RECOVERY='dinliminate-recovery-p641';
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type:'window', includeUncontrolled:true }))
      .then(clients => clients.forEach(client => client.postMessage({ type:'DINLIMINATE_CACHE_RESET', version:RECOVERY })))
      .then(() => self.clients.claim())
  );
});
