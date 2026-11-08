'use strict';

const { chromium } = require('playwright');

const previewUrl = process.env.PREVIEW_URL || 'https://deploy-preview-25--mowhmmdh.netlify.app/';
const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-mobile', width: 320, height: 720 }
];

const expectedHrefs = [
  '/en-vintech.html',
  '/en-services.html',
  '/en-projects.html',
  '/en-about.html',
  '/'
];

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

      const response = await page.goto(previewUrl, {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      if (!response || !response.ok()) {
        throw new Error(spec.name + ': preview did not return HTTP success');
      }

      await page.evaluate(async () => {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      });

      const snapshot = await page.evaluate(() => {
        const header = document.querySelector('header.nav');
        const nav = header ? header.querySelector(':scope > div') : null;
        const brand = header ? header.querySelector(':scope > a:first-child') : null;
        const rect = element => {
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return {
            left: Math.round(box.left),
            right: Math.round(box.right),
            top: Math.round(box.top),
            bottom: Math.round(box.bottom),
            width: Math.round(box.width),
            height: Math.round(box.height)
          };
        };
        const links = nav ? Array.from(nav.querySelectorAll('a')) : [];
        const linkStates = links.map(link => {
          const style = getComputedStyle(link);
          const box = link.getBoundingClientRect();
          return {
            href: link.getAttribute('href'),
            text: (link.textContent || '').trim(),
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            width: Math.round(box.width),
            height: Math.round(box.height),
            left: Math.round(box.left),
            right: Math.round(box.right)
          };
        });
        const navStyle = nav ? getComputedStyle(nav) : null;
        const headerStyle = header ? getComputedStyle(header) : null;
        const documentWidth = Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth
        );
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          viewportWidth: window.innerWidth,
          documentWidth,
          horizontalOverflow: documentWidth > window.innerWidth + 1,
          header: rect(header),
          headerDisplay: headerStyle ? headerStyle.display : null,
          nav: rect(nav),
          navDisplay: navStyle ? navStyle.display : null,
          navVisibility: navStyle ? navStyle.visibility : null,
          brandVisible: !!brand && rect(brand).width > 0 && rect(brand).height > 0,
          links: linkStates
        };
      });

      if (snapshot.lang !== 'en' || snapshot.dir !== 'ltr') {
        throw new Error(spec.name + ': expected an English LTR document: ' + JSON.stringify(snapshot));
      }
      if (!snapshot.header || snapshot.headerDisplay === 'none' || !snapshot.nav ||
          snapshot.navDisplay === 'none' || snapshot.navVisibility === 'hidden') {
        throw new Error(spec.name + ': primary navigation container is unavailable: ' + JSON.stringify(snapshot));
      }
      if (!snapshot.brandVisible || snapshot.links.length !== expectedHrefs.length) {
        throw new Error(spec.name + ': brand or expected navigation links are missing: ' + JSON.stringify(snapshot));
      }

      const actualHrefs = snapshot.links.map(link => link.href);
      for (const href of expectedHrefs) {
        if (!actualHrefs.includes(href)) {
          throw new Error(spec.name + ': missing navigation destination ' + href);
        }
      }
      for (const link of snapshot.links) {
        if (link.display === 'none' || link.visibility === 'hidden' ||
            Number(link.opacity) === 0 || link.width < 1 || link.height < 1 ||
            link.left < -1 || link.right > window.innerWidth + 1) {
          throw new Error(spec.name + ': a primary navigation link is not visibly reachable: ' + JSON.stringify(link));
        }
      }
      if (snapshot.horizontalOverflow) {
        throw new Error(spec.name + ': horizontal page overflow detected: ' + JSON.stringify(snapshot));
      }
      if (pageErrors.length) {
        throw new Error(spec.name + ': uncaught browser errors: ' + pageErrors.join(' | '));
      }

      await page.screenshot({
        path: 'qa-artifacts/en-blog-' + spec.name + '.png',
        fullPage: true,
        animations: 'disabled'
      });
      results.push({ viewport: spec.name, ...snapshot, pageErrors });
      await page.close();
    }

    process.stdout.write(JSON.stringify({ previewUrl, results }, null, 2) + '\n');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
