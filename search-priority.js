/* PALA v360 · global search priority: Drift -> Lager -> andet. */
(()=>{
'use strict';
if(window.__palaSearchPriorityV360)return;
window.__palaSearchPriorityV360=true;

if(typeof renderSearchResults!=='function')return;
const baseRenderSearchResults=renderSearchResults;

function groupPriority(group){
  const heading=String(group.querySelector('h3')?.textContent||'').toLocaleLowerCase('da-DK');
  const actions=[...group.querySelectorAll('.search-result[onclick]')].map(node=>String(node.getAttribute('onclick')||''));

  /* 1. Drift: ordrer/jobs, vagter/bemanding, andre opgaver/møder og systue. */
  if(/ordre|job|vagt|bemand|opgave|møde|systue|workshop|skade/.test(heading))return 0;
  if(actions.some(code=>/\b(?:openCalendarBooking|viewOrder|openStaffingDate|openStaffShift|openMeeting|editMeeting|openWorkshopJob|openWorkshopTaskFromCalendarV120|showWorkshop|showDamageForm)\s*\(/.test(code)))return 0;

  /* 2. Lager: telte, inventar og hardware. */
  if(/telt|inventar|hardware|lager/.test(heading))return 1;
  if(actions.some(code=>/\b(?:openTent|openInventoryNfc|openHardwareNfc|openSpecialHardware)\s*\(/.test(code)))return 1;

  /* 3. Alt andet. */
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

prioritizeSearchGroups();
})();
