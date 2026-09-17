/* PALA Realtime sync bridge v203
   Uses the existing pala_sync_events stream as a lightweight invalidation signal.
   Existing scheduleCloudSync remains the single refresh path and polling fallback. */
(function(global){
  'use strict';

  let channel=null;
  let refreshTimer=null;
  let started=false;
  let lastEventId=null;

  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{
      try{
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
      .channel('pala-sync-v203')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'pala_sync_events'},payload=>{
        const row=payload&&payload.new;
        if(row&&row.id!=null){
          const id=String(row.id);
          if(id===lastEventId)return;
          lastEventId=id;
        }
        scheduleRefresh();
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

  global.PALARealtime={start,stop,get status(){return global.__palaRealtimeStatus||'IDLE';}};
})(window);
