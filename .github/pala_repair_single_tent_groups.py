from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = r'''warehouseGroupedRows=function(rows,keyFn,cardFn){
  let groups=new Map();
  rows.forEach(function(row){let key=keyFn(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  let entries=[...groups.entries()].sort(function(a,b){
    let ao=Math.min(...a[1].map(function(row){return Number(row.sort_order??999999)})),
        bo=Math.min(...b[1].map(function(row){return Number(row.sort_order??999999)}));
    return ao-bo||alpha(a[0],b[0]);
  });
  return '<div class="warehouse-groups">'+entries.map(function(entry){
    let name=entry[0],items=entry[1].sort(warehouseDisplaySort);
    return '<details class="warehouse-group"><summary><span>'+esc(name)+'</span><span class="warehouse-group-count">'+items.length+'</span></summary><div class="warehouse-list">'+items.map(cardFn).join('')+'</div></details>';
  }).join('')+'</div>';
};'''
new = r'''warehouseGroupedRows=function(rows,keyFn,cardFn,flatSingles=false){
  let groups=new Map();
  rows.forEach(function(row){let key=keyFn(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  let entries=[...groups.entries()].sort(function(a,b){
    let ao=Math.min(...a[1].map(function(row){return Number(row.sort_order??999999)})),
        bo=Math.min(...b[1].map(function(row){return Number(row.sort_order??999999)}));
    return ao-bo||alpha(a[0],b[0]);
  });
  return '<div class="warehouse-groups">'+entries.map(function(entry){
    let name=entry[0],items=entry[1].sort(warehouseDisplaySort);
    if(flatSingles&&items.length===1)return '<div class="warehouse-list">'+cardFn(items[0])+'</div>';
    return '<details class="warehouse-group"><summary><span>'+esc(name)+'</span><span class="warehouse-group-count">'+items.length+'</span></summary><div class="warehouse-list">'+items.map(cardFn).join('')+'</div></details>';
  }).join('')+'</div>';
};'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'Expected exactly one warehouseGroupedRows v104 block, found {count}')
text = text.replace(old,new,1)
if 'function warehouseStateMarkup(kind,label)' not in text:
    raise SystemExit('Warehouse code following grouped rows is missing')
if 'const showTentsV103=showTents;' not in text:
    raise SystemExit('Warehouse v103 wrapper is missing')
path.write_text(text, encoding='utf-8')
