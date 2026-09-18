/* PALA v187 · clickable missing-staffing summary
   Clicking the red "mangler bemanding" count shows only active underfilled shifts
   for the currently selected calendar month directly below the calendar. */
(()=>{
'use strict';
if(window.__palaCalendarMissingStaffingV187)return;
window.__palaCalendarMissingStaffingV187=true;

function isoDate(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function monthBounds(){
  let current=new Date();
  try{if(typeof calDate!=='undefined'&&calDate instanceof Date&&!Number.isNaN(calDate.getTime()))current=calDate}catch(_e){}
  return {
    first:isoDate(new Date(current.getFullYear(),current.getMonth(),1)),
    last:isoDate(new Date(current.getFullYear(),current.getMonth()+1,0)),
    label:current.toLocaleDateString('da-DK',{month:'long',year:'numeric'})
  };
}
function missingRows(){
  const bounds=monthBounds();
  let rows=[];
  try{rows=Array.isArray(staffingShifts)?staffingShifts.slice():[]}catch(_e){rows=[]}
  return rows.filter(sh=>{
    if(!sh?.shift_date||sh.shift_date<bounds.first||sh.shift_date>bounds.last)return false;
    try{if(typeof isStaffLeave==='function'&&isStaffLeave(sh))return false}catch(_e){}
    try{if(typeof staffLinkedJobCompleted==='function'&&staffLinkedJobCompleted(sh))return false}catch(_e){}
    let assigned=0;try{assigned=typeof staffAssignmentsFor==='function'?staffAssignmentsFor(sh.id).length:0}catch(_e){}
    const needed=Number(sh.workers_needed)||0;
    return needed>0&&assigned<needed;
  }).sort((a,b)=>String(a.shift_date).localeCompare(String(b.shift_date))||String(a.start_time||'').localeCompare(String(b.start_time||''))||(+a.id||0)-(+b.id||0));
}
function dateHeading(ds){
  try{if(typeof listDateHeading==='function')return listDateHeading(ds)}catch(_e){}
  try{if(typeof weekdayDateDa==='function')return weekdayDateDa(ds)}catch(_e){}
  try{if(typeof fmtDateDa==='function')return fmtDateDa(ds)}catch(_e){}
  return ds;
}
function renderShift(sh){
  try{if(typeof staffShiftCard==='function')return staffShiftCard(sh)}catch(_e){}
  const title=String(sh?.title||'Vagt').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  return `<button type="button" class="btn" onclick="openStaffShift(${+sh.id})">${title}</button>`;
}
function showMissingList(){
  document.querySelector('.calendar-missing-staffing-v187')?.remove();
  const calendar=document.querySelector('.calendar-controller-v150');
  if(!calendar)return;
  const bounds=monthBounds(),rows=missingRows(),dates=[...new Set(rows.map(sh=>sh.shift_date))];
  const section=document.createElement('section');
  section.className='card calendar-missing-staffing-v187';
  section.innerHTML=`<div class="row calendar-missing-head-v187"><div><div class="small muted">BEMANDING · ${bounds.label.toLocaleUpperCase('da-DK')}</div><h3>Vagter der mangler bemanding</h3><p class="small muted">Kun aktive vagter i den valgte måned vises.</p></div><button type="button" class="btn" data-close-missing-staffing aria-label="Luk listen">${typeof uiIcon==='function'?uiIcon('close'):''} Luk</button></div><div class="calendar-missing-list-v187">${dates.map(ds=>`<section class="view-list-group"><h3 class="view-list-date">${dateHeading(ds)}</h3>${rows.filter(sh=>sh.shift_date===ds).map(renderShift).join('')}</section>`).join('')||'<p class="muted">Der er ingen aktive vagter, der mangler bemanding i denne måned.</p>'}</div>`;
  section.querySelector('[data-close-missing-staffing]')?.addEventListener('click',()=>section.remove());
  calendar.insertAdjacentElement('afterend',section);
  section.scrollIntoView({behavior:'smooth',block:'start'});
}
function enhanceWarning(node){
  if(!node||node.dataset.palaMissingStaffingClickable==='1')return;
  const text=String(node.textContent||'').replace(/\s+/g,' ').trim();
  if(!/mangler\s+bemanding/i.test(text))return;

  // The total number of shifts is neutral. Only the understaffing count is a red warning/link.
  const combined=text.match(/^(\d+\s+vagt(?:er)?)\s*·\s*(\d+\s+mangler\s+bemanding)$/i);
  if(combined){
    const total=document.createElement('span');
    total.className='calendar-count-item-v174 calendar-staffing-total-v237';
    total.textContent=combined[1];

    const separator=document.createElement('span');
    separator.className='calendar-count-separator-v174';
    separator.setAttribute('aria-hidden','true');
    separator.textContent='•';

    const warning=document.createElement('span');
    warning.className='calendar-count-item-v174 warning';
    warning.textContent=combined[2];

    node.replaceWith(total,separator,warning);
    node=warning;
  }

  node.dataset.palaMissingStaffingClickable='1';
  node.classList.add('calendar-missing-staffing-link-v187');
  node.setAttribute('role','button');
  node.setAttribute('tabindex','0');
  node.setAttribute('aria-label','Vis aktive vagter der mangler bemanding');
  node.setAttribute('title','Vis vagter der mangler bemanding');
  node.addEventListener('click',showMissingList);
  node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showMissingList()}});
}
function enhance(root=document){
  const nodes=[];
  if(root?.matches?.('.calendar-count-item-v174.warning'))nodes.push(root);
  root?.querySelectorAll?.('.calendar-count-item-v174.warning')?.forEach(node=>nodes.push(node));
  nodes.forEach(enhanceWarning);
}

let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance(document.getElementById('app')||document)})}
const app=document.getElementById('app');
if(app)new MutationObserver(records=>{
  if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches?.('.calendar-count-summary-v174,.calendar-count-item-v174')||node.querySelector?.('.calendar-count-item-v174.warning')))))schedule();
}).observe(app,{childList:true,subtree:true});

if(!document.getElementById('pala-calendar-missing-staffing-v187-style')){
  const style=document.createElement('style');
  style.id='pala-calendar-missing-staffing-v187-style';
  style.textContent=`
    .calendar-staffing-total-v237{color:#667085!important;text-decoration:none!important;background:transparent!important}\n    .calendar-missing-staffing-link-v187{cursor:pointer!important;text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:3px!important;border-radius:6px!important;padding:2px 3px!important;margin:-2px -3px!important}
    .calendar-missing-staffing-link-v187:hover{background:#fff0f0!important}
    .calendar-missing-staffing-link-v187:focus-visible{outline:2px solid rgba(161,42,42,.28)!important;outline-offset:2px!important}
    .calendar-missing-staffing-v187{scroll-margin-top:90px!important}
    .calendar-missing-head-v187{align-items:flex-start!important}
    .calendar-missing-head-v187 h3{margin:3px 0 4px!important}
    .calendar-missing-head-v187 p{margin:0!important}
    .calendar-missing-list-v187{margin-top:12px!important}
    .calendar-missing-list-v187 .view-list-group{margin-top:12px!important}
  `;
  document.head.appendChild(style);
}

enhance(document.getElementById('app')||document);
})();
