from pathlib import Path

controller=Path('calendar-controller.js')
index=Path('index.html')
sw=Path('sw.js')

text=controller.read_text(encoding='utf-8')
marker='PALA v152 · compact calendar day/list cards'

# Give the selected-day panel a stable class so compact styling never leaks elsewhere.
old='</div></div><div class="card"><div><div class="small muted">UGE ${isoWeekNumber(selected)}</div><h2 class="calendar-day-title">'
new='</div></div><div class="card calendar-day-detail-card"><div><div class="small muted">UGE ${isoWeekNumber(selected)}</div><h2 class="calendar-day-title">'
if old in text:
    text=text.replace(old,new,1)
elif 'calendar-day-detail-card' not in text:
    raise SystemExit('Selected-day card anchor not found')

if marker not in text:
    needle='\n})();\n'
    if needle not in text:
        raise SystemExit('calendar controller end marker not found')
    patch=r'''

/* PALA v152 · compact calendar day/list cards */
if(!document.getElementById('pala-calendar-compact-cards-v152')){
  let compactCards=document.createElement('style');
  compactCards.id='pala-calendar-compact-cards-v152';
  compactCards.textContent=`
  .calendar-day-detail-card{padding:10px 12px!important;margin-top:8px!important;border-radius:14px!important;box-shadow:none!important}
  .calendar-day-detail-card>.row,.calendar-day-detail-card>div:first-child{margin:0!important}
  .calendar-day-detail-card .calendar-day-title{font-size:22px!important;line-height:1.05!important;margin:1px 0 7px!important}
  .calendar-day-detail-card>div:first-child>.small{font-size:10px!important;line-height:1.1!important}
  .calendar-detail-list{gap:5px!important}

  .calendar-detail-list .job-card,.calendar-detail-list .staff-card,.calendar-detail-list .workshop-job-card,.calendar-detail-list .workshop-task,
  .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{
    margin:2px 0!important;padding:7px 8px!important;border-radius:9px!important;box-shadow:none!important;
  }
  .calendar-detail-list .job-head,.view-list .job-head{grid-template-columns:minmax(0,1fr) auto!important;gap:6px!important;align-items:center!important}
  .calendar-detail-list .job-title,.view-list .job-title,
  .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
  .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
  .calendar-detail-list .staff-card h3,.view-list .staff-card h3{
    font-size:14px!important;line-height:1.08!important;margin:0 0 2px!important;letter-spacing:0!important;
  }
  .calendar-detail-list .job-date,.view-list .job-date,
  .calendar-detail-list .small,.view-list .small,
  .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{
    font-size:9.5px!important;line-height:1.15!important;
  }
  .calendar-detail-list .job-date,.view-list .job-date{gap:3px!important;margin:0!important}
  .calendar-detail-list .job-date .ui-icon,.view-list .job-date .ui-icon,
  .calendar-detail-list .metric-chip .ui-icon,.view-list .metric-chip .ui-icon,
  .calendar-detail-list .btn .ui-icon,.view-list .btn .ui-icon{width:10px!important;height:10px!important}
  .calendar-detail-list .job-status-col,.view-list .job-status-col{gap:2px!important;min-width:0!important;align-items:flex-end!important}
  .calendar-detail-list .pill,.view-list .pill,
  .calendar-detail-list .metric-chip,.view-list .metric-chip,
  .calendar-detail-list .workshop-status,.view-list .workshop-status,
  .calendar-detail-list .leader-badge,.view-list .leader-badge,
  .calendar-detail-list .leader-missing,.view-list .leader-missing{
    font-size:9px!important;line-height:1.05!important;padding:2px 5px!important;border-radius:999px!important;
  }
  .calendar-detail-list .job-metrics,.view-list .job-metrics{
    display:flex!important;flex-wrap:wrap!important;margin-top:4px!important;padding-top:4px!important;gap:3px!important;
  }
  .calendar-detail-list .job-quick-status,.view-list .job-quick-status{
    display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:5px!important;margin:4px 0 0!important;
  }
  .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{
    font-size:9px!important;line-height:1!important;margin:0!important;white-space:nowrap!important;
  }
  .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{
    width:auto!important;min-width:92px!important;min-height:28px!important;height:28px!important;padding:2px 24px 2px 7px!important;font-size:11px!important;line-height:1!important;border-radius:7px!important;
  }
  .calendar-detail-list .job-actions,.view-list .job-actions{
    display:flex!important;flex-wrap:wrap!important;gap:4px!important;margin-top:5px!important;justify-content:flex-start!important;
  }
  .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
  .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
  .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
  .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{
    width:auto!important;min-width:0!important;min-height:29px!important;padding:5px 9px!important;font-size:10.5px!important;line-height:1.05!important;border-radius:8px!important;box-shadow:none!important;
  }
  .calendar-detail-list .job-actions .btn.primary,.view-list .job-actions .btn.primary{flex:0 0 auto!important}
  .calendar-detail-list .order-note,.view-list .order-note{font-size:9px!important;line-height:1.15!important;margin:3px 0 0!important}
  .calendar-detail-list .staff-people,.view-list .staff-people{gap:3px!important;margin:3px 0!important}
  .calendar-detail-list .staff-person,.view-list .staff-person{font-size:8.5px!important;padding:2px 5px!important}
  .calendar-detail-list .workshop-task p,.view-list .workshop-task p{font-size:9.5px!important;line-height:1.15!important;margin:3px 0!important}
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{gap:3px!important;margin-top:3px!important}

  @media(max-width:620px){
    .calendar-day-detail-card{padding:8px 9px!important;border-radius:12px!important}
    .calendar-day-detail-card .calendar-day-title{font-size:19px!important;margin-bottom:5px!important}
    .calendar-detail-list{gap:3px!important}
    .calendar-detail-list .job-card,.calendar-detail-list .staff-card,.calendar-detail-list .workshop-job-card,.calendar-detail-list .workshop-task,
    .view-list .job-card,.view-list .staff-card,.view-list .workshop-job-card,.view-list .workshop-task{padding:6px 7px!important;margin:1px 0!important}
    .calendar-detail-list .job-title,.view-list .job-title,
    .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
    .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
    .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:13px!important}
    .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn{min-height:28px!important;padding:4px 8px!important;font-size:10px!important}
  }`;
  document.head.appendChild(compactCards);
}
'''
    text=text.replace(needle,patch+needle,1)

controller.write_text(text,encoding='utf-8')

idx=index.read_text(encoding='utf-8')
idx=idx.replace('calendar-controller.js?v=2','calendar-controller.js?v=3')
index.write_text(idx,encoding='utf-8')

service=sw.read_text(encoding='utf-8')
service=service.replace('pala-v151-compact-calendar-list','pala-v152-compact-day-list')
service=service.replace('calendar-controller.js?v=2','calendar-controller.js?v=3')
sw.write_text(service,encoding='utf-8')

required=[
  (text,marker),
  (text,'calendar-day-detail-card'),
  (idx,'calendar-controller.js?v=3'),
  (service,'pala-v152-compact-day-list'),
  (service,'calendar-controller.js?v=3')
]
for target,value in required:
    if value not in target:
        raise SystemExit(f'Missing required marker: {value}')
print('Applied PALA v152 compact calendar day/list cards')
