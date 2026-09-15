/* PALA v188 · unified warehouse list rows
   Hardware items and category rows share one visual language.
   Every category starts collapsed and opens only when pressed. */
(()=>{
'use strict';
if(window.__palaWarehouseListConsistencyV188)return;
window.__palaWarehouseListConsistencyV188=true;

const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
const escHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function directChildCategories(details){
  const body=details.querySelector(':scope > .warehouse-category-body-v183');
  const host=body?.querySelector(':scope > .warehouse-category-children-v183');
  return host?[...host.children].filter(node=>node.matches?.('details.warehouse-category-v183')):[];
}

function enhanceCategory(details){
  if(!details||details.dataset.palaUnifiedWarehouseRow==='1')return;
  const summary=details.querySelector(':scope > summary');
  const body=details.querySelector(':scope > .warehouse-category-body-v183');
  if(!summary||!body)return;

  const title=text(summary.querySelector('.warehouse-category-title-v183'))||'Kategori';
  const countText=text(summary.querySelector('.warehouse-category-count-v183'))||'0';
  const count=Number(countText.replace(/[^0-9]/g,''))||0;
  const hasChildren=directChildCategories(details).length>0;

  details.dataset.palaUnifiedWarehouseRow='1';
  details.classList.add('warehouse-category-unified-v187',hasChildren?'has-subcategories-v187':'leaf-category-v187');
  details.open=false;

  const icon=typeof uiIcon==='function'?uiIcon(hasChildren?'list':'box'):'';
  const chevron=typeof uiIcon==='function'?uiIcon('chevronRight'):'';
  summary.innerHTML=`<span class="warehouse-item-icon">${icon}</span><span class="warehouse-item-body"><strong>${escHtml(title)}</strong><small>${hasChildren?'Kategori med underkategorier':'Kategori'}</small><span class="warehouse-stock">${count} ${count===1?'post':'poster'}</span></span><span class="warehouse-category-unified-chevron-v187">${chevron}</span>`;
}

function enhanceWarehouse(root=document){
  const categories=[];
  if(root?.matches?.('details.warehouse-category-v183'))categories.push(root);
  root?.querySelectorAll?.('details.warehouse-category-v183')?.forEach(node=>categories.push(node));
  categories.forEach(enhanceCategory);
}

let queued=false;
function schedule(root=document){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;enhanceWarehouse(root)});
}

const baseShowTents=window.showTents;
if(typeof baseShowTents==='function')window.showTents=async function(){
  const result=await baseShowTents.apply(this,arguments);
  enhanceWarehouse(document.getElementById('app')||document);
  return result;
};

const app=document.getElementById('app');
if(app)new MutationObserver(records=>{
  let relevant=false;
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===1&&(node.matches?.('.warehouse-category-v183,.warehouse-root-list-v183')||node.querySelector?.('.warehouse-category-v183'))){relevant=true;break}
    }
    if(relevant)break;
  }
  if(relevant)schedule(app);
}).observe(app,{childList:true,subtree:true});

if(!document.getElementById('pala-warehouse-list-consistency-v188-style')){
  const style=document.createElement('style');
  style.id='pala-warehouse-list-consistency-v188-style';
  style.textContent=`
    .warehouse-root-list-v183{gap:0!important}
    .warehouse-root-list-v183>.warehouse-list-v183{gap:0!important;padding:0!important}
    .warehouse-category-unified-v187{border:0!important;border-radius:0!important;background:#fff!important;overflow:visible!important;margin:0!important}
    .warehouse-category-unified-v187>summary{list-style:none!important;display:flex!important;align-items:center!important;gap:12px!important;min-height:58px!important;padding:14px!important;background:#fff!important;border:0!important;border-bottom:1px solid #edf0f5!important;border-radius:0!important;font-weight:400!important;cursor:pointer!important}
    .warehouse-category-unified-v187>summary::-webkit-details-marker{display:none!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-icon{flex:0 0 40px!important;width:40px!important;height:40px!important;display:flex!important;align-items:center!important;justify-content:center!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body{flex:1 1 auto!important;min-width:0!important;display:block!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body strong{display:block!important;font-size:15px!important;font-weight:600!important;color:inherit!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body small{display:block!important;margin-top:2px!important;font-size:12px!important;color:#738198!important;font-weight:500!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body .warehouse-stock{display:block!important;margin-top:4px!important;font-size:12px!important;color:#5b687e!important;font-weight:500!important}
    .warehouse-category-unified-chevron-v187{flex:0 0 24px!important;width:24px!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:transform .16s ease!important;color:#405574!important}
    .warehouse-category-unified-v187[open]>summary>.warehouse-category-unified-chevron-v187{transform:rotate(90deg)!important}
    .warehouse-category-unified-v187>.warehouse-category-body-v183{padding:0!important}
    .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-list-v183{padding:0 0 0 18px!important;gap:0!important}
    .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-category-children-v183{margin:0 0 0 18px!important;padding:0!important;border-left:1px solid #e8edf3!important;gap:0!important}
    .warehouse-category-unified-v187 .warehouse-item-v183{border-radius:0!important;margin:0!important}
    @media(max-width:600px){
      .warehouse-category-unified-v187>summary{min-height:56px!important;padding:12px!important;gap:10px!important}
      .warehouse-category-unified-v187>summary>.warehouse-item-icon{width:32px!important;height:32px!important;flex-basis:32px!important}
      .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-list-v183{padding-left:12px!important}
      .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-category-children-v183{margin-left:12px!important}
    }
  `;
  document.head.appendChild(style);
}

enhanceWarehouse(document.getElementById('app')||document);
})();
