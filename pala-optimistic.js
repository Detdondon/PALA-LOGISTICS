/* PALA optimistic state helper v215
   Feature code can update UI/state immediately, then commit remotely and rollback on failure. */
(function(global){
  'use strict';
  async function mutate(options){
    const state=global.PALA_STATE;
    if(!state)throw new Error('PALA_STATE unavailable');
    const {name,id,next,commit}=options||{};
    if(!name||id==null||typeof commit!=='function')throw new Error('Invalid optimistic mutation');
    const key=String(id),previous=state.get(name,key);
    if(next==null)state.remove(name,key);else state.upsert(name,{...(previous||{}),...next,id:next.id??id});
    try{
      const result=await commit();
      const confirmed=result&&result.data?(Array.isArray(result.data)?result.data[0]:result.data):null;
      if(confirmed)state.upsert(name,confirmed);
      try{global.dispatchEvent(new CustomEvent('pala:optimistic-commit',{detail:{name,id:key}}))}catch(_){}
      return result;
    }catch(error){
      if(previous)state.upsert(name,previous);else state.remove(name,key);
      try{global.dispatchEvent(new CustomEvent('pala:optimistic-rollback',{detail:{name,id:key,error}}))}catch(_){}
      throw error;
    }
  }
  global.PALAOptimistic={mutate};
})(window);
