/* PALA offline mutation queue v264 · opt-in foundation, no legacy writes are intercepted */
(function(global){
  'use strict';
  if(global.PALAOfflineQueue)return;
  if(!('indexedDB'in global))return;

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
    const item={id:meta.id||crypto.randomUUID?.()||('pala-'+Date.now()+'-'+Math.random().toString(36).slice(2)),type:String(type),payload,createdAt:Date.now(),attempts:0};
    await put(item);
    try{global.dispatchEvent(new CustomEvent('pala:offline-queued',{detail:item}))}catch(_){}
    return item;
  }

  function register(type,handler){
    if(typeof handler!=='function')return()=>{};
    handlers.set(String(type),handler);
    return()=>handlers.delete(String(type));
  }

  async function flush(){
    if(flushing||!navigator.onLine)return false;
    flushing=true;
    try{
      const items=await all();
      for(const item of items){
        const handler=handlers.get(item.type);
        if(!handler)continue;
        try{
          await handler(item.payload,item);
          await remove(item.id);
          try{global.dispatchEvent(new CustomEvent('pala:offline-committed',{detail:item}))}catch(_){}
        }catch(error){
          item.attempts=(item.attempts||0)+1;
          item.lastError=String(error?.message||error||'Ukendt fejl');
          item.lastAttemptAt=Date.now();
          await put(item);
          break;
        }
      }
      return true;
    }finally{flushing=false;}
  }

  global.addEventListener('online',()=>setTimeout(flush,250));
  global.PALAOfflineQueue={enqueue,register,flush,all};
})(window);
