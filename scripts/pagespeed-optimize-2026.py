from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse
import hashlib
import html
import re

ROOT = Path('.')
ASSETS = ROOT / 'assets'
BUNDLES = ASSETS / 'page-bundles-2026'
BUNDLES.mkdir(parents=True, exist_ok=True)

CSS_RE = re.compile(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*>', re.I)
HREF_RE = re.compile(r'\bhref=["\']([^"\']+)["\']', re.I)
IMG_RE = re.compile(r'<img\b[^>]*>', re.I)
SCRIPT_RE = re.compile(r'<script\b[^>]*src=["\']([^"\']+)["\'][^>]*>', re.I)

EXCLUDED_CSS = {
    # Binary/compatibility or retired layers are not page dependencies.
    '/assets/elite-web-system-2026.css',
    '/assets/editorial-experience-2026.css',
    '/assets/premium-experience-2026.css',
    '/assets/site-quality-2026.css',
    '/assets/theme-contrast-2026.css',
}
VINTECH_MARKERS = ('vintech.css', 'vintech-experience-2026.css', 'vintech-visual-final-2026.css', 'vintech-motion-fix-2026')


def local_css_href(tag: str) -> str | None:
    m = HREF_RE.search(tag)
    if not m:
        return None
    href = m.group(1)
    if href.startswith('/') and href.startswith('/assets/') and href.lower().endswith('.css'):
        return href
    return None


def bundle_css(hrefs: list[str]) -> str:
    chunks = []
    for href in hrefs:
        if href in EXCLUDED_CSS:
            continue
        path = ROOT / href.lstrip('/')
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8', errors='replace')
        chunks.append(f'/* SOURCE: {href} */\n{text}\n')
    raw = '\n'.join(chunks)
    # Safe minification: comments, whitespace and line breaks only; preserve strings.
    raw = re.sub(r'/\*(?! SOURCE:).*?\*/', '', raw, flags=re.S)
    raw = re.sub(r'\s+', ' ', raw)
    raw = re.sub(r'\s*([{}:;,>+])\s*', r'\1', raw)
    raw = re.sub(r';}', '}', raw)
    return raw.strip() + '\n'


def bundle_name(hrefs: list[str]) -> str:
    key = '\n'.join(hrefs).encode('utf-8')
    return 'bundle-' + hashlib.sha256(key).hexdigest()[:14] + '.css'


pages = sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts and '.github' not in p.parts and p.name != '404.html')
cache: dict[tuple[str, ...], str] = {}
changed = []

for page in pages:
    text = page.read_text(encoding='utf-8', errors='replace')
    tags = CSS_RE.findall(text)
    hrefs = []
    for tag in tags:
        href = local_css_href(tag)
        if href and href not in EXCLUDED_CSS and href not in hrefs:
            hrefs.append(href)
    if not hrefs:
        continue

    # Keep VinTech-specific and general styles together only when the page already
    # depends on them; this preserves cascade order while collapsing requests.
    key = tuple(hrefs)
    if key not in cache:
        filename = bundle_name(hrefs)
        out = BUNDLES / filename
        out.write_text(bundle_css(hrefs), encoding='utf-8')
        cache[key] = f'/assets/page-bundles-2026/{filename}'
    bundle_href = cache[key]

    first = tags[0]
    replacement = f'<link rel="stylesheet" href="{html.escape(bundle_href, quote=True)}" data-pagespeed-bundle="2026">'
    text2 = text.replace(first, replacement, 1)
    for tag in tags[1:]:
        text2 = text2.replace(tag, '', 1)

    # Images below the first content image should not compete with the hero/above-fold.
    image_tags = list(IMG_RE.finditer(text2))
    for idx, match in reversed(list(enumerate(image_tags))):
        old = match.group(0)
        new = old
        if idx > 0 and 'loading=' not in new.lower():
            new = new[:-1] + ' loading="lazy">'
        if 'decoding=' not in new.lower():
            new = new[:-1] + ' decoding="async">'
        if new != old:
            text2 = text2[:match.start()] + new + text2[match.end():]

    # Local scripts should not block HTML parsing when the markup has no explicit mode.
    def defer_script(m: re.Match[str]) -> str:
        tag = m.group(0)
        if 'defer' in tag.lower() or 'async' in tag.lower() or 'type="module"' in tag.lower() or 'type=\'module\'' in tag.lower():
            return tag
        return tag[:-1] + ' defer>'
    text2 = SCRIPT_RE.sub(defer_script, text2)

    if text2 != text:
        page.write_text(text2, encoding='utf-8')
        changed.append(page.as_posix())

print(f'Pages optimized: {len(changed)} / {len(pages)}')
print(f'Unique CSS bundles: {len(cache)}')
for k, v in sorted(cache.items(), key=lambda x: x[1]):
    print(v, '<-', len(k), 'stylesheets')
