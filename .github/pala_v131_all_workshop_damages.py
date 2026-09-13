from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = 'PALA v131 · systue summary shows all damage tasks'
if marker in text:
    raise SystemExit('PALA v131 already present')

needle = '\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch = r'''

/* PALA v131 · systue summary shows all damage tasks */
function renderWorkshopSummaryAllDamagesV131(){
  let host=app.querySelector('.view-list');
  if(!host)return;

  let w=calendarWindowV121(calDate,14);
  let jobs=workshopJobs
    .filter(job=>job.status!=='Annulleret'&&job.start_date<=w.last&&job.end_date>=w.first)
    .sort((a,b)=>String(a.start_date||'').localeCompare(String(b.start_date||''))||alpha(a.title,b.title));
  let openTasks=workshopTasks
    .filter(task=>task.status==='open')
    .sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  let completedTasks=workshopTasks
    .filter(task=>task.status==='completed')
    .sort((a,b)=>String(b.completed_at||b.updated_at||b.created_at||'').localeCompare(String(a.completed_at||a.updated_at||a.created_at||'')));

  let html='';
  if(openTasks.length){
    html+=`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`;
  }
  if(jobs.length){
    let entries=jobs.map(job=>({date:job.start_date<w.first?w.first:job.start_date,order:1,html:workshopJobCard(job)}));
    html+=`<section class="view-list-group"><div class="small muted">SYSTUEJOBS I PERIODEN</div></section>${groupedCalendarListV121(entries,'')}`;
  }
  if(completedTasks.length){
    html+=`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Afsluttede skader</h3>${completedTasks.map(workshopTaskCard).join('')}</section>`;
  }
  host.innerHTML=html||'<p class="muted">Ingen systuejobs eller skader er registreret.</p>';
}

const openUnifiedSummaryListV131Base=openUnifiedSummaryListV125;
openUnifiedSummaryListV125=async function(type){
  if(type!=='workshop')return openUnifiedSummaryListV131Base(type);
  mainCalendarTypeFilterV120='workshop';
  mainCalendarStatusFilterV123='all';
  calendarViewMode='list';
  localStorage.setItem('pala_calendar_type_filter','workshop');
  localStorage.setItem('pala_calendar_status_filter','all');
  localStorage.setItem('pala_calendar_view','list');
  await showCalendar();
  renderWorkshopSummaryAllDamagesV131();
};
'''

path.write_text(text.replace(needle, patch + needle, 1), encoding='utf-8')
