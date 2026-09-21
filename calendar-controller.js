/* PALA calendar controller v150
   Single production calendar state/navigation/filter/sort layer. */
(()=>{
'use strict';
if(typeof showCalendar!=='function'||typeof calendarEvents!=='function')return;
const TYPES=['all','orders','staffing','workshop'],COMMON=['all','active','completed'],SORTS=['date_asc','date_desc','name_asc','name_desc','type','status'],legacyEvents=calendarEvents,baseOrderCard=orderCard,locale='da-DK';
const text=v=>String(v??'').trim(),date=v=>text(v).slice(0,10),cmp=(a,b)=>text(a).localeCompare(text(b),locale,{numeric:true,sensitivity:'base'}),max=(a,b)=>a>b?a:b;
const normType=v=>TYPES.includes(v)?v:'all';
function allowed(type){let x=[...COMMON];if(type==='orders')x.push('inquiry','warehouse','out');if(type==='staffing')x.push('understaffed');return x}
function normStatus(v,type=normType(mainCalendarTypeFilterV120)){if(v==='open')v='active';return allowed(type).includes(v)?v:'active'}
const normSort=v=>SORTS.includes(v)?v:'date_asc';
let calendarSortV150=normSort(localStorage.getItem('pala_calendar_sort')||'date_asc');
mainCalendarTypeFilterV120=normType(mainCalendarTypeFilterV120);mainCalendarStatusFilterV123=normStatus(mainCalendarStatusFilterV123,mainCalendarTypeFilterV120);calendarViewMode=calendarViewMode==='list'?'list':'calendar';
function persist(){localStorage.setItem('pala_calendar_type_filter',mainCalendarTypeFilterV120);localStorage.setItem('pala_calendar_status_filter',mainCalendarStatusFilterV123);localStorage.setItem('pala_calendar_view',calendarViewMode);localStorage.setItem('pala_calendar_sort',calendarSortV150)}persist();
function orderStatus(r){let s=text(r?.status);if(s==='Afsluttet')return'Afsluttet';if(s==='Ude'||s==='Udleveret')return'Ude';if(s==='Forespørgsel')return'Forespørgsel';if(s==='På lager')return'På lager';return s||'På lager'}
jobLocationStatus=r=>orderStatus(r);
const leave=r=>typeof isStaffLeave==='function'&&isStaffLeave(r),staffDone=r=>!!(typeof staffLinkedJobCompleted==='function'&&staffLinkedJobCompleted(r));
function understaffed(r){if(!r||leave(r)||staffDone(r))return false;let need=Math.max(0,+r.workers_needed||0),filled=typeof staffAssignmentsFor==='function'?(staffAssignmentsFor(r.id)||[]).length:0;return need>0&&filled<need}
const workshopDone=r=>r?.status==='Afsluttet',taskDone=r=>r?.status==='completed';
function cancelled(kind,r){if(kind==='order'||kind==='workshop')return r?.status==='Annulleret';return !!r?.cancelled}
function rowMatch(kind,r,status=mainCalendarStatusFilterV123){status=normStatus(status,mainCalendarTypeFilterV120);if(!r||cancelled(kind,r))return false;if(status==='all')return true;if(kind==='order'){let s=orderStatus(r),done=s==='Afsluttet';if(status==='active')return !done;if(status==='completed')return done;if(status==='inquiry')return s==='Forespørgsel';if(status==='warehouse')return s==='På lager';if(status==='out')return s==='Ude';return false}if(kind==='staffing'){if(leave(r))return status==='active';if(status==='understaffed')return understaffed(r);let done=staffDone(r);return status==='completed'?done:status==='active'?!done:false}if(kind==='workshop'){let done=workshopDone(r);return status==='completed'?done:status==='active'?!done:false}if(kind==='workshopTask'){let done=taskDone(r);return status==='completed'?done:status==='active'?!done:false}if(kind==='meeting')return status==='active';return status==='active'}
const kind=e=>e?.kind||'order',eventRows=e=>e?.items?[...e.items.values()]:[e?.item].filter(Boolean);
function eventStatusMatch(e){let k=kind(e),rows=eventRows(e),s=mainCalendarStatusFilterV123;if(k==='staffing'||k==='staffLeave'){let work=rows.filter(r=>!leave(r));if(s==='completed')return work.length>0&&work.every(staffDone);if(s==='understaffed')return rows.some(understaffed);if(s==='active')return rows.some(r=>leave(r)||!staffDone(r));return s==='all'}return rowMatch(k,e?.item,s)}
function eventTypeMatch(e){let t=mainCalendarTypeFilterV120,k=kind(e);if(k==='workshopTask'&&t!=='workshop')return false;if(t==='all')return true;if(t==='orders')return k==='order';if(t==='staffing')return k==='staffing'||k==='staffLeave';return k==='workshop'||k==='workshopTask'}
const eventName=e=>e?.name||e?.item?.customer_name||e?.item?.title||e?.item?.tent_name||e?.item?.description||'',eventKey=e=>e?.key||`${kind(e)}-${e?.item?.id||e?.id||eventName(e)}-${e?.start||''}-${e?.end||''}`,priority=e=>({order:1,staffing:2,staffLeave:2,workshop:3,workshopTask:4,meeting:5})[kind(e)]||9;
function rawEvents(start,days){let t=mainCalendarTypeFilterV120,s=mainCalendarStatusFilterV123,hasSS=typeof staffingCalendarStatusFilterV120!=='undefined',ss=hasSS?staffingCalendarStatusFilterV120:null,hasW=typeof workshopFilter!=='undefined',wf=hasW?workshopFilter:null,rows=[];try{mainCalendarTypeFilterV120='all';mainCalendarStatusFilterV123='all';if(hasSS)staffingCalendarStatusFilterV120='all';if(hasW)workshopFilter='all';rows=legacyEvents(start,days,'calendar')||[]}finally{mainCalendarTypeFilterV120=t;mainCalendarStatusFilterV123=s;if(hasSS)staffingCalendarStatusFilterV120=ss;if(hasW)workshopFilter=wf}if(typeof workshopTaskRangeV120==='function'&&Array.isArray(workshopTasks)){let first=staffDateString(start),d=new Date(start);d.setDate(d.getDate()+(+days||1)-1);let last=staffDateString(d);workshopTasks.filter(r=>r?.status==='open').forEach(r=>{let x=workshopTaskRangeV120(r);if(x&&x.start<=last&&x.end>=first)rows.push({key:`workshop-task-${r.id}`,kind:'workshopTask',start:x.start,end:x.end,item:r,name:r.tent_name||tents?.[r.tent_id]?.name||r.description||'Skade'})})}let seen=new Set;return rows.filter(r=>{let k=eventKey(r);if(seen.has(k))return false;seen.add(k);return true})}
calendarEvents=function(start,days,mode){if(mode!=='calendar')return legacyEvents.apply(this,arguments);return rawEvents(start,days).filter(eventTypeMatch).filter(eventStatusMatch).sort((a,b)=>date(a.start).localeCompare(date(b.start))||date(b.end||b.start).localeCompare(date(a.end||a.start))||priority(a)-priority(b)||cmp(eventName(a),eventName(b))||cmp(eventKey(a),eventKey(b)))};
bookingStatusMatchV123=r=>rowMatch('order',r);shiftStatusMatchV123=r=>rowMatch('staffing',r);workshopJobStatusMatchV123=r=>rowMatch('workshop',r);workshopTaskStatusMatchV123=r=>rowMatch('workshopTask',r);unifiedStatusMatchV123=e=>eventStatusMatch(e);
function monthWindow(d=calDate){let fd=new Date(d.getFullYear(),d.getMonth(),1),ld=new Date(d.getFullYear(),d.getMonth()+1,0);return{first:staffDateString(fd),last:staffDateString(ld),fd,ld}}
function gridWindow(d=calDate){let w=monthWindow(d),start=new Date(w.fd),end=new Date(w.ld);start.setDate(start.getDate()-((start.getDay()+6)%7));end.setDate(end.getDate()+((7-end.getDay())%7));return{start,days:Math.round((end-start)/86400000)+1}}
function moveMonth(d,n){let day=d.getDate(),x=new Date(d.getFullYear(),d.getMonth()+n,1),last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(day,last));return x}
function statusRows(type){let r=[['all','Alle'],['active',type==='workshop'?'Åbne':'Aktive'],['completed','Afsluttede']];if(type==='orders')r.push(['inquiry','Forespørgsler'],['warehouse','På lager'],['out','Ude']);if(type==='staffing')r.push(['understaffed','Ubemandede vagter']);return r}
function normalizeFilter(){let n=normStatus(mainCalendarStatusFilterV123,mainCalendarTypeFilterV120);if(n!==mainCalendarStatusFilterV123){mainCalendarStatusFilterV123=n;persist()}}
setUnifiedCalendarTypeV123=function(v){mainCalendarTypeFilterV120=normType(v);normalizeFilter();persist();return showCalendar()};setUnifiedCalendarStatusV123=function(v){mainCalendarStatusFilterV123=normStatus(v,mainCalendarTypeFilterV120);persist();return showCalendar()};setCalendarView=function(v){calendarViewMode=v==='list'?'list':'calendar';persist();return showCalendar()};setCalendarDay=function(ds){let d=localDateFromISO(ds);if(d){calDate=d;return showCalendar()}};mv=function(n){calDate=moveMonth(calDate,Number(n)||0);return showCalendar()};jumpCalendarMonth=function(v){let m=text(v).match(/^(\d{4})-(\d{2})$/);if(!m)return;let x=new Date(+m[1],+m[2]-1,1),last=new Date(+m[1],+m[2],0).getDate();x.setDate(Math.min(calDate.getDate(),last));calDate=x;return showCalendar()};goCalendarToday=function(){calDate=new Date;return showCalendar()};window.setCalendarSortV150=function(v){calendarSortV150=normSort(v);persist();return showCalendar()};
const label=k=>({order:'Ordre',staffing:'Bemanding',workshop:'Systuejob',workshopTask:'Skade',meeting:'Møde'})[k]||'Aktivitet';
function statusLabel(k,r){if(k==='order')return orderStatus(r);if(k==='staffing')return leave(r)?'Fravær':staffDone(r)?'Afsluttet':understaffed(r)?'Ubemandet':'Aktiv';if(k==='workshop')return text(r?.status)||'Aktiv';if(k==='workshopTask')return taskDone(r)?'Afsluttet':'Åben';return'Aktiv'}
function name(k,r){if(k==='order')return r?.customer_name||r?.title||r?.order_no||`Ordre ${r?.id||''}`;if(k==='staffing'){if(leave(r))return r?.employee_name||r?.title||'Fravær';let b=typeof staffCalendarBooking==='function'?staffCalendarBooking(r):null,w=typeof staffWorkshopJob==='function'?staffWorkshopJob(r):null;return b?.customer_name||b?.title||w?.title||r?.title||`Vagt ${r?.id||''}`}if(k==='workshop')return r?.title||`Systuejob ${r?.id||''}`;if(k==='workshopTask')return r?.tent_name||tents?.[r?.tent_id]?.name||r?.description||`Skade ${r?.id||''}`;return r?.title||'Møde'}
const time=v=>/^\d\d:\d\d/.test(text(v))?text(v).slice(0,5):'',card=(k,r)=>k==='order'?orderCard(r):k==='staffing'?staffShiftCard(r):k==='workshop'?workshopJobCard(r):k==='workshopTask'?workshopTaskCard(r):meetingCard(r);
function entries(){let w=monthWindow(),type=mainCalendarTypeFilterV120,out=[],add=(k,r,start,t='')=>out.push({k,r,date:max(date(start),w.first),time:time(t),name:name(k,r),status:statusLabel(k,r),html:card(k,r)});if(type==='all'||type==='orders')bookings.forEach(r=>{let a=date(r?.start_date),b=date(r?.end_date);if(a&&b&&a<=w.last&&b>=w.first&&rowMatch('order',r))add('order',r,a,r.start_time)});if(type==='all'||type==='staffing')staffingShifts.forEach(r=>{if(!rowMatch('staffing',r))return;let l=typeof staffLeaveInfo==='function'?staffLeaveInfo(r):null;if(l){if(l.start<=w.last&&l.end>=w.first)add('staffing',r,l.start)}else{let d=date(r.shift_date);if(d>=w.first&&d<=w.last)add('staffing',r,d,r.start_time)}});if(type==='all'||type==='workshop'){workshopJobs.forEach(r=>{let a=date(r?.start_date),b=date(r?.end_date);if(a&&b&&a<=w.last&&b>=w.first&&rowMatch('workshop',r))add('workshop',r,a,r.start_time)});workshopTasks.forEach(r=>{if(type!=='workshop'||!rowMatch('workshopTask',r)||typeof workshopTaskRangeV120!=='function')return;let x=workshopTaskRangeV120(r);if(x&&x.start<=w.last&&x.end>=w.first)add('workshopTask',r,x.start)})}if(type==='all'&&['all','active'].includes(mainCalendarStatusFilterV123))(palaMeetings||[]).forEach(r=>{let a=date(r?.start_date),b=date(r?.end_date);if(!r?.cancelled&&a&&b&&a<=w.last&&b>=w.first)add('meeting',r,a,r.start_time)});return out}
/* PALA v159 · open workshop damages first only in Systue view */
function pinnedOpenDamage(row){return mainCalendarTypeFilterV120==='workshop'&&row?.k==='workshopTask'&&!taskDone(row.r)}
function splitPinnedWorkshopRows(rows){if(mainCalendarTypeFilterV120!=='workshop')return{pinned:[],rest:rows};let pinned=[],rest=[];rows.forEach(row=>(pinnedOpenDamage(row)?pinned:rest).push(row));return{pinned,rest}}
function sorted(rows){let base=(a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0),priority=(a,b)=>(pinnedOpenDamage(a)?0:1)-(pinnedOpenDamage(b)?0:1);if(calendarSortV150==='date_desc')return[...rows].sort((a,b)=>priority(a,b)||-base(a,b));if(calendarSortV150==='name_asc')return[...rows].sort((a,b)=>priority(a,b)||cmp(a.name,b.name)||base(a,b));if(calendarSortV150==='name_desc')return[...rows].sort((a,b)=>priority(a,b)||cmp(b.name,a.name)||base(a,b));if(calendarSortV150==='type')return[...rows].sort((a,b)=>priority(a,b)||cmp(label(a.k),label(b.k))||base(a,b));if(calendarSortV150==='status')return[...rows].sort((a,b)=>priority(a,b)||cmp(a.status,b.status)||base(a,b));return[...rows].sort((a,b)=>priority(a,b)||base(a,b))}
function renderRowsGroupedByDate(rows){let dates=[...new Set(rows.map(r=>r.date))];return dates.map(ds=>`<section class="view-list-group" data-date="${ds}"><h3 class="view-list-date">${listDateHeading(ds)}</h3>${rows.filter(r=>r.date===ds).map(r=>r.html).join('')}</section>`).join('')}
function renderPinnedWorkshopRows(rows){return rows.length?`<section class="view-list-group workshop-open-pinned-v159"><h3 class="view-list-date">Åbne skader</h3>${rows.map(r=>r.html).join('')}</section>`:''}
function renderList(){let host=app.querySelector('.view-list');if(!host||calendarViewMode!=='list')return;let rows=sorted(entries());if(!rows.length){host.innerHTML='<p class="muted">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';return}let split=splitPinnedWorkshopRows(rows),pinnedHtml=renderPinnedWorkshopRows(split.pinned);if(['date_asc','date_desc'].includes(calendarSortV150)){host.innerHTML=pinnedHtml+renderRowsGroupedByDate(split.rest);return}host.innerHTML=pinnedHtml+split.rest.map(r=>`<section class="calendar-list-flat-v150"><div class="calendar-list-meta-v150">${esc(fmtDateDa(r.date))} · ${esc(label(r.k))} · ${esc(r.status)}</div>${r.html}</section>`).join('')}
renderMainCalendarListV121=renderList;
/* PALA v157 · full-month detail list + understaffed regression */
function monthDetailHtml(){let rows=[...entries()].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0));if(!rows.length)return '<p class="calendar-empty">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';let split=splitPinnedWorkshopRows(rows);return renderPinnedWorkshopRows(split.pinned)+renderRowsGroupedByDate(split.rest)}
window.calendarMonthDetailHtmlV157=monthDetailHtml;
function dayHtml(ds){let type=mainCalendarTypeFilterV120,rows=[],add=(k,r,t='')=>rows.push({k,r,time:time(t),name:name(k,r),html:card(k,r)});if(type==='all'||type==='orders')(bookingsForCalendarDate(ds)||[]).forEach(r=>{if(rowMatch('order',r))add('order',r,r.start_time)});if(type==='all'||type==='staffing')staffingShifts.forEach(r=>{let on=leave(r)?staffLeaveContains(r,ds):date(r.shift_date)===ds;if(on&&rowMatch('staffing',r))add('staffing',r,r.start_time)});if(type==='all'||type==='workshop'){workshopJobs.forEach(r=>{if(r.start_date<=ds&&r.end_date>=ds&&rowMatch('workshop',r))add('workshop',r,r.start_time)});workshopTasks.forEach(r=>{if(type!=='workshop'||!rowMatch('workshopTask',r)||typeof workshopTaskRangeV120!=='function')return;let x=workshopTaskRangeV120(r);if(x&&x.start<=ds&&x.end>=ds)add('workshopTask',r)})}if(type==='all'&&['all','active'].includes(mainCalendarStatusFilterV123))(palaMeetings||[]).forEach(r=>{if(!r.cancelled&&r.start_date<=ds&&r.end_date>=ds)add('meeting',r,r.start_time)});let p={order:1,staffing:2,workshop:3,workshopTask:4,meeting:5};rows.sort((a,b)=>a.time.localeCompare(b.time)||(p[a.k]||9)-(p[b.k]||9)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0));return rows.map(r=>r.html).join('')||'<p class="calendar-empty">Ingen aktiviteter matcher filteret denne dag.</p>'}mainCalendarDayHtmlV120=dayHtml;
orderCard=function(b){let html=baseOrderCard(b),marker=`data-booking-status="${b.id}"`;if(!isAdminLoggedIn()||html.includes(marker))return html;let current=orderStatus(b),opts=['Forespørgsel','På lager','Ude','Afsluttet'],control=`<div class="job-quick-status" onclick="event.stopPropagation()"><label for="cardStatus${b.id}">Jobstatus</label><select id="cardStatus${b.id}" data-booking-status="${b.id}" onclick="event.stopPropagation()" onchange="event.stopPropagation();quickSetBookingStatus(${b.id},this.value)">${opts.map(v=>`<option value="${v}" ${current===v?'selected':''}>${v}</option>`).join('')}</select></div>`;return html.replace('<div class="job-actions',control+'<div class="job-actions')};
function months(){let a=[];for(let n=-36;n<=36;n++){let d=new Date(calDate.getFullYear(),calDate.getMonth()+n,1),value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,raw=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(d);a.push({value,label:raw.charAt(0).toUpperCase()+raw.slice(1)})}return a}
function counts(){let w=monthWindow(),orders=bookings.filter(r=>r.status!=='Annulleret'&&date(r.start_date)&&date(r.end_date)&&date(r.start_date)<=w.last&&date(r.end_date)>=w.first).length,staffing=staffingShifts.filter(r=>!leave(r)&&date(r.shift_date)>=w.first&&date(r.shift_date)<=w.last).length,under=staffingShifts.filter(r=>!leave(r)&&date(r.shift_date)>=w.first&&date(r.shift_date)<=w.last&&understaffed(r)).length,workshop=workshopJobs.filter(r=>r.status!=='Annulleret'&&date(r.start_date)<=w.last&&date(r.end_date)>=w.first).length+workshopTasks.filter(r=>{if(typeof workshopTaskRangeV120!=='function')return false;let x=workshopTaskRangeV120(r);return x&&x.start<=w.last&&x.end>=w.first}).length;return{orders,staffing,under,workshop}}
showCalendar=async function(){act('nc');history.replaceState(null,'',location.pathname);normalizeFilter();persist();let w=monthWindow(),g=gridWindow(),selected=staffDateString(calDate),value=`${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,'0')}`,raw=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(calDate),heading=raw.charAt(0).toUpperCase()+raw.slice(1),c=counts(),sr=statusRows(mainCalendarTypeFilterV120),sortRows=[['date_asc','Dato · ældste først'],['date_desc','Dato · nyeste først'],['name_asc','Navn · A–Å'],['name_desc','Navn · Å–A'],['type','Type'],['status','Status']];app.innerHTML=`<div class="card calendar-control-card calendar-controller-v150"><div class="calendar-toolbar-top"><div class="calendar-toolbar-title"><h2>${esc(heading)}</h2><div class="small muted">${calendarViewMode==='list'?'Hele den valgte måned':'Månedsoversigt'} · ${esc(fmtDateDa(w.first))} – ${esc(fmtDateDa(w.last))}</div></div><div class="view-switch"><button class="btn ${calendarViewMode==='calendar'?'active':''}" onclick="setCalendarView('calendar')">${uiIcon('calendar')} Kalender</button><button class="btn ${calendarViewMode==='list'?'active':''}" onclick="setCalendarView('list')">${uiIcon('list')} Liste</button></div></div><div class="calendar-nav-controls"><button class="btn calendar-nav-step" onclick="mv(-1)" aria-label="Vis forrige måned">${uiIcon('chevronLeft')} <span class="calendar-nav-label">1 måned</span></button><button class="btn calendar-today" onclick="goCalendarToday()">${uiIcon('calendar')} I dag</button><select class="compact-select calendar-month-select" onchange="jumpCalendarMonth(this.value)">${months().map(x=>`<option value="${x.value}" ${x.value===value?'selected':''}>${esc(x.label)}</option>`).join('')}</select><button class="btn calendar-nav-step" onclick="mv(1)" aria-label="Vis næste måned"><span class="calendar-nav-label">1 måned</span> ${uiIcon('chevronRight')}</button></div><div class="unified-calendar-tools-v123 calendar-tools-v150"><div class="unified-filter-grid-v123 calendar-filter-grid-v150"><label><span>Vis</span><select class="compact-select" onchange="setUnifiedCalendarTypeV123(this.value)"><option value="all" ${mainCalendarTypeFilterV120==='all'?'selected':''}>Alt</option><option value="orders" ${mainCalendarTypeFilterV120==='orders'?'selected':''}>Ordrer</option><option value="staffing" ${mainCalendarTypeFilterV120==='staffing'?'selected':''}>Bemanding</option><option value="workshop" ${mainCalendarTypeFilterV120==='workshop'?'selected':''}>Systue</option></select></label><label><span>Status</span><select class="compact-select" onchange="setUnifiedCalendarStatusV123(this.value)">${sr.map(([v,l])=>`<option value="${v}" ${mainCalendarStatusFilterV123===v?'selected':''}>${l}</option>`).join('')}</select></label>${calendarViewMode==='list'?`<label><span>Sortering</span><select class="compact-select" onchange="setCalendarSortV150(this.value)">${sortRows.map(([v,l])=>`<option value="${v}" ${calendarSortV150===v?'selected':''}>${l}</option>`).join('')}</select></label>`:''}</div><div class="unified-calendar-summary-v123"><button class="pill reference-button" onclick="setUnifiedCalendarTypeV123('orders')">${uiIcon('calendar')}${c.orders} ordrer</button><button class="pill reference-button ${c.under?'red':''}" onclick="setUnifiedCalendarTypeV123('staffing')">${uiIcon('people')}${c.staffing} vagter${c.under?` · ${c.under} mangler folk`:''}</button><button class="pill reference-button" onclick="setUnifiedCalendarTypeV123('workshop')">${uiIcon('scissors')}${c.workshop} systue</button></div><div class="unified-calendar-actions-v123">${typeof showStaffingExportDialog==='function'?`<button class="btn" onclick="showStaffingExportDialog()">${uiIcon('document')} Bemandingsplan PDF</button>`:''}${isAdminLoggedIn()&&typeof showProductionPlanExportDialog==='function'?`<button class="btn" onclick="showProductionPlanExportDialog()">${uiIcon('document')} Produktionsplan</button>`:''}</div></div></div>${calendarViewMode==='calendar'?`<div class="card calendar-grid-card"><div class="calendar-large-wrap"><div class="staff-calendar calendar-large">${sharedCalendarWeekdays()}${sharedCalendarCells(g.start,g.days,selected,'calendar')}</div></div><div class="small muted calendar-grid-caption">Viser hele måneden. Dage fra nabomåneder er med som overgang. Tryk på en aktivitet for detaljer.</div></div><div class="card calendar-day-detail-card"><div><div class="small muted">LISTEVISNING · HELE MÅNEDEN</div><h2 class="calendar-day-title">${esc(heading)}</h2></div><div class="calendar-detail-list">${monthDetailHtml()}</div></div>`:`<div class="card view-list"></div>`}`;if(calendarViewMode==='list')renderList();if(typeof ensureUnifiedNavV123==='function')ensureUnifiedNavV123();if(calendarViewMode==='calendar'&&typeof installCalendarSwipe==='function')setTimeout(()=>installCalendarSwipe('calendar'),0)};
if(!document.getElementById('pala-calendar-controller-v150-style')){let s=document.createElement('style');s.id='pala-calendar-controller-v150-style';s.textContent='.calendar-filter-grid-v150{grid-template-columns:repeat(2,minmax(0,1fr))}.calendar-filter-grid-v150 label{min-width:0}.calendar-filter-grid-v150 label select{width:100%}.calendar-list-flat-v150{margin:12px 0 18px}.calendar-list-meta-v150{font-size:11px;font-weight:800;color:#667085;letter-spacing:.02em;margin:0 0 6px 4px}.calendar-controller-v150 .calendar-month-select{min-width:170px}@media(min-width:700px){.calendar-filter-grid-v150:has(label:nth-child(3)){grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){.calendar-controller-v150 .calendar-nav-controls{display:grid;grid-template-columns:auto auto 1fr auto}.calendar-controller-v150 .calendar-month-select{min-width:0}.calendar-filter-grid-v150{grid-template-columns:1fr 1fr}.calendar-filter-grid-v150 label:nth-child(3){grid-column:1/-1}}';document.head.appendChild(s)}

/* PALA v151 · dense full-month list */
if(!document.getElementById('pala-calendar-list-v151-style')){
  let compact=document.createElement('style');
  compact.id='pala-calendar-list-v151-style';
  compact.textContent=`
  .view-list{gap:4px!important;padding:8px 10px!important;margin-top:10px!important;border-radius:14px!important;box-shadow:none!important}
  .view-list-group{padding-top:5px!important;margin:0!important}
  .view-list-group:first-child{padding-top:0!important}
  .view-list-date{font-size:12px!important;line-height:1.15!important;margin:0 0 3px!important;font-weight:700!important}
  .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{margin:2px 0!important;padding:6px 7px!important;border-radius:9px!important;box-shadow:none!important}
  .view-list .job-head,.view-list .workshop-task-head,.view-list .workshop-job-card>.row,.view-list .staff-card>.row{gap:5px!important;align-items:center!important}
  .view-list .job-title,.view-list .workshop-job-card h3,.view-list .workshop-task h3,.view-list .staff-card h3{font-size:13px!important;line-height:1.12!important;margin:0 0 2px!important;letter-spacing:0!important}
  .view-list .small,.view-list .job-date,.view-list .workshop-job-meta,.view-list .workshop-task-meta{font-size:9px!important;line-height:1.15!important}
  .view-list .job-date{gap:3px!important;margin:0!important}
  .view-list .job-date .ui-icon,.view-list .metric-chip .ui-icon,.view-list .btn .ui-icon,.view-list .reference-button .ui-icon{width:10px!important;height:10px!important}
  .view-list .job-status-col{gap:3px!important;min-width:0!important}
  .view-list .pill,.view-list .metric-chip,.view-list .workshop-status,.view-list .leader-badge,.view-list .leader-missing{font-size:8.5px!important;line-height:1.1!important;padding:2px 5px!important;border-radius:999px!important}
  .view-list .job-metrics{margin-top:4px!important;padding-top:4px!important;gap:3px!important}
  .view-list .job-actions{gap:3px!important;margin-top:4px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .view-list .btn{min-height:24px!important;padding:3px 6px!important;font-size:9px!important;line-height:1.1!important;border-radius:7px!important}
  .view-list .job-quick-status{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;margin:3px 0 0!important}
  .view-list .job-quick-status label{font-size:8.5px!important;margin:0!important;white-space:nowrap!important}
  .view-list .job-quick-status select{width:auto!important;min-width:96px!important;min-height:25px!important;padding:2px 22px 2px 6px!important;font-size:9.5px!important;border-radius:7px!important}
  .view-list .order-note{font-size:9px!important;line-height:1.15!important;margin:3px 0 0!important}
  .view-list .staff-people{gap:3px!important;margin:3px 0!important}
  .view-list .staff-person{font-size:8.5px!important;line-height:1.1!important;padding:2px 5px!important}
  .view-list .workshop-job-meta{gap:4px!important}
  .view-list .workshop-job-meta .reference-button,.view-list .reference-button{font-size:9px!important;line-height:1.1!important;padding:1px 0!important;min-height:0!important}
  .view-list .workshop-task p{font-size:9.5px!important;line-height:1.2!important;margin:3px 0!important}
  .view-list .workshop-task-meta{gap:4px!important;margin-top:4px!important}
  .calendar-list-flat-v150{margin:4px 0 7px!important}
  .calendar-list-meta-v150{font-size:8.5px!important;line-height:1.1!important;margin:0 0 2px 2px!important}
  @media(max-width:620px){
    .view-list{gap:3px!important;padding:6px 7px!important;border-radius:12px!important}
    .view-list-group{padding-top:4px!important}
    .view-list-date{font-size:11.5px!important;margin-bottom:2px!important}
    .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{padding:5px 6px!important;margin:2px 0!important}
    .view-list .job-title,.view-list .workshop-job-card h3,.view-list .workshop-task h3,.view-list .staff-card h3{font-size:12.5px!important}
    .view-list .job-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  }`;
  document.head.appendChild(compact);
}


/* PALA v152 · compact calendar day/list cards */
if(!document.getElementById('pala-calendar-compact-cards-v152')){
  let compactCards=document.createElement('style');
  compactCards.id='pala-calendar-compact-cards-v152';
  compactCards.textContent=`
  .calendar-day-detail-card{padding:10px 12px!important;margin-top:8px!important;border-radius:14px!important;box-shadow:none!important}
  .calendar-day-detail-card>.row,.calendar-day-detail-card>div:first-child{margin:0!important}
  .calendar-day-detail-card .calendar-day-title{font-size:22px!important;line-height:1.05!important;margin:1px 0 7px!important}
  .calendar-day-detail-card>div:first-child>.small{font-size:10px!important;line-height:1.1!important}
  .calendar-detail-list{gap:5px!important}

  .calendar-detail-list .job-card,.calendar-detail-list .staff-card,.calendar-detail-list .workshop-job-card,.calendar-detail-list .workshop-task,
  .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{
    margin:2px 0!important;padding:7px 8px!important;border-radius:9px!important;box-shadow:none!important;
  }
  .calendar-detail-list .job-head,.view-list .job-head{grid-template-columns:minmax(0,1fr) auto!important;gap:6px!important;align-items:center!important}
  .calendar-detail-list .job-title,.view-list .job-title,
  .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
  .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
  .calendar-detail-list .staff-card h3,.view-list .staff-card h3{
    font-size:14px!important;line-height:1.08!important;margin:0 0 2px!important;letter-spacing:0!important;
  }
  .calendar-detail-list .job-date,.view-list .job-date,
  .calendar-detail-list .small,.view-list .small,
  .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{
    font-size:9.5px!important;line-height:1.15!important;
  }
  .calendar-detail-list .job-date,.view-list .job-date{gap:3px!important;margin:0!important}
  .calendar-detail-list .job-date .ui-icon,.view-list .job-date .ui-icon,
  .calendar-detail-list .metric-chip .ui-icon,.view-list .metric-chip .ui-icon,
  .calendar-detail-list .btn .ui-icon,.view-list .btn .ui-icon{width:10px!important;height:10px!important}
  .calendar-detail-list .job-status-col,.view-list .job-status-col{gap:2px!important;min-width:0!important;align-items:flex-end!important}
  .calendar-detail-list .pill,.view-list .pill,
  .calendar-detail-list .metric-chip,.view-list .metric-chip,
  .calendar-detail-list .workshop-status,.view-list .workshop-status,
  .calendar-detail-list .leader-badge,.view-list .leader-badge,
  .calendar-detail-list .leader-missing,.view-list .leader-missing{
    font-size:9px!important;line-height:1.05!important;padding:2px 5px!important;border-radius:999px!important;
  }
  .calendar-detail-list .job-metrics,.view-list .job-metrics{
    display:flex!important;flex-wrap:wrap!important;margin-top:4px!important;padding-top:4px!important;gap:3px!important;
  }
  .calendar-detail-list .job-quick-status,.view-list .job-quick-status{
    display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:5px!important;margin:4px 0 0!important;
  }
  .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{
    font-size:9px!important;line-height:1!important;margin:0!important;white-space:nowrap!important;
  }
  .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{
    width:auto!important;min-width:92px!important;min-height:28px!important;height:28px!important;padding:2px 24px 2px 7px!important;font-size:11px!important;line-height:1!important;border-radius:7px!important;
  }
  .calendar-detail-list .job-actions,.view-list .job-actions{
    display:flex!important;flex-wrap:wrap!important;gap:4px!important;margin-top:5px!important;justify-content:flex-start!important;
  }
  .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
  .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
  .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
  .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{
    width:auto!important;min-width:0!important;min-height:29px!important;padding:5px 9px!important;font-size:10.5px!important;line-height:1.05!important;border-radius:8px!important;box-shadow:none!important;
  }
  .calendar-detail-list .job-actions .btn.primary,.view-list .job-actions .btn.primary{flex:0 0 auto!important}
  .calendar-detail-list .order-note,.view-list .order-note{font-size:9px!important;line-height:1.15!important;margin:3px 0 0!important}
  .calendar-detail-list .staff-people,.view-list .staff-people{gap:3px!important;margin:3px 0!important}
  .calendar-detail-list .staff-person,.view-list .staff-person{font-size:8.5px!important;padding:2px 5px!important}
  .calendar-detail-list .workshop-task p,.view-list .workshop-task p{font-size:9.5px!important;line-height:1.15!important;margin:3px 0!important}
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{gap:3px!important;margin-top:3px!important}

  @media(max-width:620px){
    .calendar-day-detail-card{padding:8px 9px!important;border-radius:12px!important}
    .calendar-day-detail-card .calendar-day-title{font-size:19px!important;margin-bottom:5px!important}
    .calendar-detail-list{gap:3px!important}
    .calendar-detail-list .job-card,.calendar-detail-list .staff-card,.calendar-detail-list .workshop-job-card,.calendar-detail-list .workshop-task,
    .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{padding:6px 7px!important;margin:1px 0!important}
    .calendar-detail-list .job-title,.view-list .job-title,
    .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
    .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
    .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:13px!important}
    .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn{min-height:28px!important;padding:4px 8px!important;font-size:10px!important}
  }`;
  document.head.appendChild(compactCards);
}


/* PALA v153 · compact calendar readability */
if(!document.getElementById('pala-calendar-readability-v153')){
  let readable=document.createElement('style');
  readable.id='pala-calendar-readability-v153';
  readable.textContent=`
  .calendar-detail-list .job-title,.view-list .job-title,
  .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
  .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
  .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:15px!important;font-weight:700!important;line-height:1.12!important;color:#17213a!important}
  .calendar-detail-list .job-date,.view-list .job-date{font-size:11px!important;font-weight:500!important;color:#536077!important}
  .calendar-detail-list .small,.view-list .small,
  .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{font-size:10.5px!important;line-height:1.2!important;color:#5b667a!important}
  .calendar-detail-list .pill,.view-list .pill,
  .calendar-detail-list .metric-chip,.view-list .metric-chip,
  .calendar-detail-list .workshop-status,.view-list .workshop-status,
  .calendar-detail-list .leader-badge,.view-list .leader-badge,
  .calendar-detail-list .leader-missing,.view-list .leader-missing{font-size:10px!important;font-weight:650!important;line-height:1.08!important}
  .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{font-size:10px!important;font-weight:650!important;color:#566176!important}
  .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{font-size:12px!important;font-weight:550!important;color:#26334b!important}
  .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
  .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
  .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
  .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{font-size:11px!important;font-weight:650!important}
  .calendar-detail-list .order-note,.view-list .order-note{font-size:10px!important;color:#5b667a!important}
  .calendar-detail-list .staff-person,.view-list .staff-person{font-size:9.5px!important;font-weight:550!important}
  .calendar-detail-list .workshop-task p,.view-list .workshop-task p{font-size:10.5px!important;line-height:1.2!important;color:#39465d!important}
  @media(max-width:620px){
    .calendar-detail-list .job-title,.view-list .job-title,
    .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
    .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
    .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:14.5px!important}
    .calendar-detail-list .job-date,.view-list .job-date{font-size:10.5px!important}
    .calendar-detail-list .small,.view-list .small,
    .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
    .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{font-size:10px!important}
    .calendar-detail-list .pill,.view-list .pill,.calendar-detail-list .metric-chip,.view-list .metric-chip{font-size:9.75px!important}
  }`;
  document.head.appendChild(readable);
}


/* PALA v154 · readable compact mobile cards */
if(!document.getElementById('pala-calendar-readability-v154')){
  let readable=document.createElement('style');
  readable.id='pala-calendar-readability-v154';
  readable.textContent=`
  /* Keep the compact card geometry from v152, but restore comfortable phone typography. */
  .calendar-detail-list .job-title,.view-list .job-title,
  .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
  .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
  .calendar-detail-list .staff-card h3,.view-list .staff-card h3{
    font-size:17px!important;font-weight:700!important;line-height:1.12!important;color:#17213a!important;
  }
  .calendar-detail-list .job-date,.view-list .job-date{
    font-size:12.5px!important;font-weight:500!important;line-height:1.15!important;color:#4e5c72!important;
  }
  .calendar-detail-list .job-date .ui-icon,.view-list .job-date .ui-icon,
  .calendar-detail-list .metric-chip .ui-icon,.view-list .metric-chip .ui-icon,
  .calendar-detail-list .btn .ui-icon,.view-list .btn .ui-icon{
    width:12px!important;height:12px!important;
  }
  .calendar-detail-list .small,.view-list .small,
  .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{
    font-size:11.5px!important;line-height:1.18!important;color:#556278!important;
  }
  .calendar-detail-list .pill,.view-list .pill,
  .calendar-detail-list .metric-chip,.view-list .metric-chip,
  .calendar-detail-list .workshop-status,.view-list .workshop-status,
  .calendar-detail-list .leader-badge,.view-list .leader-badge,
  .calendar-detail-list .leader-missing,.view-list .leader-missing{
    font-size:11.5px!important;font-weight:650!important;line-height:1.08!important;
  }
  .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{
    font-size:11.5px!important;font-weight:650!important;line-height:1!important;color:#536077!important;
  }
  .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{
    font-size:13.5px!important;font-weight:550!important;line-height:1!important;color:#253249!important;
  }
  .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
  .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
  .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
  .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{
    font-size:13px!important;font-weight:650!important;line-height:1.05!important;
  }
  .calendar-detail-list .order-note,.view-list .order-note{
    font-size:11px!important;line-height:1.15!important;color:#556278!important;
  }
  .calendar-detail-list .staff-person,.view-list .staff-person{
    font-size:10.5px!important;font-weight:550!important;
  }
  .calendar-detail-list .workshop-task p,.view-list .workshop-task p{
    font-size:11.5px!important;line-height:1.18!important;color:#39465d!important;
  }
  .calendar-list-meta-v150{font-size:10.5px!important;font-weight:650!important;color:#5b667a!important}
  @media(max-width:620px){
    .calendar-detail-list .job-title,.view-list .job-title,
    .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
    .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
    .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:16px!important}
    .calendar-detail-list .job-date,.view-list .job-date{font-size:12px!important}
    .calendar-detail-list .small,.view-list .small,
    .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
    .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{font-size:11px!important}
    .calendar-detail-list .pill,.view-list .pill,
    .calendar-detail-list .metric-chip,.view-list .metric-chip,
    .calendar-detail-list .workshop-status,.view-list .workshop-status{font-size:11px!important}
    .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{font-size:11px!important}
    .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{font-size:13px!important}
    .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
    .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
    .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
    .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{font-size:12.5px!important}
  }`;
  document.head.appendChild(readable);
}


/* PALA v155 · status and pack action on one row */
const orderCardV155Base = orderCard;
orderCard = function(booking){
  let html = orderCardV155Base(booking);
  return html.replace(
    /(<div class="job-quick-status"[\s\S]*?<\/div>)(<div class="job-actions[^\"]*"[\s\S]*?<\/div>)/,
    '<div class="job-status-action-row">$1$2</div>'
  );
};

/* PALA v158 · no pack/return on completed orders */
const orderCardV158Base = orderCard;
orderCard = function(booking){
  let html = orderCardV158Base(booking);
  if(orderStatus(booking)!=='Afsluttet')return html;
  return html.replace(/<div class=\"job-actions[^\"]*\"[\s\S]*?<\/div>/,'');
};

if(!document.getElementById('pala-calendar-status-row-v155')){
  let rowStyle=document.createElement('style');
  rowStyle.id='pala-calendar-status-row-v155';
  rowStyle.textContent=`
  .calendar-detail-list .job-status-action-row,.view-list .job-status-action-row{
    display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-top:5px!important;
  }
  .calendar-detail-list .job-status-action-row .job-quick-status,.view-list .job-status-action-row .job-quick-status{
    flex:1 1 auto!important;min-width:0!important;margin:0!important;justify-content:flex-start!important;
  }
  .calendar-detail-list .job-status-action-row .job-actions,.view-list .job-status-action-row .job-actions{
    flex:0 0 auto!important;display:flex!important;margin:0!important;padding:0!important;align-items:center!important;
  }
  .calendar-detail-list .job-status-action-row .job-actions .btn,.view-list .job-status-action-row .job-actions .btn{
    margin:0!important;white-space:nowrap!important;
  }
  @media(max-width:620px){
    .calendar-detail-list .job-status-action-row,.view-list .job-status-action-row{gap:6px!important;margin-top:4px!important}
    .calendar-detail-list .job-status-action-row .job-quick-status,.view-list .job-status-action-row .job-quick-status{gap:5px!important}
    .calendar-detail-list .job-status-action-row .job-quick-status select,.view-list .job-status-action-row .job-quick-status select{
      min-width:108px!important;width:auto!important;
    }
    .calendar-detail-list .job-status-action-row .job-actions .btn,.view-list .job-status-action-row .job-actions .btn{
      min-height:32px!important;padding:5px 9px!important;
    }
  }`;
  document.head.appendChild(rowStyle);
}


/* PALA v160 · calendar summary is always exactly one line */
if(!document.getElementById('pala-calendar-summary-single-line-v160')){
  let summaryStyle=document.createElement('style');
  summaryStyle.id='pala-calendar-summary-single-line-v160';
  summaryStyle.textContent=`
  .unified-calendar-summary-v123{
    display:flex!important;
    flex-wrap:nowrap!important;
    align-items:center!important;
    gap:4px!important;
    min-width:0!important;
    white-space:nowrap!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    scrollbar-width:none!important;
    -webkit-overflow-scrolling:touch;
  }
  .unified-calendar-summary-v123::-webkit-scrollbar{display:none!important}
  .unified-calendar-summary-v123 .reference-button,
  .unified-calendar-summary-v123 .pill{
    flex:0 1 auto!important;
    min-width:0!important;
    width:auto!important;
    white-space:nowrap!important;
    margin:0!important;
    padding-left:2px!important;
    padding-right:2px!important;
  }
  @media(max-width:620px){
    .unified-calendar-summary-v123{gap:2px!important}
    .unified-calendar-summary-v123 .reference-button,
    .unified-calendar-summary-v123 .pill{
      font-size:clamp(10px,2.75vw,12px)!important;
      letter-spacing:-.02em!important;
      gap:2px!important;
      padding-left:1px!important;
      padding-right:1px!important;
    }
    .unified-calendar-summary-v123 .ui-icon{
      width:10px!important;
      height:10px!important;
      flex:0 0 10px!important;
    }
  }`;
  document.head.appendChild(summaryStyle);
}

})();
