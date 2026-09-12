from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v118 · whole-workshop selected-day overview'
if marker in text:
    raise SystemExit('PALA v118 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v118 · whole-workshop selected-day overview */
function workshopTaskAppliesToDateV118(task,ds){
  if(!task||!ds)return false;
  if(String(task.created_at||'').slice(0,10)===ds)return true;
  let booking=bookings.find(b=>+b.id===+task.booking_id);
  if(!booking)return false;
  let start=String(booking.start_date||'').slice(0,10),end=String(booking.end_date||booking.start_date||'').slice(0,10);
  return !!start&&start<=ds&&end>=ds;
}
function updateWorkshopDayOverviewV118(){
  if(workshopViewMode!=='calendar'||!workshopSelectedDate)return;
  let grid=app.querySelector('.calendar-grid-card');if(!grid)return;
  let card=grid.nextElementSibling;if(!card||!card.classList.contains('card'))return;
  let ds=workshopSelectedDate;
  let jobs=workshopJobs.filter(j=>j.start_date<=ds&&j.end_date>=ds&&j.status!=='Annulleret').sort((a,b)=>alpha(a.title,b.title));
  let tasks=workshopTasks.filter(t=>workshopTaskAppliesToDateV118(t,ds)).sort((a,b)=>(a.status==='open'?0:1)-(b.status==='open'?0:1)||String(b.created_at||'').localeCompare(String(a.created_at||'')));
  card.classList.add('workshop-day-overview');
  let jobHtml=jobs.length?`<div class="small muted" style="margin-top:16px">PLANLAGTE SYSTUEJOBS</div><div class="workshop-day-jobs">${jobs.map(workshopJobCard).join('')}</div>`:'';
  let taskHtml=tasks.length?`<div class="small muted" style="margin-top:16px">SKADER OG REPARATIONER</div><div class="workshop-day-tasks">${tasks.map(workshopTaskCard).join('')}</div>`:'';
  card.innerHTML=`<div class="small muted">DAGENS SYSTUE</div><h2>${esc(weekdayDateDa(ds))}</h2>${jobHtml}${taskHtml}${!jobs.length&&!tasks.length?'<p class="muted">Ingen systueaktiviteter denne dag.</p>':''}`;
}
const showWorkshopV118=showWorkshop;
showWorkshop=function(){let result=showWorkshopV118.apply(this,arguments);updateWorkshopDayOverviewV118();return result};
'''
text=text.replace(needle,patch+needle,1)
if text.count(marker)!=1: raise SystemExit('Marker verification failed')
if 'Ingen systueaktiviteter denne dag.' not in text: raise SystemExit('Day overview empty state missing')
if 'workshopTaskAppliesToDateV118' not in text: raise SystemExit('Damage/date helper missing')
path.write_text(text,encoding='utf-8')
print('Applied PALA v118 workshop day overview')
