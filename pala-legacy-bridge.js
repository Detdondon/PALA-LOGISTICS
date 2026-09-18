/* PALA legacy data bridge v263 · complete central-state snapshot */
(function(global){
  'use strict';try{global.palaSupabase=sb;}catch(_){}
  function upsertArray(rows,row){if(!Array.isArray(rows)||!row||row.id==null)return false;const i=rows.findIndex(x=>String(x.id)===String(row.id));if(i>=0)rows[i]={...rows[i],...row};else rows.push(row);return true;}
  function removeArray(rows,id){if(!Array.isArray(rows)||id==null)return false;const i=rows.findIndex(x=>String(x.id)===String(id));if(i>=0){rows.splice(i,1);return true;}return false;}
  function apply(table,payload){const event=String(payload?.eventType||'').toUpperCase(),row=event==='DELETE'?payload?.old:payload?.new,id=row?.id;if(id==null)return false;try{if(table==='tents'){if(event==='DELETE')delete tents[id];else tents[id]={...(tents[id]||{}),...row,hardware:tents[id]?.hardware||[]};return true;}if(table==='hardware'){if(payload?.old?.tent_id!=null&&tents[payload.old.tent_id]?.hardware)removeArray(tents[payload.old.tent_id].hardware,id);Object.values(tents).forEach(t=>removeArray(t?.hardware,id));if(event!=='DELETE'&&row.tent_id!=null&&tents[row.tent_id])upsertArray(tents[row.tent_id].hardware,row);return true;}const target={inventory,bookings,staffing_shifts:staffingShifts,staffing_assignments:staffingAssignments,employees,workshop_jobs:workshopJobs,tent_workshop_tasks:workshopTasks}[table];if(!target)return false;return event==='DELETE'?removeArray(target,id):upsertArray(target,row);}catch(error){console.warn('[PALA] legacy bridge failed',table,error);return false;}}
  function snapshot(){
    const tentRows=Object.values(tents||{});
    const hardwareRows=[];
    tentRows.forEach(tent=>{if(Array.isArray(tent?.hardware))tent.hardware.forEach(row=>hardwareRows.push(row));});
    return {tents:tentRows,hardware:hardwareRows,inventory:[...(inventory||[])],bookings:[...(bookings||[])],staffingShifts:[...(staffingShifts||[])],staffingAssignments:[...(staffingAssignments||[])],employees:[...(employees||[])],workshopJobs:[...(workshopJobs||[])],workshopTasks:[...(workshopTasks||[])]};
  }
  function syncState(source='legacy'){const state=global.PALA_STATE;if(!state)return false;const data=snapshot();Object.entries(data).forEach(([name,rows])=>state.replace(name,rows,{source}));return true;}
  try{const originalReload=reloadData;global.reloadData=async function(){const result=await originalReload.apply(this,arguments);syncState('network');return result;};}catch(_){}
  global.PALALegacyBridge={apply,snapshot,syncState};
})(window);
