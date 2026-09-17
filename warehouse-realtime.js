/* PALA warehouse realtime bridge v205
   Handles warehouse invalidations without triggering the global cloud-sync path.
   Reuses the existing warehouse loaders/render pipeline to keep this migration low-risk. */
(function(global){
  'use strict';

  const SOURCES=new Set([
    'tents','hardware','inventory','pala_warehouse_categories',
    'tent_wet_status','tent_parts','booking_tents','booking_inventory'
  ]);
  let queued=false;
  let running=false;
  let rerun=false;

  function warehouseVisible(){
    return !!document.querySelector('.warehouse-root-list-v183,.warehouse-tabs');
  }

  async function refreshWarehouse(){
    if(running){rerun=true;return;}
    running=true;
    try{
      if(typeof global.loadWarehouseExtensions==='function')await global.loadWarehouseExtensions();
      else if(typeof global.reloadData==='function')await global.reloadData();
      else return false;

      if(warehouseVisible()&&typeof global.showTents==='function'){
        await global.showTents(typeof global.warehouseViewFilter==='string'?global.warehouseViewFilter:'tents',true);
      }
      return true;
    }catch(error){
      console.warn('[PALA Realtime] warehouse refresh failed',error);
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
      const handled=await refreshWarehouse();
      if(!handled&&typeof global.scheduleCloudSync==='function')global.scheduleCloudSync();
    },80);
  }

  function register(){
    const realtime=global.PALARealtime;
    if(!realtime||typeof realtime.on!=='function')return false;
    SOURCES.forEach(source=>realtime.on(source,()=>{queueRefresh();return true;}));
    global.__palaWarehouseRealtimeV205=true;
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
