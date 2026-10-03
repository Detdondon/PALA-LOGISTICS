/* PALA v352 · isolated compact card renderer for "Anden opgave". */
(()=>{
'use strict';
if(window.__palaTaskCardV352||typeof window.meetingCard!=='function')return;
window.__palaTaskCardV352=true;

const baseMeetingCardV352=window.meetingCard;
window.meetingCard=function(item){
  if(item?.kind!=='task')return baseMeetingCardV352(item);
  const employeeIds=Array.isArray(item?.employee_ids)?item.employee_ids.map(Number).filter(Boolean):[];
  const people=employeeIds.map(id=>typeof staffEmployee==='function'?staffEmployee(id)?.name:'').filter(Boolean).join(', ');
  const color=item?.color||'#7A6FB8';
  return `<article class="meeting-card calendar-task-card-v352" style="--meeting-color:${esc(color)}">
    <button type="button" class="calendar-task-open-v352" onclick="openMeeting(${item.id})">
      <span class="calendar-task-type-v352">ANDEN OPGAVE</span>
      <h3 class="calendar-task-title-v352">${esc(item.title||'Anden opgave')}</h3>
      <div class="calendar-task-range-v352">${esc(meetingRange(item))}</div>
      ${item.notes?`<div class="calendar-task-description-v352">${esc(item.notes)}</div>`:''}
      ${item.address?`<div class="calendar-task-meta-v352">${uiIcon('map')}<span>${esc(item.address)}</span></div>`:''}
      ${people?`<div class="calendar-task-meta-v352">${uiIcon('people')}<span>${esc(people)}</span></div>`:''}
    </button>
  </article>`;
};
})();
