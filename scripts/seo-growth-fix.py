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

def meta(x,n=None,p=None):
    for a in x.meta:
        if n and a.get('name','').lower()==n: return a.get('content','')
        if p and a.get('property','').lower()==p: return a.get('content','')
    return ''

def ensure_meta(text,name,content):
    pattern=re.compile(r'<meta\s+name=["\']'+re.escape(name)+r'["\'][^>]*>',re.I)
    tag=f'<meta name="{html.escape(name,quote=True)}" content="{html.escape(content,quote=True)}">'
    return pattern.sub(tag,text,count=1) if pattern.search(text) else text.replace('</head>',tag+'\n</head>',1)

def normalize_en_identity(value):
    return re.sub(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar(?:ini|in))+',PERSON,value,flags=re.I)

for path in sorted(ROOT.rglob('*.html')):
    if '.git' in path.parts: continue
    text=path.read_text(encoding='utf-8',errors='ignore')
    if '</head>' not in text: continue
    parser=P(); parser.feed(text)
    title=parser.title.strip(); description=meta(parser,n='description')
    if title and re.search(r'Mohammad\s+Hossein\s+Asgar(?:i)?',title,re.I):
        title=normalize_en_identity(title)
        text=re.sub(r'(<title>).*?(</title>)',lambda m:m.group(1)+html.escape(title)+m.group(2),text,count=1,flags=re.I|re.S)
    if description and re.search(r'Mohammad\s+Hossein\s+Asgar(?:i)?',description,re.I):
        description=normalize_en_identity(description)
        text=ensure_meta(text,'description',description)
    text=re.sub(r'(<meta\s+name=["\']author["\']\s+content=["\']).*?(["\'][^>]*>)',lambda m:m.group(1)+PERSON+m.group(2),text,flags=re.I)
    path.write_text(text,encoding='utf-8')

print('SEO growth metadata normalized with canonical identity.')
