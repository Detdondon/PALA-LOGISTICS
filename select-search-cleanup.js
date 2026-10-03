/* PALA v353 · keep warehouse category placement as a reliable native select */
(()=>{
'use strict';
if(window.__palaSelectSearchCleanupV353)return;
window.__palaSelectSearchCleanupV353=true;

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
    queueMicrotask(()=>{
      queued=false;
      cleanup();
      // PALAEditor may enhance a newly inserted select in the same mutation turn.
      // Re-check on the next frame so s_category_id always ends as the native control.
      requestAnimationFrame(()=>cleanup());
    });
  }).observe(root,{childList:true,subtree:true});
}
})();