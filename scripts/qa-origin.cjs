'use strict';

const PREVIEW_HOST = /^deploy-preview-\\d+--mowhmmdh\\.netlify\\.app$/i;

function normalizePreviewOrigin(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('PREVIEW_URL must be a non-empty URL');
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError('PREVIEW_URL must be a valid URL');
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    !PREVIEW_HOST.test(parsed.hostname)
  ) {
    throw new TypeError('PREVIEW_URL must be an HTTPS deploy-preview host for mowhmmdh.netlify.app');
  }

  return parsed.origin;
}

function isFirstPartyRequest(candidate, expectedOrigin) {
  try {
    return new URL(candidate).origin === expectedOrigin;
  } catch {
    return false;
  }
}

module.exports = { normalizePreviewOrigin, isFirstPartyRequest };
