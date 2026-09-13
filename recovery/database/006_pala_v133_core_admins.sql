-- PALA v133 · faste kerneadministratorer
-- Sikrer at Lukas (id 3), Emil (id 1) og Miranda (id 2) altid har adminadgang.

begin;

-- Sikkerhedstjek: stop hvis de historiske medarbejder-ID'er ikke matcher.
do $$
begin
  if not exists (select 1 from public.employees where id = 1 and lower(btrim(name)) = 'emil') then
    raise exception 'PALA v133: medarbejder id 1 er ikke Emil';
  end if;
  if not exists (select 1 from public.employees where id = 2 and lower(btrim(name)) = 'miranda') then
    raise exception 'PALA v133: medarbejder id 2 er ikke Miranda';
  end if;
  if not exists (select 1 from public.employees where id = 3 and lower(btrim(name)) = 'lukas') then
    raise exception 'PALA v133: medarbejder id 3 er ikke Lukas';
  end if;
end
$$;

-- Kun de tre faste kerneadministratorer skal være admins.
update public.employees
set is_admin = (id in (1,2,3)),
    updated_at = now();

-- Beskyt de tre mod utilsigtet demotion ved senere medarbejderopdateringer.
create or replace function public.pala_protect_core_admins()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.id in (1,2,3) then
    new.is_admin := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pala_protect_core_admins on public.employees;
create trigger trg_pala_protect_core_admins
before insert or update on public.employees
for each row
execute function public.pala_protect_core_admins();

commit;
