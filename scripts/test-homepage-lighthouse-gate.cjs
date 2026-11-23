'use strict';

const assert = require('node:assert/strict');
const { evaluateReport } = require('./check-homepage-lighthouse.cjs');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write('PASS ' + name + '\n');
  } catch (error) {
    process.stderr.write('FAIL ' + name + ': ' + error.message + '\n');
    process.exitCode = 1;
  }
}

function report(overrides = {}) {
  return {
    categories: {
      performance: { score: 0.90 },
      accessibility: { score: 0.95 },
      'best-practices': { score: 0.95 },
      seo: { score: 0.69 },
      ...overrides
    },
    audits: {}
  };
}

test('accepts exact minimum thresholds and preview-only SEO noindex', () => {
  const result = evaluateReport(report());
  assert.equal(result.passed, true);
  assert.deepEqual(result.scores, {
    performance: 90,
    accessibility: 95,
    'best-practices': 95
  });
  assert.deepEqual(result.failures, []);
});

test('rejects Performance below 90 even when rounded display could look close', () => {
  const result = evaluateReport(report({ performance: { score: 0.8999 } }));
  assert.equal(result.passed, false);
  assert.equal(result.failures[0].category, 'performance');
});

test('rejects Accessibility below 95', () => {
  const result = evaluateReport(report({ accessibility: { score: 0.9499 } }));
  assert.equal(result.passed, false);
  assert.equal(result.failures[0].category, 'accessibility');
});

test('rejects Best Practices below 95', () => {
  const result = evaluateReport(report({ 'best-practices': { score: 0.9499 } }));
  assert.equal(result.passed, false);
  assert.equal(result.failures[0].category, 'best-practices');
});

test('rejects a missing required Lighthouse category', () => {
  const result = evaluateReport({
    categories: {
      performance: { score: 0.99 },
      accessibility: { score: 1 }
    }
  });
  assert.equal(result.passed, false);
  assert.ok(result.failures.some(failure => failure.category === 'best-practices'));
});

test('rejects invalid scores outside the Lighthouse 0..1 range', () => {
  const result = evaluateReport(report({ performance: { score: 1.01 } }));
  assert.equal(result.passed, false);
  assert.equal(result.failures[0].reason, 'missing-or-invalid-score');
});

test('rejects reports measured with Netlify deploy-preview toolbar instrumentation', () => {
  const contaminated = report();
  contaminated.audits = {
    'network-requests': {
      details: {
        items: [
          { url: 'https://deploy-preview-27--mowhmmdh.netlify.app/.netlify/scripts/cdp' },
          { url: 'https://app.netlify.com/cdp/?deployID=example&siteID=example' }
        ]
      }
    }
  };
  const result = evaluateReport(contaminated);
  assert.equal(result.passed, false);
  assert.equal(result.failures[0].category, 'preview-instrumentation');
  assert.equal(result.failures[0].reason, 'netlify-preview-toolbar-present');
  assert.equal(result.previewInstrumentationRequests.length, 2);
});

process.stdout.write('\n' + passed + '/7 Lighthouse gate tests passed\n');
if (passed !== 7) process.exitCode = 1;
