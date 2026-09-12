from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v121 · calendar filter list consistency'
if marker in text:
    raise SystemExit('PALA v121 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v121 · calendar filter list consistency */
function calendarWindowV121(anchor,days){let start=new Date(anchor);start.setDate(start.getDate()-((start.getDay()+6)%7));let end=new Date(start);end.setDate(start.getDate()+days-1);return {start,end,first:staffDateString(start),last:staffDateString(end)}}
function groupedCalendarListV121(entries,emptyText){
  entries.sort((a,b)=>a.date.localeCompare(b.date)||(a.order||0)-(b.order||0));let dates=[...new Set(entries.map(x=>x.date))];
  return dates.map(ds=>`<section class="view-list-group" data-date="${ds}"><h3 class="view-list-date">${listDateHeading(ds)}</h3>${entries.filter(x=>x.date===ds).map(x=>x.html).join('')}</section>`).join('')||`<p class="muted">${esc(emptyText)}</p>`;
}
function renderMainCalendarListV121(){
  if(calendarViewMode!=='list')return;let host=app.querySelector('.view-list');if(!host)return;let w=calendarWindowV121(calDate,14),entries=[];
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders')bookings.filter(b=>b.status!=='Annulleret'&&b.start_date&&b.end_date&&b.start_date<=w.last&&b.end_date>=w.first).forEach(b=>entries.push({date:b.start_date<w.first?w.first:String(b.start_date).slice(0,10),order:1,html:orderCard(b)}));
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing')staffingShifts.forEach(sh=>{let leave=staffLeaveInfo(sh);if(leave){if(leave.start<=w.last&&leave.end>=w.first)entries.push({date:leave.start<w.first?w.first:leave.start,order:2,html:staffShiftCard(sh)})}else if(sh.shift_date>=w.first&&sh.shift_date<=w.last)entries.push({date:sh.shift_date,order:2,html:staffShiftCard(sh)})});
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){
    workshopJobs.filter(j=>j.status!=='Annulleret'&&j.start_date<=w.last&&j.end_date>=w.first).forEach(j=>entries.push({date:j.start_date<w.first?w.first:j.start_date,order:3,html:workshopJobCard(j)}));
    workshopTasks.forEach(t=>{let r=workshopTaskRangeV120(t);if(r&&r.start<=w.last&&r.end>=w.first)entries.push({date:r.start<w.first?w.first:r.start,order:4,html:workshopTaskCard(t)})});
  }
  if(mainCalendarTypeFilterV120==='all')(palaMeetings||[]).filter(m=>!m.cancelled&&m.start_date<=w.last&&m.end_date>=w.first).forEach(m=>entries.push({date:m.start_date<w.first?w.first:m.start_date,order:5,html:meetingCard(m)}));
  host.innerHTML=groupedCalendarListV121(entries,'Ingen aktiviteter matcher filteret i perioden.');
}
function renderStaffingListV121(){
  if(staffingViewMode!=='list')return;let host=app.querySelector('.view-list');if(!host)return;let w=calendarWindowV121(staffCalDate,14),entries=[];
  staffingShifts.filter(staffingShiftMatchesStatusV120).forEach(sh=>{let leave=staffLeaveInfo(sh);if(leave){if(leave.start<=w.last&&leave.end>=w.first)entries.push({date:leave.start<w.first?w.first:leave.start,html:staffShiftCard(sh)})}else if(sh.shift_date>=w.first&&sh.shift_date<=w.last)entries.push({date:sh.shift_date,html:staffShiftCard(sh)})});
  host.innerHTML=groupedCalendarListV121(entries,'Ingen vagter matcher filteret i perioden.');
}
function renderWorkshopListV121(){
  if(workshopViewMode!=='list')return;let host=app.querySelector('.workshop-calendar-list');if(!host)return;let w=calendarWindowV121(workshopCalDate,14),entries=[];
  workshopJobs.filter(j=>workshopJobMatchesStatusV120(j)&&j.start_date<=w.last&&j.end_date>=w.first).forEach(j=>entries.push({date:j.start_date<w.first?w.first:j.start_date,order:1,html:workshopJobCard(j)}));
  workshopTasks.filter(t=>workshopTaskMatchesStatusV120(t)).forEach(t=>{let r=workshopTaskRangeV120(t);if(r&&r.start<=w.last&&r.end>=w.first)entries.push({date:r.start<w.first?w.first:r.start,order:2,html:workshopTaskCard(t)})});
  host.innerHTML=groupedCalendarListV121(entries,'Ingen systueaktiviteter matcher filteret i perioden.');
}
applyStaffingCalendarFilterUiV120=function(){
  let control=app.querySelector('.calendar-control-card');addCalendarFilterRowV120(control,'staffing');
  if(staffingViewMode==='calendar'&&staffSelectedDate){let grid=app.querySelector('.calendar-grid-card'),card=grid?.nextElementSibling;if(card?.classList.contains('card')){let rows=filteredStaffingRowsForDateV120(staffSelectedDate),header=card.querySelector('.row')?.outerHTML||`<div class="row"><div><div class="small muted">UGE ${isoWeekNumber(staffSelectedDate)}</div><h2 style="margin:2px 0">${esc(weekdayDateDa(staffSelectedDate))}</h2></div><button class="btn" onclick="staffSelectedDate='';showStaffing()">${uiIcon('close')} Luk</button></div>`;card.innerHTML=header+(rows.length?rows.map(staffShiftCard).join(''):'<p class="muted">Ingen vagter matcher filteret denne dag.</p>')}}
};
const showCalendarV121=showCalendar;
showCalendar=async function(){let result=await showCalendarV121.apply(this,arguments);renderMainCalendarListV121();return result};
const showStaffingV121=showStaffing;
showStaffing=function(){let result=showStaffingV121.apply(this,arguments);renderStaffingListV121();return result};
const showWorkshopV121=showWorkshop;
showWorkshop=function(){let result=showWorkshopV121.apply(this,arguments);renderWorkshopListV121();return result};
'''
text=text.replace(needle,patch+needle,1)
if text.count(marker)!=1: raise SystemExit('Marker verification failed')
for required in ['renderMainCalendarListV121','renderStaffingListV121','renderWorkshopListV121']:
    if required not in text: raise SystemExit(f'Missing required marker: {required}')
path.write_text(text,encoding='utf-8')
print('Applied PALA v121 calendar filter list consistency')
