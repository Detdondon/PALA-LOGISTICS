/* PALA service worker v171 · emergency pass-through
   No HTML rewriting and no app cache. The root bootstrap is now authoritative. */
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('pala-')).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
