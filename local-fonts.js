/* PALA local fonts v218 · removes Google Fonts from the critical rendering path */
(function(){
  'use strict';
  const style=document.createElement('style');
  style.textContent="@font-face{font-family:Inter;src:url('./fonts/inter-400.ttf') format('truetype');font-style:normal;font-weight:400 600;font-display:swap}@font-face{font-family:Inter;src:url('./fonts/inter-700.ttf') format('truetype');font-style:normal;font-weight:700 900;font-display:swap}";
  document.head.appendChild(style);
  document.querySelectorAll('link[href*="fonts.googleapis.com"],link[href*="fonts.gstatic.com"]').forEach(node=>node.remove());
})();
