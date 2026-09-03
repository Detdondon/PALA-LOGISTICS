-- PALA v84: gør inventarkataloget læsbart for appen uden at åbne for skrivning.
-- Kør én gang i Supabase SQL Editor for projektet ywrkaiezqtgpckfxkgru.

begin;

create or replace function public.inventory_catalog_v1()
returns setof public.inventory
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select inventory.*
  from public.inventory
  order by coalesce(inventory.category, ''), inventory.name, inventory.id;
$$;

revoke all on function public.inventory_catalog_v1() from public;
grant execute on function public.inventory_catalog_v1() to anon, authenticated;

commit;
