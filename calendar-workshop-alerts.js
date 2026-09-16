/* PALA v199 · open workshop damages stay active and warning label is always red */
(()=>{
'use strict';
if(window.__palaCalendarWorkshopAlertsV199)return;
window.__palaCalendarWorkshopAlertsV199=true;

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
  const cleaned=String(node.textContent||'')
    .replace(/\s*·\s*\d+\s+åben skade\s*$/i,'')
    .replace(/\s*·\s*\d+\s+åbne skader\s*$/i,'')
    .trim();
  if(cleaned!==String(node.textContent||'').trim())node.textContent=cleaned;
}

function markWorkshopSummary(){
  const button=document.querySelector('.unified-calendar-summary-v123 .reference-button[onclick*="setUnifiedCalendarTypeV123(\'workshop\')"]');
  if(!button)return;
  button.querySelector('.workshop-open-damage-count-v197')?.remove();
  button.querySelector('.workshop-open-damage-count-v196')?.remove();
  button.querySelector('.workshop-open-damage-count-v195')?.remove();
  clearLegacyOpenDamageText(button);
  const count=allOpenWorkshopDamages().length;
  button.classList.toggle('red',count>0);
  if(count>0)button.title=`${count} ${count===1?'uafsluttet skade':'uafsluttede skader'} i systuen`;
  else if(button.title?.includes('uafsluttet'))button.removeAttribute('title');
}

function markCalendarCountBar(){
  const bar=document.querySelector('.calendar-count-summary-v174');
  if(!bar)return;

  bar.querySelector('.workshop-open-damage-separator-v198')?.remove();
  bar.querySelector('.workshop-open-damage-inline-v198')?.remove();
  bar.querySelector('.workshop-open-damage-separator-v199')?.remove();
  bar.querySelector('.workshop-open-damage-inline-v199')?.remove();

  const items=[...bar.querySelectorAll('.calendar-count-item-v174')];
  const workshopItem=items.find(node=>/\bsystue\b/i.test(String(node.textContent||'')));
  if(workshopItem)clearLegacyOpenDamageText(workshopItem);

  const status=typeof mainCalendarStatusFilterV123!=='undefined'?mainCalendarStatusFilterV123:'all';
  const type=typeof mainCalendarTypeFilterV120!=='undefined'?mainCalendarTypeFilterV120:'all';
  const count=allOpenWorkshopDamages().length;
  if(status==='completed'||!['all','workshop'].includes(type)||!count||!workshopItem)return;

  const separator=document.createElement('span');
  separator.className='calendar-count-separator-v174 workshop-open-damage-separator-v199';
  separator.setAttribute('aria-hidden','true');
  separator.textContent='•';

  const warning=document.createElement('span');
  warning.className='calendar-count-item-v174 warning workshop-open-damage-inline-v199';
  warning.innerHTML=`<span class="workshop-open-damage-number-v199">${count}</span> <span class="workshop-open-damage-label-v199">${count===1?'åben skade':'åbne skader'}</span>`;

  workshopItem.insertAdjacentElement('afterend',separator);
  separator.insertAdjacentElement('afterend',warning);
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
  host.querySelector('.workshop-open-pinned-v197')?.remove();
  host.querySelector('.workshop-open-pinned-v198')?.remove();
  host.querySelector('.workshop-open-pinned-v199')?.remove();
  if(!tasks.length)return;

  clearEmptyMessage(host);
  const section=document.createElement('section');
  section.className='view-list-group workshop-open-pinned-v159 workshop-open-pinned-v199';
  section.innerHTML=`<h3 class="view-list-date workshop-open-title-v199">Åbne skader</h3>${tasks.map(taskCard).join('')}`;
  host.prepend(section);
}

function applyWorkshopAlerts(){
  markWorkshopSummary();
  ensureOpenDamageSection();
  markCalendarCountBar();
}

function scheduleWorkshopAlerts(){
  requestAnimationFrame(()=>requestAnimationFrame(applyWorkshopAlerts));
}

if(!document.getElementById('pala-workshop-alerts-v199-style')){
  const style=document.createElement('style');
  style.id='pala-workshop-alerts-v199-style';
  style.textContent=`
    .workshop-open-title-v199,
    .workshop-open-damage-inline-v199,
    .workshop-open-damage-label-v199{
      color:#a12a2a!important;
      font-weight:800!important;
    }
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
    requestAnimationFrame(()=>{
      queued=false;
      applyWorkshopAlerts();
    });
  }).observe(appRoot,{childList:true,subtree:true});
}

queueMicrotask(()=>{
  applyWorkshopAlerts();
  scheduleWorkshopAlerts();
});
})();
