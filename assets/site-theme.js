(() => {
  'use strict';
  const root = document.documentElement;
  const storageKey = 'mha-theme';
  try {
    if (localStorage.getItem(storageKey) === 'light') root.classList.add('theme-light');
  } catch (_) {}
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    const sync = () => {
      const light = root.classList.contains('theme-light');
      btn.textContent = light ? '☀' : '☾';
      btn.setAttribute('aria-label', light ? 'فعال‌کردن حالت تیره' : 'فعال‌کردن حالت روشن');
      btn.setAttribute('aria-pressed', String(light));
    };
    btn.addEventListener('click', () => {
      root.classList.toggle('theme-light');
      try { localStorage.setItem(storageKey, root.classList.contains('theme-light') ? 'light' : 'dark'); } catch (_) {}
      sync();
    });
    sync();
  });
  document.querySelectorAll('.site-nav').forEach(nav => {
    const menu = nav.querySelector('.mobile-menu');
    const links = nav.querySelector('.nav-links');
    if (!menu || !links) return;
    menu.setAttribute('aria-expanded','false');
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
      menu.textContent = open ? '×' : '☰';
    });
    links.addEventListener('click', e => {
      if (e.target.closest('a')) {
        nav.classList.remove('menu-open');
        menu.setAttribute('aria-expanded','false');
        menu.textContent='☰';
      }
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.site-nav.menu-open').forEach(nav => {
      nav.classList.remove('menu-open');
      const menu=nav.querySelector('.mobile-menu');
      if(menu){menu.setAttribute('aria-expanded','false');menu.textContent='☰';}
    });
  });
  // Intentionally no service-worker registration: stale offline caches must never override GitHub Pages assets.
})();
