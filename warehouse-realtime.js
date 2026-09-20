/* PALA warehouse realtime bridge v209
   Direct warehouse record changes are already applied to PALA_STATE by realtime-sync.
   For those events we only rerender the visible warehouse UI; no reloadData/cloud fetch.
   Relation/category invalidations keep the existing targeted loader fallback. */
(function(global){
  'use strict';

  const DIRECT=new Set(['tents','hardware','inventory']);
  const INVALIDATIONS=new Set([
    'pala_warehouse_categories','tent_wet_status','tent_parts','booking_tents','booking_inventory'
  ]);
  let renderQueued=false;
  let reloadQueued=false;
  let running=false;
  let rerun=false;

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
  function warehouseVisible(){
    return !!document.querySelector('.warehouse-root-list-v183,.warehouse-tabs');
  }

  async function renderWarehouse(){
    if(!safeToRefresh()){deferredRender=true;return true;}
    if(!warehouseVisible()||typeof global.showTents!=='function')return true;
    if(running){rerun=true;return true;}
    running=true;
    try{
      await global.showTents(typeof global.warehouseViewFilter==='string'?global.warehouseViewFilter:'tents',true);
      return true;
    }catch(error){
      console.warn('[PALA Realtime] warehouse render failed',error);
      return false;
    }finally{
      running=false;
      if(rerun){rerun=false;queueRender();}
    }
  }

  function queueRender(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(async()=>{
      renderQueued=false;
      const handled=await renderWarehouse();
      if(!handled)queueReload();
    });
  }

  async function reloadWarehouse(){
    try{
      if(typeof global.loadWarehouseExtensions==='function')await global.loadWarehouseExtensions();
      else if(typeof global.reloadData==='function')await global.reloadData();
      else return false;
      return await renderWarehouse();
    }catch(error){
      console.warn('[PALA Realtime] warehouse refresh failed',error);
      return false;
    }
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
      try{if(!await reloadWarehouse()&&typeof global.scheduleCloudSync==='function')global.scheduleCloudSync();}
      finally{reloadRunning=false;if(reloadAgain){reloadAgain=false;queueReload();}}
    },80);
  }

  function register(){
    const realtime=global.PALARealtime;
    if(!realtime||typeof realtime.on!=='function')return false;
    DIRECT.forEach(source=>realtime.on(source,event=>{
      if(event&&event.direct){queueRender();return true;}
      queueReload();return true;
    }));
    INVALIDATIONS.forEach(source=>realtime.on(source,()=>{queueReload();return true;}));
    global.__palaWarehouseRealtimeV209=true;
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
