(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  let raf = 0;
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    root.style.setProperty('--scroll-progress', (scrollY / max).toFixed(4));
    raf = 0;
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(updateScroll); }, {passive:true});
  updateScroll();
  if (reduce) return;
  addEventListener('pointermove', e => {
    root.style.setProperty('--ui-pointer-x', `${e.clientX}px`);
    root.style.setProperty('--ui-pointer-y', `${e.clientY}px`);
  }, {passive:true});
  document.querySelectorAll('.card,.service-card,.project-card,.timeline-item,.skill-category,.faq-item,.portrait,.profile-card,.cta').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--card-x', `${e.clientX-r.left}px`);
      el.style.setProperty('--card-y', `${e.clientY-r.top}px`);
    }, {passive:true});
  });
})();