#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const THRESHOLDS = Object.freeze({
  performance: 90,
  accessibility: 95,
  'best-practices': 95
});

const REPORTED_CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

function summarizeReport(report, formFactor) {
  const categories = report && typeof report === 'object' ? report.categories : null;
  const scores = {};

  for (const category of REPORTED_CATEGORIES) {
    const rawScore = categories && categories[category] ? categories[category].score : null;
    scores[category] = Number.isFinite(rawScore) ? Math.round(rawScore * 100) : null;
  }

  return { formFactor, scores };
}

function evaluateReports(reports) {
  const summaries = reports.map(({ formFactor, report }) => summarizeReport(report, formFactor));
  const failures = [];

  for (const summary of summaries) {
    for (const [category, minimum] of Object.entries(THRESHOLDS)) {
      const score = summary.scores[category];
      if (!Number.isFinite(score) || score < minimum) {
        failures.push({ formFactor: summary.formFactor, category, score, minimum });
      }
    }
  }

  return {
    passed: failures.length === 0,
    thresholds: THRESHOLDS,
    summaries,
    failures
  };
}

function main(files) {
  if (files.length !== 2) {
    console.error('Usage: node scripts/check-lighthouse-quality.cjs <mobile-report.json> <desktop-report.json>');
    process.exitCode = 2;
    return;
  }

  const reports = files.map((file, index) => ({
    formFactor: index === 0 ? 'mobile' : 'desktop',
    report: JSON.parse(fs.readFileSync(file, 'utf8'))
  }));
  const result = evaluateReports(reports);

  console.log(JSON.stringify({
    ...result,
    seoNote: 'SEO is reported but not gated on Netlify deploy previews because their x-robots-tag: noindex header is expected.'
  }, null, 2));

  if (!result.passed) {
    console.error('Lighthouse quality thresholds failed.');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { THRESHOLDS, summarizeReport, evaluateReports };
