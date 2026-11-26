'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePreviewOrigin, isFirstPartyRequest } = require('./qa-origin.cjs');

test('accepts the exact HTTPS Netlify deploy-preview host', () => {
  assert.equal(
    normalizePreviewOrigin('https://deploy-preview-69--mowhmmdh.netlify.app/'),
    'https://deploy-preview-69--mowhmmdh.netlify.app'
  );
});

test('rejects lookalike hosts and non-HTTPS or credential-bearing URLs', () => {
  for (const value of [
    'https://deploy-preview-69--mowhmmdh.netlify.app.attacker.example/',
    'https://attacker.example/deploy-preview-69--mowhmmdh.netlify.app',
    'http://deploy-preview-69--mowhmmdh.netlify.app/',
    'https://user@deploy-preview-69--mowhmmdh.netlify.app/',
    'https://deploy-preview-69--mowhmmdh.netlify.app:444/'
  ]) {
    assert.throws(() => normalizePreviewOrigin(value), TypeError, value);
  }
});

test('matches request origins exactly rather than by string prefix', () => {
  const origin = normalizePreviewOrigin('https://deploy-preview-69--mowhmmdh.netlify.app');
  assert.equal(isFirstPartyRequest('https://deploy-preview-69--mowhmmdh.netlify.app/assets/site.css', origin), true);
  assert.equal(isFirstPartyRequest('https://deploy-preview-69--mowhmmdh.netlify.app.attacker.example/x', origin), false);
  assert.equal(isFirstPartyRequest('https://attacker.example/?next=deploy-preview-69--mowhmmdh.netlify.app', origin), false);
  assert.equal(isFirstPartyRequest('not a URL', origin), false);
});
