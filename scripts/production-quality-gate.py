from pathlib import Path
from html.parser import HTMLParser
import re,sys
root=Path('.')
files=[p for p in root.rglob('*.html') if '.git' not in p.parts]
errors=[]
class P(HTMLParser):
    def __init__(self):
        super().__init__();self.title=0;self.desc=0;self.h1=0;self.ids=set();self.dupes=[];self.imgs=0;self.missing_alt=0
    def handle_starttag(self,t,a):
        d=dict(a)
        if t=='title':self.title+=1
        if t=='h1':self.h1+=1
        if t=='meta' and d.get('name','').lower()=='description':self.desc+=1
        if d.get('id'):
            if d['id'] in self.ids:self.dupes.append(d['id'])
            self.ids.add(d['id'])
        if t=='img':
            self.imgs+=1
            if 'alt' not in d:self.missing_alt+=1
for f in files:
    try:
        p=P();p.feed(f.read_text(encoding='utf-8'))
        if p.title!=1:errors.append(f'{f}: title count {p.title}')
        if p.desc!=1:errors.append(f'{f}: description count {p.desc}')
        if p.h1!=1:errors.append(f'{f}: h1 count {p.h1}')
        if p.dupes:errors.append(f'{f}: duplicate ids {p.dupes}')
        if p.missing_alt:errors.append(f'{f}: images missing alt {p.missing_alt}')
    except Exception as e: errors.append(f'{f}: parse {e}')
for f in root.rglob('*'):
    if f.is_file() and '.git' not in f.parts and f.suffix.lower() in {'.html','.css','.js','.json','.xml','.txt'}:
        s=f.read_text(encoding='utf-8',errors='ignore')
        if re.search(r'(?i)(AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{30,})',s):errors.append(f'{f}: possible secret')
print(f'Production audit: {len(files)} HTML pages')
if errors:
    print('\n'.join('ERROR: '+e for e in errors));sys.exit(1)
print('Production quality gate: PASS')
