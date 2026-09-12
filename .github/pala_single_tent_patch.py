from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

old = '''function warehouseGroupedRows(rows,keyFn,cardFn){
  let groups=new Map();rows.forEach(row=>{let key=keyFn(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  return `<div class="warehouse-groups">${[...groups.entries()].sort((a,b)=>alpha(a[0],b[0])).map(([name,items])=>`<details class="warehouse-group"><summary><span>${esc(name)}</span><span class="warehouse-group-count">${items.length}</span></summary><div class="warehouse-list">${items.sort((a,b)=>alpha(a.name,b.name)).map(cardFn).join('')}</div></details>`).join('')}</div>`;
}'''
new = '''function warehouseGroupedRows(rows,keyFn,cardFn,flatSingles=false){
  let groups=new Map();rows.forEach(row=>{let key=keyFn(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  return `<div class="warehouse-groups">${[...groups.entries()].sort((a,b)=>alpha(a[0],b[0])).map(([name,items])=>{items.sort((a,b)=>alpha(a.name,b.name));return flatSingles&&items.length===1?`<div class="warehouse-list">${cardFn(items[0])}</div>`:`<details class="warehouse-group"><summary><span>${esc(name)}</span><span class="warehouse-group-count">${items.length}</span></summary><div class="warehouse-list">${items.map(cardFn).join('')}</div></details>`}).join('')}</div>`;
}'''

if old not in text:
    raise SystemExit('warehouseGroupedRows definition not found exactly')
text = text.replace(old, new, 1)

replacements = {
    'warehouseGroupedRows(tr,tentGroupName,tc)': 'warehouseGroupedRows(tr,tentGroupName,tc,true)',
    'warehouseGroupedRows(items,tentGroupName,render)': 'warehouseGroupedRows(items,tentGroupName,render,true)',
    'warehouseGroupedRows(tentRows,t=>tentGroupName(t),tentCard)': 'warehouseGroupedRows(tentRows,t=>tentGroupName(t),tentCard,true)',
    'warehouseGroupedRows(tr,t=>tentGroupName(t),tc)': 'warehouseGroupedRows(tr,t=>tentGroupName(t),tc,true)',
}
changed = 0
for src, dst in replacements.items():
    count = text.count(src)
    if count:
        text = text.replace(src, dst)
        changed += count

if changed < 1:
    raise SystemExit('No tent grouping calls were patched')

path.write_text(text, encoding='utf-8')
print(f'Patched {changed} tent grouping call(s)')
