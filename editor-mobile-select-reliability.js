/* PALA v365 · reliable native single-select menus on touch devices without global DOM rescans. */
(()=>{
'use strict';
if(window.__palaEditorMobileSelectReliabilityV365)return;
window.__palaEditorMobileSelectReliabilityV365=true;

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

const pending=new Set();
let queued=false;
function queueEditor(editor){
  if(!editor||!editor.isConnected)return;
  pending.add(editor);
  if(queued)return;
  queued=true;
  queueMicrotask(()=>requestAnimationFrame(()=>{
    queued=false;
    const roots=[...pending];pending.clear();
    roots.forEach(root=>{if(root.isConnected)sweep(root)});
  }));
}
function collectEditors(node){
  if(!node||node.nodeType!==1||!touchCapable())return;
  if(node.matches?.(ROOTS))queueEditor(node);
  node.querySelectorAll?.(ROOTS)?.forEach(queueEditor);
  if(node.matches?.('select:not([multiple])'))queueEditor(node.closest?.(ROOTS));
  node.querySelectorAll?.('select:not([multiple])')?.forEach(select=>queueEditor(select.closest(ROOTS)));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>sweep(document),{once:true});
else sweep(document);

const body=document.body;
if(body){
  new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes)collectEditors(node);
    }
  }).observe(body,{childList:true,subtree:true});
}

// Catch editors created synchronously immediately before the first user tap.
document.addEventListener('pointerdown',event=>{
  if(!touchCapable())return;
  const editor=event.target?.closest?.(ROOTS);
  if(editor)sweep(editor);
},true);
})();