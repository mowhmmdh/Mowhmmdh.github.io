from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json
import posixpath
import re
import sys

ROOT = Path('.')
BASE = 'https://mowhmmdh.github.io'
PERSIAN_NAME = 'محمدحسین عسگری ثمرین'
ENGLISH_NAME = 'Mohammad Hossein Asgari Somarin'
LEGACY_PERSIAN = 'محمدحسین عسگری'
BAD_ENGLISH = re.compile(r'Mohammad\s+Hossein\s+Asgari\s+Somarini(?:\s+Somarin)*|Mohammad\s+Hossein\s+Asgari\s+Somarin(?:\s+Somarin)+', re.I)
LEGACY_CSS = {
    'portfolio-command-center-2026.css', 'visual-final-pass-2026.css',
    'last-mile-visual-2026.css', 'ultimate-ui-2026.css',
    'final-appearance-2026.css', 'content-theme-2026.css',
    'visual-master-2026.css', 'next-gen-2026.css', 'site-final-polish.css'
}

PAGES = sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts)
KNOWN = {p.as_posix() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts}
ERRORS = []
WARNINGS = []


class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = 0
        self.description = 0
        self.robots = 0
        self.viewport = 0
        self.author = 0
        self.h1 = 0
        self.main = 0
        self.canonical = []
        self.hreflang = []
        self.images = []
        self.links = []
        self.styles = []
        self.scripts = []
        self.buttons = []
        self.ids = set()
        self.duplicate_ids = []
        self.lang = None
        self.dir = None
        self.ldjson = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        tag = tag.lower()
        if tag == 'html':
            self.lang = a.get('lang')
            self.dir = a.get('dir')
        elif tag == 'title':
            self.title += 1
        elif tag == 'h1':
            self.h1 += 1
        elif tag == 'main':
            self.main += 1
        elif tag == 'img':
            self.images.append(a)
        elif tag == 'a':
            self.links.append((a.get('href', ''), a))
        elif tag == 'button':
            self.buttons.append(a)
        elif tag == 'script':
            src = a.get('src', '')
            typ = (a.get('type', '') or '').lower()
            self.scripts.append((src, typ))
            if typ == 'application/ld+json':
                self.ldjson.append(1)
        elif tag == 'link':
            rel = (a.get('rel') or '').lower().split()
            if 'canonical' in rel:
                self.canonical.append(a.get('href', ''))
            if 'alternate' in rel and a.get('hreflang'):
                self.hreflang.append((a.get('hreflang'), a.get('href', '')))
            if 'stylesheet' in rel:
                self.styles.append(a.get('href', ''))
        elif tag == 'meta':
            name = (a.get('name') or '').lower()
            if name == 'description':
                self.description += 1
            elif name == 'robots':
                self.robots += 1
            elif name == 'viewport':
                self.viewport += 1
            elif name == 'author':
                self.author += 1
        ident = a.get('id')
        if ident:
            if ident in self.ids:
                self.duplicate_ids.append(ident)
            self.ids.add(ident)


def resolve_local(page: Path, href: str):
    if not href or href.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:')):
        return None
    u = urlparse(href)
    if u.scheme in ('http', 'https'):
        if u.netloc != 'mowhmmdh.github.io':
            return None
        target = unquote(u.path.lstrip('/'))
    elif href.startswith('/'):
        target = unquote(u.path.lstrip('/'))
    else:
        return None
    if target in ('', '.'):
        target = 'index.html'
    candidates = [target]
    if target.endswith('/'):
        candidates.insert(0, target + 'index.html')
    elif target not in KNOWN:
        candidates.extend((target + '.html', target + '/index.html'))
    return next((c for c in candidates if c in KNOWN), None)


def is_vintech(page: Path) -> bool:
    rel = page.as_posix()
    return rel.startswith(('vintech/', 'en-vintech/')) or page.name in {'vintech.html', 'en-vintech.html'}


def is_indexable(page: Path, source: str) -> bool:
    return page.name != '404.html' and 'noindex' not in source.lower()


def check_jsonld(page: Path, parser: Audit):
    # Parse JSON-LD blocks directly so malformed schemas cannot silently pass.
    source = page.read_text(encoding='utf-8', errors='replace')
    for match in re.finditer(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', source, re.I | re.S):
        raw = match.group(1).strip()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            ERRORS.append(f'{page}: invalid JSON-LD: {exc.msg}')
            continue
        flattened = json.dumps(data, ensure_ascii=False)
        if BAD_ENGLISH.search(flattened):
            ERRORS.append(f'{page}: malformed English identity in JSON-LD')
        if '@type' in flattened and 'BreadcrumbList' in flattened and page.name != '404.html':
            pass


for page in PAGES:
    source = page.read_text(encoding='utf-8', errors='replace')
    parser = Audit()
    parser.feed(source)
    rel = page.as_posix()
    indexable = is_indexable(page, source)
    vt = is_vintech(page)

    if parser.title != 1:
        ERRORS.append(f'{rel}: title count={parser.title}')
    if parser.description != 1:
        ERRORS.append(f'{rel}: description count={parser.description}')
    if parser.robots != 1:
        ERRORS.append(f'{rel}: robots count={parser.robots}')
    if parser.viewport != 1:
        ERRORS.append(f'{rel}: viewport count={parser.viewport}')
    if parser.h1 != 1:
        ERRORS.append(f'{rel}: H1 count={parser.h1}')
    if indexable and parser.main != 1:
        ERRORS.append(f'{rel}: main count={parser.main}')
    if not parser.lang:
        ERRORS.append(f'{rel}: html lang missing')
    if page.name != '404.html':
        if parser.dir not in {'rtl', 'ltr'}:
            ERRORS.append(f'{rel}: invalid html dir={parser.dir}')
        if len(parser.canonical) != 1 or not parser.canonical[0].startswith(BASE + '/'):
            ERRORS.append(f'{rel}: canonical invalid')
        if parser.author != 1:
            ERRORS.append(f'{rel}: author count={parser.author}')
        if len(parser.hreflang) < 2:
            ERRORS.append(f'{rel}: bilingual hreflang set incomplete')
        if PERSIAN_NAME not in source and ENGLISH_NAME not in source:
            ERRORS.append(f'{rel}: canonical identity not discoverable in source')
        if BAD_ENGLISH.search(source):
            ERRORS.append(f'{rel}: malformed English identity remains')
        if source.count('/assets/site-bundle.css') != 1:
            ERRORS.append(f'{rel}: site-bundle.css count={source.count("/assets/site-bundle.css")}')
        if 'site-theme.js' not in source:
            ERRORS.append(f'{rel}: site-theme.js missing')
        if not vt and '/assets/vintech.css' in source:
            ERRORS.append(f'{rel}: vintech.css loaded outside VinTech')
        if vt and source.count('/assets/vintech.css') != 1:
            ERRORS.append(f'{rel}: VinTech vintech.css count={source.count("/assets/vintech.css")}')
        if not vt and 'modern-ui-2026.js' in source:
            ERRORS.append(f'{rel}: modern-ui-2026.js loaded outside VinTech')

        breadcrumb_navs = len(re.findall(r'<nav\b[^>]*class=["\'][^"\']*\bauto-breadcrumb\b[^"\']*["\'][^>]*>', source, re.I))
        if breadcrumb_navs != 1 and rel not in {'index.html', 'en.html', 'sitemap.html', '404.html'}:
            ERRORS.append(f'{rel}: auto-breadcrumb nav count={breadcrumb_navs}')
        if rel not in {'index.html', 'en.html', 'sitemap.html', '404.html'}:
            if source.count('AUTO-BREADCRUMB:START') != 1 or source.count('AUTO-BREADCRUMB:END') != 1:
                ERRORS.append(f'{rel}: breadcrumb markers must occur exactly once')
            if source.count('"@type":"BreadcrumbList"') + source.count('"@type": "BreadcrumbList"') != 1:
                ERRORS.append(f'{rel}: BreadcrumbList schema count must be exactly 1')

        # A skip link is expected on every normal page.
        skip = len(re.findall(r'class=["\'][^"\']*\bskip-link\b[^"\']*["\']', source, re.I))
        if skip != 1:
            ERRORS.append(f'{rel}: skip-link count={skip}')

    if parser.duplicate_ids:
        ERRORS.append(f'{rel}: duplicate ids: {", ".join(parser.duplicate_ids[:8])}')

    for img in parser.images:
        if 'alt' not in img:
            ERRORS.append(f'{rel}: image without alt')
        src = img.get('src', '')
        if src and not src.startswith(('data:', 'http://', 'https://')) and resolve_local(page, src) is None:
            ERRORS.append(f'{rel}: missing local image: {src}')
        if src and 'width' not in img and 'height' not in img:
            WARNINGS.append(f'{rel}: image without explicit dimensions: {src}')

    for href, attrs in parser.links:
        if not href or href.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
            continue
        u = urlparse(href)
        if u.scheme == 'http':
            ERRORS.append(f'{rel}: insecure link: {href}')
        if attrs.get('target') == '_blank' and 'noopener' not in (attrs.get('rel') or '').lower():
            ERRORS.append(f'{rel}: _blank without noopener: {href}')
        if resolve_local(page, href) is None and (href.startswith('/') or u.netloc == 'mowhmmdh.github.io'):
            ERRORS.append(f'{rel}: broken internal link: {href}')

    for button in parser.buttons:
        if not button.get('aria-label') and not button.get('title') and button.get('type') != 'submit':
            WARNINGS.append(f'{rel}: button may lack accessible name')

    if re.search(r'\b(?:Lorem ipsum|Coming soon|Your Name|John Doe|TODO|FIXME)\b', source, re.I):
        ERRORS.append(f'{rel}: placeholder content detected')
    if re.search(r'<meta[^>]+http-equiv=["\']refresh["\']', source, re.I):
        ERRORS.append(f'{rel}: meta refresh is not allowed')
    if any(css in source for css in LEGACY_CSS):
        ERRORS.append(f'{rel}: legacy CSS reference detected')

    check_jsonld(page, parser)

# Required production assets.
for required in ['sitemap.xml', 'robots.txt', 'manifest.webmanifest', '.well-known/security.txt', 'llms.txt', 'humans.txt', 'assets/site-bundle.css', 'assets/site-theme.js']:
    if required not in KNOWN:
        ERRORS.append(f'missing required asset: {required}')

# Repository-wide source audit: catches bugs hidden in scripts that mutate the site.
TEXT_EXTENSIONS = {'.html', '.css', '.js', '.json', '.yml', '.yaml', '.md', '.txt', '.xml', '.py'}
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or '.git' in path.parts or path.suffix.lower() not in TEXT_EXTENSIONS:
        continue
    source = path.read_text(encoding='utf-8', errors='ignore')
    if BAD_ENGLISH.search(source):
        ERRORS.append(f'{path}: malformed English identity in repository source')
    for pattern in [
        r'AKIA[0-9A-Z]{16}',
        r'ghp_[A-Za-z0-9]{30,}',
        r'AIza[0-9A-Za-z_-]{30,}',
        r'-----BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE KEY-----'
    ]:
        if re.search(pattern, source):
            ERRORS.append(f'{path}: possible secret pattern')

print(f'HTML pages audited: {len(PAGES)}')
print(f'Warnings: {len(WARNINGS)}')
for warning in WARNINGS[:40]:
    print('WARN:', warning)
if ERRORS:
    print(f'Blocking issues: {len(ERRORS)}')
    for error in ERRORS:
        print('ERROR:', error)
    sys.exit(1)
print('PASS: metadata, identity, navigation, breadcrumbs, links, assets, accessibility basics, JSON-LD, and repository secret-pattern checks')
