from pathlib import Path
import re

controller = Path('calendar-controller.js')
tests = Path('tests/calendar-controller.test.js')
sw = Path('sw.js')
index = Path('index.html')

text = controller.read_text(encoding='utf-8')
marker = 'PALA v157 · full-month detail list + understaffed regression'
if marker not in text:
    needle = 'renderMainCalendarListV121=renderList;\nfunction dayHtml'
    if needle not in text:
        raise SystemExit('controller insertion point not found')
    insert = '''renderMainCalendarListV121=renderList;\n/* PALA v157 · full-month detail list + understaffed regression */\nfunction monthDetailHtml(){let rows=[...entries()].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0));if(!rows.length)return '<p class="calendar-empty">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';let dates=[...new Set(rows.map(r=>r.date))];return dates.map(ds=>`<section class="view-list-group" data-date="${ds}"><h3 class="view-list-date">${listDateHeading(ds)}</h3>${rows.filter(r=>r.date===ds).map(r=>r.html).join('')}</section>`).join('')}\nwindow.calendarMonthDetailHtmlV157=monthDetailHtml;\nfunction dayHtml'''
    text = text.replace(needle, insert, 1)

    old = '<div class="card calendar-day-detail-card"><div><div class="small muted">UGE ${isoWeekNumber(selected)}</div><h2 class="calendar-day-title">${esc(weekdayDateDa(selected))}</h2></div><div class="calendar-detail-list">${dayHtml(selected)}</div></div>'
    new = '<div class="card calendar-day-detail-card"><div><div class="small muted">LISTEVISNING · HELE MÅNEDEN</div><h2 class="calendar-day-title">${esc(heading)}</h2></div><div class="calendar-detail-list">${monthDetailHtml()}</div></div>'
    if old not in text:
        raise SystemExit('calendar detail panel markup not found')
    text = text.replace(old, new, 1)
    controller.write_text(text, encoding='utf-8')

# Regression coverage for the exact bug: staffing + understaffed in the list below the calendar.
t = tests.read_text(encoding='utf-8')
reg_marker = 'understaffed staffing must appear in the full-month detail list'
if reg_marker not in t:
    block = r'''

// Bemanding + Ubemandet must show missing-staff shifts anywhere in the selected month
// in the list shown below the calendar, not only on the selected day.
sandbox.calendarViewMode='calendar';
sandbox.calDate=new Date(2026,8,13);
sandbox.mainCalendarTypeFilterV120='staffing';
sandbox.mainCalendarStatusFilterV123='understaffed';
sandbox.staffingShifts=[
  {id:2,shift_date:'2026-09-24',workers_needed:3,done:false,title:'Mangler folk'},
  {id:1,shift_date:'2026-09-25',workers_needed:1,done:false,title:'Fuldt bemandet'},
  {id:4,shift_date:'2026-10-01',workers_needed:2,done:false,title:'Næste måned'},
  {id:5,shift_date:'2026-09-14',workers_needed:1,done:false,leave:true,title:'Fravær'}
];
const staffingMonthHtml=sandbox.calendarMonthDetailHtmlV157();
assert.ok(staffingMonthHtml.includes('staff-2'),'understaffed staffing must appear in the full-month detail list');
assert.ok(!staffingMonthHtml.includes('staff-1'),'fully staffed shift must not appear in understaffed filter');
assert.ok(!staffingMonthHtml.includes('staff-4'),'next-month shift must not leak into selected month');
assert.ok(!staffingMonthHtml.includes('staff-5'),'leave row must not count as understaffed staffing');
'''
    t = t.replace("\nconsole.log('calendar-controller regression tests passed');", block + "\nconsole.log('calendar-controller regression tests passed');")
    tests.write_text(t, encoding='utf-8')

# Cache/version bump so installed phones receive the corrected controller.
s = sw.read_text(encoding='utf-8')
s = re.sub(r"const CACHE='pala-v[^']+';", "const CACHE='pala-v157-staffing-month-list';", s, count=1)
s = re.sub(r'calendar-controller\.js\?v=\d+', 'calendar-controller.js?v=7', s)
# Normalize stale/fresh HTML to one controller version.
old_inject = "if(!html.includes('calendar-controller.js'))html=html.replace('</body>','<script src=\"calendar-controller.js?v=7\"></script></body>');"
if old_inject not in s:
    # after version normalization the existing line should now contain v7
    existing = "if(!html.includes('calendar-controller.js'))html=html.replace('</body>','<script src=\"calendar-controller.js?v=7\"></script></body>');"
    if existing not in s:
        raise SystemExit('service worker controller injection not found')
s = s.replace(
    "if(!html.includes('calendar-controller.js'))html=html.replace('</body>','<script src=\"calendar-controller.js?v=7\"></script></body>');",
    "html=html.replace(/<script\\s+src=[\"']calendar-controller\\.js[^\"']*[\"']><\\/script>/gi,'');html=html.replace('</body>','<script src=\"calendar-controller.js?v=7\"></script></body>');",
    1
)
sw.write_text(s, encoding='utf-8')

idx = index.read_text(encoding='utf-8')
idx = re.sub(r'calendar-controller\.js\?v=\d+', 'calendar-controller.js?v=7', idx)
index.write_text(idx, encoding='utf-8')

# Final assertions
for value in [marker, 'calendarMonthDetailHtmlV157', '${monthDetailHtml()}']:
    if value not in text:
        raise SystemExit(f'missing controller marker: {value}')
if reg_marker not in t:
    raise SystemExit('missing regression marker')
if 'pala-v157-staffing-month-list' not in s or 'calendar-controller.js?v=7' not in s:
    raise SystemExit('cache/version bump failed')

print('Applied v157 staffing/month list fix')
