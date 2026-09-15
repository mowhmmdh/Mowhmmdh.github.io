from pathlib import Path
import json
import re

ROOT = Path('.')
FULL_EN = 'Mohammad Hossein Asgari Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarini Somarin'
FULL_FA = 'محمدحسین عسگری ثمرین'
EN_IDENTITY = re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar(?:ini|in))+(?=\s|[<>,.;:!?/\"\'\)\]]|$)', re.I)
EN_SHORT = re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?!\s+Somar(?:ini|in)\b)', re.I)
FA_DUP = re.compile(r'(محمدحسین عسگری ثمرین)(?:\s*ثمرین)+')
JSONLD = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)
TEXT_EXTENSIONS = {'.html','.md','.txt','.json','.js','.css','.xml','.yml','.yaml','.py'}
COMMON_CSS = ('/assets/page-experience-2026.css','/assets/site-master-2026.css','/assets/social-fix-2026.css','/assets/site-final-fix-2026.css')
VIN_CSS = '/assets/vintech-motion-fix-2026-v2.css'
VIN_JS = '/assets/modern-ui-2026.js'

def normalize_identity(text):
    text = EN_IDENTITY.sub(FULL_EN, text)
    text = EN_SHORT.sub(FULL_EN, text)
    return FA_DUP.sub(FULL_FA, text)

def clean_jsonld(text):
    def repl(match):
        raw = match.group(2).strip()
        try: data = json.loads(raw)
        except Exception: return match.group(0)
        if isinstance(data, dict) and isinstance(data.get('@graph'), list):
            seen = False; graph = []
            for item in data['@graph']:
                if isinstance(item, dict) and item.get('@type') == 'BreadcrumbList':
                    if seen: continue
                    seen = True
                graph.append(item)
            data['@graph'] = graph
            raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        return match.group(1) + raw + match.group(3)
    return JSONLD.sub(repl, text)

changed = []
for p in sorted(ROOT.rglob('*')):
    if not p.is_file() or '.git' in p.parts or p.suffix.lower() not in TEXT_EXTENSIONS: continue
    s = p.read_text(encoding='utf-8', errors='ignore'); original = s
    s = normalize_identity(s)
    if p.suffix.lower() == '.html':
        s = clean_jsonld(s).replace('href="/en-blog/"','href="/en-blog.html"').replace('href="/en-vintech/"','href="/en-vintech.html"')
        is_vintech = p.name in {'vintech.html','en-vintech.html'} or 'vintech' in p.parts
        if '</head>' in s:
            for css in COMMON_CSS:
                if css not in s: s = s.replace('</head>', f'  <link rel="stylesheet" href="{css}">\n</head>', 1)
            if is_vintech and VIN_CSS not in s: s = s.replace('</head>', f'  <link rel="stylesheet" href="{VIN_CSS}">\n</head>', 1)
            if is_vintech and VIN_JS not in s: s = s.replace('</head>', f'  <script src="{VIN_JS}" defer></script>\n</head>', 1)
    if s != original:
        p.write_text(s, encoding='utf-8'); changed.append(p.as_posix())
print(f'site integrity sync complete: {len(changed)} files changed')
for path in changed: print(path)
