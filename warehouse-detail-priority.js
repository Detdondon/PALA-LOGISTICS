/* PALA v321 · tent measurements are consolidated in the Mål section; NFC/QR stays admin-only.
   Operational facts first; drawings, photos and documents last. */
(()=>{
'use strict';
if(window.__palaWarehouseDetailPriorityV321)return;
window.__palaWarehouseDetailPriorityV316=true;

const norm=value=>String(value??'').trim().toLocaleLowerCase('da-DK');
const hasValue=value=>value!==null&&value!==undefined&&(typeof value!=='string'||value.trim()!=='')&&(!Array.isArray(value)||value.length>0)&&(typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>0);
const escText=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=value=>{
  const n=Number(value);
  if(!Number.isFinite(n))return '';
  return new Intl.NumberFormat('da-DK',{maximumFractionDigits:2}).format(n);
};
function directCards(){
  const root=document.getElementById('app');
  return root?[...root.children].filter(el=>el.classList?.contains('card')):[];
}
function heading(card){return card?.querySelector('h2,h3')?.textContent?.trim()||''}
function hardwareDisplayName(row){
  let catalogName='';
  try{catalogName=typeof catalogItem==='function'?catalogItem(row?.catalog_id)?.name||'':''}catch(_e){}
  return catalogName||row?.name||'';
}
function standardHardwareType(value){
  const name=norm(value).replace(/\s+/g,' ');
  if(name==='pløk'||name==='pløkker'||name.startsWith('pløk ')||name.startsWith('pløkker '))return 'pløkker';
  if(name==='sidestang'||name==='sidestænger'||name.startsWith('sidestang ')||name.startsWith('sidestænger '))return 'sidestænger';
  return '';
}
function standardQty(tent,name){
  const wanted=standardHardwareType(name)||norm(name);
  const qty=(tent?.hardware||[]).reduce((sum,row)=>{
    const type=standardHardwareType(hardwareDisplayName(row));
    return type===wanted?sum+(Number(row?.qty)||0):sum;
  },0);
  return qty>0?`${fmt(qty)} stk. pr. telt`:'';
}
function tentMeasure(t){
  const d=Number(t?.diameter_m),l=Number(t?.length_m),w=Number(t?.width_m);
  const hasLW=Number.isFinite(l)&&l>0&&Number.isFinite(w)&&w>0;
  if(Number.isFinite(d)&&d>0){
    if(hasLW&&(Math.abs(l-d)>.05||Math.abs(w-d)>.05))return `Ø ${fmt(d)} m · footprint ${fmt(l)} × ${fmt(w)} m`;
    return `Ø ${fmt(d)} m`;
  }
  return hasLW?`${fmt(l)} × ${fmt(w)} m`:'';
}
function fact(label,value){
  return `<div class="tent-keyfact-v186"><span>${escText(label)}</span><strong>${escText(value)}</strong></div>`;
}
function findCard(rx){return directCards().find(card=>rx.test(heading(card)))}
function removeBlankParagraphs(root){
  root?.querySelectorAll?.('p.muted,p.small.muted').forEach(node=>{if(!String(node.textContent||'').trim())node.remove()});
}
function cleanupMeasureCard(){
  const card=findCard(/^Mål$/i);if(!card)return;
  card.querySelectorAll('.measure').forEach(row=>{
    const value=String(row.querySelector('strong')?.textContent||'').trim();
    if(!value||value==='—'||/^ikke angivet$/i.test(value))row.remove();
  });
  if(!card.querySelector('.measure'))card.remove();
}
function cleanupTentMissingInfo(t){
  const root=document.getElementById('app'),first=root?.firstElementChild;if(!root||!first)return;
  removeBlankParagraphs(first);
  if(!hasValue(t?.stock_count)){
    const stock=[...first.querySelectorAll('b')].find(node=>/tilgængelig/i.test(node.textContent||''));
    stock?.remove();
  }
  cleanupMeasureCard();
  const note=root.querySelector('.tent-note-card');
  if(note&&!hasValue(typeof tentNoteFor==='function'?tentNoteFor(t.id)?.note:null)){
    [...note.querySelectorAll('.small.muted')].filter(node=>/ingen bemærkning/i.test(node.textContent||'')).forEach(node=>node.remove());
  }
  const docs=findCard(/^Dokumenter$/i);
  let docCount=0;try{docCount=typeof tentDocs==='function'?tentDocs(t.id).length:0}catch(_e){}
  if(docs&&!docCount)docs.remove();
  const hardware=findCard(/^(Hardware|Pakkebehov(?: pr\. telt)?)$/i);
  const activeHardware=(t?.hardware||[]).filter(row=>(Number(row?.qty)||0)>0);
  if(hardware&&!activeHardware.length){
    hardware.querySelectorAll('p.muted,p.small.muted').forEach(node=>node.remove());
    if(!hardware.querySelector('button'))hardware.remove();
  }
}
function cleanupInventoryMissingInfo(item){
  const first=document.getElementById('app')?.firstElementChild;if(!first)return;
  removeBlankParagraphs(first);
  if(!hasValue(item?.quantity_total)){
    const stock=[...first.querySelectorAll('b')].find(node=>/lager|tilgængelig|kontrol/i.test(node.textContent||''));
    stock?.remove();
  }
}
function cleanupCatalogHardwareMissingInfo(id){
  let item=null;try{item=typeof catalogItem==='function'?catalogItem(id):null}catch(_e){}
  const root=document.getElementById('app'),first=root?.firstElementChild;if(!root||!first||!item)return;
  removeBlankParagraphs(first);
  if(!hasValue(item.quantity_total)){
    [...first.querySelectorAll(':scope > p')].filter(node=>/lager|antal|optalt|beholdning/i.test(node.textContent||'')).forEach(node=>node.remove());
  }
  const requirements=typeof catalogRequirements==='function'?catalogRequirements(id):[];
  const links=[...new Set((requirements||[]).map(row=>+row.tent_id).concat((item.compatible_tent_ids||[]).map(Number)).filter(Boolean))];
  const usedBy=findCard(/^Bruges til$/i);if(usedBy&&!links.length)usedBy.remove();
}
function cleanupLegacyHardwareMissingInfo(id){
  let item=null;try{item=typeof findHardware==='function'?findHardware(id):null}catch(_e){}
  const first=document.getElementById('app')?.firstElementChild;if(!first||!item)return;
  removeBlankParagraphs(first);
  if(!item?.tent?.name)[...first.querySelectorAll('.small')].filter(node=>/tilhører telt/i.test(node.textContent||'')).forEach(node=>node.remove());
  if(!hasValue(item.qty))[...first.querySelectorAll('.small')].filter(node=>/skal med pr\. telt/i.test(node.textContent||'')).forEach(node=>node.remove());
}
function cleanupSpecialHardwareMissingInfo(id){
  let item=null;try{item=(specialHardware||[]).find(row=>+row.id===+id)}catch(_e){}
  const root=document.getElementById('app'),first=root?.firstElementChild;if(!root||!first||!item)return;
  removeBlankParagraphs(first);
  if(!hasValue(item.quantity_total))first.querySelector('.pill')?.remove();
  const linked=(item.tent_ids||[]).map(tentId=>tents?.[+tentId]).filter(Boolean);
  const fits=findCard(/^Passer til$/i);if(fits&&!linked.length)fits.remove();
}
function drawingCard(t){
  if(!t?.drawing_image)return null;
  let existing=directCards().find(card=>[...card.querySelectorAll('img')].some(img=>img.src===t.drawing_image||img.getAttribute('src')===t.drawing_image));
  if(existing){existing.classList.add('tent-drawing-card-v186');return existing}
  const card=document.createElement('section');card.className='card tent-drawing-card-v186';
  card.innerHTML=`<div class="small muted">TEGNING</div><h3>Plantegning</h3><a class="tent-drawing-link-v186" href="${escText(t.drawing_image)}" target="_blank" rel="noopener noreferrer"><img src="${escText(t.drawing_image)}" alt="Plantegning · ${escText(t.name)}"></a><a class="btn tent-source-button-v186" href="${escText(t.drawing_image)}" target="_blank" rel="noopener noreferrer">${typeof uiIcon==='function'?uiIcon('document'):''} Åbn tegning</a>`;
  return card;
}
function prioritizeTent(id){
  const root=document.getElementById('app'),t=window.tents?.[+id]||((typeof tents!=='undefined'&&tents)?tents[+id]:null);
  if(!root||!t)return;
  root.querySelector('.tent-keyfacts-card-v186')?.remove();
  root.querySelector('.tent-source-card-v186')?.remove();
  const first=root.firstElementChild;if(!first)return;
  let anchor=first;

  const hardware=findCard(/^(Hardware|Pakkebehov(?: pr\. telt)?)$/i);
  const measures=findCard(/^Mål$/i);
  if(hardware){
    const h=hardware.querySelector('h3');if(h)h.textContent='Pakkebehov pr. telt';
    anchor.insertAdjacentElement('afterend',hardware);anchor=hardware;
  }
  if(measures){anchor.insertAdjacentElement('afterend',measures);anchor=measures}

  // Reuse/create the website drawing, but keep it in the media section at the bottom.
  const drawing=drawingCard(t);
  const images=findCard(/^Billeder$/i);
  const files=findCard(/^(Filer og tegninger|Dokumenter(?: til teltet)?)$/i);
  const nfc=findCard(/Permanent NFC-link/i);
  if(nfc&&!isAdminLoggedIn())nfc.remove();

  // Low-priority media/docs are always appended after all operational information.
  // The former public "Kilder" section is intentionally not rendered.
  [drawing,images,files,isAdminLoggedIn()?nfc:null].filter(Boolean).forEach(card=>root.appendChild(card));
  cleanupTentMissingInfo(t);
}

const inventorySources=new Map([
  ['trægulv','https://www.cirkuspanikteltmageri.dk/teltosninger/sporgsmal-og-svar'],
  ['plastgulv','https://www.cirkuspanikteltmageri.dk/teltosninger/sporgsmal-og-svar'],
  ['lyskæde glødepære','https://www.cirkuspanikteltmageri.dk/teltosninger/pakker-og-tilbehor'],
  ['brandudstyrspakke 200–499 m²','https://www.cirkuspanikteltmageri.dk/teltosninger/pakker-og-tilbehor']
]);
function prioritizeInventory(id){
  const root=document.getElementById('app');
  let item=null;try{item=(inventory||[]).find(x=>+x.id===+id)}catch(_e){}
  if(!root||!item)return;
  root.querySelector('.inventory-media-v186')?.remove();root.querySelector('.inventory-source-v186')?.remove();
  let image=[...root.querySelectorAll('img.detail-photo,img.hero')].find(img=>img.closest('#app'));
  if(!image&&item.image){image=document.createElement('img');image.className='detail-photo';image.src=item.image;image.alt=item.name||'Inventar'}
  if(image){
    const card=document.createElement('section');card.className='card inventory-media-v186';card.innerHTML='<div class="small muted">BILLEDE</div><h3>Billede</h3>';card.appendChild(image);root.appendChild(card);
  }
  const source=inventorySources.get(norm(item.name));
  if(source){
    const card=document.createElement('section');card.className='card inventory-source-v186';card.innerHTML=`<div class="small muted">KILDE</div><h3>Cirkus Panik Teltmageri</h3><a class="btn" href="${source}" target="_blank" rel="noopener noreferrer">${typeof uiIcon==='function'?uiIcon('link'):''} Se offentlig information</a>`;root.appendChild(card);
  }
  cleanupInventoryMissingInfo(item);
}

const baseOpenTent=window.openTent;
if(typeof baseOpenTent==='function')window.openTent=async function(id){const result=await baseOpenTent.apply(this,arguments);prioritizeTent(+id);return result};
const baseOpenInventory=window.openInventoryNfc;
if(typeof baseOpenInventory==='function')window.openInventoryNfc=function(id){const result=baseOpenInventory.apply(this,arguments);queueMicrotask(()=>prioritizeInventory(+id));return result};
const baseOpenCatalogHardware=window.openCatalogHardware;
if(typeof baseOpenCatalogHardware==='function')window.openCatalogHardware=function(id){const result=baseOpenCatalogHardware.apply(this,arguments);cleanupCatalogHardwareMissingInfo(+id);return result};
const baseOpenHardware=window.openHardwareNfc;
if(typeof baseOpenHardware==='function')window.openHardwareNfc=function(id){const result=baseOpenHardware.apply(this,arguments);queueMicrotask(()=>cleanupLegacyHardwareMissingInfo(+id));return result};
const baseOpenSpecialHardware=window.openSpecialHardware;
if(typeof baseOpenSpecialHardware==='function')window.openSpecialHardware=function(id){const result=baseOpenSpecialHardware.apply(this,arguments);queueMicrotask(()=>cleanupSpecialHardwareMissingInfo(+id));return result};

const style=document.createElement('style');style.id='pala-warehouse-detail-priority-v186-style';style.textContent=`
  .tent-drawing-link-v186{display:block;margin:10px 0}.tent-drawing-link-v186 img{display:block;width:100%;height:auto;max-height:680px;object-fit:contain;border:1px solid var(--line,#e1e5ec);border-radius:12px;background:#fff}
  .tent-source-button-v186{display:inline-flex!important;text-decoration:none;margin-top:4px}.inventory-source-v186 .btn{text-decoration:none}
  .inventory-media-v186 .detail-photo,.inventory-media-v186 .hero{display:block;width:100%;height:auto;max-height:640px;object-fit:contain;margin-top:8px}
`;
document.head.appendChild(style);
})();
