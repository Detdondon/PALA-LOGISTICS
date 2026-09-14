/* PALA v182 · inline admin editing
   Adds small + edit affordances to editable content blocks while Adminfunktion is active.
   All actions reuse PALA's existing editors/RPCs, so saved data stays synchronized everywhere. */
(()=>{
'use strict';
if(window.__palaInlineAdminEditV182)return;
window.__palaInlineAdminEditV182=true;

const SELECTOR=['.warehouse-item','.job-card','.staff-card','.workshop-job-card','.workshop-task','.meeting-card','.calendar-job-chip','.card'].join(',');
const EDITOR_SELECTOR='button.detail-admin-edit,button.detail-card-edit,button[onclick*="editWorkshopDamage("],button[onclick*="editShiftFromOverview("],button[onclick*="editExistingStaffShift("],button[onclick*="showWorkshopJobForm("],button[onclick*="editMeeting("],button[onclick*="editTentBasics("],button[onclick*="editTentRequirements("],button[onclick*="editCatalogHardware("],button[onclick*="editInventoryBasics("],button[onclick*="editOrder("]';

function adminOn(){try{return typeof isAdminLoggedIn==='function'&&isAdminLoggedIn()}catch(_e){return false}}
function codeFrom(root){
  let parts=[];const own=root.getAttribute?.('onclick');if(own)parts.push(own);
  root.querySelectorAll?.('[onclick]')?.forEach(el=>{if(el.classList?.contains('pala-inline-edit-plus-v182')||el.closest(SELECTOR)!==root)return;const c=el.getAttribute('onclick');if(c)parts.push(c)});
  return parts.join('\n');
}
function contextAction(root){
  const p=new URLSearchParams(location.search),heading=(root.querySelector?.('h2,h3')?.textContent||'').trim();
  if(p.get('t')&&typeof editTentBasics==='function'){
    const id=+p.get('t');if(!id)return null;
    if(/^Hardware$/i.test(heading)&&typeof editTentRequirements==='function')return()=>editTentRequirements(id);
    if(/^(Dokumenter|Billeder|Opsætningsvarianter)$/i.test(heading)&&typeof openTentAdvanced==='function')return()=>openTentAdvanced(id,heading);
    return()=>editTentBasics(id);
  }
  if(p.get('i')&&typeof editInventoryBasics==='function')return()=>editInventoryBasics(+p.get('i'));
  if(p.get('job')&&typeof editOrder==='function')return()=>editOrder(+p.get('job'));
  if(p.get('shift')&&typeof editShiftFromOverview==='function')return()=>editShiftFromOverview(+p.get('shift'));
  if(p.get('workshopJob')&&typeof showWorkshopJobForm==='function')return()=>showWorkshopJobForm(+p.get('workshopJob'));
  if(p.get('damage')&&typeof editWorkshopDamage==='function')return()=>editWorkshopDamage(+p.get('damage'));
  if(p.get('specialHardware')&&typeof showAdminSpecialHardware==='function')return()=>showAdminSpecialHardware(+p.get('specialHardware'));
  if(p.get('h')&&typeof editCatalogHardware==='function'){
    const hid=+p.get('h');let row=null;try{row=Object.values(tents||{}).flatMap(t=>t.hardware||[]).find(h=>+h.id===hid)}catch(_e){};
    if(row?.catalog_id)return()=>editCatalogHardware(+row.catalog_id);
  }
  return null;
}
function mappedAction(root){
  const existing=[...(root.querySelectorAll?.(EDITOR_SELECTOR)||[])].find(button=>button.closest(SELECTOR)===root);if(existing)return()=>existing.click();
  const code=codeFrom(root);let m;
  if((m=code.match(/openTent\((\d+)/))&&typeof editTentBasics==='function')return()=>editTentBasics(+m[1]);
  if((m=code.match(/openCatalogHardware\((\d+)/))&&typeof editCatalogHardware==='function')return()=>editCatalogHardware(+m[1]);
  if((m=code.match(/openInventoryNfc\((\d+)/))&&typeof editInventoryBasics==='function')return()=>editInventoryBasics(+m[1]);
  if((m=code.match(/openStaffShift\((\d+)/))&&typeof editShiftFromOverview==='function')return()=>editShiftFromOverview(+m[1]);
  if((m=code.match(/openWorkshopJob\((\d+)/))&&typeof showWorkshopJobForm==='function')return()=>showWorkshopJobForm(+m[1]);
  if((m=code.match(/openMeeting\((\d+)/))&&typeof editMeeting==='function')return()=>editMeeting(+m[1]);
  if((m=code.match(/editWorkshopDamage\((\d+)/))&&typeof editWorkshopDamage==='function')return()=>editWorkshopDamage(+m[1]);
  if((m=code.match(/viewOrder\(bookings\.find\([^\n]*?===\s*(\d+)/))&&typeof editOrder==='function')return()=>editOrder(+m[1]);
  if((m=code.match(/openCalendarBooking\((\d+)/))&&typeof editOrder==='function')return()=>editOrder(+m[1]);
  return root.classList?.contains('card')?contextAction(root):null;
}
function addPlus(root){
  if(!root||root.dataset?.palaInlineEditV182==='1'||root.closest?.('#palaEditSheet')||root.closest?.('.admin-tabs,.admin-utility-tools-v179,.warehouse-category-admin-v180'))return;
  const action=mappedAction(root);if(!action)return;
  root.dataset.palaInlineEditV182='1';root.classList.add('pala-inline-edit-target-v182');
  const plus=document.createElement('span');plus.className='pala-inline-edit-plus-v182';plus.setAttribute('role','button');plus.setAttribute('tabindex','0');plus.setAttribute('aria-label','Redigér indhold');plus.setAttribute('title','Redigér');plus.textContent='+';
  const run=event=>{event.preventDefault();event.stopPropagation();try{action()}catch(error){console.warn('PALA adminredigering kunne ikke åbnes',error)}};
  plus.addEventListener('click',run);plus.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){run(event)}});
  root.appendChild(plus);
}
function clear(){
  document.querySelectorAll('.pala-inline-edit-plus-v182').forEach(el=>el.remove());
  document.querySelectorAll('[data-pala-inline-edit-v182]').forEach(el=>{delete el.dataset.palaInlineEditV182;el.classList.remove('pala-inline-edit-target-v182')});
}
function enhance(){
  if(!adminOn()){clear();return}
  const root=document.getElementById('app');if(!root)return;
  root.querySelectorAll(SELECTOR).forEach(el=>addPlus(el));
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})}
const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
const baseSync=window.syncLoginUi;if(typeof baseSync==='function')window.syncLoginUi=function(){const result=baseSync.apply(this,arguments);setTimeout(schedule,0);return result};

if(!document.getElementById('pala-inline-admin-edit-v182-style')){
  const style=document.createElement('style');style.id='pala-inline-admin-edit-v182-style';style.textContent=`
    .pala-inline-edit-target-v182{position:relative!important}
    .pala-inline-edit-plus-v182{position:absolute;top:7px;right:7px;z-index:8;width:24px;height:24px;border-radius:999px;background:#1768c4;color:#fff;border:2px solid #fff;box-shadow:0 2px 8px rgba(23,104,196,.28);display:flex;align-items:center;justify-content:center;font:800 17px/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;user-select:none;-webkit-user-select:none}
    .pala-inline-edit-plus-v182:hover{background:#0f57aa}.pala-inline-edit-plus-v182:focus-visible{outline:3px solid rgba(23,104,196,.25);outline-offset:2px}
    .warehouse-item.pala-inline-edit-target-v182{padding-right:43px!important}.job-card.pala-inline-edit-target-v182,.staff-card.pala-inline-edit-target-v182,.workshop-job-card.pala-inline-edit-target-v182,.workshop-task.pala-inline-edit-target-v182,.meeting-card.pala-inline-edit-target-v182{padding-right:40px!important}
    .calendar-job-chip.pala-inline-edit-target-v182{padding-right:28px!important;overflow:visible!important}
    .calendar-job-chip>.pala-inline-edit-plus-v182{top:-7px;right:-7px;width:19px;height:19px;font-size:13px;z-index:12}
    @media(max-width:600px){.pala-inline-edit-plus-v182{top:6px;right:6px;width:22px;height:22px;font-size:16px}.warehouse-item.pala-inline-edit-target-v182{padding-right:38px!important}}
  `;document.head.appendChild(style);
}
schedule();
})();
