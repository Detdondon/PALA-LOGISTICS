/* PALA Editor v288. Presentation adapters: original controls and callbacks stay authoritative. */
(()=>{
'use strict';
if(window.PALAEditor)return;
const ROOTS='#palaEditSheet,.order-editor-page,.workshop-form,.staff-form,.damage-form-card,.admin-special-card,.admin-inventory-editor,.new-tent-form,#ownPinDialog .dialog-card,#staffingExportDialog .dialog-card,#productionPlanExportDialog .dialog-card';
const SECTION_NAMES=['Grundoplysninger','Relationer / tilknytning','Dato, tid og antal','Personer / ressourcer','Noter','Avancerede indstillinger'];
const selectStates=new WeakMap(),editorStates=new WeakMap();
let serial=0,opened=null,queued=false;
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('da').trim();
const owned=(root,node)=>node.closest(ROOTS)===root;
function nativeLabel(select){
  if(select.id==='esrelation')return 'Job / ordre / systuejob';
  const label=select.labels?.[0];
  if(label){const clone=label.cloneNode(true);clone.querySelectorAll('select,input,button,.pala-select').forEach(n=>n.remove());return clone.querySelector('strong')?.textContent.trim()||clone.textContent.trim()||'Vælg';}
  return select.getAttribute('aria-label')||select.previousElementSibling?.textContent.trim()||'Vælg';
}
function closeSelect(focus=false){if(!opened)return;const s=opened;opened=null;s.panel.hidden=true;s.button.setAttribute('aria-expanded','false');s.search.removeAttribute('aria-activedescendant');if(focus&&s.button.isConnected)s.button.focus();}
function syncSelect(s){
  const selected=[...s.select.selectedOptions].map(o=>o.textContent.trim());
  const text=selected.join(', ')||'Vælg…';
  if(s.value.textContent!==text)s.value.textContent=text;
  s.button.disabled=s.select.disabled;s.button.setAttribute('aria-required',String(s.select.required));
  const canClear=!s.select.required&&[...s.select.options].some(o=>o.value===''&&!o.disabled);
  s.clear.hidden=!canClear||s.select.value==='';s.clear.disabled=s.select.disabled;
  if(opened===s)renderOptions(s);
}
function choose(s,index){
  const option=s.select.options[index];if(!option||option.disabled||option.parentElement?.disabled)return;
  if(s.select.multiple)option.selected=!option.selected;else s.select.selectedIndex=index;
  s.select.dispatchEvent(new Event('input',{bubbles:true}));
  s.select.dispatchEvent(new Event('change',{bubbles:true}));
  syncSelect(s);if(!s.select.multiple)closeSelect(true);else renderOptions(s);
}
function highlight(s,index){
  if(!s.visible.length)return;
  s.active=Math.max(0,Math.min(index,s.visible.length-1));
  [...s.list.querySelectorAll('[role=option]')].forEach((n,i)=>{n.classList.toggle('is-active',i===s.active);if(i===s.active){s.search.setAttribute('aria-activedescendant',n.id);n.scrollIntoView({block:'nearest'});}});
}
function renderOptions(s){
  const signature=JSON.stringify([...s.select.options].map(o=>[o.value,o.textContent,o.selected,o.hidden,o.disabled,o.parentElement.label,o.parentElement.disabled]))+'|'+s.search.value;if(s.signature===signature)return;s.signature=signature;
  const query=norm(s.search.value),frag=document.createDocumentFragment();s.visible=[];let lastGroup=null;
  [...s.select.options].forEach((o,index)=>{
    const group=o.parentElement.tagName==='OPTGROUP'?o.parentElement.label:'';
    if(o.hidden||o.disabled||o.parentElement.disabled||!norm(group+' '+o.textContent).includes(query))return;
    if(group&&group!==lastGroup){frag.append(make('div','pala-select-group',group));lastGroup=group;}
    const row=make('div','pala-select-option',o.textContent);if(/^#[0-9a-f]{6}$/i.test(o.value)){const dot=make('span','color-square');dot.style.background=o.value;row.prepend(dot);}
    row.id=s.list.id+'-'+index;row.setAttribute('role','option');row.setAttribute('aria-selected',String(o.selected));row.dataset.index=String(index);
    row.addEventListener('pointerdown',e=>e.preventDefault());row.addEventListener('click',()=>choose(s,index));frag.append(row);s.visible.push(index);
  });
  if(!s.visible.length)frag.append(make('p','pala-select-empty','Ingen muligheder matcher din søgning.'));
  s.list.replaceChildren(frag);s.status.textContent=s.visible.length+' muligheder';
  s.active=Math.max(0,s.visible.indexOf(s.select.selectedIndex));
  if(s.visible.length)highlight(s,s.active);else s.search.removeAttribute('aria-activedescendant');
}
function openSelect(s){
  closeSelect();if(s.select.disabled)return;opened=s;s.signature=null;s.search.value='';s.panel.hidden=false;s.button.setAttribute('aria-expanded','true');renderOptions(s);s.search.focus();
}
function enhanceSelect(select){
  if(selectStates.has(select)){syncSelect(selectStates.get(select));return;}
  if(select.options.length<2)return;
  // Preserve the original select, its identity, options, form association and events.
  const wrap=make('div','pala-select'),button=make('button','pala-select-button'),value=make('span'),clear=make('button','pala-select-clear','×'),panel=make('div','pala-select-panel');
  const swatch=select.closest('.swatch-picker');if(swatch){swatch.querySelectorAll('.swatch-trigger,.swatch-options').forEach(n=>n.remove());select.hidden=false;const labelNode=document.getElementById(select.id+'Label');if(labelNode)labelNode.htmlFor=select.id;}
  const label=nativeLabel(select);if(!select.id)select.id='pala-native-select-'+(++serial);
  button.type=clear.type='button';button.setAttribute('aria-label',label);button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  value.className='pala-select-value';if(swatch){const dot=make('span','color-square');dot.dataset.colorFor=select.id;dot.style.background=select.value||'#C9A35E';button.append(dot);}
  button.append(value,make('span','pala-select-chevron','⌄'));clear.setAttribute('aria-label','Ryd '+label);
  const search=make('input','pala-select-search');search.type='search';search.placeholder='Søg…';search.autocomplete='off';search.setAttribute('aria-label','Søg i '+label);search.setAttribute('role','combobox');search.setAttribute('aria-autocomplete','list');search.setAttribute('aria-expanded','true');
  const list=make('div','pala-select-options');list.id='pala-select-options-'+(++serial);list.setAttribute('role','listbox');list.setAttribute('aria-label',label);if(select.multiple)list.setAttribute('aria-multiselectable','true');
  button.setAttribute('aria-controls',list.id);search.setAttribute('aria-controls',list.id);
  const status=make('span','pala-sr-only');status.setAttribute('role','status');panel.hidden=true;panel.append(search,list,status);
  select.before(wrap);wrap.append(select,button,clear,panel);select.classList.add('pala-select-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  const s={select,wrap,button,value,clear,panel,search,list,status,active:0,visible:[]};selectStates.set(select,s);
  button.addEventListener('click',()=>opened===s?closeSelect(true):openSelect(s));
  button.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();openSelect(s);}});
  clear.addEventListener('click',()=>choose(s,[...select.options].findIndex(o=>o.value===''&&!o.disabled)));
  search.addEventListener('input',e=>{e.stopPropagation();renderOptions(s);});
  search.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSelect(true);}
    else if(e.key==='Tab')closeSelect();
    else if(e.key==='Enter'){e.preventDefault();if(s.visible.length)choose(s,s.visible[s.active]);}
    else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();highlight(s,e.key==='Home'?0:e.key==='End'?s.visible.length-1:s.active+(e.key==='ArrowDown'?1:-1));}
  });
  select.addEventListener('change',()=>syncSelect(s));select.addEventListener('focus',()=>button.focus());
  syncSelect(s);
}
function labelFields(root){
  root.querySelectorAll('label').forEach(label=>{
    if(label.htmlFor||label.querySelector('input,select,textarea'))return;
    let control=label.nextElementSibling;if(control?.matches('.pala-select'))control=control.querySelector('select');
    if(control?.matches('input,select,textarea')){if(!control.id)control.id='pala-field-'+(++serial);label.htmlFor=control.id;}
  });
}
function fieldGroup(node){
  const ids=[...node.querySelectorAll('input,select,textarea')].map(n=>n.id+' '+n.type).join(' ');
  const caption=(node.matches('label')?node.textContent:node.querySelector('summary,h3,label')?.textContent)||'';
  const key=norm(ids+' '+caption+' '+node.className+' '+node.id);
  if(node.matches('.staff-bulk-picker')||node.querySelector('.staff-bulk-picker'))return 3;
  if(/number/.test(key)&&node.querySelectorAll('input,select,textarea').length===1)return 2;
  if(/pin|password|adgang|administrator|cancelled|aflys|public_url|farve|color|material|billede|dokument|files|file|advanced|avanceret/.test(key))return 5;
  if(/noter|notes|description|beskriv|onotes|idsc/.test(key))return 4;
  if(/staffchoice|staff-choice|medarbejd|deltager|employee|leader|hold|resource|pakkebehov|standardhardware|requirement|tentparts|sheet-checks/.test(key))return 3;
  if(/category|parent|relation|tilknyt|kobling|damageTent|damageBooking|editDamageTent|editDamageBooking/i.test(key))return 1;
  if(/date|time|number|dato|antal|mål|area|diameter|length|width|height|qty|stock/.test(key))return 2;
  return 0;
}
function section(container,index){
  let node=[...container.children].find(n=>n.dataset?.editorSection===String(index));
  if(!node){node=make('section','pala-editor-section');node.dataset.editorSection=String(index);const title=make('h3','pala-editor-section-title',SECTION_NAMES[index]);node.append(title,make('div','pala-editor-fields'));container.append(node);}
  if(!node.querySelector('.pala-editor-fields')){const fields=make('div','pala-editor-fields');node.append(fields);}
  return node;
}
function wrapLooseFields(container){
  [...container.children].forEach(node=>{
    if(node.matches('.two,.three')&&!node.id){wrapLooseFields(node);node.replaceWith(...node.childNodes);return;}
    if(node.matches('input[type=search]')&&node.nextElementSibling?.matches('.sheet-checks')){const pair=make('div','pala-editor-wide');node.before(pair);const list=node.nextElementSibling;pair.append(node,list);return;}
    if(node.tagName!=='LABEL'||node.querySelector('input,select,textarea'))return;
    if(node.nextElementSibling?.matches('p.small')&&node.nextElementSibling.nextElementSibling?.matches('.staff-bulk-picker')){const field=make('div','pala-editor-wide');node.before(field);const hint=node.nextElementSibling,list=hint.nextElementSibling;field.append(node,hint,list);return;}
    const next=node.nextElementSibling;if(!next?.matches('input,select,textarea,.pala-select,.swatch-picker,.staff-choice-list,.sheet-checks,.tent-link-grid'))return;
    const field=make('div','pala-editor-field');node.before(field);field.append(node,next);
    let help=field.nextElementSibling;if(help?.matches('p.small,.small.muted')&&!help.querySelector('button,input,select'))field.append(help);
  });
}
function arrangeFields(container){
  wrapLooseFields(container);
  [...container.children].forEach(node=>{
    if(node.matches('.pala-editor-section,.pala-editor-header,.pala-editor-actions,.sheet-error,[role=alert]')||node.hidden)return;
    const target=section(container,fieldGroup(node)).querySelector('.pala-editor-fields');target.append(node);
    node.classList.add('pala-editor-unit');
    if(node.matches('details')||node.querySelector('textarea,input[type=file],.sheet-checks,.staff-choice-list,.tent-link-grid')||!node.querySelector('input,select'))node.classList.add('pala-editor-wide');
  });
  [...container.querySelectorAll(':scope > .pala-editor-section')].sort((a,b)=>+a.dataset.editorSection-+b.dataset.editorSection).forEach(n=>container.append(n));
  const resources=[...container.querySelectorAll(':scope > .pala-editor-section')].find(n=>n.dataset.editorSection==='3');
  if(resources){
    const hardwareContext=!!resources.querySelector('#requirementRows,.requirement-row')||
      [...resources.querySelectorAll('summary')].some(summary=>/^Standardhardware$/i.test(summary.textContent.trim()));
    if(hardwareContext){
      const title=resources.querySelector('.pala-editor-section-title');
      if(title)title.textContent='Hardware';
    }
  }
}
function findSave(root){return [...root.querySelectorAll('button')].find(b=>owned(root,b)&&(b.type==='submit'&&root.id==='palaEditSheet'||/^save[A-Z]|^create[A-Z]|^changeOwnPin\(|^export(?:Staffing|Production)PlanPDF\(/.test(b.getAttribute('onclick')||'')));}
function findCancel(root){return [...root.querySelectorAll('button')].find(b=>owned(root,b)&&/^(Annuller|Luk|Tilbage)$/.test(b.textContent.trim())&&!b.closest('.sheet-body'));}
function actionBar(root,state){
  let bar=state.bar;if(!bar){bar=root.querySelector('.sheet-footer,.order-save-bar,.dialog-actions')||make('div');bar.classList.add('pala-editor-actions');state.bar=bar;if(!bar.parentNode)root.append(bar);}
  const save=state.save||findSave(root);if(save){state.save=save;save.classList.add('pala-editor-save');if(!save.dataset.editorLabel){save.dataset.editorLabel=save.textContent.trim();if(/^Gem\b/.test(save.textContent.trim())||root.closest('#ownPinDialog'))save.textContent='Gem ændringer';}if(save.parentNode!==bar)bar.append(save);}
  const cancel=state.cancel||findCancel(root);
  if(cancel){state.cancel=cancel;cancel.classList.add('pala-editor-cancel');cancel.textContent='Annuller';if(cancel.parentNode!==bar)bar.append(cancel);}
  [...root.querySelectorAll('button')].filter(b=>owned(root,b)&&!b.closest('.pala-editor-actions')&&(/^(delOrder|deleteExistingStaffShift|deleteSpecialHardware|deleteAdminInv)\(/.test(b.getAttribute('onclick')||'')||b.dataset.deleteWorkshopDamage||b.dataset.deleteEmployeeV183)).forEach(b=>bar.prepend(b));
  [...bar.children].forEach(b=>{if(b.matches('button.bad'))b.classList.add('pala-editor-delete');});
  if(save&&bar.lastElementChild!==save)bar.append(save);if(cancel&&(save?save.previousElementSibling!==cancel:bar.lastElementChild!==cancel))bar.insertBefore(cancel,save||null);
}
function header(root,state){
  if(state.header)return;
  const old=root.querySelector('.sheet-head,.order-editor-head,:scope > .row');
  const title=old?.querySelector('h2,h3')||root.querySelector('h2,h3');if(!title)return;
  const head=make('div','pala-editor-header');head.append(title);state.header=head;
  const close=make('button','btn pala-editor-close','Luk');close.type='button';close.setAttribute('aria-label','Luk redigering');close.addEventListener('click',()=>state.cancel?.click());head.append(close);
  if(root.id==='palaEditSheet'){
    const form=root.querySelector('form');old?.remove();form.prepend(head);
  }else{
    root.prepend(head);
    // Keep tools such as PDF and packing; place them in the advanced section later.
    if(old){old.querySelectorAll('button').forEach(b=>{if(/^(Tilbage|Annuller|Luk)$/.test(b.textContent.trim())&&b!==state.cancel)b.remove();});if(!old.querySelector('button,input,select,textarea'))old.remove();}
  }
}
function orderLayout(root){
  const notes=root.querySelector('#onotes')?.closest('.order-field');
  const cards=[...root.children].filter(n=>n.classList.contains('card'));
  for(const card of cards){
    const title=card.querySelector('h3');
    let index=card.querySelector('#on')?0:card.querySelector('#os')?2:card.querySelector('#orderTentPicker,#orderInventoryPicker,.staff-choice-list,#orderShiftHost')?3:5;
    card.classList.add('pala-editor-section');card.dataset.editorSection=String(index);if(index===5&&!title)card.prepend(make('h3','pala-editor-section-title',SECTION_NAMES[5]));if(title){title.classList.add('pala-editor-section-title');title.querySelector('.order-step')?.remove();}
  }
  const basic=root.querySelector('#on')?.closest('.pala-editor-section');
  if(basic)basic.querySelector('h3').textContent=SECTION_NAMES[0];
  const dates=root.querySelector('#os')?.closest('.pala-editor-section');
  if(dates)dates.querySelector('h3').textContent=SECTION_NAMES[2];
  const status=root.querySelector('#ost')?.closest('.order-field');
  if(status&&basic)basic.querySelector('.order-field-grid').append(status);
  const color=root.querySelector('#ocolor')?.closest('.order-field');
  if(color){const advanced=section(root,5);advanced.querySelector('.pala-editor-fields').append(color);}
  if(notes){const s=section(root,4);s.querySelector('.pala-editor-fields').append(notes);notes.classList.add('pala-editor-wide');}
  const body=make('div','pala-editor-body');root.insertBefore(body,root.querySelector('.pala-editor-actions'));
  [...root.children].filter(n=>n.matches('.pala-editor-section')).sort((a,b)=>+a.dataset.editorSection-+b.dataset.editorSection).forEach(n=>body.append(n));
  return body;
}
function fallbackCancel(root){
  const button=make('button','btn','Annuller');button.type='button';
  button.addEventListener('click',()=>{if(root.matches('.admin-special-card'))window.showAdminSpecialHardware();else if(root.matches('.admin-inventory-editor'))window.showAdminInventory();else window.showCalendar();});
  root.append(button);return button;
}
function decorate(root){
  let state=editorStates.get(root);
  if(!state){
    state={};editorStates.set(root,state);root.classList.remove('pala-complex-edit-popup-v185','pala-complex-edit-card-v185');root.classList.add('pala-editor');
    state.save=findSave(root);state.cancel=findCancel(root)||fallbackCancel(root);
    actionBar(root,state);header(root,state);
    if(root.matches('.order-editor-page'))state.body=orderLayout(root);
    else if(root.id==='palaEditSheet')state.body=root.querySelector('.sheet-body');
    else{state.body=make('div','pala-editor-body');[...root.children].filter(n=>n!==state.header&&n!==state.bar).forEach(n=>state.body.append(n));root.insertBefore(state.body,state.bar);}
    if(!root.matches('.order-editor-page'))arrangeFields(state.body);
    root.querySelectorAll('#employeeNewPinV183,#employeeEditPinV183,#ownNewPin').forEach(c=>{c.pattern='[0-9]{4,8}';if(c.id!=='employeeEditPinV183')c.required=true;});
    root.querySelectorAll('#damageTent,#damageDescription,#workshopTitle,#workshopStart,#workshopEnd,#os,#oe,#esdate,#osdate,#leaveStart,#leaveEnd,#leaveEmployee').forEach(c=>c.required=true);
    root.addEventListener('invalid',e=>{e.preventDefault();showError(e.target,validationMessage(e.target));},true);
    root.addEventListener('input',e=>clearError(e.target));root.addEventListener('change',e=>clearError(e.target));
    root.addEventListener('click',e=>{if(e.target.closest('.pala-editor-save')&&owned(root,e.target)&&!validate(root)){e.preventDefault();e.stopImmediatePropagation();}},true);
    root.addEventListener('submit',e=>{if(owned(root,e.target)&&!validate(root)){e.preventDefault();e.stopImmediatePropagation();}},true);
  }
  actionBar(root,state);
  if(!root.matches('.order-editor-page')){
    const fresh=[...state.body.children].some(n=>!n.matches('.pala-editor-section,.sheet-error,[role=alert]')&&!n.hidden);
    if(fresh)arrangeFields(state.body);
  }
  root.classList.remove('pala-complex-edit-popup-v185','pala-complex-edit-card-v185');
  if(root.matches('.order-editor-page')){const late=root.querySelector(':scope > #newOrderStaffingCard');if(late){late.classList.add('pala-editor-section');late.dataset.editorSection='3';late.querySelector('.order-step')?.remove();const before=[...state.body.children].find(n=>+n.dataset.editorSection>3);state.body.insertBefore(late,before||null);}}
  labelFields(root);
  root.querySelectorAll('select').forEach(enhanceSelect);
  // Superseded select-only search inputs; checkbox/person filters remain intact.
  root.querySelectorAll('input[oninput*="filterRelationOptions"]').forEach(input=>input.closest('.relation-search')?.remove());
}
function clearError(control){
  if(!control?.dataset?.editorError)return;
  document.getElementById(control.dataset.editorError)?.remove();control.removeAttribute('aria-invalid');const proxy=selectStates.get(control);if(proxy){proxy.button.removeAttribute('aria-invalid');proxy.button.removeAttribute('aria-describedby');}
  const ids=(control.getAttribute('aria-describedby')||'').split(' ').filter(id=>id!==control.dataset.editorError);if(ids.length)control.setAttribute('aria-describedby',ids.join(' '));else control.removeAttribute('aria-describedby');delete control.dataset.editorError;
}
function showError(control,message){
  clearError(control);const error=make('p','pala-field-error',message);error.id='pala-field-error-'+(++serial);error.setAttribute('role','alert');
  const proxy=selectStates.get(control);(proxy?.wrap||control).after(error);control.dataset.editorError=error.id;control.setAttribute('aria-invalid','true');control.setAttribute('aria-describedby',((control.getAttribute('aria-describedby')||'')+' '+error.id).trim());
  if(proxy){proxy.button.setAttribute('aria-invalid','true');proxy.button.setAttribute('aria-describedby',error.id);}
}
function validationMessage(control){
  const v=control.validity;
  if(v.valueMissing)return control.tagName==='SELECT'?'Vælg en mulighed.':'Udfyld dette felt.';
  if(v.typeMismatch)return control.type==='email'?'Skriv en gyldig e-mailadresse.':'Skriv en gyldig webadresse.';
  if(v.patternMismatch)return /Pin/.test(control.id)?'Brug 4–8 cifre.':'Kontrollér feltets format.';
  if(v.rangeUnderflow)return 'Værdien skal være mindst '+control.min+'.';
  if(v.rangeOverflow)return 'Værdien må højst være '+control.max+'.';
  if(v.badInput||v.stepMismatch)return 'Skriv en gyldig talværdi.';
  return control.validationMessage||'Kontrollér dette felt.';
}
function validate(root){
  let first=null;
  for(const c of root.querySelectorAll('input,select,textarea')){
    if(!owned(root,c)||c.disabled||c.closest('[hidden]')||c.matches('.pala-select-search'))continue;
    clearError(c);if(!c.validity.valid){showError(c,validationMessage(c));first||=c;}
  }
  const pairs=[['os','oe'],['odelivery','opickup'],['workshopStart','workshopEnd'],['leaveStart','leaveEnd'],['s_start_date','s_end_date'],['staffExportStart','staffExportEnd'],['productionPlanStart','productionPlanEnd']];
  for(const [from,to] of pairs){const a=root.querySelector('#'+from),b=root.querySelector('#'+to);if(a?.value&&b?.value&&b.value<a.value){showError(b,'Slutdato skal være samme dag eller senere end startdatoen.');first||=b;}}
  const pin=root.querySelector('#ownNewPin'),again=root.querySelector('#ownNewPinAgain');if(pin&&again&&pin.value!==again.value){showError(again,'De to nye koder er ikke ens.');first||=again;}
  if(first){let details=first.closest('details');if(details)details.open=true;(selectStates.get(first)?.button||first).focus();return false;}return true;
}
function scan(){
  if(opened&&!opened.select.isConnected)closeSelect();
  document.querySelectorAll(ROOTS).forEach(decorate);
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;observer.disconnect();try{scan();}finally{observe();}});}
const observer=new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.target.matches?.('select,option,optgroup')))schedule();});
function observe(){observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label','hidden','required']});}
document.addEventListener('pointerdown',e=>{if(opened&&!opened.wrap.contains(e.target))closeSelect();});
document.addEventListener('focusin',e=>{if(opened&&!opened.wrap.contains(e.target))closeSelect();});
document.addEventListener('reset',()=>queueMicrotask(scan),true);
window.PALAEditor={refresh:schedule,enhanceSelect,validate,closeSelect,sectionNames:SECTION_NAMES};
scan();observe();
})();
