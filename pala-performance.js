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
