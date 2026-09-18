/* PALA legacy data bridge v270 · cache hydration + central-state sync */
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
    try{global.palaSupabase=sb;}catch(_){}
    const current=global.reloadData;
    if(typeof current!=='function')return false;
    if(current.__palaStateWrapped)return true;

    let inFlight=null;
    const wrapped=function(){
      if(inFlight)return inFlight;
      const self=this,args=arguments;
      try{global.PALAPerformance?.mark?.('reload-start');}catch(_){}
      inFlight=Promise.resolve(current.apply(self,args)).then(result=>{
        syncState('network');
        try{global.PALAPerformance?.mark?.('reload-end');}catch(_){}
        return result;
      }).finally(()=>{inFlight=null;});
      return inFlight;
    };
    wrapped.__palaStateWrapped=true;
    wrapped.__palaOriginalReload=current;
    global.reloadData=wrapped;
    return true;
  }

  global.PALALegacyBridge={apply,snapshot,syncState,hydrateLegacyFromState,installReloadWrapper};
})(window);
