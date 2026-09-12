-- PALA v123 · samlet kalender og rollebaseret ordrestatus
-- Tillader alle gyldige medarbejdersessioner at skifte en ordre mellem På lager og Ude.
-- Afsluttet er fortsat kun en adminhandling via den eksisterende admin_set_booking_status-funktion.

begin;

create or replace function public.employee_set_booking_status(
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
  v_employee record;
  v_status text := btrim(coalesce(p_status,''));
begin
  select * into v_employee from public.pala_session_employee(p_token) limit 1;
  if v_employee.employee_id is null then
    raise exception 'Gyldigt medarbejderlogin kræves';
  end if;

  if v_status not in ('På lager','Ude') then
    raise exception 'Medarbejdere kan kun vælge På lager eller Ude';
  end if;

  update public.bookings
     set status = v_status,
         updated_at = now()
   where id = p_booking_id;

  if not found then
    raise exception 'Ordren findes ikke';
  end if;
end;
$$;

grant execute on function public.employee_set_booking_status(text,bigint,text) to anon, authenticated;

commit;
