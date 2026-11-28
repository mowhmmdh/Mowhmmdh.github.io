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
    const documentScrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
    const overflowCandidates = Array.from(document.querySelectorAll('body *')).filter(el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (!rect.width || !rect.height || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      if (rect.left >= -1 && rect.right <= window.innerWidth + 1) return false;
      let ancestor = el.parentElement;
      while (ancestor && ancestor !== document.body) {
        const overflowX = getComputedStyle(ancestor).overflowX;
        if (['auto', 'scroll', 'hidden', 'clip'].includes(overflowX)) return false;
        ancestor = ancestor.parentElement;
      }
      return true;
    }).slice(0, 12).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className : '',
        left: Math.round(rect.left * 100) / 100,
        right: Math.round(rect.right * 100) / 100
      };
    });
    return {
      label,
      lang: root.lang,
      dir: root.dir,
      viewportWidth: window.innerWidth,
      documentScrollWidth,
      horizontalScrollX,
      overflowCandidates,
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
  await page.screenshot({ path: 'qa-artifacts/' + label + '-light.png', fullPage: false });
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

function colorChannels(color) {
  const channels = color.match(/[0-9.]+/g);
  return channels ? channels.slice(0, 3).map(Number) : [];
}

function relativeLuminance(color) {
  const channels = colorChannels(color).map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function checkLegacyArticleTheme(page, label) {
  const button = page.locator('.theme-toggle').first();
  assert(await button.count(), label + ': theme toggle is missing');
  await button.click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 5000 });

  const snapshot = await page.evaluate(() => {
    const eyebrow = document.querySelector('.ey');
    const matrixHeading = document.querySelector('.matrix strong');
    const matrixCell = document.querySelector('.matrix div');
    if (!eyebrow || !matrixHeading || !matrixCell) {
      return { missingElements: true };
    }
    const eyebrowColor = getComputedStyle(eyebrow).color;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    const matrixHeadingColor = getComputedStyle(matrixHeading).color;
    const matrixBackground = getComputedStyle(matrixCell).backgroundColor;
    const matrixBorder = getComputedStyle(matrixCell).borderTopColor;

    const channels = color => {
      const values = color.match(/[0-9.]+/g);
      return values ? values.slice(0, 3).map(Number) : [];
    };
    const luminance = color => {
      const values = channels(color).map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
    };
    const contrast = (foreground, background) => {
      const a = luminance(foreground);
      const b = luminance(background);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };

    return {
      eyebrowColor,
      bodyBackground,
      eyebrowContrast: contrast(eyebrowColor, bodyBackground),
      matrixHeadingColor,
      matrixBackground,
      matrixHeadingContrast: contrast(matrixHeadingColor, matrixBackground),
      matrixBorder
    };
  });

  assert(!snapshot.missingElements, label + ': legacy light-mode test elements are missing');
  if (!snapshot.missingElements) {
    assert(snapshot.eyebrowContrast >= 4.5, label + ': eyebrow contrast is below WCAG AA (' + snapshot.eyebrowContrast + ':1)');
    assert(snapshot.matrixHeadingContrast >= 4.5, label + ': matrix heading contrast is below WCAG AA (' + snapshot.matrixHeadingContrast + ':1)');
    assert(snapshot.matrixBackground !== 'rgba(0, 0, 0, 0)', label + ': matrix surface did not receive its light-theme background');
    assert(snapshot.matrixBorder !== 'rgba(0, 0, 0, 0)', label + ': matrix border did not receive its light-theme color');
  }

  await page.screenshot({ path: 'qa-artifacts/' + label + '-light-contrast.png', fullPage: false });
  await button.click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 5000 });
  return snapshot;
}

async function checkPersistedTheme(page, label) {
  await page.evaluate(() => localStorage.setItem('mha-theme', 'light'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await settle(page);
  const light = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    classApplied: document.documentElement.classList.contains('theme-light'),
    colorScheme: getComputedStyle(document.documentElement).colorScheme
  }));
  assert(light.theme === 'light' && light.classApplied && light.colorScheme === 'light', label + ': persisted light theme did not apply');
  await page.screenshot({ path: 'qa-artifacts/' + label + '-persisted-light.png', fullPage: false });

  await page.evaluate(() => localStorage.setItem('mha-theme', 'dark'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await settle(page);
  const dark = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    classApplied: document.documentElement.classList.contains('theme-light')
  }));
  assert(dark.theme === 'dark' && !dark.classApplied, label + ': persisted dark theme did not apply');
  return { light, dark };
}

async function run() {
  fs.mkdirSync('qa-artifacts', { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  const specs = [
    { path: '/about.html', name: 'fa-about-390x844', viewport: { width: 390, height: 844 }, lang: 'fa', dir: 'rtl', scroller: '.about-nav .about-nav-links', theme: true },
    { path: '/about.html', name: 'fa-about-768x1024', viewport: { width: 768, height: 1024 }, lang: 'fa', dir: 'rtl', scroller: '.about-nav .about-nav-links', theme: false },
    { path: '/en-about.html', name: 'en-about-390x844', viewport: { width: 390, height: 844 }, lang: 'en', dir: 'ltr', scroller: '.en-nav .en-nav-links', theme: false, persistedTheme: true },
    { path: '/en-about.html', name: 'en-about-768x1024', viewport: { width: 768, height: 1024 }, lang: 'en', dir: 'ltr', scroller: '.en-nav .en-nav-links', theme: false, persistedTheme: true },
    { path: '/profile.html', name: 'profile-390x844', viewport: { width: 390, height: 844 }, lang: 'fa', dir: 'rtl', menu: true, theme: true },
    { path: '/profile.html', name: 'profile-1440x1000', viewport: { width: 1440, height: 1000 }, lang: 'fa', dir: 'rtl', menu: false, theme: true },
    { path: '/vintech/insights/cctv-ip-camera-security.html', name: 'fa-vintech-insight-390x844', viewport: { width: 390, height: 844 }, lang: 'fa', dir: 'rtl', legacyLight: true },
    { path: '/en-vintech/insights/cctv-ip-camera-security.html', name: 'en-vintech-insight-390x844', viewport: { width: 390, height: 844 }, lang: 'en', dir: 'ltr', legacyLight: true }
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
        assert(documentState.documentScrollWidth <= documentState.viewportWidth + 1, spec.name + ': document width exceeds viewport (' + documentState.documentScrollWidth + ' > ' + documentState.viewportWidth + ')');
        assert(documentState.overflowCandidates.length === 0, spec.name + ': visible elements exceed viewport bounds: ' + JSON.stringify(documentState.overflowCandidates));

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
        const legacyLight = spec.legacyLight ? await checkLegacyArticleTheme(page, spec.name) : null;
        const persistedTheme = spec.persistedTheme ? await checkPersistedTheme(page, spec.name) : null;
        await page.screenshot({ path: 'qa-artifacts/' + spec.name + '.png', fullPage: false });
        if (pageErrors.length) failures.push(spec.name + ': uncaught page errors: ' + pageErrors.join('; '));
        if (firstPartyFailures.length) failures.push(spec.name + ': first-party failed requests: ' + JSON.stringify(firstPartyFailures));
        results.push({ name: spec.name, path: spec.path, viewport: spec.viewport, documentState, navigation, theme, legacyLight, persistedTheme, pageErrors, firstPartyFailures });
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
