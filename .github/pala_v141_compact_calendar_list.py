from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v141 · compact unified calendar list cards'
if marker in text:
    raise SystemExit('PALA v141 already present')

style=r'''

/* PALA v141 · compact unified calendar list cards */
.view-list{gap:8px}
.view-list-group{padding-top:8px}
.view-list-date{margin:0 0 5px;font-size:14px;line-height:1.2}
.view-list .job-card,
.view-list .staff-card,
.view-list .workshop-job-card,
.view-list .workshop-task{
  margin:4px 0!important;
  padding:9px 10px!important;
  border-radius:11px!important;
}
.view-list .job-head{grid-template-columns:minmax(0,1fr) auto!important;gap:7px!important;align-items:center!important}
.view-list .job-title{font-size:15px!important;line-height:1.12!important;margin:0 0 3px!important}
.view-list .job-date{font-size:11px!important;line-height:1.25!important;gap:4px!important}
.view-list .job-date .ui-icon{width:12px!important;height:12px!important}
.view-list .job-status-col{grid-column:auto!important;align-items:flex-end!important;min-width:0!important;gap:4px!important}
.view-list .pill{font-size:9px!important;padding:3px 6px!important;line-height:1.15}
.view-list .job-metrics{margin-top:6px!important;padding-top:6px!important;gap:4px!important}
.view-list .metric-chip{font-size:10px!important;padding:3px 6px!important;gap:3px!important;border-radius:999px!important;line-height:1.2}
.view-list .metric-chip .ui-icon{width:11px!important;height:11px!important}
.view-list .job-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;margin-top:6px!important}
.view-list .job-actions .btn{min-height:28px!important;padding:5px 7px!important;font-size:10px!important;border-radius:8px!important}
.view-list .order-note{font-size:10px!important;margin-top:4px!important;line-height:1.25}
.view-list .staff-card>.row{gap:7px!important;align-items:center!important}
.view-list .staff-card h3{font-size:14px!important;line-height:1.15!important;margin:0 0 2px!important}
.view-list .staff-card .small{font-size:10px!important;line-height:1.2!important}
.view-list .staff-card .leader-badge,
.view-list .staff-card .leader-missing{font-size:9px!important;padding:3px 5px!important}
.view-list .staff-people{gap:3px!important;margin:4px 0!important}
.view-list .staff-person{font-size:9px!important;padding:3px 5px!important}
.view-list .staff-card .btn{min-height:28px!important;padding:5px 7px!important;font-size:10px!important;border-radius:8px!important}
.view-list .workshop-job-card{border-left-width:4px!important}
.view-list .workshop-job-card>.row{gap:7px!important;align-items:center!important}
.view-list .workshop-job-card h3{font-size:14px!important;line-height:1.15!important;margin:1px 0 3px!important}
.view-list .workshop-job-card .small{font-size:9px!important}
.view-list .workshop-job-meta{gap:4px!important;font-size:10px!important;line-height:1.2!important}
.view-list .workshop-job-meta .reference-button{font-size:10px!important;padding:2px 0!important;min-height:0!important}
.view-list .workshop-job-card .btn{min-height:28px!important;padding:5px 7px!important;font-size:10px!important;border-radius:8px!important}
.view-list .workshop-task-head{gap:7px!important}
.view-list .workshop-task h3{font-size:14px!important;line-height:1.15!important;margin:1px 0 3px!important}
.view-list .workshop-task p{font-size:10px!important;line-height:1.25!important;margin-top:4px!important}
.view-list .workshop-task-meta{font-size:9px!important;gap:5px!important;margin-top:5px!important}
.view-list .workshop-status{font-size:9px!important;padding:3px 5px!important}
@media(max-width:620px){
  .view-list{gap:6px}
  .view-list-group{padding-top:6px}
  .view-list-date{font-size:13px;margin-bottom:4px}
  .view-list .job-card,
  .view-list .staff-card,
  .view-list .workshop-job-card,
  .view-list .workshop-task{padding:8px 9px!important;margin:3px 0!important}
}
'''

needle='\n</style>\n</head>'
if needle not in text:
    raise SystemExit('style close marker not found')
text=text.replace(needle,style+needle,1)

text=text.replace('<span class="app-version" hidden>v140</span>','<span class="app-version" hidden>v141</span>',1)

end_marker='\nsyncLoginUi();\n\n</script></body></html>'
if end_marker not in text:
    raise SystemExit('final script marker not found')
version_patch=r'''

const syncVersionBadgeV141Base=syncVersionBadgeV134;
syncVersionBadgeV134=function(){
  let result=syncVersionBadgeV141Base.apply(this,arguments);
  let badge=document.querySelector('.app-version');
  if(badge)badge.textContent='v141';
  return result;
};
'''
text=text.replace(end_marker,version_patch+end_marker,1)

path.write_text(text,encoding='utf-8')
