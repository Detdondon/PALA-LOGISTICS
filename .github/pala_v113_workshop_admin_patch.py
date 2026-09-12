from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = 'PALA v113 · unified workshop controls and admin-only backup navigation'
if marker in text:
    print('v113 patch already applied')
    raise SystemExit(0)

closing = text.rfind('\n</script>')
if closing < 0:
    raise SystemExit('Could not find final script closing tag')

block = r'''

/* PALA v113 · unified workshop controls and admin-only backup navigation */
function unifyWorkshopTopV113(){
  let controls=app.querySelector('.calendar-control-card'),hero=app.querySelector('.workshop-hero');
  if(!controls)return;
  let anchor=new Date(workshopCalDate),start=new Date(anchor);start.setDate(anchor.getDate()-((anchor.getDay()+6)%7));
  let days=workshopViewMode==='calendar'?28:14,end=new Date(start);end.setDate(start.getDate()+days-1);
  let startISO=staffDateString(start),endISO=staffDateString(end),open=workshopTasks.filter(x=>x.status==='open'),tentCount=new Set(open.map(x=>+x.tent_id)).size;
  let periodJobs=workshopJobs.filter(j=>j.start_date<=endISO&&j.end_date>=startISO&&j.status!=='Annulleret');
  let subtitle=controls.querySelector('.calendar-toolbar-title .muted');
  if(subtitle)subtitle.textContent=`Systue · ${fmtDateDa(startISO)} – ${fmtDateDa(endISO)} · ${workshopViewMode==='calendar'?'4 uger':'2 uger'}`;
  controls.querySelector('.calendar-meta')?.remove();
  let meta=document.createElement('div');meta.className='calendar-meta workshop-calendar-meta';
  meta.innerHTML=`<button type="button" class="pill reference-button ${open.length?'red':'green'}" onclick="showWorkshop('open')" aria-label="Vis åbne skader">${open.length?uiIcon('alert')+`${open.length} ${open.length===1?'åben skade':'åbne skader'}`:uiIcon('check')+'Ingen åbne skader'}</button><button type="button" class="pill reference-button" onclick="showWorkshop('open')" aria-label="Vis telte med skader">${uiIcon('tent')}${tentCount} ${tentCount===1?'telt med skade':'telte med skader'}</button><button type="button" class="pill reference-button" onclick="setWorkshopView('list')" aria-label="Vis systuejobs i perioden">${uiIcon('scissors')}${periodJobs.length} ${periodJobs.length===1?'systuejob':'systuejobs'} i perioden</button><button type="button" class="btn calendar-meta-action" onclick="showDamageForm()">${uiIcon('plus')} Registrér skade</button>${isAdminLoggedIn()?`<button type="button" class="btn primary calendar-meta-action" onclick="showWorkshopJobForm()">${uiIcon('plus')} Opret job</button>`:''}`;
  let nav=controls.querySelector('.calendar-nav-controls');
  if(nav)nav.insertAdjacentElement('afterend',meta);else controls.appendChild(meta);
  hero?.remove();
  if(controls.parentElement?.firstElementChild!==controls)controls.parentElement?.prepend(controls);
}
const showWorkshopV113=showWorkshop;
showWorkshop=function(){let result=showWorkshopV113.apply(this,arguments);unifyWorkshopTopV113();return result};

const adminTabsV113=adminTabs;
adminTabs=function(activeTab){
  let html=adminTabsV113(activeTab);
  if(html.includes('showAdminBackup()'))return html;
  let button=`<button class="btn ${activeTab==='backup'?'primary':''}" onclick="showAdminBackup()">${uiIcon('document','ui-icon icon-action')} Backup</button>`;
  let anchor=html.indexOf('<span class="small muted"');
  return anchor>=0?html.slice(0,anchor)+button+html.slice(anchor):html.replace('</div>',button+'</div>');
};

const syncLoginUiV113=syncLoginUi;
syncLoginUi=function(){
  let result=syncLoginUiV113.apply(this,arguments);
  document.querySelectorAll('[data-admin-backup-shortcut]').forEach(el=>el.remove());
  return result;
};
const showCalendarV113=showCalendar;
showCalendar=async function(){
  let result=await showCalendarV113.apply(this,arguments);
  app.querySelectorAll('[data-backup-shortcut]').forEach(el=>el.remove());
  return result;
};

syncLoginUi();
'''

text = text[:closing] + block + text[closing:]
if text.count(marker) != 1:
    raise SystemExit('v113 marker verification failed')
for required in [
    'unifyWorkshopTopV113',
    "className='calendar-meta workshop-calendar-meta'",
    "onclick=\"showAdminBackup()\"",
    "querySelectorAll('[data-admin-backup-shortcut]')",
    "querySelectorAll('[data-backup-shortcut]')",
]:
    if required not in text:
        raise SystemExit('Missing required v113 marker: '+required)
path.write_text(text, encoding='utf-8')
print('Applied v113 workshop/admin UI patch')
