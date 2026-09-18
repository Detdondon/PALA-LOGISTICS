/* PALA pull-to-refresh v270 · native-style refresh gesture for installed/web app */
(()=>{
'use strict';
if(window.__palaPullToRefreshV251)return;
window.__palaPullToRefreshV251=true;
const THRESHOLD=72,MAX=112;
let startY=0,pull=0,tracking=false,refreshing=false;
const indicator=document.createElement('div');
indicator.className='pala-pull-refresh-v270';
indicator.innerHTML='<span class="pala-pull-refresh-spinner-v270" aria-hidden="true"></span><span class="pala-pull-refresh-label-v270">Træk for at opdatere</span>';
document.body.appendChild(indicator);
const label=indicator.querySelector('.pala-pull-refresh-label-v270');
function atTop(){return window.scrollY<=0&&document.documentElement.scrollTop<=0}
function interactive(target){return !!target?.closest?.('input,textarea,select,[contenteditable="true"],.modal,.sheet,.drawer')}
function paint(){
  const y=Math.min(MAX,pull);
  indicator.style.transform=`translate3d(-50%,${Math.max(-54,y-54)}px,0)`;
  indicator.style.opacity=String(Math.min(1,y/38));
  label.textContent=pull>=THRESHOLD?'Slip for at opdatere':'Træk for at opdatere';
  indicator.classList.toggle('ready',pull>=THRESHOLD);
}
function reset(){
  pull=0;tracking=false;
  indicator.classList.remove('ready');
  indicator.style.transform='translate3d(-50%,-54px,0)';
  indicator.style.opacity='0';
}
async function refresh(){
  if(refreshing)return;
  refreshing=true;
  indicator.classList.add('refreshing');
  label.textContent='Opdaterer…';
  indicator.style.transform='translate3d(-50%,14px,0)';
  indicator.style.opacity='1';

  // Refresh PALA's actual data first. A document navigation alone is unreliable
  // in standalone iOS/PWA mode and can leave this overlay visible indefinitely.
  try{
    if(typeof window.reloadData==='function')await window.reloadData();
    else if(typeof window.loadWarehouseExtensions==='function')await window.loadWarehouseExtensions();
    if(typeof window.showCalendar==='function'&&document.querySelector('.calendar-controller-v150'))await window.showCalendar();
    else if(typeof window.render==='function')await window.render();
  }catch(error){
    console.warn('[PALA] pull refresh data reload failed',error);
  }finally{
    refreshing=false;
    indicator.classList.remove('refreshing');
    label.textContent='Opdateret';
    setTimeout(reset,300);
  }
}
addEventListener('touchstart',e=>{
  if(refreshing||e.touches.length!==1||!atTop()||interactive(e.target))return;
  startY=e.touches[0].clientY;pull=0;tracking=true;
},{passive:true});
addEventListener('touchmove',e=>{
  if(!tracking||refreshing)return;
  const dy=e.touches[0].clientY-startY;
  if(dy<=0){reset();return}
  if(!atTop()){reset();return}
  pull=Math.min(MAX,dy*.55);
  paint();
  if(pull>8)e.preventDefault();
},{passive:false});
addEventListener('touchend',()=>{
  if(!tracking||refreshing)return;
  const shouldRefresh=pull>=THRESHOLD;
  tracking=false;
  if(shouldRefresh)refresh();else reset();
},{passive:true});
addEventListener('touchcancel',()=>{if(!refreshing)reset()},{passive:true});
const style=document.createElement('style');
style.textContent=`
.pala-pull-refresh-v270{position:fixed;z-index:10000;left:50%;top:env(safe-area-inset-top,0px);transform:translate3d(-50%,-54px,0);opacity:0;display:flex;align-items:center;gap:7px;height:38px;padding:0 12px;border:1px solid rgba(38,51,75,.12);border-radius:999px;background:rgba(255,255,255,.96);box-shadow:0 5px 18px rgba(23,33,58,.13);color:#42526b;font:700 11px/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:none;transition:opacity .12s ease,transform .12s ease}
.pala-pull-refresh-spinner-v270{width:14px;height:14px;border:2px solid #cbd4e1;border-top-color:#2f80ed;border-radius:50%;transform:rotate(0)}
.pala-pull-refresh-v270.ready .pala-pull-refresh-spinner-v270{border-color:#2f80ed}
.pala-pull-refresh-v270.refreshing .pala-pull-refresh-spinner-v270{animation:pala-spin-v270 .7s linear infinite}
@keyframes pala-spin-v270{to{transform:rotate(360deg)}}
`;
document.head.appendChild(style);
})();