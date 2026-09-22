// PALA v309 · skadeoversigt samler relaterede links; lister holdes kompakte.
(() => {
  'use strict';

  if (window.__palaWorkshopDamageEditorV309) return;
  window.__palaWorkshopDamageEditorV308 = true;

  const baseWorkshopTaskCard = workshopTaskCard;

  function canEditWorkshopDamage(task) {
    return isAdminLoggedIn() || +task.created_by_employee_id === +employeeId;
  }

  // Cards/lists contain only actions for the damage itself. Links to the related
  // tent/order live exclusively on the dedicated damage overview.
  workshopTaskCard = function(task) {
    let html = baseWorkshopTaskCard(task);
    const overviewButton=`<button class="btn" onclick="openWorkshopDamageOverview(${+task.id})">${uiIcon('eye')} Oversigt</button>`;
    const editButton=canEditWorkshopDamage(task)
      ?`<button class="btn" onclick="editWorkshopDamage(${+task.id})">${uiIcon('edit')} Redigér skade</button>`
      :'';
    return html.replace(
      '<div class="workshop-task-actions">',
      `<div class="workshop-task-actions">${overviewButton}${editButton}`
    );
  };

  function damageOverviewReturnQuery() {
    const stored=sessionStorage.getItem('pala_damage_overview_return');
    return stored===null?'':stored;
  }

  window.closeWorkshopDamageOverview=function(){
    const query=damageOverviewReturnQuery();
    sessionStorage.removeItem('pala_damage_overview_return');
    history.replaceState(null,'',location.pathname+query);
    return route();
  };

  window.openWorkshopDamageOverview=function(id,fromRoute=false){
    if(!requireEmployee())return;
    const task=workshopTasks.find(x=>+x.id===+id);
    if(!task)return alert('Skaden findes ikke.');

    if(!fromRoute){
      const current=new URLSearchParams(location.search);
      if(!current.has('damageView'))sessionStorage.setItem('pala_damage_overview_return',location.search||'');
      history.replaceState(null,'',location.pathname+'?damageView='+encodeURIComponent(+id));
    }

    const tent=tents[task.tent_id];
    const booking=bookings.find(b=>+b.id===+task.booking_id);
    const done=task.status==='completed';
    const canEdit=canEditWorkshopDamage(task);
    const hasPhoto=typeof damagePhotoIds!=='undefined'&&damagePhotoIds.has(+id);

    document.querySelectorAll('.nav .btn').forEach(button=>button.classList.remove('active'));
    app.innerHTML=`<section class="card">
      <div class="row">
        <button class="btn submenu-back" onclick="closeWorkshopDamageOverview()">${uiIcon('chevronLeft')} Tilbage</button>
        ${canEdit?`<button class="btn" onclick="editWorkshopDamage(${+id})">${uiIcon('edit')} Redigér skade</button>`:''}
      </div>
      <div class="detail-title">
        <span class="warehouse-item-icon">${uiIcon('scissors')}</span>
        <div><span class="small muted">${done?'AFSLUTTET SKADE':'SKADE TIL SYSTUEN'}</span><h2>${esc(task.tent_name||tent?.name||'Skade')}</h2></div>
      </div>
      <p style="white-space:pre-wrap">${esc(task.description||'')}</p>
      <div class="workshop-task-meta">
        ${task.created_at?`<span>Oprettet ${esc(workshopDate(task.created_at))}</span>`:''}
        ${task.created_by_employee_name?`<span>af ${esc(task.created_by_employee_name)}</span>`:''}
      </div>
      ${done&&task.completion_note?`<div class="small" style="margin-top:12px"><b>Udført:</b> ${esc(task.completion_note)}</div>`:''}
    </section>
    <section class="card">
      <h3>Relateret</h3>
      <div class="row" style="justify-content:flex-start;flex-wrap:wrap">
        ${task.tent_id?`<button class="btn" onclick="openTent(${+task.tent_id})">${uiIcon('tent')} Åbn telt</button>`:''}
        ${booking?`<button class="btn" onclick="viewOrder(bookings.find(b=>+b.id===${+booking.id}))">${uiIcon('calendar')} Åbn job</button>`:''}
      </div>
      ${!task.tent_id&&!booking?'<p class="muted">Skaden er ikke knyttet til et telt eller job.</p>':''}
    </section>
    ${hasPhoto?`<section class="card"><h3>Skadebillede</h3><button class="btn" onclick="openDamagePhoto(${+id})">${uiIcon('eye')} Se skadebillede</button></section>`:''}`;
  };

  const baseRouteV309=window.route;
  window.route=function(){
    const params=new URLSearchParams(location.search);
    const damageView=+params.get('damageView')||0;
    if(damageView)return openWorkshopDamageOverview(damageView,true);
    return baseRouteV309.apply(this,arguments);
  };

  // Calendar damage chips open the damage overview rather than jumping to the tent.
  window.openWorkshopTaskFromCalendarV120=function(id){
    return openWorkshopDamageOverview(+id);
  };

  function addDeleteButtonToDamageSheet(id) {
    const footer = document.querySelector('#palaEditSheet .sheet-footer');
    if (!footer || footer.querySelector('[data-delete-workshop-damage]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn bad';
    button.dataset.deleteWorkshopDamage = String(id);
    button.style.marginRight = 'auto';
    button.innerHTML = `${uiIcon('trash')} Slet skade`;
    button.addEventListener('click', () => deleteWorkshopDamage(id));
    footer.prepend(button);
  }

  window.editWorkshopDamage = function(id) {
    const task = workshopTasks.find(x => +x.id === +id);
    if (!task) return alert('Skaden findes ikke.');
    if (!canEditWorkshopDamage(task)) return alert('Kun opretteren eller en admin kan redigere skaden.');

    const hasPhoto = typeof damagePhotoIds !== 'undefined' && damagePhotoIds.has(+id);

    const tentOptions = Object.values(tents)
      .sort((a, b) => alpha(a.name, b.name))
      .map(t => `<option value="${+t.id}" ${+t.id === +task.tent_id ? 'selected' : ''}>${esc(t.name)}</option>`)
      .join('');

    const bookingOptions = [...bookings]
      .filter(b => b.status !== 'Annulleret')
      .sort((a, b) => String(b.start_date || '').localeCompare(String(a.start_date || '')) || alpha(a.customer_name || a.title, b.customer_name || b.title))
      .map(b => {
        const label = b.customer_name || b.title || b.order_no || `Ordre ${b.id}`;
        return `<option value="${+b.id}" ${+b.id === +task.booking_id ? 'selected' : ''}>${esc(label)}</option>`;
      })
      .join('');

    openEditSheet(
      'Redigér skade',
      `<div class="sheet-field"><label for="editDamageTent">Telt</label><select id="editDamageTent">${tentOptions}</select></div>
       <div class="sheet-field"><label for="editDamageBooking">Ordre <span class="muted">(valgfrit)</span></label><select id="editDamageBooking"><option value="">Ingen ordre</option>${bookingOptions}</select></div>
       <div class="sheet-field"><label for="editDamageDescription">Beskrivelse</label><textarea id="editDamageDescription" required>${esc(task.description || '')}</textarea></div>
       <details class="sheet-group" open>
         <summary>Billede</summary>
         <div class="sheet-field">
           <label for="editDamagePhoto">${hasPhoto ? 'Erstat skadebillede' : 'Tilføj skadebillede'} <span class="muted">(valgfrit)</span></label>
           <input id="editDamagePhoto" type="file" accept="image/*">
           <p class="small muted">${hasPhoto ? 'Skaden har allerede et billede. Vælg et nyt billede her for at erstatte det.' : 'Vælg et foto eller brug kameraet. Billedet gemmes sammen med skaden.'}</p>
         </div>
       </details>`,
      async () => {
        const tentId = +document.getElementById('editDamageTent')?.value;
        const bookingId = +document.getElementById('editDamageBooking')?.value || null;
        const description = document.getElementById('editDamageDescription')?.value.trim();
        const photoFile = document.getElementById('editDamagePhoto')?.files?.[0] || null;
        if (!tentId || !description) throw new Error('Vælg telt og beskriv skaden.');

        await checkedRpc('employee_update_workshop_task', {
          p_token: employeeToken,
          p_task_id: +id,
          p_tent_id: tentId,
          p_booking_id: bookingId,
          p_description: description
        });

        if (photoFile) {
          const image = await readDamagePhoto(photoFile);
          if (!image) throw new Error('Billedet kunne ikke læses.');
          await checkedRpc('employee_save_damage_photo', {
            p_token: employeeToken,
            p_task_id: +id,
            p_image: image
          });
        }

        await Promise.all([
          loadWorkshopData(),
          typeof loadWarehouseExtensions === 'function' ? loadWarehouseExtensions() : Promise.resolve()
        ]);
        await route();
      },
      'Gem skade'
    );

    addDeleteButtonToDamageSheet(+id);
  };

  // Any legacy call to the old standalone photo editor is redirected into
  // the damage editor, so photo changes cannot happen elsewhere.
  window.editDamagePhoto = function(id) {
    return window.editWorkshopDamage(id);
  };

  window.deleteWorkshopDamage = async function(id) {
    const task = workshopTasks.find(x => +x.id === +id);
    if (!task) return alert('Skaden findes ikke.');
    if (!canEditWorkshopDamage(task)) return alert('Kun opretteren eller en admin kan slette skaden.');
    if (!document.getElementById('palaEditSheet')) return alert('Åbn skaden i editoren for at slette den.');
    if (!confirm('Slet skaden permanent? Et eventuelt skadebillede slettes også.')) return;

    try {
      await checkedRpc('employee_delete_workshop_task', {
        p_token: employeeToken,
        p_task_id: +id
      });
      if (typeof damagePhotoIds !== 'undefined') damagePhotoIds.delete(+id);
      closeEditSheet(true);
      await Promise.all([
        loadWorkshopData(),
        typeof loadWarehouseExtensions === 'function' ? loadWarehouseExtensions() : Promise.resolve()
      ]);
      await route();
    } catch (error) {
      alert('Kunne ikke slette skaden: ' + String(error?.message || error));
    }
  };
})();
