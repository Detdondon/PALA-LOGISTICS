/* PALA calendar UI v177
   Safe DOM-only enhancer: icon filters with labels, contextual counts and compact action row.
   Completed status uses completed-only counts for the selected month.
   Does not override showCalendar or any startup/data function. */
(()=>{
'use strict';
if(window.__palaCalendarUiV174)return;
window.__palaCalendarUiV174=true;

const textOf=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
function labelByName(root,name){return [...(root?.querySelectorAll('label')||[])].find(label=>textOf(label.querySelector('span'))===name)||null}
function iconButton(type,icon,label,ariaLabel,active){
  const button=document.createElement('button');
  button.type='button';
  button.className='calendar-type-icon-v174'+(active?' active':'');
  button.setAttribute('aria-label',ariaLabel||label);
  button.setAttribute('title',ariaLabel||label);
  button.setAttribute('aria-pressed',active?'true':'false');
  const iconMarkup=typeof uiIcon==='function'?uiIcon(icon):'';
  button.innerHTML=iconMarkup+'<span class="calendar-type-label-v174">'+label+'</span>';
  button.addEventListener('click',()=>{if(typeof setUnifiedCalendarTypeV123==='function')setUnifiedCalendarTypeV123(type)});
  return button;
}
function countNode(text,warning=false){
  const span=document.createElement('span');
  span.className='calendar-count-item-v174'+(warning?' warning':'');
  span.textContent=text;
  return span;
}
function separator(){const span=document.createElement('span');span.className='calendar-count-separator-v174';span.setAttribute('aria-hidden','true');span.textContent='•';return span}
function isoDate(d){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function completedMonthCounts(){
  const current=typeof calDate!=='undefined'&&calDate instanceof Date&&!Number.isNaN(calDate.getTime())?calDate:new Date();
  const first=isoDate(new Date(current.getFullYear(),current.getMonth(),1));
  const last=isoDate(new Date(current.getFullYear(),current.getMonth()+1,0));
  const dateOnly=v=>String(v??'').slice(0,10);
  const overlaps=(a,b)=>{a=dateOnly(a);b=dateOnly(b);return !!(a&&b&&a<=last&&b>=first)};
  const inMonth=v=>{v=dateOnly(v);return !!(v&&v>=first&&v<=last)};

  const orders=Array.isArray(bookings)?bookings.filter(r=>overlaps(r?.start_date,r?.end_date)&&(typeof bookingStatusMatchV123==='function'?bookingStatusMatchV123(r):r?.status==='Afsluttet')).length:0;
  const staffing=Array.isArray(staffingShifts)?staffingShifts.filter(r=>inMonth(r?.shift_date)&&(typeof shiftStatusMatchV123==='function'?shiftStatusMatchV123(r):false)).length:0;
  const jobs=Array.isArray(workshopJobs)?workshopJobs.filter(r=>overlaps(r?.start_date,r?.end_date)&&(typeof workshopJobStatusMatchV123==='function'?workshopJobStatusMatchV123(r):r?.status==='Afsluttet')).length:0;
  const tasks=Array.isArray(workshopTasks)?workshopTasks.filter(r=>{
    if(typeof workshopTaskStatusMatchV123==='function'&&!workshopTaskStatusMatchV123(r))return false;
    if(typeof workshopTaskStatusMatchV123!=='function'&&r?.status!=='completed')return false;
    if(typeof workshopTaskRangeV120!=='function')return false;
    const range=workshopTaskRangeV120(r);
    return !!(range&&range.start<=last&&range.end>=first);
  }).length:0;
  return{orders,staffing,workshop:jobs+tasks};
}
function enhanceCalendar(){
  try{
    const card=document.querySelector('.calendar-controller-v150');
    if(!card||card.dataset.calendarUiV174==='1')return;
    const tools=card.querySelector('.unified-calendar-tools-v123');
    const filterGrid=tools?.querySelector('.calendar-filter-grid-v150');
    const summary=tools?.querySelector('.unified-calendar-summary-v123');
    const actions=tools?.querySelector('.unified-calendar-actions-v123');
    if(!tools||!filterGrid||!summary||!actions)return;

    const visLabel=labelByName(filterGrid,'Vis');
    const statusLabel=labelByName(filterGrid,'Status');
    const type=visLabel?.querySelector('select')?.value||'all';
    const status=statusLabel?.querySelector('select')?.value||'active';
    const original=[...summary.querySelectorAll('button')].slice(0,3);
    if(original.length<3)return;
    const counts={
      orders:textOf(original[0])||'0 ordrer',
      staffing:(textOf(original[1])||'0 vagter').replace(/mangler folk/gi,'mangler bemanding'),
      workshop:textOf(original[2])||'0 systue',
      staffingMissing:original[1].classList.contains('red')||/mangler/i.test(textOf(original[1]))
    };
    if(status==='completed'){
      const completed=completedMonthCounts();
      counts.orders=`${completed.orders} ordrer`;
      counts.staffing=`${completed.staffing} vagter`;
      counts.workshop=`${completed.workshop} systue`;
      counts.staffingMissing=false;
    }

    card.dataset.calendarUiV174='1';
    visLabel?.remove();
    if(statusLabel){statusLabel.classList.add('calendar-status-control-v174');actions.prepend(statusLabel)}
    const remaining=[...filterGrid.querySelectorAll('label')];
    filterGrid.classList.toggle('calendar-filter-grid-single-v174',remaining.length===1);
    filterGrid.hidden=remaining.length===0;

    summary.className='unified-calendar-summary-v123 calendar-type-buttons-v174';
    summary.replaceChildren(
      iconButton('all','list','Alt','Vis alt',type==='all'),
      iconButton('orders','calendar','Ordre','Ordrer',type==='orders'),
      iconButton('staffing','people','Vagter','Vagter',type==='staffing'),
      iconButton('workshop','scissors','Systue','Systue',type==='workshop')
    );

    actions.classList.add('calendar-action-row-v174');
    const countBar=document.createElement('div');
    countBar.className='calendar-count-summary-v174';
    countBar.setAttribute('aria-live','polite');
    const parts=[];
    if(type==='all'||type==='orders')parts.push(countNode(counts.orders));
    if(type==='all'||type==='staffing')parts.push(countNode(counts.staffing,counts.staffingMissing));
    if(type==='all'||type==='workshop')parts.push(countNode(counts.workshop));
    parts.forEach((node,index)=>{if(index)countBar.appendChild(separator());countBar.appendChild(node)});
    tools.appendChild(countBar);
  }catch(error){console.warn('PALA calendar UI enhancement skipped',error)}
}

if(!document.getElementById('pala-calendar-ui-v174-style')){
  const style=document.createElement('style');
  style.id='pala-calendar-ui-v174-style';
  style.textContent=`
    .calendar-type-buttons-v174{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important;align-items:stretch!important}
    .calendar-type-icon-v174{min-width:0!important;min-height:54px!important;border:1px solid #d7dde8!important;border-radius:15px!important;background:#fff!important;color:#42526b!important;display:flex!important;flex-direction:column!important;gap:3px!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;padding:7px 8px 6px!important}
    .calendar-type-icon-v174 .ui-icon{width:21px!important;height:21px!important;flex:0 0 auto!important}
    .calendar-type-label-v174{display:block!important;font-size:10px!important;font-weight:750!important;line-height:1!important;white-space:nowrap!important}
    .calendar-type-icon-v174.active{background:#eef5ff!important;color:#1768c4!important;border-color:#2f80ed!important;box-shadow:0 0 0 2px rgba(47,128,237,.12) inset!important}
    .calendar-type-icon-v174:focus-visible{outline:3px solid rgba(47,128,237,.24)!important;outline-offset:2px!important}
    .calendar-filter-grid-single-v174{grid-template-columns:1fr!important}
    .calendar-action-row-v174{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))!important;gap:7px!important;align-items:stretch!important}
    .calendar-action-row-v174 .calendar-status-control-v174{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:4px!important;margin:0!important;min-width:0!important}
    .calendar-action-row-v174 .calendar-status-control-v174>span{font-size:10px!important;line-height:1!important;font-weight:700!important;color:#667085!important;padding-left:2px!important}
    .calendar-action-row-v174 .calendar-status-control-v174 select{width:100%!important;min-width:0!important;margin:0!important;min-height:44px!important}
    .calendar-action-row-v174>.btn{width:100%!important;min-width:0!important;min-height:48px!important;justify-content:center!important;text-align:center!important;white-space:normal!important;line-height:1.15!important}
    .calendar-count-summary-v174{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:7px!important;min-height:30px!important;padding:8px 2px 0!important;border-top:1px solid #e4e8ef!important;color:#667085!important;font-size:12px!important;font-weight:750!important;line-height:1.3!important;flex-wrap:wrap!important}
    .calendar-count-item-v174.warning{color:#a12a2a!important}
    .calendar-count-separator-v174{color:#b0b7c3!important}
    @media(max-width:620px){.calendar-type-buttons-v174{gap:5px!important}.calendar-type-icon-v174{min-height:52px!important;border-radius:13px!important;padding:6px!important}.calendar-type-icon-v174 .ui-icon{width:19px!important;height:19px!important}.calendar-type-label-v174{font-size:9.5px!important}.calendar-action-row-v174{grid-template-columns:repeat(auto-fit,minmax(105px,1fr))!important;gap:5px!important}.calendar-action-row-v174>.btn{font-size:10.5px!important;padding:7px 6px!important}.calendar-action-row-v174 .calendar-status-control-v174 select{font-size:12px!important}.calendar-count-summary-v174{font-size:11px!important;gap:6px!important}}
  `;
  document.head.appendChild(style);
}

let queued=false;
const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceCalendar()})};
const root=document.getElementById('app');
if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
})();
