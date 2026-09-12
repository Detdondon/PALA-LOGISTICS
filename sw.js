const CACHE='pala-v109';
const CORE=['./fonts/inter-400.ttf','./fonts/inter-700.ttf','./','./index.html','./Logo.png','./manifest.webmanifest?v=109','./pala-icon.svg?v=109','./pala-icon-32.png?v=109','./pala-icon-180.png?v=109','./pala-icon-192.png?v=109','./pala-icon-512.png?v=109'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pala-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{let copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{let copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})));
});
