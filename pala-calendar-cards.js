/* PALA v286: one calendar-list card shell; original data and controls stay intact. */
(()=>{
'use strict';
const scope='.view-list,.calendar-detail-list';
const cards='.job-card,.staff-card,.workshop-job-card,.workshop-task';
const processed=new WeakSet();
const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
function adapt(card){
  if(processed.has(card))return;
  const title=card.querySelector('h3');if(!title)return;
  processed.add(card);
  const type=card.matches('.job-card')?'Ordre':card.matches('.staff-leave-card')?'Fravær':card.matches('.staff-card')?'Vagt':card.matches('.workshop-job-card')?'Systuejob':'Skade';
  card.style.setProperty('--activity-accent',getComputedStyle(card).borderLeftColor);
  card.classList.add('pala-activity-card');card.dataset.activityType=type;
  const head=make('div','pala-activity-head'),heading=make('div','pala-activity-heading'),meta=make('div','pala-activity-meta'),body=make('div','pala-activity-body'),footer=make('div','pala-activity-footer'),actions=make('div','pala-activity-actions');
  heading.append(make('span','pala-activity-type',type),title);head.append(heading);
  const status=card.querySelector('.status-pill,.workshop-status')||(card.matches('.workshop-job-card')?card.querySelector('.small.muted'):null);if(status){status.classList.add('pala-activity-status');head.append(status);}
  // The staffing indicator is also a functional shortcut: retain the original button.
  const staffing=card.querySelector('.pill.reference-button');if(staffing){staffing.classList.add('pala-activity-status');head.append(staffing);}
  const quickStatus=card.querySelector('.job-quick-status');if(quickStatus)footer.append(quickStatus);
  // Record actions share one position. Reference links remain next to their information.
  [...card.querySelectorAll('button.btn,a.btn')].forEach(button=>actions.append(button));
  const oldHead=card.querySelector('.job-head,.workshop-task-head,:scope > .row');
  if(oldHead){
    const description=oldHead.querySelector('p');if(description)body.append(description);
    [...oldHead.childNodes].forEach(n=>{if(n.nodeType===1&&n.textContent.trim())meta.append(n);});
    oldHead.remove();
  }
  const taskMeta=card.querySelector('.workshop-task-meta');if(taskMeta)meta.append(taskMeta);
  const metrics=card.querySelector('.job-metrics');if(metrics)body.append(metrics);
  [...card.childNodes].forEach(n=>{if(n.nodeType===1&&(n.textContent.trim()||n.querySelector('img,input,select,button,a')))body.append(n);});
  // Empty legacy action wrappers are unnecessary after their controls have moved.
  body.querySelectorAll('.job-actions,.job-status-action-row,.workshop-task-actions,.row').forEach(n=>{if(!n.textContent.trim()&&!n.querySelector('img,input,select,button,a'))n.remove();});
  footer.append(actions);card.replaceChildren(head,meta,body,footer);
}
function scan(){document.querySelectorAll(scope).forEach(host=>host.querySelectorAll(cards).forEach(adapt));}
let queued=false;
const observer=new MutationObserver(records=>{if(queued||!records.some(r=>r.addedNodes.length))return;queued=true;queueMicrotask(()=>{queued=false;observer.disconnect();try{scan();}finally{observe();}});});
function observe(){const app=document.getElementById('app');if(app)observer.observe(app,{childList:true,subtree:true});}
scan();observe();
})();
