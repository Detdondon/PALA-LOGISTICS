from pathlib import Path
import re

controller = Path('calendar-controller.js')
tests = Path('tests/calendar-controller.test.js')
sw = Path('sw.js')
index = Path('index.html')

text = controller.read_text(encoding='utf-8')
marker = 'PALA v159 · open damages always first in lists'
if marker not in text:
    old_sorted = "function sorted(rows){let base=(a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0);if(calendarSortV150==='date_desc')return[...rows].sort((a,b)=>-base(a,b));if(calendarSortV150==='name_asc')return[...rows].sort((a,b)=>cmp(a.name,b.name)||base(a,b));if(calendarSortV150==='name_desc')return[...rows].sort((a,b)=>cmp(b.name,a.name)||base(a,b));if(calendarSortV150==='type')return[...rows].sort((a,b)=>cmp(label(a.k),label(b.k))||base(a,b));if(calendarSortV150==='status')return[...rows].sort((a,b)=>cmp(a.status,b.status)||base(a,b));return[...rows].sort(base)}"
    new_sorted = "/* PALA v159 · open damages always first in lists */\nconst openDamageRow=r=>r?.k==='workshopTask'&&!taskDone(r.r);\nconst openDamageFirst=(a,b)=>Number(openDamageRow(b))-Number(openDamageRow(a));\nfunction sorted(rows){let base=(a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0);if(calendarSortV150==='date_desc')return[...rows].sort((a,b)=>openDamageFirst(a,b)||-base(a,b));if(calendarSortV150==='name_asc')return[...rows].sort((a,b)=>openDamageFirst(a,b)||cmp(a.name,b.name)||base(a,b));if(calendarSortV150==='name_desc')return[...rows].sort((a,b)=>openDamageFirst(a,b)||cmp(b.name,a.name)||base(a,b));if(calendarSortV150==='type')return[...rows].sort((a,b)=>openDamageFirst(a,b)||cmp(label(a.k),label(b.k))||base(a,b));if(calendarSortV150==='status')return[...rows].sort((a,b)=>openDamageFirst(a,b)||cmp(a.status,b.status)||base(a,b));return[...rows].sort((a,b)=>openDamageFirst(a,b)||base(a,b))}"
    if old_sorted not in text:
        raise SystemExit('sorted function not found')
    text = text.replace(old_sorted, new_sorted, 1)

    old_month = "function monthDetailHtml(){let rows=[...entries()].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0));if(!rows.length)return '<p class=\"calendar-empty\">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';let dates=[...new Set(rows.map(r=>r.date))];return dates.map(ds=>`<section class=\"view-list-group\" data-date=\"${ds}\"><h3 class=\"view-list-date\">${listDateHeading(ds)}</h3>${rows.filter(r=>r.date===ds).map(r=>r.html).join('')}</section>`).join('')}"
    new_month = "function monthDetailHtml(){let rows=[...entries()].sort((a,b)=>openDamageFirst(a,b)||a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0));if(!rows.length)return '<p class=\"calendar-empty\">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';let dates=[...new Set(rows.map(r=>r.date))];return dates.map(ds=>`<section class=\"view-list-group\" data-date=\"${ds}\"><h3 class=\"view-list-date\">${listDateHeading(ds)}</h3>${rows.filter(r=>r.date===ds).map(r=>r.html).join('')}</section>`).join('')}"
    if old_month not in text:
        raise SystemExit('month detail function not found')
    text = text.replace(old_month, new_month, 1)
    controller.write_text(text, encoding='utf-8')

# Regression coverage: open damage must be first regardless of its date in both list surfaces.
t = tests.read_text(encoding='utf-8')
reg_marker = 'open damage must be first in normal list regardless of date'
if reg_marker not in t:
    block = r'''

// Open damages must be pinned above all other visible rows, regardless of registration/date.
sandbox.calendarViewMode='list';
sandbox.calDate=new Date(2026,8,15);
sandbox.mainCalendarTypeFilterV120='all';
sandbox.mainCalendarStatusFilterV123='all';
sandbox.bookings=[{id:31,status:'På lager',start_date:'2026-09-01',end_date:'2026-09-01',customer_name:'Tidlig ordre'}];
sandbox.workshopTasks=[
  {id:41,status:'open',description:'Åben skade',range:{start:'2026-09-29',end:'2026-09-29'}},
  {id:42,status:'completed',description:'Afsluttet skade',range:{start:'2026-09-02',end:'2026-09-02'}}
];
sandbox.setCalendarSortV150('date_asc');
host.innerHTML='';
sandbox.renderMainCalendarListV121();
assert.ok(host.innerHTML.indexOf('task-41') < host.innerHTML.indexOf('order-31'),'open damage must be first in normal list regardless of date');
assert.ok(host.innerHTML.indexOf('task-41') < host.innerHTML.indexOf('task-42'),'open damage must be above completed damage');
const prioritizedMonthHtml=sandbox.calendarMonthDetailHtmlV157();
assert.ok(prioritizedMonthHtml.indexOf('task-41') < prioritizedMonthHtml.indexOf('order-31'),'open damage must be first in calendar month detail list regardless of date');
'''
    t = t.replace("\nconsole.log('calendar-controller regression tests passed');", block + "\nconsole.log('calendar-controller regression tests passed');")
    tests.write_text(t, encoding='utf-8')

s = sw.read_text(encoding='utf-8')
s = re.sub(r"const CACHE='pala-v[^']+';", "const CACHE='pala-v159-open-damage-priority';", s, count=1)
s = re.sub(r'calendar-controller\.js\?v=\d+', 'calendar-controller.js?v=9', s)
sw.write_text(s, encoding='utf-8')

idx = index.read_text(encoding='utf-8')
idx = re.sub(r'calendar-controller\.js\?v=\d+', 'calendar-controller.js?v=9', idx)
index.write_text(idx, encoding='utf-8')

if marker not in text:
    raise SystemExit('controller marker missing')
if reg_marker not in t:
    raise SystemExit('regression test missing')
if 'pala-v159-open-damage-priority' not in s or 'calendar-controller.js?v=9' not in s:
    raise SystemExit('version bump failed')
print('Applied v159 open-damage priority')
