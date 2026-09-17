/* PALA calendar realtime bridge v206
   Routes calendar-related invalidations through the existing calendar render path
   instead of immediately falling back to the global cloud-sync renderer. */
(function(global){
  'use strict';

  const SOURCES=new Set([
    'bookings','booking_tents','booking_inventory','order_checklist_progress',
    'staffing_shifts','staffing_assignments','employees',
    'workshop_jobs','tent_workshop_tasks','pala_meetings'
  ]);
  let queued=false;
  let running=false;
  let rerun=false;

  function calendarVisible(){
    return !!document.querySelector('.calendar-controller-v150,.calendar-detail-list,.calendar');
  }

  async function refreshCalendar(){
    if(running){rerun=true;return true;}
    running=true;
    try{
      if(typeof global.reloadData==='function')await global.reloadData();
      else return false;

      if(calendarVisible()&&typeof global.showCalendar==='function')await global.showCalendar();
      return true;
    }catch(error){
      console.warn('[PALA Realtime] calendar refresh failed',error);
      return false;
    }finally{
      running=false;
      if(rerun){rerun=false;queueRefresh();}
    }
  }

  function queueRefresh(){
    if(queued)return;
    queued=true;
    setTimeout(async()=>{
      queued=false;
      const handled=await refreshCalendar();
      if(!handled&&typeof global.scheduleCloudSync==='function')global.scheduleCloudSync();
    },100);
  }

  function register(){
    const realtime=global.PALARealtime;
    if(!realtime||typeof realtime.on!=='function')return false;
    SOURCES.forEach(source=>realtime.on(source,()=>{queueRefresh();return true;}));
    global.__palaCalendarRealtimeV206=true;
    return true;
  }

  if(!register()){
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      if(register()||attempts>=10)clearInterval(timer);
    },300);
  }
})(window);
