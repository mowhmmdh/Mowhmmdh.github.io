/* Legacy compatibility layer for older page templates.
   Current pages use assets/site-theme.js for theme/navigation state.
   Keep this file safe when loaded on any page. */
(() => {
  'use strict';

  const FULL_NAME = 'محمدحسین عسگری ثمرین';
  const LEGACY_SHORT = 'محمدحسین عسگری';

  const normalizeIdentity = () => {
    const escaped = LEGACY_SHORT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`${escaped}(?!\\s*ثمرین)`, 'g');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('script,style,noscript,template')) continue;
      nodes.push(node);
    }
    for (const textNode of nodes) textNode.nodeValue = textNode.nodeValue.replace(pattern, FULL_NAME);
  };

  const init = () => {
    normalizeIdentity();

    document.querySelectorAll('.share-btn[data-share]').forEach((button) => {
      if (button.dataset.legacyBound === '1') return;
      button.dataset.legacyBound = '1';
      button.addEventListener('click', async () => {
        const type = button.dataset.share;
        const url = window.location.href;
        const title = document.title;
        if (type === 'copy' && navigator.clipboard?.writeText) {
          try { await navigator.clipboard.writeText(url); } catch (_) {}
          return;
        }
        const targets = {
          linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
        };
        if (targets[type]) window.open(targets[type], '_blank', 'noopener,noreferrer,width=600,height=500');
      });
    });

    const scrollTop = document.getElementById('scrollTop');
    if (scrollTop && scrollTop.dataset.legacyBound !== '1') {
      scrollTop.dataset.legacyBound = '1';
      const sync = () => { scrollTop.hidden = window.scrollY < 300; };
      scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      window.addEventListener('scroll', sync, { passive: true });
      sync();
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}), { once: true });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
