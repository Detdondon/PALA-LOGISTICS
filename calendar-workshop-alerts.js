/* PALA v297 · workshop alerts respect selected-date calendar detail filtering */
(()=>{
'use strict';
if(window.__palaCalendarWorkshopAlertsV297)return;
window.__palaCalendarWorkshopAlertsV297=true;

function allOpenWorkshopDamages(){
  const tasks=(typeof workshopTasks!=='undefined'&&Array.isArray(workshopTasks))
    ?workshopTasks
    :(Array.isArray(window.workshopTasks)?window.workshopTasks:[]);
  return tasks
    .filter(task=>task&&task.status!=='completed')
    .sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||(+b.id||0)-(+a.id||0));
}

function clearLegacyOpenDamageText(node){
  if(!node)return;
  const current=String(node.textContent||'').trim();
  const cleaned=current
    .replace(/\s*·\s*\d+\s+åben skade\s*$/i,'')
    .replace(/\s*·\s*\d+\s+åbne skader\s*$/i,'')
    .trim();
  if(cleaned!==current)node.textContent=cleaned;
}

function markWorkshopSummary(){
  const button=document.querySelector('.unified-calendar-summary-v123 .reference-button[onclick*="setUnifiedCalendarTypeV123(\'workshop\')"]');
  if(!button)return;
  clearLegacyOpenDamageText(button);
  const count=allOpenWorkshopDamages().length;
  button.classList.toggle('red',count>0);
  if(count>0)button.title=`${count} ${count===1?'uafsluttet skade':'uafsluttede skader'} i systuen`;
  else if(button.title?.includes('uafsluttet'))button.removeAttribute('title');
}

function removeLegacyCountNodes(bar){
  bar.querySelectorAll([
    '.workshop-open-damage-separator-v198',
    '.workshop-open-damage-inline-v198',
    '.workshop-open-damage-separator-v199',
    '.workshop-open-damage-inline-v199'
  ].join(',')).forEach(node=>node.remove());
}

function markCalendarCountBar(){
  const bar=document.querySelector('.calendar-count-summary-v174');
  if(!bar)return;

  // Open workshop damages are already pinned in the list below the calendar.
  // Keep the compact info line limited to orders, staffing and workshop counts.
  removeLegacyCountNodes(bar);
  bar.querySelectorAll(
    '.workshop-open-damage-separator-v201,.workshop-open-damage-inline-v201'
  ).forEach(node=>node.remove());

  const items=[...bar.querySelectorAll('.calendar-count-item-v174')];
  const workshopItem=items.find(node=>/\bsystue\b/i.test(String(node.textContent||'')));
  if(workshopItem)clearLegacyOpenDamageText(workshopItem);

  // Remove any stale damage item left by an older cached runtime.
  [...bar.querySelectorAll('.calendar-count-item-v174')].forEach(node=>{
    const label=String(node.textContent||'');
    if(!/åbn(?:e)?\s+skad(?:e|er)/i.test(label)||/\bsystue\b/i.test(label))return;
    const previous=node.previousElementSibling;
    node.remove();
    if(previous?.classList?.contains('calendar-count-separator-v174'))previous.remove();
  });
}
function taskCard(task){
  if(typeof workshopTaskCard==='function')return workshopTaskCard(task);
  const escape=value=>typeof esc==='function'?esc(value):String(value??'');
  const tent=typeof tents!=='undefined'?tents?.[+task.tent_id]:null;
  return `<section class="card workshop-task"><div class="small muted">SKADE TIL SYSTUEN</div><h3>${escape(task.tent_name||tent?.name||'Telt')}</h3><p>${escape(task.description||'')}</p></section>`;
}

function clearEmptyMessage(host){
  [...host.children].forEach(child=>{
    if(child.tagName==='P'&&String(child.textContent||'').includes('Ingen aktiviteter matcher'))child.remove();
  });
}

function ensureOpenDamageSection(){
  const isWorkshop=typeof mainCalendarTypeFilterV120!=='undefined'&&mainCalendarTypeFilterV120==='workshop';
  const completed=typeof mainCalendarStatusFilterV123!=='undefined'&&mainCalendarStatusFilterV123==='completed';
  const listMode=typeof calendarViewMode!=='undefined'&&calendarViewMode==='list';
  const host=listMode?document.querySelector('.view-list'):document.querySelector('.calendar-detail-list');
  if(!host)return;
  /* In calendar list mode, open damages are rendered by their actual date/range.
     Never prepend an undated section that can contain items before the selected date. */
  if(listMode){
    host.querySelector('.workshop-open-pinned-v201')?.remove();
    return;
  }

  let section=host.querySelector('.workshop-open-pinned-v201');
  if(!isWorkshop||completed){section?.remove();return}

  const first=typeof calDate!=='undefined'&&typeof staffDateString==='function'?staffDateString(calDate):'';
  const tasks=allOpenWorkshopDamages().filter(task=>{
    if(!first||typeof workshopTaskRangeV120!=='function')return true;
    const range=workshopTaskRangeV120(task);
    return !!(range&&range.end>=first);
  });
  if(!tasks.length){section?.remove();return}
  clearEmptyMessage(host);

  host.querySelectorAll('.workshop-open-pinned-v159:not(.workshop-open-pinned-v201),.workshop-open-pinned-v196,.workshop-open-pinned-v197,.workshop-open-pinned-v198,.workshop-open-pinned-v199').forEach(node=>node.remove());

  const signature=tasks.map(task=>`${task.id}:${task.updated_at||task.created_at||''}:${task.status||''}`).join('|');
  if(!section){
    section=document.createElement('section');
    section.className='view-list-group workshop-open-pinned-v159 workshop-open-pinned-v201';
    section.dataset.signature='';
  }
  if(section.dataset.signature!==signature){
    section.dataset.signature=signature;
    section.innerHTML=`<h3 class="view-list-date workshop-open-title-v201">Åbne skader</h3>${tasks.map(taskCard).join('')}`;
  }
  if(host.firstElementChild!==section)host.prepend(section);
}

function applyWorkshopAlerts(){
  markWorkshopSummary();
  ensureOpenDamageSection();
  markCalendarCountBar();
}

function scheduleWorkshopAlerts(){requestAnimationFrame(()=>requestAnimationFrame(applyWorkshopAlerts))}

if(!document.getElementById('pala-workshop-alerts-v201-style')){
  const style=document.createElement('style');
  style.id='pala-workshop-alerts-v201-style';
  style.textContent=`
    .workshop-open-title-v201,
    .workshop-open-damage-inline-v201,
    .workshop-open-damage-label-v201{color:#a12a2a!important;font-weight:800!important}
  `;
  document.head.appendChild(style);
}

const baseShowCalendar=window.showCalendar;
if(typeof baseShowCalendar==='function'){
  window.showCalendar=async function(){
    const result=await baseShowCalendar.apply(this,arguments);
    applyWorkshopAlerts();
    scheduleWorkshopAlerts();
    return result;
  };
}

const appRoot=document.getElementById('app');
if(appRoot){
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;applyWorkshopAlerts()});
  }).observe(appRoot,{childList:true,subtree:true});
}

queueMicrotask(()=>{applyWorkshopAlerts();scheduleWorkshopAlerts()});
})();
