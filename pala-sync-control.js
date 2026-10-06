/* PALA sync control v365 · avoid duplicate legacy channels and repeated focus reloads */
(function(global){
  'use strict';
  let originalSetup=null,originalSchedule=null,installed=false,lastCatchupAt=0;
  const CATCHUP_MIN_MS=30000;
  try{originalSetup=setupCloudSync;originalSchedule=scheduleCloudSync;}catch(_){}
  function realtimeLive(){return global.PALARealtime?.status==='SUBSCRIBED';}
  function install(){
    if(installed||!realtimeLive())return false;
    installed=true;
    try{if(typeof stopCloudSync==='function')stopCloudSync();}catch(_){}
    if(typeof originalSetup==='function')global.setupCloudSync=function(){if(!realtimeLive())return originalSetup.apply(this,arguments);try{stopCloudSync();}catch(_){}return undefined;};
    if(typeof originalSchedule==='function')global.scheduleCloudSync=function(payload){
      if(!realtimeLive())return originalSchedule.apply(this,arguments);
      // Realtime already carries database writes; do not run the legacy full reload
      // for the same sync event.
      if(payload)return undefined;
      // Focus + visibilitychange commonly fire together on mobile/PWA. Permit one
      // catch-up refresh, then suppress duplicates for 30 seconds.
      const now=Date.now();
      if(now-lastCatchupAt<CATCHUP_MIN_MS)return undefined;
      lastCatchupAt=now;
      return originalSchedule.apply(this,arguments);
    };
    global.__palaLegacySyncRetired=true;
    return true;
  }
  let attempts=0,timer=setInterval(()=>{attempts++;if(install()||attempts>=40)clearInterval(timer);},250);
  global.addEventListener('online',()=>{installed=false;lastCatchupAt=0;setTimeout(install,500);});
})(window);
