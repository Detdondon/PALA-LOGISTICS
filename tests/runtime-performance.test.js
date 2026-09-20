const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const root = process.env.PALA_SOURCE_DIR || '.';
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('app.html');
function section(start, end) { return html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start))); }
function context(extra = {}) {
  const c = { console, ...extra }; c.window = c; vm.createContext(c); return c;
}
function indexedContext() {
  const c = context({ tents: {}, inventory: [], bookings: [{ id: 1, title: 'Old' }], employees: [{ id: 2, name: 'Old' }], staffingShifts: [{ id: 3, booking_id: 1 }], staffingAssignments: [{ id: 4, shift_id: 3 }], bt: [], workshopJobs: [], workshopTasks: [], reloadData: async () => {} });
  vm.runInContext(section('let bookingByIdIndex=', 'function rebuildWarehouseIndexes()'), c);
  vm.runInContext('rebuildDataIndexes()', c);
  vm.runInContext(read('pala-legacy-bridge.js'), c);
  return c;
}
test('direct realtime updates invalidate calendar indexes and derived caches', () => {
  const c = indexedContext();
  vm.runInContext("bookingSummaryCache.set(1, 'stale')", c);
  c.PALALegacyBridge.apply('bookings', { eventType: 'UPDATE', new: { id: 1, title: 'New' } });
  assert.equal(vm.runInContext('bookingByIdIndex.get(1).title', c), 'New');
  assert.equal(vm.runInContext('bookingSummaryCache.size', c), 0);
  c.PALALegacyBridge.apply('staffing_assignments', { eventType: 'INSERT', new: { id: 5, shift_id: 3 } });
  assert.equal(vm.runInContext('assignmentsByShiftIndex.get(3).length', c), 2);
  c.PALALegacyBridge.apply('staffing_assignments', { eventType: 'DELETE', old: { id: 4 } });
  assert.equal(vm.runInContext('assignmentsByShiftIndex.get(3).length', c), 1);
  c.PALALegacyBridge.apply('staffing_shifts', { eventType: 'UPDATE', new: { id: 3, booking_id: 9 } });
  assert.equal(vm.runInContext('staffingShiftsByBookingIndex.has(1)', c), false);
  assert.equal(vm.runInContext('staffingShiftsByBookingIndex.get(9)[0].id', c), 3);
  c.PALALegacyBridge.apply('employees', { eventType: 'UPDATE', new: { id: 2, name: 'New' } });
  assert.equal(vm.runInContext('employeeByIdIndex.get(2).name', c), 'New');
});
function reloadContext(failedTable) {
  const started = [], releases = [], alerts = [];
  const c = context({ tents: { existing: true }, inventory: [], bookings: [], bt: [{ booking_id: 99 }], bi: [{ booking_id: 98 }], employees: [], staffingShifts: [], staffingAssignments: [], tentDocuments: [],
    sb: { from(table) { const q = { select: () => q, order: () => q, then(resolve) { return Promise.resolve({ data: [], error: table === failedTable ? new Error('offline') : null }).then(resolve); } }; return q; } },
    fetchInventoryCatalog: async () => ({ data: [] }), alert: message => alerts.push(message), applyWebsiteTentCatalog() {}, applyReturnedCompletionCache() {}, rebuildDataIndexes() {}
  });
  for (const name of ['loadWarehouseExtensions', 'loadWorkshopData', 'loadStaffingInvitations', 'refreshWarehouseStatus']) {
    c[name] = () => { started.push(name); return new Promise(resolve => releases.push(resolve)); };
  }
  vm.runInContext(section('async function reloadData(){', '\n\n\nfunction showNfc'), c);
  return { c, started, releases, alerts };
}
test('independent extension loads run together and reload waits for all of them', async () => {
  const { c, started, releases } = reloadContext();
  let completed = false;
  const pending = c.reloadData().then(() => { completed = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(started.length, 4);
  assert.equal(completed, false);
  releases.slice(0, 3).forEach(resolve => resolve());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(completed, false);
  releases[3](); await pending; assert.equal(completed, true);
});
for (const table of ['booking_tents', 'booking_inventory']) {
  test(`failed ${table} fetch preserves previously loaded data`, async () => {
    const { c, alerts, started } = reloadContext(table);
    const pending = c.reloadData();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(alerts.length, 1);
    assert.equal(started.length, 0);
    assert.equal(c.bt[0].booking_id, 99);
    assert.equal(c.bi[0].booking_id, 98);
    await pending;
  });
}
test('returning to the app refreshes missed changes while duplicate channel events stay suppressed', () => {
  let tick, calls = 0, stops = 0, live = true;
  const c = context({ PALARealtime: { get status() { return live ? 'SUBSCRIBED' : 'CLOSED'; } }, setupCloudSync() {}, stopCloudSync() { stops++; }, scheduleCloudSync() { calls++; }, setInterval(fn) { tick = fn; return 1; }, clearInterval() {}, addEventListener() {}, setTimeout() {} });
  vm.runInContext(read('pala-sync-control.js'), c); tick();
  assert.equal(stops, 1);
  c.scheduleCloudSync(); assert.equal(calls, 1);
  c.scheduleCloudSync({ table: 'pala_sync_events' }); assert.equal(calls, 1);
  live = false; c.scheduleCloudSync({ table: 'pala_sync_events' }); assert.equal(calls, 2);
});
test('active application scripts parse successfully', () => {
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  const files = new Set([...read('index.html').matchAll(/src="([^"?]+)\?/g)].map(m => m[1]));
  for (const file of files) new vm.Script(read(file), { filename: file });
  new vm.Script(read('calendar-controller.js'));
});
test('startup waits for the calendar scripts even when data is available immediately', () => {
  let ready, legacy = 0, current = 0;
  const c = context({ document: { addEventListener(event, fn, options) { assert.equal(event, 'DOMContentLoaded'); assert.equal(options.once, true); ready = fn; } }, load() { legacy++; } });
  vm.runInContext(section('// Wait for calendar and UI scripts', '\n\n\n/* PALA v110'), c);
  assert.equal(legacy, 0);
  c.load = () => { current++; };
  ready(); assert.equal(current, 1);
});
