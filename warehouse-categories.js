/* PALA v163 · visible warehouse category administration */
(()=>{
'use strict';
if(window.__palaWarehouseCategoriesV163||typeof showTents!=='function')return;
window.__palaWarehouseCategoriesV163=true;

const KINDS=[['tent','Telte'],['hardware','Hardware'],['inventory','Inventar']];

function categoryRows(kind){
  try{return typeof categoriesFor==='function'?(categoriesFor(kind)||[]):[]}catch(_e){return[]}
}
function itemRows(kind){
  try{return typeof stockKindRows==='function'?(stockKindRows(kind)||[]):[]}catch(_e){return[]}
}
function countInCategory(kind,id){return itemRows(kind).filter(row=>+row?.category_id===+id).length}
function escText(value){return typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function kindBlock(kind,label){
  const categories=categoryRows(kind);
  const chips=categories.length?categories.map(category=>`<span class="warehouse-category-chip-v163"><span>${escText(category.name)}</span><b>${countInCategory(kind,category.id)}</b></span>`).join(''):'<span class="small muted">Ingen kategorier endnu.</span>';
  return `<div class="warehouse-category-kind-v163">
    <div class="warehouse-category-kind-head-v163"><div><strong>${escText(label)}</strong><div class="small muted">${categories.length} ${categories.length===1?'kategori':'kategorier'}</div></div></div>
    <div class="warehouse-category-chips-v163">${chips}</div>
    <div class="warehouse-category-actions-v163">
      <button type="button" class="btn" onclick="editWarehouseCategories('${kind}')">${typeof uiIcon==='function'?uiIcon('edit'):''}<span>Opret / omdøb</span></button>
      <button type="button" class="btn" onclick="moveWarehouseItems('${kind}')" ${categories.length?'':'disabled'}>${typeof uiIcon==='function'?uiIcon('link'):''}<span>Flyt indhold</span></button>
    </div>
  </div>`;
}
function installPanel(){
  const old=document.getElementById('warehouseCategoryAdminV163');if(old)old.remove();
  if(typeof isAdminLoggedIn!=='function'||!isAdminLoggedIn())return;
  const hero=app?.querySelector?.('.warehouse-hero');if(!hero)return;
  const section=document.createElement('section');
  section.id='warehouseCategoryAdminV163';section.className='card warehouse-category-admin-v163';
  section.innerHTML=`<div class="warehouse-category-admin-head-v163"><div><div class="small muted">ADMIN · LAGER</div><h3>Kategorier</h3><p class="small muted">Opret eller omdøb kategorier, og flyt lagerposter mellem dem.</p></div></div><div class="warehouse-category-grid-v163">${KINDS.map(([kind,label])=>kindBlock(kind,label)).join('')}</div>`;
  hero.insertAdjacentElement('afterend',section);
}

const baseShowTentsV163=showTents;
showTents=async function(){const result=await baseShowTentsV163.apply(this,arguments);installPanel();return result};

if(!document.getElementById('pala-warehouse-categories-v163-style')){
  const style=document.createElement('style');style.id='pala-warehouse-categories-v163-style';
  style.textContent=`
    .warehouse-category-admin-v163{padding:16px!important}
    .warehouse-category-admin-head-v163 h3{margin:2px 0 4px}
    .warehouse-category-admin-head-v163 p{margin:0}
    .warehouse-category-grid-v163{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
    .warehouse-category-kind-v163{min-width:0;border:1px solid var(--line,#e5ddd2);border-radius:14px;padding:10px;background:var(--surface-2,#fff)}
    .warehouse-category-kind-head-v163{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px}
    .warehouse-category-chips-v163{display:flex;flex-wrap:wrap;gap:5px;min-height:28px;align-content:flex-start}
    .warehouse-category-chip-v163{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:5px 8px;border-radius:999px;background:#f3f4f6;font-size:11px;line-height:1.1}
    .warehouse-category-chip-v163 span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .warehouse-category-chip-v163 b{flex:0 0 auto;color:var(--muted-2,#667085)}
    .warehouse-category-actions-v163{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}
    .warehouse-category-actions-v163 .btn{min-width:0;padding:8px 7px;font-size:11px;white-space:normal;line-height:1.15;display:flex;align-items:center;justify-content:center;gap:5px}
    .warehouse-category-actions-v163 .ui-icon{width:15px;height:15px;flex:0 0 auto}
    @media(max-width:700px){.warehouse-category-grid-v163{grid-template-columns:1fr}.warehouse-category-kind-v163{padding:9px}.warehouse-category-actions-v163 .btn{font-size:12px}}
  `;document.head.appendChild(style);
}

installPanel();
})();
