/* PALA v365 · compact leave cards + reliable calendar-list click path.
   Month list rendering is owned exclusively by calendar-list-month-scope.js. */
(()=>{
'use strict';
if(window.__palaCalendarListDefaultsV365)return;
window.__palaCalendarListDefaultsV365=true;

function calendarLeaveCardV315(row){
  const leave=typeof staffLeaveInfo==='function'?staffLeaveInfo(row):null;
  if(!leave)return staffShiftCard(row);
  const person=leave.employee?.name||'Medarbejder';
  const type=String(leave.type||'Ude').trim();
  const sameDay=leave.start===leave.end;
  const dateText=sameDay?fmtDateDa(leave.start):`${fmtDateDa(leave.start)} – ${fmtDateDa(leave.end)}`;
  return `<article class="staff-card staff-leave-card calendar-leave-card-v315">
    <div class="calendar-leave-type-v315">${esc(type)}</div>
    <h3>${esc(person)}</h3>
    <div class="calendar-leave-date-v315">${esc(dateText)}</div>
  </article>`;
}
window.calendarLeaveCardV315=calendarLeaveCardV315;

/* Reliable click path for the calendar list.
   Keep native form controls native. For buttons/cards/links that already carry
   PALA's original inline onclick handler, execute that original handler exactly once. */
const appRoot=document.getElementById('app');
if(appRoot&&!window.__palaCalendarListClickFallbackV304){
  window.__palaCalendarListClickFallbackV304=true;
  appRoot.addEventListener('click',event=>{
    const host=event.target?.closest?.('.calendar-detail-list,.view-list');
    if(!host)return;
    if(event.target?.closest?.('select,input,textarea,option,label'))return;

    const action=event.target?.closest?.('[onclick]');
    if(!action||!host.contains(action))return;
    const handler=action.onclick;
    if(typeof handler!=='function')return;

    event.preventDefault();
    event.stopImmediatePropagation();
    handler.call(action,event);
  },true);
}
})();