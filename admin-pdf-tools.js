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
    // Lagerredigering is opened from Lager, not Appindstillinger.
    if(['tents','inventory','categories','special'].includes(activeTab)){
      const filter=activeTab==='inventory'?'inventory':activeTab==='special'?'hardware':'all';
      return `<div class="warehouse-admin-editor-nav-v375">
        <button class="btn" onclick="showTents('${filter}')">${typeof uiIcon==='function'?uiIcon('chevronLeft'):''} Tilbage til Lager</button>
        <h2>Lageradministration</h2>
      </div>`;
    }

    // Preserve planning controls while keeping the read-only order import in Appindstillinger.
    const take=pattern=>{
      const match=html.match(pattern);
      if(!match)return '';
      html=html.replace(match[0],'');
      return match[0];
    };
    const employees=take(/<button\b[^>]*onclick=["']showAdminEmployees\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    const backup=take(/<button\b[^>]*onclick=["']showAdminBackup\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    const importButton=take(/<button\b[^>]*onclick=["']showSheetInquiries\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    const logout=take(/<button\b[^>]*onclick=["']adminLogout\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    const identity=take(/<span\b[^>]*>\s*Logget ind:[\s\S]*?<\/span>/i);
    const staffing=typeof showStaffingExportDialog==='function'
      ? `<button class="btn admin-settings-action-v375" onclick="showStaffingExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''} Bemandingsplan</button>`:'';
    const production=typeof showProductionPlanExportDialog==='function'
      ? `<button class="btn admin-settings-action-v375" onclick="showProductionPlanExportDialog()">${typeof uiIcon==='function'?uiIcon('document'):''} Produktionsplan</button>`:'';

    return `<div class="app-settings-sections-v375">
      <section class="app-settings-panel-v375 app-settings-general-v375" aria-label="Planlægning og administration">
        <div class="app-settings-title-v375">Planlægning og administration</div>
        <div class="app-settings-buttons-v375">${staffing}${production}${backup}${employees}</div>
        ${importButton?`<div class="app-settings-import-v375"><div class="app-settings-title-v375">Ordreimport</div>${importButton}</div>`:''}
      </section>
      <div class="app-settings-session-v375">${identity}${logout}</div>
    </div>`;
  };
}

window.showAppSettingsHomeV375=function(){
  if(typeof isAdminLoggedIn!=='function'||!isAdminLoggedIn())return showAdminLogin();
  if(typeof act==='function')act('na');
  history.replaceState(null,'',location.pathname+'?admin=settings');
  app.innerHTML=`<div class="card"><h2>Appindstillinger</h2>${window.adminTabs('settings')}</div>`;
};
const baseAppSettingsRouteV375=window.route;
if(typeof baseAppSettingsRouteV375==='function')window.route=function(){
  const params=new URLSearchParams(location.search);
  if(params.get('admin')==='settings'&&typeof isAdminLoggedIn==='function'&&isAdminLoggedIn())return window.showAppSettingsHomeV375();
  return baseAppSettingsRouteV375.apply(this,arguments);
};

if(!document.getElementById('pala-admin-settings-v375-style')){
  const style=document.createElement('style');
  style.id='pala-admin-settings-v375-style';
  style.textContent=`
    .app-settings-sections-v375{display:grid;gap:12px;margin:14px 0}
    .app-settings-panel-v375{border:1px solid #dce4ed;border-radius:17px;background:#f8fafc;padding:15px}
    .app-settings-title-v375{font-size:12px;font-weight:800;letter-spacing:.04em;color:#64748b;text-transform:uppercase;margin:0 0 11px}
    .app-settings-buttons-v375{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .app-settings-buttons-v375>.btn{display:flex;align-items:center;justify-content:center;text-align:center;gap:7px;min-width:0;min-height:48px;width:100%;white-space:normal}
    .app-settings-import-v375{border-top:1px solid #dce4ed;margin-top:14px;padding-top:12px}
    .app-settings-import-v375>.btn{width:100%;min-height:45px}
    .app-settings-session-v375{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;padding:0 3px}
    .warehouse-admin-editor-nav-v375{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 15px}
    .warehouse-admin-editor-nav-v375 h2{font-size:19px;margin:0}
    #app .card:has(.warehouse-admin-editor-nav-v375)>h2:first-child{display:none!important}
    @media(min-width:800px){.app-settings-general-v375>.app-settings-buttons-v375{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @media(max-width:420px){.app-settings-panel-v375{padding:11px}.app-settings-buttons-v375{gap:6px}.app-settings-buttons-v375>.btn{font-size:12px;padding:9px 6px}}
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
