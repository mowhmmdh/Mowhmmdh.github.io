'use strict';

const { chromium } = require('playwright');

const previewUrl = process.env.PREVIEW_URL || 'https://deploy-preview-27--mowhmmdh.netlify.app';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const spec of viewports) {
      const page = await browser.newPage({
        viewport: { width: spec.width, height: spec.height },
        reducedMotion: 'reduce'
      });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      const response = await page.goto(previewUrl, {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      if (!response || !response.ok()) {
        throw new Error('Preview did not return HTTP success for ' + spec.name);
      }

      await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      });

      const snapshot = await page.evaluate(() => {
        const rect = selector => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height)
          };
        };
        const header = document.querySelector('.mh-header');
        const profile = document.querySelector('img[src="/images/profile.webp"]');
        const brand = document.querySelector('.mh-brand');
        const links = document.querySelector('.mh-nav-links');
        const request = document.querySelector('a[href="/vintech/request.html"]');
        const scrollWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth
        );
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          viewportWidth: window.innerWidth,
          scrollWidth,
          horizontalOverflow: scrollWidth > window.innerWidth + 1,
          headerPosition: header ? getComputedStyle(header).position : null,
          heroVisible: !!rect('.mh-hero'),
          heroVisualVisible: !!rect('.mh-hero-visual'),
          conversionLinkPresent: !!request,
          profileLazy: !!profile && profile.getAttribute('loading') === 'lazy',
          navLinkCount: links ? links.querySelectorAll('a').length : 0,
          brandLabel: brand ? (brand.getAttribute('aria-label') || brand.textContent).trim() : '',
          headerRect: rect('.mh-header'),
          heroRect: rect('.mh-hero'),
          heroVisualRect: rect('.mh-hero-visual')
        };
      });

      if (snapshot.lang !== 'fa' || snapshot.dir !== 'rtl') {
        throw new Error(spec.name + ': Persian RTL document contract failed: ' + JSON.stringify(snapshot));
      }
      if (snapshot.horizontalOverflow) {
        throw new Error(spec.name + ': horizontal overflow detected: ' + JSON.stringify(snapshot));
      }
      if (snapshot.headerPosition !== 'sticky') {
        throw new Error(spec.name + ': homepage header is not sticky: ' + snapshot.headerPosition);
      }
      if (!snapshot.heroVisible || !snapshot.heroVisualVisible) {
        throw new Error(spec.name + ': hero content is not visible.');
      }
      if (!snapshot.conversionLinkPresent || !snapshot.profileLazy || snapshot.navLinkCount < 8) {
        throw new Error(spec.name + ': key homepage content contract failed: ' + JSON.stringify(snapshot));
      }
      if (!snapshot.brandLabel.includes('MH') || !snapshot.brandLabel.includes('VinTech')) {
        throw new Error(spec.name + ': accessible brand label is incomplete.');
      }

      const themeToggle = page.locator('.theme-toggle');
      if (await themeToggle.count() !== 1) {
        throw new Error(spec.name + ': expected one theme toggle.');
      }
      await themeToggle.click();
      const lightEnabled = await page.evaluate(() => document.documentElement.classList.contains('theme-light'));
      if (!lightEnabled) throw new Error(spec.name + ': light theme did not activate.');
      await themeToggle.click();
      const lightStillEnabled = await page.evaluate(() => document.documentElement.classList.contains('theme-light'));
      if (lightStillEnabled) throw new Error(spec.name + ': dark theme did not restore.');

      if (pageErrors.length) {
        throw new Error(spec.name + ': uncaught browser errors: ' + pageErrors.join(' | '));
      }

      await page.screenshot({
        path: 'qa-artifacts/homepage-' + spec.name + '.png',
        fullPage: true,
        animations: 'disabled'
      });
      results.push({ viewport: spec.name, ...snapshot, pageErrors });
      await page.close();
    }

    process.stdout.write(JSON.stringify({ previewUrl, results }, null, 2) + '\n');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
