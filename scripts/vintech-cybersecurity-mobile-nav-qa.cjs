'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const target = process.env.PREVIEW_URL;
const englishUrl = new URL('/en-vintech/cybersecurity.html', target).toString();
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
  if (!target) throw new Error('PREVIEW_URL is required.');
  fs.mkdirSync('qa-artifacts', { recursive: true });

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
    if (request.url().startsWith(new URL(target).origin + '/')) {
      failedLocalRequests.push({
        url: request.url(),
        error: request.failure()?.errorText || 'unknown'
      });
    }
  });
  page.on('response', response => {
    if (response.url().startsWith(new URL(target).origin + '/') && response.status() >= 400) {
      failedLocalResponses.push({ url: response.url(), status: response.status() });
    }
  });

  try {
    const initialResponse = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });

    check(initialResponse && initialResponse.status() === 200, 'Persian cybersecurity page returns HTTP 200',
      'status=' + (initialResponse ? initialResponse.status() : 'no response'));
    check(await page.locator('h1').count() === 1, 'Page retains one primary H1');
    check(await page.locator('link[rel="canonical"]').getAttribute('href') ===
      'https://mowhmmdh.github.io/vintech/cybersecurity.html', 'Canonical URL remains unchanged');

    for (const spec of viewports) {
      await page.setViewportSize({ width: spec.width, height: spec.height });
      await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });

      const menu = page.locator('nav.site-nav button.mobile-menu');
      const links = page.locator('nav.site-nav .nav-links');
      const menuCount = await menu.count();
      check(menuCount === 1, spec.name + ': exactly one mobile menu button', 'count=' + menuCount);

      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth
      }));
      const noOverflow = dimensions.documentWidth <= dimensions.viewport &&
        dimensions.bodyWidth <= dimensions.viewport;
      check(noOverflow, spec.name + ': no horizontal overflow',
        'viewport=' + dimensions.viewport + ', document=' + dimensions.documentWidth + ', body=' + dimensions.bodyWidth);

      if (spec.name === 'desktop') {
        check(!(await menu.isVisible()), 'desktop: mobile menu button is hidden');
        check(await links.isVisible(), 'desktop: primary navigation links remain visible');
        await page.screenshot({ path: 'qa-artifacts/cybersecurity-desktop.png', fullPage: true });
        continue;
      }

      check(await menu.isVisible(), 'mobile: menu button is visible');
      check(await links.isHidden(), 'mobile: navigation starts collapsed');
      check(await menu.getAttribute('aria-expanded') === 'false', 'mobile: initial expanded state is false');
      check(await menu.getAttribute('aria-controls') ===
        await links.getAttribute('id'), 'mobile: button controls the navigation panel');

      await menu.click();
      check(await menu.getAttribute('aria-expanded') === 'true', 'mobile: click opens navigation');
      check(await menu.getAttribute('aria-label') === 'بستن منو', 'mobile: open state has a close label');
      check(await links.isVisible(), 'mobile: navigation links become visible after opening');
      check(await links.locator('a').count() === 3, 'mobile: all three original destinations are present');
      await page.screenshot({ path: 'qa-artifacts/cybersecurity-mobile-menu-open.png', fullPage: true });

      await page.keyboard.press('Escape');
      check(await menu.getAttribute('aria-expanded') === 'false', 'mobile: Escape closes navigation');
      check(await links.isHidden(), 'mobile: navigation is hidden after Escape');

      await menu.focus();
      await page.keyboard.press('Enter');
      check(await menu.getAttribute('aria-expanded') === 'true', 'mobile: keyboard Enter opens navigation');
      await page.locator('h1').click();
      check(await menu.getAttribute('aria-expanded') === 'false', 'mobile: outside click closes navigation');

      const englishCheck = await page.request.get(englishUrl, { timeout: 30000 });
      check(englishCheck.status() === 200, 'English alternate returns HTTP 200',
        'status=' + englishCheck.status());

      await menu.click();
      await Promise.all([
        page.waitForURL(url => url.pathname === '/en-vintech/cybersecurity.html', { timeout: 30000 }),
        page.locator('nav.site-nav .nav-links a[href="/en-vintech/cybersecurity.html"]').click()
      ]);
      check(await page.locator('html').getAttribute('lang') === 'en',
        'mobile language link reaches the English counterpart');
    }

    check(pageErrors.length === 0, 'no uncaught browser page errors', JSON.stringify(pageErrors));
    check(consoleErrors.length === 0, 'no browser console errors', JSON.stringify(consoleErrors));
    check(failedLocalRequests.length === 0, 'no failed local requests', JSON.stringify(failedLocalRequests));
    check(failedLocalResponses.length === 0, 'no local HTTP errors', JSON.stringify(failedLocalResponses));
  } finally {
    fs.writeFileSync('qa-artifacts/browser-results.json', JSON.stringify({
      target,
      viewports,
      results,
      failures,
      pageErrors,
      consoleErrors,
      failedLocalRequests,
      failedLocalResponses
    }, null, 2));
    await browser.close();
  }

  console.log(JSON.stringify({ total: results.length, passed: results.length - failures.length,
    failed: failures.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
