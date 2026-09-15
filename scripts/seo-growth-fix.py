from pathlib import Path
from html.parser import HTMLParser
import re

BASE='https://mowhmmdh.github.io'
ROOT=Path('.')
PERSON='Mohammad Hossein Asgari Somarin'

# SEO growth pass intentionally operates only on published HTML.
# Automation source files are never rewritten by content sanitizers.
EN_NAME=re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar\w*)+',re.I)
EN_SHORT=re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?\b(?!\s+Somar\w*)',re.I)
FA_NAME=re.compile(r'(محمدحسین\s*عسگری\s*ثمرین)(?:\s*ثمرین)+')

changed=[]
for path in sorted(ROOT.rglob('*.html')):
    if '.git' in path.parts or '.github' in path.parts: continue
    try: text=path.read_text(encoding='utf-8',errors='replace')
    except Exception: continue
    original=text
    text=EN_NAME.sub(PERSON,text)
    text=EN_SHORT.sub(PERSON,text)
    text=FA_NAME.sub('محمدحسین عسگری ثمرین',text)
    if text!=original:
        path.write_text(text,encoding='utf-8'); changed.append(path.as_posix())
print(f'SEO growth metadata normalized with canonical identity: {len(changed)} HTML files')
