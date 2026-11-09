const { chromium } = require('playwright');

const targetUrl = process.env.PREVIEW_URL;
if (!targetUrl) throw new Error('PREVIEW_URL is required');

const viewports = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true }
];

async function inspect(page, spec) {
  const result = await page.evaluate(() => {
    const conversion = document.querySelector('.q-conversion');
    const mobileCta = document.querySelector('.q-mobile-cta');
    const footerLine = document.querySelector('.legal-footer-2026 .q-footerline');
    const rect = element => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        left: Math.round(box.left),
        right: Math.round(box.right),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom)
      };
    };
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      viewportWidth: window.innerWidth,
      documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      heading: document.querySelector('main h1')?.textContent.trim() || '',
      conversion: {
        count: document.querySelectorAll('.q-conversion').length,
        label: conversion?.getAttribute('aria-label') || '',
        visible: !!conversion && rect(conversion).width > 0 && rect(conversion).height > 0,
        hrefs: Array.from(conversion?.querySelectorAll('a') || []).map(link => link.getAttribute('href')),
        rect: rect(conversion)
      },
      mobileCta: {
        count: document.querySelectorAll('.q-mobile-cta').length,
        href: mobileCta?.getAttribute('href') || '',
        text: mobileCta?.textContent.trim() || '',
        display: mobileCta ? getComputedStyle(mobileCta).display : 'missing',
        position: mobileCta ? getComputedStyle(mobileCta).position : 'missing',
        rect: rect(mobileCta)
      },
      footerLine: !!footerLine,
      sharedEnhancerLoaded: performance.getEntriesByType('resource')
        .some(entry => entry.name.includes('/assets/site-final-quality-2026.js'))
    };
  });

  const fail = message => {
    throw new Error(spec.name + ': ' + message + ': ' + JSON.stringify(result));
  };

  if (result.lang !== 'fa' || result.dir !== 'rtl') fail('Persian RTL document metadata changed');
  if (result.documentWidth > spec.width + 1) fail('horizontal overflow detected');
  if (!result.heading.includes('مطالعات موردی')) fail('case-study heading missing');
  if (result.conversion.count !== 1 || !result.conversion.visible) fail('static conversion section missing or duplicated');
  if (result.conversion.label !== 'درخواست خدمات') fail('conversion accessible name changed');
  const requestPathIsValid = href => href === '/vintech/request.html' || href === '/vintech/request';
  if (!result.conversion.hrefs.some(requestPathIsValid) ||
      !result.conversion.hrefs.some(href => href && href.startsWith('mailto:'))) {
    fail('conversion destinations changed');
  }
  if (result.mobileCta.count !== 1 || !requestPathIsValid(result.mobileCta.href)) {
    fail('mobile conversion link missing or duplicated');
  }
  if (spec.mobile && result.mobileCta.position !== 'fixed') fail('mobile conversion link is not fixed');
  if (!result.footerLine) fail('decorative footer divider missing');
  if (result.sharedEnhancerLoaded) fail('shared enhancement script still loaded');

  if (spec.mobile && result.mobileCta.display !== 'flex') fail('mobile CTA is not visible at the mobile viewport');
  if (!spec.mobile && result.mobileCta.display !== 'none') fail('mobile CTA should remain hidden on desktop');

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const spec of viewports) {
      const page = await browser.newPage({
        viewport: { width: spec.width, height: spec.height },
        reducedMotion: 'reduce'
      });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
      if (!response || !response.ok()) {
        throw new Error(spec.name + ': deploy preview did not return HTTP success');
      }
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });
      const result = await inspect(page, spec);
      if (errors.length) throw new Error(spec.name + ': uncaught browser errors: ' + JSON.stringify(errors));
      await page.screenshot({
        path: 'qa-artifacts/case-studies-' + spec.name + '.png',
        fullPage: true,
        animations: 'disabled'
      });
      results.push({
        viewport: spec.name,
        width: spec.width,
        documentWidth: result.documentWidth,
        conversionVisible: result.conversion.visible,
        mobileCtaDisplay: result.mobileCta.display,
        sharedEnhancerLoaded: result.sharedEnhancerLoaded
      });
      await page.close();
    }
    process.stdout.write(JSON.stringify({ targetUrl, results }, null, 2) + '\n');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  process.stderr.write((error?.stack || String(error)) + '\n');
  process.exitCode = 1;
});