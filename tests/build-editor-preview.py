"""Build an isolated editor test page. No production API calls or service worker."""
from pathlib import Path
import re, shutil, sys, time
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'editor-preview'
out.mkdir(parents=True,exist_ok=True)
for p in root.iterdir():
    if p.is_file() and p.suffix in ('.js','.css','.svg','.png','.webmanifest'): shutil.copy2(p,out/p.name)
shutil.copytree(root/'fonts',out/'fonts',dirs_exist_ok=True)
for filename in ('editor-test-data.js','editor-browser-fixture.js','calendar-card-fixture.js'): shutil.copy2(root/'tests'/filename,out/filename)
html=(root/'app.html').read_text()
scripts=re.search(r"\| replace: '<!-- PALA_RUNTIME_SCRIPTS -->', '(.*?)'",(root/'index.html').read_text()).group(1)
html=html.replace('<!-- PALA_RUNTIME_SCRIPTS -->',scripts)
html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','<script src="editor-test-data.js"></script>',html)
html=re.sub(r'<script src="pala-pwa.js[^"\n]*"></script>','',html)
html=html.replace('</body>','<script src="editor-browser-fixture.js"></script><script src="calendar-card-fixture.js"></script></body>')
version=str(int(time.time()))
html=re.sub(r'(src|href)="([^"\n]+\.(?:js|css)(?:\?[^"\n]*)?)"',lambda m:m[1]+'="'+m[2]+('&' if '?' in m[2] else '?')+'editor_test='+version+'"',html)
filename='editor-run-'+version+'.html'
(out/filename).write_text(html)
print(filename)
