/* PALA Realtime sync bridge v204
   Routes database invalidations by source so feature modules can refresh only what changed.
   The existing broad cloud sync remains a safe fallback until each feature has a targeted handler. */
(function(global){
  'use strict';

  let channel=null;
  let refreshTimer=null;
  let started=false;
  let lastEventId=null;
  const pendingSources=new Set();
  const handlers=new Map();

  function on(source,handler){
    if(typeof handler!=='function')return ()=>{};
    const key=String(source||'*');
    if(!handlers.has(key))handlers.set(key,new Set());
    handlers.get(key).add(handler);
    return ()=>handlers.get(key)?.delete(handler);
  }

  function runHandlers(sources){
    let handled=false;
    for(const source of sources){
      const callbacks=[...(handlers.get(source)||[]),...(handlers.get('*')||[])];
      for(const callback of callbacks){
        try{if(callback({source,sources})!==false)handled=true}catch(error){console.warn('[PALA Realtime] targeted handler failed',source,error)}
      }
    }
    return handled;
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
      }catch(error){
        console.warn('[PALA Realtime] sync refresh failed',error);
      }
    },120);
  }

  function start(){
    if(started)return;
    const client=global.sb||global.supabaseClient||global.palaSupabase;
    if(!client||typeof client.channel!=='function')return;
    if(client.__palaLite)return;

    started=true;
    channel=client
      .channel('pala-sync-v204')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'pala_sync_events'},payload=>{
        const row=payload&&payload.new;
        if(row&&row.id!=null){
          const id=String(row.id);
          if(id===lastEventId)return;
          lastEventId=id;
        }
        scheduleRefresh(row&&row.source);
      })
      .subscribe(status=>{
        global.__palaRealtimeStatus=status;
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')started=false;
      });

    global.__palaRealtimeChannel=channel;
  }

  function stop(){
    clearTimeout(refreshTimer);
    refreshTimer=null;
    pendingSources.clear();
    if(channel){
      const client=global.sb||global.supabaseClient||global.palaSupabase;
      try{client&&client.removeChannel?client.removeChannel(channel):channel.unsubscribe?.()}catch(_){ }
    }
    channel=null;
    started=false;
  }

  function boot(){
    start();
    if(!started)setTimeout(start,1000);
    if(!started)setTimeout(start,3000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  global.PALARealtime={
    start,stop,on,
    get status(){return global.__palaRealtimeStatus||'IDLE';}
  };
})(window);
