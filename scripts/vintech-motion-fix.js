/* Resilient VinTech motion controller: no external animation dependency. */
(() => {
  'use strict';
  const init = () => {
    const nodes = document.querySelectorAll('.vt-hero,.vin-hero,.vt-card,.vin-card,.vt-panel');
    if (!nodes.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    nodes.forEach((el, i) => {
      el.style.setProperty('--vt-delay', `${Math.min(i * 70, 420)}ms`);
      el.classList.add('vt-motion-ready');
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
