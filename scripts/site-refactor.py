from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path('.')
BASE = 'https://mowhmmdh.github.io'
HTMLS = sorted([p for p in ROOT.rglob('*.html') if '.git' not in p.parts])
CSS_RE = re.compile(r'<link\s+[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>', re.I)
CSS_RE2 = re.compile(r'<link\s+[^>]*href=["\']([^"\']+\.css(?:\?[^"\']*)?)["\'][^>]*rel=["\']stylesheet["\'][^>]*>', re.I)
IMG_RE = re.compile(r'<img\b([^>]*?)>', re.I)


def html_url(path: Path) -> str:
    rel = path.as_posix()
    if rel == 'index.html':
        return BASE + '/'
    if rel.endswith('/index.html'):
        return BASE + '/' + rel[:-10]
    return BASE + '/' + rel


def lang_for(path: Path) -> str:
    rel = path.as_posix()
    return 'en' if path.name.startswith('en-') or '/en-blog/' in rel or '/en-vintech/' in rel or path.name == 'en.html' else 'fa'


def english_equivalent(path: Path) -> str | None:
    rel = path.as_posix()
    if rel == 'index.html':
        return BASE + '/en.html'
    if rel == 'en.html':
        return BASE + '/'
    if rel.startswith('en-blog/'):
        return BASE + '/blog/' + rel[len('en-blog/'):]
    if rel.startswith('blog/'):
        return BASE + '/en-blog/' + rel[len('blog/'):]
    if rel.startswith('en-vintech/'):
        return BASE + '/vintech/' + rel[len('en-vintech/'):]
    if rel.startswith('vintech/'):
        return BASE + '/en-vintech/' + rel[len('vintech/'):]
    if rel.startswith('en-'):
        candidate = rel[3:]
        return BASE + '/' + candidate
    if rel in {'about.html','authority.html','projects.html','services.html','press.html','linkedin.html'}:
        return BASE + '/en-' + rel
    if rel in {'en-about.html','en-authority.html','en-projects.html','en-services.html','en-press.html','en-linkedin.html'}:
        return BASE + '/' + rel[3:]
    return None


def rewrite_css_urls(css: str, source: Path) -> str:
    def repl(m):
        raw = m.group(1).strip().strip('"\'')
        if not raw or raw.startswith(('data:', 'http://', 'https://', '//', '#', '/')):
            return m.group(0)
        target = (source.parent / raw).resolve()
        try:
            rel = target.relative_to(ROOT.resolve()).as_posix()
            return 'url("/' + quote(rel, safe='/:._-()[]') + '")'
        except ValueError:
            return m.group(0)
    return re.sub(r'url\(\s*([^)]*?)\s*\)', repl, css, flags=re.I)


css_paths = []
seen = set()
for p in HTMLS:
    text = p.read_text(encoding='utf-8')
    refs = CSS_RE.findall(text) + CSS_RE2.findall(text)
    for ref in refs:
        if ref.startswith(('http://', 'https://', '//')):
            continue
        candidate = ROOT / ref.split('?', 1)[0].lstrip('/')
        if candidate.exists() and candidate.suffix.lower() == '.css':
            key = candidate.as_posix()
            if key not in seen and key != 'assets/site-bundle.css':
                seen.add(key)
                css_paths.append(candidate)

# If the previous normalization already replaced source links, recover the intended source order
# from the existing generated bundle so a future run never produces an empty stylesheet.
if not css_paths and (ROOT / 'assets/site-bundle.css').exists():
    existing = (ROOT / 'assets/site-bundle.css').read_text(encoding='utf-8')
    matches = re.findall(r'/\* --- ([^*]+) --- \*/', existing)
    for name in matches:
        p = ROOT / name.strip()
        if p.exists() and p.suffix.lower() == '.css' and p.as_posix() != 'assets/site-bundle.css':
            css_paths.append(p)

bundle_parts = ['/* Generated site bundle. Source order is deterministic. */']
for css in css_paths:
    content = rewrite_css_urls(css.read_text(encoding='utf-8'), css)
    content = content.replace('font-display:swap', 'font-display:optional')
    bundle_parts.append(f'/* --- {css.as_posix()} --- */\n{content}')
(ROOT / 'assets/site-bundle.css').write_text('\n\n'.join(bundle_parts) + '\n', encoding='utf-8')


def replace_or_add(text: str, pattern: str, replacement: str, *, flags=re.I) -> str:
    if re.search(pattern, text, flags):
        return re.sub(pattern, replacement, text, count=1, flags=flags)
    return text


def ensure_head(text: str, path: Path) -> str:
    lang = lang_for(path)
    direction = 'ltr' if lang == 'en' else 'rtl'
    text = re.sub(r'<html\b([^>]*)>', lambda m: '<html' + re.sub(r'\s(?:lang|dir)=["\'][^"\']*["\']', '', m.group(1), flags=re.I) + f' lang="{lang}" dir="{direction}">', text, count=1, flags=re.I)
    if not re.search(r'<meta\s+name=["\']viewport["\']', text, re.I):
        text = text.replace('<head>', '<head><meta name="viewport" content="width=device-width,initial-scale=1">', 1)
    text = CSS_RE.sub('', text)
    text = CSS_RE2.sub('', text)
    bundle = '<link rel="stylesheet" href="/assets/site-bundle.css">'
    if bundle not in text:
        text = text.replace('</head>', bundle + '</head>', 1)
    text = text.replace('/favicon.png', '/images/vinicon.webp').replace('href="favicon.png"', 'href="/images/vinicon.webp"')

    def img_repl(m):
        attrs = m.group(1)
        if 'decoding=' not in attrs:
            attrs += ' decoding="async"'
        if 'loading=' not in attrs and 'fetchpriority="high"' not in attrs:
            attrs += ' loading="lazy"'
        return '<img' + attrs + '>'
    text = IMG_RE.sub(img_repl, text)

    canonical = html_url(path)
    text = re.sub(r'<link\s+rel=["\']canonical["\'][^>]*>', '' if path.name == '404.html' else f'<link rel="canonical" href="{canonical}">', text, count=1, flags=re.I)
    if path.name != '404.html' and not re.search(r'<link\s+rel=["\']canonical["\']', text, re.I):
        text = text.replace('</head>', f'<link rel="canonical" href="{canonical}"></head>', 1)

    if path.name == '404.html':
        if not re.search(r'<meta\s+name=["\']robots["\']', text, re.I):
            text = text.replace('</head>', '<meta name="robots" content="noindex,follow"></head>', 1)
    elif not re.search(r'<meta\s+name=["\']robots["\']', text, re.I):
        text = text.replace('</head>', '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"></head>', 1)

    alt = english_equivalent(path)
    # Remove stale hreflang entries generated by earlier passes, then write a consistent pair.
    text = re.sub(r'\s*<link\s+rel=["\']alternate["\']\s+hreflang=["\'][^"\']+["\'][^>]*>', '', text, flags=re.I)
    if path.name != '404.html':
        this = html_url(path)
        hreflang = [f'<link rel="alternate" hreflang="{lang}-IR" href="{this}">'] if lang == 'fa' else [f'<link rel="alternate" hreflang="en" href="{this}">']
        if alt:
            hreflang.append(f'<link rel="alternate" hreflang="en" href="{alt}">' if lang == 'fa' else f'<link rel="alternate" hreflang="fa-IR" href="{alt}">')
        if path.name in {'index.html','en.html'}:
            hreflang.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}/">')
        text = text.replace('</head>', '\n'.join(hreflang) + '</head>', 1)
    return text


changed = []
for p in HTMLS:
    old = p.read_text(encoding='utf-8')
    new = ensure_head(old, p)
    if new != old:
        p.write_text(new, encoding='utf-8')
        changed.append(p.as_posix())

print(f'Bundled {len(css_paths)} source stylesheets into assets/site-bundle.css')
print(f'Normalized {len(changed)} HTML pages')
for p in changed:
    print(p)
