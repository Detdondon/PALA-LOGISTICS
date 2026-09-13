from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = 'PALA v132 · calendar summary layout and production plan cleanup'
if marker in text:
    raise SystemExit('PALA v132 already present')

needle = '\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch = r'''

/* PALA v132 · calendar summary layout and production plan cleanup */
if(!document.getElementById('pala-v132-calendar-top-style')){
  let style=document.createElement('style');
  style.id='pala-v132-calendar-top-style';
  style.textContent=`
    .unified-calendar-summary-v123{
      display:grid!important;
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:8px!important;
      width:100%!important;
    }
    .unified-calendar-summary-v123 .pill{
      width:100%!important;
      min-width:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
      white-space:nowrap!important;
    }
    @media(max-width:520px){
      .unified-calendar-summary-v123 .pill{
        padding:9px 6px!important;
        font-size:10px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

const applyUnifiedCalendarTopV132Base=applyUnifiedCalendarTopV123;
applyUnifiedCalendarTopV123=function(){
  let result=applyUnifiedCalendarTopV132Base.apply(this,arguments);
  let summary=app.querySelector('.unified-calendar-summary-v123');
  if(summary){
    let buttons=[...summary.querySelectorAll('.reference-button')];
    if(buttons[2]){
      let w=calendarWindowV121(calDate,calendarViewMode==='calendar'?28:14);
      let workshopCount=workshopJobs.filter(j=>j.status!=='Annulleret'&&j.start_date<=w.last&&j.end_date>=w.first).length;
      buttons[2].innerHTML=`${uiIcon('scissors')}${workshopCount} systue`;
    }
  }
  app.querySelectorAll('[data-production-plan-export]').forEach(button=>button.remove());
  return result;
};
'''

path.write_text(text.replace(needle, patch + needle, 1), encoding='utf-8')
