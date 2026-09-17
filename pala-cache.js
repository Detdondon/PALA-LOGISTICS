/* PALA IndexedDB cache v214 · cache-first startup + debounced snapshots */
(function(global){
  'use strict';
  if(!('indexedDB'in global))return;
  const DB='pala-cache',STORE='state',VERSION=1,NAMES=['tents','hardware','inventory','bookings','staffingShifts','staffingAssignments','employees','workshopJobs','workshopTasks'];
  let dbPromise=null,saveTimer=null,restoring=false;
  function db(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}));}
  async function read(name){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(name);r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
  async function write(name,rows){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE,'readwrite').objectStore(STORE).put(rows,name);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
  async function restore(){
    const state=global.PALA_STATE;if(!state)return false;
    restoring=true;let restored=0;
    await Promise.all(NAMES.map(async name=>{try{const rows=await read(name);if(rows.length&&!state.all(name).length){state.replace(name,rows);restored+=rows.length;}}catch(_){}}));
    restoring=false;global.__palaCacheRestored=true;
    try{global.dispatchEvent(new CustomEvent('pala:cache-ready',{detail:{restored}}))}catch(_){}
    return restored>0;
  }
  function save(){if(restoring)return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const state=global.PALA_STATE;if(!state)return;NAMES.forEach(name=>write(name,state.all(name)).catch(()=>{}));},300);}
  async function boot(){
    const hadCache=await restore().catch(()=>false);
    global.PALA_STATE?.subscribe(save);
    global.addEventListener('pala:record-change',save);
    if(hadCache){
      try{global.dispatchEvent(new CustomEvent('pala:cached-state-visible'))}catch(_){}
    }
  }
  global.__palaCacheReady=boot();
  global.PALACache={restore,save,ready:global.__palaCacheReady};
})(window);
