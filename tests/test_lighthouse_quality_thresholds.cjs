#!/usr/bin/env node
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { evaluateReports, THRESHOLDS } = require('../scripts/check-lighthouse-quality.cjs');

function report(performance, accessibility = 100, bestPractices = 96, seo = 66) {
  return {
    categories: {
      performance: { score: performance / 100 },
      accessibility: { score: accessibility / 100 },
      'best-practices': { score: bestPractices / 100 },
      seo: { score: seo / 100 }
    }
  };
}

test('passes when mobile and desktop meet the existing quality thresholds', () => {
  const result = evaluateReports([
    { formFactor: 'mobile', report: report(90, 95, 95, 66) },
    { formFactor: 'desktop', report: report(100, 100, 96, 66) }
  ]);

  assert.equal(result.passed, true);
  assert.deepEqual(result.failures, []);
  assert.equal(result.summaries[0].scores.seo, 66);
  assert.equal(THRESHOLDS.performance, 90);
});

test('fails when either viewport falls below a required threshold', () => {
  const result = evaluateReports([
    { formFactor: 'mobile', report: report(89, 100, 96, 66) },
    { formFactor: 'desktop', report: report(100, 100, 96, 66) }
  ]);

  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, [
    { formFactor: 'mobile', category: 'performance', score: 89, minimum: 90 }
  ]);
});

test('preview Lighthouse excludes only Netlify injected CDP helper from site metrics', () => {
  const workflowPath = path.join(__dirname, '../.github/workflows/network-security-assessment-browser-qa.yml');
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const blockPattern = "--blocked-url-patterns='*/.netlify/scripts/cdp*'";

  assert.equal(workflow.split(blockPattern).length - 1, 2);
  assert.equal(workflow.includes("--blocked-url-patterns='*netlify*'"), false);
});

test('fails closed when a required Lighthouse category is missing', () => {
  const incomplete = report(95);
  delete incomplete.categories.accessibility;

  const result = evaluateReports([
    { formFactor: 'mobile', report: incomplete },
    { formFactor: 'desktop', report: report(100) }
  ]);

  assert.equal(result.passed, false);
  assert.ok(result.failures.some(item =>
    item.formFactor === 'mobile' &&
    item.category === 'accessibility' &&
    item.score === null
  ));
});
