/* PALA v355 · reliable native single-select menus on touch devices. */
(()=>{
'use strict';
if(window.__palaEditorMobileSelectReliabilityV355)return;
window.__palaEditorMobileSelectReliabilityV355=true;

const ROOTS='#palaEditSheet,.order-editor-page,.workshop-form,.staff-form,.damage-form-card,.admin-special-card,.admin-inventory-editor,.new-tent-form,#ownPinDialog .dialog-card,#staffingExportDialog .dialog-card,#productionPlanExportDialog .dialog-card';
const touchCapable=()=>{
  try{return (navigator.maxTouchPoints||0)>0||window.matchMedia?.('(pointer: coarse)')?.matches}catch(_e){return false}
};
function restore(select){
  if(!select||select.multiple||!touchCapable())return;
  const wrap=select.closest('.pala-select');
  if(!wrap)return;
  try{window.PALAEditor?.closeSelect?.()}catch(_e){}
  select.classList.remove('pala-select-native');
  select.removeAttribute('aria-hidden');
  select.removeAttribute('tabindex');
  select.dataset.palaNativeTouch='1';
  wrap.replaceWith(select);
}
function sweep(root=document){
  if(!touchCapable())return;
  const roots=[];
  if(root?.matches?.(ROOTS))roots.push(root);
  root?.querySelectorAll?.(ROOTS)?.forEach(node=>roots.push(node));
  roots.forEach(editor=>editor.querySelectorAll('select:not([multiple])').forEach(restore));
}
function schedule(root=document){
  queueMicrotask(()=>requestAnimationFrame(()=>sweep(root)));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(document),{once:true});
else schedule(document);

const body=document.body;
if(body){
  new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length))schedule(document);
  }).observe(body,{childList:true,subtree:true});
}

// Catch editors created synchronously immediately before the first user tap.
document.addEventListener('pointerdown',event=>{
  if(!touchCapable())return;
  const editor=event.target?.closest?.(ROOTS);
  if(editor)sweep(editor);
},true);
})();
