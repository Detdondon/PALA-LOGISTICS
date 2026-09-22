/* PALA v304 · meetings + assignable other tasks in the shared calendar. */
(()=>{
'use strict';
if(window.__palaCalendarOtherTasksV304)return;
window.__palaCalendarOtherTasksV304=true;

const calendarItemKind=item=>item?.kind==='task'?'task':'meeting';
const taskEmployees=item=>(item?.employee_ids||[]).map(Number);
const taskPeopleText=item=>taskEmployees(item).map(id=>staffEmployee(id)?.name).filter(Boolean).join(', ');

const baseMeetingCardV304=window.meetingCard;
window.meetingCard=function(item){
  if(calendarItemKind(item)!=='task')return baseMeetingCardV304(item);
  const people=taskPeopleText(item);
  return `<article class="meeting-card calendar-task-card-v304" style="--meeting-color:${esc(item.color||'#7A6FB8')}"><button class="meeting-open" onclick="openMeeting(${item.id})"><span class="small muted">ANDEN OPGAVE</span><h3>${esc(item.title)}</h3><p>${esc(meetingRange(item))}</p>${item.notes?`<span class="small calendar-task-description-v304">${esc(item.notes)}</span>`:''}${item.address?`<span class="small">${uiIcon('map')} ${esc(item.address)}</span>`:''}${people?`<span class="small">${uiIcon('people')} ${esc(people)}</span>`:''}</button></article>`;
};

const baseEditMeetingV304=window.editMeeting;
window.editMeeting=function(id,requestedKind='meeting'){
  const existing=(palaMeetings||[]).find(item=>+item.id===+id)||null;
  const kind=existing?calendarItemKind(existing):(requestedKind==='task'?'task':'meeting');
  if(kind!=='task')return baseEditMeetingV304(id);

  if(!requireAdmin())return;
  const item=existing||{};
  const date=staffDateString(calDate);
  const selected=new Set(taskEmployees(item));
  const people=employees
    .filter(employee=>employee.active!==false)
    .sort((a,b)=>alpha(a.name,b.name))
    .map(employee=>`<label><input class="calendar-task-person-v304" type="checkbox" value="${employee.id}" ${selected.has(+employee.id)?'checked':''}>${esc(employee.name)}</label>`)
    .join('');

  openEditSheet(
    id?'Redigér anden opgave':'Opret anden opgave',
    `${sheetField('title','Opgavens titel',item.title,'text','required')}
      ${sheetField('start_date','Dato',item.start_date||date,'date','required')}
      <div class="two">${sheetField('start_time','Fra kl.',staffTime(item.start_time),'time')}${sheetField('end_time','Til kl.',staffTime(item.end_time),'time')}</div>
      ${sheetField('address','Lokation',item.address)}
      ${sheetText('notes','Kort beskrivelse',item.notes)}
      ${calendarColorField('meetingColor',item.color||'#7A6FB8')}
      <details class="sheet-group" open>
        <summary>Tildelte medarbejdere</summary>
        <input type="search" aria-label="Søg medarbejdere til opgaven" placeholder="Søg medarbejder" oninput="filterSheetChecks(this)">
        <div class="sheet-checks">${people}</div>
      </details>
      ${id?`<label class="sheet-checkbox"><input id="s_cancelled" type="checkbox" ${item.cancelled?'checked':''}> Annullér opgaven (bevar oplysningerne)</label>`:''}`,
    async()=>{
      const startDate=sheetValue('start_date');
      const startTime=sheetValue('start_time');
      const endTime=sheetValue('end_time');
      if(startTime&&endTime&&endTime<=startTime)throw new Error('Sluttid skal være efter starttid');
      const data={
        kind:'task',
        title:sheetValue('title'),
        start_date:startDate,
        end_date:startDate,
        start_time:startTime,
        end_time:endTime,
        customer_name:'',
        address:sheetValue('address'),
        notes:sheetValue('notes'),
        employee_ids:[...document.querySelectorAll('.calendar-task-person-v304:checked')].map(input=>+input.value),
        color:document.getElementById('meetingColor').value,
        cancelled:!!document.getElementById('s_cancelled')?.checked
      };
      const itemId=await checkedRpc('admin_save_meeting',{p_token:adminToken,p_id:id||null,p_data:data});
      await loadWarehouseExtensions();
      openMeeting(itemId);
    },
    id?'Gem opgave':'Opret opgave'
  );
};

const baseOpenMeetingV304=window.openMeeting;
window.openMeeting=function(id){
  const item=(palaMeetings||[]).find(row=>+row.id===+id);
  if(!item||calendarItemKind(item)!=='task')return baseOpenMeetingV304(id);
  if(!requireEmployee())return;

  const people=taskEmployees(item).map(employeeId=>`<span class="staff-person">${esc(staffEmployee(employeeId)?.name||'Medarbejder')}</span>`).join('');
  act('nc');
  history.replaceState(null,'',appItemLink('meeting',id));
  app.innerHTML=`<section class="card">
    <div class="row">
      <button class="btn submenu-back" onclick="showCalendar()">${uiIcon('chevronLeft')} Tilbage</button>
      ${isAdminLoggedIn()?`<button class="btn" onclick="editMeeting(${id},'task')">${uiIcon('edit')} Redigér opgave</button>`:''}
    </div>
    <span class="small muted">${item.cancelled?'ANNULLERET OPGAVE':'ANDEN OPGAVE'}</span>
    <h2>${esc(item.title)}</h2>
    <p>${esc(meetingRange(item))}</p>
    <div class="meeting-color-tag"><span class="color-square" style="background:${esc(item.color||'#7A6FB8')}"></span>Kalenderfarve</div>
  </section>
  ${item.notes?`<section class="card"><h3>Beskrivelse</h3><p style="white-space:pre-wrap">${esc(item.notes)}</p></section>`:''}
  <section class="card"><h3>Tildelte medarbejdere</h3><div class="staff-people">${people}</div>${people?'':'<p class="muted">Ingen medarbejdere er tildelt.</p>'}</section>
  ${item.address?`<section class="card"><h3>Lokation</h3><p>${esc(item.address)}</p><a class="btn" href="${esc(googleMapsLink(item.address))}" target="_blank" rel="noopener noreferrer">${uiIcon('map')} Åbn Google Maps</a></section>`:''}`;
};

const baseCalendarSegmentButtonV304=window.calendarSegmentButton;
window.calendarSegmentButton=function(segment,ds,mode){
  const item=segment?.item;
  if(calendarItemKind(item)!=='task')return baseCalendarSegmentButtonV304(segment,ds,mode);
  const color=item.color||'#7A6FB8';
  return `<button class="calendar-job-chip calendar-span ${segment.continuesLeft?'continues-left':''} ${segment.continuesRight?'continues-right':''}" style="--job-color:${esc(color)};--job-text:${esc(textOnColor(color))}" onclick="event.stopPropagation();openMeeting(${item.id})" title="${esc('Anden opgave · '+item.title+' · '+meetingRange(item))}"><span class="calendar-label ${segment.showLabel?'':'continuation'}">${esc((item.start_time?staffTime(item.start_time)+' ':'')+item.title)}</span></button>`;
};

const baseCreateMenuHtmlV304=window.createMenuHtmlV123;
window.createMenuHtmlV123=function(){
  let html=baseCreateMenuHtmlV304();
  if(!isAdminLoggedIn())return html;
  const button=`<button onclick="runCreateActionV123('task')">${uiIcon('check')}<span><b>Anden opgave</b><small>Tildel medarbejdere i kalenderen</small></span></button>`;
  const marker='<div class="create-menu-section-v123"><small>LAGER</small>';
  return html.includes(marker)?html.replace(marker,button+marker):html;
};

const baseRunCreateActionV304=window.runCreateActionV123;
window.runCreateActionV123=function(action){
  if(action!=='task')return baseRunCreateActionV304(action);
  closeCreateMenuV123();
  if(!isAdminLoggedIn())return alert('Adminfunktion skal være aktiv for denne handling.');
  return editMeeting(null,'task');
};
})();
