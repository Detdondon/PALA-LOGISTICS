from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')
marker='PALA v136 · prevent calendar summary text overflow'
if marker in text:
    raise SystemExit('PALA v136 already present')

# Bump the currently displayed release number only.
text=text.replace('<span class="app-version" hidden>v135</span>','<span class="app-version" hidden>v136</span>')
text=text.replace("document.querySelector('.app-version').textContent='v135';","document.querySelector('.app-version').textContent='v136';",1)
text=text.replace("badge.textContent='v135';","badge.textContent='v136';",1)

needle='\nsyncLoginUi();\n\n</script></body></html>'
if needle not in text:
    raise SystemExit('Final script marker not found')

patch=r'''

/* PALA v136 · prevent calendar summary text overflow */
if(!document.getElementById('pala-v136-summary-button-style')){
  let style=document.createElement('style');
  style.id='pala-v136-summary-button-style';
  style.textContent=`
    .unified-calendar-summary-v123 .reference-button{
      width:100%!important;
      min-width:0!important;
      max-width:100%!important;
      box-sizing:border-box!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
      padding:9px 7px!important;
      overflow:hidden!important;
      white-space:normal!important;
      text-align:center!important;
      line-height:1.15!important;
    }
    .unified-calendar-summary-v123 .reference-button svg{
      flex:0 0 auto!important;
      width:18px!important;
      height:18px!important;
    }
    .unified-calendar-summary-v123 .reference-button .summary-label-v136{
      min-width:0!important;
      max-width:100%!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      word-break:normal!important;
      text-align:center!important;
    }
    @media(max-width:430px){
      .unified-calendar-summary-v123{gap:6px!important}
      .unified-calendar-summary-v123 .reference-button{
        gap:4px!important;
        padding:8px 5px!important;
        font-size:10px!important;
      }
      .unified-calendar-summary-v123 .reference-button svg{
        width:16px!important;
        height:16px!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function fixCalendarSummaryButtonTextV136(){
  document.querySelectorAll('.unified-calendar-summary-v123 .reference-button').forEach(button=>{
    if(button.querySelector('.summary-label-v136'))return;
    let textNodes=[...button.childNodes].filter(node=>node.nodeType===3&&node.textContent.trim());
    if(!textNodes.length)return;
    let label=document.createElement('span');
    label.className='summary-label-v136';
    label.textContent=textNodes.map(node=>node.textContent).join('').trim();
    textNodes[0].replaceWith(label);
    textNodes.slice(1).forEach(node=>node.remove());
  });
}

const applyUnifiedCalendarTopV136Base=applyUnifiedCalendarTopV123;
applyUnifiedCalendarTopV123=function(){
  let result=applyUnifiedCalendarTopV136Base.apply(this,arguments);
  fixCalendarSummaryButtonTextV136();
  return result;
};

const syncVersionBadgeV136Base=syncVersionBadgeV134;
syncVersionBadgeV134=function(){
  let result=syncVersionBadgeV136Base.apply(this,arguments);
  let badge=document.querySelector('.app-version');
  if(badge)badge.textContent='v136';
  return result;
};
'''

path.write_text(text.replace(needle,patch+needle,1),encoding='utf-8')
