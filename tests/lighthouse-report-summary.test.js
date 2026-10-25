'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeReport, formatSummary } = require('../scripts/lighthouse-report-summary.js');

function fixture() {
  return {
    finalDisplayedUrl: 'https://example.test/article.html',
    categories: {
      performance: { score: 0.85, auditRefs: [{ id: 'total-blocking-time' }, { id: 'mainthread-work-breakdown' }, { id: 'unused-css-rules' }] },
      accessibility: { score: 1 },
      'best-practices': { score: 1 },
      seo: { score: 1 },
    },
    audits: {
      'first-contentful-paint': { displayValue: '1.6 s' },
      'largest-contentful-paint': { displayValue: '1.9 s' },
      'total-blocking-time': { title: 'Total Blocking Time', score: 0.54, scoreDisplayMode: 'numeric', displayValue: '550 ms' },
      'mainthread-work-breakdown': { title: 'Minimize main-thread work', score: 0, scoreDisplayMode: 'metricSavings', displayValue: '2.2 s', details: { type: 'table', items: [{ groupLabel: 'Style & Layout', duration: 667 }, { groupLabel: 'Other', duration: 916 }] } },
      'unused-css-rules': { title: 'Reduce unused CSS', score: 0.5, scoreDisplayMode: 'metricSavings', displayValue: 'Est savings of 17 KiB', details: { type: 'opportunity', overallSavingsBytes: 17062, items: [{ url: 'https://example.test/assets/site-bundle.css', wastedBytes: 17062 }] } },
      'long-tasks': { title: 'Avoid long main-thread tasks', score: 1, scoreDisplayMode: 'informative', displayValue: '2 long tasks found', details: { type: 'table', items: [{ url: 'https://example.test/article.html', duration: 372 }] } },
    },
  };
}

test('preserves quality thresholds and identifies the failing category', () => {
  const result = summarizeReport(fixture());
  assert.equal(result.scores.performance, 85);
  assert.deepEqual(result.failedCategories, [{ category: 'performance', score: 85, threshold: 90 }]);
});

test('surfaces actionable low-scoring performance audits and savings', () => {
  const result = summarizeReport(fixture());
  assert.ok(result.failedAudits.some(a => a.id === 'total-blocking-time' && a.score === 54));
  assert.ok(result.failedAudits.some(a => a.id === 'unused-css-rules' && a.savingsBytes === 17062));
});

test('prints metric and main-thread diagnostics including long tasks', () => {
  const output = formatSummary(summarizeReport(fixture()));
  assert.match(output, /TBT: 550 ms/);
  assert.match(output, /Style & Layout: 667 ms/);
  assert.match(output, /Avoid long main-thread tasks/);
  assert.match(output, /article\.html — 372 ms/);
  assert.match(output, /performance: 85 < 90/);
});

test('passes when every category meets the existing thresholds', () => {
  const report = fixture();
  report.categories.performance.score = 0.95;
  const result = summarizeReport(report);
  assert.deepEqual(result.failedCategories, []);
  assert.match(formatSummary(result), /Lighthouse quality gate passed/);
});
