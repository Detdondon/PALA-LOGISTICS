from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v124 · strict unified calendar type filtering'
if marker in text:
    raise SystemExit('PALA v124 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v124 · strict unified calendar type filtering */
const calendarEventsV124Base=calendarEvents;
calendarEvents=function(start,days,mode){
  let rows=calendarEventsV124Base(start,days,mode);
  if(mode!=='calendar'||mainCalendarTypeFilterV120==='all')return rows;
  if(mainCalendarTypeFilterV120==='orders')return rows.filter(event=>!event?.kind);
  if(mainCalendarTypeFilterV120==='staffing')return rows.filter(event=>event?.kind==='staffing'||event?.kind==='staffLeave');
  if(mainCalendarTypeFilterV120==='workshop')return rows.filter(event=>event?.kind==='workshop'||event?.kind==='workshopTask');
  return rows;
};
'''
text=text.replace(needle,patch+needle,1)
path.write_text(text,encoding='utf-8')
