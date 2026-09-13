from pathlib import Path

controller=Path('calendar-controller.js')
index=Path('index.html')
sw=Path('sw.js')

text=controller.read_text(encoding='utf-8')
marker='PALA v154 · readable compact mobile cards'
if marker not in text:
    needle='\n})();\n'
    if needle not in text:
        raise SystemExit('controller end marker not found')
    patch=r'''

/* PALA v154 · readable compact mobile cards */
if(!document.getElementById('pala-calendar-readability-v154')){
  let readable=document.createElement('style');
  readable.id='pala-calendar-readability-v154';
  readable.textContent=`
  /* Keep the compact card geometry from v152, but restore comfortable phone typography. */
  .calendar-detail-list .job-title,.view-list .job-title,
  .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
  .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
  .calendar-detail-list .staff-card h3,.view-list .staff-card h3{
    font-size:17px!important;font-weight:700!important;line-height:1.12!important;color:#17213a!important;
  }
  .calendar-detail-list .job-date,.view-list .job-date{
    font-size:12.5px!important;font-weight:500!important;line-height:1.15!important;color:#4e5c72!important;
  }
  .calendar-detail-list .job-date .ui-icon,.view-list .job-date .ui-icon,
  .calendar-detail-list .metric-chip .ui-icon,.view-list .metric-chip .ui-icon,
  .calendar-detail-list .btn .ui-icon,.view-list .btn .ui-icon{
    width:12px!important;height:12px!important;
  }
  .calendar-detail-list .small,.view-list .small,
  .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
  .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{
    font-size:11.5px!important;line-height:1.18!important;color:#556278!important;
  }
  .calendar-detail-list .pill,.view-list .pill,
  .calendar-detail-list .metric-chip,.view-list .metric-chip,
  .calendar-detail-list .workshop-status,.view-list .workshop-status,
  .calendar-detail-list .leader-badge,.view-list .leader-badge,
  .calendar-detail-list .leader-missing,.view-list .leader-missing{
    font-size:11.5px!important;font-weight:650!important;line-height:1.08!important;
  }
  .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{
    font-size:11.5px!important;font-weight:650!important;line-height:1!important;color:#536077!important;
  }
  .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{
    font-size:13.5px!important;font-weight:550!important;line-height:1!important;color:#253249!important;
  }
  .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
  .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
  .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
  .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{
    font-size:13px!important;font-weight:650!important;line-height:1.05!important;
  }
  .calendar-detail-list .order-note,.view-list .order-note{
    font-size:11px!important;line-height:1.15!important;color:#556278!important;
  }
  .calendar-detail-list .staff-person,.view-list .staff-person{
    font-size:10.5px!important;font-weight:550!important;
  }
  .calendar-detail-list .workshop-task p,.view-list .workshop-task p{
    font-size:11.5px!important;line-height:1.18!important;color:#39465d!important;
  }
  .calendar-list-meta-v150{font-size:10.5px!important;font-weight:650!important;color:#5b667a!important}
  @media(max-width:620px){
    .calendar-detail-list .job-title,.view-list .job-title,
    .calendar-detail-list .workshop-job-card h3,.view-list .workshop-job-card h3,
    .calendar-detail-list .workshop-task h3,.view-list .workshop-task h3,
    .calendar-detail-list .staff-card h3,.view-list .staff-card h3{font-size:16px!important}
    .calendar-detail-list .job-date,.view-list .job-date{font-size:12px!important}
    .calendar-detail-list .small,.view-list .small,
    .calendar-detail-list .workshop-job-meta,.view-list .workshop-job-meta,
    .calendar-detail-list .workshop-task-meta,.view-list .workshop-task-meta{font-size:11px!important}
    .calendar-detail-list .pill,.view-list .pill,
    .calendar-detail-list .metric-chip,.view-list .metric-chip,
    .calendar-detail-list .workshop-status,.view-list .workshop-status{font-size:11px!important}
    .calendar-detail-list .job-quick-status label,.view-list .job-quick-status label{font-size:11px!important}
    .calendar-detail-list .job-quick-status select,.view-list .job-quick-status select{font-size:13px!important}
    .calendar-detail-list .job-actions .btn,.view-list .job-actions .btn,
    .calendar-detail-list .staff-card .btn,.view-list .staff-card .btn,
    .calendar-detail-list .workshop-job-card .btn,.view-list .workshop-job-card .btn,
    .calendar-detail-list .workshop-task .btn,.view-list .workshop-task .btn{font-size:12.5px!important}
  }`;
  document.head.appendChild(readable);
}
'''
    text=text.replace(needle,patch+needle,1)
    controller.write_text(text,encoding='utf-8')

idx=index.read_text(encoding='utf-8')
if 'calendar-controller.js?v=4' not in idx:
    raise SystemExit('expected controller v4 loader not found')
idx=idx.replace('calendar-controller.js?v=4','calendar-controller.js?v=5')
index.write_text(idx,encoding='utf-8')

service=sw.read_text(encoding='utf-8')
if 'pala-v153-calendar-readability' not in service or 'calendar-controller.js?v=4' not in service:
    raise SystemExit('expected v153 service worker markers not found')
service=service.replace('pala-v153-calendar-readability','pala-v154-readable-compact-cards')
service=service.replace('calendar-controller.js?v=4','calendar-controller.js?v=5')
sw.write_text(service,encoding='utf-8')

for target,value in [
    (text,marker),
    (idx,'calendar-controller.js?v=5'),
    (service,'pala-v154-readable-compact-cards'),
    (service,'calendar-controller.js?v=5')
]:
    if value not in target:
        raise SystemExit(f'Missing required marker: {value}')
print('Applied PALA v154 readable compact mobile cards')
