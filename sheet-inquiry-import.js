/* PALA · Telt 2027 · manuel Google Sheets-læseimport, ingen skrivning til Google */
(function(global){
  'use strict';
  if(typeof global.adminTabs!=='function')return;
  var SHEET_ID='1hBILIVPhsCpkTXfnGmpVE7EX7jLQ6MQSqx-KTSBqqiw';
  var TAB_NAME='Telt 2027';
  var GOOGLE_SCOPE='https://www.googleapis.com/auth/spreadsheets.readonly';
  var CLIENT_ID_KEY='pala_telt_2027_google_oauth_client_id';
  var originalAdminTabs=global.adminTabs;
  var inquiries=[],statusFilter='unconfirmed',query='',busy=false,statusMessage='';
  var googleLoader=null;
  var monthNumbers={april:4,maj:5,juni:6,juli:7,august:8,september:9,oktober:10,november:11,december:12};

  function h(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function str(value){return String(value==null?'':value).trim();}
  function storedClientId(){
    try{return str(localStorage.getItem(CLIENT_ID_KEY));}catch(_e){return '';}
  }
  function importMessage(message,error){
    statusMessage=String(message||'');
    var node=document.getElementById('sheetInquiryStatus');
    if(node){node.className=error?'small red':'small muted';node.textContent=statusMessage;}
  }
  function setBusy(value){
    busy=!!value;
    var button=document.getElementById('sheetGoogleImportButton');
    if(button){button.disabled=busy;button.textContent=busy?'Henter opdateringer…':'Importér seneste opdateringer fra Google Sheets';}
  }
  function validDate(year,month,day){
    var date=new Date(Date.UTC(year,month-1,day));
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)
      throw new Error('Ugyldig dato: '+day+'/'+month+'/'+year);
    return String(year)+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  }
  function parseDate(value,sourceMonth,sourceRow){
    var text=str(value).toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,' ');
    var month=monthNumbers[str(sourceMonth).toLowerCase()];
    if(!month)throw new Error('Ukendt måned i række '+sourceRow);
    if(!text){
      return {start_date:validDate(2027,month,1),end_date:validDate(2027,month,1),date_unconfirmed:true};
    }
    var from,to,year=2027;
    var named=text.match(/^(\d{1,2})\.\s*(april|maj|juni|juli|august|september|oktober|november|december)$/);
    if(named){from=to=Number(named[1]);month=monthNumbers[named[2]];}
    else{
      var match=text.match(/^(\d{1,2})(?:\s*-\s*(\d{1,2}))?(?:\s*[/.]\s*(\d{1,2}))?(?:\s*-\s*(\d{4}))?$/);
      if(!match)throw new Error('Kan ikke læse datoen "'+text+'" i række '+sourceRow+'. Ingen ordrer ændret.');
      from=Number(match[1]);to=match[2]?Number(match[2]):from;
      if(match[3])month=Number(match[3]);
      if(match[4])year=Number(match[4]);
    }
    if(year!==2027||to<from)throw new Error('Kontrollér brugsdato i række '+sourceRow+'. Ingen ordrer ændret.');
    return {start_date:validDate(year,month,from),end_date:validDate(year,month,to),date_unconfirmed:false};
  }
  function enabled(value){
    var v=str(value).toLowerCase();
    return v==='x'||v==='ja'||v==='yes'||v==='true'||v==='1'||v==='✓';
  }
  function parseGoogleRows(valueRanges){
    if(!Array.isArray(valueRanges)||valueRanges.length!==3)
      throw new Error('Google returnerede ikke de forventede kolonner fra Telt 2027.');
    var main=valueRanges[0].values||[];
    var dates=valueRanges[1].values||[];
    var calendar=valueRanges[2].values||[];
    var total=Math.max(main.length,dates.length,calendar.length);
    var currentMonth='',out=[],seen=new Set();
    for(var idx=0;idx<total;idx++){
      var a=main[idx]||[],d=dates[idx]||[],c=calendar[idx]||[];
      var first=str(a[0]),second=str(a[1]);
      var heading=first.match(/^(april|maj|juni|juli|august|september|oktober|november|december)\b/i);
      if(heading && (second.toLowerCase()==='kunde'||(!second&&!str(a[4])&&!str(d[0])))){
        currentMonth=heading[1].charAt(0).toUpperCase()+heading[1].slice(1).toLowerCase();
        continue;
      }
      if(second.toLowerCase()==='kunde'||/^uge\s*\d+/i.test(first)||/^ingen privfester/i.test(second))
        continue;
      var customer=second||(str(a[4])||str(d[0])||str(a[2])||str(a[3])?first:'');
      if(!customer||!currentMonth||/^total$|^uge$|^frem til/i.test(customer))continue;
      var row=idx+1,description=str(a[4]),useDate=str(d[0]);
      var parsed=parseDate(useDate,currentMonth,row);
      if(seen.has(row))throw new Error('Dublet i kilderække '+row);
      seen.add(row);
      out.push({
        source_row:row,source_month:currentMonth,customer_name:customer,
        phone:str(a[2]),address:str(a[3]),description:description,
        use_date_text:useDate,delivery_date_text:str(d[1]),
        pickup_date_text:str(d[2]),reserved:enabled(d[3]),
        quote_given:enabled(d[4]),order_sent:enabled(d[5]),
        in_logistics_calendar:enabled(c[0]),
        start_date:parsed.start_date,end_date:parsed.end_date,
        date_unconfirmed:parsed.date_unconfirmed
      });
    }
    if(out.length<10)throw new Error('Importen fandt kun '+out.length+' ordrer. Ingen ændringer foretaget.');
    return out;
  }

  function card(item){
    var status=str(item.review_status||'pending');
    var unconfirmed=!!item.date_unconfirmed && !!item.booking_id;
    var searchText=[item.customer_name,item.description,item.address,item.use_date_text,item.source_month].join(' ').toLowerCase();
    if(statusFilter==='unconfirmed'&&!unconfirmed)return '';
    if(statusFilter==='imported'&&(status!=='imported'||unconfirmed))return '';
    if(statusFilter==='pending'&&(status!=='pending'||item.booking_id))return '';
    if(statusFilter==='ignored'&&status!=='ignored')return '';
    if(query&&!searchText.includes(query))return '';
    var details=[
      item.source_month?'Måned: '+h(item.source_month):'',
      item.use_date_text?'Brugsdato: '+h(item.use_date_text):'Brugsdato mangler i arket',
      item.address?'Adresse: '+h(item.address):'',
      item.phone?'Telefon: '+h(item.phone):''
    ].filter(Boolean).join(' · ');
    var actions='';
    if(item.booking_id){
      if(unconfirmed)actions+='<button class="btn primary" onclick="sheetInquiryConfirmDate('+Number(item.id)+')">Bekræft dato</button>';
      actions+='<button class="btn" onclick="sheetInquiryOpenBooking('+Number(item.booking_id)+')">Åbn PALA-ordre</button>';
    }else if(status==='ignored'){
      actions='<button class="btn" onclick="sheetInquiryReview('+Number(item.id)+',\'restore\')">Gendan</button>';
    }else{
      actions='<button class="btn primary" onclick="sheetInquiryApprove('+Number(item.id)+')">Opret forespørgsel</button>';
    }
    var label=unconfirmed?'Afventer godkendelse':status==='imported'?'Forespørgsel i kalender':status==='ignored'?'Skjult':'Afventer import';
    return '<article class="card" style="margin:8px 0;padding:14px">'+
      '<div class="row" style="align-items:flex-start;flex-wrap:wrap"><div>'+
      '<div class="small muted">Række '+h(item.source_row)+' · '+h(item.source_month)+'</div>'+
      '<h3 style="margin:5px 0">'+h(item.customer_name)+'</h3></div>'+
      '<span class="pill '+(unconfirmed?'yellow':status==='imported'?'green':'red')+'">'+h(label)+'</span></div>'+
      (item.description?'<p style="margin:6px 0">'+h(item.description)+'</p>':'')+
      '<p class="small muted" style="margin:7px 0">'+details+'</p>'+
      (unconfirmed?'<p class="small" style="color:#9a6700">Foreløbigt sat til den 1. i måneden. Datoen er ikke bekræftet.</p>':'')+
      '<div class="row" style="justify-content:flex-start;gap:8px;flex-wrap:wrap">'+actions+'</div></article>';
  }
  function render(){
    var host=document.getElementById('sheetInquiryBody');
    if(!host)return;
    var waiting=inquiries.filter(function(i){return i.date_unconfirmed&&i.booking_id}).length;
    var imported=inquiries.filter(function(i){return i.review_status==='imported'&&!i.date_unconfirmed}).length;
    var pending=inquiries.filter(function(i){return i.review_status==='pending'&&!i.booking_id}).length;
    var ignored=inquiries.filter(function(i){return i.review_status==='ignored'}).length;
    var choices=[['unconfirmed','Afventer godkendelse '+waiting],['imported','I kalender '+imported],
      ['pending','Afventer import '+pending],['ignored','Skjult '+ignored],['all','Alle '+inquiries.length]];
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
      '<p class="muted">33 oprindelige forespørgsler i PALA. Ordrer uden angivet dato er midlertidigt lagt på den 1. i deres måned og afventer datobekræftelse.</p>'+
      '<div class="card" style="padding:14px;margin:12px 0">'+
      '<strong>Manuel Google Sheets-import</strong>'+
      '<p class="small muted">Kun læseadgang til fanen Telt 2027. Google-arket ændres aldrig. Nye ordrer oprettes som Forespørgsel; eksisterende PALA-ordrer genbruges.</p>'+
      '<button id="sheetGoogleImportButton" class="btn primary" onclick="sheetInquirySyncFromGoogle()">Importér seneste opdateringer fra Google Sheets</button>'+
      '<p id="sheetInquiryStatus" class="small muted" style="margin-top:8px">'+h(statusMessage)+'</p>'+
      '<details id="sheetGoogleSetup" style="margin-top:10px"'+(storedClientId()?'':' open')+'>'+
      '<summary class="small">Google-læseadgang · opsætning én gang</summary>'+
      '<p class="small muted">Google OAuth-klient-id til PALA (Webapplikation). Tilladt JavaScript-origin: https://detdondon.github.io. Google Sheets API skal være aktiveret i Google Cloud. Kun læseadgang efter Google-login.</p>'+
      '<input id="sheetGoogleClientId" type="text" autocomplete="off" spellcheck="false" placeholder="Google OAuth Client ID (*.apps.googleusercontent.com)" value="'+h(storedClientId())+'">'+
      '<button class="btn" onclick="sheetInquirySaveGoogleClientId()">Gem Google-forbindelse</button>'+
      '</details></div>'+
      '<div id="sheetInquiryBody"><p class="muted">Henter ordrerne fra PALA…</p></div></div>';
    var result=await sb.rpc('admin_sheet_inquiries',{p_token:adminToken});
    if(result.error){
      var host=document.getElementById('sheetInquiryBody');
      if(host)host.innerHTML='<p class="red">Kunne ikke hente oversigten: '+h(result.error.message)+'</p>';
      return;
    }
    inquiries=Array.isArray(result.data)?result.data:[];
    render();
    ensureGoogleLibrary().catch(function(){/* Vis evt. fejl ved importtryk. */});
  };
  global.sheetInquiryFilter=function(value){
    statusFilter=['unconfirmed','imported','pending','ignored','all'].includes(value)?value:'unconfirmed';
    render();
  };
  global.sheetInquirySearchChanged=function(value){
    query=String(value||'').toLowerCase();
    var input=document.getElementById('sheetInquirySearch');
    var pos=input?input.selectionStart:null;
    render();
    var next=document.getElementById('sheetInquirySearch');
    if(next){next.focus();if(pos!==null)try{next.setSelectionRange(pos,pos);}catch(_e){}}
  };
  global.sheetInquirySaveGoogleClientId=function(){
    if(!isAdminLoggedIn())return showAdminLogin();
    var input=document.getElementById('sheetGoogleClientId');
    var id=str(input&&input.value);
    if(!/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(id)){
      importMessage('Indsæt et gyldigt Google OAuth Client ID fra Google Cloud.',true);return;
    }
    try{localStorage.setItem(CLIENT_ID_KEY,id);}
    catch(_e){importMessage('Browseren tillader ikke at gemme forbindelsen.',true);return;}
    importMessage('Google OAuth Client ID er gemt på denne enhed. Tryk Importér for at give læseadgang.');
    var setup=document.getElementById('sheetGoogleSetup');
    if(setup)setup.open=false;
  };
  function ensureGoogleLibrary(){
    if(global.google&&global.google.accounts&&global.google.accounts.oauth2)return Promise.resolve();
    if(googleLoader)return googleLoader;
    googleLoader=new Promise(function(resolve,reject){
      var script=document.createElement('script');
      script.src='https://accounts.google.com/gsi/client';
      script.async=true;
      script.onload=function(){global.google&&global.google.accounts&&global.google.accounts.oauth2?resolve():reject(new Error('Google-login kunne ikke indlæses'));};
      script.onerror=function(){reject(new Error('Google-login kunne ikke indlæses'));};
      document.head.appendChild(script);
    }).catch(function(error){googleLoader=null;throw error;});
    return googleLoader;
  }
  async function fetchAndSync(token){
    var ranges=["'"+TAB_NAME+"'!A1:E1106","'"+TAB_NAME+"'!G1:L1106","'"+TAB_NAME+"'!O1:O1106"];
    var params=ranges.map(function(r){return 'ranges='+encodeURIComponent(r);}).join('&');
    var url='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(SHEET_ID)+
      '/values:batchGet?'+params+'&valueRenderOption=FORMATTED_VALUE';
    var response=await fetch(url,{headers:{Authorization:'Bearer '+token}});
    if(!response.ok){
      var info=await response.json().catch(function(){return {};});
      throw new Error('Google Sheets: '+(info.error&&info.error.message||response.status));
    }
    var data=await response.json();
    var rows=parseGoogleRows(data.valueRanges||[]);
    var result=await sb.rpc('admin_sheet_sync',{p_token:adminToken,p_rows:rows});
    if(result.error)throw new Error('PALA-import: '+result.error.message);
    await reloadData();
    await global.showSheetInquiries();
    var summary=result.data||{};
    importMessage('Import gennemført: '+rows.length+' rækker læst, '+
      Number(summary.created||0)+' nye PALA-ordrer og '+
      Number(summary.updated||0)+' opdaterede.');
  }
  global.sheetInquirySyncFromGoogle=async function(){
    if(!isAdminLoggedIn())return showAdminLogin();
    if(busy)return;
    var id=storedClientId();
    if(!id){
      var setup=document.getElementById('sheetGoogleSetup');
      if(setup)setup.open=true;
      var input=document.getElementById('sheetGoogleClientId');
      if(input)input.focus();
      importMessage('Google-forbindelsen skal opsættes én gang med et OAuth Client ID.',true);
      return;
    }
    setBusy(true);
    try{
      await ensureGoogleLibrary();
      await new Promise(function(resolve,reject){
        var client=global.google.accounts.oauth2.initTokenClient({
          client_id:id,scope:GOOGLE_SCOPE,
          callback:function(response){
            if(!response||!response.access_token){
              reject(new Error((response&&response.error)||'Google gav ikke adgang'));return;
            }
            if(!global.google.accounts.oauth2.hasGrantedAllScopes(response,GOOGLE_SCOPE)){
              reject(new Error('Google-læseadgang blev ikke godkendt'));return;
            }
            fetchAndSync(response.access_token).then(resolve,reject);
          },
          error_callback:function(error){reject(new Error('Google-login blev afbrudt: '+String(error&&error.type||'')));}
        });
        client.requestAccessToken({prompt:''});
      });
    }catch(error){
      importMessage('Importen blev ikke gennemført: '+String(error.message||error),true);
    }finally{setBusy(false);}
  };

  global.sheetInquiryConfirmDate=function(id){
    if(!isAdminLoggedIn())return showAdminLogin();
    var item=inquiries.find(function(i){return Number(i.id)===Number(id);});
    if(!item||!item.date_unconfirmed||!item.booking_id)return;
    var booking=bookings.find(function(b){return Number(b.id)===Number(item.booking_id);});
    var start=booking&&booking.start_date||'';
    var end=booking&&booking.end_date||start;
    var intro='<p class="muted"><strong>'+h(item.customer_name)+'</strong>. Brugsdato mangler i Google-arket. Vælg den bekræftede dato i PALA; arket ændres ikke.</p>';
    var fields=sheetField('sheetImportStart','Brugsperiode fra',start,'date','required')+
      sheetField('sheetImportEnd','Brugsperiode til',end,'date','required');
    openEditSheet('Bekræft dato for forespørgsel',intro+fields,async function(){
      var from=sheetValue('sheetImportStart'),to=sheetValue('sheetImportEnd');
      if(!from||!to||to<from)throw new Error('Angiv en gyldig brugsperiode');
      var result=await sb.rpc('admin_sheet_confirm_date',{
        p_token:adminToken,p_import_id:Number(id),p_start_date:from,p_end_date:to
      });
      if(result.error)throw new Error(result.error.message);
      await reloadData();
      await global.showSheetInquiries();
    },'Bekræft dato');
  };
  global.sheetInquiryApprove=function(id){
    if(!isAdminLoggedIn())return showAdminLogin();
    var item=inquiries.find(function(i){return Number(i.id)===Number(id);});
    if(!item||item.booking_id)return;
    var fields=sheetField('sheetImportStart','Brugsperiode fra','','date','required')+
      sheetField('sheetImportEnd','Brugsperiode til','','date','required');
    openEditSheet('Opret forespørgsel',fields,async function(){
      var from=sheetValue('sheetImportStart'),to=sheetValue('sheetImportEnd');
      if(!from||!to||to<from)throw new Error('Angiv en gyldig brugsperiode');
      var result=await sb.rpc('admin_sheet_inquiry_create_booking',{
        p_token:adminToken,p_import_id:Number(id),p_start_date:from,p_end_date:to,
        p_delivery_date:null,p_pickup_date:null
      });
      if(result.error)throw new Error(result.error.message);
      await reloadData();await global.showSheetInquiries();
    },'Opret forespørgsel');
  };
  global.sheetInquiryReview=async function(id,action){
    if(!isAdminLoggedIn())return showAdminLogin();
    var result=await sb.rpc('admin_sheet_inquiry_review',{p_token:adminToken,p_import_id:Number(id),p_action:action});
    if(result.error){alert('Kunne ikke opdatere forespørgslen: '+result.error.message);return;}
    await global.showSheetInquiries();
  };
  global.sheetInquiryOpenBooking=async function(bookingId){
    if(!isAdminLoggedIn())return showAdminLogin();
    var booking=bookings.find(function(b){return Number(b.id)===Number(bookingId);});
    if(!booking){await reloadData();booking=bookings.find(function(b){return Number(b.id)===Number(bookingId);});}
    if(booking)editOrder(booking.id);
    else alert('Ordren kunne ikke indlæses. Prøv at opdatere PALA.');
  };
  global.sheetInquiryParseGoogleRows=parseGoogleRows;
})(window);
