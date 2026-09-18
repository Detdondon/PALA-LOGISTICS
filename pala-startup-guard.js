/* PALA startup guard v273 · clears restored transient UI before app boot */
(()=>{
'use strict';
if(window.__palaStartupGuardV273)return;
window.__palaStartupGuardV273=true;

function clearStaleStartupUi(){
  const app=document.getElementById('app');
  if(!app||!/Indlæser/i.test(app.textContent||''))return;

  document.querySelectorAll('.dialog-backdrop').forEach(node=>node.remove());
  document.querySelectorAll('dialog[open]').forEach(dialog=>{
    try{dialog.close()}catch(_){}
    try{dialog.remove()}catch(_){}
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',clearStaleStartupUi,{once:true});
}else{
  clearStaleStartupUi();
}
window.addEventListener('pageshow',clearStaleStartupUi);
})();
