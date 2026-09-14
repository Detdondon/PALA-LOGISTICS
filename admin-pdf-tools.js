/* PALA v178 · admin PDF tools
   Moves staffing/production PDF actions from the calendar to the admin top action field.
   Does not change the export functions themselves. */
(()=>{
'use strict';
if(window.__palaAdminPdfToolsV178)return;
window.__palaAdminPdfToolsV178=true;

const baseAdminTabs=window.adminTabs;
if(typeof baseAdminTabs==='function'){
  window.adminTabs=function(activeTab){
    let html=baseAdminTabs.apply(this,arguments);
    if(typeof html!=='string'||html.includes('data-admin-pdf-tool="staffing"'))return html;
    let buttons='';
    if(typeof showStaffingExportDialog==='function')buttons+=`<button class="btn" data-admin-pdf-tool="staffing" onclick="showStaffingExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''} Bemandingsplan PDF</button>`;
    if(typeof showProductionPlanExportDialog==='function')buttons+=`<button class="btn" data-admin-pdf-tool="production" onclick="showProductionPlanExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''} Produktionsplan PDF</button>`;
    if(!buttons)return html;
    const close=html.lastIndexOf('</div>');
    return close>=0?html.slice(0,close)+buttons+html.slice(close):html+buttons;
  };
}

const textOf=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
function removeCalendarPdfButtons(root=document){
  const hosts=[];
  if(root?.matches?.('.unified-calendar-actions-v123'))hosts.push(root);
  root?.querySelectorAll?.('.unified-calendar-actions-v123')?.forEach(host=>hosts.push(host));
  hosts.forEach(host=>{
    [...host.querySelectorAll('button')].forEach(button=>{
      const label=textOf(button);
      if(label==='Bemandingsplan PDF'||label==='Produktionsplan'||label==='Produktionsplan PDF')button.remove();
    });
  });
}

removeCalendarPdfButtons();
const app=document.getElementById('app');
if(app)new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
  if(node.nodeType===1)removeCalendarPdfButtons(node);
}))).observe(app,{childList:true,subtree:true});
})();
