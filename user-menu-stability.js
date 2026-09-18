/* PALA v232 · stable header user menu
   Preserve open state when background data refresh calls syncLoginUi and rebuilds header-actions. */
(()=>{
'use strict';
if(window.__palaStableUserMenuV232)return;
window.__palaStableUserMenuV232=true;

function menuOpen(){return document.getElementById('userMenuPopover')?.classList.contains('open')||false}
function restoreOpen(){
  const menu=document.getElementById('userMenuPopover'),button=document.querySelector('.header-user-button');
  if(menu){menu.classList.add('open');if(button)button.setAttribute('aria-expanded','true')}
}
const base=window.syncLoginUi;
if(typeof base==='function'&&!base.__palaMenuStateV232){
  const wrapped=function(){
    const wasOpen=menuOpen();
    const result=base.apply(this,arguments);
    if(wasOpen)queueMicrotask(restoreOpen);
    return result;
  };
  wrapped.__palaMenuStateV232=true;
  window.syncLoginUi=wrapped;
}

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&menuOpen()){
    if(typeof closeUserMenu==='function')closeUserMenu();
    document.querySelector('.header-user-button')?.focus();
  }
});
})();