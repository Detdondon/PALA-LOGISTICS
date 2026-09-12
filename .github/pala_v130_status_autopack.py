from pathlib import Path

index=Path('index.html')
text=index.read_text(encoding='utf-8')
marker='PALA v130 · forespørgsel status and automatic packing on Ude'
if marker in text:
    raise SystemExit('PALA v130 already present')

replacements=[
    ("const STATUS_ORDER=['Planlagt','På lager','Ude','Afsluttet'];", "const STATUS_ORDER=['Planlagt','Forespørgsel','På lager','Ude','Afsluttet'];"),
    ("${['På lager','Ude','Afsluttet'].map(x=>`<option ${jobLocationStatus(b)===x?'selected':''}>${x}</option>`).join('')}", "${['På lager','Forespørgsel','Ude','Afsluttet'].map(x=>`<option ${jobLocationStatus(b)===x?'selected':''}>${x}</option>`).join('')}"),
    ("${['Planlagt','I gang','Afsluttet','Annulleret'].map(s=>`<option ${s===(job?.status||'Planlagt')?'selected':''}>${s}</option>`).join('')}", "${['Forespørgsel','Planlagt','I gang','Afsluttet','Annulleret'].map(s=>`<option ${s===(job?.status||'Planlagt')?'selected':''}>${s}</option>`).join('')}")
]
for old,new in replacements:
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'Expected exactly one occurrence, found {count}: {old[:80]}')
    text=text.replace(old,new,1)

old_try="try{await checkedRpc('admin_save_order_bundle',{p_token:adminToken,p_id:id||null,p_booking:p,p_shift:shift});await reloadData();history.replaceState(null,'',location.pathname);showOrders()}"
new_try="try{let saved=await checkedRpc('admin_save_order_bundle',{p_token:adminToken,p_id:id||null,p_booking:p,p_shift:shift});await reloadData();let savedId=Number(saved?.id??saved??id)||Number(id)||0;if(p.status==='Ude'&&savedId)await markBookingChecklistPackedV130(savedId);history.replaceState(null,'',location.pathname);showOrders()}"
count=text.count(old_try)
if count!=1:
    raise SystemExit(f'Expected one final bundled save block, found {count}')
text=text.replace(old_try,new_try,1)

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
