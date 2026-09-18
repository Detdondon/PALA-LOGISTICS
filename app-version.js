/* PALA visible app version v273 · isolated from core rendering */
(()=>{
'use strict';
const VERSION='v273';
window.PALA_APP_VERSION=VERSION;
let tries=0;
function apply(){
  const badge=document.querySelector('.app-version');
  if(badge)badge.textContent=VERSION;
  if(!badge&&tries++<20)setTimeout(apply,250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
else apply();
})();
