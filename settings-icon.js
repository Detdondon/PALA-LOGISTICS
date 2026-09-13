/* PALA v161 · updated gear/settings icon
   Shape derived from the approved PALA gear reference. */
(()=>{
'use strict';
if(window.__palaSettingsIconV161)return;
window.__palaSettingsIconV161=true;

const GEAR_PATH='<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" stroke="none" d="M10.46 2.09 L9.15 4.25 L6.18 4.01 L3.76 6.3 L4.42 8.53 L2.08 10.44 L2 13.64 L4.05 14.97 L3.65 17.84 L5.86 20.07 L8.14 19.49 L10.19 21.8 L13.6 21.85 L14.79 19.94 L17.9 20.2 L20.24 18 L19.55 15.84 L21.89 13.98 L21.97 10.74 L19.95 9.46 L20.35 6.51 L18.14 4.19 L15.88 4.73 L13.84 2.17 Z M10.75 3.34 L13.25 3.37 L15.72 6.03 L17.45 5.28 L19.07 6.93 L18.91 10.23 L20.75 10.95 L20.75 13.42 L18.25 15.66 L19.05 17.41 L17.48 18.95 L14.05 18.9 L13.25 20.63 L10.72 20.63 L8.3 18.18 L6.52 18.98 L4.93 17.41 L5.09 14.17 L3.22 13.42 L3.22 10.95 L5.72 8.69 L4.9 6.93 L6.55 5.28 L9.95 5.26 Z M11.49 8.34 L10.06 8.8 L8.81 9.86 L8.14 11.14 L8.01 12.76 L8.52 14.22 L9.55 15.39 L10.8 16.03 L12.4 16.19 L14.07 15.63 L15.14 14.7 L15.88 13.18 L15.96 11.75 L15.51 10.36 L14.55 9.22 L13.22 8.5 Z M11.57 9.59 L12.8 9.67 L13.7 10.15 L14.39 10.98 L14.71 12.01 L14.58 13.1 L14.13 13.93 L13.36 14.59 L12.32 14.94 L11.28 14.86 L10.35 14.41 L9.55 13.48 L9.29 12.62 L9.39 11.43 L9.9 10.52 L10.64 9.91 Z"/>';

function gearSvg(cls='ui-icon icon-action'){
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${GEAR_PATH}</svg>`;
}

// Update the shared icon library when it is available.
try{
  if(typeof ICON_LIBRARY==='object'&&ICON_LIBRARY)ICON_LIBRARY.settings=GEAR_PATH;
}catch(_e){}

// Fallback/guarantee: route all future settings icons through the approved shape.
const baseUiIcon=window.uiIcon;
if(typeof baseUiIcon==='function'){
  window.uiIcon=function(name,cls='ui-icon icon-action'){
    if(name==='settings')return gearSvg(cls);
    return baseUiIcon(name,cls);
  };
}

function isOldSettingsIcon(svg){
  if(!svg||svg.tagName?.toLowerCase()!=='svg')return false;
  const center=svg.querySelector('circle[cx="12"][cy="12"][r="3"]');
  if(!center)return false;
  return [...svg.querySelectorAll('path')].some(path=>String(path.getAttribute('d')||'').startsWith('M19.4 15'));
}
function replaceExisting(root=document){
  const list=[];
  if(root?.matches?.('svg'))list.push(root);
  root?.querySelectorAll?.('svg')?.forEach(svg=>list.push(svg));
  list.forEach(svg=>{
    if(!isOldSettingsIcon(svg))return;
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
