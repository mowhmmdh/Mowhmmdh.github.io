'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

test('Persian and English profile pages include the shared theme controller and toggle', () => {
  const fa = fs.readFileSync(path.join(ROOT, 'profile.html'), 'utf8');
  const en = fs.readFileSync(path.join(ROOT, 'en-profile.html'), 'utf8');

  assert.match(fa, /<html lang="fa" dir="rtl">/);
  assert.match(en, /<html lang="en" dir="ltr">/);
  assert.ok(fa.includes('href="/en-profile.html" lang="en" dir="ltr"'));
  assert.ok(en.includes('href="/profile.html" lang="fa"'));
  for (const page of [fa, en]) {
    assert.match(page, /class="theme-toggle"/);
    assert.match(page, /\/assets\/site-theme\.js/);
  }
});

test('Persian profile custom surfaces define a readable light palette', () => {
  const fa = fs.readFileSync(path.join(ROOT, 'profile.html'), 'utf8');
  assert.match(fa, /html\.theme-light,html\[data-theme="light"\]/);
  assert.match(fa, /--bg:#f3f6fa/);
  assert.match(fa, /--text:#172638/);
  assert.match(fa, /--muted:#586a7c/);
});

test('profile titles are concise and the English profile is distinct from the homepage', () => {
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
