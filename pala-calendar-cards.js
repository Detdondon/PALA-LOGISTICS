/* PALA v300 · non-destructive calendar card styling. Original DOM and actions stay intact. */
(()=>{
'use strict';
if(window.__palaCalendarCardsV300)return;
window.__palaCalendarCardsV300=true;

const scope='.view-list,.calendar-detail-list';
const cards='.job-card,.staff-card,.workshop-job-card,.workshop-task';
const processed=new WeakSet();

function activityType(card){
  if(card.matches('.job-card'))return'Ordre';
  if(card.matches('.staff-leave-card'))return'Fravær';
  if(card.matches('.staff-card'))return'Vagt';
  if(card.matches('.workshop-job-card'))return'Systuejob';
  return'Skade';
}

function adapt(card){
  if(!card||processed.has(card))return;
  processed.add(card);
  card.classList.add('pala-activity-card');
  card.dataset.activityType=activityType(card);
  const accent=getComputedStyle(card).borderLeftColor;
  if(accent)card.style.setProperty('--activity-accent',accent);

  /* IMPORTANT:
     Do not move, replace or rebuild children here.
     The original cards contain the working click/keyboard handlers for
     jobs, shifts, Pak / Retur, workshop actions etc. Styling is additive only. */
}

function scan(){
  document.querySelectorAll(scope).forEach(host=>{
    host.querySelectorAll(cards).forEach(adapt);
  });
}

let queued=false;
const observer=new MutationObserver(records=>{
  if(queued||!records.some(record=>record.addedNodes.length))return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    scan();
  });
});

function observe(){
  const app=document.getElementById('app');
  if(app)observer.observe(app,{childList:true,subtree:true});
}

scan();
observe();
})();
