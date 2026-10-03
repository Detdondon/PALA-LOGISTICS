/* PALA v356 · link tents to multiple versions without breaking existing series grouping. */
(()=>{
'use strict';
if(window.__palaTentVersionsV356)return;
window.__palaTentVersionsV356=true;

let activeTentId=null;
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('da-DK').replace(/\s+/g,' ').trim();
const escText=value=>typeof esc==='function'?esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const allTents=()=>typeof tents!=='undefined'&&tents?Object.values(tents):Object.values(window.tents||{});
const categories=()=>Array.isArray(window.warehouseCategories)?window.warehouseCategories:(typeof warehouseCategories!=='undefined'&&Array.isArray(warehouseCategories)?warehouseCategories:[]);
const tentById=id=>allTents().find(t=>+t.id===+id)||null;

function midpieceCategoryIds(){
  const rows=categories();
  const roots=rows.filter(c=>{const n=norm(c.name);return n.includes('midterstyk')&&n.includes('kanap')});
  const ids=new Set(roots.map(c=>+c.id));
  let changed=true;
  while(changed){changed=false;rows.forEach(c=>{if(c.parent_id&&ids.has(+c.parent_id)&&!ids.has(+c.id)){ids.add(+c.id);changed=true;}})}
  return ids;
}
function isMidpiece(t){return !!t&&midpieceCategoryIds().has(+t.category_id)}
function rootTent(t){
  let current=t,seen=new Set();
  while(current?.parent_tent_id&&!seen.has(+current.id)){
    seen.add(+current.id);
    const next=tentById(current.parent_tent_id);
    if(!next||seen.has(+next.id))break;
    current=next;
  }
  return current||t;
}
function familyIds(t){
  if(!t?.id)return new Set();
  const root=rootTent(t),rootId=+root?.id||+t.id,out=new Set();
  allTents().forEach(other=>{if(+other.id!==+t.id&&!isMidpiece(other)&&+(rootTent(other)?.id||other.id)===rootId)out.add(+other.id)});
  return out;
}
function versionIds(t){
  const ids=familyIds(t);
  (t?.compatible_tent_ids||[]).map(Number).forEach(id=>{const other=tentById(id);if(other&&!isMidpiece(other)&&+id!==+t?.id)ids.add(+id)});
  if(t?.parent_tent_id)ids.add(+t.parent_tent_id);
  allTents().forEach(other=>{
    if(+other.id===+t?.id||isMidpiece(other))return;
    if((other.compatible_tent_ids||[]).map(Number).includes(+t?.id))ids.add(+other.id);
  });
  return ids;
}
function choices(){return allTents().filter(t=>+t.id!==+activeTentId&&!isMidpiece(t)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'da'))}
function relationHost(){return document.querySelector('#palaEditSheet .pala-editor-section[data-editor-section="1"] .pala-editor-fields')||document.querySelector('#palaEditSheet .sheet-body')}
function filterRows(field,value){const q=norm(value);field.querySelectorAll('.warehouse-tent-version-choice-v356').forEach(label=>{label.hidden=!!q&&!norm(label.textContent).includes(q)})}
function updateSummary(field){
  const count=field.querySelectorAll('.warehouse-tent-version-choice-v356 input:checked').length;
  const summary=field.querySelector('summary');if(summary)summary.textContent=`Versioner af samme telt${count?` · ${count} valgt`:''}`;
}
function renderVersionField(){
  const category=document.querySelector('#palaEditSheet #s_category_id');
  const current=activeTentId?tentById(activeTentId):null;
  const existing=document.querySelector('#palaEditSheet .warehouse-tent-version-links-v356');
  if((current&&isMidpiece(current))||(category&&midpieceCategoryIds().has(+category.value))){existing?.remove();return;}

  document.querySelectorAll('#palaEditSheet .warehouse-tent-links-v183').forEach(node=>node.remove());
  const parentSelect=document.querySelector('#palaEditSheet #s_parent_tent_id');
  const legacyDetails=parentSelect?.closest('details');
  const host=relationHost();if(!host)return;
  const selected=versionIds(current||{}),rows=choices();
  const field=document.createElement('details');
  field.className='sheet-group pala-editor-unit pala-editor-wide warehouse-tent-version-links-v356';
  field.open=true;
  field.innerHTML=`<summary>Versioner af samme telt${selected.size?` · ${selected.size} valgt`:''}</summary><p class="small muted">Vælg alle andre versioner, der hører til samme teltserie. Der er ingen grænse for antal versioner. Lagerets eksisterende seriegruppering bevares automatisk.</p><input type="search" class="warehouse-tent-version-search-v356" placeholder="Søg teltversion" aria-label="Søg teltversioner"><div class="sheet-checks">${rows.map(t=>`<label class="warehouse-tent-version-choice-v356"><input type="checkbox" value="${+t.id}" ${selected.has(+t.id)?'checked':''}> ${escText(t.name||'Telt')}</label>`).join('')||'<p class="small muted">Ingen andre telte at vælge imellem.</p>'}</div>`;
  existing?.remove();
  if(legacyDetails){legacyDetails.replaceWith(field)}else host.append(field);
  field.querySelector('.warehouse-tent-version-search-v356')?.addEventListener('input',event=>filterRows(field,event.target.value));
  field.addEventListener('change',()=>updateSummary(field));
}
function schedule(){queueMicrotask(()=>requestAnimationFrame(()=>requestAnimationFrame(renderVersionField)))}
function selectedVersionIds(){return [...document.querySelectorAll('#palaEditSheet .warehouse-tent-version-choice-v356 input:checked')].map(input=>+input.value).filter(Boolean)}
function chooseParent(ids){
  if(!ids.length)return null;
  const current=activeTentId?tentById(activeTentId):null;
  if(current){
    const currentRoot=rootTent(current);
    if(+currentRoot?.id===+current.id&&ids.some(id=>+(rootTent(tentById(id))?.id||id)===+current.id))return null;
    if(current.parent_tent_id&&ids.some(id=>+(rootTent(tentById(id))?.id||id)===+(currentRoot?.id||current.parent_tent_id)))return +current.parent_tent_id;
  }
  const first=tentById(ids[0]),root=rootTent(first);
  return root&&+root.id!==+activeTentId?+root.id:null;
}

const baseEditTent=window.editTentBasics;
if(typeof baseEditTent==='function')window.editTentBasics=function(id){
  activeTentId=id?+id:null;
  const result=baseEditTent.apply(this,arguments);
  schedule();
  return result;
};

document.addEventListener('change',event=>{if(event.target?.id==='s_category_id')schedule()},true);

const baseCheckedRpc=window.checkedRpc;
if(typeof baseCheckedRpc==='function')window.checkedRpc=async function(name,args){
  const field=document.querySelector('#palaEditSheet .warehouse-tent-version-links-v356');
  if(name==='admin_save_tent_basics'&&field){
    const ids=selectedVersionIds();
    args={...args,p_data:{...(args?.p_data||{}),compatible_tent_ids:ids,parent_tent_id:chooseParent(ids)}};
  }
  return baseCheckedRpc.call(this,name,args);
};

const baseOpenTent=window.openTent;
if(typeof baseOpenTent==='function')window.openTent=async function(id){
  const result=await baseOpenTent.apply(this,arguments);
  const tent=tentById(id);if(!tent||isMidpiece(tent))return result;
  document.querySelectorAll('.tent-version-detail-v356').forEach(node=>node.remove());
  const related=[...versionIds(tent)].map(tentById).filter(Boolean);
  if(related.length&&typeof app!=='undefined')app.insertAdjacentHTML('beforeend',`<section class="card tent-version-detail-v356"><h3>Versioner af samme telt</h3><p class="small muted">Andre registrerede versioner i samme teltserie.</p>${related.map(t=>`<button type="button" class="btn" onclick="openTent(${+t.id})">${typeof uiIcon==='function'?uiIcon('tent'):''} ${escText(t.name||'Telt')}</button>`).join(' ')}</section>`);
  return result;
};
})();
