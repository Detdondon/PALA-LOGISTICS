from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = '''<button type="button" class="pill reference-button" onclick="showWorkshop('open')" aria-label="Vis telte med skader">${uiIcon('tent')}${tentCount} ${tentCount===1?'telt med skade':'telte med skader'}</button>'''
if old not in text:
    raise SystemExit('Could not find duplicate workshop damage button')
text = text.replace(old, '', 1)
if 'aria-label="Vis telte med skader"' in text:
    raise SystemExit('Duplicate workshop damage button still present')
path.write_text(text, encoding='utf-8')
print('Removed redundant workshop damaged-tents button')
