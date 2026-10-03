/* PALA v358 · global search priority: Lager -> Ordrer -> øvrigt. */
(()=>{
'use strict';
if(window.__palaSearchPriorityV358)return;
window.__palaSearchPriorityV358=true;

if(typeof renderSearchResults!=='function')return;
const baseRenderSearchResults=renderSearchResults;

function groupPriority(group){
  const actions=[...group.querySelectorAll('.search-result[onclick]')].map(node=>String(node.getAttribute('onclick')||''));
  if(actions.some(code=>/\b(?:openTent|openInventoryNfc|openHardwareNfc|openSpecialHardware)\s*\(/.test(code)))return 0;
  if(actions.some(code=>/\b(?:openCalendarBooking|viewOrder)\s*\(/.test(code)))return 1;
  return 2;
}

function prioritizeSearchGroups(){
  const host=document.getElementById('searchResults');
  const groupsHost=host?.querySelector('.search-groups');
  if(!groupsHost)return;
  const groups=[...groupsHost.children].filter(node=>node.classList?.contains('search-group'));
  if(groups.length<2)return;
  groups
    .map((node,index)=>({node,index,priority:groupPriority(node)}))
    .sort((a,b)=>a.priority-b.priority||a.index-b.index)
    .forEach(row=>groupsHost.appendChild(row.node));
}

renderSearchResults=function(query){
  const result=baseRenderSearchResults.apply(this,arguments);
  prioritizeSearchGroups();
  return result;
};

/* Reorder an already-open search view when v358 loads. */
prioritizeSearchGroups();
})();
