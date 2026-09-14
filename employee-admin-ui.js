/* PALA v183 · compact employee administration
   Replaces the long employee form list with a compact overview and focused edit sheets.
   Reuses the existing secure employee RPCs and permission model. */
(()=>{
'use strict';
if(window.__palaEmployeeAdminV183)return;
window.__palaEmployeeAdminV183=true;

function canManageAdmins(){
  try{return typeof isLukasAdmin==='function'&&isLukasAdmin()}catch(_e){return false}
}
function employeeById(id){return (employees||[]).find(e=>+e.id===+id)||null}
function employeeRole(e){
  if(e?.can_manage_admins)return 'Systemejer';
  return e?.is_admin?'Administrator':'Medarbejder';
}
function roleBadge(e){
  const cls=e?.can_manage_admins?'owner':e?.is_admin?'admin':'employee';
  return `<span class="employee-role-v183 ${cls}">${employeeRole(e)}</span>`;
}
function employeeInitials(name){
  return String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
}
function refreshEmployeeAdmin(){
  return reloadData().then(()=>showAdminEmployees());
}
function sheetError(error){return String(error?.message||error||'Ukendt fejl')}

window.openEmployeeAdminEditor=function(id){
  if(!requireAdmin())return;
  const e=employeeById(id);if(!e)return alert('Medarbejderen findes ikke.');
  const own=+e.id===+employeeId,manageRoles=canManageAdmins(),canDelete=!own&&!e.can_manage_admins&&(!e.is_admin||manageRoles);
  const roleControl=manageRoles&&!e.can_manage_admins
    ? `<label class="employee-admin-toggle-v183"><input id="employeeEditAdminV183" type="checkbox" ${e.is_admin?'checked':''}><span><strong>Administrator</strong><small>Giver adgang til Adminfunktion og administrative værktøjer.</small></span></label>`
    : `<div class="employee-role-readonly-v183"><span>Adgang</span>${roleBadge(e)}${!manageRoles&&e.is_admin&&!own?'<small>Kun systemejeren kan ændre denne administrators adgang.</small>':''}</div>`;

  openEditSheet('Redigér medarbejder',`
    <div class="employee-edit-person-v183"><span class="employee-avatar-v183">${esc(employeeInitials(e.name))}</span><div><strong>${esc(e.name)}</strong><small>${esc(employeeRole(e))}${own?' · Din bruger':''}</small></div></div>
    <div class="sheet-field"><label for="employeeEditNameV183">Navn</label><input id="employeeEditNameV183" value="${esc(e.name||'')}" maxlength="100" required autocomplete="off"></div>
    <div class="employee-edit-section-v183"><div class="employee-edit-section-title-v183">Adgang</div>${roleControl}</div>
    <div class="employee-edit-section-v183"><div class="employee-edit-section-title-v183">Login-kode</div><p class="small muted">Lad feltet være tomt, hvis koden ikke skal ændres.</p><div class="employee-pin-row-v183"><input id="employeeEditPinV183" type="password" inputmode="numeric" maxlength="8" pattern="[0-9]*" placeholder="Ny kode · 4-8 cifre" autocomplete="new-password"><button type="button" class="btn" onclick="window.toggleEmployeePinV183('employeeEditPinV183',this)" aria-label="Vis eller skjul kode">${typeof uiIcon==='function'?uiIcon('eye'):''}<span>Vis</span></button></div></div>`,
    async()=>{
      const name=document.getElementById('employeeEditNameV183')?.value.trim();
      const pin=document.getElementById('employeeEditPinV183')?.value||'';
      if(!name)throw new Error('Medarbejderen skal have et navn.');
      if(pin&&!/^\d{4,8}$/.test(pin))throw new Error('Koden skal være 4-8 cifre.');
      const adminBox=document.getElementById('employeeEditAdminV183');
      const isAdmin=adminBox?adminBox.checked:!!e.is_admin;
      let result=await sb.rpc('admin_save_employee',{p_token:adminToken,p_id:+e.id,p_name:name,p_is_admin:isAdmin});
      if(result.error)throw result.error;
      if(pin){
        result=await sb.rpc('admin_change_employee_pin',{p_token:adminToken,p_employee_id:+e.id,p_pin:pin});
        if(result.error)throw result.error;
      }
      closeEditSheet(true);
      if(pin&&own){alert('Din kode er ændret. Log ind igen med den nye kode.');return employeeLogout()}
      await refreshEmployeeAdmin();
    },'Gem ændringer');

  if(canDelete){
    const footer=document.querySelector('#palaEditSheet .sheet-footer');
    if(footer&&!footer.querySelector('[data-delete-employee-v183]')){
      const del=document.createElement('button');del.type='button';del.className='btn bad';del.dataset.deleteEmployeeV183=String(e.id);del.style.marginRight='auto';del.innerHTML=(typeof uiIcon==='function'?uiIcon('trash'):'')+' Fjern';
      del.onclick=async()=>{
        if(!confirm(`Fjern ${e.name}? Eksisterende vagttilmeldinger bliver også fjernet.`))return;
        del.disabled=true;
        try{
          const r=await sb.rpc('admin_delete_employee',{p_token:adminToken,p_id:+e.id});if(r.error)throw r.error;
          closeEditSheet(true);await refreshEmployeeAdmin();
        }catch(error){alert('Kunne ikke fjerne medarbejderen: '+sheetError(error));del.disabled=false}
      };
      footer.prepend(del);
    }
  }
};

window.openNewEmployeeAdminEditor=function(){
  if(!requireAdmin())return;
  const manageRoles=canManageAdmins();
  openEditSheet('Tilføj medarbejder',`
    <div class="employee-new-intro-v183"><span class="employee-avatar-v183 new">+</span><div><strong>Ny medarbejder</strong><small>Navn og startkode er det eneste nødvendige.</small></div></div>
    <div class="sheet-field"><label for="employeeNewNameV183">Navn</label><input id="employeeNewNameV183" maxlength="100" required placeholder="Medarbejderens navn" autocomplete="off"></div>
    <div class="sheet-field"><label for="employeeNewPinV183">Startkode</label><div class="employee-pin-row-v183"><input id="employeeNewPinV183" type="password" inputmode="numeric" maxlength="8" pattern="[0-9]*" required placeholder="4-8 cifre" autocomplete="new-password"><button type="button" class="btn" onclick="window.toggleEmployeePinV183('employeeNewPinV183',this)" aria-label="Vis eller skjul kode">${typeof uiIcon==='function'?uiIcon('eye'):''}<span>Vis</span></button></div><p class="small muted">Medarbejderen kan selv ændre koden senere i brugermenuen.</p></div>
    ${manageRoles?`<div class="employee-edit-section-v183"><div class="employee-edit-section-title-v183">Adgang</div><label class="employee-admin-toggle-v183"><input id="employeeNewAdminV183" type="checkbox"><span><strong>Administrator</strong><small>Giv adgang til Adminfunktion fra start.</small></span></label></div>`:''}`,
    async()=>{
      const name=document.getElementById('employeeNewNameV183')?.value.trim();
      const pin=document.getElementById('employeeNewPinV183')?.value||'';
      if(!name)throw new Error('Skriv medarbejderens navn.');
      if(!/^\d{4,8}$/.test(pin))throw new Error('Startkoden skal være 4-8 cifre.');
      const r=await sb.rpc('admin_create_employee',{p_token:adminToken,p_name:name,p_is_admin:!!document.getElementById('employeeNewAdminV183')?.checked,p_initial_pin:pin});
      if(r.error)throw r.error;
      closeEditSheet(true);await refreshEmployeeAdmin();
    },'Tilføj medarbejder');
  setTimeout(()=>document.getElementById('employeeNewNameV183')?.focus(),0);
};

window.toggleEmployeePinV183=function(id,button){
  const input=document.getElementById(id);if(!input)return;
  const show=input.type==='password';input.type=show?'text':'password';
  const span=button?.querySelector('span');if(span)span.textContent=show?'Skjul':'Vis';
};
window.filterEmployeeAdminV183=function(value){
  const q=String(value||'').trim().toLocaleLowerCase('da-DK');
  document.querySelectorAll('.employee-row-v183').forEach(row=>row.hidden=!!q&&!String(row.dataset.search||'').includes(q));
  const visible=[...document.querySelectorAll('.employee-row-v183:not([hidden])')].length;
  const empty=document.getElementById('employeeSearchEmptyV183');if(empty)empty.hidden=visible>0;
};

window.showAdminEmployees=function(){
  if(!isAdminLoggedIn())return showAdminLogin();
  act('na');history.replaceState(null,'',location.pathname+'?admin=employees');
  const rows=[...(employees||[])].filter(e=>e.active!==false).sort((a,b)=>(b.can_manage_admins===true)-(a.can_manage_admins===true)||(b.is_admin===true)-(a.is_admin===true)||alpha(a.name,b.name));
  const admins=rows.filter(e=>e.is_admin).length;
  app.innerHTML=`<section class="card employee-admin-head-v183"><div class="row"><div><div class="small muted">ADMINISTRATION</div><h2>Medarbejdere</h2><p class="muted">Vælg en medarbejder for at ændre navn, adgang eller kode.</p></div><button type="button" class="btn primary employee-add-v183" onclick="openNewEmployeeAdminEditor()">${typeof uiIcon==='function'?uiIcon('plus'):''}<span>Tilføj</span></button></div>${adminTabs('employees')}</section>
  <section class="card employee-admin-list-card-v183"><div class="employee-list-toolbar-v183"><div><strong>${rows.length} medarbejdere</strong><small>${admins} ${admins===1?'administrator':'administratorer'}</small></div><div class="employee-search-v183">${typeof uiIcon==='function'?uiIcon('search'):''}<input type="search" placeholder="Søg navn" aria-label="Søg medarbejder" oninput="filterEmployeeAdminV183(this.value)"></div></div><div class="employee-list-v183">${rows.map(e=>`<button type="button" class="employee-row-v183" data-search="${esc(String(e.name||'').toLocaleLowerCase('da-DK'))}" onclick="openEmployeeAdminEditor(${+e.id})"><span class="employee-avatar-v183">${esc(employeeInitials(e.name))}</span><span class="employee-row-copy-v183"><strong>${esc(e.name)}</strong>${roleBadge(e)}</span><span class="employee-edit-icon-v183" aria-hidden="true">${typeof uiIcon==='function'?uiIcon('edit'):''}</span></button>`).join('')}</div><p id="employeeSearchEmptyV183" class="muted employee-search-empty-v183" hidden>Ingen medarbejdere matcher søgningen.</p></section>`;
};

if(!document.getElementById('pala-employee-admin-v183-style')){
  const style=document.createElement('style');style.id='pala-employee-admin-v183-style';style.textContent=`
    .employee-admin-head-v183 h2{margin:3px 0 5px}.employee-admin-head-v183 p{margin:0}.employee-add-v183{flex:0 0 auto}
    .employee-admin-list-card-v183{padding:0!important;overflow:hidden}.employee-list-toolbar-v183{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid #e6ebf2;background:#fafbfd}.employee-list-toolbar-v183>div:first-child{display:grid;gap:2px}.employee-list-toolbar-v183 small{color:#69788e;font-size:11px}.employee-search-v183{display:flex;align-items:center;gap:7px;width:min(240px,48%);border:1px solid #dce3ec;border-radius:10px;background:#fff;padding:0 9px}.employee-search-v183 .ui-icon{width:16px;height:16px;color:#748399;flex:0 0 auto}.employee-search-v183 input{border:0!important;box-shadow:none!important;background:transparent!important;padding:9px 0!important;min-width:0;width:100%}
    .employee-list-v183{display:grid}.employee-row-v183{appearance:none;border:0;border-bottom:1px solid #edf0f4;background:#fff;color:inherit;width:100%;display:grid;grid-template-columns:38px minmax(0,1fr) 34px;align-items:center;gap:11px;padding:11px 14px;text-align:left;font:inherit;cursor:pointer}.employee-row-v183:last-child{border-bottom:0}.employee-row-v183:hover,.employee-row-v183:focus-visible{background:#f4f8fd;outline:none}.employee-avatar-v183{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:#eaf2fc;color:#356aa8;font-size:12px;font-weight:800;letter-spacing:.02em;flex:0 0 auto}.employee-avatar-v183.new{font-size:22px}.employee-row-copy-v183{min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.employee-row-copy-v183>strong{font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.employee-role-v183{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:800;letter-spacing:.02em;background:#f0f2f5;color:#657184;white-space:nowrap}.employee-role-v183.admin{background:#e9f4ed;color:#407153}.employee-role-v183.owner{background:#e9f1fb;color:#35699f}.employee-edit-icon-v183{display:flex;align-items:center;justify-content:center;color:#60738c}.employee-edit-icon-v183 .ui-icon{width:17px;height:17px}.employee-search-empty-v183{padding:18px;text-align:center;margin:0}
    .employee-edit-person-v183,.employee-new-intro-v183{display:flex;align-items:center;gap:11px;padding:11px 0 4px}.employee-edit-person-v183>div,.employee-new-intro-v183>div{display:grid;gap:2px}.employee-edit-person-v183 small,.employee-new-intro-v183 small{color:#6c7889}.employee-edit-section-v183{margin-top:18px;padding-top:14px;border-top:1px solid #e8edf3}.employee-edit-section-title-v183{font-size:11px;font-weight:800;letter-spacing:.06em;color:#6b788c;text-transform:uppercase;margin-bottom:8px}.employee-admin-toggle-v183{display:flex!important;align-items:flex-start!important;gap:11px!important;padding:11px!important;border:1px solid #dfe6ef;border-radius:11px;background:#fafbfd;margin:0!important;cursor:pointer}.employee-admin-toggle-v183 input{width:19px!important;height:19px!important;margin:1px 0 0!important;accent-color:#1768c4}.employee-admin-toggle-v183 span{display:grid;gap:2px}.employee-admin-toggle-v183 small{font-weight:400;color:#718096;line-height:1.35}.employee-role-readonly-v183{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0}.employee-role-readonly-v183>span:first-child{font-size:13px;color:#66748a}.employee-role-readonly-v183 small{width:100%;color:#718096}.employee-pin-row-v183{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center}.employee-pin-row-v183 .btn{min-width:76px;justify-content:center}
    @media(max-width:600px){.employee-list-toolbar-v183{padding:12px;align-items:stretch;flex-direction:column}.employee-search-v183{width:100%}.employee-row-v183{grid-template-columns:34px minmax(0,1fr) 30px;padding:10px 12px;gap:9px}.employee-avatar-v183{width:32px;height:32px;border-radius:10px}.employee-row-copy-v183{gap:6px}.employee-admin-head-v183 .row{align-items:flex-start}.employee-add-v183 span{display:none}.employee-add-v183{width:42px;height:42px;padding:0;justify-content:center}}
  `;document.head.appendChild(style);
}
})();
