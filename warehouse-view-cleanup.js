/* PALA v185 · simplified warehouse category view */
(()=>{
'use strict';
if(window.__palaWarehouseViewCleanupV185||typeof window.showTents!=='function')return;
window.__palaWarehouseViewCleanupV185=true;

const LABELS={tents:'Telte',hardware:'Hardware',inventory:'Inventar',other:'Øvrigt'};
const baseShowTents=window.showTents;

function cleanWarehouseView(filter){
  const active=LABELS[filter]?filter:'tents';

  document.querySelectorAll('.warehouse-tabs .warehouse-tab').forEach(button=>{
    const action=String(button.getAttribute('onclick')||'');
    if(action.includes("showTents('all')"))button.remove();
  });

  document.querySelectorAll('.warehouse-tabs .warehouse-tab').forEach(button=>{
    const action=String(button.getAttribute('onclick')||'');
    button.classList.toggle('active',action.includes(`showTents('${active}')`));
  });

  const rootList=document.querySelector('.warehouse-root-list-v183');
  if(!rootList)return;

  const expected=LABELS[active];
  const root=[...rootList.children].find(element=>{
    if(!element.matches?.('details.warehouse-category-v183'))return false;
    return element.querySelector(':scope > summary .warehouse-category-title-v183')?.textContent.trim()===expected;
  });
  if(!root)return;

  const body=root.querySelector(':scope > .warehouse-category-body-v183');
  if(!body)return;

  const fragment=document.createDocumentFragment();
  [...body.children].forEach(child=>{
    if(child.classList.contains('warehouse-category-children-v183')){
      [...child.children].forEach(category=>fragment.appendChild(category));
    }else{
      fragment.appendChild(child);
    }
  });
  root.replaceWith(fragment);
}

window.showTents=async function(filter='tents',keepFocus=false){
  const requested=LABELS[filter]?filter:'tents';
  const result=await baseShowTents.call(this,requested,keepFocus);
  window.warehouseViewFilter=requested;
  try{warehouseViewFilter=requested}catch(_e){}
  cleanWarehouseView(requested);
  return result;
};
})();
