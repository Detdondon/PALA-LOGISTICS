/* PALA v243 · order file attachments
   Admins can upload/delete files on an order. All logged-in employees can open/download them. */
(()=>{
'use strict';
if(window.__palaOrderFilesV243)return;
window.__palaOrderFilesV243=true;

const MAX_BYTES=7*1024*1024;
const escText=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function token(){
  try{return employeeToken||''}catch(_e){return ''}
}
function adminTokenValue(){
  try{return adminToken||employeeToken||''}catch(_e){return ''}
}
function adminOn(){
  try{return typeof isAdminLoggedIn==='function'&&isAdminLoggedIn()}catch(_e){return false}
}
function fileType(doc){
  const mime=String(doc?.mime_type||'').toLowerCase(),name=String(doc?.file_name||'');
  if(mime.includes('pdf')||/\.pdf$/i.test(name))return 'PDF';
  if(mime.startsWith('image/')||/\.(png|jpe?g|webp|gif|heic)$/i.test(name))return 'Billede';
  if(/\.(docx?|odt)$/i.test(name))return 'Dokument';
  if(/\.(xlsx?|csv|ods)$/i.test(name))return 'Regneark';
  return 'Fil';
}
function readFile(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(reader.error||new Error('Filen kunne ikke læses.'));
    reader.readAsDataURL(file);
  });
}
async function metadata(bookingId){
  const r=await sb.rpc('employee_booking_documents',{p_token:token(),p_booking_id:+bookingId});
  if(r.error)throw r.error;
  return Array.isArray(r.data)?r.data:[];
}
async function payload(id){
  const r=await sb.rpc('employee_booking_document',{p_token:token(),p_id:+id});
  if(r.error)throw r.error;
  return Array.isArray(r.data)?r.data[0]:r.data;
}
function cardHost(){
  return document.getElementById('app');
}
async function render(bookingId){
  const root=cardHost();
  if(!root||!bookingId)return;
  root.querySelector('.booking-files-v239')?.remove();

  let docs=[];
  try{docs=await metadata(bookingId)}
  catch(error){
    console.warn('[PALA] ordre-filer kunne ikke hentes',error);
    return;
  }

  const section=document.createElement('section');
  section.className='card booking-files-v239';
  section.innerHTML=`
    <div class="booking-files-head-v239">
      <div>
        <div class="small muted">ORDRENS FILER</div>
        <h3>Filer og dokumenter</h3>
      </div>
      ${adminOn()?'<button type="button" class="btn primary" data-booking-file-add-v239>'+((typeof uiIcon==='function'?uiIcon('plus'):'')||'')+' Tilføj fil</button>':''}
    </div>
    <p class="small muted booking-files-help-v239">PDF’er, tegninger, regneark, billeder og andre dokumenter, der hører til ordren.</p>
    ${adminOn()?'<input type="file" data-booking-file-input-v239 multiple hidden>':''}
    <div class="booking-file-list-v239">
      ${docs.length?docs.map(doc=>`
        <div class="booking-file-row-v239">
          <div class="booking-file-info-v239">
            <strong>${escText(doc.title||doc.file_name||'Fil')}</strong>
            <span class="small muted">${escText(doc.file_name||'')} · ${escText(fileType(doc))}</span>
          </div>
          <div class="booking-file-actions-v239">
            <button type="button" class="btn" onclick="openBookingDocumentV239(${+doc.id})">${typeof uiIcon==='function'?uiIcon('document'):''} Åbn</button>
            <button type="button" class="btn" onclick="downloadBookingDocumentV239(${+doc.id})">${typeof uiIcon==='function'?uiIcon('download'):''} Download</button>
            ${adminOn()?`<button type="button" class="btn bad" onclick="deleteBookingDocumentV239(${+doc.id},${+bookingId})">${typeof uiIcon==='function'?uiIcon('trash'):''} Slet</button>`:''}
          </div>
        </div>`).join(''):'<p class="muted booking-files-empty-v239">Ingen filer er tilknyttet ordren endnu.</p>'}
    </div>`;

  const first=root.firstElementChild;
  if(first)first.insertAdjacentElement('afterend',section);else root.appendChild(section);

  const input=section.querySelector('[data-booking-file-input-v239]');
  section.querySelector('[data-booking-file-add-v239]')?.addEventListener('click',()=>input?.click());
  input?.addEventListener('change',async()=>{
    const files=[...(input.files||[])];
    if(files.length)await uploadBookingFilesV239(bookingId,files);
    input.value='';
  });
}

window.uploadBookingFilesV239=async function(bookingId,files){
  if(!adminOn())return;
  const rows=[...(files||[])];
  for(const file of rows){
    if(file.size>MAX_BYTES){
      alert(`${file.name} er større end 7 MB og blev ikke uploadet.`);
      continue;
    }
    try{
      const data=await readFile(file);
      const r=await sb.rpc('admin_add_booking_document',{
        p_token:adminTokenValue(),
        p_booking_id:+bookingId,
        p_title:file.name,
        p_file_name:file.name,
        p_mime_type:file.type||'application/octet-stream',
        p_file_data:data
      });
      if(r.error)throw r.error;
    }catch(error){
      alert(`${file.name} kunne ikke uploades: ${error.message||error}`);
    }
  }
  await render(+bookingId);
};

window.openBookingDocumentV239=async function(id){
  const popup=window.open('about:blank','_blank');
  if(popup){try{popup.document.title='Åbner fil…';popup.document.body.innerHTML='<p style="font-family:system-ui;padding:20px">Åbner fil…</p>'}catch(_e){}}
  try{
    const doc=await payload(id);
    if(!doc)throw new Error('Filen blev ikke fundet.');
    const response=await fetch(doc.file_data);
    const blob=await response.blob();
    const url=URL.createObjectURL(blob);
    const mime=String(doc.mime_type||blob.type||'').toLowerCase();
    const name=String(doc.file_name||doc.title||'ordre-fil');
    if(popup){
      if(mime.startsWith('image/')){
        popup.document.open();
        popup.document.write('<!doctype html><html><head><meta charset="utf-8"><title></title><style>html,body{margin:0;width:100%;height:100%;background:#111}body{display:grid;place-items:center}img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body><img></body></html>');
        popup.document.close();
        popup.document.title=name;
        popup.document.querySelector('img').src=url;
      }else{
        popup.location.replace(url);
      }
    }else{
      const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
    }
    setTimeout(()=>URL.revokeObjectURL(url),60*60*1000);
  }catch(error){
    try{popup?.close()}catch(_e){}
    alert('Kunne ikke åbne filen: '+(error.message||error));
  }
};

window.downloadBookingDocumentV239=async function(id){
  try{
    const doc=await payload(id);
    if(!doc)throw new Error('Filen blev ikke fundet.');
    const a=document.createElement('a');
    a.href=doc.file_data;
    a.download=doc.file_name||doc.title||'ordre-fil';
    document.body.appendChild(a);a.click();a.remove();
  }catch(error){
    alert('Kunne ikke downloade filen: '+(error.message||error));
  }
};

window.deleteBookingDocumentV239=async function(id,bookingId){
  if(!adminOn()||!confirm('Slet filen fra ordren?'))return;
  const r=await sb.rpc('admin_delete_booking_document',{p_token:adminTokenValue(),p_id:+id});
  if(r.error)return alert(r.error.message);
  await render(+bookingId);
};

const baseViewOrder=window.viewOrder;
if(typeof baseViewOrder==='function'){
  window.viewOrder=function(booking){
    const result=baseViewOrder.apply(this,arguments);
    const id=+booking?.id||0;
    if(id)queueMicrotask(()=>render(id));
    return result;
  };
}

// The order editor has its own built-in upload section in app.html.
const current=new URLSearchParams(location.search);
const currentId=+(current.get('job')||0);
if(currentId)queueMicrotask(()=>render(currentId));

if(!document.getElementById('pala-order-files-v239-style')){
  const style=document.createElement('style');
  style.id='pala-order-files-v239-style';
  style.textContent=`
    .booking-files-head-v239{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .booking-files-head-v239 h3{margin:3px 0}
    .booking-files-help-v239{margin:7px 0 12px}
    .booking-file-list-v239{display:grid;gap:8px}
    .booking-file-row-v239{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--line,#e1e5ec);border-radius:12px;background:#fff}
    .booking-file-info-v239{min-width:0;display:flex;flex-direction:column;gap:3px}
    .booking-file-info-v239 strong,.booking-file-info-v239 span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .booking-file-actions-v239{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
    .booking-files-empty-v239{margin:0}
    @media(max-width:620px){
      .booking-files-head-v239{align-items:stretch;flex-direction:column}
      .booking-files-head-v239>.btn{width:100%;justify-content:center}
      .booking-file-row-v239{grid-template-columns:1fr}
      .booking-file-actions-v239{justify-content:flex-start}
      .booking-file-actions-v239 .btn{flex:1;min-width:90px}
    }
  `;
  document.head.appendChild(style);
}
})();