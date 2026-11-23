'use strict';

const fs = require('node:fs');

const THRESHOLDS = Object.freeze({
  performance: 90,
  accessibility: 95,
  'best-practices': 95
});

function evaluateReport(report) {
  const categories = report && typeof report === 'object' ? report.categories || {} : {};
  const scores = {};
  const failures = [];

  for (const [category, minimum] of Object.entries(THRESHOLDS)) {
    const rawScore = categories[category] && categories[category].score;
    if (typeof rawScore !== 'number' || !Number.isFinite(rawScore) || rawScore < 0 || rawScore > 1) {
      scores[category] = null;
      failures.push({ category, reason: 'missing-or-invalid-score', minimum });
      continue;
    }

    scores[category] = Math.round(rawScore * 100);
    if (rawScore * 100 < minimum) {
      failures.push({
        category,
        score: scores[category],
        exactScore: rawScore * 100,
        minimum
      });
    }
  }

  const networkItems = report?.audits?.['network-requests']?.details?.items;
  const previewInstrumentationRequests = Array.isArray(networkItems)
    ? networkItems
        .map(item => item && typeof item.url === 'string' ? item.url : '')
        .filter(url => url.includes('/.netlify/scripts/cdp') || url.includes('app.netlify.com/cdp/'))
    : [];

  if (previewInstrumentationRequests.length) {
    failures.push({
      category: 'preview-instrumentation',
      reason: 'netlify-preview-toolbar-present',
      requests: previewInstrumentationRequests
    });
  }

  return {
    passed: failures.length === 0,
    scores,
    thresholds: { ...THRESHOLDS },
    previewInstrumentationRequests,
    failures
  };
}

function main() {
  const [reportPath, profile = 'unspecified'] = process.argv.slice(2);
  if (!reportPath) {
    console.error('Usage: node scripts/check-homepage-lighthouse.cjs <report.json> [mobile|desktop]');
    process.exitCode = 2;
    return;
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const result = evaluateReport(report);
    const audits = report.audits || {};
    console.log(JSON.stringify({
      profile,
      ...result,
      metrics: {
        fcp: audits['first-contentful-paint']?.displayValue || null,
        lcp: audits['largest-contentful-paint']?.displayValue || null,
        tbt: audits['total-blocking-time']?.displayValue || null,
        cls: audits['cumulative-layout-shift']?.displayValue || null
      },
      note: 'Preview SEO is reported but not gated because Netlify deploy previews intentionally send x-robots-tag: noindex.'
    }, null, 2));

    if (!result.passed) process.exitCode = 1;
  } catch (error) {
    console.error('Unable to validate Lighthouse report:', error.message);
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = { evaluateReport, THRESHOLDS };
