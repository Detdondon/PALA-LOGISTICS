/* PALA IndexedDB cache v263 · cache-first startup + batched persistence */
(function(global){
  'use strict';
  if(!('indexedDB'in global))return;
  const DB='pala-cache',STORE='state',VERSION=1,NAMES=['tents','hardware','inventory','warehouseCategories','bookings','staffingShifts','staffingAssignments','employees','workshopJobs','workshopTasks'];
  const pending=new Set();let dbPromise=null,restoring=false,flushTimer=null;

  function db(){
    return dbPromise||(dbPromise=new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB,VERSION);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error);
    }));
  }

  async function read(name){
    const d=await db();
    return new Promise((resolve,reject)=>{
      const r=d.transaction(STORE,'readonly').objectStore(STORE).get(name);
      r.onsuccess=()=>{
        const value=r.result;
        if(Array.isArray(value))return resolve(value);
        resolve(Array.isArray(value?.rows)?value.rows:[]);
      };
      r.onerror=()=>reject(r.error);
    });
  }

  async function flush(){
    clearTimeout(flushTimer);flushTimer=null;
    if(restoring||!pending.size)return;
    const names=[...pending];pending.clear();
    const state=global.PALA_STATE;if(!state)return;
    try{
      const d=await db();
      await new Promise((resolve,reject)=>{
        const tx=d.transaction(STORE,'readwrite');
        const store=tx.objectStore(STORE);
        const savedAt=Date.now();
        names.forEach(name=>store.put({savedAt,rows:state.all(name)},name));
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      });
    }catch(error){
      console.warn('[PALA Cache] batch write failed',error);
      names.forEach(name=>pending.add(name));
    }
  }

  async function restore(){
    const state=global.PALA_STATE;if(!state)return false;
    restoring=true;let restored=0;
    await Promise.all(NAMES.map(async name=>{
      try{
        const rows=await read(name);
        if(rows.length&&!state.size(name)){
          state.replace(name,rows,{source:'cache',onlyIfEmpty:true});
          restored+=rows.length;
        }
      }catch(_){}
    }));
    restoring=false;
    global.__palaCacheRestored=true;
    try{global.dispatchEvent(new CustomEvent('pala:cache-ready',{detail:{restored}}))}catch(_){}
    return restored>0;
  }

  function save(name){
    if(restoring||!NAMES.includes(name))return;
    pending.add(name);
    clearTimeout(flushTimer);
    flushTimer=setTimeout(flush,180);
  }

  async function boot(){
    const hadCache=await restore().catch(()=>false);
    global.PALA_STATE?.subscribe(detail=>save(detail?.name));
    if(hadCache)try{global.dispatchEvent(new CustomEvent('pala:cached-state-visible'))}catch(_){}
  }

  global.addEventListener('pagehide',()=>{if(pending.size)flush();});
  global.__palaCacheReady=boot();
  global.PALACache={restore,save,flush,ready:global.__palaCacheReady};
})(window);
