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
