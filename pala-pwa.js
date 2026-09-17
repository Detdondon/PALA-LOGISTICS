/* PALA PWA bootstrap v213 */
(function(){
  'use strict';
  if(!('serviceWorker'in navigator))return;
  function register(){navigator.serviceWorker.register('./sw.js?v=202',{scope:'./'}).then(reg=>{window.__palaServiceWorker=reg;}).catch(error=>console.warn('[PALA] service worker registration failed',error));}
  if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
})();
