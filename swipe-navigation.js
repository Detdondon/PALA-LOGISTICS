/* PALA v365 · swipe back/forward navigation for the SPA without per-gesture full DOM scans. */
(()=>{
'use strict';
if(window.__palaSwipeNavigationV365)return;
window.__palaSwipeNavigationV365=true;

const MAX_HISTORY=60;
const navState={stack:[],index:-1,replaying:false,userGesture:false,depth:0,suppressClickUntil:0};
const wrapped=new Map();
const NAV_NAME=/^(?:show|open|view|go)[A-Z0-9_]/;
const BLOCK_START='input,textarea,select,[contenteditable="true"],[data-no-swipe],.calendar-strip,.warehouse-tabs,.sheet-checks,.pala-select-panel';

function primitiveArgs(args){
  return args.every(v=>v===null||['string','number','boolean','undefined'].includes(typeof v));
}
function commandKey(cmd){return cmd?cmd.name+'|'+JSON.stringify(cmd.args||[]):''}
function persist(){
  try{sessionStorage.setItem('pala_swipe_nav_v357',JSON.stringify({stack:navState.stack.slice(-MAX_HISTORY),index:navState.index}))}catch(_e){}
}
function restoreStored(){
  try{
    const raw=JSON.parse(sessionStorage.getItem('pala_swipe_nav_v357')||'null');
    if(raw&&Array.isArray(raw.stack)&&Number.isInteger(raw.index)){
      navState.stack=raw.stack.filter(x=>x&&typeof x.name==='string'&&Array.isArray(x.args)).slice(-MAX_HISTORY);
      navState.index=Math.min(Math.max(-1,raw.index),navState.stack.length-1);
    }
  }catch(_e){}
}
function pushCommand(name,args){
  if(navState.replaying||!primitiveArgs(args))return;
  const cmd={name,args:[...args]};
  if(commandKey(navState.stack[navState.index])===commandKey(cmd))return;
  if(navState.index<navState.stack.length-1)navState.stack=navState.stack.slice(0,navState.index+1);
  navState.stack.push(cmd);
  if(navState.stack.length>MAX_HISTORY)navState.stack.shift();
  navState.index=navState.stack.length-1;
  persist();
}
function parseLiteral(text){
  const v=text.trim();
  if(!v)return undefined;
  if(v==='null')return null;if(v==='true')return true;if(v==='false')return false;if(v==='undefined')return undefined;
  if(/^[-+]?\d+(?:\.\d+)?$/.test(v))return Number(v);
  if((v.startsWith("'")&&v.endsWith("'"))||(v.startsWith('"')&&v.endsWith('"'))){
    const q=v[0],body=v.slice(1,-1);return body.replace(new RegExp('\\\\'+q,'g'),q).replace(/\\n/g,'\n').replace(/\\\\/g,'\\');
  }
  throw new Error('unsupported');
}
function splitArgs(raw){
  if(!raw.trim())return[];
  const out=[];let start=0,quote=null,escape=false;
  for(let i=0;i<raw.length;i++){
    const ch=raw[i];
    if(escape){escape=false;continue}
    if(ch==='\\'){escape=true;continue}
    if(quote){if(ch===quote)quote=null;continue}
    if(ch==='\''||ch==='"'){quote=ch;continue}
    if(ch===','){out.push(parseLiteral(raw.slice(start,i)));start=i+1}
  }
  out.push(parseLiteral(raw.slice(start)));
  return out;
}
function parseInlineCommand(source){
  const text=String(source||'').trim();
  const match=text.match(/^\s*([A-Za-z_$][\w$]*)\s*\((.*)\)\s*;?\s*$/s);
  if(!match||!NAV_NAME.test(match[1]))return null;
  try{return{name:match[1],args:splitArgs(match[2])}}catch(_e){return null}
}
function seedFromActiveNav(){
  if(navState.stack.length)return;
  const active=document.querySelector('.nav .active[onclick],.nav button.active[onclick],[role="tab"][aria-selected="true"][onclick]');
  const cmd=parseInlineCommand(active?.getAttribute('onclick'));
  if(cmd){navState.stack=[cmd];navState.index=0;persist()}
}
function wrapName(name){
  if(!NAV_NAME.test(name))return;
  const current=window[name];if(typeof current!=='function')return;
  if(current.__palaSwipeWrappedV357)return;
  const previous=current;
  const wrapper=function(...args){
    const top=navState.depth===0;
    navState.depth++;
    let result;
    try{result=previous.apply(this,args)}finally{navState.depth--}
    if(top&&navState.userGesture&&!navState.replaying&&primitiveArgs(args))queueMicrotask(()=>pushCommand(name,args));
    return result;
  };
  wrapper.__palaSwipeWrappedV357=true;
  wrapper.__palaSwipeOriginalV357=previous;
  try{window[name]=wrapper;wrapped.set(name,wrapper)}catch(_e){}
}
function scanNavigationFunctions(root=document){
  const nodes=[];
  if(root?.matches?.('[onclick]'))nodes.push(root);
  root?.querySelectorAll?.('[onclick]')?.forEach(node=>nodes.push(node));
  nodes.forEach(node=>{
    const source=node.getAttribute('onclick')||'';
    const rx=/\b((?:show|open|view|go)[A-Z0-9_][A-Za-z0-9_$]*)\s*\(/g;
    let match;while((match=rx.exec(source)))wrapName(match[1]);
  });
}
function scanActionTarget(target){
  const action=target?.closest?.('[onclick]');
  if(action)scanNavigationFunctions(action);
}
function commandAvailable(cmd){return !!cmd&&typeof window[cmd.name]==='function'&&primitiveArgs(cmd.args||[])}
function replayAt(nextIndex){
  if(nextIndex<0||nextIndex>=navState.stack.length)return false;
  const cmd=navState.stack[nextIndex];if(!commandAvailable(cmd))return false;
  navState.replaying=true;navState.userGesture=false;
  try{
    window[cmd.name](...(cmd.args||[]));
    navState.index=nextIndex;persist();
    try{window.scrollTo({top:0,behavior:'instant'})}catch(_e){window.scrollTo(0,0)}
    return true;
  }catch(error){console.warn('[PALA] swipe navigation failed',error);return false}
  finally{queueMicrotask(()=>{navState.replaying=false})}
}
function visible(node){return !!node&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&node.getClientRects().length>0}
function closeTransientEditor(){
  const sheet=document.querySelector('#palaEditSheet');
  if(visible(sheet)){
    const close=sheet.querySelector('.pala-editor-close,.pala-editor-cancel,.sheet-head button,.sheet-footer button:not(.primary)');
    if(close){close.click();return true}
  }
  const dialog=[...document.querySelectorAll('dialog[open],.dialog.open,.modal.open')].find(visible);
  if(dialog){const close=dialog.querySelector('[data-close],.pala-editor-close,.btn');if(close){close.click();return true}}
  return false;
}
function goBack(){
  if(closeTransientEditor())return true;
  seedFromActiveNav();
  return replayAt(navState.index-1);
}
function goForward(){
  if(document.querySelector('#palaEditSheet')&&visible(document.querySelector('#palaEditSheet')))return false;
  return replayAt(navState.index+1);
}
function horizontallyScrollable(target){
  for(let el=target instanceof Element?target:null;el&&el!==document.body;el=el.parentElement){
    const style=getComputedStyle(el);
    if((style.overflowX==='auto'||style.overflowX==='scroll')&&el.scrollWidth>el.clientWidth+8)return true;
  }
  return false;
}
function blockedStart(target){return !!target?.closest?.(BLOCK_START)||horizontallyScrollable(target)}

let touch=null;
document.addEventListener('touchstart',event=>{
  if(event.touches.length!==1||blockedStart(event.target)){touch=null;return}
  const t=event.touches[0];touch={x:t.clientX,y:t.clientY,time:performance.now(),target:event.target};
  navState.userGesture=true;seedFromActiveNav();scanActionTarget(event.target);
},{passive:true,capture:true});
document.addEventListener('touchend',event=>{
  if(!touch||event.changedTouches.length!==1){touch=null;return}
  const t=event.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y,dt=performance.now()-touch.time;touch=null;
  setTimeout(()=>{navState.userGesture=false},450);
  if(dt>900||Math.abs(dx)<72||Math.abs(dx)<Math.abs(dy)*1.35)return;
  navState.suppressClickUntil=performance.now()+350;
  if(dx>0)goBack();else goForward();
},{passive:true,capture:true});
document.addEventListener('touchcancel',()=>{touch=null;navState.userGesture=false},{passive:true,capture:true});
document.addEventListener('click',event=>{
  if(performance.now()<navState.suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();return}
  navState.userGesture=true;seedFromActiveNav();scanActionTarget(event.target);
  setTimeout(()=>{navState.userGesture=false},500);
},true);

let wheelTotal=0,wheelLast=0,wheelCooldown=0;
document.addEventListener('wheel',event=>{
  if(event.deltaMode!==0||blockedStart(event.target))return;
  if(Math.abs(event.deltaX)<Math.abs(event.deltaY)*1.25||Math.abs(event.deltaX)<10)return;
  const now=performance.now();if(now-wheelLast>220)wheelTotal=0;wheelLast=now;wheelTotal+=event.deltaX;
  if(now<wheelCooldown||Math.abs(wheelTotal)<180)return;
  wheelCooldown=now+650;const direction=wheelTotal>0?1:-1;wheelTotal=0;
  direction<0?goBack():goForward();
},{passive:true,capture:true});

restoreStored();
function boot(){seedFromActiveNav();scanNavigationFunctions(document);new MutationObserver(records=>{for(const record of records)record.addedNodes.forEach(node=>{if(node.nodeType===1)scanNavigationFunctions(node)})}).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.PALASwipeNavigation={back:goBack,forward:goForward,getState:()=>({stack:[...navState.stack],index:navState.index})};
})();