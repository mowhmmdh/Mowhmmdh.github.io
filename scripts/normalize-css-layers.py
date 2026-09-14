from pathlib import Path
import re
import sys

LEGACY = {
    '/assets/visual-final-pass-2026.css',
    '/assets/ultimate-ui-2026.css',
    '/assets/final-appearance-2026.css',
    '/assets/content-theme-2026.css',
    '/assets/visual-master-2026.css',
    '/assets/next-gen-2026.css',
    '/assets/site-final-polish.css',
}
CSS_LINK = re.compile(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']([^"\']+)["\']\s*/?>', re.I)
SCRIPT = re.compile(r'<script\b([^>]*)src=["\']([^"\']+)["\'][^>]*>\s*</script>', re.I | re.S)

pages = [p for p in Path('.').rglob('*.html') if '.git' not in p.parts]
errors=[]
for path in pages:
    text=path.read_text(encoding='utf-8',errors='ignore'); rel=path.as_posix()
    links=[m.group(1) for m in CSS_LINK.finditer(text)]
    for legacy in LEGACY:
        if legacy in links: errors.append(f'{rel}: legacy stylesheet still linked: {legacy}')
    if links.count('/assets/site-bundle.css')!=1: errors.append(f'{rel}: expected exactly one site-bundle.css link, found {links.count("/assets/site-bundle.css")}')
    is_vt=rel.startswith(('vintech/','en-vintech/')) or path.name in {'vintech.html','en-vintech.html'}
    if is_vt and links.count('/assets/vintech.css')!=1: errors.append(f'{rel}: VinTech page must load exactly one vintech.css')
    if not is_vt and '/assets/vintech.css' in links: errors.append(f'{rel}: personal page must not load vintech.css')
    if not is_vt and any('modern-ui-2026.js' in x for x in text.split()): errors.append(f'{rel}: modern-ui-2026.js must not load outside VinTech')

print(f'HTML pages checked: {len(pages)}')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print('CSS layer validation passed; no files modified.')
