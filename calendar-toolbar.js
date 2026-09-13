/* PALA calendar toolbar v160
   Compact type buttons + bottom status/action row. */
(()=>{
'use strict';
if(window.__palaCalendarToolbarV160||typeof showCalendar!=='function')return;
window.__palaCalendarToolbarV160=true;

function textOf(el){return String(el?.textContent||'').trim()}
function labelByName(root,name){
  return [...(root?.querySelectorAll('label')||[])].find(label=>textOf(label.querySelector('span'))===name)||null;
}
function setPressed(button,active){
  if(!button)return;
  button.classList.toggle('calendar-type-active-v160',!!active);
  button.setAttribute('aria-pressed',active?'true':'false');
}
function applyCalendarToolbarV160(){
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
    statusLabel.classList.add('calendar-status-control-v160');
    actions.prepend(statusLabel);
  }

  if(filterGrid){
    const remaining=[...filterGrid.querySelectorAll('label')];
    filterGrid.classList.toggle('calendar-filter-grid-single-v160',remaining.length===1);
    filterGrid.hidden=remaining.length===0;
  }

  let allButton=summary.querySelector('.calendar-type-all-v160');
  if(!allButton){
    allButton=document.createElement('button');
    allButton.type='button';
    allButton.className='pill reference-button calendar-type-all-v160';
    allButton.textContent='Vis alt';
    allButton.onclick=()=>setUnifiedCalendarTypeV123('all');
    summary.prepend(allButton);
  }

  summary.classList.add('calendar-type-buttons-v160');
  const buttons=[...summary.querySelectorAll('button')];
  const type=typeof mainCalendarTypeFilterV120==='string'?mainCalendarTypeFilterV120:'all';
  setPressed(allButton,type==='all');
  if(buttons[1])setPressed(buttons[1],type==='orders');
  if(buttons[2])setPressed(buttons[2],type==='staffing');
  if(buttons[3])setPressed(buttons[3],type==='workshop');

  actions.classList.add('calendar-bottom-actions-v160');
  const hasProduction=!!actions.querySelector('[onclick*="showProductionPlanExportDialog"]');
  actions.classList.toggle('calendar-bottom-actions-admin-v160',hasProduction);
}

const baseShowCalendarV160=showCalendar;
showCalendar=async function(){
  const result=await baseShowCalendarV160.apply(this,arguments);
  applyCalendarToolbarV160();
  return result;
};

if(!document.getElementById('pala-calendar-toolbar-v160-style')){
  const style=document.createElement('style');
  style.id='pala-calendar-toolbar-v160-style';
  style.textContent=`
    .calendar-type-buttons-v160{
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:6px!important;
      align-items:stretch!important;
    }
    .calendar-type-buttons-v160 .reference-button{
      width:100%!important;
      min-width:0!important;
      min-height:46px!important;
      padding:7px 5px!important;
      justify-content:center!important;
      align-items:center!important;
      gap:5px!important;
      text-align:center!important;
      white-space:normal!important;
      overflow:hidden!important;
      overflow-wrap:anywhere!important;
      line-height:1.12!important;
    }
    .calendar-type-buttons-v160 .calendar-type-active-v160{
      border-color:#2f80ed!important;
      box-shadow:0 0 0 2px rgba(47,128,237,.13) inset!important;
      background:#eef5ff!important;
      color:#1768c4!important;
    }
    .calendar-type-buttons-v160 .ui-icon{flex:0 0 auto!important}
    .calendar-filter-grid-single-v160{grid-template-columns:1fr!important}
    .calendar-bottom-actions-v160{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)!important;
      gap:7px!important;
      align-items:stretch!important;
    }
    .calendar-bottom-actions-v160.calendar-bottom-actions-admin-v160{
      grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.05fr)!important;
    }
    .calendar-bottom-actions-v160 .calendar-status-control-v160{
      min-width:0!important;
      display:flex!important;
      flex-direction:column!important;
      justify-content:center!important;
      gap:3px!important;
      margin:0!important;
    }
    .calendar-bottom-actions-v160 .calendar-status-control-v160>span{
      font-size:10px!important;
      line-height:1!important;
      font-weight:700!important;
      color:#667085!important;
      padding-left:2px!important;
    }
    .calendar-bottom-actions-v160 .calendar-status-control-v160 select{
      width:100%!important;
      min-width:0!important;
      height:100%!important;
      min-height:42px!important;
      margin:0!important;
      padding-left:10px!important;
      padding-right:26px!important;
    }
    .calendar-bottom-actions-v160>.btn{
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
    @media(max-width:620px){
      .calendar-type-buttons-v160{gap:4px!important}
      .calendar-type-buttons-v160 .reference-button{
        min-height:44px!important;
        padding:6px 3px!important;
        gap:3px!important;
        font-size:11px!important;
      }
      .calendar-type-buttons-v160 .reference-button .ui-icon{
        width:15px!important;
        height:15px!important;
      }
      .calendar-bottom-actions-v160{gap:5px!important}
      .calendar-bottom-actions-v160 .calendar-status-control-v160>span{font-size:9px!important}
      .calendar-bottom-actions-v160 .calendar-status-control-v160 select{
        min-height:44px!important;
        font-size:12px!important;
        padding-left:7px!important;
        padding-right:21px!important;
      }
      .calendar-bottom-actions-v160>.btn{
        min-height:48px!important;
        padding:6px 4px!important;
        font-size:10.5px!important;
      }
      .calendar-bottom-actions-v160>.btn .ui-icon{
        width:15px!important;
        height:15px!important;
        flex:0 0 auto!important;
      }
    }
    @media(max-width:370px){
      .calendar-type-buttons-v160 .reference-button{font-size:10px!important}
      .calendar-bottom-actions-v160>.btn{font-size:9.5px!important}
      .calendar-bottom-actions-v160 .calendar-status-control-v160 select{font-size:11px!important}
    }
  `;
  document.head.appendChild(style);
}

applyCalendarToolbarV160();
})();
