-- PALA v96 · retter medarbejderlogin, fjerner forsøgsbegrænsning
-- og nulstiller alle aktive og inaktive medarbejderkoder til 4211.

begin;

create or replace function public.employee_login(p_employee_id bigint, p_pin text)
returns table(token text, employee_id bigint, employee_name text, is_admin boolean, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee public.employees%rowtype;
  v_credential public.employee_credentials%rowtype;
  v_token text;
  v_expires timestamptz;
begin
  select e.* into v_employee
  from public.employees e
  where e.id = p_employee_id and e.active = true;

  if v_employee.id is null then return; end if;

  select c.* into v_credential
  from public.employee_credentials c
  where c.employee_id = p_employee_id;

  if v_credential.pin_hash is null
     or extensions.crypt(coalesce(p_pin,''), v_credential.pin_hash) <> v_credential.pin_hash then
    return;
  end if;

  v_token := gen_random_uuid()::text;
  v_expires := now() + interval '30 days';

  insert into public.employee_sessions(token,employee_id,expires_at)
  values(v_token,p_employee_id,v_expires);

  return query
  select v_token, v_employee.id, v_employee.name, v_employee.is_admin, v_expires;
end;
$$;

insert into public.employee_credentials(employee_id,pin_hash,failed_login_attempts,locked_until,updated_at)
select e.id,extensions.crypt('4211',extensions.gen_salt('bf')),0,null,now()
from public.employees e
on conflict(employee_id) do update set
  pin_hash=excluded.pin_hash,
  failed_login_attempts=0,
  locked_until=null,
  updated_at=now();

grant execute on function public.employee_login(bigint,text) to anon,authenticated;

commit;
