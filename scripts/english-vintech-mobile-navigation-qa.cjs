'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const previewUrl = process.env.PREVIEW_URL;
const routes = [
  { path: '/en-vintech/cctv-nvr.html', fa: '/vintech/cctv-nvr.html',
    hrefs: ['/en-vintech.html', '/en-vintech.html', '/en-vintech.html#services', '/en-vintech.html#contact', '/vintech/cctv-nvr.html'] },
  { path: '/en-vintech/cybersecurity.html', fa: '/vintech/cybersecurity.html',
    hrefs: ['/en-vintech.html', '/en-vintech.html', '/en-vintech.html#services', '/en-vintech.html#contact', '/vintech/cybersecurity.html'] },
  { path: '/en-vintech/network-infrastructure.html', fa: '/vintech/network-infrastructure.html',
    hrefs: ['/en-vintech.html', '/en-vintech.html', '/en-vintech.html#services', '/en-vintech.html#contact', '/vintech/network-infrastructure.html'] },
  { path: '/en-vintech/servers-systems.html', fa: '/vintech/servers-systems.html',
    hrefs: ['/en-vintech.html', '/en-vintech.html', '/en-vintech.html#services', '/en-vintech.html#contact', '/vintech/servers-systems.html'] }
];
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];
const results = [];
const failures = [];
const check = (condition, label, detail = '') => {
  const item = { label, passed: Boolean(condition), detail };
  results.push(item);
  if (!condition) failures.push(item);
  console.log((condition ? 'PASS ' : 'FAIL ') + label + (detail ? ' — ' + detail : ''));
};

(async () => {
  if (!previewUrl) throw new Error('PREVIEW_URL is required.');
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const origin = new URL(previewUrl).origin;
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedLocalRequests = [];
  const failedLocalResponses = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', request => {
    if (request.url().startsWith(origin + '/')) {
      failedLocalRequests.push({
        url: request.url(),
        error: request.failure()?.errorText || 'unknown'
      });
    }
  });
  page.on('response', response => {
    if (response.url().startsWith(origin + '/') && response.status() >= 400) {
      failedLocalResponses.push({ url: response.url(), status: response.status() });
    }
  });

  try {
    for (const route of routes) {
      const target = new URL(route.path, origin).toString();
      const faUrl = new URL(route.fa, origin).toString();
      const initial = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
      check(initial && initial.status() === 200, route.path + ': HTTP 200',
        'status=' + (initial ? initial.status() : 'no response'));
      check(await page.locator('h1').count() === 1, route.path + ': one primary H1');
      check(await page.locator('html').getAttribute('lang') === 'en', route.path + ': lang=en');
      check(await page.locator('html').getAttribute('dir') === 'ltr', route.path + ': dir=ltr');
      check(await page.locator('link[rel="canonical"]').getAttribute('href') ===
        'https://mowhmmdh.github.io' + route.path, route.path + ': canonical unchanged');
      const faResponse = await page.request.get(faUrl, { timeout: 30000 });
      check(faResponse.status() === 200, route.path + ': Persian alternate HTTP 200',
        'status=' + faResponse.status());

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
        const nav = page.locator('nav.site-nav');
        const menu = nav.locator('button.mobile-menu');
        const links = nav.locator('.nav-links');
        check(await nav.getAttribute('aria-label') === 'Primary navigation',
          route.path + ' ' + viewport.name + ': named primary landmark');
        check(await menu.count() === 1, route.path + ' ' + viewport.name + ': exactly one menu button');
        check(await links.getAttribute('id') === await menu.getAttribute('aria-controls'),
          route.path + ' ' + viewport.name + ': aria-controls relationship');
        const hrefs = await links.locator('a').evaluateAll(anchors =>
          anchors.map(anchor => anchor.getAttribute('href')));
        const allHrefs = [await nav.locator('a.brand').getAttribute('href'), ...hrefs];
        check(JSON.stringify(allHrefs) === JSON.stringify(route.hrefs),
          route.path + ' ' + viewport.name + ': original navigation links/order');

        const dimensions = await page.evaluate(() => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth
        }));
        const noOverflow = dimensions.documentWidth <= dimensions.viewport &&
          dimensions.bodyWidth <= dimensions.viewport;
        check(noOverflow, route.path + ' ' + viewport.name + ': no horizontal overflow',
          'viewport=' + dimensions.viewport + ', document=' + dimensions.documentWidth +
          ', body=' + dimensions.bodyWidth);

        if (viewport.name === 'desktop') {
          check(!(await menu.isVisible()), route.path + ': desktop menu button hidden');
          check(await links.isVisible(), route.path + ': desktop navigation links visible');
          await page.screenshot({ path: 'qa-artifacts/' + route.path.split('/').pop() + '-desktop.png', fullPage: true });
          continue;
        }

        check(await menu.isVisible(), route.path + ': mobile menu button visible');
        check(await links.isHidden(), route.path + ': mobile navigation starts collapsed');
        check(await menu.getAttribute('aria-expanded') === 'false', route.path + ': initial expanded=false');
        check(await menu.getAttribute('aria-label') === 'Open menu', route.path + ': English open label');
        await menu.click();
        check(await menu.getAttribute('aria-expanded') === 'true', route.path + ': click opens menu');
        check(await menu.getAttribute('aria-label') === 'Close menu', route.path + ': English close label');
        check(await links.isVisible(), route.path + ': menu links become visible');
        await page.screenshot({ path: 'qa-artifacts/' + route.path.split('/').pop() + '-mobile-open.png', fullPage: true });
        await page.keyboard.press('Escape');
        check(await menu.getAttribute('aria-expanded') === 'false', route.path + ': Escape closes menu');
        check(await menu.getAttribute('aria-label') === 'Open menu', route.path + ': Escape restores English label');
        await menu.focus();
        await page.keyboard.press('Enter');
        check(await menu.getAttribute('aria-expanded') === 'true', route.path + ': keyboard Enter opens menu');
        await page.locator('main h1').click();
        check(await menu.getAttribute('aria-expanded') === 'false', route.path + ': outside click closes menu');
      }
    }

    check(pageErrors.length === 0, 'no uncaught browser page errors', JSON.stringify(pageErrors));
    check(consoleErrors.length === 0, 'no browser console errors', JSON.stringify(consoleErrors));
    check(failedLocalRequests.length === 0, 'no failed local requests', JSON.stringify(failedLocalRequests));
    check(failedLocalResponses.length === 0, 'no local HTTP errors', JSON.stringify(failedLocalResponses));
  } finally {
    fs.writeFileSync('qa-artifacts/browser-results.json', JSON.stringify({
      previewUrl, routes, viewports, results, failures, pageErrors, consoleErrors,
      failedLocalRequests, failedLocalResponses
    }, null, 2));
    await browser.close();
  }

  console.log(JSON.stringify({
    total: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    failures
  }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
