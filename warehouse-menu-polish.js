/* PALA v189 · warehouse menu polish
   Hide fixed standard hardware from the warehouse menu only.
   Make Rigge and Spacial use the same category icon as Master. */
(()=>{
'use strict';
if(window.__palaWarehouseMenuPolishV189)return;
window.__palaWarehouseMenuPolishV189=true;

const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('da-DK');
const STANDARD_HARDWARE=new Set(['pløkker','sidestænger']);
const MATCH_MASTER_ICON=new Set(['rigge','spacial','special']);

function hideStandardHardware(root=document){
  root.querySelectorAll?.('.warehouse-root-list-v183 .warehouse-item-v183').forEach(row=>{
    const name=norm(row.querySelector('.warehouse-item-body strong')?.textContent);
    if(STANDARD_HARDWARE.has(name))row.remove();
  });
  root.querySelectorAll?.('.warehouse-root-list-v183 .warehouse-list-v183').forEach(list=>{
    if(!list.querySelector('.warehouse-item-v183'))list.remove();
  });
}

function unifyHardwareCategoryIcons(root=document){
  const categories=[...root.querySelectorAll?.('details.warehouse-category-v183')||[]];
  const master=categories.find(details=>norm(details.querySelector(':scope > summary .warehouse-item-body strong')?.textContent)==='master');
  const masterIcon=master?.querySelector(':scope > summary .warehouse-item-icon')?.innerHTML;
  if(!masterIcon)return;
  categories.forEach(details=>{
    const title=norm(details.querySelector(':scope > summary .warehouse-item-body strong')?.textContent);
    if(!MATCH_MASTER_ICON.has(title))return;
    const icon=details.querySelector(':scope > summary .warehouse-item-icon');
    if(icon)icon.innerHTML=masterIcon;
  });
}

function applyWarehouseMenuPolish(root=document){
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
if(app)new MutationObserver(()=>queueMicrotask(()=>applyWarehouseMenuPolish(app))).observe(app,{childList:true,subtree:true});

applyWarehouseMenuPolish(app||document);
})();
