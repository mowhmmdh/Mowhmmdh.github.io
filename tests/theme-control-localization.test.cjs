'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const themeSource = fs.readFileSync(path.join(ROOT, 'assets/site-theme.js'), 'utf8');

function makeButton() {
  return {
    dataset: {},
    attributes: {},
    listeners: {},
    textContent: '',
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    addEventListener(name, handler) {
      this.listeners[name] = handler;
    }
  };
}

function createHarness(lang, savedTheme = 'dark') {
  const rootClasses = new Set();
  const navClasses = new Set();
  const root = {
    lang,
    dataset: {},
    style: {},
    hasAttribute(name) {
      return name === 'data-theme' && Object.prototype.hasOwnProperty.call(this.dataset, 'theme');
    },
    removeAttribute(name) {
      if (name === 'data-theme') delete this.dataset.theme;
    },
    classList: {
      contains(name) {
        return rootClasses.has(name);
      },
      toggle(name, force) {
        const enabled = force === undefined ? !rootClasses.has(name) : Boolean(force);
        if (enabled) rootClasses.add(name);
        else rootClasses.delete(name);
        return enabled;
      }
    }
  };

  const themeButton = makeButton();
  const menuButton = makeButton();
  const links = { addEventListener() {} };
  const nav = {
    classList: {
      contains(name) { return navClasses.has(name); },
      add(name) { navClasses.add(name); },
      remove(name) { navClasses.delete(name); },
      toggle(name, force) {
        const enabled = force === undefined ? !navClasses.has(name) : Boolean(force);
        if (enabled) navClasses.add(name);
        else navClasses.delete(name);
        return enabled;
      }
    },
    querySelector(selector) {
      if (selector === '.mobile-menu') return menuButton;
      if (selector === '.nav-links,.about-nav-links,.en-nav-links') return links;
      return null;
    }
  };

  const document = {
    documentElement: root,
    readyState: 'complete',
    querySelectorAll(selector) {
      if (selector === '.theme-toggle') return [themeButton];
      if (selector === '.site-nav,.about-nav,.en-nav,.nav,.vt-nav') return [nav];
      if (selector === '.menu-open') return navClasses.has('menu-open') ? [nav] : [];
      return [];
    },
    addEventListener() {}
  };

  const storage = { 'mha-theme': savedTheme };
  const localStorage = {
    getItem(key) { return storage[key] ?? null; },
    setItem(key, value) { storage[key] = String(value); }
  };
  const window = { addEventListener() {} };

  vm.runInNewContext(themeSource, { document, localStorage, window, console });
  return { themeButton, menuButton, nav, root, storage };
}

test('English theme control exposes the available action in English in both themes', () => {
  const h = createHarness('en', 'dark');
  assert.equal(h.themeButton.attributes['aria-label'], 'Switch to light mode');
  assert.equal(h.themeButton.attributes.title, 'Switch to light mode');
  h.themeButton.listeners.click();
  assert.equal(h.themeButton.attributes['aria-label'], 'Switch to dark mode');
  assert.equal(h.themeButton.attributes.title, 'Switch to dark mode');
  assert.equal(h.themeButton.attributes['aria-pressed'], 'true');
});

test('Persian theme control retains Persian accessible labels', () => {
  const h = createHarness('fa', 'dark');
  assert.equal(h.themeButton.attributes['aria-label'], 'فعال‌کردن حالت روشن');
  assert.equal(h.themeButton.attributes.title, 'فعال‌کردن حالت روشن');
  h.themeButton.listeners.click();
  assert.equal(h.themeButton.attributes['aria-label'], 'فعال‌کردن حالت تیره');
  assert.equal(h.themeButton.attributes.title, 'فعال‌کردن حالت تیره');
});

test('English mobile menu announces open and close state correctly', () => {
  const h = createHarness('en', 'dark');
  assert.equal(h.menuButton.attributes['aria-label'], 'Open menu');
  h.menuButton.listeners.click({ stopPropagation() {} });
  assert.equal(h.menuButton.attributes['aria-expanded'], 'true');
  assert.equal(h.menuButton.attributes['aria-label'], 'Close menu');
  h.menuButton.listeners.click({ stopPropagation() {} });
  assert.equal(h.menuButton.attributes['aria-expanded'], 'false');
  assert.equal(h.menuButton.attributes['aria-label'], 'Open menu');
});

test('Persian mobile menu retains localized open and close labels', () => {
  const h = createHarness('fa', 'dark');
  assert.equal(h.menuButton.attributes['aria-label'], 'باز کردن منو');
  h.menuButton.listeners.click({ stopPropagation() {} });
  assert.equal(h.menuButton.attributes['aria-label'], 'بستن منو');
  h.menuButton.listeners.click({ stopPropagation() {} });
  assert.equal(h.menuButton.attributes['aria-label'], 'باز کردن منو');
});

test('both professional profile pages expose a working theme control', () => {
  const fa = fs.readFileSync(path.join(ROOT, 'profile.html'), 'utf8');
  const en = fs.readFileSync(path.join(ROOT, 'en-profile.html'), 'utf8');
  for (const page of [fa, en]) {
    assert.match(page, /class="theme-toggle"/);
    assert.match(page, /\/assets\/site-theme\.js/);
  }
  assert.match(fa, /html\.theme-light,html\[data-theme="light"\]/);
  assert.match(fa, /--bg:#f3f6fa/);
});

test('profile page titles are distinct and concise for their search intent', () => {
  const fa = fs.readFileSync(path.join(ROOT, 'profile.html'), 'utf8');
  const en = fs.readFileSync(path.join(ROOT, 'en-profile.html'), 'utf8');
  const home = fs.readFileSync(path.join(ROOT, 'en.html'), 'utf8');
  const faTitle = fa.split('<title>')[1]?.split('</title>')[0] || '';
  const enTitle = en.split('<title>')[1]?.split('</title>')[0] || '';
  const homeTitle = home.split('<title>')[1]?.split('</title>')[0] || '';
  const enDescription = en.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
  assert.ok(faTitle.length <= 60, 'Persian profile title should stay concise');
  assert.ok(enTitle.length <= 60, 'English profile title should stay concise');
  assert.notEqual(enTitle, homeTitle, 'English profile must not duplicate the homepage title');
  assert.ok(enTitle.includes('Professional Profile'));
  assert.ok(enDescription.length <= 160, 'English profile description should stay concise');
});
