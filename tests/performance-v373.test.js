const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');

function setup(withMonthScope){
  let cardCalls=0;
  const listHost={innerHTML:''};
  const appView={innerHTML:'',querySelector:()=>null};
  const stored=new Map();
  const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const bookings=Array.from({length:24},(_,i)=>({id:i+1,status:'Forespørgsel',start_date:'2026-11-'+String((i%24)+1).padStart(2,'0'),end_date:'2026-11-'+String((i%24)+1).padStart(2,'0'),customer_name:'Kunde '+i}));
  const ctx={
    console,Promise,Date,Intl,queueMicrotask,
    setTimeout(fn){fn();return 1;},
    localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,String(value))},
    document:{
      getElementById:()=>({}),createElement:()=>({}),head:{appendChild(){}},
      querySelector:selector=>selector==='.calendar-detail-list'&&appView.innerHTML.includes('calendar-detail-list')?listHost:null
    },
    location:{pathname:'/'},history:{replaceState(){}},
    mainCalendarTypeFilterV120:'all',mainCalendarStatusFilterV123:'all',calendarViewMode:'calendar',
    staffingCalendarStatusFilterV120:'all',workshopFilter:'all',calDate:new Date(2026,10,5),
    bookings,staffingShifts:[],workshopJobs:[],workshopTasks:[],palaMeetings:[],tents:{},
    showCalendar(){},orderCard:row=>{cardCalls++;return '<article>order-'+row.id+'</article>';},calendarEvents:()=>[],
    jobLocationStatus:row=>row.status,
    setUnifiedCalendarTypeV123(){},setUnifiedCalendarStatusV123(){},setCalendarView(){},
    setCalendarDay(){},mv(){},jumpCalendarMonth(){},goCalendarToday(){},renderMainCalendarListV121(){},mainCalendarDayHtmlV120(){},
    isStaffLeave:()=>false,staffLinkedJobCompleted:()=>false,staffAssignmentsFor:()=>[],
    staffDateString:iso,localDateFromISO:s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);},
    staffLeaveInfo:()=>null,staffLeaveContains:()=>false,staffCalendarBooking:()=>null,staffWorkshopJob:()=>null,
    workshopTaskRangeV120:()=>null,isAdminLoggedIn:()=>false,staffShiftCard:()=>'',workshopJobCard:()=>'',workshopTaskCard:()=>'',meetingCard:()=>'',bookingsForCalendarDate:()=>[],
    fmtDateDa:s=>s,listDateHeading:s=>s,esc:s=>String(s),uiIcon:()=>'',sharedCalendarWeekdays:()=>'',sharedCalendarCells:()=>'',isoWeekNumber:()=>1,weekdayDateDa:s=>s,
    app:appView,act(){},ensureUnifiedNavV123(){},installCalendarSwipe(){},
    showStaffingExportDialog(){},showProductionPlanExportDialog(){},
    window:null
  };
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('calendar-controller.js','utf8'),ctx,{filename:'calendar-controller.js'});
  if(withMonthScope)vm.runInContext(fs.readFileSync('calendar-list-month-scope.js','utf8'),ctx,{filename:'calendar-list-month-scope.js'});
  return{ctx,listHost,bookings,cardCalls:()=>cardCalls};
}

test('calendar renders its full month list as fallback when plugin is unavailable',async()=>{
  const h=setup(false);
  await h.ctx.showCalendar();
  assert.equal(h.cardCalls(),20);
  assert.match(h.ctx.app.innerHTML,/order-5/);
});

test('calendar with month scope builds each order card only once and retains all 24 orders',async()=>{
  const h=setup(true);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.cardCalls(),0,'loading the plugin without an active calendar must not render cards');
  await h.ctx.showCalendar();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(h.cardCalls(),24,'duplicate month cards must not be constructed in base calendar');
  assert.match(h.listHost.innerHTML,/order-1/);
  assert.match(h.listHost.innerHTML,/order-24/);
  assert.equal((h.listHost.innerHTML.match(/<article>/g)||[]).length,24);
});

test('calendar month selector uses one reusable date formatter instead of creating one per option',()=>{
  const src=fs.readFileSync('calendar-controller.js','utf8');
  const months=src.slice(src.indexOf('function months(){'),src.indexOf('function counts(){'));
  assert.match(months,/monthLabelFormatterV373\.format\(d\)/);
  assert.doesNotMatch(months,/new Intl\.DateTimeFormat/);
});

test('calendar enhancement watches only the app container and ignores nested list mutations',()=>{
  const src=fs.readFileSync('calendar-ui-v174.js','utf8');
  assert.match(src,/\.observe\(root,\{childList:true\}\)/);
  assert.doesNotMatch(src,/characterData:true/);
});
