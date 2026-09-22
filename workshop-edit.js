// PALA v308 · skadehandlinger findes kun i skadens editor.
(() => {
  'use strict';

  if (window.__palaWorkshopDamageEditorV308) return;
  window.__palaWorkshopDamageEditorV308 = true;

  const baseWorkshopTaskCard = workshopTaskCard;

  function canEditWorkshopDamage(task) {
    return isAdminLoggedIn() || +task.created_by_employee_id === +employeeId;
  }

  // Outside the editor there is only one mutation entry point: Redigér skade.
  // Delete and add/change image are intentionally not exposed on cards/lists/calendar.
  workshopTaskCard = function(task) {
    const html = baseWorkshopTaskCard(task);
    if (!canEditWorkshopDamage(task)) return html;
    return html.replace(
      '<div class="workshop-task-actions">',
      `<div class="workshop-task-actions"><button class="btn" onclick="editWorkshopDamage(${+task.id})">${uiIcon('edit')} Redigér skade</button>`
    );
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
