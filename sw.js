const CACHE='pala-v111-workshop-edit';
const CORE=['./fonts/inter-400.ttf','./fonts/inter-700.ttf','./','./index.html','./workshop-edit.js?v=1','./Logo.png','./manifest.webmanifest?v=110','./pala-icon.svg?v=110','./pala-icon-32.png?v=110','./pala-icon-180.png?v=110','./pala-icon-192.png?v=110','./pala-icon-512.png?v=110'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pala-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

async function withWorkshopEdit(response){
  if(!response)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  if(!html.includes('workshop-edit.js'))html=html.replace('</body>','<script src="workshop-edit.js?v=1"></script></body>');
  const headers=new Headers(response.headers);headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(withWorkshopEdit).then(response=>{let copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html').then(withWorkshopEdit)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{let copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})));
});
