from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v120 · unified calendar filters'
if marker in text:
    raise SystemExit('PALA v120 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v120 · unified calendar filters */
let mainCalendarTypeFilterV120=localStorage.getItem('pala_calendar_type_filter')||'all';
let staffingCalendarStatusFilterV120=localStorage.getItem('pala_staffing_status_filter')||'all';
if(!['all','orders','staffing','workshop'].includes(mainCalendarTypeFilterV120))mainCalendarTypeFilterV120='all';
if(!['all','open','completed'].includes(staffingCalendarStatusFilterV120))staffingCalendarStatusFilterV120='all';

function setMainCalendarTypeFilterV120(value){mainCalendarTypeFilterV120=['orders','staffing','workshop'].includes(value)?value:'all';localStorage.setItem('pala_calendar_type_filter',mainCalendarTypeFilterV120);showCalendar()}
function setStaffingCalendarStatusFilterV120(value){staffingCalendarStatusFilterV120=['open','completed'].includes(value)?value:'all';localStorage.setItem('pala_staffing_status_filter',staffingCalendarStatusFilterV120);showStaffing()}
function setWorkshopCalendarStatusFilterV120(value){workshopFilter=['open','completed'].includes(value)?value:'all';localStorage.setItem('pala_workshop_filter',workshopFilter);showWorkshop(workshopFilter)}

function workshopTaskRangeV120(task){
  let booking=bookings.find(b=>+b.id===+task?.booking_id),created=String(task?.created_at||'').slice(0,10);
  if(booking){let start=String(booking.start_date||'').slice(0,10),end=String(booking.end_date||booking.start_date||'').slice(0,10);if(start)return {start,end:end||start}}
  return created?{start:created,end:created}:null;
}
function workshopTaskMatchesStatusV120(task,filter=workshopFilter){if(filter==='completed')return task?.status==='completed';if(filter==='open')return task?.status==='open';return true}
function workshopJobMatchesStatusV120(job,filter=workshopFilter){if(!job||job.status==='Annulleret')return false;if(filter==='completed')return job.status==='Afsluttet';if(filter==='open')return job.status!=='Afsluttet';return true}
function staffingShiftMatchesStatusV120(sh){if(isStaffLeave(sh))return true;if(staffingCalendarStatusFilterV120==='completed')return staffLinkedJobCompleted(sh);if(staffingCalendarStatusFilterV120==='open')return !staffLinkedJobCompleted(sh);return true}

const calendarEventsV120Base=calendarEvents;
function mainStaffingEventsV120(start,days){return calendarEventsV120Base(start,days,'staffing').map(event=>({...event,kind:isStaffLeave(event.item)?'staffLeave':'staffing'}))}
function mainWorkshopTaskEventsV120(start,days){
  let first=staffDateString(start),lastDate=new Date(start);lastDate.setDate(start.getDate()+days-1);let last=staffDateString(lastDate);
  return workshopTasks.map(task=>{let range=workshopTaskRangeV120(task);if(!range||range.start>last||range.end<first)return null;let tent=tents[task.tent_id];return {key:`workshop-task-${task.id}`,kind:'workshopTask',start:range.start,end:range.end,item:task,name:task.tent_name||tent?.name||'Skade'}}).filter(Boolean);
}
calendarEvents=function(start,days,mode){
  if(mode==='staffing'){
    let rows=calendarEventsV120Base(start,days,mode);if(staffingCalendarStatusFilterV120==='all')return rows;
    return rows.filter(event=>{if(isStaffLeave(event.item))return true;let items=event.items?[...event.items.values()]:[event.item];return items.some(staffingShiftMatchesStatusV120)});
  }
  if(mode==='calendar'){
    let existing=calendarEventsV120Base(start,days,mode),staffing=mainStaffingEventsV120(start,days),tasks=mainWorkshopTaskEventsV120(start,days);
    if(mainCalendarTypeFilterV120==='orders')return existing.filter(event=>!event.kind);
    if(mainCalendarTypeFilterV120==='staffing')return staffing;
    if(mainCalendarTypeFilterV120==='workshop')return existing.filter(event=>event.kind==='workshop').concat(tasks);
    return existing.concat(staffing,tasks);
  }
  return calendarEventsV120Base(start,days,mode);
};

function openWorkshopTaskFromCalendarV120(id,ds){let task=workshopTasks.find(row=>+row.id===+id);workshopFilter=task?.status==='completed'?'completed':'open';workshopSelectedDate=ds;workshopCalDate=localDateFromISO(ds)||workshopCalDate;showWorkshop(workshopFilter)}
const calendarSegmentButtonV120Base=calendarSegmentButton;
calendarSegmentButton=function(segment,ds,mode){
  let kind=segment.event?.kind;
  if(mode==='calendar'&&(kind==='staffing'||kind==='staffLeave'))return calendarSegmentButtonV120Base(segment,ds,'staffing');
  if(mode==='calendar'&&kind==='workshopTask'){
    let task=segment.item,tent=tents[task.tent_id],done=task.status==='completed',left=segment.continuesLeft?'continues-left':'',right=segment.continuesRight?'continues-right':'',labelClass=segment.showLabel?'':'continuation',color=done?'#8b929b':'#c77a42',name=task.tent_name||tent?.name||'Skade';
    return `<button type="button" class="calendar-job-chip calendar-span workshop-span workshop-task-span ${left} ${right}" style="--job-color:${color};--job-text:${esc(textOnColor(color))}" onclick="event.stopPropagation();openWorkshopTaskFromCalendarV120(${+task.id},'${ds}')" title="Skade/reparation · ${esc(name)} · ${done?'Afsluttet':'Åben'}"><span class="calendar-label ${labelClass}">${esc('Skade · '+name)}</span></button>`;
  }
  return calendarSegmentButtonV120Base(segment,ds,mode);
};

function addCalendarFilterRowV120(control,kind){
  if(!control)return;control.querySelector('.calendar-filter-row-v120')?.remove();let nav=control.querySelector('.calendar-nav-controls');if(!nav)return;
  let html='';
  if(kind==='main')html=`<div class="calendar-filter-row-v120"><span class="small muted">Vis i kalenderen</span><select class="compact-select" aria-label="Filtrér hovedkalender" onchange="setMainCalendarTypeFilterV120(this.value)"><option value="all" ${mainCalendarTypeFilterV120==='all'?'selected':''}>Alle</option><option value="orders" ${mainCalendarTypeFilterV120==='orders'?'selected':''}>Ordrer</option><option value="staffing" ${mainCalendarTypeFilterV120==='staffing'?'selected':''}>Bemanding</option><option value="workshop" ${mainCalendarTypeFilterV120==='workshop'?'selected':''}>Systue</option></select></div>`;
  if(kind==='staffing')html=`<div class="calendar-filter-row-v120"><span class="small muted">Status</span><select class="compact-select" aria-label="Filtrér bemandingskalender" onchange="setStaffingCalendarStatusFilterV120(this.value)"><option value="all" ${staffingCalendarStatusFilterV120==='all'?'selected':''}>Alle</option><option value="open" ${staffingCalendarStatusFilterV120==='open'?'selected':''}>Åbne</option><option value="completed" ${staffingCalendarStatusFilterV120==='completed'?'selected':''}>Afsluttede</option></select></div>`;
  if(kind==='workshop')html=`<div class="calendar-filter-row-v120"><span class="small muted">Status</span><select class="compact-select" aria-label="Filtrér systuekalender" onchange="setWorkshopCalendarStatusFilterV120(this.value)"><option value="all" ${workshopFilter==='all'?'selected':''}>Alle</option><option value="open" ${workshopFilter==='open'?'selected':''}>Åbne</option><option value="completed" ${workshopFilter==='completed'?'selected':''}>Afsluttede</option></select></div>`;
  nav.insertAdjacentHTML('afterend',html);
}

function mainCalendarDayHtmlV120(ds){
  let html=[],orders=bookingsForCalendarDate(ds),workshopJobsOnDay=workshopJobs.filter(j=>workshopJobMatchesStatusV120(j,'all')&&j.start_date<=ds&&j.end_date>=ds),tasks=workshopTasks.filter(t=>{let r=workshopTaskRangeV120(t);return r&&r.start<=ds&&r.end>=ds}),shifts=staffingShifts.filter(sh=>isStaffLeave(sh)?staffLeaveContains(sh,ds):sh.shift_date===ds),meetings=(palaMeetings||[]).filter(m=>!m.cancelled&&m.start_date<=ds&&m.end_date>=ds);
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders')html.push(...orders.map(orderCard));
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing')html.push(...shifts.map(staffShiftCard));
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){html.push(...workshopJobsOnDay.map(workshopJobCard));html.push(...tasks.map(workshopTaskCard))}
  if(mainCalendarTypeFilterV120==='all')html.push(...meetings.map(meetingCard));
  return html.join('')||'<p class="calendar-empty">Ingen aktiviteter matcher filteret denne dag.</p>';
}
function applyMainCalendarFilterUiV120(){
  let control=app.querySelector('.calendar-control-card');addCalendarFilterRowV120(control,'main');
  let caption=app.querySelector('.calendar-grid-caption');if(caption)caption.textContent='Tryk på en ordre, vagt eller systueopgave for detaljer. Stryg til siden for at skifte periode.';
  if(calendarViewMode==='calendar'){
    let host=app.querySelector('.calendar-detail-list'),ds=staffDateString(calDate);if(host)host.innerHTML=mainCalendarDayHtmlV120(ds);
  }
}

function filteredStaffingRowsForDateV120(ds){return staffingShifts.filter(sh=>(isStaffLeave(sh)?staffLeaveContains(sh,ds):sh.shift_date===ds)&&staffingShiftMatchesStatusV120(sh)).sort((a,b)=>(isStaffLeave(a)?1:0)-(isStaffLeave(b)?1:0)||String(a.start_time||'').localeCompare(String(b.start_time||''))||a.id-b.id)}
function applyStaffingCalendarFilterUiV120(){
  let control=app.querySelector('.calendar-control-card');addCalendarFilterRowV120(control,'staffing');
  if(staffingViewMode==='calendar'&&staffSelectedDate){let grid=app.querySelector('.calendar-grid-card'),card=grid?.nextElementSibling;if(card?.classList.contains('card')){let rows=filteredStaffingRowsForDateV120(staffSelectedDate),head=card.querySelector('h2')?.outerHTML||`<h2>${esc(weekdayDateDa(staffSelectedDate))}</h2>`;card.innerHTML=`<div><div class="small muted">UGE ${isoWeekNumber(staffSelectedDate)}</div>${head}</div>${rows.length?rows.map(staffShiftCard).join(''):'<p class="muted">Ingen vagter matcher filteret denne dag.</p>'}`}}
}

function applyWorkshopCalendarFilterUiV120(){
  app.querySelector('.workshop-calendar-filter-card')?.remove();app.querySelector('.workshop-list')?.remove();
  [...app.querySelectorAll('section.card')].filter(section=>section.querySelector('.small.muted')?.textContent.trim()==='ARBEJDSLISTE').forEach(section=>section.remove());
  let control=app.querySelector('.workshop-control-card')||app.querySelector('.calendar-control-card');addCalendarFilterRowV120(control,'workshop');
}

if(!document.getElementById('pala-v120-calendar-filter-style')){let style=document.createElement('style');style.id='pala-v120-calendar-filter-style';style.textContent=`.calendar-filter-row-v120{display:flex;align-items:center;gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid #edf1f5}.calendar-filter-row-v120 .compact-select{width:auto;min-width:180px;margin-left:auto}@media(max-width:620px){.calendar-filter-row-v120{gap:8px}.calendar-filter-row-v120 .compact-select{flex:1 1 auto;min-width:0;max-width:240px}}`;document.head.appendChild(style)}

const showCalendarV120=showCalendar;
showCalendar=async function(){let result=await showCalendarV120.apply(this,arguments);applyMainCalendarFilterUiV120();return result};
const showStaffingV120=showStaffing;
showStaffing=function(){let result=showStaffingV120.apply(this,arguments);applyStaffingCalendarFilterUiV120();return result};
const showWorkshopV120=showWorkshop;
showWorkshop=function(){let result=showWorkshopV120.apply(this,arguments);applyWorkshopCalendarFilterUiV120();return result};
'''
text=text.replace(needle,patch+needle,1)
if text.count(marker)!=1: raise SystemExit('Marker verification failed')
for required in ['mainCalendarTypeFilterV120','calendar-filter-row-v120','mainStaffingEventsV120','applyWorkshopCalendarFilterUiV120']:
    if required not in text: raise SystemExit(f'Missing required marker: {required}')
path.write_text(text,encoding='utf-8')
print('Applied PALA v120 unified calendar filters')
