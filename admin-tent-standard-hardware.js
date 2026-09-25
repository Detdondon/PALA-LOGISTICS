/* PALA v319 · all tent standard hardware, including masts, lives in one editor section. */
(()=>{
'use strict';
if(window.__palaAdminTentStandardHardwareV319)return;
window.__palaAdminTentStandardHardwareV292=true;

const norm=value=>String(value??'').trim().toLocaleLowerCase('da-DK').replace(/\s+/g,' ');
function catalogName(row){
  let name='';
  try{name=typeof catalogItem==='function'?catalogItem(row?.catalog_id)?.name||'':''}catch(_e){}
  return name||row?.name||'';
}
function standardType(value){
  const name=norm(value);
  if(name==='pløk'||name==='pløkker'||name.startsWith('pløk ')||name.startsWith('pløkker '))return 'pløkker';
  if(name==='sidestang'||name==='sidestænger'||name.startsWith('sidestang ')||name.startsWith('sidestænger '))return 'sidestænger';
  return '';
}
function standardTotal(tent,type){
  return (tent?.hardware||[]).reduce((sum,row)=>standardType(catalogName(row))===type?sum+(Number(row?.qty)||0):sum,0);
}
function preferredCatalogId(type){
  const list=Array.isArray(hardwareCatalog)?hardwareCatalog:[];
  const exact=list.find(item=>standardType(typeof catalogOptionName==='function'?catalogOptionName(item):item?.name)===type && norm(item?.name)===type);
  if(exact)return +exact.id;
  const named=list.find(item=>standardType(typeof catalogOptionName==='function'?catalogOptionName(item):item?.name)===type);
  if(named)return +named.id;
  const category=list.find(item=>norm(item?.category)===type);
  return category?+category.id:null;
}
function setStandardQty(rows,type,qty){
  const matches=rows.filter(row=>standardType(catalogName(row))===type);
  if(matches.length){
    matches.forEach((row,index)=>row.qty=index===0?qty:0);
    return;
  }
  if(qty<=0)return;
  const catalogId=preferredCatalogId(type);
  if(!catalogId)throw new Error(`Kan ikke finde ${type} i hardwarekataloget.`);
  rows.push({id:null,catalog_id:catalogId,qty});
}
function catalogById(id){
  try{const item=typeof catalogItem==='function'?catalogItem(id):null;if(item)return item}catch(_e){}
  return (Array.isArray(hardwareCatalog)?hardwareCatalog:[]).find(item=>+item.id===+id)||null;
}
function isMastCatalogItem(item){
  return !!item&&(norm(item.category)==='master'||/\bmast(?:er)?\b/.test(norm(item.name)));
}
function isMastRow(row){return isMastCatalogItem(catalogById(row?.catalog_id))||/\bmast(?:er)?\b/.test(norm(row?.name))}
function mastCatalogItems(){
  return (Array.isArray(hardwareCatalog)?hardwareCatalog:[])
    .filter(isMastCatalogItem)
    .sort((a,b)=>String(a?.name||'').localeCompare(String(b?.name||''),'da'));
}
function mastOptionName(item){
  try{return typeof catalogOptionName==='function'?catalogOptionName(item):item?.name||'Mast'}catch(_e){return item?.name||'Mast'}
}
function mastEditorRow(row={}){
  const options=mastCatalogItems();
  return `<div class="requirement-row tent-mast-row" data-id="${row.id||''}"><div><label>Mast</label><select class="tent-mast-catalog" required><option value="">Vælg mast</option>${options.map(item=>`<option value="${item.id}" ${+item.id===+row.catalog_id?'selected':''}>${esc(mastOptionName(item))}</option>`).join('')}</select></div><div><label>Antal pr. telt</label><input class="tent-mast-qty" type="number" min="1" step="1" required value="${Number(row.qty)>0?Number(row.qty):1}"></div><button type="button" class="btn" onclick="this.closest('.tent-mast-row').remove()" aria-label="Fjern mast">Fjern</button></div>`;
}
function mastRowsFromEditor(){
  return [...document.querySelectorAll('#tentMastRows .tent-mast-row')].map(row=>({
    catalog_id:+row.querySelector('.tent-mast-catalog')?.value||0,
    qty:Math.max(1,+row.querySelector('.tent-mast-qty')?.value||1)
  })).filter(row=>row.catalog_id);
}
function replaceMastRows(rows,desired){
  const existing=new Map();
  rows.filter(isMastRow).forEach(row=>{
    const key=+row.catalog_id||0;if(!key)return;
    if(!existing.has(key))existing.set(key,[]);
    existing.get(key).push(row);
  });
  const wanted=new Map();
  desired.forEach(row=>wanted.set(+row.catalog_id,(wanted.get(+row.catalog_id)||0)+Math.max(1,+row.qty||1)));
  const next=rows.filter(row=>!isMastRow(row));
  wanted.forEach((qty,catalogId)=>{
    const previous=(existing.get(catalogId)||[]).shift();
    next.push({id:+previous?.id||null,catalog_id:catalogId,qty});
  });
  return next;
}
window.addTentMastEditorRow=function(){
  const host=document.getElementById('tentMastRows');if(!host)return;
  host.insertAdjacentHTML('beforeend',mastEditorRow());
  window.PALAEditor?.refresh?.();
};

window.editTentBasics=function(id){
  if(!requireAdmin())return;
  let t=tents[+id]||{},fields=[['area_m2','Areal (m²)'],['diameter_m','Diameter (m)'],['length_m','Længde (m)'],['width_m','Bredde (m)'],['side_height_m','Sidehøjde (m)'],['ridge_height_m','Kiphøjde (m)']];
  const ploekker=standardTotal(t,'pløkker');
  const sidestaenger=standardTotal(t,'sidestænger');
  const mastRows=(t.hardware||[]).filter(isMastRow);
  const mastOptions=mastCatalogItems();
  openEditSheet(id?'Redigér telt':'Nyt telt',
    `${sheetField('name','Navn',t.name,'text','required')}`+
    `${sheetField('stock_count','Samlet lagerantal',t.stock_count,'number','min="0" step="1" placeholder="Ikke angivet"')}`+
    `${sheetText('description','Beskrivelse',t.description)}`+
    `<details class="sheet-group" open><summary>Mål</summary><div class="two">${fields.map(([k,l])=>sheetField(k,l,t[k],'number','min="0" step="0.01"')).join('')}</div></details>`+
    `<details class="sheet-group tent-hardware-requirement" open><summary>Standardhardware</summary><p class="small muted">Hardware der altid skal med til ét telt. Ændringerne gemmes som teltets pakkebehov.</p><div class="two">${sheetField('ploekker_qty','Pløkker pr. telt',ploekker,'number','min="0" step="1"')}${sheetField('sidestaenger_qty','Sidestænger pr. telt',sidestaenger,'number','min="0" step="1"')}</div><div class="tent-standard-masts-v319"><div class="small muted">MASTER</div><p class="small muted">Vælg den eller de master, der hører til teltet, og antal pr. telt.</p><div id="tentMastRows">${mastRows.map(mastEditorRow).join('')}</div>${mastOptions.length?'<button type="button" class="btn" onclick="addTentMastEditorRow()">+ Tilføj mast</button>':'<p class="small muted">Der findes endnu ingen master i hardwarekataloget.</p>'}</div></details>`+
    `<details class="sheet-group"><summary>Version af et andet telt</summary><label for="s_parent_tent_id">Hovedtelt</label><select id="s_parent_tent_id"><option value="">Selvstændigt telt / frakobl</option>${tentParentOptions(t).map(r=>`<option value="${r.id}" ${+r.id===+t.parent_tent_id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></details>`,
    async()=>{
      let data={name:sheetValue('name'),description:sheetValue('description'),stock_count:sheetNumber('stock_count'),parent_tent_id:sheetValue('parent_tent_id')};
      fields.forEach(([k])=>data[k]=sheetNumber(k));
      const plQty=Math.max(0,Number(sheetValue('ploekker_qty'))||0);
      const sideQty=Math.max(0,Number(sheetValue('sidestaenger_qty'))||0);
      const desiredMasts=mastRowsFromEditor();
      let tid=await checkedRpc('admin_save_tent_basics',{p_token:adminToken,p_id:id||null,p_data:data});
      await reloadData();
      const saved=tents[+tid]||{};
      let rows=(saved.hardware||[]).map(row=>({id:+row.id||null,catalog_id:+row.catalog_id||null,qty:Number(row.qty)||0,name:row.name||''}));
      const hadManaged=rows.some(row=>standardType(catalogName(row))||isMastRow(row));
      rows=replaceMastRows(rows,desiredMasts);
      setStandardQty(rows,'pløkker',plQty);
      setStandardQty(rows,'sidestænger',sideQty);
      if(hadManaged||plQty>0||sideQty>0||desiredMasts.length){
        await checkedRpc('admin_save_tent_requirements',{p_token:adminToken,p_tent_id:+tid,p_rows:rows.map(({id,catalog_id,qty})=>({id,catalog_id,qty}))});
        await reloadData();
      }
      await openTent(tid);
    }
  );
  installSheetCategory('tent',t);
  if(id&&typeof installWarehouseDeleteButtonV138==='function'){
    installWarehouseDeleteButtonV138('tent',+id,t.name||'');
  }
};
if(!document.getElementById('pala-tent-standard-hardware-v347-style')){
  const style=document.createElement('style');
  style.id='pala-tent-standard-hardware-v319-style';
  style.textContent='.tent-standard-masts-v319{margin-top:14px;padding-top:12px;border-top:1px solid var(--line,#e4eaf2)}.tent-standard-masts-v319>.small:first-child{font-size:10px;font-weight:750;letter-spacing:.04em}.tent-standard-masts-v319>p{margin:4px 0 8px}';
  document.head.appendChild(style);
}
})();
