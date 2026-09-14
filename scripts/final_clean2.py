from pathlib import Path
root=Path('.')
for p in root.rglob('*.html'):
    if '.git' in p.parts: continue
    rel=p.as_posix()
    if not (p.name.startswith('en-') or p.name=='en.html' or rel.startswith('en-blog/') or rel.startswith('en-vintech/')): continue
    s=p.read_text(encoding='utf-8')
    s=s.replace('>پرش به محتوای اصلی</a>','>Skip to content</a>')
    s=s.replace('>خانه</a>','>Home</a>')
    s=s.replace('"name":"خانه"','"name":"Home"')
    s=s.replace('href="https://mowhmmdh.github.io/">Home</a>','href="https://mowhmmdh.github.io/en.html">Home</a>')
    p.write_text(s,encoding='utf-8')
