/* PALA recovery service worker v168
   Network-first navigation with no app cache. This intentionally clears all
   previous PALA caches so Safari/PWA clients cannot stay on a stale build. */

self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('pala-')).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function withAppExtensions(response){
  if(!response)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  html=html.replace(/<script\s+src=["']calendar-stability\.js[^"']*["']><\/script>/gi,'');
  html=html.replace(/<script\s+src=["']calendar-order-fixes\.js[^"']*["']><\/script>/gi,'');
  if(!html.includes('workshop-edit.js'))html=html.replace('</body>','<script src="workshop-edit.js?v=3"></script></body>');
  html=html.replace(/<script\s+src=["']calendar-controller\.js[^"']*["']><\/script>/gi,'');
  html=html.replace(/<script\s+src=["']calendar-toolbar\.js[^"']*["']><\/script>/gi,'');
  html=html.replace(/<script\s+src=["']settings-icon\.js[^"']*["']><\/script>/gi,'');
  html=html.replace(/<script\s+src=["']warehouse-categories\.js[^"']*["']><\/script>/gi,'');
  html=html.replace('</body>','<script src="calendar-controller.js?v=9"></script><script src="calendar-toolbar.js?v=1"></script><script src="settings-icon.js?v=4"></script><script src="warehouse-categories.js?v=1"></script></body>');
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(withAppExtensions));
  }
});
