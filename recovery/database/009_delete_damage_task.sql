-- PALA: sletning af systueskader
-- Kun skadens opretter eller en admin må slette. Eventuelt skadebillede ryddes først.

create or replace function public.employee_delete_workshop_task(
  p_token text,
  p_task_id bigint
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
          select 1
          from public.employees e
          where e.id = v_employee_id
            and e.is_admin is true
        )
      )
  ) then
    raise exception 'Kun opretteren eller en admin kan slette skaden';
  end if;

  delete from public.pala_damage_photos where task_id = p_task_id;
  delete from public.tent_workshop_tasks where id = p_task_id;
end;
$$;

revoke execute on function public.employee_delete_workshop_task(text,bigint) from public;
revoke execute on function public.employee_delete_workshop_task(text,bigint) from anon, authenticated;
grant execute on function public.employee_delete_workshop_task(text,bigint) to anon, authenticated;
