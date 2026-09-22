/* PALA v295 · calendar list defaults and selected-date-forward range */
(()=>{
'use strict';
if(window.__palaCalendarListDefaultsV295)return;
window.__palaCalendarListDefaultsV295=true;

function withListStatus(status,fn){
  let previous;
  try{
    previous=mainCalendarStatusFilterV123;
    mainCalendarStatusFilterV123=status;
    return fn();
  }finally{
    mainCalendarStatusFilterV123=previous;
  }
}

function refreshCalendarListsV194(){
  // "Alle" keeps completed entries visible in the calendar grid itself,
  // but the list surfaces should behave as the day-to-day active overview.
  if(typeof mainCalendarStatusFilterV123==='undefined'||mainCalendarStatusFilterV123!=='all')return;

  if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='calendar'){
    const host=document.querySelector('.calendar-detail-list');
    if(host&&typeof window.calendarMonthDetailHtmlV157==='function'){
      host.innerHTML=withListStatus('active',()=>window.calendarMonthDetailHtmlV157());
    }
    return;
  }

  if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='list'&&typeof window.renderMainCalendarListV121==='function'){
    withListStatus('active',()=>window.renderMainCalendarListV121());
  }
}

const baseShowCalendar=window.showCalendar;
if(typeof baseShowCalendar==='function'){
  window.showCalendar=async function(){
    const result=await baseShowCalendar.apply(this,arguments);
    refreshCalendarListsV194();
    return result;
  };
}

// Apply once in case the calendar is already rendered when this enhancement loads.
queueMicrotask(refreshCalendarListsV194);

/* PALA v295 · main calendar list starts on the selected calendar date, never on the week's Monday. */
function selectedCalendarListWindowV295(days=14){
  const start=new Date(calDate.getFullYear(),calDate.getMonth(),calDate.getDate());
  const end=new Date(start);end.setDate(start.getDate()+Math.max(1,days)-1);
  return {start,end,first:staffDateString(start),last:staffDateString(end)};
}

function updateSelectedListPeriodLabelV295(window){
  if(calendarViewMode!=='list')return;
  const title=document.querySelector('.calendar-toolbar-title .small.muted');
  if(!title)return;
  const fmt=d=>new Intl.DateTimeFormat('da-DK',{day:'numeric',month:'short',year:'numeric'}).format(d);
  title.textContent=`Kalender · ${fmt(window.start)} – ${fmt(window.end)} · 2 uger`;
}

/* Keep the summary counters in sync with the same selected-date-forward window. */
if(typeof unifiedPeriodCountsV123==='function'){
  unifiedPeriodCountsV123=function(){
    if(calendarViewMode!=='list'){
      let days=28,start=new Date(calDate);start.setDate(start.getDate()-((start.getDay()+6)%7));let end=new Date(start);end.setDate(start.getDate()+days-1),first=staffDateString(start),last=staffDateString(end);
      let orders=bookings.filter(b=>b.status!=='Annulleret'&&b.start_date<=last&&b.end_date>=first).length;
      let shifts=staffingShifts.filter(sh=>{let leave=staffLeaveInfo(sh);return leave?leave.start<=last&&leave.end>=first:sh.shift_date>=first&&sh.shift_date<=last}).length;
      let workshop=workshopJobs.filter(j=>j.status!=='Annulleret'&&j.start_date<=last&&j.end_date>=first).length+workshopTasks.filter(t=>{let r=workshopTaskRangeV120(t);return r&&r.start<=last&&r.end>=first}).length;
      let openDamage=workshopTasks.filter(t=>t.status==='open').length;
      let under=staffingShifts.filter(sh=>!isStaffLeave(sh)&&sh.shift_date>=first&&sh.shift_date<=last&&staffAssignmentsFor(sh.id).length<(+sh.workers_needed||1)).length;
      return {orders,shifts,workshop,openDamage,under};
    }
    let w=selectedCalendarListWindowV295(14),first=w.first,last=w.last;
    let orders=bookings.filter(b=>b.status!=='Annulleret'&&b.start_date<=last&&b.end_date>=first).length;
    let shifts=staffingShifts.filter(sh=>{let leave=staffLeaveInfo(sh);return leave?leave.start<=last&&leave.end>=first:sh.shift_date>=first&&sh.shift_date<=last}).length;
    let workshop=workshopJobs.filter(j=>j.status!=='Annulleret'&&j.start_date<=last&&j.end_date>=first).length+workshopTasks.filter(t=>{let r=workshopTaskRangeV120(t);return r&&r.start<=last&&r.end>=first}).length;
    let openDamage=workshopTasks.filter(t=>t.status==='open').length;
    let under=staffingShifts.filter(sh=>!isStaffLeave(sh)&&sh.shift_date>=first&&sh.shift_date<=last&&staffAssignmentsFor(sh.id).length<(+sh.workers_needed||1)).length;
    return {orders,shifts,workshop,openDamage,under};
  };
}

/* This is the final renderer used by the unified calendar list. */
if(typeof renderMainCalendarListV121==='function'){
  renderMainCalendarListV121=function(){
    if(calendarViewMode!=='list')return;
    let host=app.querySelector('.view-list');if(!host)return;
    let w=selectedCalendarListWindowV295(14),entries=[],openTasks=[];
    let understaffedOnly=mainCalendarTypeFilterV120==='staffing'&&mainCalendarStatusFilterV123==='understaffed';

    if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders'){
      bookings.filter(b=>bookingActiveInListV139(b)&&b.start_date&&b.end_date&&b.start_date<=w.last&&b.end_date>=w.first)
        .forEach(b=>entries.push({date:b.start_date<w.first?w.first:String(b.start_date).slice(0,10),order:1,html:orderCard(b)}));
    }

    if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing'){
      staffingShifts.filter(sh=>shiftActiveInListV139(sh)&&(!understaffedOnly||shiftUnderstaffedV139(sh))).forEach(sh=>{
        let leave=staffLeaveInfo(sh);
        if(leave){
          if(!understaffedOnly&&leave.start<=w.last&&leave.end>=w.first)entries.push({date:leave.start<w.first?w.first:leave.start,order:2,html:staffShiftCard(sh)});
        }else if(sh.shift_date>=w.first&&sh.shift_date<=w.last){
          entries.push({date:sh.shift_date,order:2,html:staffShiftCard(sh)});
        }
      });
    }

    if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){
      workshopJobs.filter(j=>workshopActiveInListV139(j)&&j.start_date<=w.last&&j.end_date>=w.first)
        .forEach(j=>entries.push({date:j.start_date<w.first?w.first:j.start_date,order:3,html:workshopJobCard(j)}));

      /* Undated open damage tasks remain available as work items, but dated calendar groups never precede the selected date. */
      openTasks=workshopTasks.filter(t=>t.status==='open').sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
    }

    if(mainCalendarTypeFilterV120==='all'){
      (palaMeetings||[]).filter(m=>!m.cancelled&&m.start_date<=w.last&&m.end_date>=w.first)
        .forEach(m=>entries.push({date:m.start_date<w.first?w.first:m.start_date,order:5,html:meetingCard(m)}));
    }

    let taskHtml=openTasks.length?`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`:'';
    let datedHtml=entries.length?groupedCalendarListV121(entries,''):'';
    host.innerHTML=taskHtml+datedHtml||'<p class="muted">Ingen aktive eller åbne aktiviteter fra den valgte dato og frem.</p>';
    updateSelectedListPeriodLabelV295(w);
  };
}

})();
