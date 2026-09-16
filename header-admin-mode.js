/* PALA v193 · header admin mode access
   Header order: search, notifications, admin mode, user. Admin mode uses the shared edit/pencil icon. */
(()=>{
'use strict';
if(window.__palaHeaderAdminModeV193)return;
window.__palaHeaderAdminModeV193=true;

function adminModeOn(){
  try{return !!employeeIsAdmin&&!!adminModeEnabled}catch(_e){return false}
}
function adminEmployee(){
  try{return !!employeeIsAdmin}catch(_e){return false}
}
function applyAppSettingsHeading(){
  document.querySelectorAll('#app h2').forEach(h=>{
    if(String(h.textContent||'').trim()==='Administration')h.textContent='Appindstillinger';
  });
}

window.toggleHeaderAdminModeV184=async function(){
  if(!adminEmployee()||typeof toggleAdminMode!=='function')return;
  await toggleAdminMode(!adminModeOn());
};

window.openAdminMenuFromUserV184=async function(){
  if(!adminEmployee())return;
  if(typeof closeUserMenu==='function')closeUserMenu();
  if(!adminModeOn()&&typeof toggleAdminMode==='function')await toggleAdminMode(true);
  if(typeof closeUserMenu==='function')closeUserMenu();
  if(typeof showAdmin==='function')showAdmin();
  queueMicrotask(applyAppSettingsHeading);
};
window.openAppSettingsFromUserV185=window.openAdminMenuFromUserV184;

function orderHeaderActions(actions,userMenu){
  if(!actions||!userMenu)return;
  const search=actions.querySelector('button.header-icon[onclick*="showSearch"]');
  const notification=actions.querySelector('.header-notification');
  const admin=actions.querySelector('.header-admin-mode-v184');

  // Required order: search → notifications → admin mode → user.
  if(search)actions.insertBefore(search,actions.firstElementChild);
  if(notification)actions.insertBefore(notification,admin||userMenu);
  if(admin)actions.insertBefore(admin,userMenu);
}

function applyHeaderAdminLayout(){
  const logged=typeof isEmployeeLoggedIn==='function'&&isEmployeeLoggedIn();
  const actions=document.querySelector('.header-actions');
  const nav=document.querySelector('.nav');
  const adminNav=document.getElementById('na');

  // Appindstillinger is no longer a bottom-navigation destination.
  if(adminNav){
    adminNav.hidden=true;
    adminNav.style.display='none';
    adminNav.setAttribute('aria-hidden','true');
  }
  if(nav&&logged)nav.style.gridTemplateColumns='repeat(4,1fr)';
  if(!actions||!logged){applyAppSettingsHeading();return}

  actions.querySelector('.header-admin-mode-v184')?.remove();
  const userMenu=actions.querySelector('.user-menu');
  if(!userMenu){applyAppSettingsHeading();return}

  // Dedicated Adminmode button. The shared edit icon has the same stroke weight
  // and geometry system as the rest of PALA's interface icons.
  if(adminEmployee()){
    const active=adminModeOn();
    const button=document.createElement('button');
    button.type='button';
    button.className='header-icon header-admin-mode-v184'+(active?' active':'');
    button.setAttribute('onclick','toggleHeaderAdminModeV184()');
    button.setAttribute('aria-label',active?'Slå Adminmode fra':'Slå Adminmode til');
    button.setAttribute('aria-pressed',active?'true':'false');
    button.setAttribute('title',active?'Adminmode aktiv':'Adminmode');
    button.innerHTML=typeof uiIcon==='function'?uiIcon('edit','ui-icon'):'';
    userMenu.insertAdjacentElement('beforebegin',button);
  }

  orderHeaderActions(actions,userMenu);

  // Dropdown: identity + Appindstillinger (admins only) + Log ud. Nothing else.
  const popover=userMenu.querySelector('#userMenuPopover');
  if(popover){
    const role=adminEmployee()?(adminModeOn()?'Administrator · Adminmode aktiv':'Administrator'):'Medarbejder';
    popover.innerHTML=`<div class="user-menu-identity"><strong>${typeof esc==='function'?esc(employeeName):String(employeeName||'')}</strong><div class="user-menu-role ${adminModeOn()?'mode-on':''}">${role}</div></div>${adminEmployee()?`<button class="user-menu-action" onclick="openAppSettingsFromUserV185()" role="menuitem">${typeof uiIcon==='function'?uiIcon('settings','ui-icon'):''}<span>Appindstillinger</span></button>`:''}<button class="user-menu-action" onclick="employeeLogout()" role="menuitem">${typeof uiIcon==='function'?uiIcon('logout','ui-icon'):''}<span>Log ud</span></button>`;
  }
  applyAppSettingsHeading();
}

const baseSyncLoginUi=window.syncLoginUi;
if(typeof baseSyncLoginUi==='function'){
  window.syncLoginUi=function(){
    const result=baseSyncLoginUi.apply(this,arguments);
    applyHeaderAdminLayout();
    return result;
  };
}

function wrapAppSettingsView(name){
  const base=window[name];
  if(typeof base!=='function'||base.__palaAppSettingsNameV185)return;
  const wrapped=function(){
    const result=base.apply(this,arguments);
    if(result&&typeof result.then==='function')return result.then(value=>{queueMicrotask(applyAppSettingsHeading);return value});
    queueMicrotask(applyAppSettingsHeading);
    return result;
  };
  wrapped.__palaAppSettingsNameV185=true;
  window[name]=wrapped;
}
['showAdmin','showAdminInventory','showAdminSpecialHardware','showAdminEmployees','showAdminBackup','showAdminWarehouseCategories'].forEach(wrapAppSettingsView);

// The compact employee editor used to tell users that PIN changes lived in the user menu.
// PIN changes are managed from the employee editor in Appindstillinger.
const baseNewEmployeeEditor=window.openNewEmployeeAdminEditor;
if(typeof baseNewEmployeeEditor==='function'){
  window.openNewEmployeeAdminEditor=function(){
    const result=baseNewEmployeeEditor.apply(this,arguments);
    queueMicrotask(()=>{
      document.querySelectorAll('#palaEditSheet .small.muted').forEach(note=>{
        if(String(note.textContent||'').trim()==='Medarbejderen kan selv ændre koden senere i brugermenuen.'){
          note.textContent='Koden kan senere ændres fra medarbejderens redigering i Appindstillinger.';
        }
      });
    });
    return result;
  };
}

if(!document.getElementById('pala-header-admin-v193-style')){
  const style=document.createElement('style');
  style.id='pala-header-admin-v193-style';
  style.textContent=`
    #na{display:none!important}
    .header-admin-mode-v184 .ui-icon{width:22px;height:22px;stroke-width:1.8}
    .header-admin-mode-v184.active{background:var(--b)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 3px 12px rgba(44,91,143,.22)!important}
    .header-admin-mode-v184.active:hover{background:var(--b)!important;color:#fff!important}
    @media(max-width:600px){.header-admin-mode-v184{flex:0 0 auto}}
  `;
  document.head.appendChild(style);
}

applyHeaderAdminLayout();
})();
