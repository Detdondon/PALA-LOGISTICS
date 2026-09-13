from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
marker = '<script src="calendar-stability.js?v=2"></script>'

if marker in text:
    raise SystemExit('Calendar stability v2 already linked')

if '</body>' not in text:
    raise SystemExit('Could not find </body> in index.html')

# Load the calendar stability layer directly from the main document. This avoids
# depending on a service-worker refresh before the full status filter becomes available.
text = text.replace('</body>', marker + '</body>', 1)
path.write_text(text, encoding='utf-8')
