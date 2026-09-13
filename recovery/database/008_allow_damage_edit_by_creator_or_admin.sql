-- PALA: redigering af systueskader
-- Kun skadens opretter eller en admin må ændre telt, ordre og beskrivelse.

create or replace function public.employee_update_workshop_task(
  p_token text,
  p_task_id bigint,
  p_tent_id bigint,
  p_booking_id bigint,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_employee_id bigint;
begin
  v_employee_id := public.pala_v100_employee_id(p_token, false);

  if not exists (
    select 1
    from public.tent_workshop_tasks w
    where w.id = p_task_id
      and (
        w.created_by_employee_id = v_employee_id
        or exists (
          select 1 from public.employees e
          where e.id = v_employee_id and e.is_admin is true
        )
      )
  ) then
    raise exception 'Kun opretteren eller en admin kan redigere skaden';
  end if;

  if not exists (select 1 from public.tents t where t.id = p_tent_id) then
    raise exception 'Teltet findes ikke';
  end if;

  if p_booking_id is not null
     and not exists (select 1 from public.bookings b where b.id = p_booking_id) then
    raise exception 'Ordren findes ikke';
  end if;

  if btrim(coalesce(p_description, '')) = '' then
    raise exception 'Beskriv skaden';
  end if;

  update public.tent_workshop_tasks
  set tent_id = p_tent_id,
      booking_id = p_booking_id,
      description = btrim(p_description),
      updated_at = now()
  where id = p_task_id;
end;
$$;

revoke execute on function public.employee_update_workshop_task(text,bigint,bigint,bigint,text) from public;
revoke execute on function public.employee_update_workshop_task(text,bigint,bigint,bigint,text) from anon, authenticated;
grant execute on function public.employee_update_workshop_task(text,bigint,bigint,bigint,text) to anon, authenticated;
