from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v127 · restore tent images and files'
if marker in text:
    raise SystemExit('PALA v127 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v127 · restore tent images and files */
if(!document.getElementById('pala-v127-tent-files-style'))document.head.insertAdjacentHTML('beforeend',`<style id="pala-v127-tent-files-style">
.tent-files-v127 .tent-file-list{display:grid;gap:9px;margin-top:12px}.tent-file-row-v127{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #e8edf4}.tent-file-row-v127:last-child{border-bottom:0}.tent-file-info-v127{min-width:0}.tent-file-info-v127 strong,.tent-file-info-v127 span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tent-file-actions-v127{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.tent-file-actions-v127 .btn{padding:9px 11px}.tent-media-head-v127{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.tent-media-head-v127 h3{margin:0}.tent-media-admin-v127{display:flex;gap:7px;flex-wrap:wrap}.tent-empty-media-v127{margin:10px 0 0}.tent-images-v127{order:0}
@media(max-width:600px){.tent-file-row-v127{grid-template-columns:1fr}.tent-file-actions-v127{justify-content:flex-start}.tent-file-actions-v127 .btn{flex:1;min-width:110px}.tent-media-admin-v127{width:100%}.tent-media-admin-v127 .btn{flex:1}}
</style>`);

async function tentDocumentPayloadV127(id){
  let r=await sb.from('tent_documents').select('id,tent_id,title,file_name,mime_type,file_data').eq('id',+id).single();
  if(r.error){alert('Kunne ikke hente filen: '+r.error.message);return null}
  return r.data||null;
}
async function openTentDocumentSeparateV127(id){
  let popup=window.open('about:blank','_blank');
  if(popup){try{popup.document.title='Åbner fil…';popup.document.body.innerHTML='<p style="font-family:system-ui;padding:20px">Åbner fil…</p>'}catch(e){}}
  let d=await tentDocumentPayloadV127(id);
  if(!d){try{popup?.close()}catch(e){};return}
  if(popup){try{popup.location.href=d.file_data;return}catch(e){}}
  let a=document.createElement('a');a.href=d.file_data;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
}
async function downloadTentDocumentV127(id){
  let d=await tentDocumentPayloadV127(id);if(!d)return;
  let a=document.createElement('a');a.href=d.file_data;a.download=d.file_name||d.title||'telt-fil';document.body.appendChild(a);a.click();a.remove();
}
function tentFileTypeLabelV127(doc){
  let mime=String(doc?.mime_type||'').toLowerCase(),name=String(doc?.file_name||'');
  if(mime.includes('pdf')||/\.pdf$/i.test(name))return 'PDF';
  if(mime.startsWith('image/')||/\.(png|jpe?g|webp|gif|heic)$/i.test(name))return 'Billede';
  if(/\.(docx?|odt)$/i.test(name))return 'Dokument';
  if(/\.(xlsx?|csv|ods)$/i.test(name))return 'Regneark';
  return 'Fil';
}
function installTentMediaV127(id){
  let tent=tents[+id];if(!tent)return;
  let docs=tentDocs(+id);
  let directCards=[...app.children].filter(el=>el.classList?.contains('card'));
  let docCards=directCards.filter(card=>/Dokumenter(?: til teltet)?/i.test(card.querySelector('h3')?.textContent||''));
  let docCard=docCards.shift();docCards.forEach(card=>card.remove());
  if(!docCard){docCard=document.createElement('section');docCard.className='card';app.appendChild(docCard)}
  docCard.classList.add('tent-files-v127');
  docCard.innerHTML=`<div class="tent-media-head-v127"><div><div class="small muted">TELTETS FILER</div><h3>Filer og tegninger</h3></div>${isAdminLoggedIn()?`<div class="tent-media-admin-v127"><button type="button" class="btn primary" onclick="openTentAdvanced(${+id},'Dokumenter')">${uiIcon('plus')} Tilføj fil</button></div>`:''}</div><p class="small muted">Opsætningstegninger, oversigtstegninger, PDF’er, billeder og andre filer til teltet. Alle medarbejdere kan åbne eller downloade dem.</p><div class="tent-file-list">${docs.length?docs.map(doc=>`<div class="tent-file-row-v127"><div class="tent-file-info-v127"><strong>${esc(doc.title||doc.file_name||'Fil')}</strong><span class="small muted">${esc(doc.file_name||tentFileTypeLabelV127(doc))} · ${esc(tentFileTypeLabelV127(doc))}</span></div><div class="tent-file-actions-v127"><button type="button" class="btn" onclick="openTentDocumentSeparateV127(${+doc.id})">${uiIcon('document')} Åbn</button><button type="button" class="btn" onclick="downloadTentDocumentV127(${+doc.id})">${uiIcon('download')} Download</button>${isAdminLoggedIn()?`<button type="button" class="btn bad" onclick="deleteTentDocument(${+doc.id},${+id})">${uiIcon('trash')} Slet</button>`:''}</div></div>`).join(''):'<p class="muted tent-empty-media-v127">Ingen filer er tilknyttet teltet endnu.</p>'}</div>`;

  directCards=[...app.children].filter(el=>el.classList?.contains('card'));
  let imageCard=directCards.find(card=>/^Billeder$/i.test(card.querySelector('h3')?.textContent?.trim()||''));
  if(!imageCard&&isAdminLoggedIn()){
    imageCard=document.createElement('section');imageCard.className='card tent-images-v127';
    imageCard.innerHTML=`<div class="tent-media-head-v127"><h3>Billeder</h3><div class="tent-media-admin-v127"><button type="button" class="btn primary tent-media-add-image-v127" onclick="openTentAdvanced(${+id},'Billeder')">${uiIcon('plus')} Tilføj billede</button></div></div><p class="muted tent-empty-media-v127">Ingen ekstra billeder er tilføjet endnu.</p>`;
    docCard.insertAdjacentElement('beforebegin',imageCard);
  }else if(imageCard&&isAdminLoggedIn()&&!imageCard.querySelector('.tent-media-add-image-v127')){
    let heading=imageCard.querySelector('h3'),row=heading?.parentElement?.classList.contains('row')?heading.parentElement:null;
    if(!row&&heading){row=document.createElement('div');row.className='tent-media-head-v127';heading.replaceWith(row);row.appendChild(heading)}
    if(row){let controls=document.createElement('div');controls.className='tent-media-admin-v127';controls.innerHTML=`<button type="button" class="btn primary tent-media-add-image-v127" onclick="openTentAdvanced(${+id},'Billeder')">${uiIcon('plus')} Tilføj billede</button>`;row.appendChild(controls)}
  }
}
const openTentV127Base=openTent;
openTent=async function(id,bookingId){await openTentV127Base(id,bookingId);installTentMediaV127(+id)};
'''
text=text.replace(needle,patch+needle,1)
path.write_text(text,encoding='utf-8')
