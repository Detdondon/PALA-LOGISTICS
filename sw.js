/* PALA service worker v270 · precached bundled runtime + safe network-first HTML */
const CACHE_NAME='pala-static-v270';
const CACHE_PREFIX='pala-';
const STATIC_EXT=/\.(?:js|css|svg|png|jpg|jpeg|webp|gif|ico|ttf|otf|woff2?|webmanifest)$/i;
const CORE_ASSETS=[
  './',
  './Logo.png',
  './manifest.webmanifest',
  './pala-core-runtime.js?v=269',
  './pala-ui-runtime.js?v=269',
  './pala-shell-runtime.js?v=269'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE_ASSETS.map(async url=>{
      const response=await fetch(url,{cache:'reload'});
      if(response&&response.ok)await cache.put(url,response.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  const acceptsHtml=request.mode==='navigate'||(request.headers.get('accept')||'').includes('text/html');
  if(acceptsHtml){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response&&response.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put(request,response.clone()).catch(()=>{});
        }
        return response;
      }catch(error){
        const cached=await caches.match(request)||await caches.match('./');
        if(cached)return cached;
        throw error;
      }
    })());
    return;
  }

  if(!STATIC_EXT.test(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request);
    const refresh=fetch(request).then(response=>{
      if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
      return response;
    }).catch(()=>null);
    if(cached){
      event.waitUntil(refresh);
      return cached;
    }
    const response=await refresh;
    return response||fetch(request);
  })());
});
