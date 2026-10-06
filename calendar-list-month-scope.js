/* PALA v363 · calendar list view is strictly scoped to the selected month. */
(()=>{
'use strict';
if(window.__palaCalendarListMonthScopeV363)return;
window.__palaCalendarListMonthScopeV363=true;

const dateOnly=value=>String(value??'').slice(0,10);
const maxDate=(a,b)=>a>b?a:b;
const timeOnly=value=>/^\d\d:\d\d/.test(String(value||''))?String(value).slice(0,5):'';
const selectedTypes=()=>typeof getCalendarSelectedTypesV306==='function'?getCalendarSelectedTypesV306():['orders','staffing','workshop','calendarItems'];
const selected=type=>selectedTypes().includes(type);
const statusFilter=()=>typeof mainCalendarStatusFilterV123!=='undefined'?mainCalendarStatusFilterV123:'all';

function isoDate(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function selectedMonthWindowV363(){
  const current=typeof calDate!=='undefined'&&calDate instanceof Date&&!Number.isNaN(calDate.getTime())?calDate:new Date();
  const firstDate=new Date(current.getFullYear(),current.getMonth(),1);
  const lastDate=new Date(current.getFullYear(),current.getMonth()+1,0);
  return{
    first:isoDate(firstDate),
    last:isoDate(lastDate),
    label:(()=>{
      const raw=new Intl.DateTimeFormat('da-DK',{month:'long',year:'numeric'}).format(firstDate);
      return raw?raw.charAt(0).toLocaleUpperCase('da-DK')+raw.slice(1):'';
    })()
  };
}

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
  if(kind==='task')return row?.title||'Anden opgave';
  return row?.title||'Møde';
}
function htmlFor(kind,row){
  if(kind==='order')return orderCard(row);
  if(kind==='staffing')return typeof calendarLeaveCardV315==='function'?calendarLeaveCardV315(row):staffShiftCard(row);
  if(kind==='workshop')return workshopJobCard(row);
  if(kind==='workshopTask')return typeof calendarWorkshopTaskCardV310==='function'?calendarWorkshopTaskCardV310(row):workshopTaskCard(row);
  return meetingCard(row);
}

function selectedMonthEntriesV363(){
  const {first,last}=selectedMonthWindowV363();
  const entries=[];
  const add=(kind,row,start,end,time,order)=>{
    start=dateOnly(start);
    end=dateOnly(end||start);
    if(!start||!end)return;
    // Only include activities that overlap the selected calendar month.
    if(start>last||end<first)return;
    entries.push({
      kind,
      date:maxDate(start,first),
      time:timeOnly(time),
      order,
      sortText:labelFor(kind,row),
      key:`${kind}-${row?.id||''}`,
      html:htmlFor(kind,row)
    });
  };

  if(selected('orders')){
    (bookings||[]).filter(bookingMatches).forEach(row=>add('order',row,row.start_date,row.end_date,row.start_time,1));
  }

  if(selected('staffing')){
    (staffingShifts||[]).filter(shiftMatches).forEach(row=>{
      const leave=typeof staffLeaveInfo==='function'?staffLeaveInfo(row):null;
      if(leave)add('staffing',row,leave.start,leave.end,'',2);
      else add('staffing',row,row.shift_date,row.shift_date,row.start_time,2);
    });
  }

  if(selected('workshop')){
    (workshopJobs||[]).filter(workshopJobMatches).forEach(row=>add('workshop',row,row.start_date,row.end_date,row.start_time,3));
    if(typeof workshopTaskRangeV120==='function'){
      (workshopTasks||[]).filter(workshopTaskMatches).forEach(row=>{
        const range=workshopTaskRangeV120(row);
        if(range)add('workshopTask',row,range.start,range.end,'',4);
      });
    }
  }

  if(selected('calendarItems')&&meetingMatches()){
    (palaMeetings||[]).filter(row=>row&&!row.cancelled).forEach(row=>{
      add(row.kind==='task'?'task':'meeting',row,row.start_date,row.end_date,row.start_time,5);
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

function groupedSingleColumnV363(entries,emptyText){
  if(!entries.length)return `<p class="muted calendar-column-empty-v304">${emptyText}</p>`;
  if(typeof groupedCalendarListV121==='function')return groupedCalendarListV121([...entries],'');
  const dates=[...new Set(entries.map(row=>row.date))];
  return dates.map(ds=>`<section class="view-list-group" data-date="${ds}"><h3 class="view-list-date">${listDateHeading(ds)}</h3>${entries.filter(row=>row.date===ds).map(row=>row.html).join('')}</section>`).join('');
}

function groupedMonthHtmlV363(entries){
  const active=selectedTypes();
  const month=selectedMonthWindowV363().label;
  const definitions=[
    {key:'orders',type:'orders',title:'Ordre',entries:entries.filter(row=>row.kind==='order'),empty:`Ingen ordrer i ${month}.`},
    {key:'staffing',type:'staffing',title:'Vagter',entries:entries.filter(row=>row.kind==='staffing'),empty:`Ingen vagter i ${month}.`},
    {key:'workshop',type:'workshop',title:'Systue',entries:entries.filter(row=>row.kind==='workshop'||row.kind==='workshopTask'),empty:`Ingen systuejobs eller skader i ${month}.`},
    {key:'calendar-items',type:'calendarItems',title:'Møder / opgaver',entries:entries.filter(row=>row.kind==='meeting'||row.kind==='task'),empty:`Ingen møder eller andre opgaver i ${month}.`}
  ];
  const columns=definitions.filter(column=>active.includes(column.type));
  if(!columns.length)return '<p class="muted">Vælg mindst én kategori.</p>';

  return `<div class="calendar-all-columns-v304" data-column-count="${columns.length}" style="--calendar-column-count:${columns.length}">${columns.map(column=>`
    <section class="calendar-all-column-v304 calendar-all-column-${column.key}-v304">
      <div class="calendar-all-column-head-v304">
        <h3>${column.title}</h3>
        <span>${column.entries.length}</span>
      </div>
      <div class="calendar-all-column-body-v304">
        ${groupedSingleColumnV363(column.entries,column.empty)}
      </div>
    </section>
  `).join('')}</div>`;
}

function renderSelectedMonthV363(){
  const entries=selectedMonthEntriesV363();
  const {label}=selectedMonthWindowV363();

  if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='calendar'){
    const host=document.querySelector('.calendar-detail-list');
    if(host)host.innerHTML=groupedMonthHtmlV363(entries);
    const card=document.querySelector('.calendar-day-detail-card');
    const eyebrow=card?.querySelector(':scope > div > .small.muted');
    const title=card?.querySelector(':scope > div > .calendar-day-title');
    if(eyebrow)eyebrow.textContent='LISTEVISNING · VALGT MÅNED';
    if(title)title.textContent=label;
  }

  if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='list'){
    const host=document.querySelector('.view-list');
    if(host)host.innerHTML=groupedMonthHtmlV363(entries);
    const title=document.querySelector('.calendar-toolbar-title .small.muted');
    if(title)title.textContent=label;
  }
}

const baseShowCalendarV363=window.showCalendar;
if(typeof baseShowCalendarV363==='function'){
  window.showCalendar=async function(){
    const result=await baseShowCalendarV363.apply(this,arguments);
    renderSelectedMonthV363();
    requestAnimationFrame(renderSelectedMonthV363);
    return result;
  };
}

queueMicrotask(renderSelectedMonthV363);
})();
