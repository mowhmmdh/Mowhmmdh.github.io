(() => {
  'use strict';

  /* Central responsive layer: loaded once on every page that uses site-theme.js. */
  const responsiveHref = '/assets/responsive-core-2026.css';
  if (!document.querySelector(`link[rel="stylesheet"][href="${responsiveHref}"]`)) {
    const responsiveLink = document.createElement('link');
    responsiveLink.rel = 'stylesheet';
    responsiveLink.href = responsiveHref;
    responsiveLink.dataset.responsiveCore = '2026';
    document.head.appendChild(responsiveLink);
  }

  const root = document.documentElement;
  const storageKey = 'mha-theme';
  const FULL_NAME = 'محمدحسین عسگری ثمرین';
  const SHORT_NAME = 'محمدحسین عسگری';
  const shortNamePattern = new RegExp(`${SHORT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\s*ثمرین)`, 'g');
  const normalizeIdentity = () => {
    const replaceShortName = value => typeof value === 'string' ? value.replace(shortNamePattern, FULL_NAME) : value;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('script,style,noscript,template')) continue;
      nodes.push(node);
    }
    for (const textNode of nodes) textNode.nodeValue = replaceShortName(textNode.nodeValue);

    if (document.title.includes(SHORT_NAME) && !document.title.includes(FULL_NAME)) {
      document.title = replaceShortName(document.title);
    }

    document.querySelectorAll('meta[content], img[alt], a[aria-label], button[aria-label]').forEach(el => {
      const attr = el.hasAttribute('content') ? 'content' : el.hasAttribute('alt') ? 'alt' : 'aria-label';
      const value = el.getAttribute(attr);
      if (value && value.includes(SHORT_NAME) && !value.includes(FULL_NAME)) el.setAttribute(attr, replaceShortName(value));
    });
  };

  try { if (localStorage.getItem(storageKey) === 'light') root.classList.add('theme-light'); } catch (_) {}

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

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.site-nav.menu-open').forEach(nav => {
      nav.classList.remove('menu-open');
      const menu = nav.querySelector('.mobile-menu');
      if (menu) { menu.setAttribute('aria-expanded', 'false'); menu.textContent = '☰'; }
    });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', normalizeIdentity, { once: true });
  else normalizeIdentity();
})();
