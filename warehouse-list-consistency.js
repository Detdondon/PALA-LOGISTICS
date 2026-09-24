/* PALA v333 · compact single-column warehouse lists + row stock status
   Hardware items and category rows share one visual language.
   Every category starts collapsed and opens only when pressed. */
(()=>{
'use strict';
if(window.__palaWarehouseListConsistencyV293)return;
window.__palaWarehouseListConsistencyV293=true;

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
  const searching=typeof warehouseSearch==='string'&&warehouseSearch.trim();
  details.open=!!searching;

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

if(!document.getElementById('pala-warehouse-list-consistency-v293-style')){
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

    /* Compact warehouse list view: keep all rows readable while fitting more on screen. */
    #app .warehouse-structure-v183{padding:10px!important}
    #app .warehouse-structure-head-v183{margin-bottom:4px!important}
    #app .warehouse-item{
      grid-template-columns:30px minmax(0,1fr) auto 18px!important;
      gap:8px!important;min-height:46px!important;padding:7px 10px!important
    }
    #app .warehouse-item-icon{
      width:30px!important;height:30px!important;flex:0 0 30px!important;border-radius:9px!important
    }
    #app .warehouse-item-icon .ui-icon{width:17px!important;height:17px!important}
    #app .warehouse-item-body strong{font-size:14px!important;line-height:1.25!important}
    #app .warehouse-item-body small{font-size:10px!important;line-height:1.25!important;margin-top:1px!important}
    #app .warehouse-item-body .warehouse-stock{font-size:11px!important;line-height:1.2!important;margin-top:2px!important}
    #app .warehouse-item-status-v281{
      display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:4px!important;
      flex-wrap:wrap!important;min-width:0!important;margin:0!important
    }
    #app .warehouse-item-status-v281 .warehouse-state{
      margin:0!important;white-space:nowrap!important;font-size:10px!important;padding:3px 5px!important
    }
    .warehouse-category-unified-v187{border:0!important;border-radius:0!important;background:#fff!important;overflow:visible!important;margin:0!important}
    .warehouse-category-unified-v187>summary{list-style:none!important;display:flex!important;align-items:center!important;gap:8px!important;min-height:46px!important;padding:7px 10px!important;background:#fff!important;border:0!important;border-bottom:1px solid #edf0f5!important;border-radius:0!important;font-weight:400!important;cursor:pointer!important}
    .warehouse-category-unified-v187>summary::-webkit-details-marker{display:none!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-icon{flex:0 0 30px!important;width:30px!important;height:30px!important;border-radius:9px!important;display:flex!important;align-items:center!important;justify-content:center!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-icon .ui-icon{width:17px!important;height:17px!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body{flex:1 1 auto!important;min-width:0!important;display:block!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body strong{display:block!important;font-size:14px!important;line-height:1.25!important;font-weight:600!important;color:inherit!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body small{display:block!important;margin-top:1px!important;font-size:10px!important;line-height:1.2!important;color:#738198!important;font-weight:500!important}
    .warehouse-category-unified-v187>summary>.warehouse-item-body .warehouse-stock{display:block!important;margin-top:2px!important;font-size:11px!important;line-height:1.2!important;color:#5b687e!important;font-weight:500!important}
    .warehouse-category-unified-chevron-v187{flex:0 0 20px!important;width:20px!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:transform .16s ease!important;color:#405574!important}
    .warehouse-category-unified-v187[open]>summary>.warehouse-category-unified-chevron-v187{transform:rotate(90deg)!important}
    .warehouse-category-unified-v187>.warehouse-category-body-v183{padding:0!important}
    .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-list-v183{padding:0 0 0 12px!important;gap:0!important}
    .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-category-children-v183{margin:0 0 0 12px!important;padding:0!important;border-left:1px solid #e8edf3!important;gap:0!important}
    .warehouse-category-unified-v187 .warehouse-item-v183{border-radius:0!important;margin:0!important}
    @media(max-width:600px){
      #app .warehouse-structure-v183{padding:8px!important}
      #app .warehouse-item{grid-template-columns:28px minmax(0,1fr) auto 16px!important;gap:7px!important;min-height:44px!important;padding:6px 8px!important}
      #app .warehouse-item-icon{width:28px!important;height:28px!important;flex-basis:28px!important}
      #app .warehouse-item-status-v281{max-width:112px!important}
      #app .warehouse-item-status-v281 .warehouse-state{font-size:9px!important;padding:3px 5px!important}
      .warehouse-category-unified-v187>summary{min-height:44px!important;padding:6px 8px!important;gap:7px!important}
      .warehouse-category-unified-v187>summary>.warehouse-item-icon{width:28px!important;height:28px!important;flex-basis:28px!important}
      .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-list-v183{padding-left:8px!important}
      .warehouse-category-unified-v187>.warehouse-category-body-v183>.warehouse-category-children-v183{margin-left:8px!important}
    }
  `;
  document.head.appendChild(style);
}

enhanceWarehouse(document.getElementById('app')||document);
})();
