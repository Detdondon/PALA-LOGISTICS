from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v137 · core admins start calendar on all'
if marker in text:
    raise SystemExit('PALA v137 already present')

# Current visible version only; historical patch markers/function names stay unchanged.
text=text.replace('<span class="app-version" hidden>v136</span>','<span class="app-version" hidden>v137</span>')
text=text.replace("document.querySelector('.app-version').textContent='v136';","document.querySelector('.app-version').textContent='v137';",1)
text=text.replace("badge.textContent='v136';","badge.textContent='v137';")

needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch=r'''

/* PALA v137 · core admins start calendar on all */
function isCoreCalendarAdminV137(){
  return !!employeeIsAdmin&&[1,2,3].includes(+employeeId);
}

function applyCoreAdminCalendarDefaultV137(){
  if(!isEmployeeLoggedIn()||!isCoreCalendarAdminV137())return false;
  mainCalendarTypeFilterV120='all';
  mainCalendarStatusFilterV123='all';
  calendarViewMode='calendar';
  localStorage.setItem('pala_calendar_type_filter','all');
  localStorage.setItem('pala_calendar_status_filter','all');
  localStorage.setItem('pala_calendar_view','calendar');
  return true;
}

// A fresh app/page start for Lukas, Emil and Miranda always opens the full calendar.
if(isEmployeeLoggedIn()&&isCoreCalendarAdminV137()){
  applyCoreAdminCalendarDefaultV137();
  sessionStorage.setItem('pala_core_admin_calendar_default_v137',String(employeeId||''));
}

// A fresh login in the same page gets the same default once. Explicit filter choices
// after login are left untouched for the rest of the session.
const saveEmployeeSessionV137Base=saveEmployeeSession;
saveEmployeeSession=function(row){
  let result=saveEmployeeSessionV137Base.apply(this,arguments);
  let key=String(employeeId||'');
  if(isCoreCalendarAdminV137()&&sessionStorage.getItem('pala_core_admin_calendar_default_v137')!==key){
    applyCoreAdminCalendarDefaultV137();
    sessionStorage.setItem('pala_core_admin_calendar_default_v137',key);
  }
  return result;
};

const clearEmployeeSessionV137Base=clearEmployeeSession;
clearEmployeeSession=function(){
  sessionStorage.removeItem('pala_core_admin_calendar_default_v137');
  return clearEmployeeSessionV137Base.apply(this,arguments);
};
'''

path.write_text(text.replace(needle,patch+needle,1),encoding='utf-8')
