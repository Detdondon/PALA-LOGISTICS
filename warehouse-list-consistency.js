/* PALA v281 · strict single-column warehouse lists + row stock status
   Hardware items and category rows share one visual language.
   Every category starts collapsed and opens only when pressed. */
(()=>{
'use strict';
if(window.__palaWarehouseListConsistencyV281)return;
window.__palaWarehouseListConsistencyV281=true;

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

function promoteWarehouseItemStatuses(root=document){
  try{if(typeof enhanceWarehouseStatuses==='function')enhanceWarehouseStatuses(root)}catch(_){}

  root?.querySelectorAll?.('.warehouse-item')?.forEach(row=>{
    const body=row.querySelector('.warehouse-item-body');
    if(!body)return;

    let stateRow=row.querySelector('.warehouse-state-row');
    if(!stateRow&&/standard hardware|følger altid teltet|fast standarddel/i.test(body.textContent||'')){
      stateRow=document.createElement('span');
      stateRow.className='warehouse-state-row';
      stateRow.innerHTML=typeof warehouseStateMarkup==='function'
        ?warehouseStateMarkup('in-stock','Følger teltet')
        :'<span class="warehouse-state in-stock">Følger teltet</span>';
      body.appendChild(stateRow);
    }

    if(stateRow){
      stateRow.classList.add('warehouse-item-status-v281');
      const chevron=row.querySelector('.warehouse-item-chevron-v183')||[...row.children].find(el=>el.matches?.('.ui-icon'));
      if(stateRow.parentElement!==row)row.insertBefore(stateRow,chevron||null);
    }
  });
}

function enhanceWarehouse(root=document){
  const categories=[];
  if(root?.matches?.('details.warehouse-category-v183'))categories.push(root);
  root?.querySelectorAll?.('details.warehouse-category-v183')?.forEach(node=>categories.push(node));
  categories.forEach(enhanceCategory);
  promoteWarehouseItemStatuses(root);
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

if(!document.getElementById('pala-warehouse-list-consistency-v281-style')){
  const style=document.createElement('style');
  style.id='pala-warehouse-list-consistency-v281-style';
  style.textContent=`
    /* Every warehouse foldout is a vertical list. No two-column/grid card layouts. */
    #app .warehouse-root-list-v183,
    #app .warehouse-structure-v183 .warehouse-groups,
    #app .warehouse-structure-v183 .warehouse-category-children-v183,
    #app .warehouse-structure-v183 .warehouse-tent-compact-list,
    #app .warehouse-structure-v183 .warehouse-tent-variants,
    #app .warehouse-section .warehouse-groups{
      display:flex!important;flex-direction:column!important;grid-template-columns:minmax(0,1fr)!important;gap:0!important;width:100%!important
    }
    #app .warehouse-root-list-v183 .warehouse-list,
    #app .warehouse-root-list-v183 .warehouse-list-v183,
    #app .warehouse-structure-v183 .warehouse-list,
    #app .warehouse-section .warehouse-list,
    #app details.warehouse-group>.warehouse-list{
      display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-auto-flow:row!important;gap:0!important;width:100%!important
    }
    #app .warehouse-list>.warehouse-item,
    #app .warehouse-list-v183>.warehouse-item-v183{
      width:100%!important;max-width:none!important;border-right:0!important
    }
    #app .warehouse-root-list-v183>.warehouse-list-v183{padding:0!important}

    /* Stock status sits on the same list row, to the right of each item. */
    #app .warehouse-item{
      grid-template-columns:42px minmax(0,1fr) auto 20px!important
    }
    #app .warehouse-item-status-v281{
      display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;
      flex-wrap:wrap!important;min-width:0!important;margin:0!important
    }
    #app .warehouse-item-status-v281 .warehouse-state{
      margin:0!important;white-space:nowrap!important
    }
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
      #app .warehouse-item{grid-template-columns:34px minmax(0,1fr) auto 18px!important;gap:8px!important}
      #app .warehouse-item-status-v281{max-width:122px!important}
      #app .warehouse-item-status-v281 .warehouse-state{font-size:10px!important;padding:4px 6px!important}
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
