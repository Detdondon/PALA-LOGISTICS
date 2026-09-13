/* PALA calendar toolbar v167
   Safe DOM-only enhancer: icon filters + contextual counts + bottom actions. */
(()=>{
'use strict';
if(window.__palaCalendarToolbarV167)return;
window.__palaCalendarToolbarV167=true;

const textOf=el=>String(el?.textContent||'').trim();
const icon=name=>typeof uiIcon==='function'?uiIcon(name):'';
function labelByName(root,name){return [...(root?.querySelectorAll('label')||[])].find(label=>textOf(label.querySelector('span'))===name)||null}
function setPressed(button,active){if(!button)return;button.classList.toggle('calendar-type-active-v167',!!active);button.setAttribute('aria-pressed',active?'true':'false')}
function makeIconButton(button,label,iconName){if(!button)return;button.innerHTML=icon(iconName);button.setAttribute('aria-label',label);button.setAttribute('title',label);button.classList.add('calendar-type-icon-v167')}
function countRow(iconName,text,warning=false){return `<span class="calendar-count-item-v167 ${warning?'calendar-count-warning-v167':''}">${icon(iconName)}<span>${text}</span></span>`}
function countSummary(type,m){
  if(type==='orders')return countRow('calendar',m.orders);
  if(type==='staffing')return countRow('people',m.staffing,m.staffingMissing);
  if(type==='workshop')return countRow('scissors',m.workshop);
  return countRow('calendar',m.orders)+countRow('people',m.staffing,m.staffingMissing)+countRow('scissors',m.workshop);
}
function enhanceCalendarToolbar(){
  const card=document.querySelector('.calendar-controller-v150');
  if(!card||card.dataset.toolbarV167==='1')return;
  const tools=card.querySelector('.unified-calendar-tools-v123');
  const filterGrid=tools?.querySelector('.calendar-filter-grid-v150');
  const summary=tools?.querySelector('.unified-calendar-summary-v123');
  const actions=tools?.querySelector('.unified-calendar-actions-v123');
  if(!tools||!summary||!actions)return;
  card.dataset.toolbarV167='1';

  const original=[...summary.querySelectorAll('button')].slice(0,3);
  const metrics={
    orders:textOf(original[0])||'0 ordrer',
    staffing:textOf(original[1])||'0 vagter',
    workshop:textOf(original[2])||'0 systue',
    staffingMissing:!!original[1]&&(original[1].classList.contains('red')||/mangler/i.test(textOf(original[1])))
  };

  labelByName(filterGrid,'Vis')?.remove();
  const statusLabel=labelByName(filterGrid,'Status');
  if(statusLabel){statusLabel.classList.add('calendar-status-control-v167');actions.prepend(statusLabel)}
  if(filterGrid){const remaining=[...filterGrid.querySelectorAll('label')];filterGrid.classList.toggle('calendar-filter-grid-single-v167',remaining.length===1);filterGrid.hidden=remaining.length===0}

  const allButton=document.createElement('button');
  allButton.type='button';
  allButton.className='pill reference-button calendar-type-all-v167';
  allButton.onclick=()=>setUnifiedCalendarTypeV123('all');
  summary.prepend(allButton);

  makeIconButton(allButton,'Vis alt','list');
  makeIconButton(original[0],'Ordrer','calendar');
  makeIconButton(original[1],'Vagter','people');
  makeIconButton(original[2],'Systue','scissors');
  summary.classList.add('calendar-type-buttons-v167');

  const type=typeof mainCalendarTypeFilterV120==='string'?mainCalendarTypeFilterV120:'all';
  setPressed(allButton,type==='all');
  setPressed(original[0],type==='orders');
  setPressed(original[1],type==='staffing');
  setPressed(original[2],type==='workshop');

  actions.classList.add('calendar-bottom-actions-v167');
  actions.classList.toggle('calendar-bottom-actions-admin-v167',!!actions.querySelector('[onclick*="showProductionPlanExportDialog"]'));

  const countBar=document.createElement('div');
  countBar.className='calendar-count-summary-v167';
  countBar.setAttribute('aria-live','polite');
  countBar.innerHTML=countSummary(type,metrics);
  tools.append(countBar);
}

if(!document.getElementById('pala-calendar-toolbar-v167-style')){
  const style=document.createElement('style');
  style.id='pala-calendar-toolbar-v167-style';
  style.textContent=`
    .calendar-type-buttons-v167{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;align-items:stretch!important}
    .calendar-type-buttons-v167 .reference-button{width:100%!important;min-width:0!important;min-height:46px!important;padding:8px!important;justify-content:center!important;align-items:center!important;overflow:hidden!important}
    .calendar-type-buttons-v167 .calendar-type-icon-v167 .ui-icon{width:22px!important;height:22px!important;flex:0 0 auto!important}
    .calendar-type-buttons-v167 .calendar-type-active-v167{border-color:#2f80ed!important;box-shadow:0 0 0 2px rgba(47,128,237,.13) inset!important;background:#eef5ff!important;color:#1768c4!important}
    .calendar-filter-grid-single-v167{grid-template-columns:1fr!important}
    .calendar-bottom-actions-v167{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)!important;gap:7px!important;align-items:stretch!important}
    .calendar-bottom-actions-v167.calendar-bottom-actions-admin-v167{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.05fr)!important}
    .calendar-bottom-actions-v167 .calendar-status-control-v167{min-width:0!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:3px!important;margin:0!important}
    .calendar-bottom-actions-v167 .calendar-status-control-v167>span{font-size:10px!important;line-height:1!important;font-weight:700!important;color:#667085!important;padding-left:2px!important}
    .calendar-bottom-actions-v167 .calendar-status-control-v167 select{width:100%!important;min-width:0!important;height:100%!important;min-height:42px!important;margin:0!important;padding-left:10px!important;padding-right:26px!important}
    .calendar-bottom-actions-v167>.btn{width:100%!important;min-width:0!important;min-height:48px!important;height:auto!important;padding:7px 6px!important;justify-content:center!important;text-align:center!important;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.15!important}
    .calendar-count-summary-v167{display:flex!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:wrap!important;gap:7px 12px!important;margin-top:8px!important;padding:9px 11px!important;border-top:1px solid var(--line,#e5e7eb)!important;color:#475467!important;font-size:12px!important;font-weight:700!important;line-height:1.2!important}
    .calendar-count-item-v167{display:inline-flex!important;align-items:center!important;gap:5px!important;min-width:0!important}
    .calendar-count-item-v167 .ui-icon{width:15px!important;height:15px!important;flex:0 0 auto!important}
    .calendar-count-warning-v167{color:#a14343!important}
    @media(max-width:620px){
      .calendar-type-buttons-v167{gap:5px!important}.calendar-type-buttons-v167 .reference-button{min-height:44px!important;padding:7px!important}.calendar-type-buttons-v167 .calendar-type-icon-v167 .ui-icon{width:21px!important;height:21px!important}
      .calendar-bottom-actions-v167{gap:5px!important}.calendar-bottom-actions-v167 .calendar-status-control-v167>span{font-size:9px!important}.calendar-bottom-actions-v167 .calendar-status-control-v167 select{min-height:44px!important;font-size:12px!important;padding-left:7px!important;padding-right:21px!important}
      .calendar-bottom-actions-v167>.btn{min-height:48px!important;padding:6px 4px!important;font-size:10.5px!important}.calendar-bottom-actions-v167>.btn .ui-icon{width:15px!important;height:15px!important;flex:0 0 auto!important}
      .calendar-count-summary-v167{font-size:11px!important;gap:6px 9px!important;padding:8px 6px 2px!important;margin-top:7px!important}
    }
    @media(max-width:370px){.calendar-bottom-actions-v167>.btn{font-size:9.5px!important}.calendar-bottom-actions-v167 .calendar-status-control-v167 select{font-size:11px!important}.calendar-count-summary-v167{font-size:10.5px!important}}
  `;
  document.head.appendChild(style);
}

const appRoot=document.getElementById('app');
if(appRoot){
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceCalendarToolbar()})};
  new MutationObserver(schedule).observe(appRoot,{childList:true,subtree:true});
  schedule();
}
})();
