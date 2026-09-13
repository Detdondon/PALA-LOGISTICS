from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v140 · core admins always retain admin mode access'
if marker in text:
    raise SystemExit('PALA v140 already present')

text=text.replace('<span class="app-version" hidden>v139</span>','<span class="app-version" hidden>v140</span>')

needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch=r'''

/* PALA v140 · core admins always retain admin mode access */
function isCoreAdminV140(id=employeeId){
  return [1,2,3].includes(+id);
}

function enforceCoreAdminSessionV140(){
  if(!employeeToken||!isCoreAdminV140(employeeId))return false;
  employeeIsAdmin=true;
  adminToken=employeeToken;
  adminEmployeeId=employeeId;
  adminEmployeeName=employeeName;
  persistentAuthSet('pala_employee_admin','1');
  persistentAuthSet('pala_admin_token',employeeToken);
  persistentAuthSet('pala_admin_id',String(employeeId));
  persistentAuthSet('pala_admin_name',employeeName||'');
  return true;
}

const saveEmployeeSessionV140Base=saveEmployeeSession;
saveEmployeeSession=function(row){
  let source=row||{};
  let id=+(source.employee_id||employeeId)||0;
  if(isCoreAdminV140(id)&&source.is_admin!==true)source={...source,is_admin:true};
  let result=saveEmployeeSessionV140Base.call(this,source);
  enforceCoreAdminSessionV140();
  return result;
};

const isAdminLoggedInV140Base=isAdminLoggedIn;
isAdminLoggedIn=function(){
  enforceCoreAdminSessionV140();
  return isAdminLoggedInV140Base.apply(this,arguments);
};

const toggleAdminModeV140Base=toggleAdminMode;
toggleAdminMode=async function(enabled){
  enforceCoreAdminSessionV140();
  return toggleAdminModeV140Base.apply(this,arguments);
};

const syncLoginUiV140Base=syncLoginUi;
syncLoginUi=function(){
  enforceCoreAdminSessionV140();
  return syncLoginUiV140Base.apply(this,arguments);
};

isCoreCalendarAdminV137=function(){
  return !!employeeToken&&isCoreAdminV140(employeeId);
};

enforceCoreAdminSessionV140();

const syncVersionBadgeV140Base=syncVersionBadgeV134;
syncVersionBadgeV134=function(){
  let result=syncVersionBadgeV140Base.apply(this,arguments);
  let badge=document.querySelector('.app-version');
  if(badge)badge.textContent='v140';
  return result;
};
'''

path.write_text(text.replace(needle,patch+needle,1),encoding='utf-8')
