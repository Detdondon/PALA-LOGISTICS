// PALA systue: redigering/sletning af skade for admin eller skadens opretter.
(() => {
  const baseWorkshopTaskCard = workshopTaskCard;

  function canEditWorkshopDamage(task) {
    return isAdminLoggedIn() || +task.created_by_employee_id === +employeeId;
  }

  workshopTaskCard = function(task) {
    const html = baseWorkshopTaskCard(task);
    if (!canEditWorkshopDamage(task)) return html;
    return html.replace(
      '<div class="workshop-task-actions">',
      `<div class="workshop-task-actions"><button class="btn" onclick="editWorkshopDamage(${+task.id})">${uiIcon('edit')} Redigér skade</button><button class="btn bad" onclick="deleteWorkshopDamage(${+task.id})">${uiIcon('trash')} Slet skade</button>`
    );
  };

  window.editWorkshopDamage = function(id) {
    const task = workshopTasks.find(x => +x.id === +id);
    if (!task) return alert('Skaden findes ikke.');
    if (!canEditWorkshopDamage(task)) return alert('Kun opretteren eller en admin kan redigere skaden.');

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
       <div class="sheet-field"><label for="editDamageDescription">Beskrivelse</label><textarea id="editDamageDescription" required>${esc(task.description || '')}</textarea></div>`,
      async () => {
        const tentId = +document.getElementById('editDamageTent')?.value;
        const bookingId = +document.getElementById('editDamageBooking')?.value || null;
        const description = document.getElementById('editDamageDescription')?.value.trim();
        if (!tentId || !description) throw new Error('Vælg telt og beskriv skaden.');

        await checkedRpc('employee_update_workshop_task', {
          p_token: employeeToken,
          p_task_id: +id,
          p_tent_id: tentId,
          p_booking_id: bookingId,
          p_description: description
        });
        await loadWorkshopData();
        await route();
      },
      'Gem skade'
    );
  };

  window.deleteWorkshopDamage = async function(id) {
    const task = workshopTasks.find(x => +x.id === +id);
    if (!task) return alert('Skaden findes ikke.');
    if (!canEditWorkshopDamage(task)) return alert('Kun opretteren eller en admin kan slette skaden.');
    if (!confirm('Slet skaden permanent? Et eventuelt skadebillede slettes også.')) return;

    try {
      await checkedRpc('employee_delete_workshop_task', {
        p_token: employeeToken,
        p_task_id: +id
      });
      if (typeof damagePhotoIds !== 'undefined') damagePhotoIds.delete(+id);
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
