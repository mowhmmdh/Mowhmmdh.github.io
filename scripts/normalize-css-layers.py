from pathlib import Path
import re
import sys

# This checker is intentionally validation-only. CSS generation belongs to
# site-refactor.py; this job must never prescribe or mutate the visual stack.
CSS_LINK = re.compile(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']([^"\']+)["\']\s*/?>', re.I)
SCRIPT_SRC = re.compile(r'<script\b[^>]*src=["\']([^"\']+)["\'][^>]*>', re.I)
pages = [p for p in Path('.').rglob('*.html') if '.git' not in p.parts]
errors=[]

for path in pages:
    text=path.read_text(encoding='utf-8',errors='ignore'); rel=path.as_posix()
    links=[m.group(1) for m in CSS_LINK.finditer(text)]
    if links.count('/assets/site-bundle.css') != 1:
        errors.append(f'{rel}: expected exactly one site-bundle.css link, found {links.count("/assets/site-bundle.css")}')
    is_vt=rel.startswith(('vintech/','en-vintech/')) or path.name in {'vintech.html','en-vintech.html'}
    if is_vt and links.count('/assets/vintech.css') != 1:
        errors.append(f'{rel}: VinTech page must load exactly one vintech.css')
    if not is_vt and '/assets/vintech.css' in links:
        errors.append(f'{rel}: personal page must not load vintech.css')
    if not is_vt and any('modern-ui-2026.js' in x for x in SCRIPT_SRC.findall(text)):
        errors.append(f'{rel}: modern-ui-2026.js must not load outside VinTech')

print(f'HTML pages checked: {len(pages)}')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print('CSS layer validation passed; no files modified.')
