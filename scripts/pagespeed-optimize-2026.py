from __future__ import annotations

from pathlib import Path
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
    '/assets/elite-web-system-2026.css',
    '/assets/editorial-experience-2026.css',
    '/assets/premium-experience-2026.css',
    '/assets/theme-contrast-2026.css',
}


def local_css_href(tag: str) -> str | None:
    m = HREF_RE.search(tag)
    if not m:
        return None
    href = m.group(1)
    if href.startswith('/assets/') and href.lower().endswith('.css'):
        return href
    return None


def is_link_for(href: str, needle: str) -> bool:
    return href == needle


def rewrite_relative_urls(css: str, source_href: str) -> str:
    base = Path(source_href.lstrip('/')).parent.as_posix()

    def repl(match: re.Match[str]) -> str:
        raw = match.group(1).strip()
        quote = ''
        value = raw
        if len(value) >= 2 and value[0] in "\"'" and value[-1] == value[0]:
            quote, value = value[0], value[-1]
            value = raw[1:-1]
        if not value or value.startswith(('/', '#', 'data:', 'http://', 'https://')):
            return match.group(0)
        clean = (Path('/') / base / value).as_posix()
        return f'url({quote}{clean}{quote})'

    return re.sub(r'url\(([^)]*)\)', repl, css, flags=re.I)


def bundle_css(hrefs: list[str]) -> str:
    chunks = []
    for href in hrefs:
        if href in EXCLUDED_CSS or href.startswith('/assets/page-bundles-2026/'):
            continue
        path = ROOT / href.lstrip('/')
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8', errors='replace')
        text = rewrite_relative_urls(text, href)
        chunks.append(f'/* SOURCE: {href} */\n{text}\n')
    raw = '\n'.join(chunks)
    raw = re.sub(r'/\*(?! SOURCE:).*?\*/', '', raw, flags=re.S)
    raw = re.sub(r'\s+', ' ', raw)
    raw = re.sub(r'\s*([{}:;,>+])\s*', r'\1', raw)
    raw = re.sub(r';}', '}', raw)
    return raw.strip() + '\n'


def bundle_name(hrefs: list[str]) -> str:
    key = '\n'.join(hrefs).encode('utf-8')
    return 'bundle-' + hashlib.sha256(key).hexdigest()[:14] + '.css'


def make_async_stylesheet(tag: str) -> str:
    href = HREF_RE.search(tag).group(1)
    return f'<link rel="preload" as="style" href="{html.escape(href, quote=True)}" onload="this.onload=null;this.rel=\'stylesheet\'">\n<noscript><link rel="stylesheet" href="{html.escape(href, quote=True)}"></noscript>'


pages = sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts and '.github' not in p.parts and p.name != '404.html')
changed = []

# The first generation of this optimizer accidentally bundled already-generated
# page bundles into new bundles on every run. That produced recursive CSS files
# hundreds of KB large. Published pages now use the stable shared stylesheet
# directly; old generated bundles are removed below.
STABLE_QUALITY_CSS = '/assets/site-final-quality-2026.css'
PAGE_BUNDLE_RE = re.compile(
    r'<link\\b[^>]*(?:rel=["\\']preload["\\'][^>]*as=["\\']style["\\'][^>]*|rel=["\\']stylesheet["\\'])'
    r'[^>]*href=["\\']/assets/page-bundles-2026/[^"\\']+["\\'][^>]*>\\s*',
    re.I
)
PAGE_BUNDLE_NOSCRIPT_RE = re.compile(
    r'<noscript>\\s*<link\\b[^>]*href=["\\']/assets/page-bundles-2026/[^"\\']+["\\'][^>]*>\\s*</noscript>',
    re.I
)

for page in pages:
    text = page.read_text(encoding='utf-8', errors='replace')
    original = text

    # Remove both the preload and stylesheet forms of obsolete generated bundles.
    text = PAGE_BUNDLE_RE.sub('', text)
    text = PAGE_BUNDLE_NOSCRIPT_RE.sub('', text)

    # Add the stable quality layer once, non-blocking, if the page had a generated bundle.
    if '/assets/site-final-quality-2026.css' not in text and original.find('/assets/page-bundles-2026/') >= 0:
        tag = (
            '<link rel="preload" as="style" href="/assets/site-final-quality-2026.css" '
            'onload="this.onload=null;this.rel=\\'stylesheet\\'">\\n'
            '<noscript><link rel="stylesheet" href="/assets/site-final-quality-2026.css"></noscript>\\n'
        )
        if '</head>' in text:
            text = text.replace('</head>', tag + '</head>', 1)

    # Remove empty generated noscript placeholders left by older passes.
    text = re.sub(r'<noscript>\\s*</noscript>', '', text, flags=re.I)

    # Keep image loading deterministic and avoid duplicate loading attributes.
    image_tags = list(IMG_RE.finditer(text))
    for idx, match in reversed(list(enumerate(image_tags))):
        old = match.group(0)
        new = re.sub(r'\\sloading=["\\'][^"\\']*["\\']', '', old, flags=re.I)
        new = re.sub(r'\\sfetchpriority=["\\'][^"\\']*["\\']', '', new, flags=re.I)
        new = re.sub(r'\\sdecoding=["\\'][^"\\']*["\\']', '', new, flags=re.I)
        if idx == 0:
            new = new[:-1] + ' loading="eager" fetchpriority="high" decoding="async">'
        else:
            new = new[:-1] + ' loading="lazy" decoding="async">'
        if new != old:
            text = text[:match.start()] + new + text[match.end():]

    # Defer local scripts unless the page already controls scheduling.
    def defer_script(m: re.Match[str]) -> str:
        tag = m.group(0)
        low = tag.lower()
        if 'defer' in low or 'async' in low or 'type="module"' in low or "type='module'" in low:
            return tag
        return tag[:-1] + ' defer>'

    text = SCRIPT_RE.sub(defer_script, text)

    if text != original:
        page.write_text(text, encoding='utf-8')
        changed.append(page.as_posix())

# Delete every obsolete generated page bundle. They are not part of the source
# design system and were the cause of recursive CSS growth.
if BUNDLES.exists():
    for old_bundle in BUNDLES.glob('*.css'):
        old_bundle.unlink()
    try:
        BUNDLES.rmdir()
    except OSError:
        pass

# Generate a complete image sitemap from crawlable image references.
from xml.sax.saxutils import escape as xml_escape
grouped = {}
for page in pages:
    s = page.read_text(encoding='utf-8', errors='replace')
    page_url = 'https://mowhmmdh.github.io/' if page.name == 'index.html' else 'https://mowhmmdh.github.io/' + page.relative_to(ROOT).as_posix().replace('/index.html','/')
    for tag in IMG_RE.findall(s):
        srcm = re.search(r'\\bsrc=["\\']([^"\\']+)["\\']', tag, re.I)
        if not srcm: continue
        src = srcm.group(1).strip()
        if src.startswith('data:'): continue
        if src.startswith('/'): src = 'https://mowhmmdh.github.io' + src
        elif not src.startswith(('http://','https://')): continue
        if not re.search(r'\\.(?:avif|webp|jpg|jpeg|png|gif|svg)(?:[?#].*)?$', src, re.I): continue
        altm = re.search(r'\\balt=["\\']([^"\\']*)["\\']', tag, re.I)
        title = altm.group(1).strip() if altm and altm.group(1).strip() else ''
        grouped.setdefault(page_url, [])
        if (src,title) not in grouped[page_url]: grouped[page_url].append((src,title))
parts=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
for page_url,imgs in sorted(grouped.items()):
    parts.append('<url><loc>'+xml_escape(page_url)+'</loc>')
    for src,title in imgs:
        parts.append('<image:image><image:loc>'+xml_escape(src)+'</image:loc>'+('<image:title>'+xml_escape(title)+'</image:title>' if title else '')+'</image:image>')
    parts.append('</url>')
parts.append('</urlset>')
(ROOT/'image-sitemap.xml').write_text(''.join(parts),encoding='utf-8')

# Final invariant: VinTech pages must retain exactly one direct VinTech stylesheet.
for page in pages:
    rel = page.as_posix()
    is_vintech = rel.startswith(('vintech/', 'en-vintech/')) or page.name in {'vintech.html', 'en-vintech.html'}
    if not is_vintech:
        continue
    text = page.read_text(encoding='utf-8', errors='replace')
    link_re = re.compile(r"\\s*<link\\b[^>]*href=[\\"']/assets/vintech\\.css[\\"'][^>]*>\\s*", re.I)
    links = list(link_re.finditer(text))
    if not links:
        if '</head>' in text.lower():
            text = re.sub(r'</head>', '<link rel="stylesheet" href="/assets/vintech.css">\\n</head>', text, count=1, flags=re.I)
    elif len(links) > 1:
        text = link_re.sub('', text)
        text = re.sub(r'</head>', '<link rel="stylesheet" href="/assets/vintech.css">\\n</head>', text, count=1, flags=re.I)
    page.write_text(text, encoding='utf-8')

print(f'Pages checked: {len(pages)}')
print(f'Pages changed: {len(changed)}')
print(f'Unique secondary CSS bundles: {len(cache)}')
