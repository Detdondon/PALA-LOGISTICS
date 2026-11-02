
-- Assign calendar colors centrally so the same color is never used for
-- bookings whose start_date/end_date periods overlap (inclusive).
-- Existing user-selected colors are preserved unless they conflict.
create or replace function public.pala_booking_assign_overlap_color()
returns trigger
language plpgsql
security invoker
set search_path to 'pg_catalog','public','pg_temp'
as $fn$
declare
  v_palette text[] := array[
    '#5B7FBE','#C97963','#58A99E','#D2A34E',
    '#9A78B5','#C76F83','#789B68','#62A9B6',
    '#AD8DBF','#CB8C50','#7884AE','#568F87',
    '#B85F5F','#8B746B','#667AAD','#91A866'
  ];
  v_color text;
  v_force_auto boolean;
  v_clashing boolean;
  v_i integer;
begin
  if new.start_date is null or new.end_date is null then
    return new;
  end if;

  -- Also protects simultaneous imports from choosing identical colors.
  perform pg_catalog.pg_advisory_xact_lock(17027, 368);

  v_force_auto :=
    new.color is null
    or pg_catalog.btrim(new.color)=''
    or (tg_op='INSERT' and coalesce(new.notes,'') ilike 'Kilde: Google Sheet "Telt 2027"%');

  if not v_force_auto and coalesce(new.color ~* '^#[0-9a-f]{6}$',false) then
    select exists (
      select 1 from public.bookings b
      where b.id is distinct from new.id
        and b.start_date <= new.end_date
        and b.end_date >= new.start_date
        and pg_catalog.lower(b.color)=pg_catalog.lower(new.color)
    ) into v_clashing;
    if not v_clashing then
      return new;
    end if;
  end if;

  select p.hex into v_color
  from pg_catalog.unnest(v_palette) with ordinality as p(hex,position)
  where not exists (
    select 1 from public.bookings b
    where b.id is distinct from new.id
      and b.start_date <= new.end_date
      and b.end_date >= new.start_date
      and pg_catalog.lower(b.color)=pg_catalog.lower(p.hex)
  )
  order by (
    select count(*) from public.bookings b
    where pg_catalog.lower(b.color)=pg_catalog.lower(p.hex)
  ),p.position
  limit 1;

  if v_color is null then
    -- More than 16 simultaneous orders: still avoid any exact repetition.
    for v_i in 1..10000 loop
      v_color := '#' || pg_catalog.substr(
        pg_catalog.md5(coalesce(new.id::text,'ny ordre')||':'||v_i::text),1,6
      );
      exit when not exists (
        select 1 from public.bookings b
        where b.id is distinct from new.id
          and b.start_date <= new.end_date
          and b.end_date >= new.start_date
          and pg_catalog.lower(b.color)=pg_catalog.lower(v_color)
      );
      v_color := null;
    end loop;
    if v_color is null then
      raise exception 'Der kunne ikke findes en ledig kalenderfarve';
    end if;
  end if;
  new.color := v_color;
  return new;
end;
$fn$;

revoke all on function public.pala_booking_assign_overlap_color() from public,anon,authenticated;

create trigger pala_booking_nonoverlap_color
before insert or update of color,start_date,end_date on public.bookings
for each row execute function public.pala_booking_assign_overlap_color();
