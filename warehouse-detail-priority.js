/* PALA v191 · warehouse detail priority
   Operational facts first; drawings, photos, documents and sources last. */
(()=>{
'use strict';
if(window.__palaWarehouseDetailPriorityV191)return;
window.__palaWarehouseDetailPriorityV191=true;

const norm=value=>String(value??'').trim().toLocaleLowerCase('da-DK');
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
  return qty>0?`${fmt(qty)} stk. pr. telt`:'Pakkemængde mangler';
}
function tentMeasure(t){
  const d=Number(t?.diameter_m),l=Number(t?.length_m),w=Number(t?.width_m);
  const hasLW=Number.isFinite(l)&&l>0&&Number.isFinite(w)&&w>0;
  if(Number.isFinite(d)&&d>0){
    if(hasLW&&(Math.abs(l-d)>.05||Math.abs(w-d)>.05))return `Ø ${fmt(d)} m · footprint ${fmt(l)} × ${fmt(w)} m`;
    return `Ø ${fmt(d)} m`;
  }
  return hasLW?`${fmt(l)} × ${fmt(w)} m`:'Ikke angivet';
}
function fact(label,value,warning=false){
  return `<div class="tent-keyfact-v186${warning?' warning':''}"><span>${escText(label)}</span><strong>${escText(value)}</strong></div>`;
}
function keyFactsCard(t){
  const ploekker=standardQty(t,'Pløkker'),sides=standardQty(t,'Sidestænger');
  const section=document.createElement('section');section.className='card tent-keyfacts-card-v186';
  section.innerHTML=`<div class="small muted">VIGTIGSTE OPLYSNINGER</div><h3>Nøgletal og standardhardware</h3><div class="tent-keyfacts-grid-v186">
    ${fact('Lagerantal',t.stock_count===null||t.stock_count===undefined||t.stock_count===''?'Ikke angivet':`${fmt(t.stock_count)} stk.`)}
    ${fact('Areal',t.area_m2?`${fmt(t.area_m2)} m²`:'Ikke angivet')}
    ${fact('Mål',tentMeasure(t))}
    ${fact('Højde ved mast',t.ridge_height_m?`${fmt(t.ridge_height_m)} m`:'Ikke angivet')}
    ${t.side_height_m?fact('Sidehøjde',`${fmt(t.side_height_m)} m`):''}
    ${fact('Pløkker',ploekker,ploekker.includes('mangler'))}
    ${fact('Sidestænger',sides,sides.includes('mangler'))}
  </div><p class="small muted tent-keyfacts-note-v186">Pløkker og sidestænger er faste standarddele. Hvis pakkemængden mangler, skal den udfyldes på teltets pakkebehov – PALA gætter ikke antallet.</p>`;
  return section;
}
function findCard(rx){return directCards().find(card=>rx.test(heading(card)))}
function drawingCard(t){
  if(!t?.drawing_image)return null;
  let existing=directCards().find(card=>[...card.querySelectorAll('img')].some(img=>img.src===t.drawing_image||img.getAttribute('src')===t.drawing_image));
  if(existing){existing.classList.add('tent-drawing-card-v186');return existing}
  const card=document.createElement('section');card.className='card tent-drawing-card-v186';
  card.innerHTML=`<div class="small muted">TEGNING</div><h3>Plantegning</h3><a class="tent-drawing-link-v186" href="${escText(t.drawing_image)}" target="_blank" rel="noopener noreferrer"><img src="${escText(t.drawing_image)}" alt="Plantegning · ${escText(t.name)}"></a><a class="btn tent-source-button-v186" href="${escText(t.drawing_image)}" target="_blank" rel="noopener noreferrer">${typeof uiIcon==='function'?uiIcon('document'):''} Åbn tegning</a>`;
  return card;
}
function sourceCard(t){
  if(!t?.source_page)return null;
  const card=document.createElement('section');card.className='card tent-source-card-v186';
  card.innerHTML=`<div class="small muted">KILDER</div><h3>Cirkus Panik Teltmageri</h3><p class="small muted">Produktmål og offentlige oplysninger er hentet fra teltmageriets hjemmeside. PALA's interne lagerantal og pakkemængder er fortsat de driftsmæssige værdier.</p><div class="tent-source-links-v186"><a class="btn" href="${escText(t.source_page)}" target="_blank" rel="noopener noreferrer">${typeof uiIcon==='function'?uiIcon('link'):''} Produktside</a><a class="btn" href="https://www.cirkuspanikteltmageri.dk/teltosninger/vores-telte" target="_blank" rel="noopener noreferrer">${typeof uiIcon==='function'?uiIcon('list'):''} Teltoversigt</a><a class="btn" href="https://www.cirkuspanikteltmageri.dk/teltosninger/sporgsmal-og-svar" target="_blank" rel="noopener noreferrer">${typeof uiIcon==='function'?uiIcon('document'):''} Praktisk info</a></div></section>`;
  return card;
}
function prioritizeTent(id){
  const root=document.getElementById('app'),t=window.tents?.[+id]||((typeof tents!=='undefined'&&tents)?tents[+id]:null);
  if(!root||!t)return;
  root.querySelector('.tent-keyfacts-card-v186')?.remove();
  root.querySelector('.tent-source-card-v186')?.remove();
  const first=root.firstElementChild;if(!first)return;
  const facts=keyFactsCard(t);first.insertAdjacentElement('afterend',facts);

  const hardware=findCard(/^(Hardware|Pakkebehov(?: pr\. telt)?)$/i);
  const measures=findCard(/^Mål$/i);
  let anchor=facts;
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
  const source=sourceCard(t);

  // Low-priority media/docs are always appended after all operational information.
  [drawing,images,files,source,nfc].filter(Boolean).forEach(card=>root.appendChild(card));
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
}

const baseOpenTent=window.openTent;
if(typeof baseOpenTent==='function')window.openTent=async function(id){const result=await baseOpenTent.apply(this,arguments);prioritizeTent(+id);return result};
const baseOpenInventory=window.openInventoryNfc;
if(typeof baseOpenInventory==='function')window.openInventoryNfc=function(id){const result=baseOpenInventory.apply(this,arguments);queueMicrotask(()=>prioritizeInventory(+id));return result};

const style=document.createElement('style');style.id='pala-warehouse-detail-priority-v186-style';style.textContent=`
  .tent-keyfacts-card-v186{border-top:4px solid var(--b,#3158e8)!important}
  .tent-keyfacts-card-v186 h3{margin:4px 0 12px}
  .tent-keyfacts-grid-v186{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .tent-keyfact-v186{display:flex;flex-direction:column;gap:4px;padding:11px 12px;border:1px solid var(--line,#e1e5ec);border-radius:12px;background:#f8fafc;min-width:0}
  .tent-keyfact-v186 span{font-size:11px;font-weight:700;color:var(--muted-2,#687487);text-transform:uppercase;letter-spacing:.04em}
  .tent-keyfact-v186 strong{font-size:16px;line-height:1.25;overflow-wrap:anywhere}
  .tent-keyfact-v186.warning{background:#fff7e7;border-color:#efd697}.tent-keyfact-v186.warning strong{color:#805c11}
  .tent-keyfacts-note-v186{margin:10px 2px 0;line-height:1.45}
  .tent-drawing-link-v186{display:block;margin:10px 0}.tent-drawing-link-v186 img{display:block;width:100%;height:auto;max-height:680px;object-fit:contain;border:1px solid var(--line,#e1e5ec);border-radius:12px;background:#fff}
  .tent-source-links-v186{display:flex;gap:7px;flex-wrap:wrap}.tent-source-button-v186{display:inline-flex!important;text-decoration:none;margin-top:4px}.tent-source-card-v186 .btn,.inventory-source-v186 .btn{text-decoration:none}
  .inventory-media-v186 .detail-photo,.inventory-media-v186 .hero{display:block;width:100%;height:auto;max-height:640px;object-fit:contain;margin-top:8px}
  @media(min-width:700px){.tent-keyfacts-grid-v186{grid-template-columns:repeat(4,minmax(0,1fr))}}
  @media(max-width:520px){.tent-keyfacts-grid-v186{grid-template-columns:1fr 1fr}.tent-keyfact-v186{padding:10px}.tent-keyfact-v186 strong{font-size:14px}}
`;
document.head.appendChild(style);
})();
