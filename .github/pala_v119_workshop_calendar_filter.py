from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v119 · workshop worklist is calendar filter only'
if marker in text:
    raise SystemExit('PALA v119 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v119 · workshop worklist is calendar filter only */
function workshopJobMatchesFilterV119(job){
  if(!job||job.status==='Annulleret')return false;
  if(workshopFilter==='completed')return job.status==='Afsluttet';
  if(workshopFilter==='open')return job.status!=='Afsluttet';
  return true;
}
function workshopTaskMatchesFilterV119(task){
  if(!task)return false;
  if(workshopFilter==='completed')return task.status==='completed';
  if(workshopFilter==='open')return task.status==='open';
  return true;
}
function workshopTaskCalendarRangeV119(task){
  let booking=bookings.find(b=>+b.id===+task.booking_id),created=String(task?.created_at||'').slice(0,10);
  if(booking){
    let start=String(booking.start_date||'').slice(0,10),end=String(booking.end_date||booking.start_date||'').slice(0,10);
    if(start)return {start,end:end||start};
  }
  return created?{start:created,end:created}:null;
}
function workshopCalendarEventsFilteredV119(start,days){
  let first=staffDateString(start),last=new Date(start);last.setDate(start.getDate()+days-1);let end=staffDateString(last);
  let jobs=workshopJobs.filter(j=>workshopJobMatchesFilterV119(j)&&j.start_date<=end&&j.end_date>=first).map(j=>({key:`workshop-${j.id}`,kind:'workshop',start:j.start_date,end:j.end_date,item:j,name:j.title}));
  let tasks=workshopTasks.filter(workshopTaskMatchesFilterV119).map(task=>{let range=workshopTaskCalendarRangeV119(task);if(!range||range.start>end||range.end<first)return null;let tent=tents[task.tent_id];return {key:`workshop-task-${task.id}`,kind:'workshopTask',start:range.start,end:range.end,item:task,name:task.tent_name||tent?.name||'Skade'}}).filter(Boolean);
  return jobs.concat(tasks).sort((a,b)=>String(a.start).localeCompare(String(b.start))||alpha(a.name,b.name));
}
const calendarEventsV119=calendarEvents;
calendarEvents=function(start,days,mode){
  if(mode==='workshop')return workshopCalendarEventsFilteredV119(start,days);
  return calendarEventsV119(start,days,mode);
};
const calendarSegmentButtonV119=calendarSegmentButton;
calendarSegmentButton=function(segment,ds,mode){
  if(mode!=='workshop'||segment.event?.kind!=='workshopTask')return calendarSegmentButtonV119(segment,ds,mode);
  let task=segment.item,tent=tents[task.tent_id],done=task.status==='completed',left=segment.continuesLeft?'continues-left':'',right=segment.continuesRight?'continues-right':'',labelClass=segment.showLabel?'':'continuation',color=done?'#8b929b':'#c77a42',name=task.tent_name||tent?.name||'Skade';
  return `<button type="button" class="calendar-job-chip calendar-span workshop-span workshop-task-span ${left} ${right}" style="--job-color:${color};--job-text:${esc(textOnColor(color))}" onclick="event.stopPropagation();${task.tent_id?`openTent(${+task.tent_id})`:'showWorkshop(workshopFilter)'}" title="Skade/reparation · ${esc(name)} · ${done?'Afsluttet':'Åben'}"><span class="calendar-label ${labelClass}">${esc('Skade · '+name)}</span></button>`;
};
function workshopFilteredDayItemsV119(ds){
  let jobs=workshopJobs.filter(j=>workshopJobMatchesFilterV119(j)&&j.start_date<=ds&&j.end_date>=ds).sort((a,b)=>alpha(a.title,b.title));
  let tasks=workshopTasks.filter(t=>{if(!workshopTaskMatchesFilterV119(t))return false;let range=workshopTaskCalendarRangeV119(t);return !!range&&range.start<=ds&&range.end>=ds}).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  return {jobs,tasks};
}
function applyWorkshopCalendarFilterUiV119(){
  let worklist=[...app.querySelectorAll('section.card')].find(section=>section.querySelector('.small.muted')?.textContent.trim()==='ARBEJDSLISTE'&&section.querySelector('h3')?.textContent.trim()==='Skader og reparationer');
  app.querySelector('.workshop-list')?.remove();
  if(worklist){
    worklist.classList.add('workshop-calendar-filter-card');
    worklist.innerHTML=`<div class="row"><div><div class="small muted">KALENDERFILTER</div><h3>Vis systueopgaver</h3></div><select aria-label="Filtrér systuekalender" style="width:auto" onchange="showWorkshop(this.value)"><option value="open" ${workshopFilter==='open'?'selected':''}>Åbne</option><option value="completed" ${workshopFilter==='completed'?'selected':''}>Afsluttede</option><option value="all" ${workshopFilter==='all'?'selected':''}>Alle</option></select></div><p class="small muted" style="margin:8px 0 0">Filteret gælder både planlagte systuejobs og skader/reparationer i kalenderen.</p>`;
    let grid=app.querySelector('.calendar-grid-card');
    if(grid){worklist.style.display='';grid.before(worklist)}else worklist.style.display='none';
  }
  if(workshopViewMode!=='calendar'||!workshopSelectedDate)return;
  let grid=app.querySelector('.calendar-grid-card'),card=grid?.nextElementSibling;if(!card||!card.classList.contains('card'))return;
  let ds=workshopSelectedDate,{jobs,tasks}=workshopFilteredDayItemsV119(ds);
  let jobHtml=jobs.length?`<div class="small muted" style="margin-top:16px">PLANLAGTE SYSTUEJOBS</div><div class="workshop-day-jobs">${jobs.map(workshopJobCard).join('')}</div>`:'';
  let taskHtml=tasks.length?`<div class="small muted" style="margin-top:16px">SKADER OG REPARATIONER</div><div class="workshop-day-tasks">${tasks.map(workshopTaskCard).join('')}</div>`:'';
  card.classList.add('workshop-day-overview');
  card.innerHTML=`<div class="small muted">DAGENS SYSTUE</div><h2>${esc(weekdayDateDa(ds))}</h2>${jobHtml}${taskHtml}${!jobs.length&&!tasks.length?'<p class="muted">Ingen systueaktiviteter matcher filteret denne dag.</p>':''}`;
}
const showWorkshopV119=showWorkshop;
showWorkshop=function(){let result=showWorkshopV119.apply(this,arguments);applyWorkshopCalendarFilterUiV119();return result};
'''
text=text.replace(needle,patch+needle,1)
if text.count(marker)!=1: raise SystemExit('Marker verification failed')
for required in ['workshopCalendarEventsFilteredV119','KALENDERFILTER','workshop-list','workshopTaskCalendarRangeV119']:
    if required not in text: raise SystemExit(f'Missing required marker: {required}')
path.write_text(text,encoding='utf-8')
print('Applied PALA v119 workshop calendar filter patch')
