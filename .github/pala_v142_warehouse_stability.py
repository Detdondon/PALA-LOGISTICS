from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v142 · stable warehouse tabs and explicit navigation only'
if marker in text:
    raise SystemExit('PALA v142 already present')

# Visible version
text=text.replace('<span class="app-version" hidden>v141</span>','<span class="app-version" hidden>v142</span>',1)

# Route warehouse links back to the requested warehouse subview when present.
old_route="if(p.has('warehouse'))return showTents();"
new_route="if(p.has('warehouse'))return showTents(['all','tents','hardware','inventory'].includes(p.get('warehouse'))?p.get('warehouse'):undefined);"
if old_route not in text:
    raise SystemExit('Warehouse route marker not found')
text=text.replace(old_route,new_route,1)

# Force the four warehouse tabs to have identical width on all screen sizes.
style=r'''
<style id="pala-v142-warehouse-stability-style">
/* PALA v142 · stable warehouse tabs and explicit navigation only */
.warehouse-tabs{
  display:grid!important;
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  width:100%!important;
  max-width:100%!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
}
.warehouse-tab{
  width:100%!important;
  min-width:0!important;
  max-width:none!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  white-space:nowrap!important;
  text-overflow:ellipsis!important;
}
.warehouse-tab .ui-icon{flex:0 0 auto!important}
@media(max-width:420px){
  .warehouse-tab{padding-left:3px!important;padding-right:3px!important;font-size:10px!important}
}
</style>
'''
head_marker='</head><body>'
if head_marker not in text:
    raise SystemExit('Head marker not found')
text=text.replace(head_marker,style+head_marker,1)

end_marker='\nsyncLoginUi();\n\n</script></body></html>'
if end_marker not in text:
    raise SystemExit('Final script marker not found')

patch=r'''

/* PALA v142 · stable warehouse tabs and explicit navigation only */
const WAREHOUSE_FILTERS_V142=['all','tents','hardware','inventory'];
function normalizeWarehouseFilterV142(value){
  return WAREHOUSE_FILTERS_V142.includes(value)?value:null;
}

let savedWarehouseFilterV142=normalizeWarehouseFilterV142(sessionStorage.getItem('pala_warehouse_filter'));
if(savedWarehouseFilterV142)warehouseViewFilter=savedWarehouseFilterV142;

packTabs=function(active){
  active=normalizeWarehouseFilterV142(active)||'all';
  let tab=(value,label,icon)=>`<button type="button" class="warehouse-tab ${active===value?'active':''}" data-warehouse-filter="${value}" aria-selected="${active===value?'true':'false'}" onclick="event.preventDefault();event.stopPropagation();setWarehouseFilter('${value}')">${uiIcon(icon)} ${label}</button>`;
  return `<div class="warehouse-tabs" role="tablist" aria-label="Filtrér lager">${tab('all','Alt','box')}${tab('tents','Telte','tent')}${tab('hardware','Hardware','settings')}${tab('inventory','Inventar','list')}</div>`;
};

const showTentsV142Base=showTents;
showTents=async function(filter,keepFocus=false){
  let requested=normalizeWarehouseFilterV142(filter)
    ||normalizeWarehouseFilterV142(warehouseViewFilter)
    ||normalizeWarehouseFilterV142(sessionStorage.getItem('pala_warehouse_filter'))
    ||'all';
  warehouseViewFilter=requested;
  sessionStorage.setItem('pala_warehouse_filter',requested);
  let result=await showTentsV142Base(requested,keepFocus);
  warehouseViewFilter=requested;
  sessionStorage.setItem('pala_warehouse_filter',requested);
  history.replaceState(history.state,'',location.pathname+'?warehouse='+encodeURIComponent(requested));
  document.querySelectorAll('.warehouse-tab[data-warehouse-filter]').forEach(button=>{
    let active=button.dataset.warehouseFilter===requested;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',active?'true':'false');
  });
  return result;
};

setWarehouseFilter=function(filter){
  let requested=normalizeWarehouseFilterV142(filter);
  if(!requested)return;
  warehouseViewFilter=requested;
  sessionStorage.setItem('pala_warehouse_filter',requested);
  return showTents(requested,false);
};

// Disable hidden horizontal swipe/trackpad navigation between main menus.
// Main menu changes now only happen through explicit visible controls.
const swipeMainMenuV142Base=swipeMainMenu;
swipeMainMenu=function(){return false};

// Treat all interactive/editor surfaces as gesture-blocked as an extra guard.
flowGestureBlockedTarget=function(target){
  return !!target?.closest?.('button,a,input,textarea,select,summary,label,[role="button"],[contenteditable="true"],dialog,.pala-sheet,.calendar-large-wrap,.calendar-strip,.warehouse-tabs,.warehouse-section,.view-list,.checklist,.code,.nfc-link-tools,.dialog-backdrop,.nav,header');
};

const syncVersionBadgeV142Base=syncVersionBadgeV134;
syncVersionBadgeV134=function(){
  let result=syncVersionBadgeV142Base.apply(this,arguments);
  let badge=document.querySelector('.app-version');
  if(badge)badge.textContent='v142';
  return result;
};
'''
text=text.replace(end_marker,patch+end_marker,1)

path.write_text(text,encoding='utf-8')
