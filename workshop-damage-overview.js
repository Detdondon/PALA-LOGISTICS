/* PALA v310 · stable damage overview and calendar-only damage cards. */
(()=>{
'use strict';
if(window.__palaWorkshopDamageOverviewV310)return;
window.__palaWorkshopDamageOverviewV310=true;

function damageCanEditV310(task){
  return !!task&&(isAdminLoggedIn()||+task.created_by_employee_id===+employeeId);
}

window.calendarWorkshopTaskCardV310=function(task){
  const done=task?.status==='completed';
  const tent=tents?.[task?.tent_id];
  const name=task?.tent_name||tent?.name||`Telt ${task?.tent_id||''}`;
  const meta=[
    task?.created_at?`Oprettet ${workshopDate(task.created_at)}`:'',
    task?.created_by_employee_name?`af ${task.created_by_employee_name}`:'',
    task?.booking_name?`fra ${task.booking_name}`:''
  ].filter(Boolean).join(' · ');

  return `<article class="workshop-task calendar-damage-card-v310 ${done?'completed':''}"
    role="button" tabindex="0"
    onclick="if(!event.target.closest('button,a,input,select,textarea'))openWorkshopDamageOverview(${+task.id})"
    onkeydown="if((event.key==='Enter'||event.key===' ')&&!event.target.closest('button,a,input,select,textarea')){event.preventDefault();openWorkshopDamageOverview(${+task.id})}">
    <div class="workshop-task-head">
      <div>
        <div class="small muted">${done?'AFSLUTTET SKADE':'SKADE TIL SYSTUEN'}</div>
        <h3>${esc(name)}</h3>
        ${task?.description?`<p style="margin:7px 0 0;white-space:pre-wrap">${esc(task.description)}</p>`:''}
      </div>
      <span class="workshop-status">${uiIcon(done?'check':'scissors')}${done?'Afsluttet':'Åben'}</span>
    </div>
    ${meta?`<div class="workshop-task-meta"><span>${esc(meta)}</span></div>`:''}
    <div class="calendar-damage-open-v310">${uiIcon('chevronRight')} Åbn skadeoversigt</div>
  </article>`;
};

function damageReturnTargetV310(){
  const saved=sessionStorage.getItem('pala_damage_overview_return_v310');
  return saved===null?'':saved;
}

window.closeWorkshopDamageOverview=function(){
  const query=damageReturnTargetV310();
  sessionStorage.removeItem('pala_damage_overview_return_v310');
  history.replaceState(null,'',location.pathname+query);
  return route();
};

window.openWorkshopDamageOverview=function(id,fromRoute=false){
  if(!requireEmployee())return;
  const task=(workshopTasks||[]).find(row=>+row.id===+id);
  if(!task)return alert('Skaden findes ikke.');

  if(!fromRoute){
    const params=new URLSearchParams(location.search);
    if(!params.has('damageView'))sessionStorage.setItem('pala_damage_overview_return_v310',location.search||'');
    history.replaceState(null,'',location.pathname+'?damageView='+encodeURIComponent(+id));
  }

  const tent=tents?.[task.tent_id];
  const booking=(bookings||[]).find(row=>+row.id===+task.booking_id);
  const done=task.status==='completed';
  const canEdit=damageCanEditV310(task);
  const hasPhoto=typeof damagePhotoIds!=='undefined'&&damagePhotoIds.has(+id);

  document.querySelectorAll('.nav .btn').forEach(button=>button.classList.remove('active'));

  app.innerHTML=`
    <section class="card damage-overview-v310">
      <div class="row">
        <button class="btn submenu-back" onclick="closeWorkshopDamageOverview()">${uiIcon('chevronLeft')} Tilbage</button>
        <div class="row" style="justify-content:flex-end;flex-wrap:wrap">
          ${canEdit?`<button class="btn" onclick="editWorkshopDamage(${+id})">${uiIcon('edit')} Redigér skade</button>`:''}
          <button class="btn ${done?'':'primary'}" onclick="toggleWorkshopTask(${+id},${done})">${uiIcon(done?'refresh':'check')} ${done?'Genåbn':'Markér udført'}</button>
        </div>
      </div>
      <div class="detail-title">
        <span class="warehouse-item-icon">${uiIcon('scissors')}</span>
        <div>
          <span class="small muted">${done?'AFSLUTTET SKADE':'SKADE TIL SYSTUEN'}</span>
          <h2>${esc(task.tent_name||tent?.name||'Skade')}</h2>
        </div>
      </div>
      ${task.description?`<p style="white-space:pre-wrap">${esc(task.description)}</p>`:''}
      <div class="workshop-task-meta">
        ${task.created_at?`<span>Oprettet ${esc(workshopDate(task.created_at))}</span>`:''}
        ${task.created_by_employee_name?`<span>af ${esc(task.created_by_employee_name)}</span>`:''}
        ${task.booking_name?`<span>fra ${esc(task.booking_name)}</span>`:''}
      </div>
      ${done&&task.completion_note?`<div class="small" style="margin-top:12px"><b>Udført:</b> ${esc(task.completion_note)}</div>`:''}
      ${done&&task.completed_by_employee_name?`<div class="small muted" style="margin-top:4px">Tjekket af ${esc(task.completed_by_employee_name)}${task.completed_at?' · '+esc(workshopDate(task.completed_at)):''}</div>`:''}
    </section>

    <section class="card">
      <h3>Relateret</h3>
      <div class="row damage-related-actions-v310" style="justify-content:flex-start;flex-wrap:wrap">
        ${task.tent_id?`<button class="btn" onclick="openTent(${+task.tent_id})">${uiIcon('tent')} Åbn telt</button>`:''}
        ${booking?`<button class="btn" onclick="viewOrder(bookings.find(b=>+b.id===${+booking.id}))">${uiIcon('calendar')} Åbn job</button>`:''}
      </div>
      ${!task.tent_id&&!booking?'<p class="muted">Skaden er ikke knyttet til et telt eller job.</p>':''}
    </section>

    ${hasPhoto?`<section class="card"><h3>Skadebillede</h3><button class="btn" onclick="openDamagePhoto(${+id})">${uiIcon('eye')} Se skadebillede</button></section>`:''}
  `;
};

// Calendar chips must open the damage itself, never the tent.
window.openWorkshopTaskFromCalendarV120=function(id){
  return window.openWorkshopDamageOverview(+id);
};

// Deep-link support for back/forward and refreshed damage overviews.
const routeBeforeDamageV310=window.route;
window.route=function(){
  const params=new URLSearchParams(location.search);
  const damageView=+params.get('damageView')||0;
  if(damageView)return window.openWorkshopDamageOverview(damageView,true);
  return routeBeforeDamageV310.apply(this,arguments);
};

if(!document.getElementById('pala-damage-overview-v310-style')){
  const style=document.createElement('style');
  style.id='pala-damage-overview-v310-style';
  style.textContent=`
    .calendar-damage-card-v310{cursor:pointer}
    .calendar-damage-card-v310:focus-visible{outline:2px solid rgba(44,94,160,.3);outline-offset:2px}
    .calendar-damage-open-v310{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:8px;font-size:10px;font-weight:750;color:#617187}
    .calendar-damage-open-v310 .ui-icon{width:13px;height:13px}
    .damage-related-actions-v310{gap:8px}
  `;
  document.head.appendChild(style);
}
})();
