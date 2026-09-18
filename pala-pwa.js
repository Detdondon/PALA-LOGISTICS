/* PALA PWA bootstrap v274 */
(function(){
  'use strict';
  if(!('serviceWorker'in navigator))return;
  function register(){
    navigator.serviceWorker.register('./sw.js?v=255',{scope:'./'}).then(reg=>{
      window.__palaServiceWorker=reg;
      reg.update().catch(()=>{});
      if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
    }).catch(error=>console.warn('[PALA] service worker registration failed',error));
  }
  if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
})();
