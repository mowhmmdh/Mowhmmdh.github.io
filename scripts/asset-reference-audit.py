from pathlib import Path
import re

ROOT = Path('.')
errors=[]
patterns=[
    re.compile(r'(?:href|src)=["\'](/(?:assets|images|fonts)/[^"\'?#]+)'),
    re.compile(r'url\(["\']?(/(?:assets|images|fonts)/[^"\')?#]+)'),
    re.compile(r'["\'](/assets/[^"\']+)["\']'),
]
for path in ROOT.rglob('*'):
    if not path.is_file() or '.git' in path.parts:
        continue
    if path.suffix.lower() not in {'.html','.css','.js'}:
        continue
    try:
        text=path.read_text(encoding='utf-8',errors='ignore')
    except Exception:
        continue
    if 'fonts.googleapis.com' in text or 'fonts.gstatic.com' in text:
        errors.append(f'{path}: external Google Fonts dependency')
    for pattern in patterns:
        for ref in pattern.findall(text):
            target=ROOT/ref.lstrip('/')
            if not target.exists():
                errors.append(f'{path}: missing local asset {ref}')

if errors:
    print('\n'.join(sorted(set(errors))))
    raise SystemExit(1)
print('Asset reference audit passed.')
