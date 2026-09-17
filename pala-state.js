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
