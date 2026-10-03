/* PALA v354 · Midterstykker / Kanap can be linked to one or more tents. */
(()=>{
'use strict';
if(window.__palaMidpieceTentLinksV354)return;
window.__palaMidpieceTentLinksV354=true;

let activeTentId=null;
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('da-DK').replace(/\s+/g,' ').trim();
const escText=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const categories=()=>Array.isArray(window.warehouseCategories)?window.warehouseCategories:(typeof warehouseCategories!=='undefined'&&Array.isArray(warehouseCategories)?warehouseCategories:[]);
const allTents=()=>typeof tents!=='undefined'&&tents?Object.values(tents):Object.values(window.tents||{});

function midpieceCategoryIds(){
  const rows=categories();
  const roots=rows.filter(c=>{const n=norm(c.name);return n.includes('midterstyk')&&n.includes('kanap')});
  const ids=new Set(roots.map(c=>+c.id));
  let changed=true;
  while(changed){
    changed=false;
    rows.forEach(c=>{if(c.parent_id&&ids.has(+c.parent_id)&&!ids.has(+c.id)){ids.add(+c.id);changed=true;}});
  }
  return ids;
}
function isMidpieceCategory(categoryId){return midpieceCategoryIds().has(+categoryId)}
function currentTent(){return activeTentId?allTents().find(t=>+t.id===+activeTentId)||{}:{}}
function realTentChoices(){
  const blocked=midpieceCategoryIds();
  return allTents().filter(t=>+t.id!==+activeTentId&&!blocked.has(+t.category_id)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'da'));
}
function relationHost(){
  return document.querySelector('#palaEditSheet .pala-editor-section[data-editor-section="1"] .pala-editor-fields')||document.querySelector('#palaEditSheet .sheet-body');
}
function removeGenericTentLinks(){document.querySelectorAll('#palaEditSheet .warehouse-tent-links-v183').forEach(node=>node.remove())}
function filterChoices(field,query){
  const q=norm(query);
  field.querySelectorAll('.warehouse-midpiece-choice-v354').forEach(label=>{label.hidden=!!q&&!norm(label.textContent).includes(q)});
}
function renderMidpieceLinks(){
  const category=document.querySelector('#palaEditSheet #s_category_id');
  const existing=document.querySelector('#palaEditSheet .warehouse-midpiece-tent-links-v354');
  if(!category||!isMidpieceCategory(category.value)){existing?.remove();return;}
  removeGenericTentLinks();
  const host=relationHost();if(!host)return;
  const tent=currentTent(),selected=new Set((tent.compatible_tent_ids||[]).map(Number)),choices=realTentChoices();
  existing?.remove();
  const field=document.createElement('details');
  field.className='sheet-group pala-editor-unit pala-editor-wide warehouse-midpiece-tent-links-v354';
  field.open=true;
  field.innerHTML=`<summary>Tilknyttede telte</summary><p class="small muted">Vælg det eller de telte, som dette midterstykke / denne kanap hører til eller kan bruges sammen med.</p><input type="search" class="warehouse-midpiece-search-v354" placeholder="Søg telt" aria-label="Søg telte"><div class="sheet-checks">${choices.map(t=>`<label class="warehouse-midpiece-choice-v354"><input type="checkbox" class="warehouse-midpiece-tent-choice-v354" value="${+t.id}" ${selected.has(+t.id)?'checked':''}> ${escText(t.name||'Telt')}</label>`).join('')||'<p class="small muted">Ingen telte at vælge imellem.</p>'}</div>`;
  host.append(field);
  field.querySelector('.warehouse-midpiece-search-v354')?.addEventListener('input',event=>filterChoices(field,event.target.value));
}
function scheduleRender(){queueMicrotask(()=>requestAnimationFrame(renderMidpieceLinks))}

const baseEditTent=window.editTentBasics;
if(typeof baseEditTent==='function')window.editTentBasics=function(id){
  activeTentId=id?+id:null;
  const result=baseEditTent.apply(this,arguments);
  scheduleRender();
  return result;
};

document.addEventListener('change',event=>{if(event.target?.id==='s_category_id')scheduleRender()},true);

const baseCheckedRpc=window.checkedRpc;
if(typeof baseCheckedRpc==='function')window.checkedRpc=async function(name,args){
  const field=document.querySelector('#palaEditSheet .warehouse-midpiece-tent-links-v354');
  if(name==='admin_save_tent_basics'&&field){
    const compatible=[...field.querySelectorAll('.warehouse-midpiece-tent-choice-v354:checked')].map(input=>+input.value).filter(Boolean);
    args={...args,p_data:{...(args?.p_data||{}),compatible_tent_ids:compatible}};
  }
  return baseCheckedRpc.call(this,name,args);
};

const baseOpenTent=window.openTent;
if(typeof baseOpenTent==='function')window.openTent=async function(id){
  const result=await baseOpenTent.apply(this,arguments);
  const tent=allTents().find(t=>+t.id===+id);if(!tent)return result;
  document.querySelectorAll('.midpiece-links-detail-v354').forEach(node=>node.remove());
  if(isMidpieceCategory(tent.category_id)){
    const links=(tent.compatible_tent_ids||[]).map(Number).map(tid=>allTents().find(t=>+t.id===tid)).filter(Boolean);
    if(links.length)app?.insertAdjacentHTML('beforeend',`<section class="card midpiece-links-detail-v354"><h3>Tilknyttede telte</h3><p class="small muted">Dette midterstykke / denne kanap er koblet til:</p>${links.map(t=>`<button type="button" class="btn" onclick="openTent(${+t.id})">${typeof uiIcon==='function'?uiIcon('tent'):''} ${escText(t.name||'Telt')}</button>`).join(' ')}</section>`);
  }else{
    const pieces=allTents().filter(piece=>isMidpieceCategory(piece.category_id)&&(piece.compatible_tent_ids||[]).map(Number).includes(+id));
    if(pieces.length)app?.insertAdjacentHTML('beforeend',`<section class="card midpiece-links-detail-v354"><h3>Midterstykker / Kanap</h3><p class="small muted">Følgende dele er koblet til dette telt:</p>${pieces.map(piece=>`<button type="button" class="btn" onclick="openTent(${+piece.id})">${typeof uiIcon==='function'?uiIcon('link'):''} ${escText(piece.name||'Del')}</button>`).join(' ')}</section>`);
  }
  return result;
};
})();