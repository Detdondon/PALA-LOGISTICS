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

    // Keep the original warehouse navigation, including Lagerstruktur and Telt 2027.
    // Move administrative actions into their own panel without changing handlers.
    const take=pattern=>{
      const match=html.match(pattern);
      if(!match)return '';
      html=html.replace(match[0],'');
      return match[0];
    };
    const employees=take(/<button\b[^>]*onclick=["']showAdminEmployees\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    const backup=take(/<button\b[^>]*onclick=["']showAdminBackup\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    const logout=take(/<button\b[^>]*onclick=["']adminLogout\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    const identity=take(/<span\b[^>]*>\s*Logget ind:[\s\S]*?<\/span>/i);

    const staffing=typeof showStaffingExportDialog==='function'
      ? `<button class="btn admin-settings-action-v374" onclick="showStaffingExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''} Bemandingsplan</button>`:'';
    const production=typeof showProductionPlanExportDialog==='function'
      ? `<button class="btn admin-settings-action-v374" onclick="showProductionPlanExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''} Produktionsplan</button>`:'';

    return `<div class="app-settings-sections-v374">
      <section class="app-settings-panel-v374 app-settings-general-v374" aria-label="Planlægning og administration">
        <div class="app-settings-title-v374">Planlægning og administration</div>
        <div class="app-settings-buttons-v374">${staffing}${production}${backup}${employees}</div>
      </section>
      <section class="app-settings-panel-v374 app-settings-warehouse-v374" aria-label="Lager">
        <div class="app-settings-title-v374">Lager</div>
        ${html}
      </section>
      <div class="app-settings-session-v374">${identity}${logout}</div>
    </div>`;
  };
}

if(!document.getElementById('pala-admin-settings-v374-style')){
  const style=document.createElement('style');
  style.id='pala-admin-settings-v374-style';
  style.textContent=`
    .app-settings-sections-v374{display:grid;gap:12px;margin:14px 0}
    .app-settings-panel-v374{border:1px solid #dce4ed;border-radius:17px;background:#f8fafc;padding:15px}
    .app-settings-title-v374{font-size:12px;font-weight:800;letter-spacing:.04em;color:#64748b;text-transform:uppercase;margin:0 0 11px}
    .app-settings-buttons-v374{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .app-settings-buttons-v374>.btn,.app-settings-warehouse-v374>.row>.btn{display:flex;align-items:center;justify-content:center;text-align:center;gap:7px;min-width:0;min-height:48px;width:100%;white-space:normal}
    .app-settings-warehouse-v374>.row{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px!important;margin:0!important;align-items:stretch}
    .app-settings-session-v374{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;padding:0 3px}
    @media(min-width:800px){.app-settings-general-v374>.app-settings-buttons-v374{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @media(max-width:420px){.app-settings-panel-v374{padding:11px}.app-settings-buttons-v374,.app-settings-warehouse-v374>.row{gap:6px!important}.app-settings-buttons-v374>.btn,.app-settings-warehouse-v374>.row>.btn{font-size:12px;padding:9px 6px}}
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
