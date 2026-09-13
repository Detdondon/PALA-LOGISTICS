/* PALA recovery service worker v170
   Network-first navigation, no app cache, stable Supabase SDK and startup guard. */

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

const STARTUP_GUARD=`<script>(function(){
  window.__palaStartupError='';
  window.addEventListener('error',function(e){window.__palaStartupError=(e&&e.message)||'JavaScript-fejl';});
  window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;window.__palaStartupError=(r&&r.message)||String(r||'Promise-fejl');});
  setTimeout(function(){
    var host=document.getElementById('app');
    if(!host)return;
    var txt=String(host.textContent||'');
    if(txt.indexOf('Indlæser')===-1)return;
    var card=document.createElement('div');card.className='card';
    var h=document.createElement('h2');h.textContent='PALA kunne ikke starte';card.appendChild(h);
    var p=document.createElement('p');p.className='muted';p.textContent=window.__palaStartupError||'Opstarten fik ikke svar inden for 15 sekunder.';card.appendChild(p);
    var b=document.createElement('button');b.className='btn primary';b.textContent='Prøv igen';b.onclick=function(){location.reload()};card.appendChild(b);
    host.replaceChildren(card);
  },15000);
})();<\/script>`;

const STABLE_SUPABASE='<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.3/dist/umd/supabase.js" onerror="this.onerror=null;this.src=\'https://unpkg.com/@supabase/supabase-js@2.45.3/dist/umd/supabase.js\'"></script>';

async function withAppExtensions(response){
  if(!response)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();

  // Never allow an unpinned or newly released Supabase browser SDK to decide production startup.
  html=html.replace(
    /<script\s+src=["']https:\/\/(?:cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2|unpkg\.com\/@supabase\/supabase-js@2\.116\.0\/dist\/umd\/supabase\.js)["'][^>]*><\/script>/i,
    STABLE_SUPABASE
  );
  if(!html.includes('__palaStartupError'))html=html.replace('</head>',STARTUP_GUARD+'</head>');

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
    if(url.pathname.endsWith('/recovery.html')){
      event.respondWith(fetch(event.request,{cache:'no-store'}));
      return;
    }
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(withAppExtensions));
  }
});
