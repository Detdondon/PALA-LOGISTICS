const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function harness(){
  let next=0;
  const timers=new Map(),events=new Map(),channels=[],removed=[];
  const listen=(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);};
  const c={console,document:{readyState:'loading',hidden:false,activeElement:null,addEventListener:listen,querySelector:()=>({})},
    addEventListener:listen,dispatchEvent(){},CustomEvent:class{},
    setTimeout(fn){const id=++next;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)},
    requestAnimationFrame(fn){const id=++next;timers.set(id,fn);return id},setInterval(){return 0},clearInterval(){},
    cloudRefreshIsSafe:()=>true,
    sb:{from(){},channel(){const channel={callbacks:[],on(type,filter,fn){this.callbacks.push({filter,fn});return this},subscribe(fn){this.status=fn;return this}};channels.push(channel);return channel},removeChannel(channel){removed.push(channel);channel.status('CLOSED');return Promise.resolve('ok')}},
    PALA_STATE:{upsert(){},remove(){}},PALALegacyBridge:{apply:()=>true}
  };
  c.window=c;vm.createContext(c);
  const load=file=>vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});
  const tick=async()=>{const tasks=[...timers.values()];timers.clear();for(const fn of tasks)fn();await new Promise(resolve=>setImmediate(resolve));};
  return {c,timers,channels,removed,load,tick,fire(name){for(const fn of events.get(name)||[])fn();}};
}
test('network failure releases the old channel; late callbacks cannot restart or mutate the new connection',async()=>{
  const h=harness();h.load('realtime-sync.js');h.c.PALARealtime.start();
  const old=h.channels[0];old.status('SUBSCRIBED');old.status('CHANNEL_ERROR');
  assert.equal(h.removed.length,1);assert.equal(h.timers.size,1);
  await new Promise(resolve=>setImmediate(resolve));await h.tick();assert.equal(h.channels.length,2);
  h.channels[1].status('SUBSCRIBED');old.status('CLOSED');
  assert.equal(h.c.PALARealtime.status,'SUBSCRIBED');assert.equal(h.timers.size,0);
  let applied=0;h.c.PALALegacyBridge.apply=()=>{applied++;return true};
  old.callbacks[0].fn({eventType:'UPDATE',new:{id:1}});
  assert.equal(applied,0);
  h.c.PALARealtime.stop();
  assert.equal(h.c.PALARealtime.status,'IDLE');assert.equal(h.timers.size,0);assert.equal(h.removed.length,2);
});
test('recovery before the retry timer fires does not leave an extra reconnect pending',async()=>{
  const h=harness();h.load('realtime-sync.js');h.c.PALARealtime.start();
  h.channels[0].status('TIMED_OUT');await new Promise(resolve=>setImmediate(resolve));h.c.PALARealtime.start();
  assert.equal(h.channels.length,2);assert.equal(h.timers.size,0);
  h.channels[1].status('SUBSCRIBED');await h.tick();assert.equal(h.channels.length,2);
});
test('refresh guard blocks hidden pages, open editors and focused fields',()=>{
  const h=harness();h.load('realtime-sync.js');const safe=h.c.PALARealtime.canRefresh;
  assert.equal(safe(),true);h.c.document.hidden=true;assert.equal(safe(),false);h.c.document.hidden=false;
  h.c.cloudRefreshIsSafe=()=>false;assert.equal(safe(),false);h.c.cloudRefreshIsSafe=()=>true;
  h.c.document.activeElement={matches:()=>true};assert.equal(safe(),false);
});
for(const [file,source,render,loader] of [
 ['calendar-realtime.js','bookings','showCalendar','reloadData'],
 ['warehouse-realtime.js','tents','showTents','loadWarehouseExtensions']
]){
  function setup(){
    const h=harness();let safe=true,rendered=0,loaded=0;
    const handlers=new Map();
    h.c.PALARealtime={canRefresh:()=>safe,on(name,fn){handlers.set(name,fn)}};
    h.c[render]=async()=>{rendered++};h.c[loader]=async()=>{loaded++};h.load(file);
    Object.assign(h,{setSafe(value){safe=value},emit(event){handlers.get(source)(event)}});
    return Object.defineProperties(h,{rendered:{get:()=>rendered},loaded:{get:()=>loaded}});
  }
  test(`${file}: direct update waits until editing ends`,async()=>{
    const h=setup();h.setSafe(false);h.emit({direct:true});await h.tick();assert.equal(h.rendered,0);
    h.setSafe(true);h.fire('focusout');await h.tick();await h.tick();assert.equal(h.rendered,1);assert.equal(h.loaded,0);
  });
  test(`${file}: invalidation is retained without data requests during editing`,async()=>{
    const h=setup();h.setSafe(false);h.emit({direct:false});await h.tick();assert.equal(h.loaded,0);
    h.setSafe(true);h.fire('close');await h.tick();await h.tick();assert.equal(h.loaded,1);assert.equal(h.rendered,1);
  });
  test(`${file}: an editor opened during a fetch prevents rerendering`,async()=>{
    const h=setup();let finish;h.c[loader]=()=>new Promise(resolve=>{finish=resolve});
    h.emit({direct:false});await h.tick();h.setSafe(false);finish();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(h.rendered,0);h.setSafe(true);h.fire('click');await h.tick();await h.tick();assert.equal(h.rendered,1);
  });
  test(`${file}: burst invalidations serialize requests and retain one follow-up`,async()=>{
    const h=setup();let calls=0;const finishes=[];h.c[loader]=()=>{calls++;return new Promise(resolve=>finishes.push(resolve))};
    h.emit({direct:false});h.emit({direct:false});await h.tick();assert.equal(calls,1);
    h.emit({direct:false});h.emit({direct:false});await h.tick();assert.equal(calls,1);
    finishes.shift()();await new Promise(resolve=>setImmediate(resolve));await h.tick();assert.equal(calls,2);
    finishes.shift()();await new Promise(resolve=>setImmediate(resolve));await h.tick();assert.equal(calls,2);
  });
}

test('reconnect waits for slow channel cleanup before opening its replacement',async()=>{
  const h=harness();let complete;h.c.sb.removeChannel=()=>new Promise(resolve=>{complete=resolve});
  h.load('realtime-sync.js');h.c.PALARealtime.start();h.channels[0].status('CHANNEL_ERROR');
  await h.tick();assert.equal(h.channels.length,1);
  complete('ok');await new Promise(resolve=>setImmediate(resolve));await h.tick();
  assert.equal(h.channels.length,2);
});
