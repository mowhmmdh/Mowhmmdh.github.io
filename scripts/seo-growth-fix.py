from pathlib import Path
from html.parser import HTMLParser
import html, json, re, subprocess

BASE = 'https://mowhmmdh.github.io'
ROOT = Path('.')
PERSON = 'Mohammad Hossein Asgari Somarin'

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self.meta=[]; self.in_title=False; self.jsonld=False
    def handle_starttag(self,t,a):
        d=dict(a)
        if t=='title': self.in_title=True
        if t=='meta': self.meta.append(d)
        if t=='script' and d.get('type','').lower()=='application/ld+json': self.jsonld=True
    def handle_endtag(self,t):
        if t=='title': self.in_title=False
    def handle_data(self,d):
        if self.in_title: self.title+=d

# Keep the growth pass focused on SEO metadata and page content. It must never
# rewrite .github workflow definitions or invent authority claims.
for path in sorted(ROOT.rglob('*.html')):
    if '.git' in path.parts or '.github' in path.parts:
        continue
    try: text = path.read_text(encoding='utf-8')
    except Exception: continue
    new = re.sub(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar\w*)+', PERSON, text, flags=re.I)
    new = re.sub(r'(محمدحسین\s*عسگری\s*ثمرین)(?:\s*ثمرین)+', 'محمدحسین عسگری ثمرین', new)
    if new != text:
        path.write_text(new, encoding='utf-8')
print('SEO growth metadata normalized with canonical identity.')
