/* PALA v183 · clear warehouse structure
   Fixed four-root hierarchy, universal placement, compact dropdowns and tent links. */
(()=>{
'use strict';
if(window.__palaWarehouseCategoriesV183||typeof showTents!=='function')return;
window.__palaWarehouseCategoriesV183=true;

const GROUPS=[
  {kind:'tent',filter:'tents',label:'Telte',order:10,icon:'tent'},
  {kind:'hardware',filter:'hardware',label:'Hardware',order:20,icon:'settings'},
  {kind:'inventory',filter:'inventory',label:'Inventar',order:30,icon:'box'},
  {kind:'other',filter:'other',label:'Øvrigt',order:40,icon:'list'}
];
const ROOT_NAMES=new Set(['tent:telte','hardware:hardware','inventory:inventar','other:øvrigt']);
const escText=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const allCategories=()=>Array.isArray(window.warehouseCategories)?window.warehouseCategories:(typeof warehouseCategories!=='undefined'&&Array.isArray(warehouseCategories)?warehouseCategories:[]);
const categoryById=id=>allCategories().find(c=>+c.id===+id)||null;
const rowsFor=kind=>allCategories().filter(c=>c.kind===kind);
const sortCategories=(a,b)=>(+a.sort_order||999)-(+b.sort_order||999)||(typeof alpha==='function'?alpha(a.name,b.name):String(a.name).localeCompare(String(b.name),'da'));
const sourceRows=kind=>{try{return typeof stockKindRows==='function'?(stockKindRows(kind)||[]):[]}catch(_e){return[]}};
const warehouseItems=()=>['tent','hardware','inventory'].flatMap(kind=>sourceRows(kind).map(item=>({kind,item})));
const isFixedRoot=c=>!!c&&!c.parent_id&&ROOT_NAMES.has(`${c.kind}:${String(c.name||'').toLocaleLowerCase('da-DK')}`);

function childMap(kind){
  const map=new Map();
  rowsFor(kind).forEach(c=>{const parent=+c.parent_id||0;if(!map.has(parent))map.set(parent,[]);map.get(parent).push(c)});
  map.forEach(list=>list.sort(sortCategories));
  return map;
}
function rootsFor(kind){
  const rows=rowsFor(kind),byId=new Map(rows.map(c=>[+c.id,c]));
  return rows.filter(c=>!c.parent_id||!byId.has(+c.parent_id)).sort(sortCategories);
}
function flattenKind(kind){
  const children=childMap(kind),out=[],seen=new Set();
  const walk=(c,depth,path)=>{
    if(!c||seen.has(+c.id))return;seen.add(+c.id);
    const next=[...path,c.name];out.push({category:c,depth,path:next});
    (children.get(+c.id)||[]).forEach(ch=>walk(ch,depth+1,next));
  };
  rootsFor(kind).forEach(c=>walk(c,0,[]));
  rowsFor(kind).filter(c=>!seen.has(+c.id)).sort(sortCategories).forEach(c=>walk(c,0,[]));
  return out;
}
function categoryPathById(id){
  const c=categoryById(id);if(!c)return 'Øvrigt';
  return flattenKind(c.kind).find(x=>+x.category.id===+id)?.path.join(' › ')||c.name;
}
function descendants(kind,id){
  const children=childMap(kind),ids=new Set();
  const walk=parent=>(children.get(+parent)||[]).forEach(c=>{if(ids.has(+c.id))return;ids.add(+c.id);walk(c.id)});
  walk(id);return ids;
}
function categoryOptions(currentId=0,kindFilter=null,parentMode=false,editedId=0){
  const groups=kindFilter?GROUPS.filter(g=>g.kind===kindFilter):GROUPS;
  const blocked=editedId&&kindFilter?descendants(kindFilter,editedId):new Set();
  if(editedId)blocked.add(+editedId);
  let html=parentMode?'<option value="">Ingen · hovedkategori</option>':'';
  groups.forEach(group=>{
    const rows=flattenKind(group.kind).filter(x=>!blocked.has(+x.category.id));
    if(!rows.length)return;
    html+=`<optgroup label="${escText(group.label)}">${rows.map(x=>`<option value="${x.category.id}" ${+x.category.id===+currentId?'selected':''}>${escText(x.path.join(' › '))}</option>`).join('')}</optgroup>`;
  });
  return html;
}

window.categoryName=function(_kind,item){return categoryPathById(item?.category_id)};
window.categoryField=function(_kind,item){
  const current=categoryById(item?.category_id)?+item.category_id:0;
  const placeholder=current?'':'<option value="" selected disabled>Vælg kategori eller underkategori…</option>';
  return `<div class="sheet-field warehouse-category-field"><label for="s_category_id">Kategori / underkategori</label><select id="s_category_id" required>${placeholder}${categoryOptions(current)}</select><p class="small muted">Vælg hvor posten skal vises i lageret.</p></div>`;
};
const baseInstallSheetCategory=window.installSheetCategory;
window.installSheetCategory=function(kind,item){
  baseInstallSheetCategory(kind,item);
  // This legacy text category is not part of the warehouse hierarchy.
  if(kind==='hardware')document.querySelector('#palaEditSheet #s_category')?.parentElement?.remove();
};

function itemCurrentCategory(entry){return categoryById(entry.item?.category_id)}
function directCount(categoryId){return warehouseItems().filter(entry=>+entry.item?.category_id===+categoryId).length}
function hierarchyCount(c,entries,children){
  let total=entries.filter(entry=>+entry.item?.category_id===+c.id).length;
  (children.get(+c.id)||[]).forEach(child=>{total+=hierarchyCount(child,entries,children)});
  return total;
}
function isStandardPermanent(item){
  const name=String(item?.name||'').trim().toLocaleLowerCase('da-DK');
  return name==='pløkker'||name==='sidestænger';
}
function stockInfo(entry){
  const {kind,item}=entry;
  if(kind==='hardware'&&isStandardPermanent(item))return {permanent:true,copy:'Standard hardware · følger altid teltet',states:typeof warehouseStateMarkup==='function'?warehouseStateMarkup('in-stock','Følger teltet'):''};
  let total=null,out=0,drying=0,known=false;
  if(kind==='tent'){
    total=item.stock_count;known=typeof knownStock==='function'?knownStock(total):total!==null&&total!==undefined&&total!=='';
    out=typeof warehouseOut==='function'?+warehouseOut('tent',item.id)||0:0;
    drying=typeof warehouseDrying==='function'?+warehouseDrying('tent',item.id)||0:0;
  }else if(kind==='hardware'){
    total=item.quantity_total;known=typeof knownStock==='function'?knownStock(total):total!==null&&total!==undefined&&total!=='';
    out=+item.out_qty||0;
  }else{
    total=item.quantity_total;known=typeof knownStock==='function'?knownStock(total):total!==null&&total!==undefined&&total!=='';
    out=typeof warehouseOut==='function'?+warehouseOut('inventory',item.id)||0:0;
  }
  if(!known)return {permanent:false,copy:'Lagerantal: ikke angivet',states:typeof warehouseStateMarkup==='function'?warehouseStateMarkup('unknown','Lagerstatus ukendt'):''};
  const available=Math.max(0,+total-(kind==='tent'?Math.max(out,drying):out));
  let states='';
  if(drying&&typeof warehouseStateMarkup==='function')states+=warehouseStateMarkup('wet','Vådt / tørrer');
  if(out&&typeof warehouseStateMarkup==='function')states+=warehouseStateMarkup('out','Ude');
  if(available>0&&typeof warehouseStateMarkup==='function')states+=warehouseStateMarkup('in-stock','På lager');
  if(!states&&typeof warehouseStateMarkup==='function')states+=warehouseStateMarkup('out','Ikke på lager');
  return {permanent:false,copy:`Lagerantal: ${+total} · Tilgængelig: ${available}`,states};
}
function itemAction(entry){
  if(entry.kind==='tent')return `openTent(${+entry.item.id})`;
  if(entry.kind==='hardware')return `openCatalogHardware(${+entry.item.id})`;
  return `openInventoryNfc(${+entry.item.id})`;
}
function itemIcon(entry){return entry.kind==='tent'?'tent':entry.kind==='hardware'?'settings':'box'}
function itemMeta(entry){
  const i=entry.item;
  if(entry.kind==='tent')return i.area_m2?`${i.area_m2} m²`:(i.description||'Telt');
  if(entry.kind==='hardware'){
    if(isStandardPermanent(i))return 'Fast standarddel';
    return typeof catalogCaption==='function'?catalogCaption(i):(i.description||'Hardware');
  }
  return i.description||'Inventar';
}
function highlightWarehouseSearchText(value){
  const raw=String(value??''),query=typeof warehouseSearch==='string'?warehouseSearch.trim():'';
  if(!query)return escText(raw);
  const escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!escaped)return escText(raw);
  const lowerQuery=query.toLocaleLowerCase('da-DK');
  return raw.split(new RegExp(`(${escaped})`,'gi')).map(part=>part.toLocaleLowerCase('da-DK')===lowerQuery?`<mark class="warehouse-search-mark-v335">${escText(part)}</mark>`:escText(part)).join('');
}
function renderItem(entry){
  const s=stockInfo(entry),i=entry.item,searching=typeof warehouseSearch==='string'&&warehouseSearch.trim();
  return `<button type="button" class="warehouse-item warehouse-item-v183${searching?' warehouse-search-match-v335':''}" onclick="${itemAction(entry)}">
    <span class="warehouse-item-icon">${typeof uiIcon==='function'?uiIcon(itemIcon(entry)):''}</span>
    <span class="warehouse-item-body">
      <strong>${highlightWarehouseSearchText(i.name||'Uden navn')}</strong>
      <small>${highlightWarehouseSearchText(itemMeta(entry))}</small>
      ${s.copy?`<span class="warehouse-stock${s.permanent?' standard-permanent':''}">${escText(s.copy)}</span>`:''}
    </span>
    ${s.states?`<span class="warehouse-state-row warehouse-item-status-v281">${s.states}</span>`:''}
    <span class="warehouse-item-chevron-v183">${typeof uiIcon==='function'?uiIcon('chevronRight'):''}</span>
  </button>`;
}
function renderOwnItems(entries){
  if(!entries.length)return '';
  return `<div class="warehouse-list warehouse-list-v183">${entries.sort((a,b)=>typeof warehouseDisplaySort==='function'?warehouseDisplaySort(a.item,b.item):(typeof alpha==='function'?alpha(a.item.name,b.item.name):0)).map(renderItem).join('')}</div>`;
}
function categoryHtml(c,entries,children,depth=0){
  const own=entries.filter(entry=>+entry.item?.category_id===+c.id);
  const kids=children.get(+c.id)||[];
  const total=hierarchyCount(c,entries,children);
  const searchOpen=typeof warehouseSearch==='string'&&warehouseSearch.trim();
  if(!total&&(searchOpen||!(typeof isAdminLoggedIn==='function'&&isAdminLoggedIn())))return '';
  return `<details class="warehouse-category-v183 depth-${depth}" ${depth===0||searchOpen?'open':''}>
    <summary>
      <span class="warehouse-category-title-v183">${escText(c.name)}</span>
      <span class="warehouse-category-count-v183">${total}</span>
      <span class="warehouse-category-chevron-v183">${typeof uiIcon==='function'?uiIcon('chevronRight'):''}</span>
    </summary>
    <div class="warehouse-category-body-v183">
      ${renderOwnItems(own)}
      ${kids.length?`<div class="warehouse-category-children-v183">${kids.map(k=>categoryHtml(k,entries,children,depth+1)).join('')}</div>`:''}
      ${!total&&!searchOpen&&typeof isAdminLoggedIn==='function'&&isAdminLoggedIn()?'<p class="small muted warehouse-empty-v183">Tom kategori</p>':''}
    </div>
  </details>`;
}
function groupForFilter(filter){return GROUPS.find(g=>g.filter===filter)}
function renderStructure(filter){
  const searching=typeof warehouseSearch==='string'&&warehouseSearch.trim();
  let entries=warehouseItems().filter(entry=>{
    const c=itemCurrentCategory(entry),path=c?categoryPathById(c.id):'Øvrigt';
    return typeof warehouseMatches!=='function'||warehouseMatches(entry.item.name,entry.item.description,path,entry.kind==='tent'?entry.item.source_notes:'');
  });
  // A warehouse search is global: ignore the active category tab and search every stock kind.
  const selected=searching?null:groupForFilter(filter),groups=selected?[selected]:GROUPS;
  let html='';
  groups.forEach(group=>{
    const children=childMap(group.kind),roots=rootsFor(group.kind),groupHtml=roots.map(root=>categoryHtml(root,entries,children,0)).join('');
    if(groupHtml)html+=groupHtml;
  });
  const uncategorized=entries.filter(entry=>!itemCurrentCategory(entry));
  if(uncategorized.length&&(searching||filter==='all'||filter==='other'))html+=`<details class="warehouse-category-v183" open><summary><span class="warehouse-category-title-v183">Øvrigt / ikke placeret</span><span class="warehouse-category-count-v183">${uncategorized.length}</span><span class="warehouse-category-chevron-v183">${typeof uiIcon==='function'?uiIcon('chevronRight'):''}</span></summary><div class="warehouse-category-body-v183">${renderOwnItems(uncategorized)}</div></details>`;
  return html||`<p class="muted">${searching?'Ingen lagerposter matcher søgningen.':'Ingen lagerposter matcher denne visning.'}</p>`;
}
function tabsHtml(active){
  return `<div class="warehouse-tabs" role="tablist" aria-label="Filtrér lager">
    <button class="warehouse-tab ${active==='all'?'active':''}" onclick="showTents('all')">${typeof uiIcon==='function'?uiIcon('box'):''} Alt</button>
    ${GROUPS.map(g=>`<button class="warehouse-tab ${active===g.filter?'active':''}" onclick="showTents('${g.filter}')">${typeof uiIcon==='function'?uiIcon(g.icon):''} ${escText(g.label)}</button>`).join('')}
  </div>`;
}
function addWarehouseAdminActions(){
  if(typeof isAdminLoggedIn!=='function'||!isAdminLoggedIn())return;
  const hero=app?.querySelector?.('.warehouse-hero');if(!hero)return;
  let row=hero.querySelector(':scope > .row');if(!row)return;
  let actions=row.querySelector('.warehouse-structure-actions-v183');
  if(!actions){
    actions=document.createElement('div');actions.className='warehouse-structure-actions-v183';
    actions.innerHTML=`<button type="button" class="btn" onclick="openWarehouseBulkMove()">${typeof uiIcon==='function'?uiIcon('link'):''} Flyt poster</button><button type="button" class="btn" onclick="showAdminWarehouseCategories()">${typeof uiIcon==='function'?uiIcon('settings'):''} Lagerstruktur</button>`;
    row.appendChild(actions);
  }
  [...row.children].forEach(el=>{if(el!==actions&&el.tagName==='BUTTON'&&String(el.getAttribute('onclick')||'').includes('showAdmin('))el.remove()});
}

async function refreshCategoryViews(){
  if(typeof reloadData==='function')await reloadData();
  else if(typeof loadWarehouseExtensions==='function')await loadWarehouseExtensions();
  const p=new URLSearchParams(location.search);
  if(p.get('admin')==='categories')return showAdminWarehouseCategories();
  return showTents(typeof warehouseViewFilter==='string'?warehouseViewFilter:'all');
}
window.openWarehouseCategoryEditor=function(kind,id=null,parentId=null){
  if(!requireAdmin())return;
  const c=id?categoryById(id):null;
  if(c&&isFixedRoot(c))return alert('De fire hovedkategorier er faste. Du kan oprette og redigere underkategorier under dem.');
  const selectedParent=c?.parent_id??parentId??'';
  openEditSheet(c?'Redigér underkategori':'Ny underkategori',
    `<div class="sheet-field"><label for="warehouseCategoryName">Navn</label><input id="warehouseCategoryName" maxlength="80" required value="${escText(c?.name||'')}" placeholder="Kategorinavn"></div>
     <div class="sheet-field"><label for="warehouseCategoryParent">Placering</label><select id="warehouseCategoryParent">${categoryOptions(selectedParent,kind,true,c?.id||0)}</select></div>`,
    async()=>{
      const name=document.getElementById('warehouseCategoryName')?.value.trim();if(!name)throw new Error('Skriv et kategorinavn');
      const parent=+document.getElementById('warehouseCategoryParent')?.value||null;
      if(!parent)throw new Error('Underkategorien skal ligge under en af de faste hovedkategorier.');
      await checkedRpc('admin_save_warehouse_category',{p_token:adminToken,p_kind:kind,p_id:c?.id||null,p_name:name,p_parent_id:parent});
      await refreshCategoryViews();
    },c?'Gem underkategori':'Opret underkategori');
  const select=document.getElementById('warehouseCategoryParent');if(select&&selectedParent)select.value=String(selectedParent);
  if(c){
    const footer=document.querySelector('#palaEditSheet .sheet-footer');
    if(footer){
      const del=document.createElement('button');del.type='button';del.className='btn bad';del.style.marginRight='auto';del.innerHTML=(typeof uiIcon==='function'?uiIcon('trash'):'')+' Slet';
      del.onclick=async()=>{if(!confirm('Slet underkategorien? Den skal være tom først.'))return;try{await checkedRpc('admin_delete_warehouse_category',{p_token:adminToken,p_id:+c.id});closeEditSheet(true);await refreshCategoryViews()}catch(error){alert(error.message||String(error))}};
      footer.prepend(del);
    }
  }
};
function managerTree(kind,parentId,depth=0){
  const children=(childMap(kind).get(+parentId)||[]);
  if(!children.length)return depth===0?'<p class="small muted warehouse-manager-empty-v183">Ingen underkategorier.</p>':'';
  return `<div class="warehouse-manager-tree-v183 ${depth?'nested':''}">${children.map(c=>`<div class="warehouse-manager-node-v183"><div class="warehouse-manager-row-v183"><span>${escText(c.name)}</span><span class="warehouse-category-count-v183">${directCount(c.id)}</span><button type="button" class="warehouse-mini-v183" onclick="openWarehouseCategoryEditor('${kind}',null,${c.id})" title="Ny underkategori">+</button><button type="button" class="warehouse-mini-v183" onclick="openWarehouseCategoryEditor('${kind}',${c.id},null)" title="Redigér">${typeof uiIcon==='function'?uiIcon('edit'):''}</button></div>${managerTree(kind,c.id,depth+1)}</div>`).join('')}</div>`;
}
function managerCard(group){
  const root=rootsFor(group.kind).find(isFixedRoot)||rootsFor(group.kind)[0];
  if(!root)return `<section class="warehouse-manager-card-v183"><strong>${escText(group.label)}</strong><p class="muted">Hovedkategorien mangler i databasen.</p></section>`;
  return `<section class="warehouse-manager-card-v183"><div class="warehouse-manager-head-v183"><div><strong>${escText(root.name)}</strong><div class="small muted">${directCount(root.id)} direkte poster</div></div><button type="button" class="btn" onclick="openWarehouseCategoryEditor('${group.kind}',null,${root.id})">${typeof uiIcon==='function'?uiIcon('plus'):''} Underkategori</button></div>${managerTree(group.kind,root.id)}</section>`;
}
window.showAdminWarehouseCategories=function(){
  if(!requireAdmin())return;act('na');history.replaceState(null,'',location.pathname+'?admin=categories');
  app.innerHTML=`<section class="card"><h2>Administration</h2>${typeof adminTabs==='function'?adminTabs('categories'):''}<div class="small muted">LAGERSTRUKTUR</div><h3 style="margin:4px 0 5px">Kategorier og underkategorier</h3><p class="muted">De fire hovedkategorier er faste. Underkategorier kan oprettes og redigeres, og lagerposter kan flyttes frit mellem hele strukturen.</p><div class="warehouse-structure-actions-v183"><button class="btn primary" onclick="openWarehouseBulkMove()">${typeof uiIcon==='function'?uiIcon('link'):''} Flyt lagerposter</button><button class="btn" onclick="showTents('all')">${typeof uiIcon==='function'?uiIcon('box'):''} Se lager</button></div></section><section class="warehouse-manager-grid-v183">${GROUPS.map(managerCard).join('')}</section>`;
};
window.openWarehouseBulkMove=function(){
  if(!requireAdmin())return;
  const entries=warehouseItems().sort((a,b)=>String(a.item.name||'').localeCompare(String(b.item.name||''),'da'));
  openEditSheet('Flyt lagerposter',
    `<p class="muted">Vælg en eller flere poster. De beholder deres type, pakkeregler, antal og teltkoblinger — kun placeringen i Lager ændres.</p>
     <div class="sheet-field warehouse-move-picker-v328"><label for="warehouseMoveSearch">Søg og vælg lagerposter</label><div class="warehouse-move-search-v328"><input id="warehouseMoveSearch" type="search" placeholder="Søg lagerpost" autocomplete="off" aria-haspopup="listbox" aria-expanded="false" onclick="openWarehouseMoveRows()" oninput="filterWarehouseMoveRows(this.value)" onkeydown="if(event.key==='Escape'){closeWarehouseMoveRows();this.blur()}"><div class="warehouse-move-list-v183" role="listbox" aria-label="Vælg lagerposter">${entries.map(entry=>`<label class="warehouse-move-row-v183" data-search="${escText(String(entry.item.name||'')+' '+categoryPathById(entry.item.category_id))}"><input type="checkbox" class="warehouse-move-choice-v183" value="${entry.kind}:${entry.item.id}" onchange="updateWarehouseMoveSelection()"><span><strong>${escText(entry.item.name)}</strong><small>${escText(categoryPathById(entry.item.category_id))}</small></span></label>`).join('')}</div></div><div id="warehouseMoveCount" class="small muted warehouse-move-count-v328">Ingen poster valgt</div></div>
     <div class="sheet-field"><label for="warehouseMoveTarget">Flyt til</label><select id="warehouseMoveTarget" required><option value="">Vælg placering…</option>${categoryOptions()}</select></div>`,
    async()=>{
      const target=+document.getElementById('warehouseMoveTarget')?.value||0;if(!target)throw new Error('Vælg hvor posterne skal flyttes hen');
      const choices=[...document.querySelectorAll('.warehouse-move-choice-v183:checked')].map(x=>x.value);if(!choices.length)throw new Error('Vælg mindst én lagerpost');
      for(const kind of ['tent','hardware','inventory']){
        const ids=choices.filter(v=>v.startsWith(kind+':')).map(v=>+v.split(':')[1]);
        if(ids.length)await checkedRpc('admin_move_warehouse_items',{p_token:adminToken,p_kind:kind,p_ids:ids,p_category_id:target});
      }
      await refreshCategoryViews();
    },'Flyt valgte');
  requestAnimationFrame(()=>closeWarehouseMoveRows());
};
window.openWarehouseMoveRows=function(){
  const picker=document.querySelector('.warehouse-move-picker-v328'),input=document.getElementById('warehouseMoveSearch');
  if(!picker)return;picker.classList.add('is-open');if(input)input.setAttribute('aria-expanded','true');
};
window.closeWarehouseMoveRows=function(){
  const picker=document.querySelector('.warehouse-move-picker-v328'),input=document.getElementById('warehouseMoveSearch');
  if(!picker)return;picker.classList.remove('is-open');if(input)input.setAttribute('aria-expanded','false');
};
window.updateWarehouseMoveSelection=function(){
  const choices=[...document.querySelectorAll('.warehouse-move-choice-v183')],selected=choices.filter(choice=>choice.checked),count=document.getElementById('warehouseMoveCount'),input=document.getElementById('warehouseMoveSearch');
  choices.forEach(choice=>choice.closest('.warehouse-move-row-v183')?.classList.toggle('is-selected',choice.checked));
  if(count)count.textContent=selected.length?selected.length+' '+(selected.length===1?'post valgt':'poster valgt'):'Ingen poster valgt';
  if(input)input.placeholder=selected.length?selected.length+' valgt · søg efter flere…':'Søg lagerpost';
};
window.filterWarehouseMoveRows=function(value){
  openWarehouseMoveRows();
  const q=typeof normalizedSearchText==='function'?normalizedSearchText(value):String(value||'').toLowerCase();
  document.querySelectorAll('.warehouse-move-row-v183').forEach(row=>{
    const hay=typeof normalizedSearchText==='function'?normalizedSearchText(row.dataset.search||''):String(row.dataset.search||'').toLowerCase();
    row.hidden=!!q&&!hay.includes(q);
  });
};
document.addEventListener('pointerdown',event=>{
  const picker=document.querySelector('.warehouse-move-picker-v328');
  if(picker&&!picker.contains(event.target))closeWarehouseMoveRows();
});

function installTentLinkField(id){
  const body=document.querySelector('#palaEditSheet .sheet-body');if(!body||body.querySelector('.warehouse-tent-links-v183'))return;
  const t=tents?.[+id]||{},links=new Set((t.compatible_tent_ids||[]).map(Number));
  body.insertAdjacentHTML('beforeend',`<details class="sheet-group warehouse-tent-links-v183"><summary>Kobling til andre telte</summary><p class="small muted">Brug koblingen til telte, der hører sammen eller kan bruges sammen. Det ændrer ikke pakkereglerne.</p><input type="search" placeholder="Søg telt" aria-label="Søg telte" oninput="filterTentLinkChoices(this.value)"><div class="sheet-checks">${Object.values(tents||{}).filter(other=>+other.id!==+id).sort((a,b)=>typeof alpha==='function'?alpha(a.name,b.name):0).map(other=>`<label><input type="checkbox" class="warehouse-tent-link-choice-v183" value="${other.id}" ${links.has(+other.id)?'checked':''}>${escText(other.name)}</label>`).join('')}</div></details>`);
}
window.filterTentLinkChoices=function(value){
  const input=document.querySelector('.warehouse-tent-links-v183 input[type=search]'),q=typeof normalizedSearchText==='function'?normalizedSearchText(value):String(value||'').toLowerCase();
  input?.nextElementSibling?.querySelectorAll('label').forEach(label=>{const hay=typeof normalizedSearchText==='function'?normalizedSearchText(label.textContent):label.textContent.toLowerCase();label.hidden=!!q&&!hay.includes(q)});
};

const baseCheckedRpc=window.checkedRpc;
if(typeof baseCheckedRpc==='function')window.checkedRpc=async function(name,args){
  if(name==='admin_save_tent_basics'&&document.querySelector('#palaEditSheet .warehouse-tent-links-v183')){
    args={...args,p_data:{...(args?.p_data||{}),compatible_tent_ids:[...document.querySelectorAll('.warehouse-tent-link-choice-v183:checked')].map(x=>+x.value)}};
  }
  return baseCheckedRpc(name,args);
};
const baseEditTent=window.editTentBasics;
if(typeof baseEditTent==='function')window.editTentBasics=function(id){const result=baseEditTent.apply(this,arguments);installTentLinkField(id);return result};

function decorateStandardHardwareEditor(id){
  const h=typeof catalogItem==='function'?catalogItem(id):null;if(!isStandardPermanent(h))return;
  const field=document.getElementById('s_quantity_total')?.closest('.sheet-field');field?.remove();
  const body=document.querySelector('#palaEditSheet .sheet-body');body?.insertAdjacentHTML('afterbegin','<div class="warehouse-standard-note-v183"><b>Fast standardhardware</b><div class="small">Pløkker og sidestænger har ikke lagerantal eller lagerstatus. Det antal der skal pakkes, styres på det enkelte telt.</div></div>');
}
const baseEditHardware=window.editCatalogHardware;
if(typeof baseEditHardware==='function')window.editCatalogHardware=function(id){const result=baseEditHardware.apply(this,arguments);decorateStandardHardwareEditor(id);return result};

function linkedTentSection(id){
  const t=tents?.[+id];if(!t)return '';
  const direct=(t.compatible_tent_ids||[]).map(Number);
  const reciprocal=Object.values(tents||{}).filter(other=>(other.compatible_tent_ids||[]).map(Number).includes(+id)).map(other=>+other.id);
  const ids=[...new Set([...direct,...reciprocal])].filter(tid=>tid!==+id&&tents[tid]);
  if(!ids.length)return '';
  return `<section class="card warehouse-linked-tents-v183"><div class="row"><div><div class="small muted">KOBLINGER</div><h3 style="margin:3px 0">Koblet med telte</h3></div>${typeof isAdminLoggedIn==='function'&&isAdminLoggedIn()?`<button class="btn" onclick="editTentBasics(${+id})">${typeof uiIcon==='function'?uiIcon('edit'):''} Redigér</button>`:''}</div><div class="warehouse-linked-tent-list-v183">${ids.sort((a,b)=>typeof alpha==='function'?alpha(tents[a].name,tents[b].name):0).map(tid=>`<button type="button" class="btn" onclick="openTent(${tid})">${typeof uiIcon==='function'?uiIcon('tent'):''} ${escText(tents[tid].name)}</button>`).join('')}</div></section>`;
}
const baseOpenTent=window.openTent;
if(typeof baseOpenTent==='function')window.openTent=async function(id){
  const result=await baseOpenTent.apply(this,arguments);
  const html=linkedTentSection(id);if(html){const first=app.firstElementChild;first?.insertAdjacentHTML('afterend',html)}
  return result;
};

function cleanStandardHardwareDetail(id){
  const h=typeof catalogItem==='function'?catalogItem(id):null;if(!isStandardPermanent(h))return;
  const first=app.firstElementChild;if(!first)return;
  [...first.querySelectorAll('p')].forEach(p=>{if(/lagerantal|tilgængelig/i.test(p.textContent||''))p.remove()});
  first.querySelectorAll('.warehouse-state,.warehouse-state-row').forEach(el=>el.remove());
  first.insertAdjacentHTML('beforeend','<div class="warehouse-standard-note-v183"><b>Fast standardhardware</b><div class="small">Har ikke lagerantal eller lagerstatus. Pakkemængden bestemmes af teltets pakkebehov.</div></div>');
}
const baseOpenCatalog=window.openCatalogHardware;
if(typeof baseOpenCatalog==='function')window.openCatalogHardware=function(id){const result=baseOpenCatalog.apply(this,arguments);cleanStandardHardwareDetail(id);return result};

const baseAdminTabs=window.adminTabs;
if(typeof baseAdminTabs==='function')window.adminTabs=function(activeTab){
  let html=baseAdminTabs.apply(this,arguments);if(typeof html!=='string'||html.includes('data-admin-categories-tab'))return html;
  const button=`<button class="btn ${activeTab==='categories'?'active primary':''}" data-admin-categories-tab="1" onclick="showAdminWarehouseCategories()">${typeof uiIcon==='function'?uiIcon('box'):''} Lagerstruktur</button>`;
  const close=html.indexOf('</div>');return close>=0?html.slice(0,close)+button+html.slice(close):html+button;
};
const baseRoute=window.route;
if(typeof baseRoute==='function')window.route=function(){
  const p=new URLSearchParams(location.search);
  if(p.get('admin')==='categories'&&typeof isAdminLoggedIn==='function'&&isAdminLoggedIn())return showAdminWarehouseCategories();
  return baseRoute.apply(this,arguments);
};

const baseShowTents=window.showTents;
window.showTents=async function(filter='all',keepFocus=false){
  const requested=['all','tents','hardware','inventory','other'].includes(filter)?filter:'all';
  const result=await baseShowTents.call(this,requested==='other'?'all':requested,keepFocus);
  window.warehouseViewFilter=requested;
  try{warehouseViewFilter=requested}catch(_e){}
  const hero=app?.querySelector?.('.warehouse-hero');if(!hero)return result;
  hero.querySelector('.warehouse-tabs')?.replaceWith((()=>{const holder=document.createElement('div');holder.innerHTML=tabsHtml(requested);return holder.firstElementChild})());
  app.querySelectorAll('.warehouse-section,#warehouseCategoryAdminV180,.warehouse-structure-v183').forEach(el=>el.remove());
  const searching=typeof warehouseSearch==='string'&&warehouseSearch.trim();
  const matchedItems=searching?warehouseItems().filter(entry=>{const category=itemCurrentCategory(entry),path=category?categoryPathById(category.id):'Øvrigt';return typeof warehouseMatches!=='function'||warehouseMatches(entry.item.name,entry.item.description,path,entry.kind==='tent'?entry.item.source_notes:'')}):warehouseItems();
  const section=document.createElement('section');section.className='card warehouse-structure-v183';section.innerHTML=`<div class="warehouse-structure-head-v183"><div><span class="warehouse-kicker">LAGERSTRUKTUR</span><h3>${searching?'Søger i alle kategorier':requested==='all'?'Alle kategorier':escText(groupForFilter(requested)?.label||'Lager')}</h3></div><span class="pill">${matchedItems.length} ${matchedItems.length===1?'match':'matches'}</span></div><div class="warehouse-root-list-v183">${renderStructure(requested)}</div>`;
  hero.insertAdjacentElement('afterend',section);
  if(searching)section.querySelectorAll('details.warehouse-category-v183').forEach(details=>{details.open=true});
  addWarehouseAdminActions();
  if(keepFocus)setTimeout(()=>{const input=document.getElementById('warehouseSearchInput');if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length)}},0);
  return result;
};

if(!document.getElementById('pala-warehouse-categories-v183-style')){
  const style=document.createElement('style');style.id='pala-warehouse-categories-v183-style';style.textContent=`
    .warehouse-structure-v183{padding:14px!important}.warehouse-structure-head-v183{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.warehouse-structure-head-v183 h3{margin:3px 0}
    .warehouse-root-list-v183{display:grid;gap:8px}.warehouse-category-v183{border:1px solid var(--line,#e2e6ec);border-radius:12px;background:#fff;overflow:hidden}
    .warehouse-category-v183>summary{list-style:none;display:grid;grid-template-columns:minmax(0,1fr) auto 24px;gap:8px;align-items:center;padding:13px 14px;cursor:pointer;font-weight:750;background:#f8fafc}.warehouse-category-v183>summary::-webkit-details-marker{display:none}
    .warehouse-category-v183.depth-1>summary,.warehouse-category-v183.depth-2>summary,.warehouse-category-v183.depth-3>summary{background:#fff;padding:11px 12px;font-weight:650}
    .warehouse-category-title-v183{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.warehouse-category-count-v183{font-size:11px;color:#687487;background:#eef2f6;border-radius:999px;padding:3px 7px;min-width:24px;text-align:center}
    .warehouse-category-chevron-v183{display:flex;align-items:center;justify-content:center;transition:transform .16s ease}.warehouse-category-v183[open]>summary>.warehouse-category-chevron-v183{transform:rotate(90deg)}
    .warehouse-category-body-v183{padding:0 8px 8px}.warehouse-category-children-v183{display:grid;grid-template-columns:minmax(0,1fr)!important;gap:6px;margin:6px 0 0 12px;padding-left:8px;border-left:2px solid #e8edf3}
    .warehouse-list-v183{display:grid;grid-template-columns:minmax(0,1fr)!important;grid-auto-flow:row!important;gap:5px;padding:7px 0}.warehouse-item-v183{min-height:58px;width:100%!important;border-right:0!important}.warehouse-item-chevron-v183{display:flex;align-items:center}.warehouse-stock.standard-permanent{color:#5f6f82;font-weight:650}
    #app .warehouse-item-v183.warehouse-search-match-v335{background:#fff9df!important;box-shadow:inset 3px 0 0 #e1b300!important}.warehouse-search-mark-v335{background:#ffe58a;color:inherit;border-radius:3px;padding:0 2px;font-weight:800}
    .warehouse-empty-v183,.warehouse-manager-empty-v183{margin:6px 0;padding:8px 4px}.warehouse-structure-actions-v183{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
    .warehouse-manager-grid-v183{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.warehouse-manager-card-v183{background:#fff;border:1px solid var(--line,#e2e6ec);border-radius:14px;padding:12px}
    .warehouse-manager-head-v183{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px}.warehouse-manager-tree-v183{display:grid;gap:4px}.warehouse-manager-tree-v183.nested{margin:4px 0 0 13px;padding-left:8px;border-left:1px solid #dfe6ef}
    .warehouse-manager-row-v183{display:grid;grid-template-columns:minmax(0,1fr) auto 30px 30px;gap:5px;align-items:center;padding:5px;border-radius:9px}.warehouse-manager-row-v183:hover{background:#f6f8fb}
    .warehouse-mini-v183{width:30px;height:30px;border:1px solid #d9e1ec;border-radius:9px;background:#fff;color:#42688f;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;cursor:pointer}.warehouse-mini-v183 .ui-icon{width:14px;height:14px}
    .warehouse-move-picker-v328{position:relative!important}.warehouse-move-search-v328{position:relative}.warehouse-move-count-v328{margin-top:5px}.warehouse-move-list-v183{position:absolute;z-index:60;left:0;right:0;top:calc(100% + 6px);display:none!important;grid-template-columns:minmax(0,1fr);align-content:start;gap:3px;max-height:min(330px,42vh);overflow:auto;border:1px solid #cfd9e6;border-radius:11px;padding:6px;margin:0!important;background:#fff;box-shadow:0 14px 34px rgba(31,48,73,.16)}.warehouse-move-picker-v328.is-open .warehouse-move-list-v183{display:grid!important}.warehouse-move-picker-v328.is-open #warehouseMoveSearch{border-color:#7da8d5!important;box-shadow:0 0 0 3px rgba(125,168,213,.16)!important}.warehouse-move-row-v183{display:flex;gap:9px;align-items:flex-start;min-width:0;padding:7px 8px;border-radius:8px;cursor:pointer}.warehouse-move-row-v183:hover{background:#f6f8fb}.warehouse-move-row-v183.is-selected{background:#edf4fc}.warehouse-move-row-v183 input{margin:1px 0 0}.warehouse-move-row-v183 span{display:grid;min-width:0}.warehouse-move-row-v183 strong,.warehouse-move-row-v183 small{overflow-wrap:anywhere}.warehouse-move-row-v183 small{color:#748094}
    .warehouse-standard-note-v183{padding:10px 12px;border-radius:10px;background:#f3f7fb;border:1px solid #dce7f1;margin:8px 0}.warehouse-linked-tent-list-v183{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
    @media(max-width:760px){.warehouse-manager-grid-v183{grid-template-columns:1fr}.warehouse-structure-actions-v183{width:100%}.warehouse-structure-actions-v183 .btn{flex:1}.warehouse-category-v183>summary{padding:12px 11px}.warehouse-category-children-v183{margin-left:8px;padding-left:6px}.warehouse-move-list-v183{max-height:38vh}}
  `;document.head.appendChild(style);
}

try{if(new URLSearchParams(location.search).has('warehouse'))setTimeout(()=>showTents(window.warehouseViewFilter||'all'),0)}catch(_e){}
})();
