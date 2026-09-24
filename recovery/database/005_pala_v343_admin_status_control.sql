-- PALA v343 · adminstatus er altid autoritativ
-- Admin kan ændre ordrestatus uanset dato og uanset om pakkelisten allerede er returneret.
-- Automatisk afslutning sker kun ved en reel returhandling og gemmes fælles i databasen.

begin;

create or replace function public.admin_set_booking_status(
  p_token text,
  p_booking_id bigint,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text := btrim(coalesce(p_status,''));
begin
  perform public.pala_v100_employee_id(p_token,true);

  if v_status not in ('På lager','Forespørgsel','Ude','Afsluttet') then
    raise exception 'Vælg en gyldig jobstatus';
  end if;

  update public.bookings
     set status=v_status,
         updated_at=now()
   where id=p_booking_id;

  if not found then
    raise exception 'Jobbet findes ikke';
  end if;
end;
$$;

grant execute on function public.admin_set_booking_status(text,bigint,text) to anon, authenticated;

create or replace function public.employee_finish_returned_booking(
  p_token text,
  p_booking_id bigint
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee record;
  v_required integer;
  v_pending integer;
begin
  select * into v_employee
  from public.pala_session_employee(p_token)
  limit 1;

  if v_employee.employee_id is null then
    raise exception 'Medarbejderlogin kræves';
  end if;

  if not exists(select 1 from public.bookings where id=p_booking_id) then
    raise exception 'Ordren findes ikke';
  end if;

  select count(*) into v_required
  from public.pala_order_lines(p_booking_id) l
  where coalesce(l.qty_required,0)>0;

  if v_required=0 then
    raise exception 'Ordren har ingen pakkelinjer';
  end if;

  select count(*) into v_pending
  from public.pala_order_lines(p_booking_id) l
  left join public.order_checklist_progress p
    on p.booking_id=p_booking_id
   and p.line_type=l.line_type
   and p.item_id=l.item_id
   and p.parent_tent_id=l.parent_tent_id
  where coalesce(l.qty_required,0)>0
    and coalesce(p.returned_qty,0)<l.qty_required;

  if v_pending>0 then
    raise exception 'Ordren kan først afsluttes automatisk, når alt er returneret';
  end if;

  update public.bookings
     set status='Afsluttet',
         updated_at=now()
   where id=p_booking_id;
end;
$$;

grant execute on function public.employee_finish_returned_booking(text,bigint) to anon, authenticated;

commit;
