/* PALA v190 · warehouse menu polish
   Keeps the v189 presentation without a self-triggering MutationObserver loop. */
(()=>{
'use strict';
if(window.__palaWarehouseMenuPolishV190)return;
window.__palaWarehouseMenuPolishV190=true;

const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('da-DK');
const STANDARD_HARDWARE=new Set(['pløkker','sidestænger']);
const MATCH_MASTER_ICON=new Set(['rigge','spacial','special']);

function warehouseRoot(root=document){
  if(root?.matches?.('.warehouse-root-list-v183'))return root;
  return root?.querySelector?.('.warehouse-root-list-v183')||null;
}
function hideStandardHardware(root=document){
  const host=warehouseRoot(root);if(!host)return;
  host.querySelectorAll('.warehouse-item-v183').forEach(row=>{
    const name=norm(row.querySelector('.warehouse-item-body strong')?.textContent);
    if(STANDARD_HARDWARE.has(name))row.remove();
  });
  host.querySelectorAll('.warehouse-list-v183').forEach(list=>{
    if(!list.querySelector('.warehouse-item-v183'))list.remove();
  });
}
function unifyHardwareCategoryIcons(root=document){
  const host=warehouseRoot(root);if(!host)return;
  const categories=[...host.querySelectorAll('details.warehouse-category-v183')];
  const master=categories.find(details=>norm(details.querySelector(':scope > summary .warehouse-item-body strong')?.textContent)==='master');
  const masterIcon=master?.querySelector(':scope > summary .warehouse-item-icon')?.innerHTML;
  if(!masterIcon)return;
  categories.forEach(details=>{
    const title=norm(details.querySelector(':scope > summary .warehouse-item-body strong')?.textContent);
    if(!MATCH_MASTER_ICON.has(title))return;
    const icon=details.querySelector(':scope > summary .warehouse-item-icon');
    if(!icon||icon.dataset.palaWarehouseMasterIcon==='1')return;
    if(icon.innerHTML!==masterIcon)icon.innerHTML=masterIcon;
    icon.dataset.palaWarehouseMasterIcon='1';
  });
}
function applyWarehouseMenuPolish(root=document){
  if(!warehouseRoot(root))return;
  hideStandardHardware(root);
  unifyHardwareCategoryIcons(root);
}

const baseShowTents=window.showTents;
if(typeof baseShowTents==='function')window.showTents=async function(){
  const result=await baseShowTents.apply(this,arguments);
  applyWarehouseMenuPolish(document.getElementById('app')||document);
  return result;
};

const app=document.getElementById('app');
let queued=false;
function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;applyWarehouseMenuPolish(app||document)});
}
if(app)new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType!==1)continue;
      if(node.matches?.('.warehouse-root-list-v183,.warehouse-category-v183,.warehouse-item-v183')||node.querySelector?.('.warehouse-root-list-v183,.warehouse-category-v183,.warehouse-item-v183')){schedule();return}
    }
  }
}).observe(app,{childList:true,subtree:true});

applyWarehouseMenuPolish(app||document);
})();
