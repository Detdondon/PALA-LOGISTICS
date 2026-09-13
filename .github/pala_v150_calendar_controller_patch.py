from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
old='<script src="calendar-stability.js?v=2"></script><script src="calendar-order-fixes.js?v=1"></script>'
new='<script src="calendar-controller.js?v=1"></script>'

if new in text and old not in text:
    print('calendar controller already linked')
elif old in text:
    text=text.replace(old,new,1)
    path.write_text(text,encoding='utf-8')
    print('linked production calendar controller')
else:
    raise SystemExit('Expected legacy calendar script pair not found')
