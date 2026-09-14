-- PALA v183 · Lagerstruktur
-- Fire faste hovedkategorier, underkategorier, universel placering, teltkoblinger
-- og faste pakkeregler for Pløkker/Sidestænger.

alter table public.pala_warehouse_categories
  drop constraint if exists pala_warehouse_categories_kind_check;
alter table public.pala_warehouse_categories
  add constraint pala_warehouse_categories_kind_check
  check (kind = any (array['tent'::text,'hardware'::text,'inventory'::text,'other'::text]));
alter table public.pala_warehouse_categories
  add column if not exists sort_order integer not null default 0;
alter table public.tents
  add column if not exists compatible_tent_ids bigint[] not null default '{}'::bigint[];

insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
select 'tent','Telte',null,10
where not exists (select 1 from public.pala_warehouse_categories where kind='tent' and parent_id is null and lower(name)=lower('Telte'));
insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
select 'hardware','Hardware',null,20
where not exists (select 1 from public.pala_warehouse_categories where kind='hardware' and parent_id is null and lower(name)=lower('Hardware'));
insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
select 'inventory','Inventar',null,30
where not exists (select 1 from public.pala_warehouse_categories where kind='inventory' and parent_id is null and lower(name)=lower('Inventar'));
insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
select 'other','Øvrigt',null,40
where not exists (select 1 from public.pala_warehouse_categories where kind='other' and parent_id is null and lower(name)=lower('Øvrigt'));

update public.pala_warehouse_categories
set sort_order=case kind when 'tent' then 10 when 'hardware' then 20 when 'inventory' then 30 when 'other' then 40 else sort_order end
where parent_id is null and (
  (kind='tent' and lower(name)=lower('Telte')) or
  (kind='hardware' and lower(name)=lower('Hardware')) or
  (kind='inventory' and lower(name)=lower('Inventar')) or
  (kind='other' and lower(name)=lower('Øvrigt'))
);

do $seed_categories$
declare v_tent_root bigint; v_hardware_root bigint; v_inventory_root bigint; v_master bigint;
begin
  select id into v_tent_root from public.pala_warehouse_categories where kind='tent' and parent_id is null and lower(name)=lower('Telte') order by id limit 1;
  select id into v_hardware_root from public.pala_warehouse_categories where kind='hardware' and parent_id is null and lower(name)=lower('Hardware') order by id limit 1;
  select id into v_inventory_root from public.pala_warehouse_categories where kind='inventory' and parent_id is null and lower(name)=lower('Inventar') order by id limit 1;

  update public.pala_warehouse_categories set parent_id=v_hardware_root,sort_order=10 where kind='hardware' and lower(name)=lower('Master') and id<>v_hardware_root;
  update public.pala_warehouse_categories set parent_id=v_hardware_root,sort_order=20 where kind='hardware' and lower(name)=lower('Rigge') and id<>v_hardware_root;
  update public.pala_warehouse_categories set parent_id=v_inventory_root,sort_order=10 where kind='inventory' and lower(name)=lower('Gulv') and id<>v_inventory_root;

  insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
  select 'tent',x.name,v_tent_root,x.ord from (values ('Stødtelte',10),('Hejsetelte',20),('Sidesejl',30)) x(name,ord)
  where not exists (select 1 from public.pala_warehouse_categories c where c.kind='tent' and c.parent_id=v_tent_root and lower(c.name)=lower(x.name));

  insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
  select 'hardware',x.name,v_hardware_root,x.ord from (values ('Master',10),('Rigge',20),('Spacial',30)) x(name,ord)
  where not exists (select 1 from public.pala_warehouse_categories c where c.kind='hardware' and c.parent_id=v_hardware_root and lower(c.name)=lower(x.name));

  select id into v_master from public.pala_warehouse_categories where kind='hardware' and parent_id=v_hardware_root and lower(name)=lower('Master') order by id limit 1;
  insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
  select 'hardware',x.name,v_master,x.ord from (values ('Stødmaster',10),('Hejsemaster',20),('Spacialmaster',30)) x(name,ord)
  where not exists (select 1 from public.pala_warehouse_categories c where c.kind='hardware' and c.parent_id=v_master and lower(c.name)=lower(x.name));

  insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order)
  select 'inventory',x.name,v_inventory_root,x.ord
  from (values ('Gulv',10),('Borde',20),('Stole',30),('Lyskæder',40),('Brand og Sikkerhed',50),('Varme',60)) x(name,ord)
  where not exists (select 1 from public.pala_warehouse_categories c where c.kind='inventory' and c.parent_id=v_inventory_root and lower(c.name)=lower(x.name));
end
$seed_categories$;

do $classify$
declare
  v_tent_root bigint; v_tent_stod bigint; v_tent_hejse bigint; v_tent_sides bigint;
  v_hw_root bigint; v_hw_master bigint; v_hw_stod bigint; v_hw_hejse bigint; v_hw_specialmaster bigint; v_hw_rigge bigint; v_hw_special bigint;
  v_inv_root bigint; v_inv_gulv bigint; v_inv_borde bigint; v_inv_stole bigint; v_inv_lys bigint; v_inv_brand bigint; v_inv_varme bigint;
  v_other bigint;
begin
  select id into v_tent_root from public.pala_warehouse_categories where kind='tent' and parent_id is null and lower(name)=lower('Telte') order by id limit 1;
  select id into v_tent_stod from public.pala_warehouse_categories where kind='tent' and parent_id=v_tent_root and lower(name)=lower('Stødtelte') order by id limit 1;
  select id into v_tent_hejse from public.pala_warehouse_categories where kind='tent' and parent_id=v_tent_root and lower(name)=lower('Hejsetelte') order by id limit 1;
  select id into v_tent_sides from public.pala_warehouse_categories where kind='tent' and parent_id=v_tent_root and lower(name)=lower('Sidesejl') order by id limit 1;
  select id into v_hw_root from public.pala_warehouse_categories where kind='hardware' and parent_id is null and lower(name)=lower('Hardware') order by id limit 1;
  select id into v_hw_master from public.pala_warehouse_categories where kind='hardware' and parent_id=v_hw_root and lower(name)=lower('Master') order by id limit 1;
  select id into v_hw_stod from public.pala_warehouse_categories where kind='hardware' and parent_id=v_hw_master and lower(name)=lower('Stødmaster') order by id limit 1;
  select id into v_hw_hejse from public.pala_warehouse_categories where kind='hardware' and parent_id=v_hw_master and lower(name)=lower('Hejsemaster') order by id limit 1;
  select id into v_hw_specialmaster from public.pala_warehouse_categories where kind='hardware' and parent_id=v_hw_master and lower(name)=lower('Spacialmaster') order by id limit 1;
  select id into v_hw_rigge from public.pala_warehouse_categories where kind='hardware' and parent_id=v_hw_root and lower(name)=lower('Rigge') order by id limit 1;
  select id into v_hw_special from public.pala_warehouse_categories where kind='hardware' and parent_id=v_hw_root and lower(name)=lower('Spacial') order by id limit 1;
  select id into v_inv_root from public.pala_warehouse_categories where kind='inventory' and parent_id is null and lower(name)=lower('Inventar') order by id limit 1;
  select id into v_inv_gulv from public.pala_warehouse_categories where kind='inventory' and parent_id=v_inv_root and lower(name)=lower('Gulv') order by id limit 1;
  select id into v_inv_borde from public.pala_warehouse_categories where kind='inventory' and parent_id=v_inv_root and lower(name)=lower('Borde') order by id limit 1;
  select id into v_inv_stole from public.pala_warehouse_categories where kind='inventory' and parent_id=v_inv_root and lower(name)=lower('Stole') order by id limit 1;
  select id into v_inv_lys from public.pala_warehouse_categories where kind='inventory' and parent_id=v_inv_root and lower(name)=lower('Lyskæder') order by id limit 1;
  select id into v_inv_brand from public.pala_warehouse_categories where kind='inventory' and parent_id=v_inv_root and lower(name)=lower('Brand og Sikkerhed') order by id limit 1;
  select id into v_inv_varme from public.pala_warehouse_categories where kind='inventory' and parent_id=v_inv_root and lower(name)=lower('Varme') order by id limit 1;
  select id into v_other from public.pala_warehouse_categories where kind='other' and parent_id is null and lower(name)=lower('Øvrigt') order by id limit 1;

  update public.tents t set category_id=case
    when exists (select 1 from public.hardware h where h.tent_id=t.id and lower(h.name) like '%hejse%') then v_tent_hejse
    when exists (select 1 from public.hardware h where h.tent_id=t.id and (lower(h.name) like '%stød%' or lower(h.name)='mast')) then v_tent_stod
    else v_other end;
  update public.tents set category_id=v_tent_stod where lower(name)=lower('Hofdame');
  update public.tents set category_id=v_tent_hejse where parent_tent_id in (select id from public.tents where category_id=v_tent_hejse);

  update public.pala_hardware_catalog h set
    category_id=case
      when lower(btrim(h.name)) in (lower('Pløkker'),lower('Sidestænger')) then v_hw_root
      when lower(h.name) like '%stødmast%' then v_hw_stod
      when lower(h.name) like '%hejsemast%' then v_hw_hejse
      when lower(h.name) like '%mast%' then v_hw_specialmaster
      when lower(h.name) like '%truss%' or lower(h.name) like '%rigkasse%' or lower(h.category)=lower('Rigge') then v_hw_rigge
      when lower(h.name)=lower('Vejrhane') or h.is_special then v_hw_special
      when lower(h.name)=lower('Sidesejl') then v_tent_sides
      else v_other end,
    category=case
      when lower(btrim(h.name)) in (lower('Pløkker'),lower('Sidestænger')) then 'Hardware'
      when lower(h.name) like '%stødmast%' then 'Stødmaster'
      when lower(h.name) like '%hejsemast%' then 'Hejsemaster'
      when lower(h.name) like '%mast%' then 'Spacialmaster'
      when lower(h.name) like '%truss%' or lower(h.name) like '%rigkasse%' or lower(h.category)=lower('Rigge') then 'Rigge'
      when lower(h.name)=lower('Vejrhane') or h.is_special then 'Spacial'
      when lower(h.name)=lower('Sidesejl') then 'Sidesejl'
      else 'Øvrigt' end;

  update public.inventory i set category_id=case
    when lower(i.name) like '%gulv%' then v_inv_gulv
    when lower(i.name) like '%bord%' then v_inv_borde
    when lower(i.name) like '%stol%' then v_inv_stole
    when lower(i.name) like '%lyskæ%' then v_inv_lys
    when lower(i.name) like '%brand%' or lower(i.name) like '%sikker%' then v_inv_brand
    when lower(i.name) like '%varme%' or lower(i.name) like '%heater%' then v_inv_varme
    else v_other end;

  delete from public.pala_warehouse_categories c
  where c.parent_id is null
    and ((c.kind='hardware' and lower(c.name) in (lower('Pløkker'),lower('Sidestænger'),lower('Øvrigt'))) or (c.kind='inventory' and lower(c.name)=lower('Gulv')))
    and not exists (select 1 from public.tents t where t.category_id=c.id)
    and not exists (select 1 from public.inventory i where i.category_id=c.id)
    and not exists (select 1 from public.pala_hardware_catalog h where h.category_id=c.id)
    and not exists (select 1 from public.pala_warehouse_categories ch where ch.parent_id=c.id);
end
$classify$;

-- Faste standarddele findes som pakkeregler på alle telte. Manglende gamle mængder sættes
-- bevidst til 0, så en admin kan udfylde det korrekte behov i stedet for at systemet gætter.
insert into public.hardware(tent_id,catalog_id,name,description,qty,packed,category,is_special,material,sort_order)
select t.id,c.id,c.name,'Standard hardware · antal skal angives på teltets pakkebehov',0,0,'Standard hardware',false,'',case when lower(c.name)=lower('Pløkker') then -200 else -190 end
from public.tents t cross join public.pala_hardware_catalog c
where lower(c.name) in (lower('Pløkker'),lower('Sidestænger'))
  and not exists (select 1 from public.hardware h where h.tent_id=t.id and h.catalog_id=c.id);

create or replace function public.admin_save_warehouse_category(p_token text,p_kind text,p_id bigint,p_name text,p_parent_id bigint default null)
returns bigint language plpgsql security definer set search_path='' as $function$
declare v_id bigint; v_name text:=btrim(coalesce(p_name,'')); v_sort integer;
begin
  perform public.pala_v100_employee_id(p_token,true);
  if p_kind not in ('tent','hardware','inventory','other') then raise exception 'Ukendt lagerkategori'; end if;
  if v_name='' then raise exception 'Skriv et kategorinavn'; end if;
  if length(v_name)>80 then raise exception 'Kategorinavnet er for langt'; end if;
  if p_parent_id is not null then
    if not exists(select 1 from public.pala_warehouse_categories c where c.id=p_parent_id and c.kind=p_kind) then raise exception 'Overkategorien findes ikke i denne kategori'; end if;
    if p_id is not null and p_parent_id=p_id then raise exception 'En kategori kan ikke være sin egen underkategori'; end if;
    if p_id is not null and exists(with recursive descendants as (select c.id from public.pala_warehouse_categories c where c.parent_id=p_id union all select c.id from public.pala_warehouse_categories c join descendants d on c.parent_id=d.id) select 1 from descendants where id=p_parent_id) then raise exception 'En kategori kan ikke flyttes ind under sin egen underkategori'; end if;
  end if;
  if exists(select 1 from public.pala_warehouse_categories c where c.kind=p_kind and lower(c.name)=lower(v_name) and c.parent_id is not distinct from p_parent_id and (p_id is null or c.id<>p_id)) then raise exception 'Der findes allerede en kategori med dette navn på samme niveau'; end if;
  if p_id is null then
    select coalesce(max(c.sort_order),0)+10 into v_sort from public.pala_warehouse_categories c where c.kind=p_kind and c.parent_id is not distinct from p_parent_id;
    insert into public.pala_warehouse_categories(kind,name,parent_id,sort_order) values(p_kind,v_name,p_parent_id,v_sort) returning id into v_id;
  else
    update public.pala_warehouse_categories c set name=v_name,parent_id=p_parent_id,updated_at=now() where c.id=p_id and c.kind=p_kind returning c.id into v_id;
    if v_id is null then raise exception 'Kategorien findes ikke'; end if;
  end if;
  return v_id;
end $function$;

create or replace function public.admin_save_warehouse_categories(p_token text,p_kind text,p_rows jsonb)
returns void language plpgsql security definer set search_path='' as $function$
declare r jsonb; v_parent bigint;
begin
  perform public.pala_v100_employee_id(p_token,true);
  if p_kind not in ('tent','hardware','inventory','other') or jsonb_typeof(p_rows)<>'array' then raise exception 'Ugyldig kategori'; end if;
  for r in select value from jsonb_array_elements(p_rows) loop
    v_parent:=nullif(r->>'parent_id','')::bigint;
    perform public.admin_save_warehouse_category(p_token,p_kind,nullif(r->>'id','')::bigint,r->>'name',v_parent);
  end loop;
end $function$;

create or replace function public.admin_move_warehouse_items(p_token text,p_kind text,p_ids bigint[],p_category_id bigint)
returns void language plpgsql security definer set search_path='' as $function$
declare n integer; wanted integer; v_category_name text;
begin
  perform public.pala_v100_employee_id(p_token,true);
  select c.name into v_category_name from public.pala_warehouse_categories c where c.id=p_category_id;
  if v_category_name is null then raise exception 'Vælg en gyldig kategori'; end if;
  wanted:=(select count(distinct i) from unnest(coalesce(p_ids,'{}'::bigint[])) i);
  if wanted=0 then raise exception 'Vælg mindst én post'; end if;
  if p_kind='tent' then update public.tents set category_id=p_category_id where id=any(p_ids);
  elsif p_kind='inventory' then update public.inventory set category_id=p_category_id where id=any(p_ids);
  elsif p_kind='hardware' then update public.pala_hardware_catalog set category_id=p_category_id,category=v_category_name where id=any(p_ids);
  else raise exception 'Ukendt lagertype'; end if;
  get diagnostics n=row_count;
  if n<>wanted then raise exception 'En eller flere poster findes ikke'; end if;
end $function$;

create or replace function public.admin_delete_warehouse_category(p_token text,p_id bigint)
returns void language plpgsql security definer set search_path='' as $function$
declare c public.pala_warehouse_categories%rowtype;
begin
  perform public.pala_v100_employee_id(p_token,true);
  select * into c from public.pala_warehouse_categories where id=p_id;
  if c.id is null then raise exception 'Kategorien findes ikke'; end if;
  if c.parent_id is null and ((c.kind='tent' and lower(c.name)=lower('Telte')) or (c.kind='hardware' and lower(c.name)=lower('Hardware')) or (c.kind='inventory' and lower(c.name)=lower('Inventar')) or (c.kind='other' and lower(c.name)=lower('Øvrigt'))) then raise exception 'De fire hovedkategorier kan ikke slettes'; end if;
  if exists(select 1 from public.pala_warehouse_categories x where x.parent_id=c.id) then raise exception 'Flyt eller slet underkategorierne først'; end if;
  if exists(select 1 from public.tents x where x.category_id=c.id) or exists(select 1 from public.inventory x where x.category_id=c.id) or exists(select 1 from public.pala_hardware_catalog x where x.category_id=c.id) then raise exception 'Flyt lagerposterne ud af kategorien først'; end if;
  delete from public.pala_warehouse_categories where id=c.id;
end $function$;

create or replace function public.admin_save_warehouse_record(p_token text,p_kind text,p_id bigint,p_data jsonb)
returns bigint language plpgsql security definer set search_path='' as $function$
declare v_id bigint; v_category bigint;
begin
  perform public.pala_v100_employee_id(p_token,true);
  v_category:=nullif(p_data->>'category_id','')::bigint;
  if v_category is null then
    select c.id into v_category from public.pala_warehouse_categories c where c.parent_id is null and c.kind=case p_kind when 'tent' then 'tent' when 'hardware' then 'hardware' when 'inventory' then 'inventory' else '' end order by c.sort_order,c.id limit 1;
  end if;
  if not exists(select 1 from public.pala_warehouse_categories where id=v_category) then raise exception 'Vælg en gyldig lagerkategori'; end if;
  if p_kind='tent' then v_id:=public.admin_save_tent_basics(p_token,p_id,p_data);
  elsif p_kind='hardware' then v_id:=public.admin_save_catalog_hardware(p_token,p_id,p_data||jsonb_build_object('category','Øvrigt'));
  elsif p_kind='inventory' then v_id:=public.admin_save_inventory_v2(p_token,p_id,'Inventar',p_data->>'name',coalesce(p_data->>'description',''),(p_data->>'quantity_total')::integer,coalesce(p_data->>'image',''));
  else raise exception 'Ukendt lagertype'; end if;
  perform public.admin_move_warehouse_items(p_token,p_kind,array[v_id],v_category);
  return v_id;
end $function$;

create or replace function public.admin_save_tent_basics(p_token text,p_id bigint,p_data jsonb)
returns bigint language plpgsql security definer set search_path='' as $function$
declare v_tent bigint; v_parent bigint; v_links bigint[];
begin
  perform public.pala_v100_employee_id(p_token,true);
  if btrim(coalesce(p_data->>'name',''))='' then raise exception 'Navn mangler'; end if;
  v_parent:=nullif(p_data->>'parent_tent_id','')::bigint;
  if p_data ? 'compatible_tent_ids' then
    if jsonb_typeof(p_data->'compatible_tent_ids')<>'array' then raise exception 'Ugyldige teltkoblinger'; end if;
    select coalesce(array_agg(distinct value::bigint order by value::bigint),'{}'::bigint[]) into v_links from jsonb_array_elements_text(p_data->'compatible_tent_ids');
  elsif p_id is not null then select compatible_tent_ids into v_links from public.tents where id=p_id;
  else v_links:='{}'::bigint[]; end if;
  if p_id is not null then v_links:=array_remove(v_links,p_id); end if;
  if exists(select 1 from unnest(coalesce(v_links,'{}'::bigint[])) x(id) where not exists(select 1 from public.tents t where t.id=x.id)) then raise exception 'Et koblet telt findes ikke'; end if;
  if v_parent=p_id or exists(with recursive ancestors as (select id,parent_tent_id from public.tents where id=v_parent union select t.id,t.parent_tent_id from public.tents t join ancestors a on a.parent_tent_id=t.id) select 1 from ancestors where id=p_id) then raise exception 'Telte kan ikke kobles i en cirkel'; end if;
  if p_id is null then insert into public.tents(name,compatible_tent_ids) values(btrim(p_data->>'name'),coalesce(v_links,'{}'::bigint[])) returning id into v_tent; else v_tent:=p_id; end if;
  update public.tents set name=btrim(p_data->>'name'),description=coalesce(p_data->>'description',''),stock_count=nullif(p_data->>'stock_count','')::integer,area_m2=nullif(p_data->>'area_m2','')::numeric,diameter_m=nullif(p_data->>'diameter_m','')::numeric,length_m=nullif(p_data->>'length_m','')::numeric,width_m=nullif(p_data->>'width_m','')::numeric,side_height_m=nullif(p_data->>'side_height_m','')::numeric,ridge_height_m=nullif(p_data->>'ridge_height_m','')::numeric,parent_tent_id=v_parent,compatible_tent_ids=coalesce(v_links,'{}'::bigint[]) where id=v_tent;
  if not found then raise exception 'Telt findes ikke'; end if;
  if exists(select 1 from public.tents where id=v_tent and (stock_count<0 or area_m2<0 or diameter_m<0 or length_m<0 or width_m<0 or side_height_m<0 or ridge_height_m<0)) then raise exception 'Antal og mål kan ikke være negative'; end if;
  return v_tent;
end $function$;

revoke all on function public.admin_save_warehouse_category(text,text,bigint,text,bigint) from public;
revoke all on function public.admin_save_warehouse_categories(text,text,jsonb) from public;
revoke all on function public.admin_move_warehouse_items(text,text,bigint[],bigint) from public;
revoke all on function public.admin_delete_warehouse_category(text,bigint) from public;
revoke all on function public.admin_save_warehouse_record(text,text,bigint,jsonb) from public;
revoke all on function public.admin_save_tent_basics(text,bigint,jsonb) from public;
grant execute on function public.admin_save_warehouse_category(text,text,bigint,text,bigint) to anon, authenticated;
grant execute on function public.admin_save_warehouse_categories(text,text,jsonb) to anon, authenticated;
grant execute on function public.admin_move_warehouse_items(text,text,bigint[],bigint) to anon, authenticated;
grant execute on function public.admin_delete_warehouse_category(text,bigint) to anon, authenticated;
grant execute on function public.admin_save_warehouse_record(text,text,bigint,jsonb) to anon, authenticated;
grant execute on function public.admin_save_tent_basics(text,bigint,jsonb) to anon, authenticated;
