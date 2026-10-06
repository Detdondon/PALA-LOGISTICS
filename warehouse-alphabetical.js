/* PALA v365 · alphabetic warehouse lists without global mutation rescans. */
(()=>{
'use strict';
if(window.__palaWarehouseAlphabeticalV365)return;
window.__palaWarehouseAlphabeticalV365=true;

const compare=(a,b)=>String(a||'').localeCompare(String(b||''),'da',{sensitivity:'base',numeric:true});
const WAREHOUSE_SELECTOR='.warehouse-list,.warehouse-list-v183,.warehouse-category-children-v183,.warehouse-root-list-v183,.warehouse-groups,.warehouse-tent-compact-list,.warehouse-tent-variants';

function rowLabel(node){
  const preferred=node.querySelector?.('.warehouse-item-body strong,.warehouse-category-title-v183,.warehouse-group-title,summary strong');
  if(preferred)return String(preferred.textContent||'').replace(/\s+/g,' ').trim();
  const summary=node.matches?.('details')?node.querySelector(':scope > summary'):null;
  return String((summary||node).textContent||'').replace(/\s+/g,' ').trim();
}

function sortDirectChildren(host){
  if(!host)return;
  const rows=[...host.children].filter(node=>node.nodeType===1);
  if(rows.length<2)return;
  const sorted=rows.map((node,index)=>({node,index,label:rowLabel(node)}))
    .sort((a,b)=>compare(a.label,b.label)||a.index-b.index)
    .map(entry=>entry.node);
  if(sorted.every((node,index)=>node===rows[index]))return;
  sorted.forEach(node=>host.appendChild(node));
}

function sortWarehouse(root=document){
  const hosts=[];
  if(root.matches?.(WAREHOUSE_SELECTOR))hosts.push(root);
  root.querySelectorAll?.(WAREHOUSE_SELECTOR).forEach(host=>hosts.push(host));
  [...new Set(hosts)].forEach(sortDirectChildren);
}

let queued=false;
const pending=new Set();
function schedule(root){
  if(root)pending.add(root);
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    const roots=[...pending];pending.clear();
    roots.forEach(node=>{if(node.isConnected)sortWarehouse(node)});
  });
}

const baseShowTents=window.showTents;
if(typeof baseShowTents==='function')window.showTents=async function(){
  const result=await baseShowTents.apply(this,arguments);
  sortWarehouse(document.getElementById('app')||document);
  return result;
};

const app=document.getElementById('app');
if(app)new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType!==1)continue;
      if(node.matches?.(WAREHOUSE_SELECTOR)||node.querySelector?.(WAREHOUSE_SELECTOR)){schedule(node);}
    }
  }
}).observe(app,{childList:true,subtree:true});

sortWarehouse(app||document);
})();