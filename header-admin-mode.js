/* PALA v184 · header admin mode access
   Adminmode is toggled from the top bar. The user dropdown only exposes Adminmenu + Log ud. */
(()=>{
'use strict';
if(window.__palaHeaderAdminModeV184)return;
window.__palaHeaderAdminModeV184=true;

function adminModeOn(){
  try{return !!employeeIsAdmin&&!!adminModeEnabled}catch(_e){return false}
}
function adminEmployee(){
  try{return !!employeeIsAdmin}catch(_e){return false}
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
};

function applyHeaderAdminLayout(){
  const logged=typeof isEmployeeLoggedIn==='function'&&isEmployeeLoggedIn();
  const actions=document.querySelector('.header-actions');
  const nav=document.querySelector('.nav');
  const adminNav=document.getElementById('na');

  // Adminmenu is no longer a bottom-navigation destination.
  if(adminNav){
    adminNav.hidden=true;
    adminNav.style.display='none';
    adminNav.setAttribute('aria-hidden','true');
  }
  if(nav&&logged)nav.style.gridTemplateColumns='repeat(4,1fr)';
  if(!actions||!logged)return;

  actions.querySelector('.header-admin-mode-v184')?.remove();
  const userMenu=actions.querySelector('.user-menu');
  if(!userMenu)return;

  // Dedicated Adminmode button, positioned between search and user.
  if(adminEmployee()){
    const active=adminModeOn();
    const button=document.createElement('button');
    button.type='button';
    button.className='header-icon header-admin-mode-v184'+(active?' active':'');
    button.setAttribute('onclick','toggleHeaderAdminModeV184()');
    button.setAttribute('aria-label',active?'Slå Adminmode fra':'Slå Adminmode til');
    button.setAttribute('aria-pressed',active?'true':'false');
    button.setAttribute('title',active?'Adminmode aktiv':'Adminmode');
    button.innerHTML=typeof uiIcon==='function'?uiIcon('settings','ui-icon'):'';
    userMenu.insertAdjacentElement('beforebegin',button);
  }

  // Dropdown: identity + Adminmenu (admins only) + Log ud. Nothing else.
  const popover=userMenu.querySelector('#userMenuPopover');
  if(popover){
    const role=adminEmployee()?(adminModeOn()?'Administrator · Adminmode aktiv':'Administrator'):'Medarbejder';
    popover.innerHTML=`<div class="user-menu-identity"><strong>${typeof esc==='function'?esc(employeeName):String(employeeName||'')}</strong><div class="user-menu-role ${adminModeOn()?'mode-on':''}">${role}</div></div>${adminEmployee()?`<button class="user-menu-action" onclick="openAdminMenuFromUserV184()" role="menuitem">${typeof uiIcon==='function'?uiIcon('settings','ui-icon'):''}<span>Adminmenu</span></button>`:''}<button class="user-menu-action" onclick="employeeLogout()" role="menuitem">${typeof uiIcon==='function'?uiIcon('logout','ui-icon'):''}<span>Log ud</span></button>`;
  }
}

const baseSyncLoginUi=window.syncLoginUi;
if(typeof baseSyncLoginUi==='function'){
  window.syncLoginUi=function(){
    const result=baseSyncLoginUi.apply(this,arguments);
    applyHeaderAdminLayout();
    return result;
  };
}

if(!document.getElementById('pala-header-admin-v184-style')){
  const style=document.createElement('style');
  style.id='pala-header-admin-v184-style';
  style.textContent=`
    #na{display:none!important}
    .header-admin-mode-v184.active{background:var(--b)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 3px 12px rgba(44,91,143,.22)!important}
    .header-admin-mode-v184.active:hover{background:var(--b)!important;color:#fff!important}
    @media(max-width:600px){.header-admin-mode-v184{flex:0 0 auto}}
  `;
  document.head.appendChild(style);
}

applyHeaderAdminLayout();
})();
