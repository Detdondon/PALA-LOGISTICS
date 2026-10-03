/* PALA v350 · employee Mine vagter/opgaver calendar toggle. */
(()=>{
'use strict';
if(window.__palaCalendarMyAssignmentsV350||typeof showCalendar!=='function')return;
window.__palaCalendarMyAssignmentsV350=true;

let active=false;
let ownerId=Number(typeof employeeId!=='undefined'?employeeId:0)||0;
window.calendarMyAssignmentsActiveV350=false;

const currentEmployeeId=()=>Number(typeof employeeId!=='undefined'?employeeId:0)||0;
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));

function syncOwner(){
  const id=currentEmployeeId();
  if(id===ownerId)return;
  ownerId=id;
  active=false;
  window.calendarMyAssignmentsActiveV350=false;
}

function isLeave(row){
  try{return typeof isStaffLeave==='function'&&isStaffLeave(row)}catch(_e){return false}
}
function assignedShift(row){
  const id=currentEmployeeId();
  if(!id||!row||isLeave(row))return false;
  if(Number(row.daily_leader_employee_id||0)===id)return true;
  try{
    const assignments=typeof staffAssignmentsFor==='function'?staffAssignmentsFor(row.id):[];
    return (assignments||[]).some(item=>Number(item?.employee_id||0)===id);
  }catch(_e){return false}
}
function taskEmployeeIds(row){
  const value=row?.employee_ids;
  if(Array.isArray(value))return value.map(Number).filter(Boolean);
  if(typeof value==='string'){
    try{const parsed=JSON.parse(value);if(Array.isArray(parsed))return parsed.map(Number).filter(Boolean)}catch(_e){}
    return value.split(',').map(Number).filter(Boolean);
  }
  return [];
}
function assignedTask(row){
  const id=currentEmployeeId();
  return !!id&&row?.kind==='task'&&taskEmployeeIds(row).includes(id);
}

window.calendarMyAssignmentVisibleV350=function(kind,row){
  if(!window.calendarMyAssignmentsActiveV350)return true;
  if(kind==='staffing')return assignedShift(row);
  if(kind==='task')return assignedTask(row);
  return false;
};

function installToggle(){
  syncOwner();
  const card=document.querySelector('.calendar-controller-v150');
  const top=card?.querySelector('.calendar-toolbar-top');
  const title=top?.querySelector('.calendar-toolbar-title');
  if(!card||!top||!title||!currentEmployeeId())return;

  let button=top.querySelector('.calendar-my-toggle-v350');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='btn calendar-my-toggle-v350';
    button.setAttribute('aria-label','Vis kun mine vagter og opgaver');
    button.onclick=()=>window.toggleCalendarMyAssignmentsV350();
    title.insertAdjacentElement('afterend',button);
  }

  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',active?'true':'false');
  button.innerHTML=`${typeof uiIcon==='function'?uiIcon('user'):''}<span class="calendar-my-label-full-v350">Mine vagter / opgaver</span><span class="calendar-my-label-short-v350">Mine</span>`;

  const subtitle=title.querySelector('.small.muted');
  if(active&&subtitle)subtitle.textContent=`Mine vagter og opgaver · ${String(typeof employeeName!=='undefined'?employeeName:'Medarbejder')}`;

  card.classList.toggle('calendar-my-active-v350',active);
  card.querySelectorAll('.unified-calendar-summary-v123 button,.calendar-type-buttons-v174 button').forEach(control=>{
    control.disabled=active;
    control.setAttribute('aria-disabled',active?'true':'false');
  });
  card.querySelectorAll('.calendar-filter-grid-v150 select,.unified-filter-grid-v123 select').forEach(control=>{
    control.disabled=active;
    control.setAttribute('aria-disabled',active?'true':'false');
  });
}

window.toggleCalendarMyAssignmentsV350=function(){
  syncOwner();
  if(!currentEmployeeId())return;
  active=!active;
  window.calendarMyAssignmentsActiveV350=active;
  return showCalendar();
};

const baseShowCalendarV350=window.showCalendar;
window.showCalendar=async function(){
  syncOwner();
  window.calendarMyAssignmentsActiveV350=active;

  if(!active){
    const result=await baseShowCalendarV350.apply(this,arguments);
    installToggle();
    requestAnimationFrame(installToggle);
    return result;
  }

  const originalShifts=staffingShifts;
  const originalMeetings=palaMeetings;
  const originalType=mainCalendarTypeFilterV120;
  const originalStatus=mainCalendarStatusFilterV123;
  const storedType=localStorage.getItem('pala_calendar_type_filter');
  const storedStatus=localStorage.getItem('pala_calendar_status_filter');

  staffingShifts=(originalShifts||[]).filter(assignedShift);
  palaMeetings=(originalMeetings||[]).filter(assignedTask);
  mainCalendarStatusFilterV123='all';

  try{
    const result=await baseShowCalendarV350.apply(this,arguments);
    await nextFrame();
    installToggle();
    return result;
  }finally{
    staffingShifts=originalShifts;
    palaMeetings=originalMeetings;
    mainCalendarTypeFilterV120=originalType;
    mainCalendarStatusFilterV123=originalStatus;
    if(storedType===null)localStorage.removeItem('pala_calendar_type_filter');else localStorage.setItem('pala_calendar_type_filter',storedType);
    if(storedStatus===null)localStorage.removeItem('pala_calendar_status_filter');else localStorage.setItem('pala_calendar_status_filter',storedStatus);
  }
};

if(!document.getElementById('pala-calendar-my-assignments-v350-style')){
  const style=document.createElement('style');
  style.id='pala-calendar-my-assignments-v350-style';
  style.textContent=`
    .calendar-controller-v150 .calendar-toolbar-top{
      align-items:center!important;
    }
    .calendar-my-toggle-v350{
      flex:0 0 auto!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
      min-height:42px!important;
      padding:8px 12px!important;
      border:1px solid #d8e0eb!important;
      background:#fff!important;
      color:#40516a!important;
      box-shadow:none!important;
      white-space:nowrap!important;
    }
    .calendar-my-toggle-v350 .ui-icon{
      width:17px!important;
      height:17px!important;
      flex:0 0 17px!important;
    }
    .calendar-my-toggle-v350.is-active{
      border-color:#2f80ed!important;
      background:#eaf3ff!important;
      color:#1768c4!important;
      box-shadow:0 0 0 2px rgba(47,128,237,.11) inset!important;
    }
    .calendar-my-label-short-v350{display:none}
    .calendar-my-active-v350 .unified-calendar-summary-v123 button:disabled,
    .calendar-my-active-v350 .calendar-type-buttons-v174 button:disabled,
    .calendar-my-active-v350 select:disabled{
      opacity:.62!important;
      cursor:default!important;
    }
    @media(max-width:620px){
      .calendar-controller-v150 .calendar-toolbar-title{min-width:0!important}
      .calendar-my-toggle-v350{
        min-height:38px!important;
        padding:7px 10px!important;
        border-radius:12px!important;
        font-size:12px!important;
      }
      .calendar-my-label-full-v350{display:none}
      .calendar-my-label-short-v350{display:inline}
    }
  `;
  document.head.appendChild(style);
}

queueMicrotask(installToggle);
})();
