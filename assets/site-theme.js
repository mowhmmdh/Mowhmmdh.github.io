(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const storageKey = 'mha-theme';
  const saved = localStorage.getItem(storageKey);
  if (saved === 'light') root.classList.add('theme-light');

  const themeButtons = document.querySelectorAll('.theme-toggle');
  const syncTheme = () => {
    const light = root.classList.contains('theme-light');
    themeButtons.forEach(btn => {
      btn.textContent = light ? '☀' : '☾';
      btn.setAttribute('aria-label', light ? 'فعال‌کردن حالت تیره' : 'فعال‌کردن حالت روشن');
      btn.setAttribute('aria-pressed', String(light));
    });
  };
  themeButtons.forEach(btn => btn.addEventListener('click', () => {
    root.classList.toggle('theme-light');
    localStorage.setItem(storageKey, root.classList.contains('theme-light') ? 'light' : 'dark');
    syncTheme();
  }));
  syncTheme();

  const navs = document.querySelectorAll('.site-nav');
  navs.forEach(nav => {
    const menu = nav.querySelector('.mobile-menu');
    const links = nav.querySelector('.nav-links');
    if (!menu || !links) return;
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? '×' : '☰';
      if (open) {
        const first = links.querySelector('a');
        if (first) first.focus();
      }
    });
    links.addEventListener('click', e => {
      if (e.target.closest('a')) {
        nav.classList.remove('menu-open');
        menu.setAttribute('aria-expanded', 'false');
        menu.textContent = '☰';
      }
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.site-nav.menu-open').forEach(nav => {
        nav.classList.remove('menu-open');
        const menu = nav.querySelector('.mobile-menu');
        if (menu) { menu.setAttribute('aria-expanded', 'false'); menu.textContent = '☰'; }
      });
    }
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
