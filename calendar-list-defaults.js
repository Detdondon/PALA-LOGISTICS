/* PALA v299 · selected-date calendar lists with stable interactive cards. */
(()=>{
'use strict';
if(window.__palaCalendarListDefaultsV299)return;
window.__palaCalendarListDefaultsV299=true;

const dateOnly=value=>String(value??'').slice(0,10);
const selectedFirst=()=>typeof calDate!=='undefined'&&typeof staffDateString==='function'?staffDateString(calDate):'';
const typeFilter=()=>typeof mainCalendarTypeFilterV120!=='undefined'?mainCalendarTypeFilterV120:'all';
const statusFilter=()=>typeof mainCalendarStatusFilterV123!=='undefined'?mainCalendarStatusFilterV123:'all';
const maxDate=(a,b)=>a>b?a:b;
const timeOnly=value=>/^\d\d:\d\d/.test(String(value||''))?String(value).slice(0,5):'';

function bookingMatches(row){
  if(!row||row.status==='Annulleret')return false;
  return typeof bookingStatusMatchV123==='function'?bookingStatusMatchV123(row):true;
}
function shiftMatches(row){
  if(!row)return false;
  return typeof shiftStatusMatchV123==='function'?shiftStatusMatchV123(row):true;
}
function workshopJobMatches(row){
  if(!row||row.status==='Annulleret')return false;
  return typeof workshopJobStatusMatchV123==='function'?workshopJobStatusMatchV123(row):true;
}
function workshopTaskMatches(row){
  if(!row)return false;
  return typeof workshopTaskStatusMatchV123==='function'?workshopTaskStatusMatchV123(row):true;
}
function meetingMatches(){
  const status=statusFilter();
  return status==='all'||status==='active'||status==='open';
}
function labelFor(kind,row){
  if(kind==='order')return row?.customer_name||row?.title||row?.order_no||'Ordre';
  if(kind==='staffing')return row?.title||'Vagt';
  if(kind==='workshop')return row?.title||'Systuejob';
  if(kind==='workshopTask')return row?.tent_name||row?.description||'Skade';
  return row?.title||'Møde';
}
function htmlFor(kind,row){
  if(kind==='order')return orderCard(row);
  if(kind==='staffing')return staffShiftCard(row);
  if(kind==='workshop')return workshopJobCard(row);
  if(kind==='workshopTask')return workshopTaskCard(row);
  return meetingCard(row);
}

function selectedForwardEntriesV298(){
  const first=selectedFirst();
  if(!first)return [];
  const type=typeFilter(),entries=[];
  const add=(kind,row,start,end,time,order)=>{
    start=dateOnly(start);end=dateOnly(end||start);
    if(!start||!end||end<first)return;
    entries.push({
      date:maxDate(start,first),
      time:timeOnly(time),
      order,
      sortText:labelFor(kind,row),
      key:`${kind}-${row?.id||''}`,
      html:htmlFor(kind,row)
    });
  };

  if(type==='all'||type==='orders'){
    (bookings||[]).filter(bookingMatches).forEach(row=>{
      add('order',row,row.start_date,row.end_date,row.start_time,1);
    });
  }

  if(type==='all'||type==='staffing'){
    (staffingShifts||[]).filter(shiftMatches).forEach(row=>{
      const leave=typeof staffLeaveInfo==='function'?staffLeaveInfo(row):null;
      if(leave)add('staffing',row,leave.start,leave.end,'',2);
      else add('staffing',row,row.shift_date,row.shift_date,row.start_time,2);
    });
  }

  if(type==='all'||type==='workshop'){
    (workshopJobs||[]).filter(workshopJobMatches).forEach(row=>{
      add('workshop',row,row.start_date,row.end_date,row.start_time,3);
    });
    if(type==='workshop'&&typeof workshopTaskRangeV120==='function'){
      (workshopTasks||[]).filter(workshopTaskMatches).forEach(row=>{
        const range=workshopTaskRangeV120(row);
        if(range)add('workshopTask',row,range.start,range.end,'',4);
      });
    }
  }

  if(type==='all'&&meetingMatches()){
    (palaMeetings||[]).filter(row=>row&&!row.cancelled).forEach(row=>{
      add('meeting',row,row.start_date,row.end_date,row.start_time,5);
    });
  }

  return entries.sort((a,b)=>
    a.date.localeCompare(b.date)||
    a.time.localeCompare(b.time)||
    (a.order||0)-(b.order||0)||
    String(a.sortText||'').localeCompare(String(b.sortText||''),'da-DK',{numeric:true,sensitivity:'base'})||
    String(a.key||'').localeCompare(String(b.key||''))
  );
}

function groupedHtmlV298(entries){
  if(!entries.length)return '<p class="muted">Ingen aktiviteter matcher filtrene fra den valgte dato og frem.</p>';
  if(typeof groupedCalendarListV121==='function')return groupedCalendarListV121([...entries],'');
  const dates=[...new Set(entries.map(row=>row.date))];
  return dates.map(ds=>`<section class="view-list-group" data-date="${ds}"><h3 class="view-list-date">${listDateHeading(ds)}</h3>${entries.filter(row=>row.date===ds).map(row=>row.html).join('')}</section>`).join('');
}

function updateDetailHeadingV298(){
  const first=selectedFirst();if(!first)return;
  const card=document.querySelector('.calendar-day-detail-card');
  if(!card)return;
  const eyebrow=card.querySelector(':scope > div > .small.muted');
  const title=card.querySelector(':scope > div > .calendar-day-title');
  if(eyebrow)eyebrow.textContent='LISTEVISNING · FRA VALGT DATO';
  if(title){
    const label=typeof weekdayDateDa==='function'?weekdayDateDa(first):first;
    title.textContent=`${label} og frem`;
  }
}

function renderCalendarDetailV298(){
  if(typeof calendarViewMode==='undefined'||calendarViewMode!=='calendar')return;
  const host=document.querySelector('.calendar-detail-list');
  if(!host)return;
  host.innerHTML=groupedHtmlV298(selectedForwardEntriesV298());
  updateDetailHeadingV298();
}

function renderStandaloneListV298(){
  if(typeof calendarViewMode==='undefined'||calendarViewMode!=='list')return;
  const host=document.querySelector('.view-list');
  if(!host)return;
  host.innerHTML=groupedHtmlV298(selectedForwardEntriesV298());
  const title=document.querySelector('.calendar-toolbar-title .small.muted');
  const first=selectedFirst();
  if(title&&first){
    const label=typeof fmtDateDa==='function'?fmtDateDa(first):first;
    title.textContent=`Fra ${label} og frem`;
  }
}

function renderSelectedForwardV298(){
  renderCalendarDetailV298();
  renderStandaloneListV298();
}

const baseShowCalendarV298=window.showCalendar;
if(typeof baseShowCalendarV298==='function'){
  window.showCalendar=async function(){
    const result=await baseShowCalendarV298.apply(this,arguments);
    renderSelectedForwardV298();
    requestAnimationFrame(renderSelectedForwardV298);
    return result;
  };
}

/* Do not observe and rewrite the list continuously.
   Continuous innerHTML replacement destroys the element between pointer-down
   and click, which makes cards and buttons such as Pak / Retur feel dead. */
queueMicrotask(renderSelectedForwardV298);
})();
