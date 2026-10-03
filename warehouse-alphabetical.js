/* PALA v359 · alphabetic warehouse lists. */
(()=>{
'use strict';
if(window.__palaWarehouseAlphabeticalV359)return;
window.__palaWarehouseAlphabeticalV359=true;

const compare=(a,b)=>String(a||'').localeCompare(String(b||''),'da',{sensitivity:'base',numeric:true});

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
  const selectors=[
    '.warehouse-list',
    '.warehouse-list-v183',
    '.warehouse-category-children-v183',
    '.warehouse-root-list-v183',
    '.warehouse-groups',
    '.warehouse-tent-compact-list',
    '.warehouse-tent-variants'
  ];
  const hosts=[];
  selectors.forEach(selector=>{
    if(root.matches?.(selector))hosts.push(root);
    root.querySelectorAll?.(selector).forEach(host=>hosts.push(host));
  });
  [...new Set(hosts)].forEach(sortDirectChildren);
}

let queued=false;
function schedule(root=document){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    sortWarehouse(root);
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
  if(records.some(record=>record.type==='childList'&&record.addedNodes.length))schedule(app);
}).observe(app,{childList:true,subtree:true});

sortWarehouse(app||document);
})();
