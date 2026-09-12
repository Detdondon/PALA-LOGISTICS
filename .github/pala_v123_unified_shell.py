from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v123 · unified calendar and creation hub'
if marker in text:
    raise SystemExit('PALA v123 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v123 · unified calendar and creation hub */
let mainCalendarStatusFilterV123=localStorage.getItem('pala_calendar_status_filter')||'all';
if(!['all','open','completed'].includes(mainCalendarStatusFilterV123))mainCalendarStatusFilterV123='all';

function setUnifiedCalendarTypeV123(value){
  mainCalendarTypeFilterV120=['orders','staffing','workshop'].includes(value)?value:'all';
  localStorage.setItem('pala_calendar_type_filter',mainCalendarTypeFilterV120);
  showCalendar();
}
function setUnifiedCalendarStatusV123(value){
  mainCalendarStatusFilterV123=['open','completed'].includes(value)?value:'all';
  localStorage.setItem('pala_calendar_status_filter',mainCalendarStatusFilterV123);
  showCalendar();
}
function unifiedStatusMatchV123(event){
  if(mainCalendarStatusFilterV123==='all')return true;
  let wantDone=mainCalendarStatusFilterV123==='completed',kind=event?.kind,item=event?.item;
  if(!kind)return (jobLocationStatus(item)==='Afsluttet')===wantDone;
  if(kind==='workshop')return (item?.status==='Afsluttet')===wantDone;
  if(kind==='workshopTask')return (item?.status==='completed')===wantDone;
  if(kind==='staffLeave')return !wantDone;
  if(kind==='staffing'){
    let rows=event.items?[...event.items.values()]:[item];
    return rows.some(sh=>!!staffLinkedJobCompleted(sh)===wantDone);
  }
  return false;
}
const calendarEventsV123Base=calendarEvents;
calendarEvents=function(start,days,mode){let rows=calendarEventsV123Base(start,days,mode);return mode==='calendar'?rows.filter(unifiedStatusMatchV123):rows};

function bookingStatusMatchV123(b){let done=jobLocationStatus(b)==='Afsluttet';return mainCalendarStatusFilterV123==='all'||(mainCalendarStatusFilterV123==='completed'?done:!done)}
function shiftStatusMatchV123(sh){if(isStaffLeave(sh))return mainCalendarStatusFilterV123!=='completed';let done=staffLinkedJobCompleted(sh);return mainCalendarStatusFilterV123==='all'||(mainCalendarStatusFilterV123==='completed'?done:!done)}
function workshopJobStatusMatchV123(j){let done=j?.status==='Afsluttet';return mainCalendarStatusFilterV123==='all'||(mainCalendarStatusFilterV123==='completed'?done:!done)}
function workshopTaskStatusMatchV123(t){let done=t?.status==='completed';return mainCalendarStatusFilterV123==='all'||(mainCalendarStatusFilterV123==='completed'?done:!done)}

function renderUnifiedMainListV123(){
  if(calendarViewMode!=='list')return;let host=app.querySelector('.view-list');if(!host)return;let w=calendarWindowV121(calDate,14),entries=[];
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='orders')bookings.filter(b=>b.status!=='Annulleret'&&bookingStatusMatchV123(b)&&b.start_date&&b.end_date&&b.start_date<=w.last&&b.end_date>=w.first).forEach(b=>entries.push({date:b.start_date<w.first?w.first:String(b.start_date).slice(0,10),order:1,html:orderCard(b)}));
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='staffing')staffingShifts.filter(shiftStatusMatchV123).forEach(sh=>{let leave=staffLeaveInfo(sh);if(leave){if(leave.start<=w.last&&leave.end>=w.first)entries.push({date:leave.start<w.first?w.first:leave.start,order:2,html:staffShiftCard(sh)})}else if(sh.shift_date>=w.first&&sh.shift_date<=w.last)entries.push({date:sh.shift_date,order:2,html:staffShiftCard(sh)})});
  if(mainCalendarTypeFilterV120==='all'||mainCalendarTypeFilterV120==='workshop'){
    workshopJobs.filter(j=>j.status!=='Annulleret'&&workshopJobStatusMatchV123(j)&&j.start_date<=w.last&&j.end_date>=w.first).forEach(j=>entries.push({date:j.start_date<w.first?w.first:j.start_date,order:3,html:workshopJobCard(j)}));
    workshopTasks.filter(workshopTaskStatusMatchV123).forEach(t=>{let r=workshopTaskRangeV120(t);if(r&&r.start<=w.last&&r.end>=w.first)entries.push({date:r.start<w.first?w.first:r.start,order:4,html:workshopTaskCard(t)})});
  }
  if(mainCalendarTypeFilterV120==='all'&&mainCalendarStatusFilterV123==='all')(palaMeetings||[]).filter(m=>!m.cancelled&&m.start_date<=w.last&&m.end_date>=w.first).forEach(m=>entries.push({date:m.start_date<w.first?w.first:m.start_date,order:5,html:meetingCard(m)}));
  host.innerHTML=groupedCalendarListV121(entries,'Ingen aktiviteter matcher filtrene i perioden.');
}

function unifiedPeriodCountsV123(){
  let days=calendarViewMode==='calendar'?28:14,start=new Date(calDate);start.setDate(start.getDate()-((start.getDay()+6)%7));let end=new Date(start);end.setDate(start.getDate()+days-1),first=staffDateString(start),last=staffDateString(end);
  let orders=bookings.filter(b=>b.status!=='Annulleret'&&b.start_date<=last&&b.end_date>=first).length;
  let shifts=staffingShifts.filter(sh=>{let leave=staffLeaveInfo(sh);return leave?leave.start<=last&&leave.end>=first:sh.shift_date>=first&&sh.shift_date<=last}).length;
  let workshop=workshopJobs.filter(j=>j.status!=='Annulleret'&&j.start_date<=last&&j.end_date>=first).length+workshopTasks.filter(t=>{let r=workshopTaskRangeV120(t);return r&&r.start<=last&&r.end>=first}).length;
  let openDamage=workshopTasks.filter(t=>t.status==='open').length;
  let under=staffingShifts.filter(sh=>!isStaffLeave(sh)&&sh.shift_date>=first&&sh.shift_date<=last&&staffAssignmentsFor(sh.id).length<(+sh.workers_needed||1)).length;
  return {orders,shifts,workshop,openDamage,under};
}
function ensureUnifiedFormHostV123(){let control=app.querySelector('.calendar-control-card');if(control&&!document.getElementById('staffAdminEditHost'))control.insertAdjacentHTML('afterend','<div id="staffAdminEditHost"></div>')}
function applyUnifiedCalendarTopV123(){
  let control=app.querySelector('.calendar-control-card');if(!control)return;
  control.querySelector('.calendar-filter-row-v120')?.remove();control.querySelector('.unified-calendar-tools-v123')?.remove();
  let nav=control.querySelector('.calendar-nav-controls');if(!nav)return;let c=unifiedPeriodCountsV123();
  let tools=document.createElement('div');tools.className='unified-calendar-tools-v123';
  tools.innerHTML=`<div class="unified-filter-grid-v123"><label><span>Vis</span><select class="compact-select" onchange="setUnifiedCalendarTypeV123(this.value)"><option value="all" ${mainCalendarTypeFilterV120==='all'?'selected':''}>Alt</option><option value="orders" ${mainCalendarTypeFilterV120==='orders'?'selected':''}>Ordrer</option><option value="staffing" ${mainCalendarTypeFilterV120==='staffing'?'selected':''}>Bemanding</option><option value="workshop" ${mainCalendarTypeFilterV120==='workshop'?'selected':''}>Systue</option></select></label><label><span>Status</span><select class="compact-select" onchange="setUnifiedCalendarStatusV123(this.value)"><option value="all" ${mainCalendarStatusFilterV123==='all'?'selected':''}>Alle</option><option value="open" ${mainCalendarStatusFilterV123==='open'?'selected':''}>Åbne</option><option value="completed" ${mainCalendarStatusFilterV123==='completed'?'selected':''}>Afsluttede</option></select></label></div><div class="unified-calendar-summary-v123"><button class="pill reference-button" onclick="setUnifiedCalendarTypeV123('orders')">${uiIcon('calendar')}${c.orders} ordrer</button><button class="pill reference-button ${c.under?'red':''}" onclick="setUnifiedCalendarTypeV123('staffing')">${uiIcon('people')}${c.shifts} vagter${c.under?` · ${c.under} mangler folk`:''}</button><button class="pill reference-button ${c.openDamage?'red':''}" onclick="setUnifiedCalendarTypeV123('workshop')">${uiIcon('scissors')}${c.workshop} systue · ${c.openDamage} åbne skader</button></div><div class="unified-calendar-actions-v123"><button class="btn" onclick="showStaffingExportDialog()">${uiIcon('document')} Bemandingsplan PDF</button>${isAdminLoggedIn()?`<button class="btn" onclick="showProductionPlanExportDialog()">${uiIcon('document')} Produktionsplan</button>`:''}</div>`;
  nav.insertAdjacentElement('afterend',tools);
  let meta=control.querySelector('.calendar-meta');if(meta){meta.querySelectorAll('.calendar-create,[data-create-shift],[data-leave-action],button').forEach(button=>{let code=button.getAttribute('onclick')||'';if(/newOrder\(|editMeeting\(|showDamageForm\(|showWorkshopJobForm\(|editExistingStaffShift\(|showStaffLeaveForm\(/.test(code))button.remove()})}
  ensureUnifiedFormHostV123();renderUnifiedMainListV123();
}

function ensureUnifiedNavV123(){
  let nav=document.querySelector('.nav');if(!nav||!isEmployeeLoggedIn())return;
  let onCalendar=!!document.getElementById('app')?.querySelector('.calendar-control-card')&&!new URLSearchParams(location.search).has('warehouse'),onWarehouse=new URLSearchParams(location.search).has('warehouse')||new URLSearchParams(location.search).has('i')||new URLSearchParams(location.search).has('h')||new URLSearchParams(location.search).has('t');
  nav.style.display='grid';nav.style.gridTemplateColumns='repeat(3,1fr)';
  nav.innerHTML=`<button id="nc" class="btn ${onCalendar?'active':''}" onclick="showCalendar()">${uiIcon('calendar','nav-icon icon-nav')}<span>Kalender</span></button><button type="button" class="btn nav-create-v123" onclick="toggleCreateMenuV123(event)" aria-label="Opret" aria-expanded="false"><span class="nav-create-circle-v123">${uiIcon('plus','nav-icon icon-nav')}</span></button><button id="np" class="btn ${onWarehouse?'active':''}" onclick="showTents()">${uiIcon('box','nav-icon icon-nav')}<span>Lager</span></button>`;
}
function addAdminMenuEntryV123(){
  let menu=document.getElementById('userMenuPopover');if(!menu)return;menu.querySelector('[data-admin-backup-shortcut]')?.remove();menu.querySelector('[data-admin-menu-v123]')?.remove();
  if(!isAdminLoggedIn())return;let button=document.createElement('button');button.type='button';button.className='user-menu-action';button.dataset.adminMenuV123='1';button.innerHTML=uiIcon('settings','ui-icon')+'<span>Admin</span>';button.onclick=()=>{closeUserMenu();showAdmin()};let pin=[...menu.querySelectorAll('.user-menu-action')].find(el=>(el.getAttribute('onclick')||'').includes('showOwnPinDialog'));if(pin)menu.insertBefore(button,pin);else menu.appendChild(button);
}

function createMenuHtmlV123(){
  let common=`<button onclick="runCreateActionV123('damage')">${uiIcon('scissors')}<span><b>Registrér skade</b><small>Systue / reparation</small></span></button><button onclick="runCreateActionV123('leave')">${uiIcon('user')}<span><b>${isAdminLoggedIn()?'Registrér ferie / ude':'Meld ferie / ude'}</b><small>Bemanding og fravær</small></span></button>`;
  if(!isAdminLoggedIn())return common;
  return `<div class="create-menu-section-v123"><small>DRIFT</small><button onclick="runCreateActionV123('order')">${uiIcon('calendar')}<span><b>Ny ordre</b><small>Booking / job</small></span></button><button onclick="runCreateActionV123('shift')">${uiIcon('people')}<span><b>Ny vagt</b><small>Bemanding</small></span></button><button onclick="runCreateActionV123('workshop')">${uiIcon('scissors')}<span><b>Nyt systuejob</b><small>Planlagt arbejde</small></span></button><button onclick="runCreateActionV123('meeting')">${uiIcon('calendar')}<span><b>Nyt møde</b><small>Kalender</small></span></button>${common}</div><div class="create-menu-section-v123"><small>LAGER</small><button onclick="runCreateActionV123('tent')">${uiIcon('tent')}<span><b>Nyt telt</b><small>Lager</small></span></button><button onclick="runCreateActionV123('hardware')">${uiIcon('settings')}<span><b>Ny hardware</b><small>Lager</small></span></button><button onclick="runCreateActionV123('inventory')">${uiIcon('box')}<span><b>Nyt inventar</b><small>Lager</small></span></button></div>`;
}
function toggleCreateMenuV123(event){
  event?.stopPropagation();let menu=document.getElementById('createMenuV123');if(!menu){menu=document.createElement('div');menu.id='createMenuV123';menu.className='create-menu-v123';document.body.appendChild(menu)}let opening=menu.hidden!==false;menu.innerHTML=createMenuHtmlV123();menu.hidden=!opening;document.querySelector('.nav-create-v123')?.setAttribute('aria-expanded',opening?'true':'false');
}
function closeCreateMenuV123(){let menu=document.getElementById('createMenuV123');if(menu)menu.hidden=true;document.querySelector('.nav-create-v123')?.setAttribute('aria-expanded','false')}
async function openUnifiedShiftFormV123(){mainCalendarTypeFilterV120='staffing';localStorage.setItem('pala_calendar_type_filter','staffing');await showCalendar();ensureUnifiedFormHostV123();editExistingStaffShift(null)}
async function openUnifiedLeaveFormV123(){mainCalendarTypeFilterV120='staffing';localStorage.setItem('pala_calendar_type_filter','staffing');await showCalendar();ensureUnifiedFormHostV123();showStaffLeaveForm()}
function runCreateActionV123(action){
  closeCreateMenuV123();
  if(action==='damage')return showDamageForm();if(action==='leave')return openUnifiedLeaveFormV123();
  if(!isAdminLoggedIn())return alert('Adminfunktion skal være aktiv for denne handling.');
  if(action==='order')return newOrder();if(action==='shift')return openUnifiedShiftFormV123();if(action==='workshop')return showWorkshopJobForm();if(action==='meeting')return editMeeting(null);if(action==='tent')return editTentBasics(null);if(action==='hardware')return editCatalogHardware(null);if(action==='inventory')return editInventoryBasics(null);
}
document.addEventListener('click',event=>{if(!event.target.closest?.('#createMenuV123,.nav-create-v123'))closeCreateMenuV123()});

const quickSetBookingStatusV123Admin=quickSetBookingStatus;
quickSetBookingStatus=async function(id,status){
  let booking=bookings.find(row=>+row.id===+id);if(!booking||jobLocationStatus(booking)===status)return;
  if(isAdminLoggedIn())return quickSetBookingStatusV123Admin(id,status);
  if(!requireEmployee())return;if(!['På lager','Ude'].includes(status)){document.querySelectorAll(`[data-booking-status="${id}"]`).forEach(select=>select.value=jobLocationStatus(booking));return alert('Kun en administrator kan markere en ordre som Afsluttet.')}
  document.querySelectorAll(`[data-booking-status="${id}"]`).forEach(select=>select.disabled=true);
  let result=await sb.rpc('employee_set_booking_status',{p_token:employeeToken,p_booking_id:+id,p_status:status});
  if(result.error){document.querySelectorAll(`[data-booking-status="${id}"]`).forEach(select=>{select.disabled=false;select.value=jobLocationStatus(booking)});return alert(/employee_set_booking_status|schema cache|function/i.test(result.error.message)?'Medarbejderstatus kræver PALA v123-databaseopdateringen. Kontakt en administrator.':result.error.message)}
  await reloadData();let updated=bookings.find(row=>+row.id===+id),params=new URLSearchParams(location.search);if(params.get('job')&&updated)return viewOrder(updated);showCalendar();
};
const orderCardV123Base=orderCard;
orderCard=function(booking){
  let html=orderCardV123Base(booking);if(!isAdminLoggedIn()&&isEmployeeLoggedIn()&&!html.includes(`data-booking-status="${booking.id}"`))html=html.replace('<div class="job-actions',`<div class="job-quick-status" onclick="event.stopPropagation()"><label for="cardStatus${booking.id}">Jobstatus</label><select id="cardStatus${booking.id}" data-booking-status="${booking.id}" onclick="event.stopPropagation()" onchange="event.stopPropagation();quickSetBookingStatus(${booking.id},this.value)"><option value="På lager" ${jobLocationStatus(booking)==='På lager'?'selected':''}>På lager</option><option value="Ude" ${jobLocationStatus(booking)==='Ude'?'selected':''}>Ude</option></select></div><div class="job-actions`);return html;
};

const showCalendarV123Base=showCalendar;
showCalendar=async function(){let result=await showCalendarV123Base.apply(this,arguments);applyUnifiedCalendarTopV123();ensureUnifiedNavV123();return result};
showStaffing=function(){mainCalendarTypeFilterV120='staffing';localStorage.setItem('pala_calendar_type_filter','staffing');return showCalendar()};
showWorkshop=function(filter){mainCalendarTypeFilterV120='workshop';localStorage.setItem('pala_calendar_type_filter','workshop');if(filter)setUnifiedCalendarStatusV123(filter==='completed'?'completed':filter==='open'?'open':'all');else return showCalendar()};
openWorkshopTaskFromCalendarV120=function(id){let task=workshopTasks.find(row=>+row.id===+id);if(task?.tent_id)return openTent(+task.tent_id);mainCalendarTypeFilterV120='workshop';showCalendar()};

const showTentsV123Base=showTents;
showTents=async function(){let result=await showTentsV123Base.apply(this,arguments);ensureUnifiedNavV123();return result};
const syncLoginUiV123Base=syncLoginUi;
syncLoginUi=function(){let result=syncLoginUiV123Base.apply(this,arguments);ensureUnifiedNavV123();addAdminMenuEntryV123();return result};

if(!document.getElementById('pala-v123-style')){let style=document.createElement('style');style.id='pala-v123-style';style.textContent=`
.nav{grid-template-columns:repeat(3,1fr)!important;overflow:visible!important}.nav-create-v123{overflow:visible!important}.nav-create-v123::after{display:none!important}.nav-create-circle-v123{width:62px;height:62px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1083ff;color:#fff;box-shadow:0 8px 24px rgba(16,131,255,.3);transform:translateY(-14px)}.nav-create-circle-v123 svg{width:30px!important;height:30px!important}.create-menu-v123{position:fixed;z-index:80;left:50%;transform:translateX(-50%);bottom:calc(86px + env(safe-area-inset-bottom));width:min(430px,calc(100vw - 24px));max-height:65dvh;overflow:auto;background:#fff;border:1px solid #dce4ee;border-radius:18px;padding:10px;box-shadow:0 18px 48px rgba(29,45,68,.22)}.create-menu-v123[hidden]{display:none}.create-menu-section-v123+ .create-menu-section-v123{border-top:1px solid #e7ebf1;margin-top:8px;padding-top:8px}.create-menu-section-v123>small{display:block;padding:7px 10px 4px;color:#667085;font-size:10px;font-weight:800;letter-spacing:.08em}.create-menu-v123 button{width:100%;display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:center;text-align:left;border:0;background:transparent;border-radius:12px;padding:11px;color:#172033}.create-menu-v123 button:hover{background:#f4f7fb}.create-menu-v123 button svg{width:23px;height:23px;color:#1083ff}.create-menu-v123 button span{display:flex;flex-direction:column;gap:2px}.create-menu-v123 button b{font-size:14px}.create-menu-v123 button small{font-size:11px;color:#667085}.unified-calendar-tools-v123{border-top:1px solid #edf1f5;margin-top:12px;padding-top:12px}.unified-filter-grid-v123{display:grid;grid-template-columns:1fr 1fr;gap:10px}.unified-filter-grid-v123 label{margin:0;font-size:11px;color:#667085}.unified-filter-grid-v123 label span{display:block;margin-bottom:5px}.unified-filter-grid-v123 select{width:100%;min-width:0}.unified-calendar-summary-v123,.unified-calendar-actions-v123{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.unified-calendar-summary-v123 .pill{border:0;cursor:pointer}.unified-calendar-actions-v123 .btn{font-size:12px;padding:10px 12px}@media(max-width:520px){.nav-create-circle-v123{width:58px;height:58px}.unified-filter-grid-v123{grid-template-columns:1fr 1fr}.unified-calendar-summary-v123 .pill{font-size:10px;padding:7px 9px}.unified-calendar-actions-v123 .btn{flex:1 1 calc(50% - 4px)}}`;
document.head.appendChild(style)}
'''
text=text.replace(needle,patch+needle,1)
if text.count(marker)!=1: raise SystemExit('Marker verification failed')
for required in ['ensureUnifiedNavV123','runCreateActionV123','setUnifiedCalendarTypeV123','employee_set_booking_status','nav-create-circle-v123']:
    if required not in text: raise SystemExit(f'Missing required marker: {required}')
path.write_text(text,encoding='utf-8')
print('Applied PALA v123 unified calendar and creation hub')
