/* PALA v185 · inline admin editing removed
   Admin editing now happens only from explicit Redigér buttons. */
(()=>{
'use strict';
if(window.__palaInlineAdminEditRemovedV185)return;
window.__palaInlineAdminEditRemovedV185=true;

function clearLegacyInlineEdit(){
  document.querySelectorAll('.pala-inline-edit-plus-v182').forEach(el=>el.remove());
  document.querySelectorAll('[data-pala-inline-edit-v182]').forEach(el=>{
    delete el.dataset.palaInlineEditV182;
    el.classList.remove('pala-inline-edit-target-v182');
  });
  document.getElementById('pala-inline-admin-edit-v182-style')?.remove();
}

clearLegacyInlineEdit();
queueMicrotask(clearLegacyInlineEdit);
setTimeout(clearLegacyInlineEdit,250);
})();
