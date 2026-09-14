from pathlib import Path
import re
from html import escape
from urllib.parse import quote

ROOT = Path('.')
START = '<!-- AUTO-DISCOVERY:START -->'
END = '<!-- AUTO-DISCOVERY:END -->'
BREAD_START = '<!-- AUTO-BREADCRUMB:START -->'
BREAD_END = '<!-- AUTO-BREADCRUMB:END -->'
RELATED_START = '<!-- AUTO-RELATED:START -->'
RELATED_END = '<!-- AUTO-RELATED:END -->'
BASE = 'https://mowhmmdh.github.io'


def replace_block(path: Path, block: str, start: str = START, end: str = END, marker: str = '</main>') -> None:
    text = path.read_text(encoding='utf-8')
    pattern = re.compile(re.escape(start) + r'.*?' + re.escape(end), re.S)
    payload = f'{start}\n{block}\n{end}'
    if pattern.search(text):
        new = pattern.sub(payload, text, count=1)
    else:
        lower = text.lower()
        idx = lower.find(marker.lower())
        if idx < 0:
            return
        new = text[:idx] + payload + '\n' + text[idx:]
    if new != text:
        path.write_text(new, encoding='utf-8')


def links(paths):
    items = []
    for p in sorted(paths):
        rel = p.as_posix()
        title = p.stem.replace('-', ' ').replace('_', ' ').title()
        items.append(f'<a class="discovery-link" href="/{escape(rel)}"><span>{escape(title)}</span><span aria-hidden="true">↗</span></a>')
    return ''.join(items)


def canonical_for(path: Path) -> str:
    rel = path.as_posix()
    if rel == 'index.html':
        return BASE + '/'
    if rel == 'blog/index.html':
        return BASE + '/blog/'
    if rel == 'case-studies/index.html':
        return BASE + '/case-studies/'
    if rel == 'vintech/insights/index.html':
        return BASE + '/vintech/insights/'
    return f'{BASE}/{quote(rel)}'


def page_title(path: Path, text: str) -> str:
    m = re.search(r'<title>(.*?)</title>', text, re.I | re.S)
    if m:
        return re.sub(r'\s+', ' ', m.group(1)).strip()
    return path.stem.replace('-', ' ').replace('_', ' ').title()


def ensure_meta(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    if '<html' not in text.lower() or '<head' not in text.lower():
        return
    canonical = canonical_for(path)
    title = page_title(path, text)
    is_en = path.name.startswith('en-') or '/en-' in path.as_posix() or path.as_posix().startswith('en-blog/') or path.as_posix().startswith('en-vintech/') or re.search(r'<html[^>]+lang=["\']en', text, re.I)
    lang = 'en-US' if is_en else 'fa-IR'
    # Ensure a canonical exists; never replace an explicit canonical supplied by a page.
    if not re.search(r'<link[^>]+rel=["\']canonical["\']', text, re.I):
        text = re.sub(r'</head>', f'<link rel="canonical" href="{canonical}"></head>', text, count=1, flags=re.I)
    if not re.search(r'<meta[^>]+name=["\']robots["\']', text, re.I):
        text = re.sub(r'</head>', '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"></head>', text, count=1, flags=re.I)
    if not re.search(r'<meta[^>]+name=["\']description["\']', text, re.I):
        desc = ('Professional technical guide and practical reference covering network, infrastructure, security and IT operations.' if is_en else 'راهنمای فنی و مرجع عملی درباره شبکه، زیرساخت، امنیت و عملیات فناوری اطلاعات.')
        text = re.sub(r'</head>', f'<meta name="description" content="{escape(desc, quote=True)}"></head>', text, count=1, flags=re.I)
    # Add lightweight WebPage identity only when the page has no JSON-LD at all.
    if 'application/ld+json' not in text.lower():
        schema = ('{"@context":"https://schema.org","@type":"WebPage","@id":"' + canonical + '#webpage","url":"' + canonical + '","name":"' + escape(title, quote=True) + '","inLanguage":"' + lang + '"}')
        text = re.sub(r'</head>', f'<script type="application/ld+json">{schema}</script></head>', text, count=1, flags=re.I)
    if text != path.read_text(encoding='utf-8'):
        path.write_text(text, encoding='utf-8')


def inject_breadcrumb(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    rel = path.as_posix()
    if rel in {'index.html', '404.html'}:
        return
    parts = rel.split('/')
    is_en = rel.startswith('en-') or rel.startswith('en-blog/') or rel.startswith('en-vintech/')
    home_name = 'Home' if is_en else 'خانه'
    items = [(home_name, BASE + ('/en.html' if is_en else '/'))]
    if rel.startswith('blog/'):
        items.append(('Technical Blog' if is_en else 'مقالات فنی', BASE + ('/en-blog.html' if is_en else '/blog/')))
    elif rel.startswith('en-blog/'):
        items.append(('Technical Blog', BASE + '/en-blog.html'))
    elif rel.startswith('vintech/'):
        items.append(('VinTech', BASE + ('/en-vintech.html' if is_en else '/vintech.html')))
    elif rel.startswith('en-vintech/'):
        items.append(('VinTech', BASE + '/en-vintech.html'))
    elif rel.startswith('case-studies/'):
        items.append(('Case Studies' if is_en else 'مطالعات موردی', BASE + '/case-studies/'))
    elif rel.startswith('services/'):
        items.append(('Services' if is_en else 'خدمات', BASE + '/services.html'))
    label = page_title(path, text)
    items.append((label, canonical_for(path)))
    li = []
    schema_items = []
    for i, (name, url) in enumerate(items, 1):
        li.append(f'<li><a href="{escape(url)}">{escape(name)}</a></li>')
        schema_items.append('{"@type":"ListItem","position":' + str(i) + ',"name":"' + escape(name, quote=True) + '","item":"' + url + '"}')
    block = f'<nav class="auto-breadcrumb" aria-label="Breadcrumb"><ol>{"".join(li)}</ol></nav><script type="application/ld+json">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{",".join(schema_items)}]}}</script>'
    replace_block(path, block, BREAD_START, BREAD_END, marker='<main')


def inject_related(path: Path, candidates) -> None:
    rel = path.as_posix()
    if not (rel.startswith('blog/') or rel.startswith('en-blog/')) or rel.endswith('/index.html'):
        return
    is_en = rel.startswith('en-blog/')
    same = [p for p in candidates if p != path and p.as_posix().startswith('en-blog/' if is_en else 'blog/')]
    same = sorted(same, key=lambda p: p.name)[:6]
    cards = ''.join(f'<a href="/{escape(p.as_posix())}">{escape(p.stem.replace("-", " ").title())} ↗</a>' for p in same)
    if not cards:
        return
    heading = 'Related technical guides' if is_en else 'راهنماهای فنی مرتبط'
    intro = 'Continue with closely related practical topics.' if is_en else 'برای مطالعه عمیق‌تر، این راهنماهای مرتبط را هم ببینید.'
    block = f'<section class="auto-related" aria-labelledby="related-guides-title"><h2 id="related-guides-title">{heading}</h2><p>{intro}</p><div class="auto-related-grid">{cards}</div></section>'
    replace_block(path, block, RELATED_START, RELATED_END, marker='</main>')


fa_articles = [p for p in (ROOT / 'blog').glob('*.html') if p.name != 'index.html']
en_articles = [p for p in (ROOT / 'en-blog').glob('*.html')]
fa_services = [p for p in (ROOT / 'vintech').rglob('*.html')]
en_services = [p for p in (ROOT / 'en-vintech').rglob('*.html')]

# Sitewide technical hygiene: every HTML page gets canonical/robots/description fallbacks
# plus breadcrumbs. Existing, stronger per-page metadata is intentionally preserved.
html_pages = [p for p in ROOT.rglob('*.html') if '.git' not in p.parts]
for page in html_pages:
    ensure_meta(page)
    inject_breadcrumb(page)

for page in fa_articles:
    inject_related(page, fa_articles)
for page in en_articles:
    inject_related(page, en_articles)

fa_blog_block = '<section class="auto-discovery section" aria-labelledby="discovery-title"><div class="eyebrow">DISCOVER THE KNOWLEDGE BASE</div><h2 id="discovery-title">همه راهنماهای فنی در یک مسیر</h2><p class="lead">راهنماهای شبکه، امنیت، Windows Server و عملیات IT را بر اساس موضوع دنبال کنید.</p><div class="discovery-grid">' + links(fa_articles) + '</div></section>'
en_blog_block = '<section class="auto-discovery section" aria-labelledby="discovery-title"><div class="eyebrow">KNOWLEDGE BASE</div><h2 id="discovery-title">Explore all technical guides</h2><p class="lead">Practical guides covering networking, security, Windows Server and IT operations.</p><div class="discovery-grid">' + links(en_articles) + '</div></section>'
fa_vt_block = '<section class="auto-discovery vt-section" aria-labelledby="discovery-title"><div class="vt-container"><div class="vt-section-head"><div class="eyebrow">SERVICE DIRECTORY</div><h2 id="discovery-title">همه حوزه‌های خدمات وین‌تک</h2><div class="discovery-grid">' + links(fa_services) + '</div></div></div></section>'
en_vt_block = '<section class="auto-discovery vt-section" aria-labelledby="discovery-title"><div class="vt-container"><div class="vt-section-head"><div class="eyebrow">SERVICE DIRECTORY</div><h2 id="discovery-title">Explore VinTech services</h2><div class="discovery-grid">' + links(en_services) + '</div></div></div></section>'

replace_block(ROOT / 'blog/index.html', fa_blog_block)
replace_block(ROOT / 'en-blog.html', en_blog_block)
replace_block(ROOT / 'vintech.html', fa_vt_block)
replace_block(ROOT / 'en-vintech.html', en_vt_block)
print(f'SEO discovery sync: {len(html_pages)} HTML pages, {len(fa_articles)} FA articles, {len(en_articles)} EN articles, {len(fa_services)} FA services, {len(en_services)} EN services')
