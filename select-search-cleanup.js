/* PALA v238 · remove redundant auto-search fields from select controls */
(()=>{
'use strict';
if(window.__palaSelectSearchCleanupV238)return;
window.__palaSelectSearchCleanupV238=true;

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
}

// Stop the legacy enhancer from adding new search boxes.
try{window.installWarehouseSelectSearch=function(root=document){cleanup(root)}}catch(_e){}

cleanup();
const root=document.body;
if(root){
  let queued=false;
  new MutationObserver(records=>{
    if(!records.some(record=>record.addedNodes.length))return;
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;cleanup()});
  }).observe(root,{childList:true,subtree:true});
}
})();