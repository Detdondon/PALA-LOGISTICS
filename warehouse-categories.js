/* PALA v180 · warehouse category hierarchy + admin access
   Adds categories/subcategories in Lager and Admin without duplicating warehouse data. */
(()=>{
'use strict';
if(window.__palaWarehouseCategoriesV180||typeof showTents!=='function')return;
window.__palaWarehouseCategoriesV180=true;

const KINDS=[['tent','Telte'],['hardware','Hardware'],['inventory','Inventar']];
const escText=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const rowsFor=kind=>(typeof warehouseCategories!=='undefined'&&Array.isArray(warehouseCategories)?warehouseCategories:[]).filter(c=>c.kind===kind);
const rowById=(kind,id)=>rowsFor(kind).find(c=>+c.id===+id)||null;
const itemsFor=kind=>{try{return typeof stockKindRows==='function'?(stockKindRows(kind)||[]):[]}catch(_e){return[]}};
const directCount=(kind,id)=>itemsFor(kind).filter(row=>+row?.category_id===+id).length;

function childMap(kind){
  const map=new Map();
  rowsFor(kind).forEach(c=>{const p=+c.parent_id||0;if(!map.has(p))map.set(p,[]);map.get(p).push(c)});
  map.forEach(list=>list.sort((a,b)=>alpha(a.name,b.name)));
  return map;
}
function flatten(kind){
  const rows=rowsFor(kind),byId=new Map(rows.map(c=>[+c.id,c])),children=childMap(kind),out=[],seen=new Set();
  function walk(c,depth,path){if(!c||seen.has(+c.id))return;seen.add(+c.id);const next=[...path,c.name];out.push({category:c,depth,path:next});(children.get(+c.id)||[]).forEach(ch=>walk(ch,depth+1,next))}
  rows.filter(c=>!c.parent_id||!byId.has(+c.parent_id)).sort((a,b)=>alpha(a.name,b.name)).forEach(c=>walk(c,0,[]));
  rows.filter(c=>!seen.has(+c.id)).sort((a,b)=>alpha(a.name,b.name)).forEach(c=>walk(c,0,[]));
  return out;
}
function categoryPath(kind,id){return flatten(kind).find(x=>+x.category.id===+id)?.path.join(' › ')||''}
function descendants(kind,id){
  const children=childMap(kind),ids=new Set();
  function walk(parent){(children.get(+parent)||[]).forEach(c=>{if(ids.has(+c.id))return;ids.add(+c.id);walk(c.id)})}
  walk(id);return ids;
}
function categorySelect(kind,currentId,parentMode=false){
  const blocked=currentId?descendants(kind,currentId):new Set();if(currentId)blocked.add(+currentId);
  const options=flatten(kind).filter(x=>!blocked.has(+x.category.id)).map(x=>`<option value="${x.category.id}">${'— '.repeat(x.depth)}${escText(x.category.name)}</option>`).join('');
  return `<option value="">${parentMode?'Ingen · hovedkategori':'Vælg kategori'}</option>${options}`;
}

window.categoryName=function(kind,item){const c=rowById(kind,item?.category_id);return c?categoryPath(kind,c.id)||c.name:'Uden kategori'};
window.categoryField=function(kind,item){
  const current=+item?.category_id||0;
  return `<div class="sheet-field"><label for="s_category_id">Kategori / underkategori</label><select id="s_category_id" required>${flatten(kind).map(x=>`<option value="${x.category.id}" ${+x.category.id===current?'selected':''}>${'— '.repeat(x.depth)}${escText(x.category.name)}</option>`).join('')}</select></div>`;
};

async function refreshCategoryViews(){
  if(typeof reloadData==='function')await reloadData();else if(typeof loadWarehouseExtensions==='function')await loadWarehouseExtensions();
  const params=new URLSearchParams(location.search);
  if(params.get('admin')==='categories')return showAdminWarehouseCategories();
  if(params.has('warehouse'))return showTents(typeof warehouseViewFilter==='string'?warehouseViewFilter:'all');
  if(typeof route==='function')return route();
}
function addDeleteButton(kind,id){
  if(!id)return;
  const footer=document.querySelector('#palaEditSheet .sheet-footer');if(!footer||footer.querySelector('[data-delete-category]'))return;
  const button=document.createElement('button');button.type='button';button.className='btn bad';button.dataset.deleteCategory=String(id);button.style.marginRight='auto';button.innerHTML=(typeof uiIcon==='function'?uiIcon('trash'):'')+' Slet';
  button.onclick=async()=>{
    if(!confirm('Slet kategorien? Kategorien skal være tom, og underkategorier skal være flyttet først.'))return;
    try{await checkedRpc('admin_delete_warehouse_category',{p_token:adminToken,p_id:+id});closeEditSheet(true);await refreshCategoryViews()}catch(error){alert(error.message||String(error))}
  };
  footer.prepend(button);
}
window.openWarehouseCategoryEditor=function(kind,id=null,parentId=null){
  if(!requireAdmin())return;
  const c=id?rowById(kind,id):null;
  const selectedParent=c?.parent_id??parentId??'';
  openEditSheet(c?'Redigér kategori':(parentId?'Ny underkategori':'Ny kategori'),
    `<div class="sheet-field"><label for="warehouseCategoryName">Navn</label><input id="warehouseCategoryName" maxlength="80" required value="${escText(c?.name||'')}" placeholder="Kategorinavn"></div>
     <div class="sheet-field"><label for="warehouseCategoryParent">Placering</label><select id="warehouseCategoryParent">${categorySelect(kind,c?.id,true)}</select><p class="small muted">Vælg en overkategori for at gøre denne til en underkategori.</p></div>`,
    async()=>{
      const name=document.getElementById('warehouseCategoryName')?.value.trim();if(!name)throw new Error('Skriv et kategorinavn');
      const p=+document.getElementById('warehouseCategoryParent')?.value||null;
      await checkedRpc('admin_save_warehouse_category',{p_token:adminToken,p_kind:kind,p_id:c?.id||null,p_name:name,p_parent_id:p});
      await refreshCategoryViews();
    },c?'Gem kategori':'Opret kategori');
  const parent=document.getElementById('warehouseCategoryParent');if(parent)parent.value=selectedParent?String(selectedParent):'';
  addDeleteButton(kind,c?.id);
};
window.editWarehouseCategories=function(kind){return openWarehouseCategoryManager(kind)};
window.openWarehouseCategoryManager=function(kind){
  if(!requireAdmin())return;
  const body=`<p class="muted">Opret hovedkategorier og underkategorier. Brug + ud for en kategori for at oprette en underkategori direkte under den.</p>${managerBlock(kind,dictLabel(kind),true)}`;
  openEditSheet('Kategorier · '+dictLabel(kind),body,async()=>{},'Luk');
  const footer=document.querySelector('#palaEditSheet .sheet-footer');if(footer){footer.innerHTML='<button type="button" class="btn" onclick="closeEditSheet()">Luk</button>'}
};
function dictLabel(kind){return ({tent:'Telte',hardware:'Hardware',inventory:'Inventar'})[kind]||'Lager'}
function treeNodes(kind,parentId=0,depth=0){
  const children=childMap(kind).get(+parentId)||[];
  if(!children.length)return depth===0?'<p class="small muted warehouse-category-empty-v180">Ingen kategorier endnu.</p>':'';
  return `<div class="warehouse-category-tree-v180 ${depth?'is-child':''}">${children.map(c=>{
    const nested=treeNodes(kind,c.id,depth+1),count=directCount(kind,c.id);
    return `<div class="warehouse-category-node-v180" data-category-id="${c.id}"><div class="warehouse-category-row-v180"><span class="warehouse-category-indent-v180" style="--depth:${depth}"></span><span class="warehouse-category-name-v180">${escText(c.name)}</span><span class="warehouse-category-count-v180">${count}</span><button type="button" class="warehouse-category-mini-v180" onclick="openWarehouseCategoryEditor('${kind}',null,${c.id})" aria-label="Ny underkategori under ${escText(c.name)}" title="Ny underkategori">+</button><button type="button" class="warehouse-category-mini-v180" onclick="openWarehouseCategoryEditor('${kind}',${c.id},null)" aria-label="Redigér ${escText(c.name)}" title="Redigér">${typeof uiIcon==='function'?uiIcon('edit'):''}</button></div>${nested}</div>`;
  }).join('')}</div>`;
}
function managerBlock(kind,label,compact=false){
  return `<section class="warehouse-category-kind-v180 ${compact?'compact':''}"><div class="warehouse-category-kind-head-v180"><div><strong>${escText(label)}</strong><div class="small muted">${rowsFor(kind).length} kategorier inkl. underkategorier</div></div><button type="button" class="btn" onclick="openWarehouseCategoryEditor('${kind}',null,null)">${typeof uiIcon==='function'?uiIcon('plus'):''} Ny kategori</button></div>${treeNodes(kind)}<div class="warehouse-category-actions-v180"><button type="button" class="btn" onclick="moveWarehouseItems('${kind}')" ${rowsFor(kind).length?'':'disabled'}>${typeof uiIcon==='function'?uiIcon('link'):''} Flyt poster</button></div></section>`;
}

function installWarehousePanel(){
  document.getElementById('warehouseCategoryAdminV180')?.remove();
  if(typeof isAdminLoggedIn!=='function'||!isAdminLoggedIn())return;
  const hero=app?.querySelector?.('.warehouse-hero');if(!hero)return;
  const section=document.createElement('section');section.id='warehouseCategoryAdminV180';section.className='card warehouse-category-admin-v180';
  section.innerHTML=`<div class="warehouse-category-admin-head-v180"><div><div class="small muted">ADMIN · LAGER</div><h3>Kategorier og underkategorier</h3><p class="small muted">Administrér strukturen direkte her. Samme struktur bruges i hele PALA.</p></div></div><div class="warehouse-category-grid-v180">${KINDS.map(([kind,label])=>managerBlock(kind,label)).join('')}</div>`;
  hero.insertAdjacentElement('afterend',section);
}
function renderItem(kind,i){
  if(kind==='hardware')return warehouseRow106(i.name,`${i.is_special?'Special':'Standard'} · ${catalogCaption(i)}`,physicalStockLabel(i.quantity_total,+i.out_qty||0),'settings',`openCatalogHardware(${i.id})`,+i.out_qty?warehouseStateMarkup('out','Ude'):'');
  if(kind==='inventory')return warehouseRow106(i.name,i.description,physicalStockLabel(i.quantity_total,warehouseOut(kind,i.id)),'box',`openInventoryNfc(${i.id})`,physicalStates(kind,i.id,i.quantity_total));
  return warehouseRow106(i.name,i.area_m2?`${i.area_m2} m²`:'Telt',tentStockLabel107(i),'tent',`openTent(${i.id})`,physicalStates(kind,i.id,i.stock_count));
}
function renderOwnRows(kind,items){
  if(!items.length)return '';
  if(kind==='tent')return warehouseGroupedRows(items,tentGroupName,i=>renderItem(kind,i),true);
  if(kind==='hardware')return warehouseGroupedRows(items,i=>i.name,i=>renderItem(kind,i));
  return warehouseGroupedRows(items,i=>i.name,i=>renderItem(kind,i));
}
function hierarchyCount(kind,id,rows,children){
  let total=rows.filter(i=>+i.category_id===+id).length;(children.get(+id)||[]).forEach(c=>{total+=hierarchyCount(kind,c.id,rows,children)});return total;
}
function hierarchyCategoryHtml(kind,c,rows,children,depth=0){
  const own=rows.filter(i=>+i.category_id===+c.id),kids=children.get(+c.id)||[],total=hierarchyCount(kind,c.id,rows,children);
  if(!total&&!(typeof isAdminLoggedIn==='function'&&isAdminLoggedIn()))return '';
  return `<details class="warehouse-group warehouse-category-level-v180" ${depth===0?'':'data-subcategory="1"'}><summary><span>${escText(c.name)}</span><span class="warehouse-group-count">${total}</span></summary><div class="category-items">${renderOwnRows(kind,own)}${kids.length?`<div class="warehouse-subcategories-v180">${kids.map(k=>hierarchyCategoryHtml(kind,k,rows,children,depth+1)).join('')}</div>`:''}${!total&&isAdminLoggedIn()?'<p class="small muted warehouse-empty-category-v180">Tom kategori</p>':''}</div></details>`;
}
function rebuildWarehouseHierarchy(){
  const sections=[...app.querySelectorAll('.warehouse-section')];
  sections.forEach(section=>{
    const text=section.querySelector('h3')?.textContent||'',kind=text.startsWith('Telte')?'tent':text.startsWith('Hardware')?'hardware':'inventory';
    const categories=rowsFor(kind);if(!categories.length)return;
    section.querySelectorAll(':scope > .warehouse-groups').forEach(n=>n.remove());
    section.querySelectorAll(':scope > .category-tools').forEach(n=>n.remove());
    let rows=itemsFor(kind).filter(i=>typeof warehouseMatches!=='function'||warehouseMatches(i.name,i.description,categoryName(kind,i),kind==='hardware'?catalogCaption(i):'',kind==='tent'?i.source_notes:''));
    const byId=new Map(categories.map(c=>[+c.id,c])),children=childMap(kind),roots=categories.filter(c=>!c.parent_id||!byId.has(+c.parent_id)).sort((a,b)=>alpha(a.name,b.name));
    const uncategorized=rows.filter(i=>!i.category_id||!byId.has(+i.category_id));
    let html=roots.map(c=>hierarchyCategoryHtml(kind,c,rows,children)).join('');
    if(uncategorized.length)html+=`<details class="warehouse-group"><summary><span>Uden kategori</span><span class="warehouse-group-count">${uncategorized.length}</span></summary><div class="category-items">${renderOwnRows(kind,uncategorized)}</div></details>`;
    section.insertAdjacentHTML('beforeend',`<div class="warehouse-groups warehouse-category-hierarchy-v180">${html||'<p class="muted">Ingen poster matcher søgningen.</p>'}</div>`);
  });
  if(typeof warehouseSearch==='string'&&warehouseSearch.trim())app.querySelectorAll('details.warehouse-group').forEach(d=>d.open=true);
}

window.showAdminWarehouseCategories=function(){
  if(!requireAdmin())return;act('na');history.replaceState(null,'',location.pathname+'?admin=categories');
  app.innerHTML=`<section class="card"><h2>Administration</h2>${adminTabs('categories')}<div class="small muted">LAGERSTRUKTUR</div><h3 style="margin:4px 0 5px">Kategorier og underkategorier</h3><p class="muted">Den samme struktur vises direkte i Lager. Flytning af poster ændrer kun deres placering — ikke antal, pakkelister eller relationer.</p></section><section class="card"><div class="warehouse-category-grid-v180 admin">${KINDS.map(([kind,label])=>managerBlock(kind,label)).join('')}</div></section>`;
};

const baseAdminTabs=window.adminTabs;
if(typeof baseAdminTabs==='function')window.adminTabs=function(activeTab){
  let html=baseAdminTabs.apply(this,arguments);if(typeof html!=='string'||html.includes('data-admin-categories-tab'))return html;
  const button=`<button class="btn ${activeTab==='categories'?'active primary':''}" data-admin-categories-tab="1" onclick="showAdminWarehouseCategories()">${typeof uiIcon==='function'?uiIcon('box'):''} Kategorier</button>`;
  const close=html.indexOf('</div>');return close>=0?html.slice(0,close)+button+html.slice(close):html+button;
};

const baseRoute=window.route;
if(typeof baseRoute==='function')window.route=function(){const p=new URLSearchParams(location.search);if(p.get('admin')==='categories'&&typeof isAdminLoggedIn==='function'&&isAdminLoggedIn())return showAdminWarehouseCategories();return baseRoute.apply(this,arguments)};

const baseShowTents=window.showTents;
window.showTents=async function(){const result=await baseShowTents.apply(this,arguments);rebuildWarehouseHierarchy();installWarehousePanel();return result};

if(!document.getElementById('pala-warehouse-categories-v180-style')){
  const style=document.createElement('style');style.id='pala-warehouse-categories-v180-style';style.textContent=`
    .warehouse-category-admin-v180{padding:16px!important}.warehouse-category-admin-head-v180 h3{margin:2px 0 4px}.warehouse-category-admin-head-v180 p{margin:0}
    .warehouse-category-grid-v180{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.warehouse-category-grid-v180.admin{margin-top:0}
    .warehouse-category-kind-v180{min-width:0;border:1px solid var(--line,#e5ddd2);border-radius:14px;padding:11px;background:var(--surface-2,#fff)}.warehouse-category-kind-v180.compact{border:0;padding:0}
    .warehouse-category-kind-head-v180{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px}.warehouse-category-kind-head-v180>.btn{padding:8px 10px;font-size:11px}
    .warehouse-category-tree-v180{display:grid;gap:4px}.warehouse-category-tree-v180.is-child{margin-left:17px;padding-left:8px;border-left:1px solid #dfe6ef;margin-top:4px}
    .warehouse-category-row-v180{display:grid;grid-template-columns:auto minmax(0,1fr) auto 28px 28px;gap:5px;align-items:center;min-height:36px;padding:5px 4px;border-radius:9px}.warehouse-category-row-v180:hover{background:#f6f8fb}
    .warehouse-category-indent-v180{display:none}.warehouse-category-name-v180{font-size:12px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.warehouse-category-count-v180{font-size:10px;color:#6b778c;background:#eef1f5;border-radius:999px;padding:3px 6px}
    .warehouse-category-mini-v180{width:28px;height:28px;padding:0;border:1px solid #d9e1ec;border-radius:9px;background:#fff;color:#42688f;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;cursor:pointer}.warehouse-category-mini-v180 .ui-icon{width:14px;height:14px}.warehouse-category-mini-v180:hover{background:#eef5ff;border-color:#b9d1ee}
    .warehouse-category-actions-v180{display:flex;gap:6px;margin-top:9px}.warehouse-category-actions-v180 .btn{padding:8px 9px;font-size:11px}.warehouse-category-empty-v180{padding:8px 3px;margin:0}
    .warehouse-subcategories-v180{margin:5px 0 5px 12px;padding-left:8px;border-left:2px solid #e6ebf2}.warehouse-category-level-v180[data-subcategory="1"]>summary{background:#fff!important;font-size:13px;padding:11px 13px!important}.warehouse-empty-category-v180{padding:10px 13px;margin:0}
    @media(max-width:760px){.warehouse-category-grid-v180{grid-template-columns:1fr}.warehouse-category-kind-v180{padding:9px}.warehouse-category-row-v180{grid-template-columns:minmax(0,1fr) auto 30px 30px}.warehouse-category-count-v180{grid-column:2}.warehouse-category-name-v180{grid-column:1}.warehouse-category-mini-v180{width:30px;height:30px}.warehouse-category-kind-head-v180>.btn{font-size:12px}}
  `;document.head.appendChild(style);
}

try{rebuildWarehouseHierarchy();installWarehousePanel()}catch(_e){}
})();
