from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path('.')
BASE = 'https://mowhmmdh.github.io'
HTMLS = sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts)
CSS_LINK = re.compile(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*>', re.I)
IMG_RE = re.compile(r'<img\b([^>]*?)>', re.I)
SCRIPT_RE = re.compile(r'<script\b([^>]*)>', re.I)


def html_url(path: Path):
    rel = path.as_posix()
    if rel == 'index.html': return BASE + '/'
    if rel.endswith('/index.html'): return BASE + '/' + rel[:-10]
    return BASE + '/' + rel


def lang_for(path: Path):
    rel = path.as_posix()
    return 'en' if path.name.startswith('en-') or rel.startswith(('en-blog/', 'en-vintech/')) or path.name == 'en.html' else 'fa'


def equivalent(path: Path):
    rel = path.as_posix()
    pairs = {
        'index.html':'en.html','en.html':'index.html',
        'about.html':'en-about.html','en-about.html':'about.html',
        'authority.html':'en-authority.html','en-authority.html':'authority.html',
        'projects.html':'en-projects.html','en-projects.html':'projects.html',
        'services.html':'en-services.html','en-services.html':'services.html',
        'press.html':'en-press.html','en-press.html':'press.html',
        'linkedin.html':'en-linkedin.html','en-linkedin.html':'linkedin.html',
        'blog/index.html':'en-blog.html','en-blog.html':'blog/index.html',
        'vintech.html':'en-vintech.html','en-vintech.html':'vintech.html',
    }
    if rel in pairs: return html_url(Path(pairs[rel]))
    if rel.startswith('blog/'):
        return BASE + '/en-blog/' + rel[len('blog/'):]
    if rel.startswith('en-blog/'):
        return BASE + '/blog/' + rel[len('en-blog/'):]
    if rel.startswith('vintech/'):
        return BASE + '/en-vintech/' + rel[len('vintech/'):]
    if rel.startswith('en-vintech/'):
        return BASE + '/vintech/' + rel[len('en-vintech/'):]
    return None


def rewrite_css_urls(css, source):
    def repl(m):
        raw = m.group(1).strip().strip('"\'')
        if not raw or raw.startswith(('data:', 'http:', 'https:', '//', '#', '/')):
            return m.group(0)
        target = (source.parent / raw).resolve()
        try:
            rel = target.relative_to(ROOT.resolve()).as_posix()
            return 'url("/' + quote(rel, safe='/:._-()[]') + '")'
        except ValueError:
            return m.group(0)
    return re.sub(r'url\(\s*([^)]*?)\s*\)', repl, css, flags=re.I)


# Keep VinTech's intentionally isolated visual layer separate; consolidate everything else.
css_paths = sorted(p for p in ROOT.rglob('*.css') if '.git' not in p.parts and p.as_posix() not in {'assets/site-bundle.css','assets/vintech.css'})
parts = ['/* Production bundle: deterministic core design system. */']
for css in css_paths:
    content = rewrite_css_urls(css.read_text(encoding='utf-8'), css)
    parts.append(f'/* --- {css.as_posix()} --- */\n{content}')
(ROOT / 'assets/site-bundle.css').write_text('\n\n'.join(parts) + '\n', encoding='utf-8')


def replace_meta(text, name, value):
    pattern = re.compile(r'<meta\s+name=["\']' + re.escape(name) + r'["\'][^>]*>', re.I)
    tag = f'<meta name="{name}" content="{value}">'
    if pattern.search(text): return pattern.sub(tag, text, count=1)
    return text.replace('</head>', tag + '</head>', 1)


def replace_property(text, prop, value):
    pattern = re.compile(r'<meta\s+property=["\']' + re.escape(prop) + r'["\'][^>]*>', re.I)
    tag = f'<meta property="{prop}" content="{value}">'
    if pattern.search(text): return pattern.sub(tag, text, count=1)
    return text.replace('</head>', tag + '</head>', 1)


def ensure_head(text, path):
    lang = lang_for(path); direction = 'ltr' if lang == 'en' else 'rtl'
    text = re.sub(r'<html\b([^>]*)>', lambda m: '<html' + re.sub(r'\s(?:lang|dir)=["\'][^"\']*["\']', '', m.group(1), flags=re.I) + f' lang="{lang}" dir="{direction}">', text, count=1, flags=re.I)
    text = re.sub(r'<link\s+rel=["\']canonical["\'][^>]*>', '', text, flags=re.I)
    text = re.sub(r'<link\s+rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>', '', text, flags=re.I)
    # Remove every core stylesheet and restore exactly one deterministic bundle.
    had_vintech = bool(re.search(r'href=["\'][^"\']*vintech\.css(?:\?[^"\']*)?["\']', text, re.I)) or path.as_posix().startswith(('vintech/','en-vintech/')) or path.name in {'vintech.html','en-vintech.html'}
    text = CSS_LINK.sub('', text)
    bundle = '<link rel="stylesheet" href="/assets/site-bundle.css">'
    if had_vintech: bundle += '\n<link rel="stylesheet" href="/assets/vintech.css">'
    text = text.replace('</head>', bundle + '</head>', 1)
    text = text.replace('href="favicon.png"', 'href="/images/vinicon.webp"').replace('/favicon.png', '/images/vinicon.webp')
    if not re.search(r'<meta\s+name=["\']viewport["\']', text, re.I):
        text = text.replace('<head>', '<head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">', 1)
    else:
        text = re.sub(r'<meta\s+name=["\']viewport["\'][^>]*>', '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">', text, count=1, flags=re.I)
    text = replace_meta(text, 'theme-color', '#0b1220')
    text = replace_meta(text, 'referrer', 'strict-origin-when-cross-origin')
    text = replace_meta(text, 'robots', 'noindex,follow' if path.name == '404.html' else 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
    if path.name != '404.html':
        text = text.replace('</head>', f'<link rel="canonical" href="{html_url(path)}"></head>', 1)
        this = html_url(path); alt = equivalent(path)
        links = [f'<link rel="alternate" hreflang="{("fa-IR" if lang == "fa" else "en")}" href="{this}">']
        if alt: links.append(f'<link rel="alternate" hreflang="{("en" if lang == "fa" else "fa-IR")}" href="{alt}">')
        if path.name in {'index.html','en.html'}: links.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}/">')
        text = text.replace('</head>', ''.join(links) + '</head>', 1)
    else:
        text = re.sub(r'<link\s+rel=["\']canonical["\'][^>]*>', '', text, flags=re.I)
    # Normalize the public entity name in metadata/schema without destroying the historical alternate name.
    text = re.sub(r'content=["\']Mohammad Hossein Asgari Somarin["\']', 'content="Mohammad Hossein Asgari"', text)
    text = re.sub(r'content=["\']محمدحسین عسگری ثمرین["\']', 'content="محمدحسین عسگری"', text)
    text = re.sub(r'(?<![\w])Mohammad Hossein Asgari Somarin(?![\w])', 'Mohammad Hossein Asgari', text)
    # Image performance/accessibility defaults.
    def img(m):
        attrs = m.group(1)
        if 'alt=' not in attrs.lower(): attrs += ' alt=""'
        if 'decoding=' not in attrs.lower(): attrs += ' decoding="async"'
        if 'loading=' not in attrs.lower() and 'fetchpriority=' not in attrs.lower(): attrs += ' loading="lazy"'
        return '<img' + attrs + '>'
    text = IMG_RE.sub(img, text)
    # External new-tab links must not leak opener references.
    def script(m):
        attrs = m.group(1)
        if 'src=' in attrs.lower() and 'defer' not in attrs.lower() and 'type="application/ld+json"' not in attrs.lower():
            attrs += ' defer'
        return '<script' + attrs + '>'
    text = SCRIPT_RE.sub(script, text)
    # Add a keyboard-accessible skip link once.
    if 'class="skip-link"' not in text and '<body' in text:
        text = text.replace('<body>', '<body><a class="skip-link" href="#main-content">پرش به محتوای اصلی</a>', 1)
    text = re.sub(r'<main(?![^>]*id=["\']main-content["\'])', '<main id="main-content"', text, count=1, flags=re.I)
    return text


changed = 0
for p in HTMLS:
    old = p.read_text(encoding='utf-8')
    new = ensure_head(old, p)
    if new != old:
        p.write_text(new, encoding='utf-8'); changed += 1

print(f'Bundled {len(css_paths)} core stylesheets; VinTech CSS remains isolated.')
print(f'Normalized {changed} HTML pages.')
