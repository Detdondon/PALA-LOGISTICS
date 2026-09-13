/* PALA v162 · settings icon with standard PALA stroke weight
   Keeps the approved gear silhouette, but renders it like the rest of the icon set. */
(()=>{
'use strict';
if(window.__palaSettingsIconV162)return;
window.__palaSettingsIconV162=true;

const GEAR_OUTLINE='<path d="M10.46 2.09 9.15 4.25 6.18 4.01 3.76 6.3 4.42 8.53 2.08 10.44 2 13.64 4.05 14.97 3.65 17.84 5.86 20.07 8.14 19.49 10.19 21.8 13.6 21.85 14.79 19.94 17.9 20.2 20.24 18 19.55 15.84 21.89 13.98 21.97 10.74 19.95 9.46 20.35 6.51 18.14 4.19 15.88 4.73 13.84 2.17Z"/><circle cx="12" cy="12" r="4.15"/>';

function gearSvg(cls='ui-icon icon-action'){
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GEAR_OUTLINE}</svg>`;
}

// Update the shared icon definition so all future settings icons match the app icon style.
try{
  if(typeof ICON_LIBRARY==='object'&&ICON_LIBRARY)ICON_LIBRARY.settings=GEAR_OUTLINE;
}catch(_e){}

const baseUiIcon=window.uiIcon;
if(typeof baseUiIcon==='function'){
  window.uiIcon=function(name,cls='ui-icon icon-action'){
    if(name==='settings')return gearSvg(cls);
    return baseUiIcon(name,cls);
  };
}

function isSettingsIcon(svg){
  if(!svg||svg.tagName?.toLowerCase()!=='svg')return false;
  const paths=[...svg.querySelectorAll('path')].map(path=>String(path.getAttribute('d')||''));
  const oldDefault=svg.querySelector('circle[cx="12"][cy="12"][r="3"]')&&paths.some(d=>d.startsWith('M19.4 15'));
  const previousApproved=paths.some(d=>d.startsWith('M10.46 2.09'));
  return !!(oldDefault||previousApproved);
}
function replaceExisting(root=document){
  const list=[];
  if(root?.matches?.('svg'))list.push(root);
  root?.querySelectorAll?.('svg')?.forEach(svg=>list.push(svg));
  list.forEach(svg=>{
    if(!isSettingsIcon(svg))return;
    const template=document.createElement('template');
    template.innerHTML=gearSvg(svg.getAttribute('class')||'ui-icon icon-action');
    svg.replaceWith(template.content.firstElementChild);
  });
}

replaceExisting();
new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
  if(node.nodeType===1)replaceExisting(node);
}))).observe(document.documentElement,{childList:true,subtree:true});
})();
