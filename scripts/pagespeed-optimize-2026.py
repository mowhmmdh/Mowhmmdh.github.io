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
    '/assets/site-quality-2026.css',
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
        if href in EXCLUDED_CSS:
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
cache: dict[tuple[str, ...], str] = {}
changed = []

for page in pages:
    text = page.read_text(encoding='utf-8', errors='replace')
    tags = CSS_RE.findall(text)
    is_vintech = page.name in {'vintech.html', 'en-vintech.html'} or 'vintech' in page.parts

    # Keep one canonical base stylesheet. Everything else is folded into one
    # page bundle, including bundles produced by earlier optimization passes.
    secondary = []
    seen = set()
    text2 = text
    for tag in tags:
        href = local_css_href(tag)
        if not href:
            continue
        if href in seen:
            text2 = text2.replace(tag, '', 1)
            continue
        seen.add(href)
        if href == '/assets/site-bundle.css' or href in EXCLUDED_CSS:
            continue
        if is_vintech and href == '/assets/vintech.css':
            continue
        secondary.append(href)

    unique_secondary = tuple(dict.fromkeys(secondary))
    if unique_secondary:
        if unique_secondary not in cache:
            filename = bundle_name(list(unique_secondary))
            (BUNDLES / filename).write_text(bundle_css(list(unique_secondary)), encoding='utf-8')
            cache[unique_secondary] = f'/assets/page-bundles-2026/{filename}'
        bundle_href = cache[unique_secondary]

        # Replace the first secondary stylesheet with one non-blocking bundle.
        inserted = False
        for tag in CSS_RE.findall(text2):
            href = local_css_href(tag)
            if href in unique_secondary:
                if not inserted:
                    replacement = (
                        f'<link rel="preload" as="style" href="{bundle_href}" '
                        f'onload="this.onload=null;this.rel=\'stylesheet\'">'
                        f'\n<noscript><link rel="stylesheet" href="{bundle_href}"></noscript>'
                    )
                    text2 = text2.replace(tag, replacement, 1)
                    inserted = True
                else:
                    text2 = text2.replace(tag, '', 1)

    # VinTech CSS is retained for repository rules but loaded without blocking first paint.
    if is_vintech and '/assets/vintech.css' not in text2 and '</head>' in text2:
        text2 = text2.replace('</head>', '<link rel="stylesheet" href="/assets/vintech.css">\n</head>', 1)

    if is_vintech and 'rel="preload" as="style"' not in text2:
        for tag in list(CSS_RE.findall(text2)):
            href = local_css_href(tag)
            if href == '/assets/vintech.css' and 'preload' not in tag.lower():
                text2 = text2.replace(tag, make_async_stylesheet(tag), 1)
                break

    # Images: first content image is eager; all later images are lazy.
    # Normalize attributes idempotently so repeated runs never duplicate loading/decoding attributes.
    image_tags = list(IMG_RE.finditer(text2))
    for idx, match in reversed(list(enumerate(image_tags))):
        old = match.group(0)
        new = re.sub(r'\sloading=["\'][^"\']*["\']', '', old, flags=re.I)
        new = re.sub(r'\sfetchpriority=["\'][^"\']*["\']', '', new, flags=re.I)
        new = re.sub(r'\sdecoding=["\'][^"\']*["\']', '', new, flags=re.I)
        if idx == 0:
            new = new[:-1] + ' loading="eager" fetchpriority="high" decoding="async">'
        else:
            new = new[:-1] + ' loading="lazy" decoding="async">'
        if new != old:
            text2 = text2[:match.start()] + new + text2[match.end():]

    # Defer local scripts unless the page already controls their scheduling.
    def defer_script(m: re.Match[str]) -> str:
        tag = m.group(0)
        low = tag.lower()
        if 'defer' in low or 'async' in low or 'type="module"' in low or "type='module'" in low:
            return tag
        return tag[:-1] + ' defer>'

    text2 = SCRIPT_RE.sub(defer_script, text2)

    if text2 != text:
        page.write_text(text2, encoding='utf-8')
        changed.append(page.as_posix())

# Generate a complete image sitemap from crawlable image references.
from xml.sax.saxutils import escape as xml_escape
grouped = {}
for page in pages:
    s = page.read_text(encoding='utf-8', errors='replace')
    page_url = 'https://mowhmmdh.github.io/' if page.name == 'index.html' else 'https://mowhmmdh.github.io/' + page.relative_to(ROOT).as_posix().replace('/index.html','/')
    for tag in IMG_RE.findall(s):
        srcm = re.search(r'\bsrc=["\']([^"\']+)["\']', tag, re.I)
        if not srcm: continue
        src = srcm.group(1).strip()
        if src.startswith('data:'): continue
        if src.startswith('/'): src = 'https://mowhmmdh.github.io' + src
        elif not src.startswith(('http://','https://')): continue
        if not re.search(r'\.(?:avif|webp|jpg|jpeg|png|gif|svg)(?:[?#].*)?$', src, re.I): continue
        altm = re.search(r'\balt=["\']([^"\']*)["\']', tag, re.I)
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

print(f'Pages checked: {len(pages)}')
print(f'Pages changed: {len(changed)}')
print(f'Unique secondary CSS bundles: {len(cache)}')
