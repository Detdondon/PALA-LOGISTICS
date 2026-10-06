/* PALA v361 · calendar month navigation order */
(()=>{
'use strict';
if(window.__palaCalendarNavOrderV361)return;
window.__palaCalendarNavOrderV361=true;

const label=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

function applyCalendarNavOrderV361(){
  const root=document.querySelector('.calendar-controller-v150')||document.getElementById('app');
  if(!root)return;

  const buttons=[...root.querySelectorAll('button')];
  const today=buttons.find(button=>label(button)==='I dag');
  if(!today)return;

  const monthButtons=buttons.filter(button=>label(button)==='1 måned');
  if(monthButtons.length<2)return;

  let next=monthButtons.find(button=>/\bmv\s*\(\s*1\s*\)/.test(button.getAttribute('onclick')||''));
  if(!next){
    next=monthButtons.find(button=>today.compareDocumentPosition(button)&Node.DOCUMENT_POSITION_FOLLOWING)||monthButtons[monthButtons.length-1];
  }
  if(!next||next===today)return;

  const parent=today.parentElement;
  if(!parent)return;

  if(next.parentElement!==parent||today.nextElementSibling!==next){
    parent.insertBefore(next,today.nextSibling);
  }
  parent.classList.add('calendar-nav-left-v361');
  next.classList.add('calendar-next-month-v361');
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;applyCalendarNavOrderV361()});
}

const app=document.getElementById('app');
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
