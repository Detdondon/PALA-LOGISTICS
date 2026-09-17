/* PALA sync control v229 · avoid duplicate legacy + record-level realtime channels */
(function(global){
  'use strict';
  let originalSetup=null,originalSchedule=null,installed=false;
  try{originalSetup=setupCloudSync;originalSchedule=scheduleCloudSync;}catch(_){}
  function realtimeLive(){return global.PALARealtime?.status==='SUBSCRIBED';}
  function install(){
    if(installed||!realtimeLive())return false;
    installed=true;
    try{if(typeof stopCloudSync==='function')stopCloudSync();}catch(_){}
    if(typeof originalSetup==='function')global.setupCloudSync=function(){if(!realtimeLive())return originalSetup.apply(this,arguments);try{stopCloudSync();}catch(_){}return undefined;};
    if(typeof originalSchedule==='function')global.scheduleCloudSync=function(){if(!realtimeLive())return originalSchedule.apply(this,arguments);return undefined;};
    global.__palaLegacySyncRetired=true;
    return true;
  }
  let attempts=0,timer=setInterval(()=>{attempts++;if(install()||attempts>=40)clearInterval(timer);},250);
  global.addEventListener('online',()=>{installed=false;setTimeout(install,500);});
})(window);
