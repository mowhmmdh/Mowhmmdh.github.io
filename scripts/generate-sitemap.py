#!/usr/bin/env python3
from pathlib import Path
import subprocess
from xml.sax.saxutils import escape

ROOT = Path('.')
BASE = 'https://mowhmmdh.github.io'
urls = []

for page in sorted(ROOT.rglob('*.html')):
    if '.git' in page.parts or page.name == '404.html':
        continue
    text = page.read_text(encoding='utf-8', errors='ignore')
    if 'name="robots" content="noindex' in text.lower():
        continue
    rel = page.as_posix()
    if rel == 'index.html':
        url_path = '/'
    elif rel.endswith('/index.html'):
        url_path = '/' + rel[:-10].rstrip('/') + '/'
    else:
        url_path = '/' + rel
    try:
        lastmod = subprocess.check_output(
            ['git', 'log', '-1', '--format=%cs', '--', rel],
            text=True
        ).strip()
    except Exception:
        lastmod = ''
    urls.append((BASE + url_path, lastmod))

urls = sorted(set(urls))
body = '<?xml version="1.0" encoding="UTF-8"?>\n'
body += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for url, lastmod in urls:
    body += f'  <url><loc>{escape(url)}</loc>'
    if lastmod:
        body += f'<lastmod>{lastmod}</lastmod>'
    body += '</url>\n'
body += '</urlset>\n'

(ROOT / 'sitemap.xml').write_text(body, encoding='utf-8')
print(f'Generated {len(urls)} indexable sitemap URLs')
