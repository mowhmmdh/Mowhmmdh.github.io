from pathlib import Path
import json
import re

ROOT = Path('.')
FULL_EN = 'Mohammad Hossein Asgari Somarin'
FULL_FA = 'محمدحسین عسگری ثمرین'
TEXT_EXTENSIONS = {'.html', '.md', '.txt', '.json', '.js', '.css', '.xml', '.yml', '.yaml', '.py'}

# Normalize every historical spelling/corruption to one canonical identity.
EN_NAME = re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar\w*)+', re.I)
EN_SHORT = re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?\b(?!\s+Somar\w*)', re.I)
EN_REPEAT = re.compile(r'(Mohammad\s+Hossein\s+Asgari\s+Somarin)(?:\s+Somarin)+', re.I)
FA_REPEAT = re.compile(r'(محمدحسین\s*عسگری\s*ثمرین)(?:\s*ثمرین)+')
JSONLD = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)
PORTFOLIO_CSS = re.compile(r'\s*<link[^>]+href=["\']/assets/portfolio-command-center-2026\.css["\'][^>]*>', re.I)

COMMON_CSS = (
    '/assets/page-experience-2026.css',
    '/assets/site-master-2026.css',
    '/assets/social-fix-2026.css',
    '/assets/site-final-fix-2026.css',
)
VIN_CSS = '/assets/vintech-motion-fix-2026-v2.css'
VIN_JS = '/assets/modern-ui-2026.js'


def normalize_identity(text: str) -> str:
    text = EN_NAME.sub(FULL_EN, text)
    text = EN_SHORT.sub(FULL_EN, text)
    text = EN_REPEAT.sub(FULL_EN, text)
    text = FA_REPEAT.sub(FULL_FA, text)
    return text


def normalize_jsonld(text: str) -> str:
    def repl(match: re.Match) -> str:
        raw = match.group(2).strip()
        try:
            data = json.loads(raw)
        except Exception:
            return match.group(1) + normalize_identity(raw) + match.group(3)

        def walk(value):
            if isinstance(value, dict):
                for key, item in list(value.items()):
                    if isinstance(item, str):
                        item = normalize_identity(item)
                        if key == 'url':
                            item = item.replace('/en-blog/', '/en-blog.html')
                            item = item.replace('/en-vintech/', '/en-vintech.html')
                        value[key] = item
                    else:
                        walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)
        walk(data)
        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)
    return JSONLD.sub(repl, text)


def ensure_stylesheet(text: str, href: str) -> str:
    if href in text or '</head>' not in text.lower():
        return text
    return text.replace('</head>', f'<link rel="stylesheet" href="{href}">\n</head>', 1)


def ensure_vintech_js(text: str) -> str:
    if VIN_JS in text or '</body>' not in text.lower():
        return text
    return text.replace('</body>', f'<script src="{VIN_JS}" defer></script>\n</body>', 1)


changed = []
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or '.git' in path.parts or path.suffix.lower() not in TEXT_EXTENSIONS:
        continue
    try:
        original = path.read_text(encoding='utf-8', errors='replace')
    except Exception:
        continue

    text = normalize_identity(original)
    if path.suffix.lower() == '.html':
        # The experimental command-center layer is intentionally not global; it
        # previously overrode page-specific cards/navigation. Keep the final
        # visual system as the single last global layer instead.
        text = PORTFOLIO_CSS.sub('', text)
        text = normalize_jsonld(text)
        text = text.replace('href="/en-blog/"', 'href="/en-blog.html"')
        text = text.replace('href="/en-vintech/"', 'href="/en-vintech.html"')
        for href in COMMON_CSS:
            text = ensure_stylesheet(text, href)
        is_vintech = path.name in {'vintech.html', 'en-vintech.html'} or 'vintech' in path.parts
        if is_vintech:
            text = ensure_stylesheet(text, VIN_CSS)
            text = ensure_vintech_js(text)

    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append(str(path))

print(f'Integrity sync: normalized {len(changed)} files')
for item in changed[:100]:
    print(item)
