from pathlib import Path
import re, json

ROOT = Path('.')
FULL_EN = 'Mohammad Hossein Asgari Somarin'
LEGACY_EN_VARIANTS = (
    'Mohammad Hossein Asgar Somarin',
    'Mohammad Hossein Asgari',
    'Mohammad Hossein Asgar',
)
FULL_FA = 'محمدحسین عسگری ثمرین'
LEGACY_FA_VARIANTS = ('محمدحسین عسگری ثمرین ثمرین',)
JSONLD = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)
CSS = '/assets/page-experience-2026.css'
MASTER_CSS = '/assets/site-master-2026.css'
SOCIAL_CSS = '/assets/social-fix-2026.css'
FINAL_CSS = '/assets/site-final-fix-2026.css'
VIN_MOTION_CSS = '/assets/vintech-motion-fix-2026-v2.css'
VIN_JS = '/assets/modern-ui-2026.js'


def clean_jsonld(text):
    def repl(m):
        raw = m.group(2).strip()
        try:
            data = json.loads(raw)
            if isinstance(data, dict) and isinstance(data.get('@graph'), list):
                seen = False
                graph = []
                for item in data['@graph']:
                    if isinstance(item, dict) and item.get('@type') == 'BreadcrumbList':
                        if seen:
                            continue
                        seen = True
                    graph.append(item)
                data['@graph'] = graph
                raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
            return m.group(1) + raw + m.group(3)
        except Exception:
            return m.group(0)
    return JSONLD.sub(repl, text)


for p in sorted(ROOT.rglob('*.html')):
    if '.git' in p.parts:
        continue
    s = p.read_text(encoding='utf-8', errors='ignore')
    original = s

    for old in LEGACY_EN_VARIANTS:
        s = s.replace(old, FULL_EN)
    for old in LEGACY_FA_VARIANTS:
        s = s.replace(old, FULL_FA)

    s = clean_jsonld(s)
    s = s.replace('href="/en-blog/"', 'href="/en-blog.html"')
    s = s.replace('href="/en-vintech/"', 'href="/en-vintech.html"')

    is_vintech = 'vintech' in p.parts or p.name in {'vintech.html', 'en-vintech.html'}
    if '</head>' in s:
        for css in (CSS, MASTER_CSS, SOCIAL_CSS, FINAL_CSS):
            if css not in s:
                s = s.replace('</head>', f'  <link rel="stylesheet" href="{css}">\n</head>', 1)
        if is_vintech:
            if VIN_MOTION_CSS not in s:
                s = s.replace('</head>', f'  <link rel="stylesheet" href="{VIN_MOTION_CSS}">\n</head>', 1)
            if VIN_JS not in s:
                s = s.replace('</head>', f'  <script src="{VIN_JS}" defer></script>\n</head>', 1)

    if s != original:
        p.write_text(s, encoding='utf-8')

print('site integrity sync complete')
