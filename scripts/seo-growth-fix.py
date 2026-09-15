from pathlib import Path
from html.parser import HTMLParser
import html, json, re, subprocess

BASE = 'https://mowhmmdh.github.io'
ROOT = Path('.')
PERSON = 'Mohammad Hossein Asgari Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarin'

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.meta = []
        self.in_title = False
        self.jsonld = False
    def handle_starttag(self, t, a):
        d = dict(a)
        if t == 'title':
            self.in_title = True
        if t == 'meta':
            self.meta.append(d)
        if t == 'script' and d.get('type', '').lower() == 'application/ld+json':
            self.jsonld = True
    def handle_endtag(self, t):
        if t == 'title':
            self.in_title = False
    def handle_data(self, d):
        if self.in_title:
            self.title += d

def meta(x, n=None, p=None):
    for a in x.meta:
        if n and a.get('name', '').lower() == n:
            return a.get('content', '')
        if p and a.get('property', '').lower() == p:
            return a.get('content', '')
    return ''

def ensure_meta(text, name, content):
    pattern = re.compile(r'<meta\s+name=["\']' + re.escape(name) + r'["\'][^>]*>', re.I)
    tag = f'<meta name="{html.escape(name, quote=True)}" content="{html.escape(content, quote=True)}">'
    if pattern.search(text):
        return pattern.sub(tag, text, count=1)
    return text.replace('</head>', tag + '\n</head>', 1)

for path in sorted(ROOT.rglob('*.html')):
    if '.git' in path.parts:
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    if '</head>' not in text:
        continue
    parser = P(); parser.feed(text)
    # Preserve page-specific titles/descriptions; only enforce safe identity in metadata.
    title = parser.title.strip()
    description = meta(parser, n='description')
    if title and 'Mohammad Hossein Asgari Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarin' in title:
        title = re.sub(r'Mohammad\s+Hossein\s+Asgari(?:\s+Somar(?:in|ini))+', PERSON, title, flags=re.I)
        text = re.sub(r'(<title>).*?(</title>)', lambda m: m.group(1) + html.escape(title) + m.group(2), text, count=1, flags=re.I|re.S)
    if description and 'Mohammad Hossein Asgari Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarin' in description:
        description = re.sub(r'Mohammad\s+Hossein\s+Asgari(?:\s+Somar(?:in|ini))+', PERSON, description, flags=re.I)
        text = ensure_meta(text, 'description', description)
    # Keep a single canonical author value when an author meta tag exists.
    text = re.sub(
        r'(<meta\s+name=["\']author["\']\s+content=["\']).*?(["\'][^>]*>)',
        lambda m: m.group(1) + PERSON + m.group(2),
        text, flags=re.I,
    )
    path.write_text(text, encoding='utf-8')

print('SEO growth metadata normalized without changing canonical identity constants.')
