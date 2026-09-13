/* PALA calendar toolbar v166
   Icon-only type filters + contextual count summary + bottom status/action row. */
(()=>{
'use strict';
if(window.__palaCalendarToolbarV166||typeof showCalendar!=='function')return;
window.__palaCalendarToolbarV166=true;

function textOf(el){return String(el?.textContent||'').trim()}
function labelByName(root,name){
  return [...(root?.querySelectorAll('label')||[])].find(label=>textOf(label.querySelector('span'))===name)||null;
}
function setPressed(button,active){
  if(!button)return;
  button.classList.toggle('calendar-type-active-v166',!!active);
  button.setAttribute('aria-pressed',active?'true':'false');
}
function iconMarkup(name){return typeof uiIcon==='function'?uiIcon(name):''}
function makeIconButton(button,label,icon){
  if(!button)return;
  button.innerHTML=iconMarkup(icon);
  button.setAttribute('aria-label',label);
  button.setAttribute('title',label);
  button.classList.add('calendar-type-icon-v166');
}
function countSummaryHtml(type,metrics){
  const row=(icon,text,cls='')=>`<span class="calendar-count-item-v166 ${cls}">${iconMarkup(icon)}<span>${text}</span></span>`;
  if(type==='orders')return row('calendar',metrics.orders);
  if(type==='staffing')return row('people',metrics.staffing,metrics.staffingMissing?'calendar-count-warning-v166':'');
  if(type==='workshop')return row('scissors',metrics.workshop);
  return row('calendar',metrics.orders)+row('people',metrics.staffing,metrics.staffingMissing?'calendar-count-warning-v166':'')+row('scissors',metrics.workshop);
}
function applyCalendarToolbarV166(){
  const card=document.querySelector('.calendar-controller-v150');
  if(!card)return;
  const tools=card.querySelector('.unified-calendar-tools-v123');
  const filterGrid=tools?.querySelector('.calendar-filter-grid-v150');
  const summary=tools?.querySelector('.unified-calendar-summary-v123');
  const actions=tools?.querySelector('.unified-calendar-actions-v123');
  if(!tools||!summary||!actions)return;

  const visLabel=labelByName(filterGrid,'Vis');
  if(visLabel)visLabel.remove();

  const statusLabel=labelByName(filterGrid,'Status');
  if(statusLabel){
    statusLabel.classList.add('calendar-status-control-v166');
    actions.prepend(statusLabel);
  }

  if(filterGrid){
    const remaining=[...filterGrid.querySelectorAll('label')];
    filterGrid.classList.toggle('calendar-filter-grid-single-v166',remaining.length===1);
    filterGrid.hidden=remaining.length===0;
  }

  // Capture the controller's count text before converting the buttons to icons.
  const sourceButtons=[...summary.querySelectorAll('button')];
  const metrics={
    orders:textOf(sourceButtons[0])||'0 ordrer',
    staffing:textOf(sourceButtons[1])||'0 vagter',
    workshop:textOf(sourceButtons[2])||'0 systue',
    staffingMissing:sourceButtons[1]?.classList.contains('red')||/mangler/i.test(textOf(sourceButtons[1]))
  };

  let allButton=summary.querySelector('.calendar-type-all-v166');
  if(!allButton){
    allButton=document.createElement('button');
    allButton.type='button';
    allButton.className='pill reference-button calendar-type-all-v166';
    allButton.onclick=()=>setUnifiedCalendarTypeV123('all');
    summary.prepend(allButton);
  }

  const typeButtons=[allButton,...sourceButtons];
  makeIconButton(allButton,'Vis alt','list');
  makeIconButton(sourceButtons[0],'Ordrer','calendar');
  makeIconButton(sourceButtons[1],'Vagter','people');
  makeIconButton(sourceButtons[2],'Systue','scissors');

  summary.classList.add('calendar-type-buttons-v166');
  const type=typeof mainCalendarTypeFilterV120==='string'?mainCalendarTypeFilterV120:'all';
  setPressed(typeButtons[0],type==='all');
  setPressed(typeButtons[1],type==='orders');
  setPressed(typeButtons[2],type==='staffing');
  setPressed(typeButtons[3],type==='workshop');

  actions.classList.add('calendar-bottom-actions-v166');
  const hasProduction=!!actions.querySelector('[onclick*="showProductionPlanExportDialog"]');
  actions.classList.toggle('calendar-bottom-actions-admin-v166',hasProduction);

  let countBar=tools.querySelector('.calendar-count-summary-v166');
  if(!countBar){
    countBar=document.createElement('div');
    countBar.className='calendar-count-summary-v166';
    countBar.setAttribute('aria-live','polite');
    tools.append(countBar);
  }
  countBar.innerHTML=countSummaryHtml(type,metrics);
}

const baseShowCalendarV166=showCalendar;
showCalendar=async function(){
  const result=await baseShowCalendarV166.apply(this,arguments);
  applyCalendarToolbarV166();
  return result;
};

if(!document.getElementById('pala-calendar-toolbar-v166-style')){
  const style=document.createElement('style');
  style.id='pala-calendar-toolbar-v166-style';
  style.textContent=`
    .calendar-type-buttons-v166{
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:6px!important;
      align-items:stretch!important;
    }
    .calendar-type-buttons-v166 .reference-button{
      width:100%!important;
      min-width:0!important;
      min-height:46px!important;
      padding:8px!important;
      justify-content:center!important;
      align-items:center!important;
      overflow:hidden!important;
    }
    .calendar-type-buttons-v166 .calendar-type-icon-v166 .ui-icon{
      width:22px!important;
      height:22px!important;
      flex:0 0 auto!important;
    }
    .calendar-type-buttons-v166 .calendar-type-active-v166{
      border-color:#2f80ed!important;
      box-shadow:0 0 0 2px rgba(47,128,237,.13) inset!important;
      background:#eef5ff!important;
      color:#1768c4!important;
    }
    .calendar-filter-grid-single-v166{grid-template-columns:1fr!important}
    .calendar-bottom-actions-v166{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)!important;
      gap:7px!important;
      align-items:stretch!important;
    }
    .calendar-bottom-actions-v166.calendar-bottom-actions-admin-v166{
      grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.05fr)!important;
    }
    .calendar-bottom-actions-v166 .calendar-status-control-v166{
      min-width:0!important;
      display:flex!important;
      flex-direction:column!important;
      justify-content:center!important;
      gap:3px!important;
      margin:0!important;
    }
    .calendar-bottom-actions-v166 .calendar-status-control-v166>span{
      font-size:10px!important;
      line-height:1!important;
      font-weight:700!important;
      color:#667085!important;
      padding-left:2px!important;
    }
    .calendar-bottom-actions-v166 .calendar-status-control-v166 select{
      width:100%!important;
      min-width:0!important;
      height:100%!important;
      min-height:42px!important;
      margin:0!important;
      padding-left:10px!important;
      padding-right:26px!important;
    }
    .calendar-bottom-actions-v166>.btn{
      width:100%!important;
      min-width:0!important;
      min-height:48px!important;
      height:auto!important;
      padding:7px 6px!important;
      justify-content:center!important;
      text-align:center!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      line-height:1.15!important;
    }
    .calendar-count-summary-v166{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      flex-wrap:wrap!important;
      gap:7px 12px!important;
      margin-top:8px!important;
      padding:9px 11px!important;
      border-top:1px solid var(--line,#e5e7eb)!important;
      color:#475467!important;
      font-size:12px!important;
      font-weight:700!important;
      line-height:1.2!important;
    }
    .calendar-count-item-v166{display:inline-flex!important;align-items:center!important;gap:5px!important;min-width:0!important}
    .calendar-count-item-v166 .ui-icon{width:15px!important;height:15px!important;flex:0 0 auto!important}
    .calendar-count-warning-v166{color:#a14343!important}
    @media(max-width:620px){
      .calendar-type-buttons-v166{gap:5px!important}
      .calendar-type-buttons-v166 .reference-button{min-height:44px!important;padding:7px!important}
      .calendar-type-buttons-v166 .calendar-type-icon-v166 .ui-icon{width:21px!important;height:21px!important}
      .calendar-bottom-actions-v166{gap:5px!important}
      .calendar-bottom-actions-v166 .calendar-status-control-v166>span{font-size:9px!important}
      .calendar-bottom-actions-v166 .calendar-status-control-v166 select{min-height:44px!important;font-size:12px!important;padding-left:7px!important;padding-right:21px!important}
      .calendar-bottom-actions-v166>.btn{min-height:48px!important;padding:6px 4px!important;font-size:10.5px!important}
      .calendar-bottom-actions-v166>.btn .ui-icon{width:15px!important;height:15px!important;flex:0 0 auto!important}
      .calendar-count-summary-v166{font-size:11px!important;gap:6px 9px!important;padding:8px 6px 2px!important;margin-top:7px!important}
    }
    @media(max-width:370px){
      .calendar-bottom-actions-v166>.btn{font-size:9.5px!important}
      .calendar-bottom-actions-v166 .calendar-status-control-v166 select{font-size:11px!important}
      .calendar-count-summary-v166{font-size:10.5px!important}
    }
  `;
  document.head.appendChild(style);
}

applyCalendarToolbarV166();
})();
