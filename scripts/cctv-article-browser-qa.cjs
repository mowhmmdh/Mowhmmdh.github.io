#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.PREVIEW_URL ||
  'https://deploy-preview-49--mowhmmdh.netlify.app/blog/cctv-ip-camera-network-design.html';
const expectedCanonical =
  'https://mowhmmdh.github.io/blog/cctv-ip-camera-network-design.html';
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
      const failedRequests = [];
      const requestedPaths = [];

      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('requestfailed', request => {
        failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
      });
      page.on('request', request => {
        try { requestedPaths.push(new URL(request.url()).pathname); }
        catch (_) { requestedPaths.push(request.url()); }
      });

      try {
        const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
        await page.evaluate(async () => {
          if (document.fonts?.ready) await document.fonts.ready;
        });

        const snapshot = await page.evaluate(() => {
          const ctas = Array.from(document.querySelectorAll('a.q-mobile-cta'));
          const cta = ctas[0] || null;
          const ctaStyle = cta ? getComputedStyle(cta) : null;
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          const canonical = document.querySelector('link[rel="canonical"]');
          const hreflangs = Array.from(
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
          const articleSchema = schemas.find(item => item['@type'] === 'BlogPosting');
          const nav = document.querySelector('.site-nav');
          const menu = nav?.querySelector('.mobile-menu');
          const theme = document.querySelector('.theme-toggle');
          const scrollWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
          );

          return {
            title: document.title,
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            viewportWidth: window.innerWidth,
            scrollWidth,
            horizontalOverflow: scrollWidth > window.innerWidth + 1,
            mainPresent: Boolean(document.querySelector('main#main-content')),
            h1Count: document.querySelectorAll('main#main-content h1').length,
            skipLinkTarget: document.querySelector('.skip-link')?.getAttribute('href') || null,
            canonical: canonical?.getAttribute('href') || null,
            hreflangs,
            articleSchemaLanguage: articleSchema?.inLanguage || null,
            ctaCount: ctas.length,
            ctaDisplay: ctaStyle?.display || null,
            ctaVisible: Boolean(
              ctaStyle && ctaStyle.display !== 'none' &&
              ctaStyle.visibility !== 'hidden' && ctaRect &&
              ctaRect.width > 0 && ctaRect.height > 0
            ),
            ctaHref: cta?.getAttribute('href') || null,
            ctaText: cta?.textContent.trim() || null,
            ctaConversion: cta?.getAttribute('data-conversion') || null,
            ctaBottom: ctaRect ? Math.round(ctaRect.bottom) : null,
            menuPresent: Boolean(menu),
            menuVisible: Boolean(menu && getComputedStyle(menu).display !== 'none'),
            themePresent: Boolean(theme),
            fontPreloads: Array.from(
              document.querySelectorAll('link[rel="preload"][as="font"]')
            ).map(link => ({
              href: new URL(link.href).pathname,
              type: link.type,
              crossOrigin: link.crossOrigin
            })),
            requiredFontsLoaded: ['400', '700', '800'].map(weight =>
              document.fonts.check(weight + ' 16px Vazirmatn')
            )
          };
        });

        const checks = {
          http200: response?.status() === 200,
          persianRtl: snapshot.lang === 'fa' && snapshot.dir === 'rtl',
          mainAndSingleH1: snapshot.mainPresent && snapshot.h1Count === 1,
          skipLink: snapshot.skipLinkTarget === '#main-content',
          canonicalPreserved: snapshot.canonical === expectedCanonical,
          hreflangSet: ['fa-IR', 'en', 'x-default'].every(lang =>
            snapshot.hreflangs.some(item => item.lang === lang)
          ),
          articleSchema: snapshot.articleSchemaLanguage === 'fa-IR',
          singleConversionCta: snapshot.ctaCount === 1 &&
            snapshot.ctaHref === '/vintech/request.html' &&
            snapshot.ctaConversion === 'mobile_service_request' &&
            Boolean(snapshot.ctaText),
          noHorizontalOverflow: !snapshot.horizontalOverflow,
          fontPreloads: ['Regular', 'Bold', 'ExtraBold'].every(weight =>
            snapshot.fontPreloads.some(item =>
              item.href === '/fonts/Vazirmatn-' + weight + '.woff2' &&
              item.type === 'font/woff2' &&
              item.crossOrigin === 'anonymous'
            )
          ),
          requiredFontsLoaded: snapshot.requiredFontsLoaded.every(Boolean),
          removedEnhancerNotRequested: !requestedPaths.includes('/assets/site-final-quality-2026.js')
        };

        if (spec.name === 'mobile') {
          checks.mobileCtaVisibleAndInBounds =
            snapshot.ctaVisible && snapshot.ctaBottom <= spec.height + 1;
          checks.mobileMenuVisible = snapshot.menuVisible;

          if (snapshot.menuVisible) {
            const menu = page.locator('.site-nav .mobile-menu');
            await menu.click();
            checks.mobileMenuOpens = await menu.getAttribute('aria-expanded') === 'true';
            await page.keyboard.press('Escape');
            checks.mobileMenuClosesOnEscape = await menu.getAttribute('aria-expanded') === 'false';
          } else {
            checks.mobileMenuOpens = false;
            checks.mobileMenuClosesOnEscape = false;
          }
        } else {
          checks.desktopCtaHidden = snapshot.ctaDisplay === 'none';
        }

        const theme = page.locator('.theme-toggle').first();
        if (await theme.count()) {
          await theme.click();
          checks.themeToggleUpdatesAccessibleState =
            await theme.getAttribute('aria-pressed') === 'true';
          await theme.click();
        } else {
          checks.themeToggleUpdatesAccessibleState = false;
        }

        await page.screenshot({
          path: 'qa-artifacts/cctv-' + spec.name + '.png',
          fullPage: true
        });

        const result = {
          viewport: spec.name,
          size: spec.width + 'x' + spec.height,
          checks,
          snapshot,
          pageErrors,
          consoleErrors,
          failedRequests,
          requestedPaths
        };
        results.push(result);

        for (const [name, passed] of Object.entries(checks)) {
          if (!passed) failures.push(spec.name + ': ' + name);
        }
        if (pageErrors.length) failures.push(spec.name + ': page errors');
        if (consoleErrors.length) failures.push(spec.name + ': console errors');
        if (failedRequests.length) failures.push(spec.name + ': failed network requests');

        await context.close();
      } catch (error) {
        failures.push(spec.name + ': ' + error.message);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const report = { target, results, failures };
  fs.writeFileSync('qa-artifacts/cctv-browser.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
