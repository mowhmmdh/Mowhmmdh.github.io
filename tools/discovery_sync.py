from pathlib import Path
import re
from html import escape

ROOT = Path('.')
START = '<!-- AUTO-DISCOVERY:START -->'
END = '<!-- AUTO-DISCOVERY:END -->'


def replace_block(path: Path, block: str) -> None:
    text = path.read_text(encoding='utf-8')
    pattern = re.compile(re.escape(START) + r'.*?' + re.escape(END), re.S)
    payload = f'{START}\n{block}\n{END}'
    if pattern.search(text):
        new = pattern.sub(payload, text, count=1)
    else:
        marker = '</main>'
        if marker not in text.lower():
            return
        idx = text.lower().find(marker)
        new = text[:idx] + payload + '\n' + text[idx:]
    if new != text:
        path.write_text(new, encoding='utf-8')


def links(paths, prefix=''):
    items=[]
    for p in sorted(paths):
        rel=p.as_posix()
        title=p.stem.replace('-', ' ').replace('_',' ').title()
        items.append(f'<a class="discovery-link" href="/{escape(rel)}"><span>{escape(title)}</span><span aria-hidden="true">↗</span></a>')
    return ''.join(items)

fa_articles = [p for p in (ROOT/'blog').glob('*.html') if p.name != 'index.html']
en_articles = [p for p in (ROOT/'en-blog').glob('*.html')]
fa_services = [p for p in (ROOT/'vintech').rglob('*.html')]
en_services = [p for p in (ROOT/'en-vintech').rglob('*.html')]

fa_blog_block = '<section class="auto-discovery section" aria-labelledby="discovery-title"><div class="eyebrow">DISCOVER THE KNOWLEDGE BASE</div><h2 id="discovery-title">همه راهنماهای فنی در یک مسیر</h2><p class="lead">راهنماهای شبکه، امنیت، Windows Server و عملیات IT را بر اساس موضوع دنبال کنید.</p><div class="discovery-grid">' + links(fa_articles) + '</div></section>'
en_blog_block = '<section class="auto-discovery section" aria-labelledby="discovery-title"><div class="eyebrow">KNOWLEDGE BASE</div><h2 id="discovery-title">Explore all technical guides</h2><p class="lead">Practical guides covering networking, security, Windows Server and IT operations.</p><div class="discovery-grid">' + links(en_articles) + '</div></section>'
fa_vt_block = '<section class="auto-discovery vt-section" aria-labelledby="discovery-title"><div class="vt-container"><div class="vt-section-head"><div class="eyebrow">SERVICE DIRECTORY</div><h2 id="discovery-title">همه حوزه‌های خدمات وین‌تک</h2><div class="discovery-grid">' + links(fa_services) + '</div></div></div></section>'
en_vt_block = '<section class="auto-discovery vt-section" aria-labelledby="discovery-title"><div class="vt-container"><div class="vt-section-head"><div class="eyebrow">SERVICE DIRECTORY</div><h2 id="discovery-title">Explore VinTech services</h2><div class="discovery-grid">' + links(en_services) + '</div></div></div></section>'

replace_block(ROOT/'blog/index.html', fa_blog_block)
replace_block(ROOT/'en-blog.html', en_blog_block)
replace_block(ROOT/'vintech.html', fa_vt_block)
replace_block(ROOT/'en-vintech.html', en_vt_block)
print(f'Indexed discovery hubs: {len(fa_articles)} FA articles, {len(en_articles)} EN articles, {len(fa_services)} FA services, {len(en_services)} EN services')
