from pathlib import Path

index=Path('index.html')
text=index.read_text(encoding='utf-8')
marker='PALA v130 · forespørgsel status and automatic packing on Ude'
if marker in text:
    raise SystemExit('PALA v130 already present')

pairs=[
    ("const STATUS_ORDER=['På lager','Ude','Afsluttet'];", "const STATUS_ORDER=['På lager','Forespørgsel','Ude','Afsluttet'];"),
    ("['På lager','Ude','Afsluttet'].map(x=>", "['På lager','Forespørgsel','Ude','Afsluttet'].map(x=>"),
    ("['Planlagt','I gang','Afsluttet','Annulleret'].map(s=>", "['Forespørgsel','Planlagt','I gang','Afsluttet','Annulleret'].map(s=>")
]
for old,new in pairs:
    if old not in text:
        raise SystemExit(f'Required target not found: {old}')
    text=text.replace(old,new,1)

needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')
patch=r'''

/* PALA v130 · forespørgsel status and automatic packing on Ude */
async function markBookingChecklistPackedV130(bookingId){
  if(!bookingId||!isEmployeeLoggedIn()||!employeeToken)return false;
  try{
    let tokenResult=await sb.rpc('employee_order_check_token',{p_token:employeeToken,p_booking_id:+bookingId});
    if(tokenResult.error)throw new Error(tokenResult.error.message);
    let list=await sb.rpc('order_checklist_get',{p_access_token:tokenResult.data});
    if(list.error)throw new Error(list.error.message);
    let lines=Array.isArray(list.data?.lines)?list.data.lines:[];
    let pending=lines.filter(line=>(+line.qty_required||0)>0&&(+line.packed_qty||0)<(+line.qty_required||0));
    if(!pending.length)return true;
    let results=await Promise.all(pending.map(line=>sb.rpc('order_checklist_change',{
      p_access_token:tokenResult.data,
      p_line_id:line.id,
      p_phase:'packed',
      p_delta:0,
      p_set_all:true
    })));
    let failed=results.find(result=>result.error);
    if(failed?.error)throw new Error(failed.error.message);
    await refreshWarehouseStatus();
    return true;
  }catch(error){
    alert('Jobbet er sat til Ude, men pakkelisten kunne ikke markeres automatisk som pakket: '+String(error?.message||error));
    return false;
  }
}

const checkedRpcV130Base=checkedRpc;
checkedRpc=async function(name,args){
  let data=await checkedRpcV130Base(name,args);
  if(name==='admin_save_order_bundle'&&args?.p_booking?.status==='Ude'){
    let bookingId=Number(data?.id??data??args?.p_id)||Number(args?.p_id)||0;
    if(bookingId)await markBookingChecklistPackedV130(bookingId);
  }
  return data;
};

const quickSetBookingStatusV130Base=quickSetBookingStatus;
quickSetBookingStatus=async function(id,status){
  let result=await quickSetBookingStatusV130Base(id,status);
  if(status==='Ude'){
    let updated=bookings.find(row=>+row.id===+id);
    if(updated&&jobLocationStatus(updated)==='Ude')await markBookingChecklistPackedV130(+id);
  }
  return result;
};
'''
text=text.replace(needle,patch+needle,1)
index.write_text(text,encoding='utf-8')

migration=Path('recovery/database/005_pala_v130_forespoergsel_status.sql')
if migration.exists():
    raise SystemExit('Migration already exists')
migration.write_text("""-- PALA v130 · Forespørgsel som status for systuejobs\n-- Køres på PALA Supabase efter 003_pala_v100_lager_systue.sql.\n\nalter table public.workshop_jobs\n  drop constraint if exists workshop_jobs_status_check;\n\nalter table public.workshop_jobs\n  add constraint workshop_jobs_status_check\n  check (status in ('Forespørgsel','Planlagt','I gang','Afsluttet','Annulleret'));\n""",encoding='utf-8')
