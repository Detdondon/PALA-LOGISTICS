from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = 'PALA v111 · visible admin backup shortcut'
if marker in text:
    raise SystemExit('Backup shortcut already installed')
needle = '</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find script end')
block = r'''

/* PALA v111 · visible admin backup shortcut */
const syncLoginUiBackupV111=syncLoginUi;
syncLoginUi=function(){
  syncLoginUiBackupV111();
  if(!isAdminLoggedIn())return;
  let menu=document.getElementById('userMenuPopover');
  if(menu&&!menu.querySelector('[data-admin-backup-shortcut]')){
    let button=document.createElement('button');
    button.type='button';button.className='user-menu-action';button.dataset.adminBackupShortcut='1';button.setAttribute('role','menuitem');
    button.innerHTML=uiIcon('document','ui-icon')+'<span>Sikkerhedsbackup</span>';
    button.onclick=function(){closeUserMenu();showAdminBackup()};
    let logout=[...menu.querySelectorAll('.user-menu-action')].find(el=>(el.getAttribute('onclick')||'').includes('employeeLogout'));
    if(logout)menu.insertBefore(button,logout);else menu.appendChild(button);
  }
};
const showCalendarBackupV111=showCalendar;
showCalendar=async function(){
  await showCalendarBackupV111();
  if(!isAdminLoggedIn())return;
  let meta=app.querySelector('.calendar-meta');
  if(meta&&!meta.querySelector('[data-backup-shortcut]'))meta.insertAdjacentHTML('beforeend',`<button class="btn" data-backup-shortcut onclick="showAdminBackup()">${uiIcon('document')} ZIP-backup</button>`);
};
syncLoginUi();
'''
text = text.replace(needle, block + '\n' + needle, 1)
required = [marker, "data-admin-backup-shortcut", "showAdminBackup()", "data-backup-shortcut", "ZIP-backup"]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit('Verification failed: ' + repr(missing))
path.write_text(text, encoding='utf-8')
