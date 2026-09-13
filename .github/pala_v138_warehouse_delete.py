from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v138 · admin delete from warehouse'
if marker in text:
    raise SystemExit('PALA v138 already present')

# Bump current visible version only.
text=text.replace('<span class="app-version" hidden>v137</span>','<span class="app-version" hidden>v138</span>')
text=text.replace("document.querySelector('.app-version').textContent='v137';","document.querySelector('.app-version').textContent='v138';",1)
text=text.replace("badge.textContent='v137';","badge.textContent='v138';")

needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch=r'''

/* PALA v138 · admin delete from warehouse */
function installWarehouseDeleteButtonV138(kind,id,name){
  if(!id||!isAdminLoggedIn())return;
  let footer=document.querySelector('#palaEditSheet .sheet-footer');
  if(!footer||footer.querySelector('[data-warehouse-delete-v138]'))return;
  let button=document.createElement('button');
  button.type='button';
  button.className='btn bad';
  button.dataset.warehouseDeleteV138=kind;
  button.innerHTML=`${uiIcon('trash')} Slet`;
  button.onclick=()=>deleteWarehouseItemV138(kind,+id,name||'');
  footer.insertBefore(button,footer.firstChild);
}

async function deleteWarehouseItemV138(kind,id,name){
  if(!requireAdmin()||!id)return;
  let labels={tent:'teltet',inventory:'inventaret',hardware:'hardwaren'};
  let label=labels[kind]||'posten';
  let warning=`Slet ${label}${name?` \"${name}\"`:''} permanent fra lageret?`;
  if(kind==='tent')warning+=' Teltets billeder, dokumenter, pakkeregler og ordretilknytninger kan også blive fjernet.';
  if(!confirm(warning+'\n\nDenne handling kan ikke fortrydes.'))return;
  try{
    if(kind==='tent'){
      await checkedRpc('admin_delete_tent',{p_token:adminToken,p_id:+id});
    }else if(kind==='inventory'){
      await checkedRpc('admin_delete_inventory',{p_token:adminToken,p_id:+id});
      if(typeof removeInventoryCacheItem==='function')removeInventoryCacheItem(+id);
    }else if(kind==='hardware'){
      let item=typeof catalogItem==='function'?catalogItem(+id):null;
      if(item?.legacy_special_id){
        await checkedRpc('admin_delete_special_hardware',{p_token:adminToken,p_id:+item.legacy_special_id});
      }else{
        alert('Denne hardwarepost kan ikke slettes sikkert med den nuværende databasefunktion. Ingen data er ændret.');
        return;
      }
    }else return;
    sheetDirty=false;
    closeEditSheet(true);
    await reloadData();
    if(kind==='hardware'&&typeof loadWarehouseExtensions==='function')await loadWarehouseExtensions();
    await showTents(kind==='tent'?'tents':kind);
  }catch(error){
    alert('Kunne ikke slette fra lageret: '+String(error?.message||error));
  }
}

const editTentBasicsV138Base=editTentBasics;
editTentBasics=function(id){
  let result=editTentBasicsV138Base.apply(this,arguments);
  if(id)installWarehouseDeleteButtonV138('tent',+id,tents[+id]?.name||'');
  return result;
};

const editInventoryBasicsV138Base=editInventoryBasics;
editInventoryBasics=function(id){
  let result=editInventoryBasicsV138Base.apply(this,arguments);
  if(id){let item=inventory.find(row=>+row.id===+id);installWarehouseDeleteButtonV138('inventory',+id,item?.name||'');}
  return result;
};

const editCatalogHardwareV138Base=editCatalogHardware;
editCatalogHardware=function(id){
  let result=editCatalogHardwareV138Base.apply(this,arguments);
  if(id){let item=typeof catalogItem==='function'?catalogItem(+id):null;if(item?.legacy_special_id)installWarehouseDeleteButtonV138('hardware',+id,item?.name||'');}
  return result;
};

const syncVersionBadgeV138Base=syncVersionBadgeV134;
syncVersionBadgeV134=function(){
  let result=syncVersionBadgeV138Base.apply(this,arguments);
  let badge=document.querySelector('.app-version');
  if(badge)badge.textContent='v138';
  return result;
};
'''

path.write_text(text.replace(needle,patch+needle,1),encoding='utf-8')
