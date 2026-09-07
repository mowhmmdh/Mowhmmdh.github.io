(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const addVinTechAbout = () => {
    if (!/\/vintech\.html$/.test(location.pathname)) return;
    document.querySelectorAll('.nav-links,.links').forEach(nav => {
      if (nav.querySelector('[data-personal-about]')) return;
      const a = document.createElement('a');
      a.href = '/about.html';
      a.textContent = 'درباره ما';
      a.setAttribute('data-personal-about','true');
      a.className = 'vintech-about-link';
      nav.appendChild(a);
    });
  };
  const mount = () => {
    addVinTechAbout();
    document.querySelectorAll('.card,.service-card,.project-card,.timeline-item,.skill-category,.faq-item,.portrait,.profile-card,.cta,.metric').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--card-x', `${e.clientX-r.left}px`);
        el.style.setProperty('--card-y', `${e.clientY-r.top}px`);
      }, {passive:true});
    });
  };
  let raf = 0;
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    root.style.setProperty('--scroll-progress', (scrollY / max).toFixed(4));
    raf = 0;
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(updateScroll); }, {passive:true});
  updateScroll();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  if (reduce) return;
  addEventListener('pointermove', e => {
    root.style.setProperty('--ui-pointer-x', `${e.clientX}px`);
    root.style.setProperty('--ui-pointer-y', `${e.clientY}px`);
  }, {passive:true});
})();