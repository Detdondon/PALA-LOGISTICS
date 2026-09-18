/* PALA central state v270 · change-aware record store */
(function(global){
  'use strict';
  if(global.PALA_STATE)return;

  const TABLES=['tents','hardware','inventory','warehouseCategories','bookings','staffingShifts','staffingAssignments','employees','workshopJobs','workshopTasks'];
  const maps=Object.create(null),listeners=new Set();
  TABLES.forEach(name=>maps[name]=new Map());
  let revision=0;

  function idOf(row){return row&&row.id!=null?String(row.id):null;}

  function shallowEqual(a,b){
    if(a===b)return true;
    if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
    const ak=Object.keys(a),bk=Object.keys(b);
    if(ak.length!==bk.length)return false;
    for(const key of ak)if(a[key]!==b[key])return false;
    return true;
  }

  function emit(name,type,id,source){
    revision++;
    const detail={name,type,id,source:source||'runtime',revision};
    listeners.forEach(fn=>{try{fn(detail)}catch(_){}});
    try{global.dispatchEvent(new CustomEvent('pala:state-change',{detail}))}catch(_){}
  }

  function replace(name,rows,options={}){
    const map=maps[name];
    if(!map||!Array.isArray(rows))return false;
    if(options.onlyIfEmpty&&map.size)return false;

    if(!options.force&&map.size===rows.length){
      let same=true;
      for(const row of rows){
        const id=idOf(row);
        if(id===null||!shallowEqual(map.get(id),row)){same=false;break;}
      }
      if(same)return false;
    }

    map.clear();
    rows.forEach(row=>{const id=idOf(row);if(id!==null)map.set(id,row);});
    emit(name,'replace',null,options.source);
    return true;
  }

  function upsert(name,row,options={}){
    const map=maps[name],id=idOf(row);
    if(!map||id===null)return false;
    const next={...(map.get(id)||{}),...row};
    if(!options.force&&shallowEqual(map.get(id),next))return false;
    map.set(id,next);
    emit(name,'upsert',id,options.source);
    return true;
  }

  function remove(name,id,options={}){
    const map=maps[name];
    if(!map||id==null)return false;
    const key=String(id),changed=map.delete(key);
    if(changed)emit(name,'remove',key,options.source);
    return changed;
  }

  function hydrate(options={}){
    let changed=0;
    TABLES.forEach(name=>{
      try{
        const rows=global[name];
        if(Array.isArray(rows)&&replace(name,rows,{source:options.source||'legacy',onlyIfEmpty:!!options.onlyIfEmpty}))changed++;
      }catch(_){}
    });
    return changed;
  }

  function get(name,id){return maps[name]?.get(String(id));}
  function all(name){return maps[name]?[...maps[name].values()]:[];}
  function size(name){return maps[name]?.size||0;}
  function snapshot(){return Object.fromEntries(TABLES.map(name=>[name,all(name)]));}
  function subscribe(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}

  global.PALA_STATE={
    maps,get,all,size,replace,upsert,remove,hydrate,snapshot,subscribe,
    get revision(){return revision;}
  };

  function boot(){
    if(global.PALALegacyBridge?.syncState)global.PALALegacyBridge.syncState('startup');
    else hydrate({source:'startup',onlyIfEmpty:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else queueMicrotask(boot);
})(window);
