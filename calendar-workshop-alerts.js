/* PALA v195 · workshop damage alerts and list priority */
(()=>{
'use strict';
if(window.__palaCalendarWorkshopAlertsV195)return;
window.__palaCalendarWorkshopAlertsV195=true;

const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function monthWindow(){
  const source=(typeof calDate!=='undefined'&&calDate instanceof Date)?calDate:new Date();
  return{
    first:isoDate(new Date(source.getFullYear(),source.getMonth(),1)),
    last:isoDate(new Date(source.getFullYear(),source.getMonth()+1,0))
  };
}
function openWorkshopDamages(){
  if(!Array.isArray(window.workshopTasks)&&typeof workshopTasks==='undefined')return[];
  const tasks=typeof workshopTasks!=='undefined'&&Array.isArray(workshopTasks)?workshopTasks:window.workshopTasks;
  const w=monthWindow();
  return tasks.filter(task=>{
    if(!task||task.status==='completed')return false;
    if(typeof workshopTaskRangeV120!=='function')return true;
    const range=workshopTaskRangeV120(task);
    return !!range&&range.start<=w.last&&range.end>=w.first;
  });
}
function markWorkshopSummary(){
  const button=document.querySelector('.unified-calendar-summary-v123 .reference-button[onclick*="setUnifiedCalendarTypeV123(\'workshop\')"]');
  if(!button)return;
  button.querySelector('.workshop-open-damage-count-v195')?.remove();
  const count=openWorkshopDamages().length;
  button.classList.toggle('red',count>0);
  if(count>0){
    const note=document.createElement('span');
    note.className='workshop-open-damage-count-v195';
    note.textContent=` · ${count} ${count===1?'åben skade':'åbne skader'}`;
    button.appendChild(note);
    button.title=`${count} ${count===1?'uafsluttet skade':'uafsluttede skader'} i systuen`;
  }else if(button.title?.includes('uafsluttet'))button.removeAttribute('title');
}
function pinOpenDamagesFirst(){
  if(typeof mainCalendarTypeFilterV120==='undefined'||mainCalendarTypeFilterV120!=='workshop')return;
  document.querySelectorAll('.workshop-open-pinned-v159').forEach(section=>{
    const host=section.parentElement;
    if(host&&host.firstElementChild!==section)host.prepend(section);
  });
}
function applyWorkshopAlerts(){
  markWorkshopSummary();
  pinOpenDamagesFirst();
}

const baseShowCalendar=window.showCalendar;
if(typeof baseShowCalendar==='function'){
  window.showCalendar=async function(){
    const result=await baseShowCalendar.apply(this,arguments);
    applyWorkshopAlerts();
    return result;
  };
}

queueMicrotask(applyWorkshopAlerts);
})();
