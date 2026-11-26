#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { chromium } = require('playwright');

const { normalizePreviewOrigin, isFirstPartyRequest } = require('./qa-origin.cjs');
const base = normalizePreviewOrigin(process.env.PREVIEW_URL || 'https://deploy-preview-69--mowhmmdh.netlify.app');
const results = [];
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
}

async function checkDocument(page, label, expected) {
  return page.evaluate(({ label, expected }) => {
    const root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(10000, 0);
    const horizontalScrollX = window.scrollX;
    window.scrollTo(0, 0);
    root.style.scrollBehavior = '';
    return {
      label,
      lang: root.lang,
      dir: root.dir,
      viewportWidth: window.innerWidth,
      documentScrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      horizontalScrollX,
      expectedLang: expected.lang,
      expectedDir: expected.dir
    };
  }, { label, expected });
}

async function checkScroller(page, selector, label) {
  const snapshot = await page.locator(selector).evaluate(el => {
    const style = getComputedStyle(el);
    const links = Array.from(el.querySelectorAll('a'));
    return {
      display: style.display,
      maxHeight: style.maxHeight,
      opacity: Number(style.opacity),
      pointerEvents: style.pointerEvents,
      overflowX: style.overflowX,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      height: el.getBoundingClientRect().height,
      linkCount: links.length,
      visibleLinkCount: links.filter(link => {
        const rect = link.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(link).visibility !== 'hidden';
      }).length
    };
  });
  assert(snapshot.display === 'flex', label + ': nav row display is ' + snapshot.display);
  assert(snapshot.maxHeight !== '0px', label + ': nav row remains collapsed at max-height:0');
  assert(snapshot.opacity > 0.9, label + ': nav row remains visually transparent');
  assert(snapshot.pointerEvents === 'auto', label + ': nav links are not interactive');
  assert(snapshot.overflowX === 'auto' || snapshot.overflowX === 'scroll', label + ': nav row is not horizontally scrollable');
  assert(snapshot.height > 0, label + ': nav row has no visible height');
  assert(snapshot.linkCount >= 5, label + ': expected at least five navigation links');
  assert(snapshot.visibleLinkCount === snapshot.linkCount, label + ': one or more nav links have no visible box');

  const canReachOverflow = await page.locator(selector).evaluate(el => {
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 1) return true;
    const start = el.scrollLeft;
    for (const target of [max, -max]) {
      el.scrollLeft = target;
      if (Math.abs(el.scrollLeft - start) > 1) {
        el.scrollLeft = start;
        return true;
      }
    }
    el.scrollLeft = start;
    return false;
  });
  assert(canReachOverflow, label + ': overflowing links cannot be reached by scrolling');
  return snapshot;
}

async function checkTheme(page, label) {
  const button = page.locator('.theme-toggle').first();
  if (!(await button.count())) {
    assert(false, label + ': expected theme toggle is missing');
    return null;
  }
  await button.click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 5000 });
  const light = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    classApplied: document.documentElement.classList.contains('theme-light'),
    pressed: document.querySelector('.theme-toggle')?.getAttribute('aria-pressed')
  }));
  assert(light.theme === 'light' && light.classApplied && light.pressed === 'true', label + ': light theme state did not synchronize');
  await button.click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 5000 });
  const dark = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    classApplied: document.documentElement.classList.contains('theme-light'),
    pressed: document.querySelector('.theme-toggle')?.getAttribute('aria-pressed')
  }));
  assert(dark.theme === 'dark' && !dark.classApplied && dark.pressed === 'false', label + ': dark theme state did not synchronize');
  return { light, dark };
}

async function run() {
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  const specs = [
    { path: '/about.html', name: 'fa-about-390x844', viewport: { width: 390, height: 844 }, lang: 'fa', dir: 'rtl', scroller: '.about-nav .about-nav-links', theme: true },
    { path: '/about.html', name: 'fa-about-768x1024', viewport: { width: 768, height: 1024 }, lang: 'fa', dir: 'rtl', scroller: '.about-nav .about-nav-links', theme: false },
    { path: '/en-about.html', name: 'en-about-390x844', viewport: { width: 390, height: 844 }, lang: 'en', dir: 'ltr', scroller: '.en-nav .en-nav-links', theme: false },
    { path: '/en-about.html', name: 'en-about-768x1024', viewport: { width: 768, height: 1024 }, lang: 'en', dir: 'ltr', scroller: '.en-nav .en-nav-links', theme: false },
    { path: '/profile.html', name: 'profile-390x844', viewport: { width: 390, height: 844 }, lang: 'fa', dir: 'rtl', menu: true, theme: true },
    { path: '/profile.html', name: 'profile-1440x1000', viewport: { width: 1440, height: 1000 }, lang: 'fa', dir: 'rtl', menu: false, theme: true }
  ];

  try {
    for (const spec of specs) {
      const context = await browser.newContext({
        viewport: spec.viewport,
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      const pageErrors = [];
      const firstPartyFailures = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('requestfailed', request => {
        if (isFirstPartyRequest(request.url(), base)) {
          firstPartyFailures.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
        }
      });

      try {
        const response = await page.goto(base + spec.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await settle(page);
        assert(response?.status() === 200, spec.name + ': HTTP response was not 200');
        const documentState = await checkDocument(page, spec.name, spec);
        assert(documentState.lang === spec.lang, spec.name + ': incorrect document language');
        assert(documentState.dir === spec.dir, spec.name + ': incorrect document direction');
        assert(documentState.horizontalScrollX <= 1, spec.name + ': document can scroll horizontally');

        let navigation = null;
        if (spec.scroller) navigation = await checkScroller(page, spec.scroller, spec.name);

        if (spec.menu) {
          const menu = page.locator('.profile-nav .mobile-menu');
          const display = await menu.evaluate(el => getComputedStyle(el).display);
          assert(display !== 'none', spec.name + ': mobile menu button is hidden');
          await menu.click();
          const opened = await page.evaluate(() => ({
            open: document.querySelector('.profile-nav')?.classList.contains('menu-open'),
            expanded: document.querySelector('.profile-nav .mobile-menu')?.getAttribute('aria-expanded')
          }));
          assert(opened.open && opened.expanded === 'true', spec.name + ': mobile menu did not open');
          await page.keyboard.press('Escape');
          const closed = await page.evaluate(() => ({
            open: document.querySelector('.profile-nav')?.classList.contains('menu-open'),
            expanded: document.querySelector('.profile-nav .mobile-menu')?.getAttribute('aria-expanded')
          }));
          assert(!closed.open && closed.expanded === 'false', spec.name + ': Escape did not close mobile menu');
        } else if (spec.menu === false) {
          const menu = page.locator('.profile-nav .mobile-menu');
          const display = await menu.evaluate(el => getComputedStyle(el).display);
          assert(display === 'none', spec.name + ': desktop unexpectedly shows mobile menu');
        }

        const theme = spec.theme ? await checkTheme(page, spec.name) : null;
        await page.screenshot({ path: 'qa-artifacts/' + spec.name + '.png', fullPage: false });
        if (pageErrors.length) failures.push(spec.name + ': uncaught page errors: ' + pageErrors.join('; '));
        if (firstPartyFailures.length) failures.push(spec.name + ': first-party failed requests: ' + JSON.stringify(firstPartyFailures));
        results.push({ name: spec.name, path: spec.path, viewport: spec.viewport, documentState, navigation, theme, pageErrors, firstPartyFailures });
      } catch (error) {
        failures.push(spec.name + ': ' + error.message);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const report = { base, results, failures };
  fs.writeFileSync('qa-artifacts/theme-responsive-browser-qa.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
