/* PALA v364 · passed staffing shifts are consistently muted/grey in calendar surfaces. */
(()=>{
'use strict';
if(window.__palaCalendarPastShiftsV364)return;
window.__palaCalendarPastShiftsV364=true;

const FALLBACK_COMPLETED_COLOR='#858993';

function dateFromIso(value){
  try{
    if(typeof localDateFromISO==='function')return localDateFromISO(value);
  }catch(_e){}
  const parts=String(value||'').slice(0,10).split('-').map(Number);
  if(parts.length!==3||parts.some(v=>!Number.isFinite(v)))return null;
  return new Date(parts[0],parts[1]-1,parts[2]);
}
function shortTime(value){
  try{
    if(typeof staffTime==='function')return staffTime(value);
  }catch(_e){}
  const match=String(value||'').match(/^(\d{1,2}):(\d{2})/);
  return match?`${String(+match[1]).padStart(2,'0')}:${match[2]}`:'';
}
function shiftEndAt(shift){
  if(!shift?.shift_date)return null;
  try{if(typeof isStaffLeave==='function'&&isStaffLeave(shift))return null}catch(_e){}
  const date=dateFromIso(shift.shift_date);
  if(!date)return null;
  const start=shortTime(shift.start_time);
  const end=shortTime(shift.end_time);
  if(!end){
    date.setHours(23,59,59,999);
    return date;
  }
  const [hour,minute]=end.split(':').map(Number);
  date.setHours(hour||0,minute||0,0,0);
  // A shift such as 22:00–02:00 ends on the following day.
  if(start&&end<=start)date.setDate(date.getDate()+1);
  return date;
}
function shiftHasPassed(shift,now=new Date()){
  const end=shiftEndAt(shift);
  return !!end&&end.getTime()<=now.getTime();
}
window.staffShiftHasPassed=shiftHasPassed;
window.palaStaffShiftHasPassedV364=shiftHasPassed;

function completedColor(){
  try{if(typeof COMPLETED_COLOR!=='undefined'&&COMPLETED_COLOR)return COMPLETED_COLOR}catch(_e){}
  return FALLBACK_COMPLETED_COLOR;
}
function completedTextColor(){
  try{if(typeof textOnColor==='function')return textOnColor(completedColor())}catch(_e){}
  return '#fff';
}
function shiftById(id){
  try{return (Array.isArray(staffingShifts)?staffingShifts:[]).find(row=>+row.id===+id)||null}catch(_e){return null}
}
function shiftIdFromNode(node){
  const code=String(node?.getAttribute?.('onclick')||'');
  const match=code.match(/openStaffShift\s*\(\s*(\d+)\s*\)/);
  return match?+match[1]:0;
}
function markNode(node){
  const id=shiftIdFromNode(node);
  if(!id)return;
  const shift=shiftById(id);
  const past=shiftHasPassed(shift);
  node.classList.toggle('pala-past-shift-v364',past);
  if(!past)return;

  const color=completedColor();
  const textColor=completedTextColor();
  node.classList.remove('underfilled','staff-underfilled');
  node.dataset.palaPastShift='1';
  node.style.setProperty('--pala-past-shift-bg',color);
  node.style.setProperty('--pala-past-shift-text',textColor);
  // Calendar chips use these existing variables for their visible background.
  if(node.classList.contains('calendar-job-chip')){
    node.style.setProperty('--job-color',color);
    node.style.setProperty('--job-text',textColor);
  }
  // List/detail shift cards use a direct border-left color.
  if(node.classList.contains('staff-card'))node.style.borderLeftColor=color;
}
function scan(root=document){
  const selector='.calendar-job-chip[onclick*="openStaffShift("],.staff-card[onclick*="openStaffShift("]';
  if(root?.matches?.(selector))markNode(root);
  root?.querySelectorAll?.(selector)?.forEach(markNode);
}

if(!document.getElementById('pala-past-shifts-v364-style')){
  const style=document.createElement('style');
  style.id='pala-past-shifts-v364-style';
  style.textContent=`
    .calendar-job-chip.pala-past-shift-v364{
      background:var(--pala-past-shift-bg,#858993)!important;
      color:var(--pala-past-shift-text,#fff)!important;
      outline:none!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)!important;
      filter:saturate(.15)!important;
      opacity:.82!important;
    }
    .staff-card.pala-past-shift-v364{
      --activity-accent:var(--pala-past-shift-bg,#858993)!important;
      background:#f1f3f5!important;
      border-color:#d7dce2!important;
      border-left-color:var(--pala-past-shift-bg,#858993)!important;
      color:#667085!important;
      box-shadow:none!important;
    }
    .staff-card.pala-past-shift-v364 h3{color:#667085!important}
    .staff-card.pala-past-shift-v364 :is(.leader-badge,.staff-person,.staff-job-link,.pill){filter:saturate(.2)!important;opacity:.86!important}
  `;
  document.head.appendChild(style);
}

let queued=false;
function schedule(root){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;scan(root||document.getElementById('app')||document)});
}
const app=document.getElementById('app');
if(app)new MutationObserver(records=>{
  if(records.some(record=>record.addedNodes.length))schedule(app);
}).observe(app,{childList:true,subtree:true});

// Keep a same-day shift correct when its end time passes while PALA stays open.
setInterval(()=>{if(!document.hidden)scan(app||document)},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(app)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(app),{once:true});else schedule(app);
})();
