/* PALA v185 · complex admin editors as modal popups
   Existing save/delete logic is preserved; only the editing presentation changes. */
(()=>{
'use strict';
if(window.__palaAdminEditPopupV185)return;
window.__palaAdminEditPopupV185=true;

function adminOn(){try{return typeof isAdminLoggedIn==='function'&&isAdminLoggedIn()}catch(_e){return false}}
function markOrderPopup(id){
  if(!id||!adminOn())return;
  document.querySelector('.order-editor-page')?.classList.add('pala-complex-edit-popup-v185');
}
function markWorkshopPopup(id){
  if(!id||!adminOn())return;
  const form=document.querySelector('.workshop-form');
  if(form)form.classList.add('pala-complex-edit-card-v185');
}
function markShiftPopup(id){
  if(!id||!adminOn())return;
  const form=document.querySelector('#staffAdminEditHost > .staff-form');
  if(form)form.classList.add('pala-complex-edit-card-v185');
}

const baseEditOrder=window.editOrder;
if(typeof baseEditOrder==='function')window.editOrder=function(id){
  const result=baseEditOrder.apply(this,arguments);
  queueMicrotask(()=>markOrderPopup(+id));
  return result;
};

const baseWorkshopForm=window.showWorkshopJobForm;
if(typeof baseWorkshopForm==='function')window.showWorkshopJobForm=function(id){
  const result=baseWorkshopForm.apply(this,arguments);
  queueMicrotask(()=>markWorkshopPopup(+id));
  return result;
};

const baseEditShift=window.editExistingStaffShift;
if(typeof baseEditShift==='function')window.editExistingStaffShift=function(id,preset){
  const result=baseEditShift.apply(this,arguments);
  queueMicrotask(()=>markShiftPopup(+id));
  return result;
};

const style=document.createElement('style');
style.id='pala-admin-edit-popup-v185-style';
style.textContent=`
  .pala-complex-edit-popup-v185{
    position:fixed!important;inset:0!important;z-index:1200!important;overflow:auto!important;
    background:rgba(20,31,48,.42)!important;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
    padding:clamp(12px,3vw,30px)!important;margin:0!important;
  }
  .pala-complex-edit-popup-v185>.card,
  .pala-complex-edit-popup-v185 .card{
    max-width:920px;margin-left:auto!important;margin-right:auto!important;
  }
  body:has(.pala-complex-edit-popup-v185){overflow:hidden}

  .workshop-form.pala-complex-edit-card-v185{
    position:fixed!important;z-index:1200!important;left:50%!important;top:50%!important;
    transform:translate(-50%,-50%)!important;width:min(920px,calc(100vw - 24px))!important;
    max-height:calc(100vh - 24px)!important;overflow:auto!important;margin:0!important;
    box-shadow:0 24px 70px rgba(15,30,50,.28)!important;
  }
  body:has(.workshop-form.pala-complex-edit-card-v185)::before{
    content:'';position:fixed;inset:0;z-index:1190;background:rgba(20,31,48,.42);
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  }
  body:has(.workshop-form.pala-complex-edit-card-v185){overflow:hidden}

  #staffAdminEditHost:has(>.staff-form.pala-complex-edit-card-v185){
    position:fixed!important;inset:0!important;z-index:1200!important;overflow:auto!important;
    background:rgba(20,31,48,.42)!important;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
    padding:clamp(12px,3vw,30px)!important;
  }
  #staffAdminEditHost>.staff-form.pala-complex-edit-card-v185{
    width:min(920px,100%)!important;max-height:calc(100vh - 24px)!important;overflow:auto!important;
    margin:0 auto!important;box-shadow:0 24px 70px rgba(15,30,50,.28)!important;
  }
  body:has(#staffAdminEditHost>.staff-form.pala-complex-edit-card-v185){overflow:hidden}

  @media(max-width:600px){
    .pala-complex-edit-popup-v185{padding:8px!important}
    .workshop-form.pala-complex-edit-card-v185{width:calc(100vw - 12px)!important;max-height:calc(100vh - 12px)!important;border-radius:18px!important}
    #staffAdminEditHost:has(>.staff-form.pala-complex-edit-card-v185){padding:6px!important}
    #staffAdminEditHost>.staff-form.pala-complex-edit-card-v185{max-height:calc(100vh - 12px)!important;border-radius:18px!important}
  }
`;
document.head.appendChild(style);
})();
