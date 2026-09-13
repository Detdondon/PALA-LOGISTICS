/* PALA local Supabase client v1
   Minimal Data API client for the PALA surface: rpc, read-only from/select queries,
   and a lightweight sync fallback. Keeps production startup independent of CDN SDKs. */
(function(global){
  'use strict';
  const DEFAULT_TIMEOUT=15000;
  const sleepRefreshMs=30000;

  function errorFrom(body,status,statusText){
    if(body&&typeof body==='object')return {
      message:String(body.message||body.msg||body.error_description||body.error||statusText||('HTTP '+status)),
      code:body.code||null,details:body.details||null,hint:body.hint||null,status
    };
    return {message:String(body||statusText||('HTTP '+status)),code:null,details:null,hint:null,status};
  }
  async function parseBody(response){
    if(response.status===204)return null;
    const text=await response.text();
    if(!text)return null;
    try{return JSON.parse(text)}catch(_){return text}
  }
  function withTimeout(fetchImpl,input,init,timeout=DEFAULT_TIMEOUT){
    if(typeof AbortController==='undefined')return fetchImpl(input,init);
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    const originalSignal=init&&init.signal;
    let detach=null;
    if(originalSignal&&typeof originalSignal.addEventListener==='function'){
      const abort=()=>controller.abort();
      if(originalSignal.aborted)controller.abort();else originalSignal.addEventListener('abort',abort,{once:true});
      detach=()=>originalSignal.removeEventListener?.('abort',abort);
    }
    return Promise.resolve(fetchImpl(input,{...(init||{}),signal:controller.signal})).finally(()=>{clearTimeout(timer);if(detach)detach()});
  }
  class QueryBuilder{
    constructor(client,table){this.client=client;this.table=table;this.params=new URLSearchParams();this.headers={};this.orders=[];this.executed=null;}
    select(columns='*'){this.params.set('select',columns||'*');return this;}
    eq(column,value){this.params.set(column,'eq.'+(value==null?'null':String(value)));return this;}
    order(column,options={}){const dir=options&&options.ascending===false?'desc':'asc';let part=column+'.'+dir;if(options&&options.nullsFirst===true)part+='.nullsfirst';else if(options&&options.nullsFirst===false)part+='.nullslast';this.orders.push(part);this.params.set('order',this.orders.join(','));return this;}
    range(from,to){this.headers.Range=String(from)+'-'+String(to);this.headers['Range-Unit']='items';return this;}
    single(){this.headers.Accept='application/vnd.pgrst.object+json';return this;}
    maybeSingle(){this.headers.Accept='application/vnd.pgrst.object+json';this._maybeSingle=true;return this;}
    async _run(){
      if(this.executed)return this.executed;
      this.executed=(async()=>{
        const qs=this.params.toString();
        const url=this.client.url+'/rest/v1/'+encodeURIComponent(this.table)+(qs?'?'+qs:'');
        try{
          const response=await this.client._fetch(url,{method:'GET',headers:this.client._headers(this.headers)});
          const body=await parseBody(response);
          if(!response.ok){if(this._maybeSingle&&response.status===406)return {data:null,error:null};return {data:null,error:errorFrom(body,response.status,response.statusText)}}
          return {data:body,error:null};
        }catch(err){return {data:null,error:{message:err&&err.name==='AbortError'?'Forbindelsen til databasen fik timeout':String(err&&err.message||err),code:'FETCH_ERROR',details:null,hint:null,status:0}}}
      })();
      return this.executed;
    }
    then(resolve,reject){return this._run().then(resolve,reject)}
    catch(reject){return this._run().catch(reject)}
    finally(handler){return this._run().finally(handler)}
  }
  class Client{
    constructor(url,key,options={}){
      this.url=String(url||'').replace(/\/$/,'');this.key=key;
      const supplied=options&&options.global&&options.global.fetch;
      this.fetchImpl=typeof supplied==='function'?supplied.bind(global):global.fetch.bind(global);
      this.__palaLite=true;
      if(!global.__palaLiteRefreshTimer){
        global.__palaLiteRefreshTimer=setInterval(()=>{try{if(typeof global.scheduleCloudSync==='function')global.scheduleCloudSync()}catch(_){ }},sleepRefreshMs);
      }
    }
    _headers(extra={}){return {'apikey':this.key,'Authorization':'Bearer '+this.key,...extra};}
    _fetch(input,init={}){return withTimeout(this.fetchImpl,input,init,DEFAULT_TIMEOUT);}
    async rpc(name,args={}){
      const url=this.url+'/rest/v1/rpc/'+encodeURIComponent(name);
      try{
        const response=await this._fetch(url,{method:'POST',headers:this._headers({'Content-Type':'application/json','Accept':'application/json'}),body:JSON.stringify(args||{})});
        const body=await parseBody(response);
        if(!response.ok)return {data:null,error:errorFrom(body,response.status,response.statusText)};
        return {data:body,error:null};
      }catch(err){return {data:null,error:{message:err&&err.name==='AbortError'?'Forbindelsen til databasen fik timeout':String(err&&err.message||err),code:'FETCH_ERROR',details:null,hint:null,status:0}}}
    }
    from(table){return new QueryBuilder(this,table);}
    channel(name){return {name,on(){return this},subscribe(){return this},unsubscribe(){return Promise.resolve('ok')}};}
    removeChannel(channel){try{channel&&channel.unsubscribe&&channel.unsubscribe()}catch(_){}return Promise.resolve('ok');}
  }
  global.supabase={createClient:(url,key,options)=>new Client(url,key,options),__palaLite:true};
})(typeof window!=='undefined'?window:globalThis);
