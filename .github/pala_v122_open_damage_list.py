from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v122 · open damages button opens list view'
if marker in text:
    raise SystemExit('PALA v122 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v122 · open damages button opens list view */
function showOpenWorkshopDamageListV122(){
  workshopFilter='open';
  localStorage.setItem('pala_workshop_filter','open');
  workshopSelectedDate='';
  if(workshopViewMode!=='list')return setWorkshopView('list');
  showWorkshop('open');
}
function bindOpenWorkshopDamageListV122(){
  app.querySelectorAll('button[aria-label="Vis åbne skader"]').forEach(button=>{
    button.setAttribute('onclick','showOpenWorkshopDamageListV122()');
    button.setAttribute('title','Vis åbne skader som liste');
  });
}
const showWorkshopV122=showWorkshop;
showWorkshop=function(){let result=showWorkshopV122.apply(this,arguments);bindOpenWorkshopDamageListV122();return result};
'''
text=text.replace(needle,patch+needle,1)
if text.count(marker)!=1:
    raise SystemExit('Marker verification failed')
for required in ['showOpenWorkshopDamageListV122','bindOpenWorkshopDamageListV122','Vis åbne skader som liste']:
    if required not in text:
        raise SystemExit(f'Missing required marker: {required}')
path.write_text(text,encoding='utf-8')
print('Applied PALA v122 open damage list patch')
