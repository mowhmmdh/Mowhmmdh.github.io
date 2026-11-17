#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.TARGET_URL || 'http://127.0.0.1:4173/blog/network-security-baseline-for-small-business.html';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

(async () => {
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  const failures = [];
  try {
    for (const spec of viewports) {
      const context = await browser.newContext({
        viewport: { width: spec.width, height: spec.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      const pageErrors = [];
      const consoleErrors = [];
      const requestedPaths = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('request', request => {
        try { requestedPaths.push(new URL(request.url()).pathname); }
        catch (_) { requestedPaths.push(request.url()); }
      });

      try {
        const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
        await page.evaluate(async () => {
          if (document.fonts && document.fonts.ready) await document.fonts.ready;
        });
        const snapshot = await page.evaluate(() => {
          const ctas = Array.from(document.querySelectorAll('a.q-mobile-cta'));
          const cta = ctas[0] || null;
          const ctaStyle = cta ? getComputedStyle(cta) : null;
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          const canonical = document.querySelector('link[rel="canonical"]');
          const hreflangs = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'))
            .map(link => ({ lang: link.getAttribute('hreflang'), href: link.getAttribute('href') }));
          const articleSchema = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map(script => {
              try { return JSON.parse(script.textContent); } catch (_) { return null; }
            }).find(item => item && item['@type'] === 'Article');
          const main = document.querySelector('main#main-content');
          const footerLine = document.querySelectorAll('footer .q-footerline[aria-hidden="true"]');
          const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
          const skipLink = document.querySelector('#skip-to-content');
          return {
            title: document.title,
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            viewportWidth: window.innerWidth,
            scrollWidth,
            horizontalOverflow: scrollWidth > window.innerWidth + 1,
            h1Count: main ? main.querySelectorAll('h1').length : 0,
            h2Count: main ? main.querySelectorAll('h2').length : 0,
            skipLinkTarget: skipLink ? skipLink.getAttribute('href') : null,
            mainPresent: Boolean(main),
            ctaCount: ctas.length,
            ctaDisplay: ctaStyle ? ctaStyle.display : null,
            ctaVisible: Boolean(ctaStyle && ctaStyle.display !== 'none' && ctaStyle.visibility !== 'hidden' && ctaRect && ctaRect.width > 0 && ctaRect.height > 0),
            ctaHref: cta ? cta.getAttribute('href') : null,
            ctaText: cta ? cta.textContent.trim() : null,
            ctaConversion: cta ? cta.getAttribute('data-conversion') : null,
            ctaBottom: ctaRect ? Math.round(ctaRect.bottom) : null,
            footerLineCount: footerLine.length,
            conversionSectionCount: document.querySelectorAll('.seo-conversion-cta').length,
            autoRelatedCount: document.querySelectorAll('.auto-related').length,
            relatedArticlesCount: document.querySelectorAll('.related-articles.site-auto-related').length,
            canonical: canonical ? canonical.getAttribute('href') : null,
            hreflangs,
            articleSchemaLanguage: articleSchema ? articleSchema.inLanguage : null
          };
        });

        const expectedCanonical = 'https://mowhmmdh.github.io/blog/network-security-baseline-for-small-business.html';
        const requiredHreflangs = ['fa-IR', 'en', 'x-default'];
        const mobilePass = spec.name !== 'mobile' || (
          snapshot.ctaVisible &&
          snapshot.ctaHref === '/vintech/request.html' &&
          snapshot.ctaBottom <= spec.height + 1 &&
          Boolean(snapshot.ctaText)
        );
        const desktopPass = spec.name !== 'desktop' || snapshot.ctaDisplay === 'none';
        const hreflangPass = requiredHreflangs.every(lang => snapshot.hreflangs.some(item => item.lang === lang));
        const enhancementScriptsAbsent =
          !requestedPaths.includes('/assets/site-final-quality-2026.js') &&
          !requestedPaths.includes('/assets/interaction-2026.js');
        const requiredAssetsPresent =
          requestedPaths.includes('/assets/site-theme.js') &&
          requestedPaths.includes('/assets/site-bundle.css') &&
          requestedPaths.includes('/assets/site-final-quality-2026.css');
        const pass = Boolean(
          response && response.status() === 200 &&
          snapshot.lang === 'fa' && snapshot.dir === 'rtl' &&
          !snapshot.horizontalOverflow && snapshot.mainPresent &&
          snapshot.h1Count === 1 && snapshot.h2Count >= 8 &&
          snapshot.skipLinkTarget === '#main-content' &&
          snapshot.ctaCount === 1 &&
          snapshot.ctaConversion === 'mobile_service_request' &&
          snapshot.footerLineCount === 1 &&
          snapshot.conversionSectionCount === 1 &&
          snapshot.autoRelatedCount === 1 &&
          snapshot.relatedArticlesCount === 1 &&
          snapshot.canonical === expectedCanonical &&
          hreflangPass && snapshot.articleSchemaLanguage === 'fa-IR' &&
          mobilePass && desktopPass &&
          enhancementScriptsAbsent && requiredAssetsPresent &&
          pageErrors.length === 0 && consoleErrors.length === 0
        );

        if (!pass) failures.push({
          viewport: spec.name,
          status: response ? response.status() : null,
          snapshot,
          requestedPaths,
          pageErrors,
          consoleErrors,
          enhancementScriptsAbsent,
          requiredAssetsPresent
        });
        await page.screenshot({
          path: 'qa-artifacts/baseline-' + spec.name + '.png',
          fullPage: true,
          animations: 'disabled'
        });
        results.push({
          viewport: spec.name,
          status: response ? response.status() : null,
          snapshot,
          requestedPaths,
          pageErrors,
          consoleErrors,
          enhancementScriptsAbsent,
          requiredAssetsPresent,
          pass
        });
      } catch (error) {
        failures.push({ viewport: spec.name, error: error.message, pageErrors, consoleErrors });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  const report = { target, results, failures };
  fs.writeFileSync('qa-artifacts/browser-report.json', JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
