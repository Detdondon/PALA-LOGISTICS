from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
css_marker = 'PALA v114 · workshop mobile navigation fit'
js_marker = "controls.classList.add('workshop-control-card')"

if css_marker not in text:
    head_close = text.find('</head>')
    if head_close < 0:
        raise SystemExit('Could not find </head>')
    css = r'''
<style id="pala-v114-workshop-nav-fit">
/* PALA v114 · workshop mobile navigation fit */
@media(max-width:620px){
  .workshop-control-card .calendar-nav-controls{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:8px!important;
    width:100%!important;
  }
  .workshop-control-card .calendar-nav-controls .btn{
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    padding:12px 6px!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    gap:5px!important;
    overflow:hidden!important;
    white-space:nowrap!important;
    box-sizing:border-box!important;
  }
  .workshop-control-card .calendar-nav-controls .btn span{
    min-width:0!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
  }
  .workshop-control-card .calendar-nav-controls .ui-icon{
    flex:0 0 auto!important;
  }
}
</style>
'''
    text = text[:head_close] + css + text[head_close:]

if js_marker not in text:
    v113 = text.find('PALA v113 · unified workshop controls and admin-only backup navigation')
    if v113 < 0:
        raise SystemExit('Could not find v113 workshop UI block')
    target = 'if(!controls)return;'
    pos = text.find(target, v113)
    if pos < 0:
        raise SystemExit('Could not find workshop controls guard')
    text = text[:pos] + "if(!controls)return;controls.classList.add('workshop-control-card');" + text[pos+len(target):]

if text.count(css_marker) != 1:
    raise SystemExit('CSS marker verification failed')
if text.count(js_marker) != 1:
    raise SystemExit('Workshop class marker verification failed')

path.write_text(text, encoding='utf-8')
print('Applied v114 workshop mobile navigation fit')
