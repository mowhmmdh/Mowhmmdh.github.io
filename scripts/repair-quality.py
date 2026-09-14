from pathlib import Path
import re

ROOT = Path('.')
BASE = 'https://mowhmmdh.github.io'
# Deterministic repository-wide HTML quality repair.

def page_url(p):
    r = p.as_posix()
    if r == 'index.html': return BASE + '/'
    if r.endswith('/index.html'): return BASE + '/' + r[:-10]
    return BASE + '/' + r

def page_lang(p):
    r = p.as_posix()
    return 'en' if p.name.startswith('en-') or r.startswith(('en-blog/', 'en-vintech/')) or p.name == 'en.html' else 'fa-IR'

def equivalent(p):
    r = p.as_posix()
    pairs = {
        'index.html':'en.html','en.html':'index.html','about.html':'en-about.html','en-about.html':'about.html',
        'authority.html':'en-authority.html','en-authority.html':'authority.html','projects.html':'en-projects.html',
        'en-projects.html':'projects.html','services.html':'en-services.html','en-services.html':'services.html',
        'press.html':'en-press.html','en-press.html':'press.html','linkedin.html':'en-linkedin.html',
        'en-linkedin.html':'linkedin.html','blog/index.html':'en-blog.html','en-blog.html':'blog/index.html',
        'vintech.html':'en-vintech.html','en-vintech.html':'vintech.html'
    }
    if r in pairs: return Path(pairs[r])
    if r.startswith('blog/') and r != 'blog/index.html': return Path('en-blog') / r[len('blog/'):]
    if r.startswith('en-blog/'): return Path('blog') / r[len('en-blog/'):]
    if r.startswith('vintech/'): return Path('en-vintech') / r[len('vintech/') :]
    if r.startswith('en-vintech/'): return Path('vintech') / r[len('en-vintech/') :]
    return None

def breadcrumb_block(p, title, language):
    home = 'Home' if language == 'en' else 'خانه'
    current = title or p.stem.replace('-', ' ')
    return f'<nav class="auto-breadcrumb" aria-label="Breadcrumb"><ol><li><a href="{BASE}/">{home}</a></li><li aria-current="page"><span>{current}</span></li></ol></nav><script type="application/ld+json">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"{home}","item":"{BASE}/"}},{{"@type":"ListItem","position":2,"name":"{current}","item":"{page_url(p)}"}}]}}</script>'

changed = 0
for p in sorted(ROOT.rglob('*.html')):
    if '.git' in p.parts or p.name == '404.html': continue
    text = p.read_text(encoding='utf-8', errors='replace')
    original = text
    language = page_lang(p)

    if not re.search(r'<meta\s+name=["\']author["\']', text, re.I):
        tag = '<meta name="author" content="Mohammad Hossein Asgari">'
        m = re.search(r'<meta\s+name=["\']description["\'][^>]*>', text, re.I)
        text = text[:m.end()] + tag + text[m.end():] if m else text.replace('</head>', tag + '</head>', 1)
    if '/assets/site-theme.js' not in text:
        text = text.replace('</head>', '<script src="/assets/site-theme.js" defer></script></head>', 1)

    # Exactly one accessible skip link.
    skip_pat = re.compile(r'<a\b[^>]*class=["\'][^"\']*\bskip-link\b[^"\']*["\'][^>]*>.*?</a>', re.I | re.S)
    skips = list(skip_pat.finditer(text))
    if not skips:
        label = 'Skip to main content' if language == 'en' else 'پرش به محتوای اصلی'
        text = re.sub(r'(<body\b[^>]*>)', rf'\1<a id="skip-to-content" class="skip-link" href="#main-content">{label}</a>', text, count=1, flags=re.I)
    elif len(skips) > 1:
        for m in reversed(skips[1:]): text = text[:m.start()] + text[m.end():]

    # Exactly one main#main-content: assign the first main when missing.
    mains = list(re.finditer(r'<main\b([^>]*)>', text, re.I))
    if mains:
        first = mains[0]
        attrs = first.group(1)
        if not re.search(r'\bid=["\']main-content["\']', attrs, re.I):
            attrs = re.sub(r'\s+id=["\'][^"\']*["\']', '', attrs, flags=re.I)
            replacement = '<main id="main-content"' + attrs + '>'
            text = text[:first.start()] + replacement + text[first.end():]
        # Remove main-content from any later main elements.
        mains2 = list(re.finditer(r'<main\b([^>]*)>', text, re.I))
        for m in reversed(mains2[1:]):
            attrs = re.sub(r'\s+id=["\']main-content["\']', '', m.group(1), flags=re.I)
            text = text[:m.start()] + '<main' + attrs + '>' + text[m.end():]

    # Complete bilingual/default hreflang set.
    text = re.sub(r'\s*<link\s+rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>', '', text, flags=re.I)
    own = page_url(p)
    other = equivalent(p)
    other_url = page_url(other) if other and (ROOT / other).exists() else None
    links = [f'<link rel="alternate" hreflang="{language if language == "en" else "fa-IR"}" href="{own}">']
    if other_url:
        links.append(f'<link rel="alternate" hreflang="{"en" if language != "en" else "fa-IR"}" href="{other_url}">')
    links.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}/">')
    text = text.replace('</head>', ''.join(links) + '</head>', 1)

    # Add one breadcrumb block to pages covered by the engineering gate.
    exempt = p.name in {'index.html','en.html','404.html','sitemap.html'}
    if not exempt and 'AUTO-BREADCRUMB:START' not in text:
        title_m = re.search(r'<title>(.*?)</title>', text, re.I | re.S)
        title = re.sub(r'\s+', ' ', title_m.group(1)).strip() if title_m else p.stem.replace('-', ' ')
        block = '<!-- AUTO-BREADCRUMB:START -->' + breadcrumb_block(p, title, language) + '<!-- AUTO-BREADCRUMB:END -->'
        text = text.replace('</head>', block + '</head>', 1)

    if text != original:
        p.write_text(text, encoding='utf-8')
        changed += 1
print(f'Quality repair updated {changed} HTML pages.')
