from pathlib import Path
import re
ROOT=Path('.')
pat=re.compile(r'<link\b[^>]*href=["\']/assets/vintech\.css["\'][^>]*>\s*',re.I)
for p in ROOT.rglob('*.html'):
 if '.git' in p.parts or '.github' in p.parts: continue
 rel=p.as_posix(); is_vt=rel.startswith(('vintech/','en-vintech/')) or p.name in {'vintech.html','en-vintech.html'}
 if not is_vt: continue
 s=p.read_text(encoding='utf-8',errors='replace'); m=pat.findall(s)
 if len(m)==1: continue
 if len(m)>1:
  first=True
  s=pat.sub(lambda x: x.group(0) if first and not (first:=False) else '',s)
 else:
  s=s.replace('</head>','<link rel="stylesheet" href="/assets/vintech.css">\n</head>',1)
 p.write_text(s,encoding='utf-8')
print('VinTech stylesheet normalization complete')

# Final normalization is intentionally idempotent.
