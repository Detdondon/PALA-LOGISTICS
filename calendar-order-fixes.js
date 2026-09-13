/* PALA calendar/order fixes v1
   - Preserve Forespørgsel as a real order status.
   - Make calendar list view represent the entire selected month.
   - Keep month navigation and list counts consistent with that month. */
(()=>{
  'use strict';

  const text=value=>String(value??'').trim();
  const dateOnly=value=>text(value).slice(0,10);
  const maxDate=(a,b)=>a>b?a:b;

  function selectedMonthWindow(){
    const anchor=(typeof calDate!=='undefined'&&calDate instanceof Date&&!Number.isNaN(calDate.getTime()))?calDate:new Date();
    const first=new Date(anchor.getFullYear(),anchor.getMonth(),1);
    const last=new Date(anchor.getFullYear(),anchor.getMonth()+1,0);
    return {first:staffDateString(first),last:staffDateString(last)};
  }

  function normalizedOrderStatus(row){
    const raw=text(row?.status);
    if(raw==='Afsluttet')return 'Afsluttet';
    if(raw==='Ude'||raw==='Udleveret')return 'Ude';
    if(raw==='Forespørgsel')return 'Forespørgsel';
    if(raw==='På lager')return 'På lager';
    return raw||'På lager';
  }

  // The legacy helper collapsed Forespørgsel into På lager. That made a saved
  // inquiry look as if its status change had failed and also broke status-aware UI.
  if(typeof jobLocationStatus==='function'){
    jobLocationStatus=function(row){return normalizedOrderStatus(row)};
  }

  function bookingMatches(row){
    if(typeof bookingStatusMatchV123==='function')return !!bookingStatusMatchV123(row);
    return !!row&&row.status!=='Annulleret'&&(mainCalendarStatusFilterV123==='all'||(mainCalendarStatusFilterV123==='completed'?normalizedOrderStatus(row)==='Afsluttet':normalizedOrderStatus(row)!=='Afsluttet'));
  }
  function shiftMatches(row){return typeof shiftStatusMatchV123==='function'?!!shiftStatusMatchV123(row):true}
  function workshopJobMatches(row){return typeof workshopJobStatusMatchV123==='function'?!!workshopJobStatusMatchV123(row):true}
  function workshopTaskMatches(row){return typeof workshopTaskStatusMatchV123==='function'?!!workshopTaskStatusMatchV123(row):true}
  function taskName(row){return row?.tent_name||tents?.[row?.tent_id]?.name||row?.description||`Skade ${row?.id||''}`}
  function bookingName(row){return row?.customer_name||row?.title||row?.name||row?.order_no||`Ordre ${row?.id||''}`}
  function shiftName(row){
    if(typeof isStaffLeave==='function'&&isStaffLeave(row))return row?.employee_name||row?.title||'Fravær';
    const linked=typeof staffCalendarBooking==='function'?staffCalendarBooking(row):null;
    const workshop=typeof staffWorkshopJob==='function'?staffWorkshopJob(row):null;
    return linked?.customer_name||linked?.title||workshop?.title||row?.title||`Vagt ${row?.id||''}`;
  }

  if(typeof renderMainCalendarListV121==='function'){
    renderMainCalendarListV121=function(){
      if(calendarViewMode!=='list')return;
      const host=app.querySelector('.view-list');if(!host)return;
      const w=selectedMonthWindow(),entries=[],openTasks=[];
      const type=['all','orders','staffing','workshop'].includes(mainCalendarTypeFilterV120)?mainCalendarTypeFilterV120:'all';

      if(type==='all'||type==='orders'){
        bookings.filter(row=>{
          const start=dateOnly(row?.start_date),end=dateOnly(row?.end_date);
          return bookingMatches(row)&&start&&end&&start<=w.last&&end>=w.first;
        }).forEach(row=>{
          const start=dateOnly(row.start_date);
          entries.push({date:maxDate(start,w.first),time:row.start_time||'',order:1,sortText:bookingName(row),key:`order-${row.id}`,html:orderCard(row)});
        });
      }

      if(type==='all'||type==='staffing'){
        staffingShifts.filter(shiftMatches).forEach(row=>{
          const leave=typeof staffLeaveInfo==='function'?staffLeaveInfo(row):null;
          if(leave){
            if(leave.start<=w.last&&leave.end>=w.first)entries.push({date:maxDate(leave.start,w.first),time:'',order:2,sortText:shiftName(row),key:`staff-${row.id}`,html:staffShiftCard(row)});
          }else{
            const day=dateOnly(row.shift_date);
            if(day>=w.first&&day<=w.last)entries.push({date:day,time:row.start_time||'',order:2,sortText:shiftName(row),key:`staff-${row.id}`,html:staffShiftCard(row)});
          }
        });
      }

      if(type==='all'||type==='workshop'){
        workshopJobs.filter(row=>{
          const start=dateOnly(row?.start_date),end=dateOnly(row?.end_date);
          return workshopJobMatches(row)&&start&&end&&start<=w.last&&end>=w.first;
        }).forEach(row=>{
          const start=dateOnly(row.start_date);
          entries.push({date:maxDate(start,w.first),time:row.start_time||'',order:3,sortText:row.title||'',key:`workshop-${row.id}`,html:workshopJobCard(row)});
        });

        workshopTasks.filter(row=>row.status==='open'&&workshopTaskMatches(row))
          .sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||String(taskName(a)).localeCompare(String(taskName(b)),'da-DK',{numeric:true,sensitivity:'base'}))
          .forEach(row=>openTasks.push(row));

        workshopTasks.filter(row=>row.status!=='open'&&workshopTaskMatches(row)).forEach(row=>{
          const range=workshopTaskRangeV120(row);
          if(range&&range.start<=w.last&&range.end>=w.first)entries.push({date:maxDate(range.start,w.first),time:'',order:4,sortText:taskName(row),key:`workshop-task-${row.id}`,html:workshopTaskCard(row)});
        });
      }

      if(type==='all'&&mainCalendarStatusFilterV123==='all'){
        (palaMeetings||[]).filter(row=>{
          const start=dateOnly(row?.start_date),end=dateOnly(row?.end_date);
          return !row.cancelled&&start&&end&&start<=w.last&&end>=w.first;
        }).forEach(row=>{
          const start=dateOnly(row.start_date);
          entries.push({date:maxDate(start,w.first),time:row.start_time||'',order:5,sortText:row.title||'',key:`meeting-${row.id}`,html:meetingCard(row)});
        });
      }

      const taskHtml=openTasks.length?`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`:'';
      const datedHtml=entries.length?groupedCalendarListV121(entries,''):'';
      host.innerHTML=taskHtml+datedHtml||'<p class="muted">Ingen aktiviteter matcher de valgte filtre i den valgte måned.</p>';
      syncMonthListUi();
    };
  }

  function syncMonthListUi(){
    if(calendarViewMode!=='list')return;
    const w=selectedMonthWindow();
    const navButtons=[...app.querySelectorAll('.calendar-nav-step')];
    navButtons.forEach((button,index)=>{
      const label=button.querySelector('.calendar-nav-label');if(label)label.textContent='1 måned';
      button.setAttribute('aria-label',index===0?'Vis forrige måned':'Vis næste måned');
    });

    const metaButtons=[...app.querySelectorAll('.calendar-meta .reference-button')];
    const orderCount=bookings.filter(row=>{
      const start=dateOnly(row?.start_date),end=dateOnly(row?.end_date);
      return bookingMatches(row)&&start&&end&&start<=w.last&&end>=w.first;
    }).length;
    const workshopCount=workshopJobs.filter(row=>{
      const start=dateOnly(row?.start_date),end=dateOnly(row?.end_date);
      return workshopJobMatches(row)&&start&&end&&start<=w.last&&end>=w.first;
    }).length;
    if(metaButtons[0])metaButtons[0].innerHTML=`${uiIcon('calendar')}${orderCount} ${orderCount===1?'job':'jobs'} i måneden`;
    if(metaButtons[1])metaButtons[1].innerHTML=`${uiIcon('scissors')}${workshopCount} ${workshopCount===1?'systuejob':'systuejobs'} i måneden`;
  }

  if(typeof mv==='function'){
    const mvBase=mv;
    mv=function(n){
      if(calendarViewMode!=='list')return mvBase.apply(this,arguments);
      const step=Number(n)||0;
      calDate=new Date(calDate.getFullYear(),calDate.getMonth()+step,1);
      return showCalendar();
    };
  }

  // Re-render an already open list after this extension loads.
  setTimeout(()=>{
    if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='list'&&typeof renderMainCalendarListV121==='function')renderMainCalendarListV121();
  },0);
})();
