from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = 'PALA v134 · calendar defaults and admin-only version badge'
if marker in text:
    raise SystemExit('PALA v134 already present')

old_init = "calendarViewMode=localStorage.getItem('pala_calendar_view')==='list'?'list':'calendar'"
if old_init not in text:
    raise SystemExit('calendarViewMode initializer not found')
text = text.replace(old_init, "calendarViewMode='calendar'", 1)

old_header = '<span class="app-version">v107</span>'
if old_header not in text:
    raise SystemExit('static version badge not found')
text = text.replace(old_header, '<span class="app-version" hidden>v134</span>', 1)

old_brand = "<span class=\"app-version\">v107</span>"
if old_brand not in text:
    raise SystemExit('runtime version badge not found')
text = text.replace(old_brand, "<span class=\"app-version\" hidden>v134</span>", 1)

old_version_set = "document.querySelector('.app-version').textContent='v107';"
if old_version_set not in text:
    raise SystemExit('version text setter not found')
text = text.replace(old_version_set, "document.querySelector('.app-version').textContent='v134';", 1)

needle = '\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch = r'''

/* PALA v134 · calendar defaults and admin-only version badge */
localStorage.setItem('pala_calendar_view','calendar');
calendarViewMode='calendar';

function openCalendarDefaultV134(){
  calendarViewMode='calendar';
  localStorage.setItem('pala_calendar_view','calendar');
  return showCalendar();
}

function syncVersionBadgeV134(){
  let badge=document.querySelector('.app-version');
  if(!badge)return;
  badge.textContent='v134';
  let visible=!!(employeeIsAdmin&&adminModeEnabled);
  badge.hidden=!visible;
  badge.style.display=visible?'inline-flex':'none';
}

const ensureUnifiedNavV134Base=ensureUnifiedNavV123;
ensureUnifiedNavV123=function(){
  let result=ensureUnifiedNavV134Base.apply(this,arguments);
  let calendarButton=document.getElementById('nc');
  if(calendarButton)calendarButton.setAttribute('onclick','openCalendarDefaultV134()');
  return result;
};

const syncLoginUiV134Base=syncLoginUi;
syncLoginUi=function(){
  let result=syncLoginUiV134Base.apply(this,arguments);
  syncVersionBadgeV134();
  return result;
};
'''

path.write_text(text.replace(needle, patch + needle, 1), encoding='utf-8')
