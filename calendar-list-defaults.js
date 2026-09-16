/* PALA v194 · completed items stay in calendar, not default lists */
(()=>{
'use strict';
if(window.__palaCalendarListDefaultsV194)return;
window.__palaCalendarListDefaultsV194=true;

function withListStatus(status,fn){
  let previous;
  try{
    previous=mainCalendarStatusFilterV123;
    mainCalendarStatusFilterV123=status;
    return fn();
  }finally{
    mainCalendarStatusFilterV123=previous;
  }
}

function refreshCalendarListsV194(){
  // "Alle" keeps completed entries visible in the calendar grid itself,
  // but the list surfaces should behave as the day-to-day active overview.
  if(typeof mainCalendarStatusFilterV123==='undefined'||mainCalendarStatusFilterV123!=='all')return;

  if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='calendar'){
    const host=document.querySelector('.calendar-detail-list');
    if(host&&typeof window.calendarMonthDetailHtmlV157==='function'){
      host.innerHTML=withListStatus('active',()=>window.calendarMonthDetailHtmlV157());
    }
    return;
  }

  if(typeof calendarViewMode!=='undefined'&&calendarViewMode==='list'&&typeof window.renderMainCalendarListV121==='function'){
    withListStatus('active',()=>window.renderMainCalendarListV121());
  }
}

const baseShowCalendar=window.showCalendar;
if(typeof baseShowCalendar==='function'){
  window.showCalendar=async function(){
    const result=await baseShowCalendar.apply(this,arguments);
    refreshCalendarListsV194();
    return result;
  };
}

// Apply once in case the calendar is already rendered when this enhancement loads.
queueMicrotask(refreshCalendarListsV194);
})();
