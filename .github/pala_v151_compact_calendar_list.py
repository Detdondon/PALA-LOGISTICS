from pathlib import Path

controller=Path('calendar-controller.js')
index=Path('index.html')
sw=Path('sw.js')
tests=Path('tests/calendar-controller.test.js')

text=controller.read_text(encoding='utf-8')
marker='PALA v151 · dense full-month list'
if marker not in text:
    needle='\n})();\n'
    if needle not in text:
        raise SystemExit('calendar controller end marker not found')
    patch=r'''

/* PALA v151 · dense full-month list */
if(!document.getElementById('pala-calendar-list-v151-style')){
  let compact=document.createElement('style');
  compact.id='pala-calendar-list-v151-style';
  compact.textContent=`
  .view-list{gap:4px!important;padding:8px 10px!important;margin-top:10px!important;border-radius:14px!important;box-shadow:none!important}
  .view-list-group{padding-top:5px!important;margin:0!important}
  .view-list-group:first-child{padding-top:0!important}
  .view-list-date{font-size:12px!important;line-height:1.15!important;margin:0 0 3px!important;font-weight:700!important}
  .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{margin:2px 0!important;padding:6px 7px!important;border-radius:9px!important;box-shadow:none!important}
  .view-list .job-head,.view-list .workshop-task-head,.view-list .workshop-job-card>.row,.view-list .staff-card>.row{gap:5px!important;align-items:center!important}
  .view-list .job-title,.view-list .workshop-job-card h3,.view-list .workshop-task h3,.view-list .staff-card h3{font-size:13px!important;line-height:1.12!important;margin:0 0 2px!important;letter-spacing:0!important}
  .view-list .small,.view-list .job-date,.view-list .workshop-job-meta,.view-list .workshop-task-meta{font-size:9px!important;line-height:1.15!important}
  .view-list .job-date{gap:3px!important;margin:0!important}
  .view-list .job-date .ui-icon,.view-list .metric-chip .ui-icon,.view-list .btn .ui-icon,.view-list .reference-button .ui-icon{width:10px!important;height:10px!important}
  .view-list .job-status-col{gap:3px!important;min-width:0!important}
  .view-list .pill,.view-list .metric-chip,.view-list .workshop-status,.view-list .leader-badge,.view-list .leader-missing{font-size:8.5px!important;line-height:1.1!important;padding:2px 5px!important;border-radius:999px!important}
  .view-list .job-metrics{margin-top:4px!important;padding-top:4px!important;gap:3px!important}
  .view-list .job-actions{gap:3px!important;margin-top:4px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .view-list .btn{min-height:24px!important;padding:3px 6px!important;font-size:9px!important;line-height:1.1!important;border-radius:7px!important}
  .view-list .job-quick-status{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;margin:3px 0 0!important}
  .view-list .job-quick-status label{font-size:8.5px!important;margin:0!important;white-space:nowrap!important}
  .view-list .job-quick-status select{width:auto!important;min-width:96px!important;min-height:25px!important;padding:2px 22px 2px 6px!important;font-size:9.5px!important;border-radius:7px!important}
  .view-list .order-note{font-size:9px!important;line-height:1.15!important;margin:3px 0 0!important}
  .view-list .staff-people{gap:3px!important;margin:3px 0!important}
  .view-list .staff-person{font-size:8.5px!important;line-height:1.1!important;padding:2px 5px!important}
  .view-list .workshop-job-meta{gap:4px!important}
  .view-list .workshop-job-meta .reference-button,.view-list .reference-button{font-size:9px!important;line-height:1.1!important;padding:1px 0!important;min-height:0!important}
  .view-list .workshop-task p{font-size:9.5px!important;line-height:1.2!important;margin:3px 0!important}
  .view-list .workshop-task-meta{gap:4px!important;margin-top:4px!important}
  .calendar-list-flat-v150{margin:4px 0 7px!important}
  .calendar-list-meta-v150{font-size:8.5px!important;line-height:1.1!important;margin:0 0 2px 2px!important}
  @media(max-width:620px){
    .view-list{gap:3px!important;padding:6px 7px!important;border-radius:12px!important}
    .view-list-group{padding-top:4px!important}
    .view-list-date{font-size:11.5px!important;margin-bottom:2px!important}
    .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{padding:5px 6px!important;margin:2px 0!important}
    .view-list .job-title,.view-list .workshop-job-card h3,.view-list .workshop-task h3,.view-list .staff-card h3{font-size:12.5px!important}
    .view-list .job-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  }`;
  document.head.appendChild(compact);
}
'''
    text=text.replace(needle,patch+needle,1)
    controller.write_text(text,encoding='utf-8')

idx=index.read_text(encoding='utf-8')
idx=idx.replace('calendar-controller.js?v=1','calendar-controller.js?v=2')
index.write_text(idx,encoding='utf-8')

service=sw.read_text(encoding='utf-8')
service=service.replace("pala-v150-calendar-controller","pala-v151-compact-calendar-list")
service=service.replace('calendar-controller.js?v=1','calendar-controller.js?v=2')
sw.write_text(service,encoding='utf-8')

spec=tests.read_text(encoding='utf-8')
reg_marker='full selected month must be represented in list view'
if reg_marker not in spec:
    spec=spec.replace("console.log('calendar-controller regression tests passed');",r'''
// The list view must include the complete selected calendar month and exclude adjacent months.
const host={innerHTML:''};
sandbox.app.querySelector=selector=>selector==='.view-list'?host:null;
sandbox.calendarViewMode='list';
sandbox.calDate=new Date(2026,0,15);
sandbox.mainCalendarTypeFilterV120='orders';
sandbox.mainCalendarStatusFilterV123='all';
sandbox.bookings=[
  {id:11,status:'På lager',start_date:'2026-01-01',end_date:'2026-01-01',customer_name:'Første dag'},
  {id:12,status:'På lager',start_date:'2026-01-31',end_date:'2026-01-31',customer_name:'Sidste dag'},
  {id:13,status:'På lager',start_date:'2026-02-01',end_date:'2026-02-01',customer_name:'Næste måned'}
];
sandbox.setCalendarSortV150('date_asc');
sandbox.renderMainCalendarListV121();
assert.ok(host.innerHTML.includes('order-11'),'full selected month must be represented in list view: first day missing');
assert.ok(host.innerHTML.includes('order-12'),'full selected month must be represented in list view: last day missing');
assert.ok(!host.innerHTML.includes('order-13'),'list view must not leak activities from the next month');

console.log('calendar-controller regression tests passed');''',1)
    tests.write_text(spec,encoding='utf-8')

for required in [marker,'calendar-controller.js?v=2','pala-v151-compact-calendar-list']:
    target=text if required==marker else (idx if 'controller.js' in required else service)
    if required not in target:
        raise SystemExit(f'Missing required marker: {required}')
print('Applied PALA v151 compact full-month calendar list')
