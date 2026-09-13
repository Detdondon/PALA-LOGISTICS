from pathlib import Path

controller=Path('calendar-controller.js')
index=Path('index.html')
sw=Path('sw.js')

text=controller.read_text(encoding='utf-8')
marker='PALA v153 · compact calendar readability'
if marker not in text:
    needle='\n})();\n'
    if needle not in text:
        raise SystemExit('controller end marker not found')
    patch=r'''

/* PALA v153 · compact calendar readability */
if(!document.getElementById('pala-calendar-readability-v153')){
  let readable=document.createElement('style');
  readable.id='pala-calendar-readability-v153';
  readable.textContent=`
  .calendar-detail-list .job-title,.view-list .job-title,
  .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
  .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
  .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:15px!important;font-weight:700!important;line-height:1.12!important;color:#17213a!important}
  .calendar-detail-list .job-date,.view-list .job-date{font-size:11px!important;font-weight:500!important;color:#536077!important}
  .calendar-detail-list .small,.view-list .small,
  .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{font-size:10.5px!important;line-height:1.2!important;color:#5b667a!important}
  .calendar-detail-list .pill,.view-list .pill,
  .calendar-detail-list .metric-chip,.view-list .metric-chip,
  .calendar-detail-list .workshop-status,.view-list .workshop-status,
  .calendar-detail-list .leader-badge,.view-list .leader-badge,
  .calendar-detail-list .leader-missing,.view-list .leader-missing{font-size:10px!important;font-weight:650!important;line-height:1.08!important}
  .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{font-size:10px!important;font-weight:650!important;color:#566176!important}
  .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{font-size:12px!important;font-weight:550!important;color:#26334b!important}
  .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
  .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
  .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
  .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{font-size:11px!important;font-weight:650!important}
  .calendar-detail-list .order-note,.view-list .order-note{font-size:10px!important;color:#5b667a!important}
  .calendar-detail-list .staff-person,.view-list .staff-person{font-size:9.5px!important;font-weight:550!important}
  .calendar-detail-list .workshop-task p,.view-list .workshop-task p{font-size:10.5px!important;line-height:1.2!important;color:#39465d!important}
  @media(max-width:620px){
    .calendar-detail-list .job-title,.view-list .job-title,
    .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
    .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
    .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:14.5px!important}
    .calendar-detail-list .job-date,.view-list .job-date{font-size:10.5px!important}
    .calendar-detail-list .small,.view-list .small,
    .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
    .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{font-size:10px!important}
    .calendar-detail-list .pill,.view-list .pill,.calendar-detail-list .metric-chip,.view-list .metric-chip{font-size:9.75px!important}
  }`;
  document.head.appendChild(readable);
}
'''
    text=text.replace(needle,patch+needle,1)
    controller.write_text(text,encoding='utf-8')

idx=index.read_text(encoding='utf-8')
idx=idx.replace('calendar-controller.js?v=3','calendar-controller.js?v=4')
index.write_text(idx,encoding='utf-8')

service=sw.read_text(encoding='utf-8')
service=service.replace('pala-v152-compact-day-list','pala-v153-calendar-readability')
service=service.replace('calendar-controller.js?v=3','calendar-controller.js?v=4')
sw.write_text(service,encoding='utf-8')

for target,value in [(text,marker),(idx,'calendar-controller.js?v=4'),(service,'pala-v153-calendar-readability'),(service,'calendar-controller.js?v=4')]:
    if value not in target:
        raise SystemExit(f'Missing required marker: {value}')
print('Applied PALA v153 compact calendar readability')
