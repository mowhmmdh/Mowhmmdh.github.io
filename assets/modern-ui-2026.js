(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const path = location.pathname.replace(/\/$/, '');
  const isVinTech = /\/vintech\.html$/.test(path) || /\/en-vintech\.html$/.test(path);

  const initVinTechNav = () => {
    if (!isVinTech) return;
    const header = document.querySelector('.vt-nav');
    const menu = document.querySelector('.vt-menu');
    const nav = document.querySelector('.vt-links');
    if (!header || !menu || !nav) return;
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      header.classList.toggle('is-open', !open);
      document.body.classList.toggle('vt-menu-open', !open);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.setAttribute('aria-expanded', 'false');
      header.classList.remove('is-open');
      document.body.classList.remove('vt-menu-open');
    }));
  };

  const initReveal = () => {
    if (!isVinTech) return;
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (reduce || !('IntersectionObserver' in window)) return;
    items.forEach(el => el.classList.add('vt-ready'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
    items.forEach(el => io.observe(el));
  };

  const initCards = () => {
    document.querySelectorAll('.card,.service-card,.project-card,.timeline-item,.skill-category,.faq-item,.portrait,.profile-card,.cta,.metric,.vt-card').forEach(el => {
      if (reduce) return;
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

  const mount = () => {
    initVinTechNav();
    initReveal();
    initCards();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();

  if (!reduce) {
    addEventListener('pointermove', e => {
      root.style.setProperty('--ui-pointer-x', `${e.clientX}px`);
      root.style.setProperty('--ui-pointer-y', `${e.clientY}px`);
    }, {passive:true});
  }
})();