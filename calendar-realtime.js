/* PALA calendar realtime bridge v210
   Direct records already live in PALA_STATE; visible calendar rerenders without reloadData.
   Relation/checklist/meeting invalidations retain the safe targeted reload fallback. */
(function(global){
  'use strict';
  const DIRECT=new Set(['bookings','staffing_shifts','staffing_assignments','employees','workshop_jobs','tent_workshop_tasks']);
  const INVALIDATIONS=new Set(['booking_tents','booking_inventory','order_checklist_progress','pala_meetings']);
  let renderQueued=false,reloadQueued=false,running=false,rerun=false;
  let deferredRender=false,deferredReload=false,reloadRunning=false,reloadAgain=false;
  function safeToRefresh(){return typeof global.PALARealtime?.canRefresh!=='function'||global.PALARealtime.canRefresh();}
  function resume(){
    if(!deferredRender&&!deferredReload)return;
    requestAnimationFrame(()=>{
      if(!safeToRefresh())return;
      if(deferredReload){deferredReload=deferredRender=false;queueReload();}
      else if(deferredRender){deferredRender=false;queueRender();}
    });
  }
  document.addEventListener('click',resume,true);
  document.addEventListener('focusout',resume);
  document.addEventListener('close',resume,true);
  document.addEventListener('visibilitychange',resume);
  global.addEventListener('focus',resume);
  function calendarVisible(){return !!document.querySelector('.calendar-controller-v150,.calendar-detail-list,.calendar');}
  async function renderCalendar(){
    if(!safeToRefresh()){deferredRender=true;return true;}
    if(!calendarVisible()||typeof global.showCalendar!=='function')return true;
    if(running){rerun=true;return true;} running=true;
    try{await global.showCalendar();return true;}
    catch(error){console.warn('[PALA Realtime] calendar render failed',error);return false;}
    finally{running=false;if(rerun){rerun=false;queueRender();}}
  }
  function queueRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(async()=>{renderQueued=false;if(!await renderCalendar())queueReload();});}
  async function reloadCalendar(){
    try{if(typeof global.reloadData!=='function')return false;await global.reloadData();return await renderCalendar();}
    catch(error){console.warn('[PALA Realtime] calendar refresh failed',error);return false;}
  }
  function queueReload(){
    if(!safeToRefresh()){deferredReload=true;return;}
    if(reloadRunning){reloadAgain=true;return;}
    if(reloadQueued)return;
    reloadQueued=true;
    setTimeout(async()=>{
      reloadQueued=false;
      if(!safeToRefresh()){deferredReload=true;return;}
      reloadRunning=true;
      try{if(!await reloadCalendar()&&typeof global.scheduleCloudSync==='function')global.scheduleCloudSync();}
      finally{reloadRunning=false;if(reloadAgain){reloadAgain=false;queueReload();}}
    },100);
  }

  function register(){
    const realtime=global.PALARealtime;if(!realtime||typeof realtime.on!=='function')return false;
    DIRECT.forEach(source=>realtime.on(source,event=>{if(event&&event.direct){queueRender();return true;}queueReload();return true;}));
    INVALIDATIONS.forEach(source=>realtime.on(source,()=>{queueReload();return true;}));
    global.__palaCalendarRealtimeV210=true;return true;
  }
  if(!register()){let attempts=0;const timer=setInterval(()=>{attempts++;if(register()||attempts>=10)clearInterval(timer);},300);}
})(window);
