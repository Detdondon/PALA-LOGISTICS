// Isolated browser checks against the existing renderers, without production writes.
(()=>{
function* textNodes(n){for(const c of n.childNodes){if(c.nodeType===3&&c.textContent.trim())yield c;else if(c.nodeType===1)yield*textNodes(c)}}
const delay=()=>new Promise(resolve=>setTimeout(resolve,80));
async function run(){
 closeEditSheet(true);
 const results=[];
 for(const surface of ['view-list','calendar-detail-list']){
  const rows=[orderCard(bookings[0]),orderCard({...bookings[0],id:2,status:'Afsluttet'}),staffShiftCard({...staffingShifts[0],shift_date:'2099-09-21',start_time:'09:00',end_time:'16:00',notes:'Vigtig note'}),staffShiftCard(staffingShifts[0]),workshopJobCard({...workshopJobs[0],customer_name:'Testkunde'}),workshopJobCard({...workshopJobs[0],status:'Afsluttet'}),workshopTaskCard({...workshopTasks[0],created_by_employee_name:'Anna',booking_name:'Testordre'}),workshopTaskCard({...workshopTasks[0],status:'completed',completion_note:'Repareret søm',completed_by_employee_name:'Jens',completed_at:'2026-09-22T10:00:00Z'})];
  app.innerHTML=`<div class="${surface}">${rows.join('')}</div>`;
  const cards=[...app.firstElementChild.children];
  const before=cards.map(card=>({card,controls:[...card.querySelectorAll('button,a,select')].map(n=>({node:n,click:n.getAttribute('onclick'),change:n.getAttribute('onchange'),value:n.value})),text:[...textNodes(card)]}));
  await delay();
  for(const [i,snapshot] of before.entries()){
   const {card,controls,text}=snapshot,errors=[];
   if(!card.classList.contains('pala-activity-card'))errors.push('Fælles kort mangler');
   if([...card.children].map(n=>n.className).join('|')!=='pala-activity-head|pala-activity-meta|pala-activity-body|pala-activity-footer')errors.push('Afvigende struktur');
   if(text.some(n=>!n.isConnected))errors.push('Information fjernet');
   if(controls.some(s=>!s.node.isConnected||s.node.getAttribute('onclick')!==s.click||s.node.getAttribute('onchange')!==s.change||s.node.value!==s.value))errors.push('Handling ændret');
   if([...card.querySelectorAll('.btn')].some(n=>!n.closest('.pala-activity-actions')))errors.push('Handling uden for fælles knaplinje');
   if(card.scrollWidth>card.clientWidth+2)errors.push('Vandret overflow');
   results.push({surface,type:card.dataset.activityType,index:i,controls:controls.length,errors});
  }
 }
 return results;
}
window.addEventListener('load',()=>setTimeout(()=>{
const panel=document.getElementById('fixture-controls');if(!panel)return;
const button=document.createElement('button');button.textContent='Test kalenderkort';const result=document.createElement('pre');result.id='calendar-card-results';result.style.cssText='max-height:90px;overflow:auto;white-space:pre-wrap';button.onclick=async()=>{try{result.textContent=JSON.stringify(await run())}catch(error){result.textContent=JSON.stringify({error:error.message})}};panel.append(button,result);
},500));
})();
