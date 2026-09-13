from pathlib import Path
import re

controller = Path('calendar-controller.js')
tests = Path('tests/calendar-controller.test.js')
sw = Path('sw.js')
index = Path('index.html')

text = controller.read_text(encoding='utf-8')
marker = 'PALA v158 · no pack/return on completed orders'
if marker not in text:
    needle = "/* PALA v155 · status and pack action on one row */"
    if needle not in text:
        raise SystemExit('v155 order-card block not found')
    insert = r'''/* PALA v158 · no pack/return on completed orders */
const orderCardV158Base = orderCard;
orderCard = function(booking){
  let html = orderCardV158Base(booking);
  if(orderStatus(booking)!=='Afsluttet')return html;
  return html.replace(/<div class=\"job-actions[^\"]*\"[\s\S]*?<\/div>/,'');
};

'''
    # Place v158 AFTER v155 so it strips the final rendered action block.
    pos = text.find(needle)
    # Find the end of the v155 wrapper function by locating the next style block marker.
    end_marker = "if(!document.getElementById('pala-calendar-status-row-v155'))"
    end = text.find(end_marker, pos)
    if end < 0:
        raise SystemExit('v155 block end not found')
    text = text[:end] + insert + text[end:]
    controller.write_text(text, encoding='utf-8')

# Make the sandbox order card representative enough to regression-test the action.
t = tests.read_text(encoding='utf-8')
old_card = "showCalendar(){},orderCard:r=>`order-${r.id}`,calendarEvents(){return sandbox.__events||[]},"
new_card = "showCalendar(){},orderCard:r=>`<article>order-${r.id}<div class=\"job-actions\"><button>Pak / Retur</button></div></article>`,calendarEvents(){return sandbox.__events||[]},"
if old_card in t:
    t = t.replace(old_card, new_card, 1)

reg_marker = 'completed orders must not expose Pak / Retur'
if reg_marker not in t:
    block = r'''

// Completed orders are read-only for packing/return from calendar cards.
const completedOrderCard=sandbox.orderCard({id:21,status:'Afsluttet'});
const activeOrderCard=sandbox.orderCard({id:22,status:'På lager'});
assert.ok(!completedOrderCard.includes('Pak / Retur'),'completed orders must not expose Pak / Retur');
assert.ok(activeOrderCard.includes('Pak / Retur'),'active orders must keep Pak / Retur');
'''
    t = t.replace("\nconsole.log('calendar-controller regression tests passed');", block + "\nconsole.log('calendar-controller regression tests passed');")
    tests.write_text(t, encoding='utf-8')

s = sw.read_text(encoding='utf-8')
s = re.sub(r"const CACHE='pala-v[^']+';", "const CACHE='pala-v158-hide-pack-completed';", s, count=1)
s = re.sub(r'calendar-controller\.js\?v=\d+', 'calendar-controller.js?v=8', s)
sw.write_text(s, encoding='utf-8')

idx = index.read_text(encoding='utf-8')
idx = re.sub(r'calendar-controller\.js\?v=\d+', 'calendar-controller.js?v=8', idx)
index.write_text(idx, encoding='utf-8')

if marker not in text:
    raise SystemExit('controller marker missing')
if reg_marker not in t:
    raise SystemExit('regression test missing')
if 'pala-v158-hide-pack-completed' not in s or 'calendar-controller.js?v=8' not in s:
    raise SystemExit('version bump failed')
print('Applied v158 completed-order pack/return restriction')
