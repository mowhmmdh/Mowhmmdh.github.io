/* Resilient VinTech motion controller. No external dependency; avoids off-screen animation and layout jumps. */
(() => {
  'use strict';
  const init = () => {
    const nodes = [...document.querySelectorAll('.vt-hero,.vin-hero,.vt-card,.vin-card,.vt-panel')];
    if (!nodes.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const reveal = (el, i) => {
      el.style.setProperty('--vt-delay', String(Math.min(i * 70, 420)) + 'ms');
      el.classList.add('vt-motion-ready');
    };
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(reveal);
      return;
    }
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target, Math.max(0, nodes.indexOf(entry.target)));
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.08, rootMargin: '0px 0px -8% 0px'});
    nodes.forEach(node => io.observe(node));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
