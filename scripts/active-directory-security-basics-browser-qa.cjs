'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.PREVIEW_URL;
const expectedCanonical = 'https://mowhmmdh.github.io/blog/active-directory-security-basics.html';
const expectedEnglish = 'https://mowhmmdh.github.io/en-blog/active-directory-security-basics.html';
const expectedCta = '/vintech/request.html';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

async function main() {
  if (!target) throw new Error('PREVIEW_URL is required.');
  fs.mkdirSync('qa-artifacts', { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const results = [];
  const failures = [];
  let deployId = null;

  try {
    for (const spec of viewports) {
      const page = await browser.newPage({
        viewport: { width: spec.width, height: spec.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      });
      const pageErrors = [];
      const consoleErrors = [];
      const failedLocalRequests = [];
      const requestUrls = [];

      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('request', request => requestUrls.push(request.url()));
      page.on('requestfailed', request => {
        if (request.url().startsWith(new URL(target).origin + '/')) {
          failedLocalRequests.push({
            url: request.url(),
            error: request.failure()?.errorText || 'unknown'
          });
        }
      });

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

      if (netlifyCdpUrl) {
        const detected = new URL(netlifyCdpUrl).searchParams.get('deployID');
        if (!/^[A-Za-z0-9-]+$/.test(detected || '')) {
          failures.push(spec.name + ': invalid Netlify deploy ID token');
        } else if (deployId && deployId !== detected) {
          failures.push(spec.name + ': Netlify deploy ID changed between viewports');
        } else {
          deployId = detected;
        }
      }

      const snapshot = await page.evaluate(() => {
        const ctas = Array.from(document.querySelectorAll('a.q-mobile-cta'));
        const cta = ctas[0] || null;
        const ctaStyle = cta ? getComputedStyle(cta) : null;
        const rect = cta ? cta.getBoundingClientRect() : null;
        const footer = document.querySelector('footer');
        const footerLines = Array.from(document.querySelectorAll('footer .q-footerline'));
        const canonical = document.querySelector('link[rel="canonical"]')?.href || null;
        const alternates = {};
        for (const link of document.querySelectorAll('link[rel="alternate"][hreflang]')) {
          alternates[link.hreflang] = link.href;
        }
        const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        let schemasValid = schemaScripts.length > 0;
        for (const node of schemaScripts) {
          try { JSON.parse(node.textContent || ''); }
          catch (_) { schemasValid = false; }
        }
        const firstFooterChild = footer?.firstElementChild || null;
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          canonical,
          alternates,
          h1Count: document.querySelectorAll('h1').length,
          schemasValid,
          schemaCount: schemaScripts.length,
          conversionSection: !!document.querySelector('.seo-conversion-cta'),
          relatedSection: !!document.querySelector('.auto-related'),
          ctaCount: ctas.length,
          ctaHref: cta?.getAttribute('href') || null,
          ctaText: cta?.textContent?.trim() || null,
          ctaConversion: cta?.getAttribute('data-conversion') || null,
          ctaDisplay: ctaStyle?.display || null,
          ctaPosition: ctaStyle?.position || null,
          ctaRect: rect ? {
            left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
            width: rect.width, height: rect.height
          } : null,
          footerLineCount: footerLines.length,
          footerLineFirst: firstFooterChild?.classList.contains('q-footerline') || false,
          footerLineAriaHidden: footerLines[0]?.getAttribute('aria-hidden') || null,
          enhancementScriptElements: Array.from(document.scripts)
            .filter(node => (node.src || '').includes('/assets/site-final-quality-2026.js')).length,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
          viewportWidth: window.innerWidth
        };
      });

      const problems = [];
      if (response?.status() !== 200) problems.push('HTTP status ' + (response?.status() ?? 'no response'));
      if (snapshot.lang !== 'fa' || snapshot.dir !== 'rtl') problems.push('Persian document language/direction changed');
      if (snapshot.canonical !== expectedCanonical) problems.push('Canonical URL mismatch');
      if (snapshot.alternates['fa-IR'] !== expectedCanonical) problems.push('fa-IR alternate mismatch');
      if (snapshot.alternates.en !== expectedEnglish) problems.push('English alternate mismatch');
      if (snapshot.alternates['x-default'] !== expectedCanonical) problems.push('x-default alternate mismatch');
      if (snapshot.h1Count !== 1) problems.push('Expected exactly one H1');
      if (!snapshot.schemasValid || snapshot.schemaCount < 2) problems.push('JSON-LD missing or invalid');
      if (!snapshot.conversionSection || !snapshot.relatedSection) problems.push('Existing conversion/related content missing');
      if (snapshot.ctaCount !== 1) problems.push('Expected exactly one static mobile CTA');
      if (snapshot.ctaHref !== expectedCta) problems.push('Mobile CTA destination changed');
      if (snapshot.ctaConversion !== 'mobile_service_request') problems.push('Mobile CTA conversion attribute changed');
      if (snapshot.ctaText !== 'درخواست پروژه / مشاوره') problems.push('Mobile CTA label changed');
      const expectedDisplay = spec.name === 'mobile' ? 'flex' : 'none';
      if (snapshot.ctaDisplay !== expectedDisplay) problems.push('CTA display mismatch: ' + snapshot.ctaDisplay);
      if (snapshot.ctaPosition !== 'fixed') problems.push('CTA is not fixed-position');
      if (spec.name === 'mobile' && snapshot.ctaRect &&
          (snapshot.ctaRect.left < 0 || snapshot.ctaRect.right > spec.width ||
           snapshot.ctaRect.bottom > spec.height || snapshot.ctaRect.top < 0)) {
        problems.push('Mobile CTA is outside the viewport');
      }
      if (snapshot.footerLineCount !== 1 || !snapshot.footerLineFirst ||
          snapshot.footerLineAriaHidden !== 'true') {
        problems.push('Footer divider is not a unique, decorative first child');
      }
      if (snapshot.enhancementScriptElements !== 0 ||
          requestUrls.some(url => url.includes('/assets/site-final-quality-2026.js'))) {
        problems.push('Removed enhancement script is still present or requested');
      }
      if (snapshot.scrollWidth > spec.width) {
        problems.push('Horizontal overflow ' + snapshot.scrollWidth + '/' + spec.width);
      }
      if (pageErrors.length) problems.push('Page errors: ' + pageErrors.join(' | '));
      if (consoleErrors.length) problems.push('Console errors: ' + consoleErrors.join(' | '));
      if (failedLocalRequests.length) problems.push('Failed local requests: ' + JSON.stringify(failedLocalRequests));

      const ctaTarget = await page.request.get(new URL(expectedCta, target).toString());
      if (ctaTarget.status() !== 200) problems.push('CTA destination returned HTTP ' + ctaTarget.status());

      await page.screenshot({
        path: 'qa-artifacts/active-directory-security-basics-' + spec.name + '.png',
        fullPage: true
      });

      results.push({
        viewport: spec.name,
        width: spec.width,
        height: spec.height,
        status: response?.status() ?? null,
        snapshot,
        pageErrors,
        consoleErrors,
        failedLocalRequests,
        ctaTargetStatus: ctaTarget.status(),
        problems
      });
      failures.push(...problems.map(problem => spec.name + ': ' + problem));
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const report = { target, deployId, results, failures };
  fs.writeFileSync('qa-artifacts/browser-report.json', JSON.stringify(report, null, 2) + '\n');

  if (deployId && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'netlify_deploy_id=' + deployId + '\n');
  }

  console.log(JSON.stringify(report, null, 2));
  if (!deployId) failures.push('Netlify deploy ID was not exposed; Lighthouse must not fall back to mutable preview URL.');
  if (failures.length) throw new Error(failures.join('\n'));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
