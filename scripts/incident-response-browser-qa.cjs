#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.TARGET_URL ||
  'http://127.0.0.1:4173/blog/incident-response-network-outage.html';
const expectedCanonical =
  'https://mowhmmdh.github.io/blog/incident-response-network-outage.html';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

(async () => {
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
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
      const failedLocalRequests = [];
      const requestedPaths = [];

      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('requestfailed', request => {
        if (request.url().startsWith('http://127.0.0.1:4173/')) {
          failedLocalRequests.push({
            url: request.url(),
            error: request.failure()?.errorText || 'unknown'
          });
        }
      });
      page.on('request', request => {
        try { requestedPaths.push(new URL(request.url()).pathname); }
        catch (_) { requestedPaths.push(request.url()); }
      });

      try {
        const response = await page.goto(target, {
          waitUntil: 'networkidle',
          timeout: 60000
        });
        await page.evaluate(async () => {
          if (document.fonts?.ready) await document.fonts.ready;
        });

        const snapshot = await page.evaluate(() => {
          const ctas = Array.from(document.querySelectorAll('a.q-mobile-cta'));
          const cta = ctas[0] || null;
          const style = cta ? getComputedStyle(cta) : null;
          const rect = cta ? cta.getBoundingClientRect() : null;
          const footer = document.querySelector('footer');
          const footerFirst = footer?.firstElementChild || null;
          const canonical = document.querySelector('link[rel="canonical"]');
          const alternates = Array.from(
            document.querySelectorAll('link[rel="alternate"][hreflang]')
          ).map(link => ({
            lang: link.getAttribute('hreflang'),
            href: link.getAttribute('href')
          }));
          const schemas = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]')
          ).map(script => {
            try { return JSON.parse(script.textContent); }
            catch (_) { return null; }
          }).filter(Boolean);
          const oldBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(10000, 0);
          const horizontalScrollX = window.scrollX;
          window.scrollTo(0, 0);
          document.documentElement.style.scrollBehavior = oldBehavior;

          return {
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            h1Count: document.querySelectorAll('main#main-content h1').length,
            mainPresent: Boolean(document.querySelector('main#main-content')),
            canonical: canonical?.getAttribute('href') || null,
            alternates,
            schemaTypes: schemas.map(item => item['@type']),
            ctaCount: ctas.length,
            ctaDisplay: style?.display || null,
            ctaVisible: Boolean(
              style && style.display !== 'none' &&
              style.visibility !== 'hidden' && rect &&
              rect.width > 0 && rect.height > 0
            ),
            ctaInBounds: Boolean(
              rect && rect.left >= 0 && rect.right <= window.innerWidth &&
              rect.top >= 0 && rect.bottom <= window.innerHeight
            ),
            ctaHref: cta?.getAttribute('href') || null,
            ctaConversion: cta?.getAttribute('data-conversion') || null,
            footerLineFirst: Boolean(
              footerFirst && footerFirst.classList.contains('q-footerline') &&
              footerFirst.getAttribute('aria-hidden') === 'true'
            ),
            conversionSection: Boolean(document.querySelector('.seo-conversion-cta')),
            relatedSections: Boolean(
              document.querySelector('.auto-related') &&
              document.querySelector('.related-articles')
            ),
            horizontalScrollX
          };
        });

        const checks = {
          http200: response?.status() === 200,
          rtlPersian: snapshot.lang === 'fa' && snapshot.dir === 'rtl',
          oneMainHeading: snapshot.mainPresent && snapshot.h1Count === 1,
          canonical: snapshot.canonical === expectedCanonical,
          reciprocalHreflang: ['fa-IR', 'en', 'x-default'].every(
            lang => snapshot.alternates.some(item => item.lang === lang)
          ),
          articleAndBreadcrumbSchema:
            snapshot.schemaTypes.includes('Article') &&
            snapshot.schemaTypes.includes('BreadcrumbList'),
          oneConversionCta: snapshot.ctaCount === 1 &&
            snapshot.ctaHref === '/vintech/request.html' &&
            snapshot.ctaConversion === 'mobile_service_request',
          footerDecoration: snapshot.footerLineFirst,
          originalConversionAndRelatedContent:
            snapshot.conversionSection && snapshot.relatedSections,
          ctaResponsive: spec.name === 'mobile'
            ? snapshot.ctaVisible && snapshot.ctaInBounds
            : !snapshot.ctaVisible,
          noHorizontalScroll: snapshot.horizontalScrollX <= 1,
          noRedundantEnhancementRequest:
            !requestedPaths.includes('/assets/site-final-quality-2026.js'),
          noPageErrors: pageErrors.length === 0,
          noConsoleErrors: consoleErrors.length === 0,
          noFailedLocalRequests: failedLocalRequests.length === 0
        };

        for (const [name, passed] of Object.entries(checks)) {
          if (!passed) failures.push(spec.name + ': ' + name);
        }

        await page.screenshot({
          path: 'qa-artifacts/incident-response-' + spec.name + '.png',
          fullPage: true
        });
        results.push({
          viewport: spec,
          httpStatus: response?.status() ?? null,
          checks,
          snapshot,
          pageErrors,
          consoleErrors,
          failedLocalRequests,
          requestedPaths
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    'qa-artifacts/browser-report.json',
    JSON.stringify({ target, results, failures }, null, 2)
  );
  console.log(JSON.stringify({ results, failures }, null, 2));
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
