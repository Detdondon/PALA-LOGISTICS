(()=>{
const cases=[
 ['Login-kode',()=>showOwnPinDialog()],['Bemandings-PDF',()=>showStaffingExportDialog()],['Produktions-PDF',()=>showProductionPlanExportDialog()],['Teltbemærkning',()=>editTentNote(1)],['Afslut skade',()=>toggleWorkshopTask(1,false)],
 ['Ny ordre',()=>orderForm(null)],['Redigér ordre',()=>orderForm(bookings[0])],
 ['Nyt telt',()=>editTentBasics(null)],['Redigér telt',()=>editTentBasics(1)],
 ['Ny hardware',()=>editCatalogHardware(null)],['Redigér hardware',()=>editCatalogHardware(1)],
 ['Nyt inventar',()=>editInventoryBasics(null)],['Redigér inventar',()=>editInventoryBasics(1)],
 ['Nyt møde',()=>editMeeting(null)],['Redigér møde',()=>editMeeting(1)],
 ['Nyt systuejob',()=>showWorkshopJobForm(null)],['Redigér systuejob',()=>showWorkshopJobForm(1)],
 ['Ny skade',()=>showDamageForm(null,null)],['Redigér skade',()=>editWorkshopDamage(1)],
 ['Ny vagt',()=>{app.innerHTML='<div id="staffAdminEditHost"></div>';editExistingStaffShift(null)}],
 ['Redigér vagt',()=>{app.innerHTML='<div id="staffAdminEditHost"></div>';editExistingStaffShift(1)}],
 ['Ordrevagt',()=>{orderForm(bookings[0]);showOrderShiftForm(1,1)}],
 ['Fravær',()=>{app.innerHTML='<div id="staffAdminEditHost"></div>';showStaffLeaveForm()}],
 ['Ny medarbejder',()=>openNewEmployeeAdminEditor()],['Redigér medarbejder',()=>openEmployeeAdminEditor(100)],
 ['Ny underkategori',()=>openWarehouseCategoryEditor('tent',null,1)],['Redigér underkategori',()=>openWarehouseCategoryEditor('tent',18,1)],
 ['Flyt lagerposter',()=>openWarehouseBulkMove()],['Pakkebehov',()=>{editTentRequirements(1);document.querySelector('#requirementRows').insertAdjacentHTML('beforeend',requirementRow())}],
 ['Teltdele',()=>{openTentAdvanced(1,'Teltdele');const add=[...document.querySelectorAll('#palaEditSheet button')].find(b=>b.textContent.includes('Tilføj del'));add.click()}],['Teltbillede',()=>openTentAdvanced(1,'Billeder')],['Teltdokument',()=>openTentAdvanced(1,'Dokumenter')],['Skadebillede',()=>editDamagePhoto(1)],['Webadresse',()=>showAppAddressDialog()],
 ['Specialhardware',()=>{app.innerHTML='<div id="adminSpecialEditor"></div>';adminSpecialForm(null)}]
];
function snapshot(root){return [...root.querySelectorAll('input,select,textarea')].filter(n=>!n.classList.contains('pala-select-search')&&!n.matches('input[oninput*="filterRelationOptions"]')).map(n=>({node:n,id:n.id,value:n.value,checked:n.checked,callback:n.getAttribute('onchange')}));}
const delay=()=>new Promise(r=>setTimeout(r,80));
function reset(){closeEditSheet(true);document.querySelectorAll('#ownPinDialog,#staffingExportDialog,#productionPlanExportDialog').forEach(n=>n.remove());app.innerHTML='';}
async function runCase(index){reset();cases[index][1]();const before=snapshot(document.getElementById('palaEditSheet')||document.querySelector('.dialog-card')||app);await delay();const roots=[...document.querySelectorAll('.pala-editor')];const errors=[];for(const s of before){if(!s.node.isConnected)errors.push('Felt fjernet: '+s.id);else if(s.node.value!==s.value||s.node.checked!==s.checked||s.node.getAttribute('onchange')!==s.callback)errors.push('Felt ændret: '+s.id)}
for(const root of roots){if(root.querySelectorAll(':scope > .pala-editor-header,:scope > form > .pala-editor-header').length!==1)errors.push('Header');if(!root.querySelector('.pala-editor-actions .pala-editor-save'))errors.push('Gem-knap');if(!root.querySelector('.pala-editor-actions .pala-editor-cancel'))errors.push('Annuller-knap');if(root.querySelector('.swatch-trigger'))errors.push('Gammel dropdown');if([...root.querySelectorAll('select')].some(s=>s.options.length>1&&!s.classList.contains('pala-select-native')))errors.push('Dropdown ikke fælles');if(root.scrollWidth>root.clientWidth+2)errors.push('Vandret overflow');}
if(!roots.length)errors.push('Editor mangler');return {name:cases[index][0],fields:before.length,editors:roots.length,errors};}
async function testComponents(){
 const results=[],check=(name,ok)=>results.push({name,errors:ok?[]:['Fejl']});
 reset();let changes=0,saves=0;
 openEditSheet('Komponenttest','<label for="testSelect">Relation</label><select id="testSelect"><option value="">Ingen</option><optgroup label="Personer"><option value="anna">Anna Andersen</option><option value="jens">Jens Jensen</option></optgroup></select><label for="testRequired">Navn</label><input id="testRequired" required>',async()=>{saves++});
 await delay();const native=document.getElementById('testSelect');native.addEventListener('change',()=>changes++);
 let wrap=native.closest('.pala-select'),button=wrap.querySelector('.pala-select-button'),search=wrap.querySelector('.pala-select-search');
 button.click();search.value='jens';search.dispatchEvent(new Event('input',{bubbles:true}));
 check('Live-filter og ingen falske ugemte ændringer',wrap.querySelectorAll('[role=option]').length===1&&!sheetDirty);
 search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
 check('Tastaturvalg bevarer callback og værdi',native.value==='jens'&&changes===1&&sheetDirty&&document.activeElement===button);
 wrap.querySelector('.pala-select-clear').click();check('Ryd valg',native.value===''&&changes===2);
 native.add(new Option('Café telt','east'));await delay();button.click();search.value='cafe';search.dispatchEvent(new Event('input',{bubbles:true}));
 check('Dynamiske muligheder og accentsøgning',wrap.querySelector('[role=option]')?.textContent==='Café telt');
 search.value='Café';search.dispatchEvent(new Event('input',{bubbles:true}));wrap.querySelector('[role=option]')?.click();
 check('Touch/click vælger dynamisk mulighed',native.value==='east');
 native.disabled=true;await delay();check('Disabled synkroniseres',button.disabled);native.disabled=false;await delay();
 document.querySelector('.pala-editor-save').click();await delay();check('Feltfejl stopper gem og er dansk',saves===0&&document.getElementById('testRequired').getAttribute('aria-invalid')==='true'&&document.querySelector('.pala-field-error')?.textContent==='Udfyld dette felt.');
 document.getElementById('testRequired').value='Test';document.getElementById('testRequired').dispatchEvent(new Event('input',{bubbles:true}));
 document.querySelector('.pala-editor-save').click();await delay();check('Original gem-callback køres én gang',saves===1&&!document.getElementById('palaEditSheet'));
 openEditSheet('Multivalg','<label for="testMulti">Deltagere</label><select id="testMulti" multiple><option value="a">Anna</option><option value="j">Jens</option></select>',async()=>{});await delay();
 const multi=document.getElementById('testMulti');const mw=multi.closest('.pala-select');mw.querySelector('.pala-select-button').click();mw.querySelector('[role=option]').click();mw.querySelectorAll('[role=option]')[1].click();check('Multivalg bevarer begge værdier',multi.selectedOptions.length===2);
 document.querySelector('.pala-editor-close').click();await delay();check('Fælles Luk bevarer eksisterende annullering',!document.getElementById('palaEditSheet'));
 await runCase(cases.findIndex(c=>c[0]==='Teltbemærkning'));document.getElementById('s_tent_note').value='Testnote';document.querySelector('.pala-editor-save').click();await delay();const rpc=JSON.parse(document.getElementById('fixture-rpc').textContent||'{}');check('Teltbemærkning bevarer databasekald',rpc.name==='employee_save_tent_note'&&rpc.args.p_tent_id===1&&rpc.args.p_note==='Testnote');
 reset();return results;
}
window.addEventListener('load',()=>setTimeout(()=>{
const panel=document.createElement('aside');panel.id='fixture-controls';panel.style.cssText='padding:12px;background:#eef5ff;position:relative;z-index:10';
const select=document.createElement('select');select.id='fixture-case';select.setAttribute('aria-label','Testeditor');cases.forEach(([label],i)=>select.add(new Option(label,String(i))));panel.append(select);
const open=document.createElement('button');open.textContent='Åbn testeditor';open.onclick=()=>runCase(+select.value);panel.append(open);
const all=document.createElement('button');all.textContent='Test alle editorer';all.onclick=async()=>{all.disabled=true;const results=[];for(let i=0;i<cases.length;i++)try{results.push(await runCase(i))}catch(e){results.push({name:cases[i][0],errors:[e.message]})}reset();const output=document.getElementById('fixture-results');output.textContent=JSON.stringify(results);all.disabled=false;};panel.append(all);
const component=document.createElement('button');component.textContent='Test komponenter';component.onclick=async()=>{try{document.getElementById('fixture-results').textContent=JSON.stringify(await testComponents())}catch(error){document.getElementById('fixture-results').textContent=JSON.stringify({error:error.message})}};panel.append(component);
const result=document.createElement('pre');result.id='fixture-results';result.style.cssText='white-space:pre-wrap;max-height:120px;overflow:auto';panel.append(result);const rpc=document.createElement('pre');rpc.id='fixture-rpc';panel.append(rpc);document.body.prepend(panel);
},400));
})();
