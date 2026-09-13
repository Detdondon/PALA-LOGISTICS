const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const store=new Map([
  ['pala_calendar_type_filter','all'],
  ['pala_calendar_status_filter','all'],
  ['pala_calendar_view','calendar']
]);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const sandbox={
  console,
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},
  document:{getElementById:()=>({}),createElement:()=>({}),head:{appendChild(){}}},
  location:{pathname:'/'},history:{replaceState(){}},
  mainCalendarTypeFilterV120:'all',mainCalendarStatusFilterV123:'all',calendarViewMode:'calendar',
  staffingCalendarStatusFilterV120:'all',workshopFilter:'all',calDate:new Date(2026,0,31),
  bookings:[],staffingShifts:[],workshopJobs:[],workshopTasks:[],palaMeetings:[],tents:{},
  showCalendar(){},orderCard:r=>`order-${r.id}`,calendarEvents(){return sandbox.__events||[]},
  jobLocationStatus:r=>r.status,bookingStatusMatchV123(){},shiftStatusMatchV123(){},workshopJobStatusMatchV123(){},workshopTaskStatusMatchV123(){},unifiedStatusMatchV123(){},
  setUnifiedCalendarTypeV123(){},setUnifiedCalendarStatusV123(){},setCalendarView(){},setCalendarDay(){},mv(){},jumpCalendarMonth(){},goCalendarToday(){},renderMainCalendarListV121(){},mainCalendarDayHtmlV120(){},
  isStaffLeave:r=>!!r.leave,staffLinkedJobCompleted:r=>!!r.done,staffAssignmentsFor:r=>Array.from({length:r===1?1:0}),
  staffDateString:iso,localDateFromISO:s=>{let [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)},
  staffLeaveInfo:()=>null,staffLeaveContains:()=>false,staffCalendarBooking:()=>null,staffWorkshopJob:()=>null,
  workshopTaskRangeV120:r=>r.range||null,
  isAdminLoggedIn:()=>false,staffShiftCard:r=>`staff-${r.id}`,workshopJobCard:r=>`workshop-${r.id}`,workshopTaskCard:r=>`task-${r.id}`,meetingCard:r=>`meeting-${r.id}`,
  bookingsForCalendarDate:()=>[],fmtDateDa:s=>s,listDateHeading:s=>s,esc:s=>String(s),uiIcon:()=>'',sharedCalendarWeekdays:()=>'',sharedCalendarCells:()=>'',isoWeekNumber:()=>1,weekdayDateDa:s=>s,
  app:{querySelector:()=>null,innerHTML:''},act(){},ensureUnifiedNavV123(){},installCalendarSwipe(){},showStaffingExportDialog(){},showProductionPlanExportDialog(){},quickSetBookingStatus(){},
  window:null
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('calendar-controller.js','utf8'),sandbox,{filename:'calendar-controller.js'});

// Avoid rendering UI while testing state transitions.
sandbox.showCalendar=()=>{};

assert.equal(sandbox.jobLocationStatus({status:'Forespørgsel'}),'Forespørgsel','Forespørgsel must not collapse to På lager');
assert.equal(sandbox.jobLocationStatus({status:'Udleveret'}),'Ude','legacy Udleveret must normalize to Ude');

sandbox.setUnifiedCalendarTypeV123('orders');
sandbox.setUnifiedCalendarStatusV123('inquiry');
assert.equal(sandbox.bookingStatusMatchV123({status:'Forespørgsel'}),true,'inquiry filter must include inquiries');
assert.equal(sandbox.bookingStatusMatchV123({status:'På lager'}),false,'inquiry filter must exclude warehouse orders');

sandbox.setUnifiedCalendarTypeV123('staffing');
assert.equal(store.get('pala_calendar_status_filter'),'active','incompatible order-only status must normalize predictably');
sandbox.setUnifiedCalendarStatusV123('understaffed');
assert.equal(sandbox.shiftStatusMatchV123({id:1,workers_needed:2,done:false}),true,'understaffed shift must match');
assert.equal(sandbox.shiftStatusMatchV123({id:2,workers_needed:1,done:false}),true,'zero assigned shift must match');
assert.equal(sandbox.shiftStatusMatchV123({id:3,workers_needed:2,done:true}),false,'completed shift must not be understaffed');

sandbox.mainCalendarTypeFilterV120='orders';sandbox.mainCalendarStatusFilterV123='inquiry';
sandbox.__events=[
  {key:'a',start:'2026-09-02',end:'2026-09-03',item:{id:1,status:'Forespørgsel',customer_name:'A'}},
  {key:'b',start:'2026-09-01',end:'2026-09-01',item:{id:2,status:'Afsluttet',customer_name:'B'}},
  {key:'c',kind:'staffing',start:'2026-09-01',end:'2026-09-01',item:{id:3,workers_needed:2}}
];
let events=sandbox.calendarEvents(new Date(2026,8,1),30,'calendar');
assert.deepEqual(events.map(e=>e.key),['a'],'type+status filtering must be deterministic');

sandbox.calDate=new Date(2026,0,31);sandbox.mv(1);
assert.equal(iso(sandbox.calDate),'2026-02-28','31 January must clamp to last day of February');
sandbox.calDate=new Date(2028,0,31);sandbox.jumpCalendarMonth('2028-02');
assert.equal(iso(sandbox.calDate),'2028-02-29','month picker must handle leap years');

sandbox.mainCalendarTypeFilterV120='orders';sandbox.mainCalendarStatusFilterV123='completed';sandbox.setCalendarView('list');
assert.equal(sandbox.mainCalendarTypeFilterV120,'orders','view switch must preserve type filter');
assert.equal(sandbox.mainCalendarStatusFilterV123,'completed','view switch must preserve status filter');
assert.equal(store.get('pala_calendar_view'),'list','view choice must persist');

sandbox.setCalendarSortV150('name_desc');
assert.equal(store.get('pala_calendar_sort'),'name_desc','sort choice must persist');

console.log('calendar-controller regression tests passed');
