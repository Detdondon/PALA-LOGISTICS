const CACHE='pala-v159-workshop-open-damage-priority';
const CORE=['./fonts/inter-400.ttf','./fonts/inter-700.ttf','./','./index.html','./workshop-edit.js?v=3','./calendar-controller.js?v=9','./Logo.png','./manifest.webmanifest?v=110','./pala-icon.svg?v=110','./pala-icon-32.png?v=110','./pala-icon-180.png?v=110','./pala-icon-192.png?v=110','./pala-icon-512.png?v=110'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pala-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

async function withAppExtensions(response){
  if(!response)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  // Remove the two temporary calendar layers from both fresh and previously cached HTML.
  html=html.replace(/<script\s+src=["']calendar-stability\.js[^"']*["']><\/script>/gi,'');
  html=html.replace(/<script\s+src=["']calendar-order-fixes\.js[^"']*["']><\/script>/gi,'');
  if(!html.includes('workshop-edit.js'))html=html.replace('</body>','<script src="workshop-edit.js?v=3"></script></body>');
  html=html.replace(/<script\s+src=["']calendar-controller\.js[^"']*["']><\/script>/gi,'');html=html.replace('</body>','<script src="calendar-controller.js?v=9"></script></body>');
  const headers=new Headers(response.headers);headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method==='GET'&&new URL(event.request.url).origin===location.origin){
    if(event.request.mode==='navigate'){
      event.respondWith(fetch(event.request).then(withAppExtensions).then(response=>{let copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html').then(withAppExtensions)));
      return;
    }
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{let copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})));
  }
});
