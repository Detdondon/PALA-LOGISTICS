/* PALA calendar stability extension v1
   Keeps calendar view/filter state stable and restores entries hidden by legacy overrides. */
(()=>{
  'use strict';
  if(typeof showCalendar!=='function'||typeof calendarEvents!=='function')return;

  const TYPE_VALUES=['all','orders','staffing','workshop'];
  const STATUS_VALUES=['all','open','completed','understaffed'];
  const locale='da-DK';

  const normalizeType=value=>TYPE_VALUES.includes(value)?value:'all';
  const normalizeStatus=value=>STATUS_VALUES.includes(value)?value:'all';
  const text=value=>String(value??'').trim();
  const compareText=(a,b)=>text(a).localeCompare(text(b),locale,{numeric:true,sensitivity:'base'});

  function persistCalendarState(){
    localStorage.setItem('pala_calendar_type_filter',mainCalendarTypeFilterV120);
    localStorage.setItem('pala_calendar_status_filter',mainCalendarStatusFilterV123);
    localStorage.setItem('pala_calendar_view',calendarViewMode);
  }

  function isLeave(sh){return typeof isStaffLeave==='function'&&isStaffLeave(sh)}
  function bookingDone(row){return typeof jobLocationStatus==='function'&&jobLocationStatus(row)==='Afsluttet'}
  function shiftDone(row){return !!(typeof staffLinkedJobCompleted==='function'&&staffLinkedJobCompleted(row))}
  function workshopJobDone(row){return row?.status==='Afsluttet'}
  function workshopTaskDone(row){return row?.status==='completed'}
  function shiftUnderstaffed(row){
    if(!row||isLeave(row)||shiftDone(row))return false;
    if(typeof shiftUnderstaffedV139==='function')return !!shiftUnderstaffedV139(row);
    const needed=Math.max(0,+row.workers_needed||0);
    const assigned=typeof staffAssignmentsFor==='function'?(staffAssignmentsFor(row.id)||[]).length:0;
    return needed>0&&assigned<needed;
  }

  function statusMatches(done,status=mainCalendarStatusFilterV123){
    status=normalizeStatus(status);
    if(status==='all')return true;
    if(status==='completed')return !!done;
    if(status==='open')return !done;
    return false;
  }
  function bookingMatches(row){
    if(!row||row.status==='Annulleret'||mainCalendarStatusFilterV123==='understaffed')return false;
    return statusMatches(bookingDone(row));
  }
  function shiftMatches(row){
    if(!row)return false;
    if(mainCalendarStatusFilterV123==='understaffed')return shiftUnderstaffed(row);
    if(isLeave(row))return mainCalendarStatusFilterV123!=='completed';
    return statusMatches(shiftDone(row));
  }
  function workshopJobMatches(row){
    if(!row||row.status==='Annulleret'||mainCalendarStatusFilterV123==='understaffed')return false;
    return statusMatches(workshopJobDone(row));
  }
  function workshopTaskMatches(row){
    if(!row||mainCalendarStatusFilterV123==='understaffed')return false;
    return statusMatches(workshopTaskDone(row));
  }

  // Make every status helper use one consistent interpretation.
  bookingStatusMatchV123=bookingMatches;
  shiftStatusMatchV123=shiftMatches;
  workshopJobStatusMatchV123=workshopJobMatches;
  workshopTaskStatusMatchV123=workshopTaskMatches;
  unifiedStatusMatchV123=function(event){
    const status=normalizeStatus(mainCalendarStatusFilterV123);
    if(status==='all')return true;
    const kind=event?.kind,item=event?.item;
    if(status==='understaffed'){
      if(kind!=='staffing')return false;
      const rows=event?.items?[...event.items.values()]:[item];
      return rows.some(shiftUnderstaffed);
    }
    if(!kind||kind==='order')return bookingMatches(item);
    if(kind==='staffLeave')return status==='open';
    if(kind==='staffing'){
      const rows=event?.items?[...event.items.values()]:[item];
      return rows.some(shiftMatches);
    }
    if(kind==='workshop')return workshopJobMatches(item);
    if(kind==='workshopTask')return workshopTaskMatches(item);
    // Meetings and other non-status items are only visible with Status = Alle.
    return false;
  };

  // Filters are state, not side effects of changing view.
  setUnifiedCalendarTypeV123=function(value){
    mainCalendarTypeFilterV120=normalizeType(value);
    if(mainCalendarStatusFilterV123==='understaffed'&&mainCalendarTypeFilterV120!=='staffing')mainCalendarStatusFilterV123='all';
    persistCalendarState();
    return showCalendar();
  };
  setUnifiedCalendarStatusV123=function(value){
    mainCalendarStatusFilterV123=normalizeStatus(value);
    if(mainCalendarStatusFilterV123==='understaffed')mainCalendarTypeFilterV120='staffing';
    persistCalendarState();
    return showCalendar();
  };
  setCalendarView=function(mode){
    calendarViewMode=mode==='list'?'list':'calendar';
    persistCalendarState();
    return showCalendar();
  };

  function entryTime(value){return /^\d\d:\d\d/.test(text(value))?text(value).slice(0,5):''}

  // Stable date/time/name order. Extra fields are optional, so legacy callers still work.
  groupedCalendarListV121=function(entries,emptyText){
    entries=[...(entries||[])].sort((a,b)=>{
      const dateCmp=text(a.date).localeCompare(text(b.date));if(dateCmp)return dateCmp;
      const timeCmp=entryTime(a.time).localeCompare(entryTime(b.time));if(timeCmp)return timeCmp;
      const orderCmp=(+a.order||0)-(+b.order||0);if(orderCmp)return orderCmp;
      const nameCmp=compareText(a.sortText,b.sortText);if(nameCmp)return nameCmp;
      return compareText(a.key,b.key);
    });
    const dates=[...new Set(entries.map(row=>row.date))];
    return dates.map(ds=>`<section class="view-list-group" data-date="${ds}"><h3 class="view-list-date">${listDateHeading(ds)}</h3>${entries.filter(row=>row.date===ds).map(row=>row.html).join('')}</section>`).join('')||`<p class="muted">${esc(emptyText||'Ingen aktiviteter matcher filtrene.')}</p>`;
  };

  function bookingName(row){return row?.customer_name||row?.title||row?.name||`Ordre ${row?.id||''}`}
  function shiftName(row){
    if(isLeave(row))return row?.employee_name||row?.title||'Fravær';
    const linked=typeof staffCalendarBooking==='function'?staffCalendarBooking(row):null;
    const workshop=typeof staffWorkshopJob==='function'?staffWorkshopJob(row):null;
    return linked?.customer_name||linked?.title||workshop?.title||row?.title||`Vagt ${row?.id||''}`;
  }
  function taskName(row){return row?.tent_name||tents?.[row?.tent_id]?.name||row?.description||`Skade ${row?.id||''}`}

  renderMainCalendarListV121=function(){
    if(calendarViewMode!=='list')return;
    const host=app.querySelector('.view-list');if(!host)return;
    const w=calendarWindowV121(calDate,14),entries=[],openTasks=[];
    const type=normalizeType(mainCalendarTypeFilterV120);

    if(type==='all'||type==='orders'){
      bookings.filter(row=>bookingMatches(row)&&row.start_date&&row.end_date&&row.start_date<=w.last&&row.end_date>=w.first).forEach(row=>{
        entries.push({date:row.start_date<w.first?w.first:String(row.start_date).slice(0,10),time:row.start_time||'',order:1,sortText:bookingName(row),key:`order-${row.id}`,html:orderCard(row)});
      });
    }
    if(type==='all'||type==='staffing'){
      staffingShifts.filter(shiftMatches).forEach(row=>{
        const leave=typeof staffLeaveInfo==='function'?staffLeaveInfo(row):null;
        if(leave){
          if(leave.start<=w.last&&leave.end>=w.first)entries.push({date:leave.start<w.first?w.first:leave.start,time:'',order:2,sortText:shiftName(row),key:`staff-${row.id}`,html:staffShiftCard(row)});
        }else if(row.shift_date>=w.first&&row.shift_date<=w.last){
          entries.push({date:row.shift_date,time:row.start_time||'',order:2,sortText:shiftName(row),key:`staff-${row.id}`,html:staffShiftCard(row)});
        }
      });
    }
    if(type==='all'||type==='workshop'){
      workshopJobs.filter(row=>workshopJobMatches(row)&&row.start_date<=w.last&&row.end_date>=w.first).forEach(row=>{
        entries.push({date:row.start_date<w.first?w.first:row.start_date,time:row.start_time||'',order:3,sortText:row.title||'',key:`workshop-${row.id}`,html:workshopJobCard(row)});
      });
      workshopTasks.filter(row=>row.status==='open'&&workshopTaskMatches(row)).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||compareText(taskName(a),taskName(b))).forEach(row=>openTasks.push(row));
      workshopTasks.filter(row=>row.status!=='open'&&workshopTaskMatches(row)).forEach(row=>{
        const range=workshopTaskRangeV120(row);
        if(range&&range.start<=w.last&&range.end>=w.first)entries.push({date:range.start<w.first?w.first:range.start,time:'',order:4,sortText:taskName(row),key:`workshop-task-${row.id}`,html:workshopTaskCard(row)});
      });
    }
    if(type==='all'&&mainCalendarStatusFilterV123==='all'){
      (palaMeetings||[]).filter(row=>!row.cancelled&&row.start_date<=w.last&&row.end_date>=w.first).forEach(row=>{
        entries.push({date:row.start_date<w.first?w.first:row.start_date,time:row.start_time||'',order:5,sortText:row.title||'',key:`meeting-${row.id}`,html:meetingCard(row)});
      });
    }

    const taskHtml=openTasks.length?`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`:'';
    const datedHtml=entries.length?groupedCalendarListV121(entries,''):'';
    host.innerHTML=taskHtml+datedHtml||'<p class="muted">Ingen aktiviteter matcher de valgte filtre.</p>';
  };

  mainCalendarDayHtmlV120=function(ds){
    const type=normalizeType(mainCalendarTypeFilterV120),entries=[];
    const add=(row,kind,time,sortTextValue,html)=>entries.push({kind,time:time||'',sortText:sortTextValue||'',id:+row?.id||0,html});

    if(type==='all'||type==='orders'){
      (bookingsForCalendarDate(ds)||[]).filter(bookingMatches).forEach(row=>add(row,'order',row.start_time,bookingName(row),orderCard(row)));
    }
    if(type==='all'||type==='staffing'){
      staffingShifts.filter(row=>(isLeave(row)?staffLeaveContains(row,ds):row.shift_date===ds)&&shiftMatches(row)).forEach(row=>add(row,'staffing',row.start_time,shiftName(row),staffShiftCard(row)));
    }
    if(type==='all'||type==='workshop'){
      workshopJobs.filter(row=>workshopJobMatches(row)&&row.start_date<=ds&&row.end_date>=ds).forEach(row=>add(row,'workshop',row.start_time,row.title,workshopJobCard(row)));
      workshopTasks.filter(row=>workshopTaskMatches(row)).forEach(row=>{
        const range=workshopTaskRangeV120(row);if(range&&range.start<=ds&&range.end>=ds)add(row,'workshopTask','',taskName(row),workshopTaskCard(row));
      });
    }
    if(type==='all'&&mainCalendarStatusFilterV123==='all'){
      (palaMeetings||[]).filter(row=>!row.cancelled&&row.start_date<=ds&&row.end_date>=ds).forEach(row=>add(row,'meeting',row.start_time,row.title,meetingCard(row)));
    }

    const priority={order:1,staffing:2,workshop:3,workshopTask:4,meeting:5};
    entries.sort((a,b)=>entryTime(a.time).localeCompare(entryTime(b.time))||(priority[a.kind]||9)-(priority[b.kind]||9)||compareText(a.sortText,b.sortText)||a.id-b.id);
    return entries.map(row=>row.html).join('')||'<p class="calendar-empty">Ingen aktiviteter matcher filteret denne dag.</p>';
  };

  function eventKindPriority(event){return ({order:1,staffing:2,staffLeave:2,workshop:3,workshopTask:4,meeting:5})[event?.kind||'order']||9}
  function eventName(event){return event?.name||event?.item?.customer_name||event?.item?.title||event?.item?.tent_name||event?.item?.description||''}
  function eventKey(event){return event?.key||`${event?.kind||'order'}-${event?.item?.id||event?.id||eventName(event)}-${event?.start||''}-${event?.end||''}`}
  function eventTypeMatches(event){
    const type=normalizeType(mainCalendarTypeFilterV120),kind=event?.kind;
    if(type==='all')return true;
    if(type==='orders')return !kind||kind==='order';
    if(type==='staffing')return kind==='staffing'||kind==='staffLeave';
    return kind==='workshop'||kind==='workshopTask';
  }
  function sortAndDedupeEvents(rows){
    const seen=new Set(),result=[];
    (rows||[]).forEach(row=>{const key=eventKey(row);if(seen.has(key))return;seen.add(key);result.push(row)});
    return result.sort((a,b)=>text(a.start).localeCompare(text(b.start))||text(b.end||b.start).localeCompare(text(a.end||a.start))||eventKindPriority(a)-eventKindPriority(b)||compareText(eventName(a),eventName(b))||compareText(eventKey(a),eventKey(b)));
  }
  function restoreOpenWorkshopTasks(rows,start,days,mode){
    if(mode!=='calendar'&&mode!=='workshop')return rows;
    if(mode==='calendar'){
      if(!['all','workshop'].includes(normalizeType(mainCalendarTypeFilterV120)))return rows;
      if(!['all','open'].includes(normalizeStatus(mainCalendarStatusFilterV123)))return rows;
    }else if(typeof workshopFilter!=='undefined'&&!['all','open'].includes(workshopFilter))return rows;

    const first=staffDateString(start),lastDate=new Date(start);lastDate.setDate(lastDate.getDate()+(+days||1)-1);const last=staffDateString(lastDate);
    const extra=workshopTasks.filter(row=>row.status==='open').map(row=>{
      const range=workshopTaskRangeV120(row);if(!range||range.start>last||range.end<first)return null;
      return {key:`workshop-task-${row.id}`,kind:'workshopTask',start:range.start,end:range.end,item:row,name:taskName(row)};
    }).filter(Boolean);
    return rows.concat(extra);
  }

  const calendarEventsStableBase=calendarEvents;
  calendarEvents=function(start,days,mode){
    let rows=calendarEventsStableBase.apply(this,arguments)||[];
    rows=restoreOpenWorkshopTasks(rows,start,days,mode);
    if(mode==='calendar')rows=rows.filter(eventTypeMatches).filter(unifiedStatusMatchV123);
    return sortAndDedupeEvents(rows);
  };

  function stableStatusRows(){
    const rows=[['all','Alle'],['open','Åbne'],['completed','Afsluttede']];
    if(mainCalendarTypeFilterV120==='staffing')rows.push(['understaffed','Ubemandede vagter']);
    return rows;
  }
  function stabilizeCalendarControls(){
    const control=app.querySelector('.calendar-control-card');if(!control)return;
    const labels=[...control.querySelectorAll('.unified-filter-grid-v123 label')];
    const statusLabel=labels.find(label=>label.querySelector('span')?.textContent.trim()==='Status');
    const statusSelect=statusLabel?.querySelector('select');
    if(!statusSelect)return;
    if(mainCalendarStatusFilterV123==='understaffed'&&mainCalendarTypeFilterV120!=='staffing'){
      mainCalendarStatusFilterV123='all';
      persistCalendarState();
    }
    const rows=stableStatusRows();
    statusSelect.innerHTML=rows.map(([value,label])=>`<option value="${value}" ${mainCalendarStatusFilterV123===value?'selected':''}>${label}</option>`).join('');
    statusSelect.value=mainCalendarStatusFilterV123;
  }

  // Bypass the v139 top-bar wrapper that silently forced list view to "Åbne".
  const calendarTopStableBase=typeof applyUnifiedCalendarTopV139Base==='function'?applyUnifiedCalendarTopV139Base:applyUnifiedCalendarTopV123;
  applyUnifiedCalendarTopV123=function(){
    const result=calendarTopStableBase.apply(this,arguments);
    stabilizeCalendarControls();
    renderMainCalendarListV121();
    return result;
  };

  // Normalize any stale saved combination once without changing a valid user choice.
  mainCalendarTypeFilterV120=normalizeType(mainCalendarTypeFilterV120);
  mainCalendarStatusFilterV123=normalizeStatus(mainCalendarStatusFilterV123);
  calendarViewMode=calendarViewMode==='list'?'list':'calendar';
  if(mainCalendarStatusFilterV123==='understaffed'&&mainCalendarTypeFilterV120!=='staffing')mainCalendarStatusFilterV123='all';
  persistCalendarState();
  setTimeout(()=>{stabilizeCalendarControls();renderMainCalendarListV121()},0);
})();
