/* PALA v200 · clickable open workshop damage shortcut */
(()=>{
'use strict';
if(window.__palaCalendarWorkshopClickV200)return;
window.__palaCalendarWorkshopClickV200=true;

async function showOpenWorkshopDamagesV200(){
  try{
    if(typeof mainCalendarTypeFilterV120!=='undefined')mainCalendarTypeFilterV120='workshop';
    if(typeof mainCalendarStatusFilterV123!=='undefined')mainCalendarStatusFilterV123='active';
    localStorage.setItem('pala_calendar_type_filter','workshop');
    localStorage.setItem('pala_calendar_status_filter','active');
    if(typeof showCalendar==='function')await showCalendar();
  }catch(_e){}

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const section=document.querySelector('.workshop-open-pinned-v199,.workshop-open-pinned-v159');
    section?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
}
window.showOpenWorkshopDamagesV200=showOpenWorkshopDamagesV200;

function enhanceOpenDamageLink(root=document){
  const nodes=[];
  if(root?.matches?.('.workshop-open-damage-inline-v199'))nodes.push(root);
  root?.querySelectorAll?.('.workshop-open-damage-inline-v199')?.forEach(node=>nodes.push(node));
  nodes.forEach(node=>{
    if(node.dataset.palaWorkshopDamageClickable==='1')return;
    node.dataset.palaWorkshopDamageClickable='1';
    node.classList.add('workshop-open-damage-link-v200');
    node.setAttribute('role','button');
    node.setAttribute('tabindex','0');
    node.setAttribute('aria-label','Vis åbne skader i systuen');
    node.setAttribute('title','Vis åbne skader');
    node.addEventListener('click',showOpenWorkshopDamagesV200);
    node.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        showOpenWorkshopDamagesV200();
      }
    });
  });
}

if(!document.getElementById('pala-workshop-click-v200-style')){
  const style=document.createElement('style');
  style.id='pala-workshop-click-v200-style';
  style.textContent=`
    .workshop-open-damage-link-v200{
      cursor:pointer!important;
      text-decoration:underline!important;
      text-decoration-thickness:1px!important;
      text-underline-offset:3px!important;
      border-radius:6px!important;
      padding:2px 3px!important;
      margin:-2px -3px!important;
    }
    .workshop-open-damage-link-v200:hover{background:#fff0f0!important}
    .workshop-open-damage-link-v200:focus-visible{outline:2px solid rgba(161,42,42,.28)!important;outline-offset:2px!important}
    .workshop-open-pinned-v199,.workshop-open-pinned-v159{scroll-margin-top:90px!important}
  `;
  document.head.appendChild(style);
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    enhanceOpenDamageLink(document.getElementById('app')||document);
  });
}
const app=document.getElementById('app');
if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhanceOpenDamageLink(app||document);
})();
