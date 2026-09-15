(() => {
  'use strict';

  const root = document.documentElement;
  const storageKey = 'mha-theme';
  const FULL_NAME = 'محمدحسین عسگری ثمرین';
  const SHORT_NAME = 'محمدحسین عسگری';

  const normalizeIdentity = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    for (const textNode of nodes) {
      if (textNode.nodeValue?.includes(SHORT_NAME)) {
        textNode.nodeValue = textNode.nodeValue.replaceAll(SHORT_NAME, FULL_NAME);
      }
    }
    if (document.title.includes(SHORT_NAME)) {
      document.title = document.title.replaceAll(SHORT_NAME, FULL_NAME);
    }
    document.querySelectorAll('meta[content]').forEach(meta => {
      if (meta.content.includes(SHORT_NAME)) meta.content = meta.content.replaceAll(SHORT_NAME, FULL_NAME);
    });
    document.querySelectorAll('img[alt],a[aria-label],button[aria-label]').forEach(el => {
      ['alt', 'aria-label'].forEach(attr => {
        if (el.hasAttribute(attr) && el.getAttribute(attr).includes(SHORT_NAME)) {
          el.setAttribute(attr, el.getAttribute(attr).replaceAll(SHORT_NAME, FULL_NAME));
        }
      });
    });
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      if (script.textContent.includes(SHORT_NAME)) script.textContent = script.textContent.replaceAll(SHORT_NAME, FULL_NAME);
    });
  };

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
      if (menu) {
        menu.setAttribute('aria-expanded', 'false');
        menu.textContent = '☰';
      }
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeIdentity, { once: true });
  } else {
    normalizeIdentity();
  }
})();
