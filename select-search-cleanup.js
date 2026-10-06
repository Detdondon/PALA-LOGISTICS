/* PALA v365 · keep warehouse category placement as a reliable native select without global DOM rescans */
(()=>{
'use strict';
if(window.__palaSelectSearchCleanupV365)return;
window.__palaSelectSearchCleanupV365=true;

const TARGET='.stock-select-search,select#s_category_id';

function restoreNativeCategorySelect(root=document){
  const selects=[];
  if(root?.matches?.('select#s_category_id'))selects.push(root);
  root?.querySelectorAll?.('select#s_category_id')?.forEach(select=>selects.push(select));
  selects.forEach(select=>{
    const palaWrap=select.closest('.pala-select');
    if(!palaWrap)return;
    try{window.PALAEditor?.closeSelect?.()}catch(_e){}
    select.classList.remove('pala-select-native');
    select.removeAttribute('aria-hidden');
    select.removeAttribute('tabindex');
    palaWrap.replaceWith(select);
  });
}

function cleanup(root=document){
  const wrappers=[];
  if(root?.matches?.('.stock-select-search'))wrappers.push(root);
  root?.querySelectorAll?.('.stock-select-search')?.forEach(node=>wrappers.push(node));
  wrappers.forEach(wrap=>{
    const select=wrap.querySelector(':scope > select');
    if(select){
      try{delete select.dataset.stockSearch}catch(_e){}
      wrap.replaceWith(select);
    }else{
      wrap.querySelectorAll('input[type="search"]').forEach(input=>input.remove());
    }
  });
  restoreNativeCategorySelect(root);
}

function relevant(node){
  return !!node?.matches?.(TARGET)||!!node?.querySelector?.(TARGET);
}

// Stop the legacy enhancer from adding new search boxes.
try{window.installWarehouseSelectSearch=function(root=document){cleanup(root)}}catch(_e){}

cleanup();
const root=document.body;
if(root){
  const pending=new Set();
  let queued=false;
  function schedule(node){
    if(!node||node.nodeType!==1||!relevant(node))return;
    pending.add(node);
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;
      const roots=[...pending];pending.clear();
      roots.forEach(node=>{if(node.isConnected)cleanup(node)});
      // PALAEditor can enhance the same newly inserted select later in the turn.
      // Re-check only the affected subtrees, never the entire document.
      requestAnimationFrame(()=>roots.forEach(node=>{if(node.isConnected)cleanup(node)}));
    });
  }
  new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes)if(node.nodeType===1)schedule(node);
    }
  }).observe(root,{childList:true,subtree:true});
}
})();