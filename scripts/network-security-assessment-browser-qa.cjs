#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.PREVIEW_URL;
if (!target) throw new Error('PREVIEW_URL is required');

(async () => {
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const results = [];
  const failures = [];

  const viewports = [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ];

  for (const spec of viewports) {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const response = await page.goto(target, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    const snapshot = await page.evaluate(() => {
      const ctas = document.querySelectorAll('.q-mobile-cta');
      const cta = ctas[0] || null;
      const style = cta ? getComputedStyle(cta) : null;
      const rect = cta ? cta.getBoundingClientRect() : null;
      return {
        title: document.title,
        ctaCount: ctas.length,
        ctaDisplay: style ? style.display : null,
        ctaVisible: Boolean(style && style.display !== 'none' && rect.width > 0 && rect.height > 0),
        ctaHref: cta ? cta.getAttribute('href') : null,
        ctaText: cta ? cta.textContent.trim() : null,
        ctaTop: rect ? Math.round(rect.top) : null,
        ctaBottom: rect ? Math.round(rect.bottom) : null,
        footerlineCount: document.querySelectorAll('footer .q-footerline[aria-hidden="true"]').length,
        conversionCount: document.querySelectorAll('.seo-conversion-cta').length,
        autoRelatedCount: document.querySelectorAll('.auto-related').length,
        relatedArticlesCount: document.querySelectorAll('.related-articles.site-auto-related').length,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });

    const mobilePass = spec.name !== 'mobile' || (
      snapshot.ctaVisible &&
      ['/vintech/request.html', '/vintech/request'].includes(snapshot.ctaHref) &&
      Boolean(snapshot.ctaText) &&
      snapshot.ctaBottom <= spec.height + 1
    );
    const desktopPass = spec.name !== 'desktop' || snapshot.ctaDisplay === 'none';
    const pass = Boolean(
      response &&
      response.status() === 200 &&
      snapshot.ctaCount === 1 &&
      snapshot.footerlineCount === 1 &&
      snapshot.conversionCount === 1 &&
      snapshot.autoRelatedCount === 1 &&
      snapshot.relatedArticlesCount === 1 &&
      mobilePass &&
      desktopPass &&
      pageErrors.length === 0
    );

    if (!pass) {
      failures.push({
        viewport: spec.name,
        status: response ? response.status() : null,
        snapshot,
        pageErrors
      });
    }

    await page.screenshot({
      path: 'qa-artifacts/' + spec.name + '.png',
      fullPage: true
    });
    results.push({
      viewport: spec.name,
      status: response ? response.status() : null,
      snapshot,
      pageErrors,
      pass
    });
    await context.close();
  }

  await browser.close();
  const report = { target, results, failures };
  fs.writeFileSync('qa-artifacts/browser-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
