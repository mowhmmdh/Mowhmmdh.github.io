'use strict';

const PREVIEW_HOST = /^deploy-preview-([0-9]+)--mowhmmdh[.]netlify[.]app$/i;

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

  const previewMatch = PREVIEW_HOST.exec(parsed.hostname);
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    !previewMatch
  ) {
    throw new TypeError('PREVIEW_URL must be an HTTPS deploy-preview host for mowhmmdh.netlify.app');
  }

  // Rebuild the origin from the allow-listed numeric preview ID rather than
  // returning a host string derived directly from the environment variable.
  return 'https://deploy-preview-' + previewMatch[1] + '--mowhmmdh.netlify.app';
}

function isFirstPartyRequest(candidate, expectedOrigin) {
  try {
    return new URL(candidate).origin === expectedOrigin;
  } catch {
    return false;
  }
}

module.exports = { normalizePreviewOrigin, isFirstPartyRequest };
