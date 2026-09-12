from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v117 · consistent warehouse add classification'
if marker in text:
    raise SystemExit('PALA v117 already present')
needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Could not find final script marker')
patch=r'''

/* PALA v117 · consistent warehouse add classification */
const categoryFieldV117=categoryField;
categoryField=function(kind,item){
  let rows=categoriesFor(kind),current=+item?.category_id||0;
  let placeholder=rows.length>1&&!current?'<option value="" selected disabled>Vælg kategori…</option>':'';
  return `<div class="sheet-field warehouse-category-field"><label for="s_category_id">Kategori</label><select id="s_category_id" required>${placeholder}${rows.map((c,index)=>`<option value="${c.id}" ${current?+c.id===current:(rows.length===1&&index===0)?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>`;
};
installSheetCategory=function(kind,item){
  let root=document.querySelector('#palaEditSheet .sheet-body');if(!root)return;
  let existing=root.querySelector('#s_category_id');
  if(existing){
    let field=existing.closest('.warehouse-category-field,.sheet-field');
    if(field)field.remove();else existing.remove();
  }
  let classification=document.createElement('div');classification.className='warehouse-add-classification';
  classification.insertAdjacentHTML('beforeend',categoryField(kind,item));
  if(kind==='hardware'){
    let sub=root.querySelector('#s_category');
    if(sub){
      let subField=sub.parentElement,oldPair=subField?.parentElement,label=root.querySelector('label[for="s_category"]');
      if(label)label.textContent='Underkategori';
      sub.required=true;
      if(subField){subField.classList.add('warehouse-subcategory-field');classification.appendChild(subField)}
      if(oldPair?.classList.contains('two')&&oldPair.children.length===1)oldPair.classList.remove('two');
    }
  }
  classification.insertAdjacentHTML('beforeend','<p class="small muted warehouse-classification-hint">Vælg hvor posten skal placeres i lageroversigten.</p>');
  root.prepend(classification);
  installWarehouseSelectSearch(root);
};
'''
text=text.replace(needle,patch+needle,1)
if text.count(marker)!=1: raise SystemExit('Marker verification failed')
if "label.textContent='Underkategori'" not in text: raise SystemExit('Hardware subcategory preservation missing')
path.write_text(text,encoding='utf-8')
print('Applied PALA v117 warehouse add classification')
