from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = '<script src="calendar-stability.js?v=2"></script></body></html>'
new = '<script src="calendar-stability.js?v=2"></script><script src="calendar-order-fixes.js?v=1"></script></body></html>'

if 'calendar-order-fixes.js?v=1' in text:
    raise SystemExit('calendar-order-fixes already linked')
if old not in text:
    raise SystemExit('Expected calendar-stability footer not found')

path.write_text(text.replace(old, new, 1), encoding='utf-8')
