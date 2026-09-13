from pathlib import Path

controller = Path('calendar-controller.js')
index = Path('index.html')
sw = Path('sw.js')

text = controller.read_text(encoding='utf-8')
marker = 'PALA v155 · status and pack action on one row'
if marker not in text:
    needle = '\n})();\n'
    if needle not in text:
        raise SystemExit('calendar controller end marker not found')
    patch = r'''

/* PALA v155 · status and pack action on one row */
const orderCardV155Base = orderCard;
orderCard = function(booking){
  let html = orderCardV155Base(booking);
  return html.replace(
    /(<div class="job-quick-status"[\s\S]*?<\/div>)(<div class="job-actions[^\"]*"[\s\S]*?<\/div>)/,
    '<div class="job-status-action-row">$1$2</div>'
  );
};

if(!document.getElementById('pala-calendar-status-row-v155')){
  let rowStyle=document.createElement('style');
  rowStyle.id='pala-calendar-status-row-v155';
  rowStyle.textContent=`
  .calendar-detail-list .job-status-action-row,.view-list .job-status-action-row{
    display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-top:5px!important;
  }
  .calendar-detail-list .job-status-action-row .job-quick-status,.view-list .job-status-action-row .job-quick-status{
    flex:1 1 auto!important;min-width:0!important;margin:0!important;justify-content:flex-start!important;
  }
  .calendar-detail-list .job-status-action-row .job-actions,.view-list .job-status-action-row .job-actions{
    flex:0 0 auto!important;display:flex!important;margin:0!important;padding:0!important;align-items:center!important;
  }
  .calendar-detail-list .job-status-action-row .job-actions .btn,.view-list .job-status-action-row .job-actions .btn{
    margin:0!important;white-space:nowrap!important;
  }
  @media(max-width:620px){
    .calendar-detail-list .job-status-action-row,.view-list .job-status-action-row{gap:6px!important;margin-top:4px!important}
    .calendar-detail-list .job-status-action-row .job-quick-status,.view-list .job-status-action-row .job-quick-status{gap:5px!important}
    .calendar-detail-list .job-status-action-row .job-quick-status select,.view-list .job-status-action-row .job-quick-status select{
      min-width:108px!important;width:auto!important;
    }
    .calendar-detail-list .job-status-action-row .job-actions .btn,.view-list .job-status-action-row .job-actions .btn{
      min-height:32px!important;padding:5px 9px!important;
    }
  }`;
  document.head.appendChild(rowStyle);
}
'''
    text = text.replace(needle, patch + needle, 1)
    controller.write_text(text, encoding='utf-8')

idx = index.read_text(encoding='utf-8')
if 'calendar-controller.js?v=5' not in idx:
    raise SystemExit('expected controller v5 loader not found')
idx = idx.replace('calendar-controller.js?v=5', 'calendar-controller.js?v=6')
index.write_text(idx, encoding='utf-8')

service = sw.read_text(encoding='utf-8')
if 'pala-v154-readable-compact-cards' not in service:
    raise SystemExit('expected v154 cache marker not found')
service = service.replace('pala-v154-readable-compact-cards', 'pala-v155-status-row-damage-delete')
service = service.replace('calendar-controller.js?v=5', 'calendar-controller.js?v=6')
service = service.replace('workshop-edit.js?v=1', 'workshop-edit.js?v=2')
sw.write_text(service, encoding='utf-8')

checks = [
    (text, marker),
    (text, 'job-status-action-row'),
    (idx, 'calendar-controller.js?v=6'),
    (service, 'pala-v155-status-row-damage-delete'),
    (service, 'calendar-controller.js?v=6'),
    (service, 'workshop-edit.js?v=2'),
]
for target, value in checks:
    if value not in target:
        raise SystemExit(f'Missing required marker: {value}')

print('Applied PALA v155 status/pack row and cache bump')
