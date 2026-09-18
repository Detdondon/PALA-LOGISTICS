/* PALA offline mutation queue v267 · conflict-aware persistent queue */
(function(global){
  'use strict';
  if(global.PALAOfflineQueue||!('indexedDB'in global))return;

  const DB='pala-offline',STORE='queue',VERSION=1;
  const handlers=new Map();
  let dbPromise=null,flushing=false;

  function db(){
    return dbPromise||(dbPromise=new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB,VERSION);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error);
    }));
  }

  async function all(){
    const d=await db();
    return new Promise((resolve,reject)=>{
      const r=d.transaction(STORE,'readonly').objectStore(STORE).getAll();
      r.onsuccess=()=>resolve((r.result||[]).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)));
      r.onerror=()=>reject(r.error);
    });
  }

  async function put(item){
    const d=await db();
    return new Promise((resolve,reject)=>{
      const r=d.transaction(STORE,'readwrite').objectStore(STORE).put(item);
      r.onsuccess=()=>resolve(item);
      r.onerror=()=>reject(r.error);
    });
  }

  async function remove(id){
    const d=await db();
    return new Promise((resolve,reject)=>{
      const r=d.transaction(STORE,'readwrite').objectStore(STORE).delete(id);
      r.onsuccess=()=>resolve();
      r.onerror=()=>reject(r.error);
    });
  }

  async function enqueue(type,payload,meta={}){
    const item={
      id:meta.id||crypto.randomUUID?.()||('pala-'+Date.now()+'-'+Math.random().toString(36).slice(2)),
      type:String(type),
      payload,
      entity:meta.entity||null,
      entityId:meta.entityId??null,
      baseVersion:meta.baseVersion??null,
      createdAt:Date.now(),
      attempts:0,
      status:'pending'
    };
    await put(item);
    try{global.dispatchEvent(new CustomEvent('pala:offline-queued',{detail:item}))}catch(_){}
    return item;
  }

  function register(type,handler){
    if(typeof handler!=='function')return()=>{};
    handlers.set(String(type),handler);
    return()=>handlers.delete(String(type));
  }

  async function resolve(id,action,payload){
    const items=await all(),item=items.find(x=>x.id===id);
    if(!item)return false;
    if(action==='discard'){await remove(id);return true;}
    if(action==='retry'){
      item.status='pending';item.lastError=null;item.remote=null;
      if(payload!==undefined)item.payload=payload;
      await put(item);if(navigator.onLine)setTimeout(flush,0);return true;
    }
    if(action==='overwrite'){
      item.status='pending';item.force=true;item.lastError=null;item.remote=null;
      if(payload!==undefined)item.payload=payload;
      await put(item);if(navigator.onLine)setTimeout(flush,0);return true;
    }
    return false;
  }

  async function flush(){
    if(flushing||!navigator.onLine)return false;
    flushing=true;
    try{
      const items=await all();
      for(const item of items){
        if(item.status==='conflict')continue;
        const handler=handlers.get(item.type);
        if(!handler)continue;
        try{
          const result=await handler(item.payload,item);
          if(result&&result.conflict){
            item.status='conflict';
            item.remote=result.remote??null;
            item.lastError=result.message||'Konflikt med en nyere ændring';
            item.lastAttemptAt=Date.now();
            await put(item);
            try{global.dispatchEvent(new CustomEvent('pala:offline-conflict',{detail:item}))}catch(_){}
            continue;
          }
          await remove(item.id);
          try{global.dispatchEvent(new CustomEvent('pala:offline-committed',{detail:{item,result}}))}catch(_){}
        }catch(error){
          item.attempts=(item.attempts||0)+1;
          item.lastError=String(error?.message||error||'Ukendt fejl');
          item.lastAttemptAt=Date.now();
          item.status='pending';
          await put(item);
          break;
        }
      }
      return true;
    }finally{flushing=false;}
  }

  async function stats(){
    const items=await all();
    return {
      total:items.length,
      pending:items.filter(x=>x.status!=='conflict').length,
      conflicts:items.filter(x=>x.status==='conflict').length
    };
  }

  register('rpc',async(payload,item)=>{
    const client=global.palaSupabase||global.sb||global.supabaseClient;
    if(!client||typeof client.rpc!=='function')throw new Error('Supabase-klienten er ikke klar');
    const result=await client.rpc(payload?.name,payload?.args||{});
    if(result?.error){
      const message=String(result.error.message||result.error);
      if(/conflict|stale|version|newer/i.test(message))return {conflict:true,message,remote:null};
      throw new Error(message);
    }
    return result?.data;
  });

  global.addEventListener('online',()=>setTimeout(flush,250));
  global.PALAOfflineQueue={enqueue,register,flush,all,resolve,stats};
})(window);
