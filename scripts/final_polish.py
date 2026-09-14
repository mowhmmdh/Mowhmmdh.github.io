from pathlib import Path
import subprocess,sys
root=Path('.')
# English root page must be treated as English by the breadcrumb generator.
p=root/'tools/discovery_sync.py'
s=p.read_text(encoding='utf-8')
s=s.replace("is_en = rel.startswith('en-') or rel.startswith('en-blog/') or rel.startswith('en-vintech/')", "is_en = rel == 'en.html' or rel.startswith('en-') or rel.startswith('en-blog/') or rel.startswith('en-vintech/')")
p.write_text(s,encoding='utf-8')
# Normalize static skip-link text after the deterministic refactor.
for p in root.rglob('*.html'):
    if '.git' in p.parts: continue
    s=p.read_text(encoding='utf-8')
    if p.name.startswith('en-') or p.as_posix() in {'en.html'}:
        s=s.replace('>پرش به محتوای اصلی</a>','>Skip to content</a>')
    p.write_text(s,encoding='utf-8')
subprocess.run([sys.executable,'tools/discovery_sync.py'],check=True)
subprocess.run([sys.executable,'scripts/site-refactor.py'],check=True)
for p in root.rglob('*.html'):
    if '.git' in p.parts: continue
    s=p.read_text(encoding='utf-8')
    if p.name.startswith('en-') or p.as_posix()=='en.html': s=s.replace('>پرش به محتوای اصلی</a>','>Skip to content</a>')
    p.write_text(s,encoding='utf-8')
print('POLISH_OK')
