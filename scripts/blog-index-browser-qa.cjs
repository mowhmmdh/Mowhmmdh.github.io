#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.PREVIEW_URL ||
  'https://deploy-preview-PLACEHOLDER--mowhmmdh.netlify.app/blog/';
const expectedCanonical = 'https://mowhmmdh.github.io/blog/';
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
        if (request.url().startsWith(new URL(target).origin + '/')) {
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
          const cta = document.querySelector('a.q-mobile-cta');
          const ctaStyle = cta ? getComputedStyle(cta) : null;
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          const conversion = document.querySelector('section.q-conversion');
          const footer = document.querySelector('footer.legal-footer-2026');
          const footerLine = footer?.querySelector(':scope > .q-footerline[aria-hidden="true"]');
          const canonical = document.querySelector('link[rel="canonical"]');
          const rss = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
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
          const menu = document.querySelector('.nav .mobile-menu');
          const nav = document.querySelector('.nav');
          const themeToggle = document.querySelector('.theme-toggle');
          const discovery = document.querySelector('section.auto-discovery.q-discovery');
          const discoveryGrid = discovery?.querySelector('.q-discovery-grid');
          const discoveryCards = Array.from(discovery?.querySelectorAll('a.q-discovery-card') || []);
          const discoveryGridStyle = discoveryGrid ? getComputedStyle(discoveryGrid) : null;
          const discoveryColumnCount = discoveryGridStyle?.gridTemplateColumns
            ? discoveryGridStyle.gridTemplateColumns.split(' ').filter(Boolean).length
            : 0;
          const discoveryCardDisplays = discoveryCards.map(card => getComputedStyle(card).display);
          const oldBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(10000, 0);
          const horizontalScrollX = window.scrollX;
          window.scrollTo(0, 0);
          document.documentElement.style.scrollBehavior = oldBehavior;

          return {
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            title: document.title,
            h1Count: document.querySelectorAll('main#main-content h1').length,
            articleCount: document.querySelectorAll('main#main-content article').length,
            canonical: canonical?.getAttribute('href') || null,
            rss: rss?.getAttribute('href') || null,
            alternates,
            schemaTypes: schemas.map(item => item['@type']),
            navLinkCount: nav?.querySelectorAll('.nav-links a').length || 0,
            menuPresent: Boolean(menu),
            menuVisible: Boolean(menu && getComputedStyle(menu).display !== 'none'),
            menuExpanded: menu?.getAttribute('aria-expanded') || null,
            menuOpen: Boolean(nav?.classList.contains('menu-open')),
            themeTogglePresent: Boolean(themeToggle),
            discoveryGridDisplay: discoveryGridStyle?.display || null,
            discoveryColumnCount,
            discoveryCardCount: discoveryCards.length,
            discoveryCardDisplays,
            ctaCount: document.querySelectorAll('a.q-mobile-cta').length,
            ctaDisplay: ctaStyle?.display || null,
            ctaVisible: Boolean(
              ctaStyle && ctaStyle.display !== 'none' &&
              ctaStyle.visibility !== 'hidden' && ctaRect &&
              ctaRect.width > 0 && ctaRect.height > 0
            ),
            ctaInBounds: Boolean(
              ctaRect && ctaRect.left >= 0 &&
              ctaRect.right <= window.innerWidth &&
              ctaRect.top >= 0 && ctaRect.bottom <= window.innerHeight
            ),
            ctaHref: cta?.getAttribute('href') || null,
            ctaLabel: cta?.textContent.trim() || '',
            ctaConversion: cta?.getAttribute('data-conversion') || null,
            conversionPresent: Boolean(conversion),
            conversionPrimary: conversion?.querySelector('a[data-conversion="service_request"]')?.getAttribute('href') || null,
            conversionEmail: conversion?.querySelector('a[data-conversion="email"]')?.getAttribute('href') || null,
            footerLineCount: footer?.querySelectorAll('.q-footerline').length || 0,
            footerLineFirstChild: Boolean(footerLine && footer?.firstElementChild === footerLine),
            horizontalScrollX,
            innerWidth: window.innerWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth
          };
        });

        const ctaRouteResponse = snapshot.ctaHref
          ? await page.request.get(new URL(snapshot.ctaHref, target).href)
          : null;
        const allowedRequestPaths = new Set(['/vintech/request.html', '/vintech/request']);
        const checks = {
          http200: response?.status() === 200,
          persianRtl: snapshot.lang === 'fa' && snapshot.dir === 'rtl',
          oneMainHeadingAndArticleCards: snapshot.h1Count === 1 && snapshot.articleCount >= 8,
          canonical: snapshot.canonical === expectedCanonical,
          rssDiscovery: snapshot.rss === 'https://mowhmmdh.github.io/feed.xml',
          reciprocalHreflang: ['fa-IR', 'en', 'x-default'].every(lang =>
            snapshot.alternates.some(item => item.lang === lang)
          ),
          collectionAndBreadcrumbSchema:
            snapshot.schemaTypes.includes('CollectionPage') &&
            snapshot.schemaTypes.includes('BreadcrumbList'),
          primaryNavigation: snapshot.navLinkCount >= 5 && snapshot.menuPresent,
          discoveryCardsUseResponsiveGrid:
            snapshot.discoveryGridDisplay === 'grid' &&
            snapshot.discoveryCardCount === 31 &&
            snapshot.discoveryCardDisplays.every(display => display === 'flex') &&
            (spec.name === 'mobile'
              ? snapshot.discoveryColumnCount === 1
              : snapshot.discoveryColumnCount >= 2),
          oneStaticMobileCta: snapshot.ctaCount === 1 &&
            allowedRequestPaths.has(snapshot.ctaHref) &&
            snapshot.ctaConversion === 'mobile_service_request' &&
            snapshot.ctaLabel === 'درخواست پروژه / مشاوره' &&
            ctaRouteResponse?.status() === 200,
          staticConversionPanel: snapshot.conversionPresent &&
            allowedRequestPaths.has(snapshot.conversionPrimary) &&
            Boolean(snapshot.conversionEmail),
          footerDecoration: snapshot.footerLineCount === 1 && snapshot.footerLineFirstChild,
          ctaResponsive: spec.name === 'mobile'
            ? snapshot.ctaVisible && snapshot.ctaInBounds
            : !snapshot.ctaVisible,
          noHorizontalScroll:
            snapshot.horizontalScrollX <= 1 &&
            snapshot.documentScrollWidth <= snapshot.innerWidth + 1 &&
            snapshot.bodyScrollWidth <= snapshot.innerWidth + 1,
          noRedundantEnhancementRequest:
            !requestedPaths.includes('/assets/site-final-quality-2026.js'),
          noPageErrors: pageErrors.length === 0,
          noConsoleErrors: consoleErrors.length === 0,
          noFailedLocalRequests: failedLocalRequests.length === 0
        };

        let menuInteraction = { tested: false, opened: false, escapedClosed: false };
        if (spec.name === 'mobile' && snapshot.menuVisible) {
          const menu = page.locator('.nav .mobile-menu');
          await menu.click();
          menuInteraction.opened =
            (await menu.getAttribute('aria-expanded')) === 'true' &&
            await page.locator('.nav').evaluate(node => node.classList.contains('menu-open'));
          await page.keyboard.press('Escape');
          menuInteraction.escapedClosed =
            (await menu.getAttribute('aria-expanded')) === 'false' &&
            !(await page.locator('.nav').evaluate(node => node.classList.contains('menu-open')));
          menuInteraction.tested = true;
        }
        checks.mobileMenuKeyboard = spec.name === 'mobile'
          ? menuInteraction.tested && menuInteraction.opened && menuInteraction.escapedClosed
          : true;

        const themeToggle = page.locator('.theme-toggle');
        await themeToggle.click();
        const lightThemeApplied = await page.evaluate(() =>
          document.documentElement.classList.contains('theme-light')
        );
        await themeToggle.click();
        const darkThemeRestored = !(await page.evaluate(() =>
          document.documentElement.classList.contains('theme-light')
        ));
        checks.themeToggleRoundTrip = lightThemeApplied && darkThemeRestored;

        for (const [name, passed] of Object.entries(checks)) {
          if (!passed) failures.push(spec.name + ': ' + name);
        }

        await page.screenshot({
          path: 'qa-artifacts/blog-index-' + spec.name + '.png',
          fullPage: true
        });
        results.push({
          viewport: spec,
          httpStatus: response?.status() ?? null,
          ctaRouteStatus: ctaRouteResponse?.status() ?? null,
          checks,
          menuInteraction,
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
