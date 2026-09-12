from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v126 · open workshop damages are undated tasks'
if marker in text:
    raise SystemExit('PALA v126 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v126 · open workshop damages are undated tasks */
const calendarEventsV126Base=calendarEvents;
calendarEvents=function(start,days,mode){
  let rows=calendarEventsV126Base(start,days,mode);
  if(mode==='calendar'||mode==='workshop')return rows.filter(event=>!(event?.kind==='workshopTask'&&event?.item?.status==='open'));
  return rows;
};

mainCalendarDayHtmlV120=function(ds){
  let html=[],orders=bookingsForCalendarDate(ds).filter(bookingStatusMatchV123),workshopJobsOnDay=workshopJobs.filter(j=>workshopJobStatusMatchV123(j)&&j.start_date<=ds&&j.end_date>=ds&&j.status!=='Annulleret'),tasks=workshopTasks.filter(t=>{if(t.status==='open'||!workshopTaskStatusMatchV123(t))return false;let r=workshopTaskRangeV120(t);return r&&r.start<=ds&&r.end>=ds}),shifts=staffingShifts.filter(sh=>(isStaffLeave(sh)?staffLeaveContains(sh,ds):sh.shift_date===ds)&&shiftStatusMatchV123(sh)),meetings=(palaMeetings||[]).filter(m=>!m.cancelled&&m.start_date<=ds&&m.end_date>=ds);
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders')html.push(...orders.map(orderCard));
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing')html.push(...shifts.map(staffShiftCard));
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){html.push(...workshopJobsOnDay.map(workshopJobCard));html.push(...tasks.map(workshopTaskCard))}
  if(mainCalendarTypeFilterV120==='all'&&mainCalendarStatusFilterV123==='all')html.push(...meetings.map(meetingCard));
  return html.join('')||'<p class="calendar-empty">Ingen aktiviteter matcher filteret denne dag.</p>';
};

renderMainCalendarListV121=function(){
  if(calendarViewMode!=='list')return;let host=app.querySelector('.view-list');if(!host)return;let w=calendarWindowV121(calDate,14),entries=[];
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders')bookings.filter(b=>b.status!=='Annulleret'&&bookingStatusMatchV123(b)&&b.start_date&&b.end_date&&b.start_date<=w.last&&b.end_date>=w.first).forEach(b=>entries.push({date:b.start_date<w.first?w.first:String(b.start_date).slice(0,10),order:1,html:orderCard(b)}));
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing')staffingShifts.filter(shiftStatusMatchV123).forEach(sh=>{let leave=staffLeaveInfo(sh);if(leave){if(leave.start<=w.last&&leave.end>=w.first)entries.push({date:leave.start<w.first?w.first:leave.start,order:2,html:staffShiftCard(sh)})}else if(sh.shift_date>=w.first&&sh.shift_date<=w.last)entries.push({date:sh.shift_date,order:2,html:staffShiftCard(sh)})});
  let openTasks=[];
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){
    workshopJobs.filter(j=>j.status!=='Annulleret'&&workshopJobStatusMatchV123(j)&&j.start_date<=w.last&&j.end_date>=w.first).forEach(j=>entries.push({date:j.start_date<w.first?w.first:j.start_date,order:3,html:workshopJobCard(j)}));
    openTasks=workshopTasks.filter(t=>t.status==='open'&&workshopTaskStatusMatchV123(t)).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
    workshopTasks.filter(t=>t.status!=='open'&&workshopTaskStatusMatchV123(t)).forEach(t=>{let r=workshopTaskRangeV120(t);if(r&&r.start<=w.last&&r.end>=w.first)entries.push({date:r.start<w.first?w.first:r.start,order:4,html:workshopTaskCard(t)})});
  }
  if(mainCalendarTypeFilterV120==='all'&&mainCalendarStatusFilterV123==='all')(palaMeetings||[]).filter(m=>!m.cancelled&&m.start_date<=w.last&&m.end_date>=w.first).forEach(m=>entries.push({date:m.start_date<w.first?w.first:m.start_date,order:5,html:meetingCard(m)}));
  let taskHtml=openTasks.length?`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`:'';
  let datedHtml=entries.length?groupedCalendarListV121(entries,''):'';
  host.innerHTML=taskHtml+datedHtml||'<p class="muted">Ingen aktiviteter matcher filtrene.</p>';
};

renderWorkshopListV121=function(){
  if(workshopViewMode!=='list')return;let host=app.querySelector('.workshop-calendar-list');if(!host)return;let w=calendarWindowV121(workshopCalDate,14),entries=[];
  workshopJobs.filter(j=>workshopJobMatchesStatusV120(j)&&j.start_date<=w.last&&j.end_date>=w.first).forEach(j=>entries.push({date:j.start_date<w.first?w.first:j.start_date,order:1,html:workshopJobCard(j)}));
  let openTasks=workshopTasks.filter(t=>t.status==='open'&&workshopTaskMatchesStatusV120(t)).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  workshopTasks.filter(t=>t.status!=='open'&&workshopTaskMatchesStatusV120(t)).forEach(t=>{let r=workshopTaskRangeV120(t);if(r&&r.start<=w.last&&r.end>=w.first)entries.push({date:r.start<w.first?w.first:r.start,order:2,html:workshopTaskCard(t)})});
  let taskHtml=openTasks.length?`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`:'';
  let datedHtml=entries.length?groupedCalendarListV121(entries,''):'';
  host.innerHTML=taskHtml+datedHtml||'<p class="muted">Ingen systueaktiviteter matcher filteret.</p>';
};
'''
text=text.replace(needle,patch+needle,1)
path.write_text(text,encoding='utf-8')
