'use strict';

const { chromium } = require('playwright');

const previewBase = process.env.PREVIEW_URL || 'https://deploy-preview-45--mowhmmdh.netlify.app/';
const targetUrl = new URL('/', previewBase).toString();
const viewports = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'small-mobile', width: 320, height: 720, mobile: true }
];

const expectedHrefs = [
  '/authority.html',
  '/vintech.html',
  '/services.html',
  '/projects.html',
  '/blog/',
  '/case-studies/',
  '/about.html',
  '/en.html'
];

async function inspect(page, spec) {
  const initial = await page.evaluate(() => {
    const nav = document.querySelector('header .site-nav');
    const menu = nav?.querySelector('.mobile-menu');
    const links = nav?.querySelector('.nav-links');
    const backdrop = nav ? getComputedStyle(nav, '::before') : null;
    const rect = element => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        left: Math.round(box.left),
        right: Math.round(box.right),
        width: Math.round(box.width),
        height: Math.round(box.height)
      };
    };
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      viewportWidth: window.innerWidth,
      documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      nav: rect(nav),
      menu: menu ? {
        display: getComputedStyle(menu).display,
        rect: rect(menu),
        expanded: menu.getAttribute('aria-expanded')
      } : null,
      links: links ? {
        display: getComputedStyle(links).display,
        rect: rect(links),
        hrefs: Array.from(links.querySelectorAll('a')).map(a => a.getAttribute('href'))
      } : null,
      backdrop: backdrop ? {
        content: backdrop.content,
        position: backdrop.position,
        width: parseFloat(backdrop.width),
        left: backdrop.left,
        transform: backdrop.transform
      } : null
    };
  });

  const fail = message => {
    throw new Error(spec.name + ': ' + message + ': ' + JSON.stringify(initial));
  };

  if (initial.lang !== 'fa' || initial.dir !== 'rtl') fail('homepage language/direction changed');
  if (!initial.nav || initial.nav.width < 1 || initial.nav.left < -1 ||
      initial.nav.right > spec.width + 1) fail('shared navigation is missing or outside the viewport');
  if (initial.documentWidth > spec.width + 1) fail('horizontal document overflow detected');
  if (!initial.menu || !initial.links) fail('expected homepage navigation controls are missing');
  if (!initial.backdrop || initial.backdrop.content === 'none' ||
      initial.backdrop.position !== 'absolute' ||
      Math.abs(initial.backdrop.width - spec.width) > 1 ||
      !/^50(?:\.0+)?%$/.test(initial.backdrop.left) ||
      initial.backdrop.transform === 'none') {
    fail('shared navigation backdrop is not centered at exactly one viewport width');
  }
  if (initial.links.hrefs.length !== expectedHrefs.length ||
      expectedHrefs.some(href => !initial.links.hrefs.includes(href))) {
    fail('homepage navigation destinations changed');
  }

  if (spec.mobile) {
    if (initial.menu.display === 'none' || initial.menu.rect.width < 1 ||
        initial.menu.expanded !== 'false') {
      fail('mobile menu button is not available in its closed state');
    }
    if (initial.links.display !== 'none') {
      fail('mobile navigation links should start collapsed');
    }

    await page.locator('header .site-nav .mobile-menu').click();
    await page.waitForFunction(() => {
      const nav = document.querySelector('header .site-nav');
      return nav?.classList.contains('menu-open') &&
        nav.querySelector('.mobile-menu')?.getAttribute('aria-expanded') === 'true';
    }, { timeout: 5000 });

    const opened = await page.evaluate(() => {
      const nav = document.querySelector('header .site-nav');
      const links = nav?.querySelector('.nav-links');
      return {
        expanded: nav?.querySelector('.mobile-menu')?.getAttribute('aria-expanded'),
        open: nav?.classList.contains('menu-open'),
        display: links ? getComputedStyle(links).display : 'missing',
        linkRects: Array.from(links?.querySelectorAll('a') || []).map(a => {
          const box = a.getBoundingClientRect();
          return {
            width: Math.round(box.width),
            height: Math.round(box.height),
            left: Math.round(box.left),
            right: Math.round(box.right),
            display: getComputedStyle(a).display,
            visibility: getComputedStyle(a).visibility
          };
        }),
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
      };
    });

    if (!opened.open || opened.expanded !== 'true' || opened.display === 'none' ||
        opened.linkRects.length !== expectedHrefs.length ||
        opened.linkRects.some(r => r.width < 1 || r.height < 1 ||
          r.left < -1 || r.right > spec.width + 1 ||
          r.display === 'none' || r.visibility === 'hidden') ||
        opened.documentWidth > spec.width + 1) {
      throw new Error(spec.name + ': opened mobile navigation is not fully visible/in-bounds: ' +
        JSON.stringify(opened));
    }

    await page.screenshot({
      path: 'qa-artifacts/homepage-' + spec.name + '-menu-open.png',
      fullPage: true,
      animations: 'disabled'
    });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const nav = document.querySelector('header .site-nav');
      return !nav?.classList.contains('menu-open') &&
        nav?.querySelector('.mobile-menu')?.getAttribute('aria-expanded') === 'false';
    }, { timeout: 5000 });
  } else {
    if (initial.menu.display !== 'none' || initial.links.display === 'none') {
      fail('desktop navigation visibility is incorrect');
    }
    await page.screenshot({
      path: 'qa-artifacts/homepage-desktop.png',
      fullPage: true,
      animations: 'disabled'
    });
  }

  return {
    viewport: spec.name,
    width: spec.width,
    documentWidth: initial.documentWidth,
    navBackdropWidth: initial.backdrop.width,
    menuInteraction: spec.mobile ? 'open-and-Escape-close passed' : 'desktop links visible',
    navigationLinks: initial.links.hrefs.length
  };
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
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      const response = await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      if (!response || !response.ok()) {
        throw new Error(spec.name + ': homepage preview did not return HTTP success');
      }
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });
      const result = await inspect(page, spec);
      if (pageErrors.length) {
        throw new Error(spec.name + ': uncaught browser errors: ' + JSON.stringify(pageErrors));
      }
      results.push(result);
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
