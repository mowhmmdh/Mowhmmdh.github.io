from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import posixpath, re, sys

ROOT=Path('.')
PAGES=sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts)
KNOWN={p.as_posix() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts}
ERRORS=[]
PERSIAN_NAME='محمدحسین عسگری ثمرین'
ENGLISH_NAME='Mohammad Hossein Asgari Somarin'
IDENTITY_LINKS=('https://github.com/mowhmmdh','https://www.linkedin.com/in/mohammadhosseinasgari/')

class Audit(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=self.desc=self.robots=self.viewport=self.h1=self.author=0; self.canonical=[]; self.hreflang=[]; self.lang=None; self.dir=None; self.imgs=[]; self.links=[]; self.ids=set(); self.dup=[]; self.scripts=[]; self.styles=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='html': self.lang=a.get('lang'); self.dir=a.get('dir')
        if tag=='title': self.title+=1
        if tag=='h1': self.h1+=1
        if tag=='img': self.imgs.append(a)
        if tag=='a': self.links.append((a.get('href',''),a))
        if tag=='script': self.scripts.append(a.get('src',''))
        if tag=='link':
            rel=(a.get('rel') or '').lower().split()
            if 'canonical' in rel: self.canonical.append(a.get('href',''))
            if 'alternate' in rel and a.get('hreflang'): self.hreflang.append((a.get('hreflang'),a.get('href','')))
            if a.get('rel')=='stylesheet': self.styles.append(a.get('href',''))
        if tag=='meta':
            n=a.get('name','').lower()
            if n=='description': self.desc+=1
            if n=='robots': self.robots+=1
            if n=='viewport': self.viewport+=1
            if n=='author': self.author+=1
        ident=a.get('id')
        if ident:
            if ident in self.ids: self.dup.append(ident)
            self.ids.add(ident)

def resolve(page, href):
    u=urlparse(href)
    if u.scheme in ('http','https'):
        if u.netloc not in ('','mowhmmdh.github.io'): return None
        target=unquote(u.path.lstrip('/'))
    elif href.startswith('/'):
        target=unquote(u.path.lstrip('/'))
    else:
        target=unquote(posixpath.normpath(posixpath.join(page.parent.as_posix(),u.path)))
    if target in ('','.'):
        target='index.html'
    candidates=[target]
    if target.endswith('/'):
        candidates=[target+'index.html']
    elif target not in KNOWN:
        candidates += [target+'.html',target+'/index.html']
    return next((c for c in candidates if c in KNOWN),None)

for p in PAGES:
    s=p.read_text(encoding='utf-8',errors='replace'); a=Audit(); a.feed(s); rel=p.as_posix()
    if a.title!=1: ERRORS.append(f'{rel}: title count={a.title}')
    if a.desc!=1: ERRORS.append(f'{rel}: description count={a.desc}')
    if a.robots!=1: ERRORS.append(f'{rel}: robots count={a.robots}')
    if a.viewport!=1: ERRORS.append(f'{rel}: viewport count={a.viewport}')
    if a.h1!=1: ERRORS.append(f'{rel}: H1 count={a.h1}')
    if not a.lang: ERRORS.append(f'{rel}: lang missing')
    if rel!='404.html':
        if len(a.canonical)!=1 or not a.canonical[0].startswith('https://mowhmmdh.github.io/'): ERRORS.append(f'{rel}: canonical invalid')
        if a.author!=1: ERRORS.append(f'{rel}: author count={a.author}')
        if len(a.hreflang)<2: ERRORS.append(f'{rel}: bilingual hreflang set incomplete')
        if PERSIAN_NAME not in s and ENGLISH_NAME not in s: ERRORS.append(f'{rel}: personal identity not discoverable in source')
    if a.dup: ERRORS.append(f'{rel}: duplicate ids: {", ".join(a.dup[:5])}')
    for img in a.imgs:
        if 'alt' not in img: ERRORS.append(f'{rel}: image without alt')
        src=img.get('src','')
        if src and not src.startswith(('data:','http://','https://')) and resolve(p,src) is None: ERRORS.append(f'{rel}: missing image: {src}')
    for href,attrs in a.links:
        if not href or href.startswith(('#','mailto:','tel:','javascript:')): continue
        if href.startswith('http://'): ERRORS.append(f'{rel}: insecure link: {href}')
        if attrs.get('target')=='_blank' and 'noopener' not in (attrs.get('rel') or '').lower(): ERRORS.append(f'{rel}: _blank without noopener: {href}')
        if urlparse(href).netloc in ('','mowhmmdh.github.io') and resolve(p,href) is None: ERRORS.append(f'{rel}: broken link: {href}')
    if rel in {'index.html','about.html','en.html','en-about.html','vintech.html','en-vintech.html'}:
        for identity in IDENTITY_LINKS:
            if identity not in s: ERRORS.append(f'{rel}: missing identity link: {identity}')
    if re.search(r'\b(Lorem ipsum|Coming soon|Your Name|John Doe|TODO|FIXME)\b',s,re.I): ERRORS.append(f'{rel}: placeholder content')

for required in ['sitemap.xml','robots.txt','manifest.json','.well-known/security.txt','llms.txt','humans.txt']:
    if required not in KNOWN: ERRORS.append(f'missing required asset: {required}')

for f in ROOT.rglob('*'):
    if not f.is_file() or '.git' in f.parts or f.suffix.lower() not in {'.html','.css','.js','.json','.yml','.yaml','.md','.txt','.xml','.py'}: continue
    s=f.read_text(encoding='utf-8',errors='ignore')
    for pat in [r'AKIA[0-9A-Z]{16}',r'ghp_[A-Za-z0-9]{30,}',r'AIza[0-9A-Za-z_-]{30,}',r'-----BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE KEY-----']:
        if re.search(pat,s): ERRORS.append(f'{f.as_posix()}: possible secret pattern')

print(f'Pages audited: {len(PAGES)}')
if ERRORS:
    for e in ERRORS: print('ERROR:',e)
    print(f'Blocking issues: {len(ERRORS)}'); sys.exit(1)
print('PASS: HTML structure, SEO foundations, bilingual identity, local links/assets, accessibility basics and secret patterns')
