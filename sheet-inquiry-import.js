/* PALA · Telt 2027 forespørgselsimport · kun PALA-data, ingen Google-skriveadgang */
(function(global){
  'use strict';
  if (typeof global.adminTabs !== 'function') return;
  var originalAdminTabs=global.adminTabs;
  var inquiries=[];
  var statusFilter='pending';
  var query='';

  function h(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function stateOf(item){
    if(item.order_sent)return 'Ordre sendt';
    if(item.reserved)return 'Reserveret';
    if(item.quote_given)return 'Tilbud givet';
    return 'Uafklaret';
  }
  function card(item){
    var status=String(item.review_status||'pending');
    var text=[item.customer_name,item.description,item.address,item.use_date_text,item.source_month].join(' ').toLowerCase();
    if(statusFilter!=='all'&&status!==statusFilter)return '';
    if(query&&!text.includes(query))return '';
    var details=[
      item.source_month?'Måned: '+h(item.source_month):'',
      item.use_date_text?'Brugsdato i arket: '+h(item.use_date_text):'Brugsdato ikke angivet',
      item.address?'Adresse: '+h(item.address):'',
      item.phone?'Telefon: '+h(item.phone):''
    ].filter(Boolean).join(' · ');
    var actions=status==='pending'
      ? '<button class="btn primary" onclick="sheetInquiryApprove('+Number(item.id)+')">Opret forespørgsel</button>'+
        '<button class="btn" onclick="sheetInquiryReview('+Number(item.id)+',\'ignore\')">Skjul</button>'
      : status==='ignored'
      ? '<button class="btn" onclick="sheetInquiryReview('+Number(item.id)+',\'restore\')">Gendan</button>'
      : '<button class="btn" onclick="sheetInquiryOpenBooking('+Number(item.booking_id)+')">Åbn PALA-ordre</button>';
    return '<article class="card" style="margin:8px 0;padding:14px">'+
      '<div class="row" style="align-items:flex-start;flex-wrap:wrap"><div>'+
      '<div class="small muted">Række '+h(item.source_row)+' · '+h(stateOf(item))+'</div>'+
      '<h3 style="margin:5px 0">'+h(item.customer_name)+'</h3></div>'+
      '<span class="pill '+(status==='imported'?'green':status==='ignored'?'red':'yellow')+'">'+
      (status==='imported'?'Importeret':status==='ignored'?'Skjult':'Afventer')+'</span></div>'+
      (item.description?'<p style="margin:6px 0">'+h(item.description)+'</p>':'')+
      '<p class="small muted" style="margin:7px 0">'+details+'</p>'+
      '<div class="row" style="justify-content:flex-start;gap:8px;flex-wrap:wrap">'+actions+'</div>'+
      '</article>';
  }
  function render(){
    var host=document.getElementById('sheetInquiryBody');
    if(!host)return;
    var waiting=inquiries.filter(function(i){return i.review_status==='pending'}).length;
    var imported=inquiries.filter(function(i){return i.review_status==='imported'}).length;
    var ignored=inquiries.filter(function(i){return i.review_status==='ignored'}).length;
    var choices=[['pending','Afventer '+waiting],['imported','Importeret '+imported],['ignored','Skjult '+ignored],['all','Alle '+inquiries.length]];
    var filters=choices.map(function(pair){
      return '<button class="btn '+(statusFilter===pair[0]?'primary':'')+
        '" onclick="sheetInquiryFilter(\''+pair[0]+'\')">'+h(pair[1])+'</button>';
    }).join('');
    var cards=inquiries.map(card).filter(Boolean).join('');
    host.innerHTML='<div class="row" style="justify-content:flex-start;flex-wrap:wrap;gap:7px;margin:12px 0">'+filters+'</div>'+
      '<label for="sheetInquirySearch">Søg i forespørgsler</label>'+
      '<input id="sheetInquirySearch" type="search" placeholder="Kunde, telt eller dato" value="'+h(query)+
      '" oninput="sheetInquirySearchChanged(this.value)">'+
      '<div style="margin-top:12px">'+(cards||'<p class="muted">Ingen forespørgsler matcher søgningen.</p>')+'</div>';
  }
  global.adminTabs=function(active){
    var html=originalAdminTabs(active);
    var button='<button class="btn '+(active==='sheet'?'primary':'')+
      '" onclick="showSheetInquiries()">Import: Telt 2027</button>';
    return html.replace('<span class="small muted"',button+'<span class="small muted"');
  };
  global.showSheetInquiries=async function(){
    if(!isAdminLoggedIn())return showAdminLogin();
    act('na');
    history.replaceState(null,'',location.pathname+'?admin=sheet');
    app.innerHTML='<div class="card"><h2>Administration</h2>'+adminTabs('sheet')+
      '<h3>Forespørgsler fra Telt 2027</h3>'+
      '<p class="muted">Skrivebeskyttet øjebliksbillede fra Google-arket. Intet overføres til kalenderen, før du vælger Opret forespørgsel og bekræfter datoerne.</p>'+
      '<div id="sheetInquiryBody"><p class="muted">Henter forespørgsler fra PALA…</p></div></div>';
    var result=await sb.rpc('admin_sheet_inquiries',{p_token:adminToken});
    if(result.error){
      var host=document.getElementById('sheetInquiryBody');
      if(host)host.innerHTML='<p class="red">Kunne ikke hente importoversigten: '+h(result.error.message)+'</p>';
      return;
    }
    inquiries=Array.isArray(result.data)?result.data:[];
    render();
  };
  global.sheetInquiryFilter=function(value){
    statusFilter=['pending','imported','ignored','all'].includes(value)?value:'pending';
    render();
  };
  global.sheetInquirySearchChanged=function(value){
    query=String(value||'').toLowerCase();
    var host=document.getElementById('sheetInquiryBody');
    var start=document.getElementById('sheetInquirySearch');
    var pos=start?start.selectionStart:null;
    render();
    var next=host&&host.querySelector('#sheetInquirySearch');
    if(next){next.focus();if(pos!==null)try{next.setSelectionRange(pos,pos)}catch(_){}}
  };
  global.sheetInquiryApprove=function(id){
    if(!isAdminLoggedIn())return showAdminLogin();
    var item=inquiries.find(function(i){return Number(i.id)===Number(id)});
    if(!item||item.review_status!=='pending')return;
    var intro='<p class="muted">Kunde: <strong>'+h(item.customer_name)+'</strong>. '+
      'Brugsdato i arket: <strong>'+h(item.use_date_text||'Ikke angivet')+'</strong> ('+h(item.source_month)+
      ' 2027). Kontrollér datoerne, inden forespørgslen kommer i PALA-kalenderen.</p>';
    var fields=sheetField('sheetImportStart','Brugsperiode fra','','date','required')+
      sheetField('sheetImportEnd','Brugsperiode til','','date','required')+
      sheetField('sheetImportDelivery','Leveringsdato (valgfri)','','date')+
      sheetField('sheetImportPickup','Nedtagningsdato (valgfri)','','date');
    openEditSheet('Opret forespørgsel fra Telt 2027',intro+fields,async function(){
      var start=sheetValue('sheetImportStart'),end=sheetValue('sheetImportEnd');
      if(!start||!end||end<start)throw new Error('Angiv en gyldig brugsperiode');
      var result=await sb.rpc('admin_sheet_inquiry_create_booking',{
        p_token:adminToken,p_import_id:Number(id),p_start_date:start,p_end_date:end,
        p_delivery_date:sheetValue('sheetImportDelivery')||null,
        p_pickup_date:sheetValue('sheetImportPickup')||null
      });
      if(result.error)throw new Error(result.error.message);
      await reloadData();
      await showSheetInquiries();
    },'Opret forespørgsel');
  };
  global.sheetInquiryReview=async function(id,action){
    if(!isAdminLoggedIn())return showAdminLogin();
    if(action==='ignore'&&!confirm('Skjul denne forespørgsel fra importoversigten? Den kan gendannes.'))return;
    var result=await sb.rpc('admin_sheet_inquiry_review',{p_token:adminToken,p_import_id:Number(id),p_action:action});
    if(result.error){alert('Kunne ikke opdatere forespørgslen: '+result.error.message);return}
    await showSheetInquiries();
  };
  global.sheetInquiryOpenBooking=async function(bookingId){
    if(!isAdminLoggedIn())return showAdminLogin();
    var booking=bookings.find(function(b){return Number(b.id)===Number(bookingId)});
    if(!booking){await reloadData();booking=bookings.find(function(b){return Number(b.id)===Number(bookingId)})}
    if(booking)editOrder(booking.id);
    else alert('Ordren kunne ikke indlæses. Prøv at opdatere PALA.');
  };
})(window);
