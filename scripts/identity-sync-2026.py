from pathlib import Path
import re

ROOT = Path('.')
CANONICAL_EN = 'Mohammad Hossein Asgari Somarini Somarini Somarini Somarini Somarin'
CANONICAL_FA = 'محمدحسین عسگری ثمرین'

# Match the canonical name, legacy spellings, and accidental repeated surname chains.
EN_VARIANTS = re.compile(
    r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar(?:in|ini))+(?:\s+Somar(?:in|ini))*',
    re.I,
)
EN_SHORT = re.compile(
    r'Mohammad\s+Hossein\s+Asgar(?:i)?(?!\s+Somar(?:in|ini)\b)',
    re.I,
)
FA_DUP = re.compile(r'(محمدحسین عسگری ثمرین)(?:\s*ثمرین)+')

TEXT_EXT = {
    '.html', '.css', '.js', '.json', '.jsonld', '.txt', '.md', '.xml',
    '.webmanifest', '.yml', '.yaml', '.py'
}

changed = []
for p in sorted(ROOT.rglob('*')):
    if not p.is_file() or '.git' in p.parts or p.suffix.lower() not in TEXT_EXT:
        continue
    try:
        s = p.read_text(encoding='utf-8')
    except Exception:
        continue
    original = s
    s = EN_VARIANTS.sub(CANONICAL_EN, s)
    s = EN_SHORT.sub(CANONICAL_EN, s)
    s = FA_DUP.sub(CANONICAL_FA, s)
    if s != original:
        p.write_text(s, encoding='utf-8')
        changed.append(p.as_posix())

print(f'Canonical identity sync changed {len(changed)} files')
for p in changed:
    print(p)
