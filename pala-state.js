/* PALA central state v207
   Lightweight normalized in-memory state. Existing globals remain authoritative during migration. */
(function(global){
  'use strict';
  if(global.PALA_STATE)return;

  const TABLES=['tents','hardware','inventory','warehouseCategories','bookings','staffingShifts','staffingAssignments','employees','workshopJobs','workshopTasks'];
  const maps=Object.create(null);
  const listeners=new Set();
  TABLES.forEach(name=>maps[name]=new Map());

  function idOf(row){return row&&row.id!=null?String(row.id):null;}
  function replace(name,rows){
    const map=maps[name];if(!map)return;
    map.clear();
    (Array.isArray(rows)?rows:[]).forEach(row=>{const id=idOf(row);if(id!==null)map.set(id,row);});
    emit(name,'replace');
  }
  function upsert(name,row){
    const map=maps[name],id=idOf(row);if(!map||id===null)return false;
    map.set(id,{...(map.get(id)||{}),...row});emit(name,'upsert',id);return true;
  }
  function remove(name,id){
    const map=maps[name];if(!map||id==null)return false;
    const changed=map.delete(String(id));if(changed)emit(name,'remove',String(id));return changed;
  }
  function emit(name,type,id){
    const detail={name,type,id};
    listeners.forEach(fn=>{try{fn(detail)}catch(_){}});
    try{global.dispatchEvent(new CustomEvent('pala:state-change',{detail}))}catch(_){}
  }
  function hydrate(){
    TABLES.forEach(name=>{
      try{
        const rows=global[name];
        if(Array.isArray(rows))replace(name,rows);
      }catch(_){}
    });
  }
  function get(name,id){return maps[name]?.get(String(id));}
  function all(name){return maps[name]?[...maps[name].values()]:[];}
  function subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}

  global.PALA_STATE={maps,get,all,replace,upsert,remove,hydrate,subscribe};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrate,{once:true});
  else queueMicrotask(hydrate);
  global.addEventListener('pala:data-change',()=>queueMicrotask(hydrate));
})(window);
