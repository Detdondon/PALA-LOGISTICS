from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v129 · clean unified calendar summary'
if marker in text:
    raise SystemExit('PALA v129 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v129 · clean unified calendar summary */
const applyUnifiedCalendarTopV129Base=applyUnifiedCalendarTopV123;
applyUnifiedCalendarTopV123=function(){
  let result=applyUnifiedCalendarTopV129Base.apply(this,arguments);
  let control=app.querySelector('.calendar-control-card');
  if(!control)return result;
  let summary=control.querySelector('.unified-calendar-summary-v123');
  if(summary){
    let c=unifiedPeriodCountsV123();
    let w=calendarWindowV121(calDate,calendarViewMode==='calendar'?28:14);
    let workshopCount=workshopJobs.filter(j=>j.status!=='Annulleret'&&j.start_date<=w.last&&j.end_date>=w.first).length;
    summary.innerHTML=`<button class="pill reference-button" onclick="openUnifiedSummaryListV125('orders')">${uiIcon('calendar')}${c.orders} ordrer</button><button class="pill reference-button ${c.under?'red':''}" onclick="openUnifiedSummaryListV125('staffing')">${uiIcon('people')}${c.shifts} vagter${c.under?` · ${c.under} mangler folk`:''}</button><button class="pill reference-button" onclick="openUnifiedSummaryListV125('workshop')">${uiIcon('scissors')}${workshopCount} ${workshopCount===1?'systuejob':'systuejobs'}</button>`;
  }
  let meta=control.querySelector('.calendar-meta');
  if(meta){
    [...meta.querySelectorAll('button')].forEach(button=>{
      let aria=(button.getAttribute('aria-label')||'').toLowerCase();
      let text=(button.textContent||'').toLowerCase();
      if(aria.includes('jobs i perioden')||aria.includes('systuejobs i perioden')||text.includes('job i perioden')||text.includes('jobs i perioden')||text.includes('systuejob i perioden')||text.includes('systuejobs i perioden'))button.remove();
    });
    if(!meta.querySelector('button'))meta.remove();
  }
  return result;
};
'''
text=text.replace(needle,patch+needle,1)
path.write_text(text,encoding='utf-8')
