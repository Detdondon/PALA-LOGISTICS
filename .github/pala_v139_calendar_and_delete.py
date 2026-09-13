from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v139 · active lists, understaffed filter and unified warehouse delete'
if marker in text:
    raise SystemExit('PALA v139 already present')

# Keep the persisted understaffed filter valid after a reload.
text=text.replace("if(!['all','open','completed'].includes(mainCalendarStatusFilterV123))mainCalendarStatusFilterV123='all';",
                  "if(!['all','open','completed','understaffed'].includes(mainCalendarStatusFilterV123))mainCalendarStatusFilterV123='all';",1)

# Static badge fallback; the runtime wrapper below is authoritative.
text=text.replace('<span class="app-version" hidden>v138</span>','<span class="app-version" hidden>v139</span>',1)

needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch=r'''

/* PALA v139 · active lists, understaffed filter and unified warehouse delete */
function isInquiryV139(value){return String(value||'').trim().toLocaleLowerCase('da-DK')==='forespørgsel'}
function shiftUnderstaffedV139(sh){
  if(!sh||isStaffLeave(sh)||staffLinkedJobCompleted(sh))return false;
  let needed=Math.max(0,+sh.workers_needed||0);
  return needed>0&&staffAssignmentsFor(sh.id).length<needed;
}
function shiftLinkedInquiryV139(sh){
  let booking=typeof staffCalendarBooking==='function'?staffCalendarBooking(sh):null;
  let workshop=typeof staffWorkshopJob==='function'?staffWorkshopJob(sh):null;
  return isInquiryV139(booking?.status)||isInquiryV139(workshop?.status);
}
function bookingActiveInListV139(b){return !!b&&!isInquiryV139(b.status)&&jobLocationStatus(b)!=='Afsluttet'&&b.status!=='Annulleret'}
function workshopActiveInListV139(job){return !!job&&!isInquiryV139(job.status)&&job.status!=='Afsluttet'&&job.status!=='Annulleret'}
function shiftActiveInListV139(sh){return !!sh&&(isStaffLeave(sh)||(!staffLinkedJobCompleted(sh)&&!shiftLinkedInquiryV139(sh)))}

const setUnifiedCalendarStatusV139Base=setUnifiedCalendarStatusV123;
setUnifiedCalendarStatusV123=function(value){
  if(value==='understaffed'){
    mainCalendarTypeFilterV120='staffing';
    mainCalendarStatusFilterV123='understaffed';
    localStorage.setItem('pala_calendar_type_filter','staffing');
    localStorage.setItem('pala_calendar_status_filter','understaffed');
    return showCalendar();
  }
  return setUnifiedCalendarStatusV139Base(value);
};

const setUnifiedCalendarTypeV139Base=setUnifiedCalendarTypeV123;
setUnifiedCalendarTypeV123=function(value){
  if(value!=='staffing'&&mainCalendarStatusFilterV123==='understaffed'){
    mainCalendarStatusFilterV123=calendarViewMode==='list'?'open':'all';
    localStorage.setItem('pala_calendar_status_filter',mainCalendarStatusFilterV123);
  }
  return setUnifiedCalendarTypeV139Base(value);
};

const unifiedStatusMatchV139Base=unifiedStatusMatchV123;
unifiedStatusMatchV123=function(event){
  if(mainCalendarStatusFilterV123!=='understaffed')return unifiedStatusMatchV139Base(event);
  if(event?.kind!=='staffing')return false;
  let rows=event.items?[...event.items.values()]:[event.item];
  return rows.some(shiftUnderstaffedV139);
};

const shiftStatusMatchV139Base=shiftStatusMatchV123;
shiftStatusMatchV123=function(sh){return mainCalendarStatusFilterV123==='understaffed'?shiftUnderstaffedV139(sh):shiftStatusMatchV139Base(sh)};

let calendarStatusBeforeListV139='all';
const setCalendarViewV139Base=setCalendarView;
setCalendarView=function(mode){
  let next=mode==='list'?'list':'calendar';
  if(next==='list'){
    if(calendarViewMode!=='list'&&mainCalendarStatusFilterV123!=='understaffed')calendarStatusBeforeListV139=mainCalendarStatusFilterV123||'all';
    if(mainCalendarStatusFilterV123!=='understaffed'){
      mainCalendarStatusFilterV123='open';
      localStorage.setItem('pala_calendar_status_filter','open');
    }
  }else if(calendarViewMode==='list'&&mainCalendarStatusFilterV123==='open'){
    mainCalendarStatusFilterV123=calendarStatusBeforeListV139||'all';
    localStorage.setItem('pala_calendar_status_filter',mainCalendarStatusFilterV123);
  }
  return setCalendarViewV139Base(next);
};

// Listevisningen er en arbejdsliste: kun aktive/åbne poster.
renderMainCalendarListV121=function(){
  if(calendarViewMode!=='list')return;
  let host=app.querySelector('.view-list');if(!host)return;
  let w=calendarWindowV121(calDate,14),entries=[],openTasks=[];
  let understaffedOnly=mainCalendarTypeFilterV120==='staffing'&&mainCalendarStatusFilterV123==='understaffed';

  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders'){
    bookings.filter(b=>bookingActiveInListV139(b)&&b.start_date&&b.end_date&&b.start_date<=w.last&&b.end_date>=w.first)
      .forEach(b=>entries.push({date:b.start_date<w.first?w.first:String(b.start_date).slice(0,10),order:1,html:orderCard(b)}));
  }

  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing'){
    staffingShifts.filter(sh=>shiftActiveInListV139(sh)&&(!understaffedOnly||shiftUnderstaffedV139(sh))).forEach(sh=>{
      let leave=staffLeaveInfo(sh);
      if(leave){if(!understaffedOnly&&leave.start<=w.last&&leave.end>=w.first)entries.push({date:leave.start<w.first?w.first:leave.start,order:2,html:staffShiftCard(sh)})}
      else if(sh.shift_date>=w.first&&sh.shift_date<=w.last)entries.push({date:sh.shift_date,order:2,html:staffShiftCard(sh)});
    });
  }

  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){
    workshopJobs.filter(j=>workshopActiveInListV139(j)&&j.start_date<=w.last&&j.end_date>=w.first)
      .forEach(j=>entries.push({date:j.start_date<w.first?w.first:j.start_date,order:3,html:workshopJobCard(j)}));
    openTasks=workshopTasks.filter(t=>t.status==='open').sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  }

  if(mainCalendarTypeFilterV120==='all'){
    (palaMeetings||[]).filter(m=>!m.cancelled&&m.start_date<=w.last&&m.end_date>=w.first)
      .forEach(m=>entries.push({date:m.start_date<w.first?w.first:m.start_date,order:5,html:meetingCard(m)}));
  }

  let taskHtml=openTasks.length?`<section class="view-list-group workshop-undated-tasks"><div class="small muted">SYSTUEOPGAVER</div><h3 class="view-list-date">Åbne skader</h3>${openTasks.map(workshopTaskCard).join('')}</section>`:'';
  let datedHtml=entries.length?groupedCalendarListV121(entries,''):'';
  host.innerHTML=taskHtml+datedHtml||'<p class="muted">Ingen aktive eller åbne aktiviteter matcher filtrene.</p>';
};

// Afsluttede bemandingsposter bliver grå i kalenderen, ligesom afsluttede ordrer/systuejobs.
const calendarSegmentButtonV139Base=calendarSegmentButton;
calendarSegmentButton=function(segment,ds,mode){
  let html=calendarSegmentButtonV139Base.apply(this,arguments),kind=segment?.event?.kind,sh=segment?.item;
  let staffingSegment=mode==='staffing'||(mode==='calendar'&&(kind==='staffing'||kind==='staffLeave'));
  if(staffingSegment&&sh&&!isStaffLeave(sh)&&staffLinkedJobCompleted(sh)){
    html=html.replace(/--job-color:[^;\"]+/, '--job-color:#8b929b').replace(/--job-text:[^;\"]+/, '--job-text:#fff');
  }
  return html;
};

const applyUnifiedCalendarTopV139Base=applyUnifiedCalendarTopV123;
applyUnifiedCalendarTopV123=function(){
  if(calendarViewMode==='list'&&mainCalendarStatusFilterV123!=='understaffed'){
    mainCalendarStatusFilterV123='open';
    localStorage.setItem('pala_calendar_status_filter','open');
  }
  let result=applyUnifiedCalendarTopV139Base.apply(this,arguments);
  let statusSelect=app.querySelector('.unified-filter-grid-v123 label:nth-child(2) select');
  if(statusSelect){
    let staffing=mainCalendarTypeFilterV120==='staffing',list=calendarViewMode==='list';
    let rows=list
      ? (staffing?[['open','Aktive'],['understaffed','Ubemandede vagter']]:[['open','Aktive']])
      : [['all','Alle'],['open','Åbne'],['completed','Afsluttede'],...(staffing?[['understaffed','Ubemandede vagter']]:[])];
    statusSelect.innerHTML=rows.map(([value,label])=>`<option value="${value}" ${mainCalendarStatusFilterV123===value?'selected':''}>${label}</option>`).join('');
    if(!rows.some(([value])=>value===mainCalendarStatusFilterV123)){
      mainCalendarStatusFilterV123=list?'open':'all';
      localStorage.setItem('pala_calendar_status_filter',mainCalendarStatusFilterV123);
      statusSelect.value=mainCalendarStatusFilterV123;
    }
    renderMainCalendarListV121();
  }
  return result;
};

// Samme slettevej og samme knap for alle lagerposter.
deleteWarehouseItemV138=async function(kind,id,name){
  if(!requireAdmin()||!id)return;
  let labels={tent:'teltet',inventory:'inventaret',hardware:'hardwaren'},label=labels[kind]||'posten';
  let warning=`Slet ${label}${name?` \"${name}\"`:''} permanent fra lageret?`;
  if(kind==='tent')warning+=' Tilknyttede billeder, dokumenter, pakkeregler og ordretilknytninger fjernes også.';
  if(kind==='hardware')warning+=' Hardware fjernes også fra teltenes pakkebehov.';
  if(!confirm(warning+'\n\nDenne handling kan ikke fortrydes.'))return;
  try{
    try{
      await checkedRpc('admin_delete_warehouse_record',{p_token:adminToken,p_kind:kind,p_id:+id});
    }catch(error){
      let missing=/admin_delete_warehouse_record|schema cache|could not find the function/i.test(String(error?.message||error));
      if(!missing)throw error;
      // Bevar eksisterende telt/inventar-sletning indtil migration 007 er installeret.
      if(kind==='tent')await checkedRpc('admin_delete_tent',{p_token:adminToken,p_id:+id});
      else if(kind==='inventory')await checkedRpc('admin_delete_inventory',{p_token:adminToken,p_id:+id});
      else {
        let item=typeof catalogItem==='function'?catalogItem(+id):null;
        if(item?.legacy_special_id)await checkedRpc('admin_delete_special_hardware',{p_token:adminToken,p_id:+item.legacy_special_id});
        else throw new Error('Databaseopdatering 007 skal installeres, før fælles hardware kan slettes.');
      }
    }
    if(kind==='inventory'&&typeof removeInventoryCacheItem==='function')removeInventoryCacheItem(+id);
    sheetDirty=false;closeEditSheet(true);
    await reloadData();
    if(kind==='hardware'&&typeof loadWarehouseExtensions==='function')await loadWarehouseExtensions();
    await showTents(kind==='tent'?'tents':kind);
  }catch(error){alert('Kunne ikke slette fra lageret: '+String(error?.message||error));}
};

const editCatalogHardwareV139Base=editCatalogHardware;
editCatalogHardware=function(id){
  let result=editCatalogHardwareV139Base.apply(this,arguments);
  if(id){let item=typeof catalogItem==='function'?catalogItem(+id):null;installWarehouseDeleteButtonV138('hardware',+id,item?.name||'');}
  return result;
};

const syncVersionBadgeV139Base=syncVersionBadgeV134;
syncVersionBadgeV134=function(){
  let result=syncVersionBadgeV139Base.apply(this,arguments);
  let badge=document.querySelector('.app-version');if(badge)badge.textContent='v139';
  return result;
};
'''

path.write_text(text.replace(needle,patch+needle,1),encoding='utf-8')
