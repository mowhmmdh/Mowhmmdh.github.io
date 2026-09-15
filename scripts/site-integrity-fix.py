from pathlib import Path
import json
import re

ROOT = Path('.')
FULL_EN = 'Mohammad Hossein Asgar Somarin'
LEGACY_EN = 'Mohammad Hossein Asgari'
FULL_FA = 'محمدحسین عسگری ثمرین'
LEGACY_FA_DUP = 'محمدحسین عسگری ثمرین ثمرین'
JSONLD = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)
CSS = '/assets/page-experience-2026.css'
MASTER_CSS = '/assets/site-master-2026.css'


def has_standalone_breadcrumb(text: str) -> bool:
    for m in JSONLD.finditer(text):
        try:
            data = json.loads(m.group(2).strip())
        except Exception:
            continue
        if isinstance(data, dict) and data.get('@type') == 'BreadcrumbList':
            return True
    return False


def clean_jsonld(text: str) -> str:
    if not has_standalone_breadcrumb(text):
        return text

    def repl(match):
        try:
            data = json.loads(match.group(2).strip())
        except Exception:
            return match.group(0)
        if isinstance(data, dict) and isinstance(data.get('@graph'), list):
            filtered = [item for item in data['@graph'] if not (isinstance(item, dict) and item.get('@type') == 'BreadcrumbList')]
            if len(filtered) != len(data['@graph']):
                data['@graph'] = filtered
                return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)
        return match.group(0)

    return JSONLD.sub(repl, text)


def ensure_experience_css(text: str) -> str:
    if '<head' not in text.lower():
        return text
    if CSS not in text:
        text = text.replace('</head>', f'<link rel="stylesheet" href="{CSS}">\n</head>', 1)
    return text


def ensure_master_css(text: str) -> str:
    if '<head' not in text.lower():
        return text
    if MASTER_CSS in text:
        return text
    # Final stylesheet: normalizes legacy/page-specific layers without changing content or URLs.
    return text.replace('</head>', f'<link rel="stylesheet" href="{MASTER_CSS}">\n</head>', 1)


changed = 0
for path in ROOT.rglob('*.html'):
    if '.git' in path.parts:
        continue
    text = path.read_text(encoding='utf-8', errors='replace')
    original = text
    text = clean_jsonld(text)
    text = text.replace('href="/en-blog/"', 'href="/en-blog.html"')
    text = text.replace('href="/en-vintech/"', 'href="/en-vintech.html"')
    text = text.replace(LEGACY_EN, FULL_EN)
    text = text.replace(LEGACY_FA_DUP, FULL_FA)
    text = ensure_experience_css(text)
    text = ensure_master_css(text)
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed += 1

print(f'Site integrity normalization updated {changed} HTML pages.')
