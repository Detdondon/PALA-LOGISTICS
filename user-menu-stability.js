/* PALA v231 · stable header user menu
   Prevents the global document click handlers from immediately closing the popover. */
(()=>{
'use strict';
if(window.__palaStableUserMenuV231)return;
window.__palaStableUserMenuV231=true;

function bind(root=document){
  root.querySelectorAll?.('.user-menu').forEach(menu=>{
    if(menu.dataset.palaStableMenu==='1')return;
    menu.dataset.palaStableMenu='1';
    menu.addEventListener('click',event=>event.stopPropagation());
    menu.addEventListener('pointerup',event=>event.stopPropagation());
  });
}
bind();
new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
  if(node.nodeType===1){if(node.matches?.('.user-menu'))bind(node.parentElement||document);else bind(node);}
}))).observe(document.documentElement,{childList:true,subtree:true});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.getElementById('userMenuPopover')?.classList.contains('open')){
    closeUserMenu?.();document.querySelector('.header-user-button')?.focus();
  }
});
})();