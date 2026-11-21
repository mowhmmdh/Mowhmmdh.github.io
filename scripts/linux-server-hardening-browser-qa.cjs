'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.PREVIEW_URL;
const expectedCanonical = 'https://mowhmmdh.github.io/blog/linux-server-hardening-checklist.html';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

(async () => {
  if (!target) throw new Error('PREVIEW_URL is required.');
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
      const requestUrls = [];

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
        requestUrls.push(request.url());
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

        const netlifyCdpUrl = [
          ...page.frames().map(frame => frame.url()),
          ...requestUrls
        ].find(rawUrl => {
          try {
            const url = new URL(rawUrl);
            return url.hostname === 'app.netlify.com' &&
              url.pathname === '/cdp/' &&
              url.searchParams.has('deployID');
          } catch (_) {
            return false;
          }
        });
        const netlifyDeployId = netlifyCdpUrl
          ? new URL(netlifyCdpUrl).searchParams.get('deployID')
          : null;

        const snapshot = await page.evaluate(() => {
          const ctas = Array.from(document.querySelectorAll('a.q-mobile-cta'));
          const cta = ctas[0] || null;
          const ctaStyle = cta ? getComputedStyle(cta) : null;
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          const footer = document.querySelector('footer.legal-footer-2026');
          const footerLine = footer?.querySelector(':scope > .q-footerline[aria-hidden="true"]');
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
          const scrollWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
          );
          return {
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            mainPresent: Boolean(document.querySelector('main#main-content')),
            h1Count: document.querySelectorAll('main#main-content h1').length,
            skipLink: document.querySelector('.skip-link')?.getAttribute('href') || null,
            canonical: canonical?.getAttribute('href') || null,
            alternates,
            schemaTypes: schemas.map(item => item['@type']),
            ctaCount: ctas.length,
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
            footerLineCount: footer?.querySelectorAll('.q-footerline').length || 0,
            footerLineFirstChild: Boolean(
              footerLine && footer?.firstElementChild === footerLine
            ),
            conversionSection: Boolean(document.querySelector('.seo-conversion-cta')),
            relatedSections: Boolean(
              document.querySelector('.auto-related') &&
              document.querySelector('.related-articles')
            ),
            scrollWidth,
            viewportWidth: window.innerWidth
          };
        });

        const allowedCtaHrefs = new Set(['/vintech/request.html', '/vintech/request']);
        const ctaRouteResponse = snapshot.ctaHref
          ? await page.request.get(new URL(snapshot.ctaHref, target).href)
          : null;
        const checks = {
          http200: response?.status() === 200,
          persianRtl: snapshot.lang === 'fa' && snapshot.dir === 'rtl',
          oneMainHeading: snapshot.mainPresent && snapshot.h1Count === 1,
          skipLink: snapshot.skipLink === '#main-content',
          canonical: snapshot.canonical === expectedCanonical,
          reciprocalHreflang: ['fa-IR', 'en', 'x-default'].every(lang =>
            snapshot.alternates.some(item => item.lang === lang)
          ),
          articleAndBreadcrumbSchema:
            snapshot.schemaTypes.includes('Article') &&
            snapshot.schemaTypes.includes('BreadcrumbList'),
          oneConversionCta: snapshot.ctaCount === 1 &&
            allowedCtaHrefs.has(snapshot.ctaHref) &&
            snapshot.ctaConversion === 'mobile_service_request' &&
            snapshot.ctaLabel === 'درخواست پروژه / مشاوره' &&
            ctaRouteResponse?.status() === 200,
          footerDecoration: snapshot.footerLineCount === 1 &&
            snapshot.footerLineFirstChild,
          existingConversionAndRelatedContent:
            snapshot.conversionSection && snapshot.relatedSections,
          ctaResponsive: spec.name === 'mobile'
            ? snapshot.ctaVisible && snapshot.ctaInBounds && snapshot.ctaDisplay === 'flex'
            : !snapshot.ctaVisible && snapshot.ctaDisplay === 'none',
          noHorizontalOverflow: snapshot.scrollWidth <= snapshot.viewportWidth + 1,
          noRedundantEnhancementRequest:
            !requestedPaths.includes('/assets/site-final-quality-2026.js'),
          themeScriptStillRequested:
            requestedPaths.includes('/assets/site-theme.js'),
          noPageErrors: pageErrors.length === 0,
          noConsoleErrors: consoleErrors.length === 0,
          noFailedLocalRequests: failedLocalRequests.length === 0
        };

        for (const [name, passed] of Object.entries(checks)) {
          if (!passed) failures.push(spec.name + ': ' + name);
        }

        await page.screenshot({
          path: 'qa-artifacts/linux-hardening-' + spec.name + '.png',
          fullPage: true,
          animations: 'disabled'
        });
        results.push({
          viewport: spec,
          httpStatus: response?.status() ?? null,
          ctaRouteStatus: ctaRouteResponse?.status() ?? null,
          checks,
          snapshot,
          pageErrors,
          consoleErrors,
          failedLocalRequests,
          requestedPaths,
          netlifyDeployId
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const deployIds = Array.from(new Set(results.map(item => item.netlifyDeployId).filter(Boolean)));
  if (deployIds.length > 1) {
    failures.push('Desktop and mobile resolved different Netlify deploy IDs: ' + deployIds.join(', '));
  }
  const netlifyDeployId = deployIds[0] || '';
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'netlify_deploy_id=' + netlifyDeployId + '\n');
  }
  fs.writeFileSync(
    'qa-artifacts/browser-report.json',
    JSON.stringify({ target, netlifyDeployId, results, failures }, null, 2)
  );
  console.log(JSON.stringify({ netlifyDeployId, results, failures }, null, 2));
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
