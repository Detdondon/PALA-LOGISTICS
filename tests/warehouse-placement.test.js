const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const read = name => fs.readFileSync(name, 'utf8');
function setup() {
  const calls = [], fields = {}, installed = [];
  let save;
  const c = {
    console, URLSearchParams, showTents() {}, requireAdmin: () => true,
    warehouseCategories: [
      {id:1,kind:'tent',name:'Telte'}, {id:2,kind:'tent',parent_id:1,name:'Stødtelte'},
      {id:3,kind:'tent',parent_id:2,name:'Små'}, {id:4,kind:'inventory',name:'Inventar'},
      {id:5,kind:'inventory',parent_id:4,name:'Små'}
    ],
    document: {getElementById: id => fields[id] || null, querySelector: () => null,
      createElement: () => ({}), head: {appendChild() {}}},
    installSheetCategory(kind,item) { installed.push({kind,item}); fields.s_category_id={value:String(item?.category_id||'')}; },
    tents: {42:{id:42,name:'Eksisterende',category_id:2,hardware:[],compatible_tent_ids:[43]}},
    hardwareCatalog: [], adminToken:'test-token',
    checkedRpc: async (name,args) => {calls.push({name,args});return args.p_id||99;},
    openEditSheet(title,html,callback) {save=callback;fields.palaEditSheet={};},
    sheetField: () => '', sheetText: () => '', tentParentOptions: () => [],
    sheetValue: name => name==='name'?'Telt':name==='category_id'?fields.s_category_id.value:'',
    sheetNumber: () => 0, reloadData:async()=>{},openTent:async()=>{}
  };
  c.window=c; vm.createContext(c);
  const html=read('app.html');
  const start=html.indexOf('const checkedRpc106=checkedRpc;');
  vm.runInContext(html.slice(start,html.indexOf('function categoryEditRow',start)),c);
  vm.runInContext(read('warehouse-categories.js'),c);
  vm.runInContext(read('admin-tent-standard-hardware.js'),c);
  return {c,calls,fields,installed,save:()=>save()};
}
test('category choices show full paths, preserve placement and require an explicit choice for new items',()=>{
  const {c}=setup();
  for(const kind of ['tent','hardware','inventory']) {
    const fresh=c.categoryField(kind,null);
    assert.match(fresh, /value="" selected disabled/);
    assert.match(fresh, /Telte › Stødtelte › Små/);
    assert.match(fresh, /Inventar › Små/);
    assert.match(c.categoryField(kind,{category_id:3}), /value="3" selected/);
    assert.doesNotMatch(c.categoryField(kind,{category_id:3}), /value="" selected/);
    assert.match(c.categoryField(kind,{category_id:999}), /value="" selected disabled/);
  }
});
for(const id of [undefined,42]) test(`${id?'existing':'new'} tent saves its selected placement in the same record transaction`,async()=>{
  const {c,calls,fields,installed,save}=setup();
  c.editTentBasics(id);
  assert.equal(installed.length,1);
  assert.equal(installed[0].kind,'tent');
  if(id) assert.equal(fields.s_category_id.value,'2');
  fields.s_category_id.value='5';
  await save();
  assert.equal(calls[0].name,'admin_save_warehouse_record');
  assert.equal(calls[0].args.p_kind,'tent');
  assert.equal(calls[0].args.p_id,id||null);
  assert.equal(calls[0].args.p_data.category_id,5);
  assert.equal('compatible_tent_ids' in calls[0].args.p_data,false,'unrelated tent links must remain unchanged');
});
for(const kind of ['hardware','inventory']) test(`${kind} saves category together with existing item data`,async()=>{
  const {c,calls,fields}=setup();
  fields.palaEditSheet={};fields.s_category_id={value:'3'};
  const name=kind==='hardware'?'admin_save_catalog_hardware':'admin_save_inventory_v2';
  await c.checkedRpc(name,{p_token:'test-token',p_id:8,p_data:{name:'Hardware',quantity_total:12},p_name:'Inventar',p_quantity_total:12});
  assert.equal(calls[0].name,'admin_save_warehouse_record');
  assert.equal(calls[0].args.p_kind,kind);
  assert.equal(calls[0].args.p_data.category_id,3);
  assert.equal(calls[0].args.p_data.quantity_total,12);
});
