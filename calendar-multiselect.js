/* PALA v350 · multi-select calendar categories + temporary Mine view. */
(()=>{
'use strict';
if(window.__palaCalendarMultiSelectV307)return;
window.__palaCalendarMultiSelectV306=true;

const ORDER=['orders','staffing','workshop','calendarItems'];
const STORAGE='pala_calendar_type_filters_v306';
const valid=list=>ORDER.filter(type=>Array.isArray(list)&&list.includes(type));
const mineActive=()=>window.calendarMyAssignmentsActiveV350===true;
const effective=()=>mineActive()?['staffing','calendarItems']:[...selected];

function readSelection(){
  try{
    const saved=valid(JSON.parse(localStorage.getItem(STORAGE)||'[]'));
    if(saved.length)return saved;
  }catch(_){}
  const legacy=String(typeof mainCalendarTypeFilterV120!=='undefined'?mainCalendarTypeFilterV120:(localStorage.getItem('pala_calendar_type_filter')||'all'));
  return ORDER.includes(legacy)?[legacy]:[...ORDER];
}

let selected=readSelection();

function save(){
  selected=valid(selected);
  if(!selected.length)selected=[ORDER[0]];
  localStorage.setItem(STORAGE,JSON.stringify(selected));
  localStorage.setItem('pala_calendar_type_filter',selected.length===1?selected[0]:'all');
}
function get(){return effective()}
function has(type){return effective().includes(type)}
function selectedHas(type){return selected.includes(type)}
function setSingle(type){
  if(!ORDER.includes(type))return;
  selected=[type];
  save();
}
function toggle(type){
  if(!ORDER.includes(type))return false;
  if(selectedHas(type)){
    if(selected.length===1)return false;
    selected=selected.filter(item=>item!==type);
  }else{
    selected=ORDER.filter(item=>selected.includes(item)||item===type);
  }
  save();
  return true;
}
function eventType(event){
  const kind=event?.kind==='meeting'&&event?.item?.kind==='task'?'task':(event?.kind||'order');
  if(kind==='order')return'orders';
  if(kind==='staffing'||kind==='staffLeave')return'staffing';
  if(kind==='workshop'||kind==='workshopTask')return'workshop';
  if(kind==='meeting'||kind==='task')return'calendarItems';
  return'';
}
function removeLegacyTypeControl(){
  const grid=document.querySelector('.calendar-filter-grid-v150,.unified-filter-grid-v123');
  if(!grid)return;
  [...grid.querySelectorAll('label')].forEach(label=>{
    const heading=String(label.querySelector('span')?.textContent||'').trim();
    if(heading==='Vis')label.remove();
  });
  grid.classList.add('calendar-filter-grid-single-v306');
}

window.getCalendarSelectedTypesV306=get;
window.calendarTypeSelectedV306=has;

const baseCalendarEventsV306=window.calendarEvents;
window.calendarEvents=function(start,days,mode){
  if(mode!=='calendar')return baseCalendarEventsV306.apply(this,arguments);
  const previous=mainCalendarTypeFilterV120;
  mainCalendarTypeFilterV120='all';
  let rows;
  try{rows=baseCalendarEventsV306.apply(this,arguments)||[]}
  finally{mainCalendarTypeFilterV120=previous}
  return rows.filter(event=>has(eventType(event)));
};

window.setUnifiedCalendarTypeV123=function(type){
  if(mineActive())return;
  if(!toggle(type))return;
  mainCalendarTypeFilterV120=selected.length===1?selected[0]:'all';
  if(selected.length>1&&['inquiry','warehouse','out','understaffed'].includes(mainCalendarStatusFilterV123)){
    mainCalendarStatusFilterV123='active';
    localStorage.setItem('pala_calendar_status_filter','active');
  }
  return showCalendar();
};

const baseShowCalendarV306=window.showCalendar;
window.showCalendar=async function(){
  /* Keep old shortcuts functional outside Mine view. Mine view temporarily exposes
     staffing + assigned calendar tasks without changing the employee's saved filters. */
  if(!mineActive()&&ORDER.includes(mainCalendarTypeFilterV120)){
    const represented=selected.length===1?selected[0]:'all';
    if(mainCalendarTypeFilterV120!==represented)setSingle(mainCalendarTypeFilterV120);
  }

  const visible=effective();
  mainCalendarTypeFilterV120=visible.length===1?visible[0]:'all';
  const result=await baseShowCalendarV306.apply(this,arguments);
  removeLegacyTypeControl();
  requestAnimationFrame(removeLegacyTypeControl);
  return result;
};

save();
queueMicrotask(removeLegacyTypeControl);
})();
