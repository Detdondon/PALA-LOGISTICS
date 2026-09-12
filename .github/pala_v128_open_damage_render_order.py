from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='/* PALA v127 · open damage shortcut shows only open damage tasks */'
pos=text.rfind(marker)
if pos<0:
    raise SystemExit('v127 open-damage marker not found')
tail=text[pos:]
old_start="showOpenWorkshopDamageListV122=function(){"
new_start="showOpenWorkshopDamageListV122=async function(){"
if old_start not in tail:
    raise SystemExit('open-damage handler start not found')
tail=tail.replace(old_start,new_start,1)
call='  showCalendar();\n  renderOpenWorkshopDamageOnlyV127();'
replacement='  await showCalendar();\n  renderOpenWorkshopDamageOnlyV127();'
if call not in tail:
    raise SystemExit('calendar/render sequence not found')
tail=tail.replace(call,replacement,1)
comment='/* PALA v128 · wait for unified calendar before rendering open damages */\n'
tail=tail.replace(new_start,comment+new_start,1)
text=text[:pos]+tail
path.write_text(text,encoding='utf-8')
