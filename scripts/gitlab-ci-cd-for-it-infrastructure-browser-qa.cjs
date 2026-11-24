'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const previewTarget = process.env.PREVIEW_URL;
const expectedCanonical = 'https://mowhmmdh.github.io/blog/gitlab-ci-cd-for-it-infrastructure.html';
const expectedEnglish = 'https://mowhmmdh.github.io/en-blog/gitlab-ci-cd-for-it-infrastructure.html';
const acceptedCtaPaths = new Set(['/vintech/request.html', '/vintech/request']);
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

async function main() {
  if (!previewTarget) throw new Error('PREVIEW_URL is required.');
  fs.mkdirSync('qa-artifacts', { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const results = [];
  const failures = [];
  let deployId = null;
  let immutableTarget = null;

  try {
    // Probe only to discover the immutable deploy ID. Do not measure layout or
    // Lighthouse on Netlify's mutable preview, which can inject its CDP toolbar.
    const probe = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const probeRequests = [];
    probe.on('request', request => probeRequests.push(request.url()));
    await probe.goto(previewTarget, { waitUntil: 'networkidle', timeout: 60000 });

    const netlifyCdpUrl = [
      ...probe.frames().map(frame => frame.url()),
      ...probeRequests
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
    await probe.close();

    if (!netlifyCdpUrl) {
      throw new Error('Netlify deploy ID was not exposed; refusing mutable-preview browser or Lighthouse QA.');
    }
    deployId = new URL(netlifyCdpUrl).searchParams.get('deployID');
    if (!/^[A-Za-z0-9-]+$/.test(deployId || '')) {
      throw new Error('Invalid Netlify deploy ID token.');
    }

    const previewUrl = new URL(previewTarget);
    immutableTarget = 'https://' + deployId + '--mowhmmdh.netlify.app' + previewUrl.pathname;
    const immutableCheck = await browser.newPage();
    const immutableResponse = await immutableCheck.goto(immutableTarget, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await immutableCheck.close();
    if (immutableResponse?.status() !== 200) {
      throw new Error('Immutable Netlify deploy URL did not return HTTP 200.');
    }

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
        if (request.url().startsWith(new URL(immutableTarget).origin + '/')) {
          failedLocalRequests.push({
            url: request.url(),
            error: request.failure()?.errorText || 'unknown'
          });
        }
      });

      const response = await page.goto(immutableTarget, {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });

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
        const ctaHref = cta?.getAttribute('href') || null;
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          primaryNavCount: document.querySelectorAll('nav.nav[aria-label="ناوبری اصلی"]').length,
          menuButtonCount: document.querySelectorAll('nav.nav button.mobile-menu').length,
          themeButtonCount: document.querySelectorAll('nav.nav button.theme-toggle').length,
          canonical,
          alternates,
          h1Count: document.querySelectorAll('h1').length,
          schemasValid,
          schemaCount: schemaScripts.length,
          conversionSection: !!document.querySelector('.seo-conversion-cta'),
          relatedSection: !!document.querySelector('.auto-related'),
          ctaCount: ctas.length,
          ctaHref,
          ctaPath: ctaHref ? new URL(ctaHref, location.href).pathname : null,
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
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body?.scrollWidth || 0,
          viewportWidth: window.innerWidth,
          rootOverflowX: getComputedStyle(document.documentElement).overflowX,
          bodyOverflowX: getComputedStyle(document.body).overflowX,
          visibleOverflowElements: Array.from(document.querySelectorAll('body *')).map(element => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id || null,
              className: typeof element.className === 'string' ? element.className.slice(0, 120) : null,
              left: Math.round(rect.left * 10) / 10,
              right: Math.round(rect.right * 10) / 10,
              width: Math.round(rect.width * 10) / 10,
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              position: style.position
            };
          }).filter(item => item.display !== 'none' && item.visibility !== 'hidden' &&
            Number(item.opacity) > 0 && item.width > 0 &&
            (item.left < -1 || item.right > window.innerWidth + 1)).slice(0, 12),
          cdpFrames: Array.from(document.querySelectorAll('iframe')).map(frame => frame.src)
            .filter(src => src.includes('app.netlify.com/cdp/') || src.includes('/.netlify/scripts/cdp'))
        };
      });

      const problems = [];
      if (response?.status() !== 200) problems.push('HTTP status ' + (response?.status() ?? 'no response'));
      if (snapshot.lang !== 'fa' || snapshot.dir !== 'rtl') problems.push('Persian document language/direction changed');
      if (snapshot.primaryNavCount !== 1 || snapshot.menuButtonCount !== 1 || snapshot.themeButtonCount !== 1) {
        problems.push('Primary navigation, mobile menu or theme control is missing/duplicated');
      }
      if (snapshot.canonical !== expectedCanonical) problems.push('Canonical URL mismatch');
      if (snapshot.alternates['fa-IR'] !== expectedCanonical) problems.push('fa-IR alternate mismatch');
      if (snapshot.alternates.en !== expectedEnglish) problems.push('English alternate mismatch');
      if (snapshot.alternates['x-default'] !== expectedCanonical) problems.push('x-default alternate mismatch');
      if (snapshot.h1Count !== 1) problems.push('Expected exactly one H1');
      if (!snapshot.schemasValid || snapshot.schemaCount < 2) problems.push('JSON-LD missing or invalid');
      if (!snapshot.conversionSection || !snapshot.relatedSection) problems.push('Existing conversion/related content missing');
      if (snapshot.ctaCount !== 1) problems.push('Expected exactly one static mobile CTA');
      if (!acceptedCtaPaths.has(snapshot.ctaPath)) problems.push('Mobile CTA destination changed: ' + snapshot.ctaPath);
      if (snapshot.ctaConversion !== 'mobile_service_request') problems.push('Mobile CTA conversion attribute changed');
      if (snapshot.ctaText !== 'درخواست پروژه / مشاوره') problems.push('Mobile CTA label changed');
      const expectedDisplay = spec.name === 'mobile' ? 'flex' : 'none';
      if (snapshot.ctaDisplay !== expectedDisplay) problems.push('CTA display mismatch: ' + snapshot.ctaDisplay);
      if (spec.name === 'mobile' && snapshot.ctaPosition !== 'fixed') problems.push('Mobile CTA is not fixed-position');
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
      if (snapshot.cdpFrames.length ||
          requestUrls.some(url => url.includes('app.netlify.com/cdp/') || url.includes('/.netlify/scripts/cdp'))) {
        problems.push('Netlify CDP instrumentation was present on immutable deploy QA');
      }
      if (snapshot.visibleOverflowElements.length) {
        problems.push('Visible elements extend beyond viewport: ' + JSON.stringify(snapshot.visibleOverflowElements));
      }
      if (snapshot.scrollWidth > spec.width + 1) {
        problems.push('Raw document scroll width exceeds viewport: ' + snapshot.scrollWidth + '/' + spec.width +
          ' (document=' + snapshot.documentWidth + ', body=' + snapshot.bodyWidth + ')');
      }
      if (pageErrors.length) problems.push('Page errors: ' + pageErrors.join(' | '));
      if (consoleErrors.length) problems.push('Console errors: ' + consoleErrors.join(' | '));
      if (failedLocalRequests.length) problems.push('Failed local requests: ' + JSON.stringify(failedLocalRequests));

      const themeButton = page.locator('nav.nav button.theme-toggle');
      if (await themeButton.count() === 1) {
        await themeButton.click();
        if (await themeButton.getAttribute('aria-pressed') !== 'true') problems.push('Theme toggle did not expose pressed state after activation');
        await themeButton.click();
        if (await themeButton.getAttribute('aria-pressed') !== 'false') problems.push('Theme toggle did not restore its initial state');
      }
      if (spec.name === 'mobile') {
        const menuButton = page.locator('nav.nav button.mobile-menu');
        if (await menuButton.count() === 1) {
          await menuButton.click();
          if (await menuButton.getAttribute('aria-expanded') !== 'true') problems.push('Mobile menu did not open');
          await page.keyboard.press('Escape');
          if (await menuButton.getAttribute('aria-expanded') !== 'false') problems.push('Escape did not close the mobile menu');
        }
      }

      const ctaTarget = await page.request.get(new URL(snapshot.ctaHref, immutableTarget).toString());
      if (ctaTarget.status() !== 200) problems.push('CTA destination returned HTTP ' + ctaTarget.status());

      await page.screenshot({
        path: 'qa-artifacts/gitlab-ci-cd-for-it-infrastructure-' + spec.name + '.png',
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

  const report = { previewTarget, target: immutableTarget, deployId, results, failures };
  fs.writeFileSync('qa-artifacts/browser-report.json', JSON.stringify(report, null, 2) + '\n');

  if (deployId && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'netlify_deploy_id=' + deployId + '\n');
  }

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) throw new Error(failures.join('\n'));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
