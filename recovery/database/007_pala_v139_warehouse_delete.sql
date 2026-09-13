-- PALA v139 · ens admin-sletning i hele Lager
-- Giver én sikker RPC til telt, hardware og inventar.

create or replace function public.admin_delete_warehouse_record(
  p_token text,
  p_kind text,
  p_id bigint
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kind text := lower(btrim(coalesce(p_kind,'')));
  v_catalog_table text;
  v_legacy_special_id bigint;
  v_deleted integer := 0;
begin
  perform public.pala_v100_employee_id(p_token, true);

  if p_id is null then
    raise exception 'Der mangler et lager-ID.';
  end if;

  if v_kind = 'tent' then
    delete from public.tents where id = p_id;
    get diagnostics v_deleted = row_count;

  elsif v_kind = 'inventory' then
    delete from public.inventory where id = p_id;
    get diagnostics v_deleted = row_count;

  elsif v_kind = 'hardware' then
    -- Find det nuværende fælles hardwarekatalog uden at låse migrationen
    -- til et historisk tabelnavn.
    select x.table_name into v_catalog_table
    from (
      select c.table_name
      from information_schema.columns c
      where c.table_schema = 'public'
      group by c.table_name
      having count(*) filter (where c.column_name = 'id') > 0
         and count(*) filter (where c.column_name = 'name') > 0
         and count(*) filter (where c.column_name = 'quantity_total') > 0
         and count(*) filter (where c.column_name = 'is_special') > 0
    ) x
    order by case x.table_name
      when 'hardware_catalog' then 0
      when 'warehouse_hardware_catalog' then 1
      when 'catalog_hardware' then 2
      else 10
    end, x.table_name
    limit 1;

    if v_catalog_table is null then
      raise exception 'Fælles hardwarekatalog blev ikke fundet.';
    end if;

    -- Pakkeregler på telte må ikke efterlade referencer til slettet hardware.
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='hardware' and column_name='catalog_id'
    ) then
      execute 'delete from public.hardware where catalog_id = $1' using p_id;
    end if;

    -- Bevar kompatibilitet med ældre specialhardware-data.
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=v_catalog_table and column_name='legacy_special_id'
    ) then
      execute format('select legacy_special_id from public.%I where id = $1', v_catalog_table)
        into v_legacy_special_id using p_id;
    end if;

    execute format('delete from public.%I where id = $1', v_catalog_table) using p_id;
    get diagnostics v_deleted = row_count;

    if v_legacy_special_id is not null and to_regclass('public.special_hardware') is not null then
      delete from public.special_hardware where id = v_legacy_special_id;
    end if;

  else
    raise exception 'Ukendt lagertype: %', p_kind;
  end if;

  if v_deleted = 0 then
    raise exception 'Lagerposten findes ikke længere.';
  end if;
end;
$$;

revoke all on function public.admin_delete_warehouse_record(text,text,bigint) from public;
grant execute on function public.admin_delete_warehouse_record(text,text,bigint) to anon, authenticated;
