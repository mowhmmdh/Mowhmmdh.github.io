from pathlib import Path
import re

ROOT = Path('.')
CANONICAL_EN = 'Mohammad Hossein Asgari Somarin'
CANONICAL_FA = 'محمدحسین عسگری ثمرین'
OLD_EN = re.compile(r'Mohammad Hossein Asgari Somarin(?! Somarin)')
OLD_EN_FULL = 'Mohammad Hossein Asgari Somarin'
OLD_FA_DUP = 'محمدحسین عسگری ثمرین'

TEXT_EXT = {'.html','.css','.js','.json','.jsonld','.txt','.md','.xml','.webmanifest','.yml','.yaml','.py'}
changed = []
for p in ROOT.rglob('*'):
    if not p.is_file() or '.git' in p.parts or p.suffix.lower() not in TEXT_EXT:
        continue
    try:
        s = p.read_text(encoding='utf-8')
    except Exception:
        continue
    original = s
    s = s.replace(OLD_EN_FULL, CANONICAL_EN)
    s = OLD_EN.sub(CANONICAL_EN, s)
    s = s.replace(OLD_FA_DUP, CANONICAL_FA)
    if s != original:
        p.write_text(s, encoding='utf-8')
        changed.append(p.as_posix())
print(f'Canonical identity sync changed {len(changed)} files')
for p in changed:
    print(p)
