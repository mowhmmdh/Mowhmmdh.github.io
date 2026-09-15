from pathlib import Path
from html.parser import HTMLParser
import html, json, re

ROOT=Path('.')
BASE='https://mowhmmdh.github.io'
PERSON_FA='محمدحسین عسگری ثمرین'
PERSON_EN='Mohammad Hossein Asgari Somarin'
DEFAULT_FA=f'{BASE}/images/profile.webp'
DEFAULT_VT=f'{BASE}/images/vinicon.webp'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self.in_title=False; self.h1=''; self.in_h1=False; self.meta=[]; self.links=[]; self.has_jsonld=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='title': self.in_title=True
        if tag=='h1': self.in_h1=True
        if tag=='meta': self.meta.append(a)
        if tag=='link' and a.get('rel')=='canonical': self.links.append(a.get('href',''))
        if tag=='script' and a.get('type','').lower()=='application/ld+json': self.has_jsonld=True
    def handle_endtag(self,tag):
        if tag=='title': self.in_title=False
        if tag=='h1': self.in_h1=False
    def handle_data(self,data):
        if self.in_title: self.title += data
        if self.in_h1: self.h1 += data

EN_CORRUPTION = re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar\w*)+', re.I)
FA_CORRUPTION = re.compile(r'(محمدحسین\s*عسگری\s*ثمرین)(?:\s*ثمرین)+')

for p in sorted(ROOT.rglob('*.html')):
    if '.git' in p.parts or '.github' in p.parts: continue
    try: s=p.read_text(encoding='utf-8',errors='replace')
    except Exception: continue
    original=s
    s=EN_CORRUPTION.sub(PERSON_EN,s)
    s=FA_CORRUPTION.sub(PERSON_FA,s)
    if s != original: p.write_text(s,encoding='utf-8')

print('SEO auto-fix: canonical identities normalized.')
