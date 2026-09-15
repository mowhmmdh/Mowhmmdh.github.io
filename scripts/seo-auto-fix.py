from pathlib import Path
from html.parser import HTMLParser
import re

ROOT=Path('.')
BASE='https://mowhmmdh.github.io'
PERSON_FA='محمدحسین عسگری ثمرین'
PERSON_EN='Mohammad Hossein Asgari Somarini Somarin'

EN_CORRUPTION=re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar\w*)+',re.I)
EN_SHORT=re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?\b(?!\s+Somar\w*)',re.I)
FA_CORRUPTION=re.compile(r'(محمدحسین\s*عسگری\s*ثمرین)(?:\s*ثمرین)+')

# This repair utility only touches published HTML. It never rewrites Python,
# workflow, CSS or JavaScript source files, preventing recursive corruption.
changed=[]
for path in sorted(ROOT.rglob('*.html')):
    if '.git' in path.parts or '.github' in path.parts: continue
    try: original=path.read_text(encoding='utf-8',errors='replace')
    except Exception: continue
    text=EN_CORRUPTION.sub(PERSON_EN,original)
    text=EN_SHORT.sub(PERSON_EN,text)
    text=FA_CORRUPTION.sub(PERSON_FA,text)
    if text!=original:
        path.write_text(text,encoding='utf-8'); changed.append(path.as_posix())
print(f'SEO auto-fix: canonical identities normalized in {len(changed)} HTML files')
