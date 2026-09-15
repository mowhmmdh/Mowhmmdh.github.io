from pathlib import Path
import re

ROOT = Path('.')
CANONICAL_EN = 'Mohammad Hossein Asgari Somarin'
CANONICAL_FA = 'محمدحسین عسگری ثمرین'
TEXT_EXTENSIONS = {'.html', '.md', '.txt', '.json', '.js', '.css', '.xml', '.yml', '.yaml', '.py'}
EN_NAME = re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar\w*)+', re.I)
EN_SHORT = re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?\b(?!\s+Somar\w*)', re.I)
FA_DUP = re.compile(r'(محمدحسین\s*عسگری\s*ثمرین)(?:\s*ثمرین)+')

changed = []
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or '.git' in path.parts or '.github' in path.parts:
        continue
    if path.suffix.lower() not in TEXT_EXTENSIONS:
        continue
    try:
        text = path.read_text(encoding='utf-8', errors='replace')
    except Exception:
        continue
    original = text
    text = EN_NAME.sub(CANONICAL_EN, text)
    text = EN_SHORT.sub(CANONICAL_EN, text)
    text = FA_DUP.sub(CANONICAL_FA, text)
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append(path.as_posix())

print(f'Canonical identity sync changed {len(changed)} files')
for path in changed[:100]:
    print(path)
