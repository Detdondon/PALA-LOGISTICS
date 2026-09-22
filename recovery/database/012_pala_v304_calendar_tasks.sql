-- PALA v304 · calendar meetings + other tasks
-- Adds a shared type field to pala_meetings so the same secure data path can store
-- both meetings and assignable "other tasks" without duplicating calendar storage.

alter table public.pala_meetings
  add column if not exists kind text not null default 'meeting';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname='pala_meetings_kind_check'
      and conrelid='public.pala_meetings'::regclass
  ) then
    alter table public.pala_meetings
      add constraint pala_meetings_kind_check
      check (kind in ('meeting','task'));
  end if;
end $$;

update public.pala_meetings
set kind='meeting'
where kind is null or kind not in ('meeting','task');

create or replace function public.admin_save_meeting(p_token text, p_id bigint, p_data jsonb)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  e bigint;
  m bigint;
  ids bigint[];
  k text;
begin
  e:=public.pala_v100_employee_id(p_token,true);
  ids:=array(
    select distinct value::bigint
    from jsonb_array_elements_text(coalesce(p_data->'employee_ids','[]'::jsonb))
  );

  if exists(
    select 1
    from unnest(ids) i
    where not exists(
      select 1 from public.employees x where x.id=i and x.active
    )
  ) then
    raise exception 'En valgt medarbejder er ikke aktiv';
  end if;

  if p_data ? 'kind' then
    k:=coalesce(nullif(btrim(p_data->>'kind'),''),'meeting');
  elsif p_id is not null then
    select kind into k from public.pala_meetings where id=p_id;
    k:=coalesce(k,'meeting');
  else
    k:='meeting';
  end if;

  if k not in ('meeting','task') then
    raise exception 'Ugyldig kalendertype';
  end if;

  if p_id is null then
    insert into public.pala_meetings(title,start_date,end_date,created_by,kind)
    values(
      btrim(p_data->>'title'),
      (p_data->>'start_date')::date,
      (p_data->>'end_date')::date,
      e,
      k
    )
    returning id into m;
  else
    m:=p_id;
  end if;

  update public.pala_meetings
  set
    kind=k,
    title=btrim(p_data->>'title'),
    start_date=(p_data->>'start_date')::date,
    end_date=(p_data->>'end_date')::date,
    start_time=nullif(p_data->>'start_time','')::time,
    end_time=nullif(p_data->>'end_time','')::time,
    customer_name=coalesce(p_data->>'customer_name',''),
    address=coalesce(p_data->>'address',''),
    notes=coalesce(p_data->>'notes',''),
    employee_ids=ids,
    color=coalesce(p_data->>'color','#5B7FBE'),
    cancelled=coalesce((p_data->>'cancelled')::boolean,false),
    updated_at=now()
  where id=m;

  if not found then
    raise exception 'Kalenderposten findes ikke';
  end if;

  return m;
end
$function$;
