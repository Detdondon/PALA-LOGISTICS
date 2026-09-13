from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = 'PALA v135 · non-admin calendar starts on staffing'
if marker in text:
    raise SystemExit('PALA v135 already present')

# Update only the visible/runtime version badge; keep historical v134 function names intact.
text = text.replace('<span class="app-version" hidden>v134</span>', '<span class="app-version" hidden>v135</span>')
text = text.replace("document.querySelector('.app-version').textContent='v134';", "document.querySelector('.app-version').textContent='v135';", 1)
text = text.replace("badge.textContent='v134';", "badge.textContent='v135';", 1)

needle = '\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch = r'''

/* PALA v135 · non-admin calendar starts on staffing */
function applyNonAdminCalendarDefaultV135(){
  if(!isEmployeeLoggedIn()||employeeIsAdmin)return false;
  mainCalendarTypeFilterV120='staffing';
  mainCalendarStatusFilterV123='all';
  calendarViewMode='calendar';
  localStorage.setItem('pala_calendar_type_filter','staffing');
  localStorage.setItem('pala_calendar_status_filter','all');
  localStorage.setItem('pala_calendar_view','calendar');
  return true;
}

// A fresh app/page session for a normal employee always starts on staffing.
if(isEmployeeLoggedIn()&&!employeeIsAdmin){
  applyNonAdminCalendarDefaultV135();
  sessionStorage.setItem('pala_non_admin_calendar_default_v135',String(employeeId||''));
}

// A fresh login in the same page gets the same default once, without
// overwriting a user's explicit Orders/Workshop selection afterwards.
const saveEmployeeSessionV135Base=saveEmployeeSession;
saveEmployeeSession=function(row){
  let result=saveEmployeeSessionV135Base.apply(this,arguments);
  let key=String(employeeId||'');
  if(employeeToken&&!employeeIsAdmin&&sessionStorage.getItem('pala_non_admin_calendar_default_v135')!==key){
    applyNonAdminCalendarDefaultV135();
    sessionStorage.setItem('pala_non_admin_calendar_default_v135',key);
  }
  return result;
};

const clearEmployeeSessionV135Base=clearEmployeeSession;
clearEmployeeSession=function(){
  sessionStorage.removeItem('pala_non_admin_calendar_default_v135');
  return clearEmployeeSessionV135Base.apply(this,arguments);
};

// Returning to Calendar from the bottom navigation counts as opening the
// calendar again: normal employees land on staffing; admins keep their filter.
const openCalendarDefaultV135Base=openCalendarDefaultV134;
openCalendarDefaultV134=function(){
  if(isEmployeeLoggedIn()&&!employeeIsAdmin)applyNonAdminCalendarDefaultV135();
  return openCalendarDefaultV135Base.apply(this,arguments);
};

// v134 owns badge visibility; only update the current release text.
const syncVersionBadgeV135Base=syncVersionBadgeV134;
syncVersionBadgeV134=function(){
  let result=syncVersionBadgeV135Base.apply(this,arguments);
  let badge=document.querySelector('.app-version');
  if(badge)badge.textContent='v135';
  return result;
};
'''

path.write_text(text.replace(needle, patch + needle, 1), encoding='utf-8')
