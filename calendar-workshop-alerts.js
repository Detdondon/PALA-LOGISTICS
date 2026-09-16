/* PALA v196 · open workshop damages stay active until completed */
(()=>{
'use strict';
if(window.__palaCalendarWorkshopAlertsV196)return;
window.__palaCalendarWorkshopAlertsV196=true;

function allOpenWorkshopDamages(){
  const tasks=(typeof workshopTasks!=='undefined'&&Array.isArray(workshopTasks))
    ?workshopTasks
    :(Array.isArray(window.workshopTasks)?window.workshopTasks:[]);
  return tasks
    .filter(task=>task&&task.status!=='completed')
    .sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||(+b.id||0)-(+a.id||0));
}

function markWorkshopSummary(){
  const button=document.querySelector('.unified-calendar-summary-v123 .reference-button[onclick*="setUnifiedCalendarTypeV123(\'workshop\')"]');
  if(!button)return;
  button.querySelector('.workshop-open-damage-count-v196')?.remove();
  button.querySelector('.workshop-open-damage-count-v195')?.remove();
  const count=allOpenWorkshopDamages().length;
  button.classList.toggle('red',count>0);
  if(count>0){
    const note=document.createElement('span');
    note.className='workshop-open-damage-count-v196';
    note.textContent=` · ${count} ${count===1?'åben skade':'åbne skader'}`;
    button.appendChild(note);
    button.title=`${count} ${count===1?'uafsluttet skade':'uafsluttede skader'} i systuen`;
  }else if(button.title?.includes('uafsluttet')){
    button.removeAttribute('title');
  }
}

function taskCard(task){
  if(typeof workshopTaskCard==='function')return workshopTaskCard(task);
  const escape=value=>typeof esc==='function'?esc(value):String(value??'');
  const tent=typeof tents!=='undefined'?tents?.[+task.tent_id]:null;
  return `<section class="card workshop-task"><div class="small muted">SKADE TIL SYSTUEN</div><h3>${escape(task.tent_name||tent?.name||'Telt')}</h3><p>${escape(task.description||'')}</p></section>`;
}

function clearEmptyMessage(host){
  [...host.children].forEach(child=>{
    if(child.tagName!=='P')return;
    const txt=String(child.textContent||'');
    if(txt.includes('Ingen aktiviteter matcher'))child.remove();
  });
}

function ensureOpenDamageSection(){
  if(typeof mainCalendarTypeFilterV120==='undefined'||mainCalendarTypeFilterV120!=='workshop')return;
  if(typeof mainCalendarStatusFilterV123!=='undefined'&&mainCalendarStatusFilterV123==='completed')return;

  const host=(typeof calendarViewMode!=='undefined'&&calendarViewMode==='list')
    ?document.querySelector('.view-list')
    :document.querySelector('.calendar-detail-list');
  if(!host)return;

  const tasks=allOpenWorkshopDamages();
  host.querySelector('.workshop-open-pinned-v159')?.remove();
  host.querySelector('.workshop-open-pinned-v196')?.remove();
  if(!tasks.length)return;

  clearEmptyMessage(host);
  const section=document.createElement('section');
  section.className='view-list-group workshop-open-pinned-v159 workshop-open-pinned-v196';
  section.innerHTML=`<h3 class="view-list-date">Åbne skader</h3>${tasks.map(taskCard).join('')}`;
  host.prepend(section);
}

function applyWorkshopAlerts(){
  markWorkshopSummary();
  ensureOpenDamageSection();
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
