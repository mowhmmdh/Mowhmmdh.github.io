from pathlib import Path
import re
root=Path('.')
for p in root.rglob('*.html'):
    if '.git' in p.parts: continue
    s=p.read_text(encoding='utf-8')
    # Production CSS contract: one core bundle, plus VinTech-only CSS where needed.
    def css(m):
        href=m.group(1)
        if href.endswith('/assets/site-bundle.css') or href.endswith('/assets/vintech.css'):
            return m.group(0)
        return ''
    s=re.sub(r'<link\\s+[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>',css,s,flags=re.I)
    # Deduplicate the core bundle and keep it before any VinTech layer.
    s=re.sub(r'(?:<link\\s+[^>]*rel=["\']stylesheet["\'][^>]*href=["\']/assets/site-bundle\\.css["\'][^>]*>\\s*){2,}', '<link rel="stylesheet" href="/assets/site-bundle.css">', s, flags=re.I)
    # English accessibility and breadcrumb labels.
    rel=p.as_posix()
    if p.name.startswith('en-') or p.name=='en.html' or rel.startswith('en-blog/') or rel.startswith('en-vintech/'):
        s=s.replace('>پرش به محتوای اصلی</a>','>Skip to content</a>')
        s=s.replace('>خانه</a>','>Home</a>')
        s=s.replace('"name":"خانه"','"name":"Home"')
        s=s.replace('href="https://mowhmmdh.github.io/">Home</a>','href="https://mowhmmdh.github.io/en.html">Home</a>')
    p.write_text(s,encoding='utf-8')
print('PRODUCTION_CLEAN_OK')
