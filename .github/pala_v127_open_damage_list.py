from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v127 · open damage shortcut shows only open damage tasks'
if marker in text:
    raise SystemExit('PALA v127 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v127 · open damage shortcut shows only open damage tasks */
function renderOpenWorkshopDamageOnlyV127(){
  let host=app.querySelector('.view-list');
  if(!host)return;
  let openTasks=workshopTasks
    .filter(task=>task.status==='open')
    .sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  host.innerHTML=openTasks.length
    ?`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`
    :'<p class="muted">Ingen åbne skader.</p>';
}
showOpenWorkshopDamageListV122=function(){
  if(!requireEmployee())return;
  workshopFilter='open';
  workshopSelectedDate='';
  mainCalendarTypeFilterV120='workshop';
  mainCalendarStatusFilterV123='open';
  calendarViewMode='list';
  localStorage.setItem('pala_workshop_filter','open');
  localStorage.setItem('pala_calendar_type_filter','workshop');
  localStorage.setItem('pala_calendar_status_filter','open');
  localStorage.setItem('pala_calendar_view','list');
  showCalendar();
  renderOpenWorkshopDamageOnlyV127();
};
'''
text=text.replace(needle,patch+needle,1)
path.write_text(text,encoding='utf-8')
