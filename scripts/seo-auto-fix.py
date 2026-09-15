from pathlib import Path
from html.parser import HTMLParser
import html, json, re

ROOT=Path('.')
BASE='https://mowhmmdh.github.io'
PERSON_FA='محمدحسین عسگری ثمرین'
PERSON_EN='Mohammad Hossein Asgari Somarini Somarin'
DEFAULT_FA=f'{BASE}/images/profile.webp'
DEFAULT_VT=f'{BASE}/images/vinicon.webp'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self.in_title=False; self.h1=''; self.in_h1=False; self.meta=[]; self.links=[]; self.has_jsonld=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='title': self.in_title=True
        if tag=='h1' and not self.h1: self.in_h1=True
        if tag=='meta': self.meta.append(a)
        if tag=='link': self.links.append(a)
        if tag=='script' and (a.get('type') or '').lower()=='application/ld+json': self.has_jsonld=True
    def handle_endtag(self,tag):
        if tag=='title': self.in_title=False
        if tag=='h1': self.in_h1=False
    def handle_data(self,data):
        if self.in_title: self.title += data
        if self.in_h1: self.h1 += data

def getmeta(metas,name=None,prop=None):
    for a in metas:
        if name and a.get('name','').lower()==name: return a.get('content','')
        if prop and a.get('property','').lower()==prop: return a.get('content','')
    return ''

def trim_title(title, is_en):
    title=' '.join(title.split())
    if len(title)<=65: return title
    parts=[p.strip() for p in title.split('|') if p.strip()]
    while len(parts)>1 and len(' | '.join(parts))>65: parts.pop()
    title=' | '.join(parts)
    if len(title)>65:
        title=title[:62].rstrip(' -|:')+'…'
    return title

def trim_desc(desc):
    desc=' '.join(desc.split())
    if len(desc)<=170: return desc
    cut=desc[:167].rsplit(' ',1)[0]
    return cut+'…'

def inject_meta(s, tag):
    return s.replace('</head>',tag+'\n</head>',1)

def ensure_meta(s, attr, key, value):
    if re.search(r'<meta\b[^>]*'+re.escape(attr)+r'=["\']'+re.escape(key)+r'["\'][^>]*>',s,re.I): return s
    return inject_meta(s, f'<meta {attr}="{html.escape(key,quote=True)}" content="{html.escape(value,quote=True)}">')

def ensure_jsonld(s, data):
    if re.search(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>',s,re.I): return s
    blob=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    return inject_meta(s,f'<script type="application/ld+json">{blob}</script>')

changed=[]
for p in sorted(ROOT.rglob('*.html')):
    if '.git' in p.parts or p.name=='404.html': continue
    s=p.read_text(encoding='utf-8',errors='replace'); original=s
    x=Page(); x.feed(s)
    is_en=p.as_posix().startswith('en-') or p.as_posix().startswith('en-blog/') or p.as_posix().startswith('en-vintech/')
    is_vt=p.as_posix().startswith(('vintech/','en-vintech/')) or p.name in {'vintech.html','en-vintech.html'}
    title=trim_title(x.title,is_en)
    if title and title!=x.title:
        s=re.sub(r'<title>.*?</title>',f'<title>{html.escape(title)}</title>',s,count=1,flags=re.I|re.S)
    desc=getmeta(x.meta,name='description')
    if desc and desc!=trim_desc(desc):
        s=re.sub(r'(<meta\b[^>]*name=["\']description["\'][^>]*content=["\'])[^"\']*(["\'])',lambda m:m.group(1)+html.escape(trim_desc(desc),quote=True)+m.group(2),s,count=1,flags=re.I)
    # Social metadata should be present on indexable content pages. Reuse canonical page identity and existing image when available.
    x2=Page(); x2.feed(s)
    desc=getmeta(x2.meta,name='description') or title
    image=getmeta(x2.meta,prop='og:image') or getmeta(x2.meta,name='twitter:image') or (DEFAULT_VT if is_vt else DEFAULT_FA)
    if not getmeta(x2.meta,prop='og:title'): s=ensure_meta(s,'property','og:title',title)
    if not getmeta(x2.meta,prop='og:description'): s=ensure_meta(s,'property','og:description',desc)
    if not getmeta(x2.meta,prop='og:image'): s=ensure_meta(s,'property','og:image',image)
    # Add a lightweight WebPage node only where no structured data exists; article/service pages retain their richer existing schema.
    if not x2.has_jsonld:
        canonical=''
        for a in x2.links:
            if 'canonical' in (a.get('rel') or '').lower().split(): canonical=a.get('href','')
        if canonical:
            schema={"@context":"https://schema.org","@type":"WebPage","name":title,"url":canonical,"inLanguage":"en" if is_en else "fa-IR","isPartOf":{"@type":"WebSite","url":BASE},"author":{"@type":"Person","name":PERSON_EN}}
            s=ensure_jsonld(s,schema)
    # Reserve space for the two remote project screenshots flagged by the audit without changing their responsive rendering.
    s=s.replace('src="https://raw.githubusercontent.com/mowhmmdh/Projects/main/image_2026-05-01_16-18-47.jpg"','src="https://raw.githubusercontent.com/mowhmmdh/Projects/main/image_2026-05-01_16-18-47.jpg" width="1200" height="675"')
    s=s.replace('src="https://raw.githubusercontent.com/mowhmmdh/Projects/main/20260430_204434.jpg"','src="https://raw.githubusercontent.com/mowhmmdh/Projects/main/20260430_204434.jpg" width="1200" height="675"')
    if s!=original:
        p.write_text(s,encoding='utf-8'); changed.append(p.as_posix())
print(f'SEO auto-fix changed {len(changed)} pages')
for p in changed: print(p)
