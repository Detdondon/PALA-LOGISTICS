/* PALA performance baseline v270 · passive persisted diagnostics */
(function(global){
  'use strict';
  if(global.PALAPerformance)return;

  const marks=[];
  const longTasks=[];
  const STORAGE_KEY='pala_perf_latest_v270';
  const PREVIOUS_KEY='pala_perf_previous_v270';
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

  function persist(){
    try{
      const previous=localStorage.getItem(STORAGE_KEY);
      if(previous)localStorage.setItem(PREVIOUS_KEY,previous);
      const current=snapshot();
      localStorage.setItem(STORAGE_KEY,JSON.stringify(current));
      return current;
    }catch(_){return snapshot();}
  }

  function previous(){
    try{return JSON.parse(localStorage.getItem(PREVIOUS_KEY)||'null');}catch(_){return null;}
  }

  function compare(){
    const before=previous(),after=snapshot();
    if(!before?.navigation||!after?.navigation)return {before,after,diff:null};
    return {
      before,
      after,
      diff:{
        domInteractive:after.navigation.domInteractive-before.navigation.domInteractive,
        domContentLoaded:after.navigation.domContentLoaded-before.navigation.domContentLoaded,
        load:after.navigation.load-before.navigation.load,
        resourceCount:(after.resources?.count||0)-(before.resources?.count||0),
        transferSize:(after.resources?.transferSize||0)-(before.resources?.transferSize||0)
      }
    };
  }

  global.addEventListener('DOMContentLoaded',()=>mark('dom-content-loaded'),{once:true});
  global.addEventListener('load',()=>{mark('window-load');setTimeout(persist,250);},{once:true});
  global.addEventListener('pala:cache-ready',event=>mark('cache-ready',event.detail),{once:true});
  global.addEventListener('pala:cached-state-visible',()=>mark('cached-state-visible'),{once:true});
  mark('instrumentation-ready');

  global.PALAPerformance={mark,snapshot,persist,previous,compare};
})(window);
