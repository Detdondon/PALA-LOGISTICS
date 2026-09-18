/* PALA core runtime bundle v266 · cache-first state, optimistic UI and offline queue */

/* --- pala-performance.js --- */
/* PALA performance baseline v263 · passive diagnostics only */
(function(global){
  'use strict';
  if(global.PALAPerformance)return;

  const marks=[];
  const longTasks=[];
  const now=()=>Math.round(performance.now()*10)/10;

  function mark(name,detail){
    marks.push({name,time:now(),detail:detail||null});
    try{performance.mark('pala:'+name)}catch(_){}
  }

  try{
    if('PerformanceObserver'in global){
      const observer=new PerformanceObserver(list=>{
        list.getEntries().forEach(entry=>{
          longTasks.push({start:Math.round(entry.startTime),duration:Math.round(entry.duration)});
          if(longTasks.length>50)longTasks.shift();
        });
      });
      observer.observe({type:'longtask',buffered:true});
    }
  }catch(_){}

  function snapshot(){
    const nav=performance.getEntriesByType('navigation')[0];
    const resources=performance.getEntriesByType('resource');
    const paints=performance.getEntriesByType('paint');
    const transferred=resources.reduce((sum,r)=>sum+(Number(r.transferSize)||0),0);
    return {
      at:new Date().toISOString(),
      navigation:nav?{
        domInteractive:Math.round(nav.domInteractive),
        domContentLoaded:Math.round(nav.domContentLoadedEventEnd),
        load:Math.round(nav.loadEventEnd),
        response:Math.round(nav.responseEnd),
        transferSize:Number(nav.transferSize)||0
      }:null,
      paints:Object.fromEntries(paints.map(p=>[p.name,Math.round(p.startTime)])),
      resources:{count:resources.length,transferSize:transferred},
      longTasks:[...longTasks],
      marks:[...marks],
      state:global.PALA_STATE?Object.fromEntries(Object.keys(global.PALA_STATE.maps||{}).map(name=>[name,global.PALA_STATE.size(name)])):null
    };
  }

  global.addEventListener('DOMContentLoaded',()=>mark('dom-content-loaded'),{once:true});
  global.addEventListener('load',()=>mark('window-load'),{once:true});
  global.addEventListener('pala:cache-ready',event=>mark('cache-ready',event.detail),{once:true});
  global.addEventListener('pala:cached-state-visible',()=>mark('cached-state-visible'),{once:true});
  mark('instrumentation-ready');

  global.PALAPerformance={mark,snapshot};
})(window);

;

/* --- pala-legacy-bridge.js --- */
/* PALA legacy data bridge v266 · cache hydration + central-state sync */
(function(global){
  'use strict';
  try{global.palaSupabase=sb;}catch(_){}

  function upsertArray(rows,row){
    if(!Array.isArray(rows)||!row||row.id==null)return false;
    const i=rows.findIndex(x=>String(x.id)===String(row.id));
    if(i>=0)rows[i]={...rows[i],...row};else rows.push(row);
    return true;
  }

  function removeArray(rows,id){
    if(!Array.isArray(rows)||id==null)return false;
    const i=rows.findIndex(x=>String(x.id)===String(id));
    if(i>=0){rows.splice(i,1);return true;}
    return false;
  }

  function apply(table,payload){
    const event=String(payload?.eventType||'').toUpperCase(),row=event==='DELETE'?payload?.old:payload?.new,id=row?.id;
    if(id==null)return false;
    try{
      if(table==='tents'){
        if(event==='DELETE')delete tents[id];
        else tents[id]={...(tents[id]||{}),...row,hardware:tents[id]?.hardware||[]};
        return true;
      }
      if(table==='hardware'){
        if(payload?.old?.tent_id!=null&&tents[payload.old.tent_id]?.hardware)removeArray(tents[payload.old.tent_id].hardware,id);
        Object.values(tents).forEach(t=>removeArray(t?.hardware,id));
        if(event!=='DELETE'&&row.tent_id!=null&&tents[row.tent_id])upsertArray(tents[row.tent_id].hardware,row);
        return true;
      }
      const target={inventory,bookings,staffing_shifts:staffingShifts,staffing_assignments:staffingAssignments,employees,workshop_jobs:workshopJobs,tent_workshop_tasks:workshopTasks}[table];
      if(!target)return false;
      return event==='DELETE'?removeArray(target,id):upsertArray(target,row);
    }catch(error){
      console.warn('[PALA] legacy bridge failed',table,error);
      return false;
    }
  }

  function snapshot(){
    const tentRows=Object.values(tents||{});
    const hardwareRows=[];
    tentRows.forEach(tent=>{if(Array.isArray(tent?.hardware))tent.hardware.forEach(row=>hardwareRows.push(row));});
    return {
      tents:tentRows,
      hardware:hardwareRows,
      inventory:[...(inventory||[])],
      warehouseCategories:Array.isArray(global.warehouseCategories)?[...global.warehouseCategories]:[],
      bookings:[...(bookings||[])],
      staffingShifts:[...(staffingShifts||[])],
      staffingAssignments:[...(staffingAssignments||[])],
      employees:[...(employees||[])],
      workshopJobs:[...(workshopJobs||[])],
      workshopTasks:[...(workshopTasks||[])]
    };
  }

  function syncState(source='legacy'){
    const state=global.PALA_STATE;if(!state)return false;
    const data=snapshot();
    Object.entries(data).forEach(([name,rows])=>state.replace(name,rows,{source}));
    return true;
  }

  function hydrateLegacyFromState(){
    const state=global.PALA_STATE;
    if(!state||!state.size('tents'))return false;
    try{
      const nextTents={};
      state.all('tents').forEach(row=>{nextTents[row.id]={...row,hardware:[]};});
      state.all('hardware').forEach(row=>{if(nextTents[row.tent_id])nextTents[row.tent_id].hardware.push({...row});});
      tents=nextTents;

      if(state.size('inventory'))inventory=state.all('inventory').map(row=>({...row}));
      if(state.size('bookings'))bookings=state.all('bookings').map(row=>({...row}));
      if(state.size('staffingShifts'))staffingShifts=state.all('staffingShifts').map(row=>({...row}));
      if(state.size('staffingAssignments'))staffingAssignments=state.all('staffingAssignments').map(row=>({...row}));
      if(state.size('employees'))employees=state.all('employees').map(row=>({...row}));
      if(state.size('workshopJobs'))workshopJobs=state.all('workshopJobs').map(row=>({...row}));
      if(state.size('workshopTasks'))workshopTasks=state.all('workshopTasks').map(row=>({...row}));

      const categories=state.all('warehouseCategories');
      if(categories.length){
        try{warehouseCategories=categories.map(row=>({...row}));}catch(_){}
        global.warehouseCategories=categories.map(row=>({...row}));
      }

      try{if(typeof rebuildDataIndexes==='function')rebuildDataIndexes();}catch(_){}
      try{if(typeof rebuildWarehouseIndexes==='function')rebuildWarehouseIndexes();}catch(_){}
      global.__palaLegacyHydratedFromCache=true;
      return true;
    }catch(error){
      console.warn('[PALA] cached legacy hydration failed',error);
      return false;
    }
  }

  function installReloadWrapper(){
    const current=global.reloadData;
    if(typeof current!=='function')return false;
    if(current.__palaStateWrapped)return true;
    const wrapped=async function(){
      const result=await current.apply(this,arguments);
      syncState('network');
      return result;
    };
    wrapped.__palaStateWrapped=true;
    wrapped.__palaOriginalReload=current;
    global.reloadData=wrapped;
    return true;
  }

  global.PALALegacyBridge={apply,snapshot,syncState,hydrateLegacyFromState,installReloadWrapper};
})(window);

;

/* --- pala-state.js --- */
/* PALA central state v225 */
(function(global){
  'use strict';if(global.PALA_STATE)return;
  const TABLES=['tents','hardware','inventory','warehouseCategories','bookings','staffingShifts','staffingAssignments','employees','workshopJobs','workshopTasks'],maps=Object.create(null),listeners=new Set();TABLES.forEach(name=>maps[name]=new Map());
  function idOf(row){return row&&row.id!=null?String(row.id):null;}
  function emit(name,type,id,source){const detail={name,type,id,source:source||'runtime'};listeners.forEach(fn=>{try{fn(detail)}catch(_){}});try{global.dispatchEvent(new CustomEvent('pala:state-change',{detail}))}catch(_){}}
  function replace(name,rows,options={}){const map=maps[name];if(!map||!Array.isArray(rows))return false;if(options.onlyIfEmpty&&map.size)return false;map.clear();rows.forEach(row=>{const id=idOf(row);if(id!==null)map.set(id,row);});emit(name,'replace',null,options.source);return true;}
  function upsert(name,row,options={}){const map=maps[name],id=idOf(row);if(!map||id===null)return false;map.set(id,{...(map.get(id)||{}),...row});emit(name,'upsert',id,options.source);return true;}
  function remove(name,id,options={}){const map=maps[name];if(!map||id==null)return false;const key=String(id),changed=map.delete(key);if(changed)emit(name,'remove',key,options.source);return changed;}
  function hydrate(options={}){let changed=0;TABLES.forEach(name=>{try{const rows=global[name];if(Array.isArray(rows)&&replace(name,rows,{source:options.source||'legacy',onlyIfEmpty:!!options.onlyIfEmpty}))changed++;}catch(_){}});return changed;}
  function get(name,id){return maps[name]?.get(String(id));}function all(name){return maps[name]?[...maps[name].values()]:[];}function size(name){return maps[name]?.size||0;}function subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}
  global.PALA_STATE={maps,get,all,size,replace,upsert,remove,hydrate,subscribe};
  function boot(){if(global.PALALegacyBridge?.syncState)global.PALALegacyBridge.syncState('startup');else hydrate({source:'startup',onlyIfEmpty:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
})(window);

;

/* --- pala-cache.js --- */
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

;

/* --- pala-optimistic.js --- */
/* PALA optimistic state helper v266 · rollback + offline queue support */
(function(global){
  'use strict';

  async function mutate(options){
    const state=global.PALA_STATE;
    if(!state)throw new Error('PALA_STATE unavailable');

    const {name,id,next,commit,apply,rollback,render,offline}=options||{};
    if(!name||id==null||typeof commit!=='function')throw new Error('Invalid optimistic mutation');

    const key=String(id),previous=state.get(name,key);
    if(next==null)state.remove(name,key,{source:'optimistic'});
    else state.upsert(name,{...(previous||{}),...next,id:next.id??id},{source:'optimistic'});

    try{if(typeof apply==='function')apply({previous,next,id:key});}catch(_){}
    try{if(typeof render==='function')render();}catch(_){}

    if(!navigator.onLine&&offline?.type&&global.PALAOfflineQueue){
      const queued=await global.PALAOfflineQueue.enqueue(offline.type,offline.payload??next,{
        entity:name,
        entityId:key,
        baseVersion:offline.baseVersion??previous?.updated_at??previous?.version??null
      });
      try{global.dispatchEvent(new CustomEvent('pala:optimistic-queued',{detail:{name,id:key,queued}}))}catch(_){}
      return {queued:true,offline:true,item:queued};
    }

    try{
      const result=await commit();
      const confirmed=result&&result.data?(Array.isArray(result.data)?result.data[0]:result.data):null;
      if(confirmed&&typeof confirmed==='object')state.upsert(name,confirmed,{source:'network'});
      try{if(typeof render==='function')render();}catch(_){}
      try{global.dispatchEvent(new CustomEvent('pala:optimistic-commit',{detail:{name,id:key}}))}catch(_){}
      return result;
    }catch(error){
      if(previous)state.upsert(name,previous,{source:'rollback'});
      else state.remove(name,key,{source:'rollback'});
      try{if(typeof rollback==='function')rollback({previous,next,id:key,error});}catch(_){}
      try{if(typeof render==='function')render();}catch(_){}
      try{global.dispatchEvent(new CustomEvent('pala:optimistic-rollback',{detail:{name,id:key,error}}))}catch(_){}
      throw error;
    }
  }

  global.PALAOptimistic={mutate};
})(window);

;

/* --- pala-offline-queue.js --- */
/* PALA offline mutation queue v266 · conflict-aware persistent queue */
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

  global.addEventListener('online',()=>setTimeout(flush,250));
  global.PALAOfflineQueue={enqueue,register,flush,all,resolve,stats};
})(window);

;
