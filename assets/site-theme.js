(() => {
  'use strict';

  const root = document.documentElement;
  const storageKey = 'mha-theme';

  const ensureResponsiveCore = () => {
    if (document.querySelector('link[data-responsive-core]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/responsive-core-2026.css';
    link.dataset.responsiveCore = 'true';
    document.head.appendChild(link);
  };

  const getStoredTheme = () => {
    try { return localStorage.getItem(storageKey); } catch (_) { return null; }
  };

  const prefersLight = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

  const applyTheme = (mode) => {
    const isLight = mode === 'light';
    root.classList.toggle('theme-light', isLight);
    root.dataset.theme = isLight ? 'light' : 'dark';
  };

  const initialTheme = getStoredTheme() || (prefersLight() ? 'light' : 'dark');
  applyTheme(initialTheme);

  if (!getStoredTheme() && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    media.addEventListener?.('change', e => applyTheme(e.matches ? 'light' : 'dark'));
  }

  const syncThemeButtons = () => {
    const light = root.classList.contains('theme-light');
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = light ? '☀' : '☾';
      btn.setAttribute('aria-label', light ? 'فعال‌کردن حالت تیره' : 'فعال‌کردن حالت روشن');
      btn.setAttribute('aria-pressed', String(light));
    });
  };

  const bindThemeButtons = () => {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      if (btn.dataset.themeBound === 'true') return;
      btn.dataset.themeBound = 'true';
      btn.addEventListener('click', () => {
        const next = root.classList.contains('theme-light') ? 'dark' : 'light';
        applyTheme(next);
        try { localStorage.setItem(storageKey, next); } catch (_) {}
        syncThemeButtons();
      });
    });
    syncThemeButtons();
  };

  const bindMenus = () => {
    document.querySelectorAll('.site-nav').forEach(nav => {
      const menu = nav.querySelector('.mobile-menu');
      const links = nav.querySelector('.nav-links');
      if (!menu || !links || menu.dataset.menuBound === 'true') return;
      menu.dataset.menuBound = 'true';
      menu.setAttribute('aria-expanded', 'false');
      menu.addEventListener('click', () => {
        const open = nav.classList.toggle('menu-open');
        menu.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
        menu.textContent = open ? '×' : '☰';
      });
      links.addEventListener('click', e => {
        if (e.target.closest('a')) {
          nav.classList.remove('menu-open');
          menu.setAttribute('aria-expanded', 'false');
          menu.textContent = '☰';
        }
      });
    });
  };

  const bindEscape = () => {
    if (window.__mhaEscapeBound) return;
    window.__mhaEscapeBound = true;
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.site-nav.menu-open').forEach(nav => {
        nav.classList.remove('menu-open');
        const menu = nav.querySelector('.mobile-menu');
        if (menu) {
          menu.setAttribute('aria-expanded', 'false');
          menu.textContent = '☰';
        }
      });
    });
  };

  const boot = () => {
    ensureResponsiveCore();
    bindThemeButtons();
    bindMenus();
    bindEscape();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();