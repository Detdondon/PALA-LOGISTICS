/* PALA v192 · edit pløkker and sidestænger directly with tent basics */
(()=>{
'use strict';
if(window.__palaAdminTentStandardHardwareV192)return;
window.__palaAdminTentStandardHardwareV192=true;

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

window.editTentBasics=function(id){
  if(!requireAdmin())return;
  let t=tents[+id]||{},fields=[['area_m2','Areal (m²)'],['diameter_m','Diameter (m)'],['length_m','Længde (m)'],['width_m','Bredde (m)'],['side_height_m','Sidehøjde (m)'],['ridge_height_m','Kiphøjde (m)']];
  const ploekker=standardTotal(t,'pløkker');
  const sidestaenger=standardTotal(t,'sidestænger');
  openEditSheet(id?'Redigér telt':'Nyt telt',
    `${sheetField('name','Navn',t.name,'text','required')}`+
    `${sheetField('stock_count','Samlet lagerantal',t.stock_count,'number','min="0" step="1" placeholder="Ikke angivet"')}`+
    `${sheetText('description','Beskrivelse',t.description)}`+
    `<details class="sheet-group" open><summary>Mål</summary><div class="two">${fields.map(([k,l])=>sheetField(k,l,t[k],'number','min="0" step="0.01"')).join('')}</div></details>`+
    `<details class="sheet-group" open><summary>Standardhardware</summary><p class="small muted">Antal der altid skal med til ét telt. Ændringerne gemmes i teltets pakkebehov.</p><div class="two">${sheetField('ploekker_qty','Pløkker pr. telt',ploekker,'number','min="0" step="1"')}${sheetField('sidestaenger_qty','Sidestænger pr. telt',sidestaenger,'number','min="0" step="1"')}</div></details>`+
    `<details class="sheet-group"><summary>Version af et andet telt</summary><label for="s_parent_tent_id">Hovedtelt</label><select id="s_parent_tent_id"><option value="">Selvstændigt telt / frakobl</option>${tentParentOptions(t).map(r=>`<option value="${r.id}" ${+r.id===+t.parent_tent_id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></details>`,
    async()=>{
      let data={name:sheetValue('name'),description:sheetValue('description'),stock_count:sheetNumber('stock_count'),parent_tent_id:sheetValue('parent_tent_id')};
      fields.forEach(([k])=>data[k]=sheetNumber(k));
      const plQty=Math.max(0,Number(sheetValue('ploekker_qty'))||0);
      const sideQty=Math.max(0,Number(sheetValue('sidestaenger_qty'))||0);
      let tid=await checkedRpc('admin_save_tent_basics',{p_token:adminToken,p_id:id||null,p_data:data});
      await reloadData();
      const saved=tents[+tid]||{};
      const rows=(saved.hardware||[]).map(row=>({id:+row.id||null,catalog_id:+row.catalog_id||null,qty:Number(row.qty)||0}));
      const hadStandard=rows.some(row=>standardType(catalogName(row)));
      setStandardQty(rows,'pløkker',plQty);
      setStandardQty(rows,'sidestænger',sideQty);
      if(hadStandard||plQty>0||sideQty>0){
        await checkedRpc('admin_save_tent_requirements',{p_token:adminToken,p_tent_id:+tid,p_rows:rows});
        await reloadData();
      }
      await openTent(tid);
    }
  );
};
})();
