from pathlib import Path
import re

REMOVE = {'/assets/visual-final-pass-2026.css','/assets/ultimate-ui-2026.css','/assets/final-appearance-2026.css','/assets/content-theme-2026.css','/assets/visual-master-2026.css','/assets/next-gen-2026.css'}
SKIP_MARKERS = ('vintech.css','vintech-visual-final-2026.css','vintech-experience-2026.css')
LINK = re.compile(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']([^"\']+)["\']\s*/?>', re.I)
changed=[]
for path in Path('.').rglob('*.html'):
    if '.git' in path.parts: continue
    text=path.read_text(encoding='utf-8')
    if any(m in text for m in SKIP_MARKERS): continue
    old=text
    text=LINK.sub(lambda m: '' if m.group(1) in REMOVE else m.group(0), text)
    if '/assets/site-final-polish.css' not in text:
        needle='<link rel="stylesheet" href="/assets/stable-ui-2026.css">'
        if needle in text: text=text.replace(needle, needle+'\n<link rel="stylesheet" href="/assets/site-final-polish.css">',1)
    text=text.replace('font-display:swap','font-display:optional')
    if text!=old:
        path.write_text(text,encoding='utf-8'); changed.append(str(path))
print(f'normalized {len(changed)} HTML files')
for p in changed: print(p)
