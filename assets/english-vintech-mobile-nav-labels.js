(() => {
  'use strict';

  const bindLocalizedMenuLabels = () => {
    document.querySelectorAll('.site-nav .mobile-menu[data-open-label][data-close-label]').forEach(menu => {
      if (menu.dataset.localizedLabelBound) return;
      const nav = menu.closest('.site-nav');
      if (!nav) return;

      const updateLabel = () => {
        const label = nav.classList.contains('menu-open')
          ? menu.dataset.closeLabel
          : menu.dataset.openLabel;
        if (menu.getAttribute('aria-label') !== label) {
          menu.setAttribute('aria-label', label);
        }
      };

      const observer = new MutationObserver(updateLabel);
      observer.observe(nav, { attributes: true, attributeFilter: ['class'] });
      menu.dataset.localizedLabelBound = 'true';
      updateLabel();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLocalizedMenuLabels, { once: true });
  } else {
    bindLocalizedMenuLabels();
  }
})();
