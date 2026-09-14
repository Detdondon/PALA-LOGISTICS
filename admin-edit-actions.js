/* PALA v185 · explicit admin edit actions
   Editing is only exposed through normal Redigér buttons on detail views.
   No floating/inline admin edit affordances are created here. */
(()=>{
'use strict';
if(window.__palaExplicitAdminEditV185)return;
window.__palaExplicitAdminEditV185=true;

function adminOn(){
  try{return typeof isAdminLoggedIn==='function'&&isAdminLoggedIn()}catch(_e){return false}
}
function escText(value){
  return typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function hasEditAction(root){
  if(!root)return false;
  return !!root.querySelector([
    '.detail-admin-edit',
    '.detail-card-edit',
    '[data-pala-explicit-edit-v185]',
    'button[onclick*="editOrder("]',
    'button[onclick*="editTentBasics("]',
    'button[onclick*="editCatalogHardware("]',
    'button[onclick*="editInventoryBasics("]',
    'button[onclick*="showWorkshopJobForm("]',
    'button[onclick*="editWorkshopDamage("]',
    'button[onclick*="editMeeting("]',
    'button[onclick*="editShiftFromOverview("]',
    'button[onclick*="editExistingStaffShift("]'
  ].join(','));
}
function specialCatalogId(id){
  try{
    const row=(specialHardware||[]).find(x=>+x.id===+id);
    const catalog=(hardwareCatalog||[]).find(x=>+x.id===+row?.catalog_id||+x.legacy_special_id===+id);
    return +catalog?.id||0;
  }catch(_e){return 0}
}
function legacyHardwareCatalogId(id){
  try{
    const rows=Object.values(tents||{}).flatMap(t=>t.hardware||[]);
    return +(rows.find(x=>+x.id===+id)?.catalog_id||0);
  }catch(_e){return 0}
}
function detailEditConfig(){
  const p=new URLSearchParams(location.search);
  if(p.get('job'))return {label:'Redigér ordre',action:`editOrder(${+p.get('job')})`};
  if(p.get('hardware'))return {label:'Redigér hardware',action:`editCatalogHardware(${+p.get('hardware')})`};
  if(p.get('h')){const id=legacyHardwareCatalogId(+p.get('h'));if(id)return {label:'Redigér hardware',action:`editCatalogHardware(${id})`}}
  if(p.get('specialHardware')){const id=specialCatalogId(+p.get('specialHardware'));if(id)return {label:'Redigér hardware',action:`editCatalogHardware(${id})`}}
  if(p.get('i'))return {label:'Redigér inventar',action:`editInventoryBasics(${+p.get('i')})`};
  if(p.get('t'))return {label:'Redigér telt',action:`editTentBasics(${+p.get('t')})`};
  if(p.get('workshopJob'))return {label:'Redigér systuejob',action:`showWorkshopJobForm(${+p.get('workshopJob')})`};
  if(p.get('damage'))return {label:'Redigér skade',action:`editWorkshopDamage(${+p.get('damage')})`};
  if(p.get('meeting'))return {label:'Redigér møde',action:`editMeeting(${+p.get('meeting')})`};
  if(p.get('shift'))return {label:'Redigér vagt',action:`editShiftFromOverview(${+p.get('shift')})`};
  return null;
}
function ensureExplicitEditButton(){
  if(!adminOn())return;
  const root=document.getElementById('app'),config=detailEditConfig();
  if(!root||!config)return;
  const first=root.firstElementChild;
  if(!first||hasEditAction(first))return;
  let row=first.querySelector(':scope > .row');
  if(!row){
    row=document.createElement('div');
    row.className='row pala-detail-action-row-v185';
    first.prepend(row);
  }
  if(row.querySelector('[data-pala-explicit-edit-v185]'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='btn';
  button.dataset.palaExplicitEditV185='1';
  button.setAttribute('onclick',config.action);
  button.innerHTML=`${typeof uiIcon==='function'?uiIcon('edit'):''} ${escText(config.label)}`;
  row.appendChild(button);
}

function wrapRender(name){
  const base=window[name];
  if(typeof base!=='function'||base.__palaExplicitEditWrappedV185)return;
  const wrapped=function(){
    const result=base.apply(this,arguments);
    if(result&&typeof result.then==='function')return result.then(value=>{queueMicrotask(ensureExplicitEditButton);return value});
    queueMicrotask(ensureExplicitEditButton);
    return result;
  };
  wrapped.__palaExplicitEditWrappedV185=true;
  window[name]=wrapped;
}
[
  'viewOrder','openCatalogHardware','openHardwareNfc','openSpecialHardware','openInventoryNfc','openTent',
  'openWorkshopJob','showDamageForm','openMeeting','openStaffShift'
].forEach(wrapRender);

// Also cover a detail view already rendered before this script was evaluated.
queueMicrotask(ensureExplicitEditButton);
})();
