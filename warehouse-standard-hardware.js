/* PALA v184 · fixed standard hardware presentation */
(()=>{
'use strict';
if(window.__palaStandardHardwareV184)return;
window.__palaStandardHardwareV184=true;

const norm=value=>String(value||'').trim().toLocaleLowerCase('da-DK');
const isStandardName=value=>['pløkker','sidestænger'].includes(norm(value));

function decorateChecklist(){
  document.querySelectorAll('.simple-check-line').forEach(row=>{
    const name=row.querySelector('.simple-check-name')?.textContent;
    if(!isStandardName(name))return;
    row.classList.add('pala-standard-hardware-line');
    const qty=row.querySelector('.simple-check-qty');
    const n=Number((qty?.textContent||'').replace(/[^0-9,.-]/g,'').replace(',','.'))||0;
    if(qty&&n>0){
      qty.innerHTML=`${qty.textContent} <span class="pala-standard-badge">Standard hardware</span>`;
      return;
    }
    if(qty)qty.innerHTML='<span class="pala-standard-warning">Standard hardware · pakkemængde mangler på teltet</span>';
    row.classList.remove('scan-done');
    row.querySelectorAll('.check-phase-button').forEach(button=>{
      button.disabled=true;
      button.classList.remove('done');
      button.title='Angiv først pakkemængden under teltets hardware';
    });
  });
}

function decorateTentHardware(){
  [...document.querySelectorAll('.card')].forEach(card=>{
    const title=[...card.querySelectorAll('h3')].find(h=>norm(h.textContent)==='hardware');
    if(!title)return;
    card.querySelectorAll('.item').forEach(row=>{
      const name=row.querySelector('b')?.textContent;
      if(!isStandardName(name))return;
      row.classList.add('pala-standard-hardware-line');
      const qtyLine=[...row.querySelectorAll('.small')].find(el=>/skal med pr\. telt/i.test(el.textContent||''));
      if(!qtyLine)return;
      const match=String(qtyLine.textContent||'').match(/(-?\d+(?:[.,]\d+)?)/);
      const qty=match?Number(match[1].replace(',','.')):0;
      qtyLine.innerHTML=qty>0
        ?`Skal altid med pr. telt: <b>${qty}</b> <span class="pala-standard-badge">Standard hardware</span>`
        :'<span class="pala-standard-warning">Skal altid med · pakkemængde mangler</span>';
    });
  });
}

const baseOrderChecklist=window.openOrderChecklist;
if(typeof baseOrderChecklist==='function')window.openOrderChecklist=async function(){
  const result=await baseOrderChecklist.apply(this,arguments);
  decorateChecklist();
  return result;
};

const baseOpenTent=window.openTent;
if(typeof baseOpenTent==='function')window.openTent=async function(){
  const result=await baseOpenTent.apply(this,arguments);
  decorateTentHardware();
  return result;
};

const style=document.createElement('style');
style.id='pala-standard-hardware-v184-style';
style.textContent=`
  .pala-standard-hardware-line{border-left:3px solid #8aa7c5!important;padding-left:10px!important}
  .pala-standard-badge{display:inline-block;margin-left:5px;padding:2px 6px;border-radius:999px;background:#eef4fa;color:#4d6680;font-size:10px;font-weight:750;vertical-align:1px}
  .pala-standard-warning{display:inline-block;padding:4px 7px;border-radius:8px;background:#fff3d8;color:#805c11;font-weight:750}
  .pala-standard-hardware-line .check-phase-button:disabled{opacity:.45;cursor:not-allowed}
`;
document.head.appendChild(style);
})();
