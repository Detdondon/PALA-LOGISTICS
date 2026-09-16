/* PALA v201 · stable open workshop damage warning rendering */
(()=>{
'use strict';
if(window.__palaCalendarWorkshopAlertsV201)return;
window.__palaCalendarWorkshopAlertsV201=true;

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

  removeLegacyCountNodes(bar);
  const items=[...bar.querySelectorAll('.calendar-count-item-v174')];
  const workshopItem=items.find(node=>/\bsystue\b/i.test(String(node.textContent||'')));
  if(workshopItem)clearLegacyOpenDamageText(workshopItem);

  const status=typeof mainCalendarStatusFilterV123!=='undefined'?mainCalendarStatusFilterV123:'all';
  const type=typeof mainCalendarTypeFilterV120!=='undefined'?mainCalendarTypeFilterV120:'all';
  const count=allOpenWorkshopDamages().length;
  const shouldShow=status!=='completed'&&['all','workshop'].includes(type)&&count>0&&!!workshopItem;

  let separator=bar.querySelector('.workshop-open-damage-separator-v201');
  let warning=bar.querySelector('.workshop-open-damage-inline-v201');
  if(!shouldShow){separator?.remove();warning?.remove();return}

  if(!separator){
    separator=document.createElement('span');
    separator.className='calendar-count-separator-v174 workshop-open-damage-separator-v201';
    separator.setAttribute('aria-hidden','true');
    separator.textContent='•';
    workshopItem.insertAdjacentElement('afterend',separator);
  }else if(separator.previousElementSibling!==workshopItem){
    workshopItem.insertAdjacentElement('afterend',separator);
  }

  if(!warning){
    warning=document.createElement('span');
    warning.className='calendar-count-item-v174 warning workshop-open-damage-inline-v201';
    warning.setAttribute('role','button');
    warning.setAttribute('tabindex','0');
    warning.setAttribute('aria-label','Vis åbne skader i systuen');
    warning.setAttribute('title','Vis åbne skader');
    const number=document.createElement('span');
    number.className='workshop-open-damage-number-v201';
    const label=document.createElement('span');
    label.className='workshop-open-damage-label-v201';
    warning.append(number,document.createTextNode(' '),label);
    separator.insertAdjacentElement('afterend',warning);
  }else if(warning.previousElementSibling!==separator){
    separator.insertAdjacentElement('afterend',warning);
  }

  const number=warning.querySelector('.workshop-open-damage-number-v201');
  const label=warning.querySelector('.workshop-open-damage-label-v201');
  const labelText=count===1?'åben skade':'åbne skader';
  if(number&&number.textContent!==String(count))number.textContent=String(count);
  if(label&&label.textContent!==labelText)label.textContent=labelText;
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
  const host=(typeof calendarViewMode!=='undefined'&&calendarViewMode==='list')
    ?document.querySelector('.view-list')
    :document.querySelector('.calendar-detail-list');
  if(!host)return;

  let section=host.querySelector('.workshop-open-pinned-v201');
  if(!isWorkshop||completed){section?.remove();return}

  const tasks=allOpenWorkshopDamages();
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
