(() => {
  'use strict';

  const root = document.documentElement;
  const storageKey = 'mha-theme';

  /* Final visual contract: appended after every stylesheet so theme switching is deterministic.
     It deliberately owns color/transition behavior, not page geometry. */
  const installFinalThemeLayer = () => {
    if (document.getElementById('mha-final-theme-layer')) return;
    const style = document.createElement('style');
    style.id = 'mha-final-theme-layer';
    style.textContent = "html{background:var(--mha-bg,#070b12);color-scheme:dark}html[data-theme=\"light\"]{--mha-bg:#f6f8fb;--mha-text:#17212b;color-scheme:light}html[data-theme=\"dark\"]{--mha-bg:#070b12;--mha-text:#edf2f7;color-scheme:dark}body{background-color:var(--mha-bg)!important;color:var(--mha-text)}html.mha-theme-switching *,html.mha-theme-switching *::before,html.mha-theme-switching *::after{transition:none!important}";
    style.textContent += "html:not(.mha-motion-ready) [data-reveal]{opacity:1!important;transform:none!important;visibility:visible!important}html.mha-motion-ready [data-reveal]{visibility:visible}html.mha-theme-switching [data-reveal]{opacity:1!important;transform:none!important}";
    document.head.appendChild(style);
  };

  const ensureResponsiveCore = () => {
    if (!document.querySelector('link[data-responsive-core]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/responsive-core-2026.css';
      link.dataset.responsiveCore = 'true';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[data-unified-ui]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/unified-ui-2026.css';
      link.dataset.unifiedUi = 'true';
      document.head.appendChild(link);
    }
  };

  const getStoredTheme = () => {
    try { return localStorage.getItem(storageKey); } catch (_) { return null; }
  };

  const prefersLight = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

  const applyTheme = (mode) => {
    const isLight = mode === 'light';
    root.classList.add('mha-theme-switching');
    root.classList.toggle('theme-light', isLight);
    root.dataset.theme = isLight ? 'light' : 'dark';
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('mha-theme-switching')));
  };

  installFinalThemeLayer();

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
    requestAnimationFrame(() => root.classList.add('mha-motion-ready'));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();