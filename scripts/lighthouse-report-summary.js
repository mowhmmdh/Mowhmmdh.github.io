'use strict';

const fs = require('node:fs');

const THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 95,
};

const METRICS = [
  ['first-contentful-paint', 'FCP'],
  ['largest-contentful-paint', 'LCP'],
  ['total-blocking-time', 'TBT'],
  ['cumulative-layout-shift', 'CLS'],
  ['speed-index', 'Speed Index'],
];

const DIAGNOSTICS = [
  'mainthread-work-breakdown',
  'long-tasks',
  'unused-css-rules',
  'render-blocking-insight',
  'cache-insight',
];

function scorePercent(score) {
  return typeof score === 'number' ? Math.round(score * 100) : null;
}

function summarizeReport(report) {
  const categories = report.categories || {};
  const audits = report.audits || {};
  const scores = {};
  for (const key of Object.keys(THRESHOLDS)) {
    scores[key] = scorePercent(categories[key]?.score);
  }

  const failedCategories = Object.entries(THRESHOLDS)
    .filter(([key, threshold]) => scores[key] === null || scores[key] < threshold)
    .map(([key, threshold]) => ({ category: key, score: scores[key], threshold }));

  const performanceRefs = categories.performance?.auditRefs || [];
  const failedAudits = performanceRefs
    .map(ref => ({ id: ref.id, ...(audits[ref.id] || {}) }))
    .filter(audit => typeof audit.score === 'number'
      && audit.score < 1
      && !['informative', 'manual', 'notApplicable', 'error'].includes(audit.scoreDisplayMode))
    .sort((a, b) => a.score - b.score)
    .slice(0, 8)
    .map(audit => ({
      id: audit.id,
      title: audit.title || audit.id,
      score: scorePercent(audit.score),
      displayValue: audit.displayValue || '',
      savingsMs: audit.details?.overallSavingsMs ?? null,
      savingsBytes: audit.details?.overallSavingsBytes ?? null,
    }));

  const metrics = {};
  for (const [id, label] of METRICS) {
    const audit = audits[id];
    if (audit) metrics[label] = audit.displayValue || 'n/a';
  }

  const diagnostics = DIAGNOSTICS
    .map(id => {
      const audit = audits[id];
      if (!audit) return null;
      const items = (audit.details?.items || []).slice(0, 5).map(item => {
        if (item.groupLabel) {
          return item.groupLabel + ': ' + Math.round(item.duration || 0) + ' ms';
        }
        const parts = [];
        if (item.url) parts.push(item.url);
        if (typeof item.duration === 'number') parts.push(Math.round(item.duration) + ' ms');
        if (typeof item.wastedMs === 'number' && item.wastedMs > 0) parts.push('potential saving ' + Math.round(item.wastedMs) + ' ms');
        if (typeof item.wastedBytes === 'number' && item.wastedBytes > 0) parts.push('potential saving ' + Math.round(item.wastedBytes / 1024) + ' KiB');
        if (item.label) parts.push(String(item.label).slice(0, 120));
        if (item.type) parts.push(String(item.type));
        return parts.join(' — ') || 'detail available';
      });
      return { id, title: audit.title || id, displayValue: audit.displayValue || '', items };
    })
    .filter(Boolean);

  return {
    url: report.finalDisplayedUrl || report.requestedUrl || 'unknown URL',
    scores,
    thresholds: THRESHOLDS,
    failedCategories,
    metrics,
    failedAudits,
    diagnostics,
  };
}

function formatSummary(summary) {
  const lines = [
    'Lighthouse report: ' + summary.url,
    'Category scores:',
    ...Object.entries(summary.scores).map(([key, score]) => '  ' + key + ': ' + (score === null ? 'missing' : score) + ' (minimum ' + summary.thresholds[key] + ')'),
    'Key metrics:',
    ...Object.entries(summary.metrics).map(([key, value]) => '  ' + key + ': ' + value),
    'Lowest-scoring actionable performance audits:',
  ];

  if (!summary.failedAudits.length) lines.push('  None below 100% among scored performance audits.');
  for (const audit of summary.failedAudits) {
    const savings = [];
    if (audit.savingsMs > 0) savings.push('potential savings ' + Math.round(audit.savingsMs) + ' ms');
    if (audit.savingsBytes > 0) savings.push('potential savings ' + Math.round(audit.savingsBytes / 1024) + ' KiB');
    lines.push('  ' + audit.id + ' (' + audit.score + '): ' + audit.title
      + (audit.displayValue ? ' — ' + audit.displayValue : '')
      + (savings.length ? ' [' + savings.join(', ') + ']' : ''));
  }

  lines.push('Diagnostic details (up to five items each):');
  for (const diagnostic of summary.diagnostics) {
    lines.push('  ' + diagnostic.title + (diagnostic.displayValue ? ' — ' + diagnostic.displayValue : ''));
    for (const item of diagnostic.items) lines.push('    - ' + item);
  }
  if (summary.failedCategories.length) {
    lines.push('Lighthouse quality gate failed:');
    for (const item of summary.failedCategories) {
      lines.push('  ' + item.category + ': ' + (item.score === null ? 'missing score' : item.score) + ' < ' + item.threshold);
    }
  } else {
    lines.push('Lighthouse quality gate passed.');
  }
  return lines.join('\n');
}

if (require.main === module) {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.error('Usage: node scripts/lighthouse-report-summary.js <report.json>');
    process.exit(2);
  }
  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch (error) {
    console.error('Unable to read Lighthouse JSON report: ' + error.message);
    process.exit(2);
  }
  const summary = summarizeReport(report);
  console.log(formatSummary(summary));
  if (summary.failedCategories.length) process.exitCode = 1;
}

module.exports = { summarizeReport, formatSummary };
