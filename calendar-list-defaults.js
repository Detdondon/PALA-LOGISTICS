/* PALA v296 · calendar list starts at the selected date and shows everything forward. */
(()=>{
'use strict';
if(window.__palaCalendarListDefaultsV296)return;
window.__palaCalendarListDefaultsV296=true;

function selectedCalendarListStartV296(){
  const start=new Date(calDate.getFullYear(),calDate.getMonth(),calDate.getDate());
  return {start,first:staffDateString(start)};
}

function updateSelectedListLabelV296(){
  if(calendarViewMode!=='list')return;
  const title=document.querySelector('.calendar-toolbar-title .small.muted');
  if(!title)return;
  const start=selectedCalendarListStartV296().start;
  const label=new Intl.DateTimeFormat('da-DK',{day:'numeric',month:'short',year:'numeric'}).format(start);
  title.textContent=`Kalender · Fra ${label} og frem`;
}

function activeFutureCountsV296(){
  const first=selectedCalendarListStartV296().first;
  const orders=bookings.filter(b=>b.status!=='Annulleret'&&b.start_date&&b.end_date&&String(b.end_date).slice(0,10)>=first).length;
  const shifts=staffingShifts.filter(sh=>{
    const leave=staffLeaveInfo(sh);
    return leave?leave.end>=first:String(sh.shift_date||'')>=first;
  }).length;
  const workshop=workshopJobs.filter(j=>j.status!=='Annulleret'&&j.end_date&&String(j.end_date).slice(0,10)>=first).length
    +workshopTasks.filter(t=>{const r=workshopTaskRangeV120(t);return r&&r.end>=first}).length;
  const openDamage=workshopTasks.filter(t=>t.status==='open'&&(()=>{const r=workshopTaskRangeV120(t);return r&&r.end>=first})()).length;
  const under=staffingShifts.filter(sh=>!isStaffLeave(sh)&&String(sh.shift_date||'')>=first&&staffAssignmentsFor(sh.id).length<(+sh.workers_needed||1)).length;
  return {orders,shifts,workshop,openDamage,under};
}

/* Summary counters follow the exact same selected-date-forward rule in list view. */
if(typeof unifiedPeriodCountsV123==='function'){
  const baseUnifiedPeriodCountsV296=unifiedPeriodCountsV123;
  unifiedPeriodCountsV123=function(){
    return calendarViewMode==='list'?activeFutureCountsV296():baseUnifiedPeriodCountsV296.apply(this,arguments);
  };
}

/* Final main-calendar list renderer. No dates before calDate and no artificial 14-day end date. */
if(typeof renderMainCalendarListV121==='function'){
  renderMainCalendarListV121=function(){
    if(calendarViewMode!=='list')return;
    const host=app.querySelector('.view-list');if(!host)return;
    const first=selectedCalendarListStartV296().first;
    const entries=[];
    const understaffedOnly=mainCalendarTypeFilterV120==='staffing'&&mainCalendarStatusFilterV123==='understaffed';
    const listDate=start=>String(start||'').slice(0,10)<first?first:String(start||'').slice(0,10);

    if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders'){
      bookings
        .filter(b=>bookingActiveInListV139(b)&&b.start_date&&b.end_date&&String(b.end_date).slice(0,10)>=first)
        .forEach(b=>entries.push({date:listDate(b.start_date),order:1,html:orderCard(b)}));
    }

    if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing'){
      staffingShifts
        .filter(sh=>shiftActiveInListV139(sh)&&(!understaffedOnly||shiftUnderstaffedV139(sh)))
        .forEach(sh=>{
          const leave=staffLeaveInfo(sh);
          if(leave){
            if(!understaffedOnly&&leave.end>=first)entries.push({date:listDate(leave.start),order:2,html:staffShiftCard(sh)});
          }else if(String(sh.shift_date||'')>=first){
            entries.push({date:String(sh.shift_date).slice(0,10),order:2,html:staffShiftCard(sh)});
          }
        });
    }

    if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){
      workshopJobs
        .filter(j=>workshopActiveInListV139(j)&&j.start_date&&j.end_date&&String(j.end_date).slice(0,10)>=first)
        .forEach(j=>entries.push({date:listDate(j.start_date),order:3,html:workshopJobCard(j)}));

      /* Open workshop tasks are dated by their booking range or creation date, so they obey the same rule. */
      workshopTasks
        .filter(t=>t.status==='open')
        .forEach(t=>{
          const r=workshopTaskRangeV120(t);
          if(r&&r.end>=first)entries.push({date:listDate(r.start),order:4,html:workshopTaskCard(t)});
        });
    }

    if(mainCalendarTypeFilterV120==='all'){
      (palaMeetings||[])
        .filter(m=>!m.cancelled&&m.start_date&&m.end_date&&String(m.end_date).slice(0,10)>=first)
        .forEach(m=>entries.push({date:listDate(m.start_date),order:5,html:meetingCard(m)}));
    }

    host.innerHTML=entries.length
      ?groupedCalendarListV121(entries,'')
      :'<p class="muted">Ingen aktive eller åbne aktiviteter fra den valgte dato og frem.</p>';
    updateSelectedListLabelV296();
  };
}

/* Re-render after the normal calendar pipeline has finished. */
const baseShowCalendarV296=window.showCalendar;
if(typeof baseShowCalendarV296==='function'){
  window.showCalendar=async function(){
    const result=await baseShowCalendarV296.apply(this,arguments);
    if(calendarViewMode==='list'&&typeof renderMainCalendarListV121==='function')renderMainCalendarListV121();
    return result;
  };
}

queueMicrotask(()=>{
  if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='list'&&typeof renderMainCalendarListV121==='function')renderMainCalendarListV121();
});
})();
