/* PALA v201 · stable clickable open workshop damage shortcut */
(()=>{
'use strict';
if(window.__palaCalendarWorkshopClickV201)return;
window.__palaCalendarWorkshopClickV201=true;

async function showOpenWorkshopDamagesV201(){
  try{
    if(typeof mainCalendarTypeFilterV120!=='undefined')mainCalendarTypeFilterV120='workshop';
    if(typeof mainCalendarStatusFilterV123!=='undefined')mainCalendarStatusFilterV123='active';
    localStorage.setItem('pala_calendar_type_filter','workshop');
    localStorage.setItem('pala_calendar_status_filter','active');
    if(typeof showCalendar==='function')await showCalendar();
  }catch(_e){}

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const section=document.querySelector('.workshop-open-pinned-v201,.workshop-open-pinned-v159');
    section?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
}
window.showOpenWorkshopDamagesV201=showOpenWorkshopDamagesV201;

const app=document.getElementById('app');
if(app){
  app.addEventListener('click',event=>{
    const link=event.target.closest?.('.workshop-open-damage-inline-v201');
    if(link)showOpenWorkshopDamagesV201();
  });
  app.addEventListener('keydown',event=>{
    const link=event.target.closest?.('.workshop-open-damage-inline-v201');
    if(!link||(event.key!=='Enter'&&event.key!==' '))return;
    event.preventDefault();
    showOpenWorkshopDamagesV201();
  });
}

if(!document.getElementById('pala-workshop-click-v201-style')){
  const style=document.createElement('style');
  style.id='pala-workshop-click-v201-style';
  style.textContent=`
    .workshop-open-damage-inline-v201{
      cursor:pointer!important;
      text-decoration-line:underline!important;
      text-decoration-thickness:1px!important;
      text-underline-offset:3px!important;
      text-decoration-skip-ink:auto!important;
      border-radius:6px!important;
      padding:2px 3px!important;
      margin:-2px -3px!important;
    }
    .workshop-open-damage-inline-v201:hover{background:#fff0f0!important}
    .workshop-open-damage-inline-v201:focus-visible{outline:2px solid rgba(161,42,42,.28)!important;outline-offset:2px!important}
    .workshop-open-pinned-v201,.workshop-open-pinned-v159{scroll-margin-top:90px!important}
  `;
  document.head.appendChild(style);
}
})();
