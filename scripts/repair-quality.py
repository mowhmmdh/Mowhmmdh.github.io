from pathlib import Path
import re

ROOT = Path('.')
BASE = 'https://mowhmmdh.github.io'

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
    if r.startswith('vintech/'): return Path('en-vintech') / r[len('vintech/'):]
    if r.startswith('en-vintech/'): return Path('vintech') / r[len('en-vintech/') :]
    return None

changed = 0
for p in sorted(ROOT.rglob('*.html')):
    if '.git' in p.parts or p.name == '404.html': continue
    text = p.read_text(encoding='utf-8', errors='replace')
    original = text

    if not re.search(r'<meta\s+name=["\']author["\']', text, re.I):
        tag = '<meta name="author" content="Mohammad Hossein Asgari">'
        m = re.search(r'<meta\s+name=["\']description["\'][^>]*>', text, re.I)
        text = text[:m.end()] + tag + text[m.end():] if m else text.replace('</head>', tag + '</head>', 1)

    if '/assets/site-theme.js' not in text:
        text = text.replace('</head>', '<script src="/assets/site-theme.js" defer></script></head>', 1)

    text = re.sub(r'\s*<link\s+rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>', '', text, flags=re.I)
    own = page_url(p)
    other = equivalent(p)
    other_url = page_url(other) if other and (ROOT / other).exists() else None
    language = page_lang(p)
    links = [f'<link rel="alternate" hreflang="{language}" href="{own}">']
    if other_url:
        links.append(f'<link rel="alternate" hreflang="{"en" if language == "fa-IR" else "fa-IR"}" href="{other_url}">')
    links.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}/">')
    text = text.replace('</head>', ''.join(links) + '</head>', 1)

    if text != original:
        p.write_text(text, encoding='utf-8')
        changed += 1

print(f'Quality repair updated {changed} HTML pages.')
