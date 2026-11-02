
alter table public.pala_sheet_inquiries
  add column if not exists date_unconfirmed boolean not null default false,
  add column if not exists synced_start_date date,
  add column if not exists synced_end_date date;

create or replace function public.admin_sheet_sync(p_token text, p_rows jsonb)
returns jsonb
language plpgsql security definer
set search_path to 'public','pg_temp'
as $fn$
declare
  v_item record;
  v_existing public.pala_sheet_inquiries%rowtype;
  v_booking_id bigint;
  v_title text;
  v_old_title text;
  v_notes text;
  v_fingerprint text;
  v_customer text;
  v_description text;
  v_month text;
  v_created integer := 0;
  v_updated integer := 0;
  v_unchanged integer := 0;
  v_mismatch integer := 0;
  v_rowcount integer;
begin
  if not exists (
    select 1 from public.pala_session_employee(p_token) s
    where s.employee_id is not null and s.is_admin
  ) then raise exception 'Administratorlogin kræves'; end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array'
    or jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 500
  then raise exception 'Ugyldig import: forventer 1-500 forespørgsler'; end if;

  -- Stop safely if someone inserted rows in Sheets and shifted existing row IDs.
  select count(*) into v_mismatch
  from jsonb_to_recordset(p_rows) as r(source_row integer, customer_name text)
  join public.pala_sheet_inquiries s
    on s.source_sheet_id='1hBILIVPhsCpkTXfnGmpVE7EX7jLQ6MQSqx-KTSBqqiw'
   and s.source_tab_id=567599955 and s.source_row=r.source_row
  where lower(btrim(s.customer_name)) <> lower(btrim(coalesce(r.customer_name,'')));
  if v_mismatch >= 4 then
    raise exception 'Flere rækker i Google-arket har flyttet sig eller skiftet kunde. Import afbrudt uden ændringer.';
  end if;

  for v_item in
    select r.* from jsonb_to_recordset(p_rows) as r(
      source_row integer, source_month text, customer_name text,
      phone text, address text, description text, use_date_text text,
      delivery_date_text text, pickup_date_text text,
      reserved boolean, quote_given boolean, order_sent boolean,
      in_logistics_calendar boolean, start_date date, end_date date,
      date_unconfirmed boolean
    )
    order by r.source_row
  loop
    v_customer := btrim(coalesce(v_item.customer_name,''));
    v_description := btrim(coalesce(v_item.description,''));
    v_month := initcap(btrim(coalesce(v_item.source_month,'')));
    if v_item.source_row is null or v_item.source_row < 4 or v_item.source_row > 2000
       or length(v_customer) < 2 or length(v_customer) > 300
       or v_month not in ('April','Maj','Juni','Juli','August','September','Oktober','November','December')
       or v_item.start_date is null or v_item.end_date is null
       or v_item.end_date < v_item.start_date
       or v_item.start_date < date '2027-01-01' or v_item.end_date > date '2027-12-31'
    then raise exception 'Ugyldig dato eller kunde i række %', v_item.source_row; end if;

    v_title := coalesce(nullif(v_description,''), 'Teltforespørgsel – ' || v_customer);
    if coalesce(v_item.date_unconfirmed,false) then
      if extract(day from v_item.start_date) <> 1 or v_item.end_date <> v_item.start_date then
        raise exception 'Ubekræftet dato i række % skal være den 1. i måneden', v_item.source_row;
      end if;
      v_title := '[Dato ikke bekræftet] ' || v_title;
    end if;
    v_fingerprint := md5(concat_ws(chr(30),
      v_customer, coalesce(v_item.phone,''), coalesce(v_item.address,''),
      v_description, coalesce(v_item.use_date_text,''),
      coalesce(v_item.delivery_date_text,''), coalesce(v_item.pickup_date_text,''),
      coalesce(v_item.reserved,false)::text, coalesce(v_item.quote_given,false)::text,
      coalesce(v_item.order_sent,false)::text,
      coalesce(v_item.in_logistics_calendar,false)::text
    ));

    select * into v_existing from public.pala_sheet_inquiries
    where source_sheet_id='1hBILIVPhsCpkTXfnGmpVE7EX7jLQ6MQSqx-KTSBqqiw'
      and source_tab_id=567599955 and source_row=v_item.source_row
    for update;
    if not found then
      insert into public.pala_sheet_inquiries (
        source_sheet_id,source_tab_id,source_tab_name,source_row,
        source_month,customer_name,phone,address,description,use_date_text,
        delivery_date_text,pickup_date_text,reserved,quote_given,order_sent,
        in_logistics_calendar,source_fingerprint,review_status
      ) values (
        '1hBILIVPhsCpkTXfnGmpVE7EX7jLQ6MQSqx-KTSBqqiw',567599955,'Telt 2027',
        v_item.source_row,v_month,v_customer,coalesce(v_item.phone,''),
        coalesce(v_item.address,''),v_description,coalesce(v_item.use_date_text,''),
        coalesce(v_item.delivery_date_text,''),coalesce(v_item.pickup_date_text,''),
        coalesce(v_item.reserved,false),coalesce(v_item.quote_given,false),
        coalesce(v_item.order_sent,false),coalesce(v_item.in_logistics_calendar,false),
        v_fingerprint,'pending'
      ) returning * into v_existing;
    end if;

    if v_existing.review_status='ignored' then
      v_unchanged := v_unchanged + 1;
      continue;
    end if;

    if v_existing.booking_id is null then
      v_notes := concat_ws(E'\n',
        'Kilde: Google Sheet "Telt 2027", række ' || v_item.source_row,
        'Brugsdato i arket: ' || coalesce(nullif(v_item.use_date_text,''),'ikke angivet'),
        case when coalesce(v_item.date_unconfirmed,false)
          then 'Dato ikke bekræftet – foreløbigt placeret den 1. i måneden' end,
        case when coalesce(v_item.address,'')<>'' then 'Adresse: ' || v_item.address end,
        case when coalesce(v_item.phone,'')<>'' then 'Telefon: ' || v_item.phone end
      );
      insert into public.bookings (
        order_no,customer_name,title,start_date,end_date,
        delivery_date,pickup_date,status,color,notes
      ) values (
        null,v_customer,v_title,v_item.start_date,v_item.end_date,
        null,null,'Forespørgsel','#5B7FBE',v_notes
      ) returning id into v_booking_id;
      v_created := v_created + 1;
    else
      v_booking_id := v_existing.booking_id;
      v_old_title := coalesce(nullif(v_existing.description,''),'Teltforespørgsel – ' || v_existing.customer_name);
      if v_existing.date_unconfirmed then
        v_old_title := '[Dato ikke bekræftet] ' || v_old_title;
      end if;
      if v_fingerprint <> v_existing.source_fingerprint then
        update public.bookings b set
          customer_name=case when b.customer_name=v_existing.customer_name
            then v_customer else b.customer_name end,
          title=case when b.title=v_old_title then v_title else b.title end,
          start_date=case
            when b.start_date=v_existing.synced_start_date
             and b.end_date=v_existing.synced_end_date
             and (not coalesce(v_item.date_unconfirmed,false) or v_existing.date_unconfirmed)
            then v_item.start_date else b.start_date end,
          end_date=case
            when b.start_date=v_existing.synced_start_date
             and b.end_date=v_existing.synced_end_date
             and (not coalesce(v_item.date_unconfirmed,false) or v_existing.date_unconfirmed)
            then v_item.end_date else b.end_date end,
          updated_at=now()
        where b.id=v_booking_id and b.status='Forespørgsel';
        get diagnostics v_rowcount = row_count;
        v_updated := v_updated + v_rowcount;
        if v_rowcount=0 then v_unchanged := v_unchanged + 1; end if;
      else
        v_unchanged := v_unchanged + 1;
      end if;
    end if;

    update public.pala_sheet_inquiries set
      source_month=v_month,customer_name=v_customer,
      phone=coalesce(v_item.phone,''),address=coalesce(v_item.address,''),
      description=v_description,use_date_text=coalesce(v_item.use_date_text,''),
      delivery_date_text=coalesce(v_item.delivery_date_text,''),
      pickup_date_text=coalesce(v_item.pickup_date_text,''),
      reserved=coalesce(v_item.reserved,false),
      quote_given=coalesce(v_item.quote_given,false),
      order_sent=coalesce(v_item.order_sent,false),
      in_logistics_calendar=coalesce(v_item.in_logistics_calendar,false),
      source_fingerprint=v_fingerprint,
      review_status='imported',booking_id=v_booking_id,
      date_unconfirmed=case when coalesce(v_item.date_unconfirmed,false)
        then v_existing.date_unconfirmed or v_existing.booking_id is null else false end,
      synced_start_date=v_item.start_date,
      synced_end_date=v_item.end_date,
      last_seen_at=now(),updated_at=now()
    where id=v_existing.id;
  end loop;
  return jsonb_build_object('created',v_created,'updated',v_updated,'unchanged',v_unchanged);
end;
$fn$;

create or replace function public.admin_sheet_confirm_date(
  p_token text,p_import_id bigint,p_start_date date,p_end_date date
)
returns boolean
language plpgsql security definer
set search_path to 'public','pg_temp'
as $fn$
declare v public.pala_sheet_inquiries%rowtype;
begin
  if not exists (
    select 1 from public.pala_session_employee(p_token) s
    where s.employee_id is not null and s.is_admin
  ) then raise exception 'Administratorlogin kræves'; end if;
  if p_start_date is null or p_end_date is null or p_end_date<p_start_date
     or p_start_date<date '2027-01-01' or p_end_date>date '2027-12-31'
  then raise exception 'Angiv en gyldig brugsperiode i 2027'; end if;
  select * into v from public.pala_sheet_inquiries where id=p_import_id for update;
  if not found or v.booking_id is null or not v.date_unconfirmed then
    raise exception 'Denne forespørgsel afventer ikke datobekræftelse';
  end if;
  update public.bookings
  set start_date=p_start_date,end_date=p_end_date,
      title=regexp_replace(title,'^\[Dato ikke bekræftet\]\s*','','g'),
      updated_at=now()
  where id=v.booking_id;
  if not found then raise exception 'PALA-ordren findes ikke'; end if;
  update public.pala_sheet_inquiries
  set date_unconfirmed=false,synced_start_date=p_start_date,
      synced_end_date=p_end_date,updated_at=now()
  where id=p_import_id;
  return true;
end;
$fn$;

revoke all on function public.admin_sheet_sync(text,jsonb) from public;
revoke all on function public.admin_sheet_confirm_date(text,bigint,date,date) from public;
grant execute on function public.admin_sheet_sync(text,jsonb) to anon,authenticated;
grant execute on function public.admin_sheet_confirm_date(text,bigint,date,date) to anon,authenticated;
