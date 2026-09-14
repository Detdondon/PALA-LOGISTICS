/* PALA v179 · admin planning/backup layout
   Keeps planning exports in the admin menu: two planning buttons side by side,
   with Backup alone on the row below. Does not change export/backup logic. */
(()=>{
'use strict';
if(window.__palaAdminPdfToolsV179)return;
window.__palaAdminPdfToolsV179=true;

const baseAdminTabs=window.adminTabs;
if(typeof baseAdminTabs==='function'){
  window.adminTabs=function(activeTab){
    let html=baseAdminTabs.apply(this,arguments);
    if(typeof html!=='string')return html;

    // Backup is added by the existing admin navigation layer. Remove it from
    // that row and render all three utility actions in their own layout.
    html=html.replace(/<button\b[^>]*onclick=["']showAdminBackup\(\)["'][^>]*>[\s\S]*?<\/button>/i,'');

    const staffing=typeof showStaffingExportDialog==='function'
      ? `<button class="btn admin-plan-button-v179" data-admin-pdf-tool="staffing" onclick="showStaffingExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''}<span>Bemandingsplan</span></button>`
      : '';
    const production=typeof showProductionPlanExportDialog==='function'
      ? `<button class="btn admin-plan-button-v179" data-admin-pdf-tool="production" onclick="showProductionPlanExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''}<span>Produktionsplan</span></button>`
      : '';
    const backup=typeof showAdminBackup==='function'
      ? `<button class="btn admin-backup-button-v179 ${activeTab==='backup'?'primary':''}" data-admin-backup-tool="1" onclick="showAdminBackup()">${typeof uiIcon==='function'?uiIcon('document'):''}<span>Backup</span></button>`
      : '';

    if(!staffing&&!production&&!backup)return html;
    return html+`<div class="admin-utility-tools-v179"><div class="admin-plan-row-v179">${staffing}${production}</div>${backup}</div>`;
  };
}

if(!document.getElementById('pala-admin-tools-v179-style')){
  const style=document.createElement('style');
  style.id='pala-admin-tools-v179-style';
  style.textContent=`
    .admin-utility-tools-v179{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin:0 0 14px!important}
    .admin-plan-row-v179{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
    .admin-plan-row-v179>.btn,.admin-backup-button-v179{width:100%!important;min-width:0!important;min-height:48px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;text-align:center!important;white-space:normal!important}
    .admin-plan-row-v179>.btn .ui-icon,.admin-backup-button-v179 .ui-icon{flex:0 0 auto!important}
    @media(max-width:420px){.admin-plan-row-v179{gap:6px!important}.admin-plan-row-v179>.btn,.admin-backup-button-v179{padding:11px 8px!important;font-size:12px!important}}
  `;
  document.head.appendChild(style);
}

const textOf=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
function removeCalendarPdfButtons(root=document){
  const hosts=[];
  if(root?.matches?.('.unified-calendar-actions-v123'))hosts.push(root);
  root?.querySelectorAll?.('.unified-calendar-actions-v123')?.forEach(host=>hosts.push(host));
  hosts.forEach(host=>{
    [...host.querySelectorAll('button')].forEach(button=>{
      const label=textOf(button);
      if(label==='Bemandingsplan PDF'||label==='Bemandingsplan'||label==='Produktionsplan'||label==='Produktionsplan PDF')button.remove();
    });
  });
}

removeCalendarPdfButtons();
const app=document.getElementById('app');
if(app)new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
  if(node.nodeType===1)removeCalendarPdfButtons(node);
}))).observe(app,{childList:true,subtree:true});
})();
