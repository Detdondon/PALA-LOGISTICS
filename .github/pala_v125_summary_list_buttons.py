from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v125 · summary buttons open filtered list'
if marker in text:
    raise SystemExit('PALA v125 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v125 · summary buttons open filtered list */
function openUnifiedSummaryListV125(type){
  mainCalendarTypeFilterV120=['orders','staffing','workshop'].includes(type)?type:'all';
  mainCalendarStatusFilterV123='all';
  calendarViewMode='list';
  localStorage.setItem('pala_calendar_type_filter',mainCalendarTypeFilterV120);
  localStorage.setItem('pala_calendar_status_filter','all');
  localStorage.setItem('pala_calendar_view','list');
  showCalendar();
}
const applyUnifiedCalendarTopV125Base=applyUnifiedCalendarTopV123;
applyUnifiedCalendarTopV123=function(){
  let result=applyUnifiedCalendarTopV125Base.apply(this,arguments);
  let buttons=[...app.querySelectorAll('.unified-calendar-summary-v123 .reference-button')];
  ['orders','staffing','workshop'].forEach((type,index)=>{
    let button=buttons[index];
    if(button)button.onclick=()=>openUnifiedSummaryListV125(type);
  });
  return result;
};
'''
text=text.replace(needle,patch+needle,1)
path.write_text(text,encoding='utf-8')
