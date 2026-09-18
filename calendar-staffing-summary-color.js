/* PALA v236 · split total shifts from understaffing warning
   Only the understaffing text is red; total shift count stays neutral. */
(()=>{
'use strict';
if(window.__palaStaffingSummaryColorV236)return;
window.__palaStaffingSummaryColorV236=true;

function normalize(text){
  return String(text||'').replace(/mangler\s+folk/gi,'mangler bemanding').replace(/\s+/g,' ').trim();
}
function fixBar(bar){
  if(!bar)return;
  const items=[...bar.querySelectorAll('.calendar-count-item-v174')];
  const combined=items.find(node=>{
    const text=normalize(node.textContent);
    return /\bvagter\b/i.test(text)&&/mangler\s+bemanding/i.test(text);
  });
  if(combined){
    const text=normalize(combined.textContent);
    const match=text.match(/^(.+?\bvagter)\s*(?:·\s*)?(.+?mangler\s+bemanding)$/i);
    if(match){
      const total=document.createElement('span');
      total.className='calendar-count-item-v174 calendar-count-shifts-total-v236';
      total.textContent=match[1].trim();

      const separator=document.createElement('span');
      separator.className='calendar-count-separator-v174';
      separator.setAttribute('aria-hidden','true');
      separator.textContent='•';

      const warning=document.createElement('span');
      warning.className='calendar-count-item-v174 warning';
      warning.textContent=match[2].trim();

      combined.replaceWith(total,separator,warning);
      return;
    }
  }

  const total=items.find(node=>/^\d+\s+vagter$/i.test(normalize(node.textContent)));
  if(total){
    total.classList.remove('warning','calendar-missing-staffing-link-v187');
    total.classList.add('calendar-count-shifts-total-v236');
    total.removeAttribute('role');
    total.removeAttribute('tabindex');
    total.removeAttribute('aria-label');
    total.removeAttribute('title');
  }
}
function apply(){
  document.querySelectorAll('.calendar-count-summary-v174').forEach(fixBar);
}
let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
}
const root=document.getElementById('app');
if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});

if(!document.getElementById('pala-staffing-summary-color-v236-style')){
  const style=document.createElement('style');
  style.id='pala-staffing-summary-color-v236-style';
  style.textContent='.calendar-count-shifts-total-v236{color:#667085!important;text-decoration:none!important;background:transparent!important}';
  document.head.appendChild(style);
}
queueMicrotask(schedule);
})();