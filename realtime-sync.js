/* PALA Realtime sync bridge v208
   Direct table subscriptions update PALA_STATE record-by-record.
   pala_sync_events remains the compatibility/fallback invalidation stream. */
(function(global){
  'use strict';

  let channel=null;
  let refreshTimer=null;
  let started=false;
  let lastEventId=null;
  const pendingSources=new Set();
  const handlers=new Map();
  const directTables={
    tents:'tents',hardware:'hardware',inventory:'inventory',bookings:'bookings',
    staffing_shifts:'staffingShifts',staffing_assignments:'staffingAssignments',
    employees:'employees',workshop_jobs:'workshopJobs',tent_workshop_tasks:'workshopTasks'
  };

  function on(source,handler){
    if(typeof handler!=='function')return ()=>{};
    const key=String(source||'*');
    if(!handlers.has(key))handlers.set(key,new Set());
    handlers.get(key).add(handler);
    return ()=>handlers.get(key)?.delete(handler);
  }

  function runHandlers(sources,detail={}){
    let handled=false;
    for(const source of sources){
      const callbacks=[...(handlers.get(source)||[]),...(handlers.get('*')||[])];
      for(const callback of callbacks){
        try{if(callback({source,sources,...detail})!==false)handled=true}catch(error){console.warn('[PALA Realtime] targeted handler failed',source,error)}
      }
    }
    return handled;
  }

  function applyRecord(table,payload){
    const stateName=directTables[table];
    const state=global.PALA_STATE;
    if(!stateName||!state)return false;
    const event=String(payload?.eventType||'').toUpperCase();
    const row=event==='DELETE'?payload?.old:payload?.new;
    const id=row&&row.id;
    if(id==null)return false;
    if(event==='DELETE')state.remove(stateName,id);
    else state.upsert(stateName,row);
    const detail={table,event,row,id:String(id),direct:true};
    try{global.dispatchEvent(new CustomEvent('pala:record-change',{detail}))}catch(_){}
    runHandlers([table],detail);
    return true;
  }

  function scheduleRefresh(source){
    if(source)pendingSources.add(String(source));
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{
      const sources=[...pendingSources];
      pendingSources.clear();
      try{
        global.dispatchEvent(new CustomEvent('pala:data-change',{detail:{sources}}));
        if(runHandlers(sources))return;
        if(typeof global.scheduleCloudSync==='function')global.scheduleCloudSync();
      }catch(error){console.warn('[PALA Realtime] sync refresh failed',error)}
    },120);
  }

  function start(){
    if(started)return;
    const client=global.sb||global.supabaseClient||global.palaSupabase;
    if(!client||typeof client.channel!=='function'||client.__palaLite)return;

    started=true;
    channel=client.channel('pala-sync-v208');
    Object.keys(directTables).forEach(table=>{
      channel.on('postgres_changes',{event:'*',schema:'public',table},payload=>applyRecord(table,payload));
    });
    channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'pala_sync_events'},payload=>{
      const row=payload&&payload.new;
      if(row&&row.id!=null){const id=String(row.id);if(id===lastEventId)return;lastEventId=id;}
      const source=row&&row.source;
      // Directly subscribed tables already delivered the changed record; avoid a second broad reload.
      if(source&&directTables[source])return;
      scheduleRefresh(source);
    }).subscribe(status=>{
      global.__palaRealtimeStatus=status;
      if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')started=false;
    });
    global.__palaRealtimeChannel=channel;
  }

  function stop(){
    clearTimeout(refreshTimer);refreshTimer=null;pendingSources.clear();
    if(channel){const client=global.sb||global.supabaseClient||global.palaSupabase;try{client&&client.removeChannel?client.removeChannel(channel):channel.unsubscribe?.()}catch(_){}}
    channel=null;started=false;
  }
  function boot(){start();if(!started)setTimeout(start,1000);if(!started)setTimeout(start,3000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  global.PALARealtime={start,stop,on,get status(){return global.__palaRealtimeStatus||'IDLE';}};
})(window);
