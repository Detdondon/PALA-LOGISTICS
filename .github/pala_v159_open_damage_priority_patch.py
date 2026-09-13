from pathlib import Path
import re

controller=Path('calendar-controller.js')
tests=Path('tests/calendar-controller.test.js')
sw=Path('sw.js')
index=Path('index.html')

text=controller.read_text(encoding='utf-8')
marker='PALA v159 · open workshop damages first only in Systue view'
if marker not in text:
    old_sorted="function sorted(rows){let base=(a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0);if(calendarSortV150==='date_desc')return[...rows].sort((a,b)=>-base(a,b));if(calendarSortV150==='name_asc')return[...rows].sort((a,b)=>cmp(a.name,b.name)||base(a,b));if(calendarSortV150==='name_desc')return[...rows].sort((a,b)=>cmp(b.name,a.name)||base(a,b));if(calendarSortV150==='type')return[...rows].sort((a,b)=>cmp(label(a.k),label(b.k))||base(a,b));if(calendarSortV150==='status')return[...rows].sort((a,b)=>cmp(a.status,b.status)||base(a,b));return[...rows].sort(base)}"
    new_sorted="""/* PALA v159 · open workshop damages first only in Systue view */
function pinnedOpenDamage(row){return mainCalendarTypeFilterV120==='workshop'&&row?.k==='workshopTask'&&!taskDone(row.r)}
function splitPinnedWorkshopRows(rows){if(mainCalendarTypeFilterV120!=='workshop')return{pinned:[],rest:rows};let pinned=[],rest=[];rows.forEach(row=>(pinnedOpenDamage(row)?pinned:rest).push(row));return{pinned,rest}}
function sorted(rows){let base=(a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0),priority=(a,b)=>(pinnedOpenDamage(a)?0:1)-(pinnedOpenDamage(b)?0:1);if(calendarSortV150==='date_desc')return[...rows].sort((a,b)=>priority(a,b)||-base(a,b));if(calendarSortV150==='name_asc')return[...rows].sort((a,b)=>priority(a,b)||cmp(a.name,b.name)||base(a,b));if(calendarSortV150==='name_desc')return[...rows].sort((a,b)=>priority(a,b)||cmp(b.name,a.name)||base(a,b));if(calendarSortV150==='type')return[...rows].sort((a,b)=>priority(a,b)||cmp(label(a.k),label(b.k))||base(a,b));if(calendarSortV150==='status')return[...rows].sort((a,b)=>priority(a,b)||cmp(a.status,b.status)||base(a,b));return[...rows].sort((a,b)=>priority(a,b)||base(a,b))}"""
    if old_sorted not in text:
        raise SystemExit('sorted() target not found')
    text=text.replace(old_sorted,new_sorted,1)

    old_render="function renderList(){let host=app.querySelector('.view-list');if(!host||calendarViewMode!=='list')return;let rows=sorted(entries());if(!rows.length){host.innerHTML='<p class=\"muted\">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';return}if(['date_asc','date_desc'].includes(calendarSortV150)){let dates=[...new Set(rows.map(r=>r.date))];host.innerHTML=dates.map(ds=>`<section class=\"view-list-group\" data-date=\"${ds}\"><h3 class=\"view-list-date\">${listDateHeading(ds)}</h3>${rows.filter(r=>r.date===ds).map(r=>r.html).join('')}</section>`).join('');return}host.innerHTML=rows.map(r=>`<section class=\"calendar-list-flat-v150\"><div class=\"calendar-list-meta-v150\">${esc(fmtDateDa(r.date))} · ${esc(label(r.k))} · ${esc(r.status)}</div>${r.html}</section>`).join('')}"
    new_render="""function renderRowsGroupedByDate(rows){let dates=[...new Set(rows.map(r=>r.date))];return dates.map(ds=>`<section class=\"view-list-group\" data-date=\"${ds}\"><h3 class=\"view-list-date\">${listDateHeading(ds)}</h3>${rows.filter(r=>r.date===ds).map(r=>r.html).join('')}</section>`).join('')}
function renderPinnedWorkshopRows(rows){return rows.length?`<section class=\"view-list-group workshop-open-pinned-v159\"><h3 class=\"view-list-date\">Åbne skader</h3>${rows.map(r=>r.html).join('')}</section>`:''}
function renderList(){let host=app.querySelector('.view-list');if(!host||calendarViewMode!=='list')return;let rows=sorted(entries());if(!rows.length){host.innerHTML='<p class=\"muted\">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';return}let split=splitPinnedWorkshopRows(rows),pinnedHtml=renderPinnedWorkshopRows(split.pinned);if(['date_asc','date_desc'].includes(calendarSortV150)){host.innerHTML=pinnedHtml+renderRowsGroupedByDate(split.rest);return}host.innerHTML=pinnedHtml+split.rest.map(r=>`<section class=\"calendar-list-flat-v150\"><div class=\"calendar-list-meta-v150\">${esc(fmtDateDa(r.date))} · ${esc(label(r.k))} · ${esc(r.status)}</div>${r.html}</section>`).join('')}"""
    if old_render not in text:
        raise SystemExit('renderList target not found')
    text=text.replace(old_render,new_render,1)

    old_month="function monthDetailHtml(){let rows=[...entries()].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0));if(!rows.length)return '<p class=\"calendar-empty\">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';let dates=[...new Set(rows.map(r=>r.date))];return dates.map(ds=>`<section class=\"view-list-group\" data-date=\"${ds}\"><h3 class=\"view-list-date\">${listDateHeading(ds)}</h3>${rows.filter(r=>r.date===ds).map(r=>r.html).join('')}</section>`).join('')}"
    new_month="function monthDetailHtml(){let rows=[...entries()].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||cmp(a.name,b.name)||(+a.r?.id||0)-(+b.r?.id||0));if(!rows.length)return '<p class=\"calendar-empty\">Ingen aktiviteter matcher filtrene i den valgte måned.</p>';let split=splitPinnedWorkshopRows(rows);return renderPinnedWorkshopRows(split.pinned)+renderRowsGroupedByDate(split.rest)}"
    if old_month not in text:
        raise SystemExit('monthDetailHtml target not found')
    text=text.replace(old_month,new_month,1)
    controller.write_text(text,encoding='utf-8')

# Regression coverage: pinned only when Systue is selected.
t=tests.read_text(encoding='utf-8')
reg_marker='open workshop damage must be first when Systue is selected'
if reg_marker not in t:
    block=r'''

// Open damages are pinned first only when the Systue type filter is selected.
sandbox.calDate=new Date(2026,8,13);
sandbox.calendarViewMode='list';
sandbox.mainCalendarTypeFilterV120='workshop';
sandbox.mainCalendarStatusFilterV123='all';
sandbox.workshopJobs=[{id:31,status:'Åben',start_date:'2026-09-20',end_date:'2026-09-20',title:'Nyere systuejob'}];
sandbox.workshopTasks=[
  {id:41,status:'open',range:{start:'2026-09-02',end:'2026-09-02'},tent_name:'Gammel åben skade'},
  {id:42,status:'completed',range:{start:'2026-09-25',end:'2026-09-25'},tent_name:'Nyere afsluttet skade'}
];
sandbox.setCalendarSortV150('date_desc');
sandbox.renderMainCalendarListV121();
assert.ok(host.innerHTML.indexOf('task-41')>=0,'open workshop damage must be present');
assert.ok(host.innerHTML.indexOf('task-41')<host.innerHTML.indexOf('task-42'),'open workshop damage must be first when Systue is selected');
assert.ok(host.innerHTML.indexOf('task-41')<host.innerHTML.indexOf('workshop-31'),'open workshop damage must be above workshop jobs when Systue is selected');

const workshopMonthHtml=sandbox.calendarMonthDetailHtmlV157();
assert.ok(workshopMonthHtml.indexOf('task-41')<workshopMonthHtml.indexOf('task-42'),'calendar month detail must pin open damage first in Systue view');

sandbox.mainCalendarTypeFilterV120='all';
sandbox.mainCalendarStatusFilterV123='all';
sandbox.bookings=[{id:51,status:'På lager',start_date:'2026-09-29',end_date:'2026-09-29',customer_name:'Ny ordre'}];
sandbox.setCalendarSortV150('date_desc');
sandbox.renderMainCalendarListV121();
assert.ok(host.innerHTML.indexOf('order-51')<host.innerHTML.indexOf('task-41'),'open damage must not be force-pinned when type filter is Alt');
'''
    t=t.replace("\nconsole.log('calendar-controller regression tests passed');",block+"\nconsole.log('calendar-controller regression tests passed');")
    tests.write_text(t,encoding='utf-8')

s=sw.read_text(encoding='utf-8')
s=re.sub(r"const CACHE='pala-v[^']+';","const CACHE='pala-v159-workshop-open-damage-priority';",s,count=1)
s=re.sub(r'calendar-controller\.js\?v=\d+','calendar-controller.js?v=9',s)
sw.write_text(s,encoding='utf-8')

idx=index.read_text(encoding='utf-8')
idx=re.sub(r'calendar-controller\.js\?v=\d+','calendar-controller.js?v=9',idx)
index.write_text(idx,encoding='utf-8')

for required in [marker,'splitPinnedWorkshopRows','Åbne skader']:
    if required not in text:
        raise SystemExit(f'missing controller marker: {required}')
if reg_marker not in t:
    raise SystemExit('missing v159 regression test')
if 'pala-v159-workshop-open-damage-priority' not in s or 'calendar-controller.js?v=9' not in s:
    raise SystemExit('version bump failed')
print('Applied v159 workshop-only open damage priority')
