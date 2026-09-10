from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import re, sys

BASE='https://mowhmmdh.github.io'
ROOT=Path('.')
PAGES=sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts and p.name!='404.html')
errors=[]; warnings=[]

class SEO(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self.in_title=False; self.h1=0; self.meta=[]; self.links=[]; self.jsonld=0; self.html_lang=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html': self.html_lang=a.get('lang')
        if tag=='title': self.in_title=True
        if tag=='h1': self.h1+=1
        if tag=='meta': self.meta.append(a)
        if tag=='link': self.links.append(a)
        if tag=='script' and (a.get('type') or '').lower()=='application/ld+json': self.jsonld+=1
    def handle_endtag(self,tag):
        if tag=='title': self.in_title=False
    def handle_data(self,data):
        if self.in_title: self.title += data

def meta(a,name=None,prop=None):
    for x in a:
        if name and x.get('name','').lower()==name: return x.get('content','')
        if prop and x.get('property','').lower()==prop: return x.get('content','')
    return ''

def canon(a): return [x.get('href','') for x in a if 'canonical' in (x.get('rel') or '').lower().split()]
def alternates(a): return [(x.get('hreflang','').lower(),x.get('href','')) for x in a if 'alternate' in (x.get('rel') or '').lower().split() and x.get('hreflang')]

for p in PAGES:
    rel=p.as_posix(); s=p.read_text(encoding='utf-8',errors='replace'); x=SEO(); x.feed(s)
    if not x.html_lang: errors.append(f'{rel}: html lang missing')
    if not (15<=len(x.title.strip())<=65): warnings.append(f'{rel}: title length {len(x.title.strip())}')
    desc=meta(x.meta,name='description')
    if not (50<=len(desc)<=170): warnings.append(f'{rel}: description length {len(desc)}')
    c=canon(x.links)
    if len(c)!=1: errors.append(f'{rel}: canonical count {len(c)}')
    elif not c[0].startswith(BASE+'/'): errors.append(f'{rel}: canonical outside site')
    al=alternates(x.links); langs={h for h,_ in al}
    if len(al)<2 or 'x-default' not in langs: errors.append(f'{rel}: hreflang/x-default incomplete')
    if x.h1!=1: errors.append(f'{rel}: H1 count {x.h1}')
    robots=meta(x.meta,name='robots').lower()
    if 'noindex' in robots: errors.append(f'{rel}: noindex on indexable page')
    for prop in ('og:title','og:description','og:image'):
        if not meta(x.meta,prop=prop): warnings.append(f'{rel}: missing {prop}')
    if x.jsonld==0: warnings.append(f'{rel}: no JSON-LD structured data')
    if 'http://' in s and re.search(r'(?:href|src)=["\']http://',s,re.I): warnings.append(f'{rel}: insecure embedded URL')

print(f'Deep SEO audit: {len(PAGES)} HTML pages')
print(f'Warnings: {len(warnings)}')
for w in warnings[:100]: print('WARN:',w)
if errors:
    for e in errors: print('ERROR:',e)
    print(f'Blocking SEO issues: {len(errors)}'); sys.exit(1)
print('PASS: titles, descriptions, canonical, hreflang, indexability, H1 and social/structured-data foundations')
