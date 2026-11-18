#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.PREVIEW_URL ||
  'https://deploy-preview-54--mowhmmdh.netlify.app/blog/dns-troubleshooting.html';
const expectedCanonical =
  'https://mowhmmdh.github.io/blog/dns-troubleshooting.html';
const allowedRequestHrefs = new Set(['/vintech/request.html', '/vintech/request']);
const allowedServicesHrefs = new Set(['/services.html', '/services']);
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
      const httpErrors = [];
      const requestedPaths = [];

      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('requestfailed', request => {
        failedRequests.push({
          url: request.url(),
          error: request.failure()?.errorText || 'unknown'
        });
      });
      page.on('request', request => {
        try { requestedPaths.push(new URL(request.url()).pathname); }
        catch (_) { requestedPaths.push(request.url()); }
      });
      page.on('response', response => {
        if (response.status() >= 400) {
          const url = new URL(response.url());
          httpErrors.push({
            pathname: url.pathname,
            status: response.status(),
            url: response.url()
          });
        }
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
          const schemaNodes = schemas.flatMap(item =>
            Array.isArray(item['@graph']) ? item['@graph'] : [item]
          );
          const article = schemaNodes.find(item => item['@type'] === 'Article');
          const breadcrumb = schemaNodes.find(item => item['@type'] === 'BreadcrumbList');
          const cta = document.querySelector('a.q-mobile-cta');
          const ctaStyle = cta ? getComputedStyle(cta) : null;
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          const footer = document.querySelector('footer.legal-footer-2026');
          const footerLine = footer?.querySelector('.q-footerline');
          const service = document.querySelector('section.seo-conversion-cta');
          const serviceLinks = service
            ? Array.from(service.querySelectorAll('a')).map(link => link.getAttribute('href'))
            : [];
          const scrollBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(10000, 0);
          const horizontalScrollX = window.scrollX;
          window.scrollTo(0, 0);
          document.documentElement.style.scrollBehavior = scrollBehavior;

          return {
            title: document.title,
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            mainPresent: Boolean(document.querySelector('main#main-content')),
            h1Count: document.querySelectorAll('main#main-content h1').length,
            skipLink: document.querySelector('#skip-to-content')?.getAttribute('href') || null,
            canonical: canonical?.getAttribute('href') || null,
            hreflangs,
            articleLanguage: article?.inLanguage || null,
            articleUrl: article?.url || null,
            breadcrumbPresent: Boolean(breadcrumb),
            servicePresent: Boolean(service),
            serviceLinks,
            autoRelatedPresent: Boolean(document.querySelector('section.auto-related')),
            relatedArticlesPresent: Boolean(document.querySelector('section.related-articles.site-auto-related')),
            ctaCount: document.querySelectorAll('a.q-mobile-cta').length,
            ctaHref: cta?.getAttribute('href') || null,
            ctaText: cta?.textContent.trim() || null,
            ctaConversion: cta?.getAttribute('data-conversion') || null,
            ctaDisplay: ctaStyle?.display || null,
            ctaRect: ctaRect ? {
              top: Math.round(ctaRect.top),
              right: Math.round(ctaRect.right),
              bottom: Math.round(ctaRect.bottom),
              left: Math.round(ctaRect.left),
              width: Math.round(ctaRect.width),
              height: Math.round(ctaRect.height)
            } : null,
            footerLineDecorative: Boolean(
              footerLine && footerLine.getAttribute('aria-hidden') === 'true'
            ),
            legalFooterLinks: [
              ['/privacy.html', '/privacy'],
              ['/terms.html', '/terms'],
              ['/disclosure.html', '/disclosure']
            ].every(paths => paths.some(path => Boolean(footer?.querySelector('a[href="' + path + '"]')))),
            emailLinkPresent: Boolean(footer?.querySelector('a[href^="mailto:"]')),
            iconLinkPresent: Boolean(document.querySelector('link[rel~="icon"]')),
            horizontalScrollX,
            horizontalOverflow: horizontalScrollX > 1
          };
        });

        const requestRoute = await page.request.get(
          new URL('/vintech/request.html', target).href
        );
        const servicesRoute = await page.request.get(
          new URL('/services.html', target).href
        );
        const knownFavicon404 = httpErrors.some(item =>
          item.pathname === '/favicon.ico' && item.status === 404
        );
        const unexpectedHttpErrors = httpErrors.filter(item =>
          !(item.pathname === '/favicon.ico' && item.status === 404)
        );

        const checks = {
          http200: response?.status() === 200,
          persianRtl: snapshot.lang === 'fa' && snapshot.dir === 'rtl',
          mainAndSingleH1: snapshot.mainPresent && snapshot.h1Count === 1,
          skipLink: snapshot.skipLink === '#main-content',
          canonicalPreserved: snapshot.canonical === expectedCanonical,
          hreflangSet: ['fa-IR', 'en', 'x-default'].every(language =>
            snapshot.hreflangs.some(item => item.lang === language)
          ),
          articleSchema: snapshot.articleLanguage === 'fa-IR' &&
            snapshot.articleUrl === expectedCanonical,
          breadcrumbSchema: snapshot.breadcrumbPresent,
          serviceConversionPreserved: snapshot.servicePresent &&
            snapshot.serviceLinks.some(path => allowedServicesHrefs.has(path)) &&
            snapshot.serviceLinks.some(path => allowedRequestHrefs.has(path)) &&
            servicesRoute.status() === 200,
          relatedSectionsPreserved: snapshot.autoRelatedPresent &&
            snapshot.relatedArticlesPresent,
          singleMobileCta: snapshot.ctaCount === 1 &&
            allowedRequestHrefs.has(snapshot.ctaHref) &&
            snapshot.ctaText === 'درخواست پروژه / مشاوره' &&
            snapshot.ctaConversion === 'mobile_service_request' &&
            requestRoute.status() === 200,
          footerLineDecorative: snapshot.footerLineDecorative,
          footerLegalLinksPreserved: snapshot.legalFooterLinks && snapshot.emailLinkPresent,
          iconLinkPresent: snapshot.iconLinkPresent,
          noHorizontalOverflow: !snapshot.horizontalOverflow,
          removedEnhancerNotRequested:
            !requestedPaths.includes('/assets/site-final-quality-2026.js'),
          themeScriptRetained: requestedPaths.includes('/assets/site-theme.js'),
          noPageErrors: pageErrors.length === 0,
          noFailedRequests: failedRequests.length === 0,
          noUnexpectedHttpErrors: unexpectedHttpErrors.length === 0
        };

        if (spec.name === 'mobile') {
          checks.mobileCtaVisibleAndInBounds =
            snapshot.ctaDisplay !== 'none' &&
            snapshot.ctaRect !== null &&
            snapshot.ctaRect.width > 0 &&
            snapshot.ctaRect.height > 0 &&
            snapshot.ctaRect.left >= -1 &&
            snapshot.ctaRect.right <= spec.width + 1 &&
            snapshot.ctaRect.bottom <= spec.height + 1;
        } else {
          checks.desktopCtaHidden = snapshot.ctaDisplay === 'none';
        }

        await page.screenshot({
          path: 'qa-artifacts/dns-' + spec.name + '.png',
          fullPage: false
        });

        const result = {
          viewport: spec.name,
          size: spec.width + 'x' + spec.height,
          requestRouteStatus: requestRoute.status(),
          servicesRouteStatus: servicesRoute.status(),
          knownFavicon404,
          checks,
          snapshot,
          pageErrors,
          consoleErrors,
          failedRequests,
          httpErrors,
          requestedPaths
        };
        results.push(result);

        for (const [name, passed] of Object.entries(checks)) {
          if (!passed) failures.push(spec.name + ': ' + name);
        }

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
  fs.writeFileSync(
    'qa-artifacts/dns-browser.json',
    JSON.stringify(report, null, 2)
  );
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
