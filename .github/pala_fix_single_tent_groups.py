from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
start_marker = 'warehouseGroupedRows=function(rows,keyFn,cardFn){'
end_marker = '\nfunction editTentBasics(id){'
start = text.find(start_marker)
if start < 0:
    raise SystemExit('Could not find v104 warehouseGroupedRows override')
end = text.find(end_marker, start)
if end < 0:
    raise SystemExit('Could not find end of warehouseGroupedRows override')
replacement = r'''warehouseGroupedRows=function(rows,keyFn,cardFn,flatSingles=false){
  let groups=new Map();
  rows.forEach(function(row){let key=keyFn(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  let entries=[...groups.entries()].sort(function(a,b){
    let ao=Math.min(...a[1].map(function(row){return Number(row?.sort_order??999999)})),
        bo=Math.min(...b[1].map(function(row){return Number(row?.sort_order??999999)}));
    return ao-bo||alpha(a[0],b[0]);
  });
  return `<div class="warehouse-groups">${entries.map(function(entry){
    let name=entry[0],items=entry[1];items.sort(warehouseDisplaySort);
    if(flatSingles&&items.length===1)return `<div class="warehouse-list">${cardFn(items[0])}</div>`;
    return `<details class="warehouse-group"><summary><span>${esc(name)}</span><span class="warehouse-group-count">${items.length}</span></summary><div class="warehouse-list">${items.map(cardFn).join('')}</div></details>`;
  }).join('')}</div>`;
};'''
text = text[:start] + replacement + text[end:]
required = [
    'warehouseGroupedRows=function(rows,keyFn,cardFn,flatSingles=false)',
    'if(flatSingles&&items.length===1)',
    "warehouseGroupedRows(tr,tentGroupName,tc,true)",
]
missing = [x for x in required if x not in text]
if missing:
    raise SystemExit('Verification failed: '+repr(missing))
path.write_text(text, encoding='utf-8')
