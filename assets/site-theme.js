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
    style.textContent = "html{background:var(--mha-bg,#070b12)!important;color:var(--mha-text,#edf2f7)!important;color-scheme:dark}html[data-theme=\"light\"]{--mha-bg:#f6f8fb;--mha-surface:#fff;--mha-surface-2:#eef2f6;--mha-text:#17212b;--mha-muted:#526170;--mha-line:#d8e0e8;--mha-accent:#8b5b00;--mha-accent-strong:#a66d00;color-scheme:light}html[data-theme=\"dark\"]{--mha-bg:#070b12;--mha-surface:#0d1722;--mha-surface-2:#12202d;--mha-text:#edf2f7;--mha-muted:#a5b2c0;--mha-line:#243445;--mha-accent:#d9ad55;--mha-accent-strong:#f2ce7d;color-scheme:dark}body{background-color:var(--mha-bg)!important;color:var(--mha-text)!important}:where(.site-nav,.navbar,.nav,.header-nav,.vt-nav,.mh-nav){background:var(--mha-surface)!important;color:var(--mha-text)!important;border-color:var(--mha-line)!important}:where(.card,.post-card,.project-card,.service-card,.about-card,.feature-card,.timeline-item,.skill-category,.faq-item,.contact-wrapper,.metric,.stat,.profile-card,.panel,.feature,.case-card,.case-study,.service,.vt-card,.vt-panel,.mh-card,.mh-expertise,.mh-identity-card){background:var(--mha-surface)!important;color:var(--mha-text)!important;border-color:var(--mha-line)!important}:where(.nav a,.navbar a,.header-nav a,.site-nav a,.mh-nav a){color:var(--mha-muted)!important}:where(.nav a:hover,.navbar a:hover,.header-nav a:hover,.site-nav a:hover,.mh-nav a:hover){color:var(--mha-accent-strong)!important}:where(p,li,dd,dt,small,.muted,.sub,.subtitle,.description,.lead,.hero-subtitle,.card p,.post-card p,.meta,.meta span,.mh-lead,.mh-section-lead){color:var(--mha-muted)}:where(h1,h2,h3,h4,h5,h6){color:var(--mha-text)}:where(input,textarea,select){background:var(--mha-surface)!important;color:var(--mha-text)!important;border-color:var(--mha-line)!important}:where(input,textarea,select)::placeholder{color:var(--mha-muted)!important}:where(.theme-toggle,.mobile-menu){background:var(--mha-surface)!important;color:var(--mha-text)!important;border-color:var(--mha-line)!important}:where(.theme-toggle:hover,.mobile-menu:hover){background:var(--mha-surface-2)!important;border-color:var(--mha-accent)!important}:where(.mh-eyebrow,.mh-kicker,.eyebrow,.kicker,.section-tag,.tag,.vt-kicker){color:var(--mha-accent-strong)!important}html[data-theme=\"light\"] :where(.terminal,.mh-terminal,pre){background:#111923!important;color:#dbe4ec!important}html[data-theme=\"light\"] :where(.btn.primary,.btn-primary,.vt-btn.primary,.mh-btn-primary){background:var(--mha-accent)!important;color:#fff!important;border-color:var(--mha-accent)!important}html[data-theme=\"dark\"] :where(.btn.primary,.btn-primary,.vt-btn.primary,.mh-btn-primary){background:linear-gradient(135deg,#d2a84e,#f0c85a)!important;color:#10151a!important;border-color:#d2a84e!important}:where(.card,.post-card,.project-card,.service-card,.about-card,.feature-card,.case-card,.case-study,.service,.vt-card,.vt-panel,.mh-card,.mh-expertise){transition:transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s ease,border-color .22s ease!important}html.mha-theme-switching *{transition:none!important;animation:none!important}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}*,*::before,*::after{animation:none!important;transition:none!important}}";
    style.textContent += "html:not(.mha-motion-ready) [data-reveal]{opacity:1!important;transform:none!important;visibility:visible!important}html.mha-motion-ready [data-reveal]{visibility:visible}html.mha-theme-switching [data-reveal]{opacity:1!important;transform:none!important}";
    document.head.appendChild(style);
  };

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
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();