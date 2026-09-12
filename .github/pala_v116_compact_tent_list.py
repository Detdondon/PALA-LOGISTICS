from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v116 · compact uniform tent overview'
start_marker='warehouseGroupedRows=function(rows,keyFn,cardFn,flatSingles=false){'
end_marker='\n};\n\nfunction warehouseStateMarkup'

if marker not in text:
    head=text.find('</head>')
    if head<0: raise SystemExit('Missing </head>')
    css=r'''
<style id="pala-v116-compact-tent-list">
/* PALA v116 · compact uniform tent overview */
.warehouse-tent-compact-list{display:grid;gap:9px}
.warehouse-tent-compact-row,.warehouse-tent-compact-group>summary{width:100%;min-height:58px;border:1px solid #dfe4ec;border-radius:14px;background:#f8f9fb;padding:10px 13px;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:9px;text-align:left;color:inherit}
button.warehouse-tent-compact-row{font:inherit;cursor:pointer}
.warehouse-tent-compact-group{border:0;background:transparent;box-shadow:none;margin:0;padding:0}
.warehouse-tent-compact-group>summary{list-style:none;cursor:pointer}
.warehouse-tent-compact-group>summary::-webkit-details-marker{display:none}
.warehouse-tent-compact-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
.warehouse-tent-compact-copy strong{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;line-height:1.25}
.warehouse-tent-compact-copy small{font-size:12px;color:#687386;line-height:1.2}
.warehouse-tent-compact-states{display:flex;align-items:center;justify-content:flex-end;gap:5px;flex-wrap:wrap}
.warehouse-tent-compact-states .warehouse-state{margin:0;white-space:nowrap}
.warehouse-tent-compact-chevron{display:flex;align-items:center;justify-content:center;color:#7a8494}
.warehouse-tent-compact-chevron svg{width:18px;height:18px;transition:transform .16s ease}
.warehouse-tent-compact-group[open]>summary .warehouse-tent-compact-chevron svg{transform:rotate(90deg)}
.warehouse-tent-variants{display:grid;gap:7px;margin:7px 0 4px 12px;padding-left:10px;border-left:2px solid #e4e8ef}
.warehouse-tent-compact-row.is-variant{min-height:52px;background:#fff;border-radius:12px}
@media(max-width:520px){
  .warehouse-tent-compact-row,.warehouse-tent-compact-group>summary{min-height:56px;padding:9px 11px;gap:7px;grid-template-columns:minmax(0,1fr) auto auto}
  .warehouse-tent-compact-copy strong{font-size:15px}
  .warehouse-tent-compact-states .warehouse-state{font-size:11px;padding:4px 7px}
  .warehouse-tent-variants{margin-left:8px;padding-left:8px}
}
</style>
'''
    text=text[:head]+css+text[head:]

start=text.find(start_marker)
if start<0: raise SystemExit('Could not find warehouseGroupedRows')
end=text.find(end_marker,start)
if end<0: raise SystemExit('Could not find warehouseGroupedRows end')
end+=len('\n};')

replacement=r'''warehouseGroupedRows=function(rows,keyFn,cardFn,flatSingles=false){
  let groups=new Map();
  rows.forEach(function(row){let key=keyFn(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
  let entries=[...groups.entries()].sort(function(a,b){
    let ao=Math.min(...a[1].map(function(row){return Number(row.sort_order??999999)})),
        bo=Math.min(...b[1].map(function(row){return Number(row.sort_order??999999)}));
    return ao-bo||alpha(a[0],b[0]);
  });
  if(flatSingles){
    function compactStates(items){
      let wet=items.some(function(t){return warehouseDrying('tent',t.id)>0}),out=items.some(function(t){return warehouseOut('tent',t.id)>0});
      let available=items.some(function(t){let total=t.stock_count,o=warehouseOut('tent',t.id),w=warehouseDrying('tent',t.id);return knownStock(total)&&(+total-Math.max(o,w))>0});
      let known=items.some(function(t){return knownStock(t.stock_count)}),html='';
      if(wet)html+=warehouseStateMarkup('wet','Vådt');
      if(out)html+=warehouseStateMarkup('out','Ude');
      if(available)html+=warehouseStateMarkup('in-stock','På lager');
      if(!html&&known)html+=warehouseStateMarkup('out','Ikke på lager');
      return html;
    }
    function compactTentRow(t,variant){
      let meta=t.area_m2?`${t.area_m2} m²`:'Telt',states=compactStates([t]);
      return `<button type="button" class="warehouse-tent-compact-row${variant?' is-variant':''}" onclick="openTent(${t.id})"><span class="warehouse-tent-compact-copy"><strong>${esc(t.name)}</strong><small>${esc(meta)}</small></span><span class="warehouse-tent-compact-states">${states}</span><span class="warehouse-tent-compact-chevron">${uiIcon('chevronRight')}</span></button>`;
    }
    return '<div class="warehouse-tent-compact-list">'+entries.map(function(entry){
      let name=entry[0],items=entry[1].sort(warehouseDisplaySort);
      if(items.length===1)return compactTentRow(items[0],false);
      return `<details class="warehouse-tent-compact-group"><summary><span class="warehouse-tent-compact-copy"><strong>${esc(name)}</strong><small>${items.length} versioner</small></span><span class="warehouse-tent-compact-states">${compactStates(items)}</span><span class="warehouse-tent-compact-chevron">${uiIcon('chevronRight')}</span></summary><div class="warehouse-tent-variants">${items.map(function(item){return compactTentRow(item,true)}).join('')}</div></details>`;
    }).join('')+'</div>';
  }
  return '<div class="warehouse-groups">'+entries.map(function(entry){
    let name=entry[0],items=entry[1].sort(warehouseDisplaySort);
    return '<details class="warehouse-group"><summary><span>'+esc(name)+'</span><span class="warehouse-group-count">'+items.length+'</span></summary><div class="warehouse-list">'+items.map(cardFn).join('')+'</div></details>';
  }).join('')+'</div>';
};'''

text=text[:start]+replacement+text[end:]
if text.count(marker)!=1: raise SystemExit('CSS marker verification failed')
if text.count('warehouse-tent-compact-list')<2: raise SystemExit('Compact tent renderer verification failed')
path.write_text(text,encoding='utf-8')
print('Applied PALA v116 compact tent overview')
