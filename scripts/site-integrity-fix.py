from pathlib import Path
import json
import re

ROOT = Path('.')

JSONLD = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)


def has_standalone_breadcrumb(text: str) -> bool:
    for m in JSONLD.finditer(text):
        raw = m.group(2).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, dict) and data.get('@type') == 'BreadcrumbList':
            return True
    return False


def clean_jsonld(text: str) -> str:
    # Keep exactly one canonical BreadcrumbList. If a page already has the
    # dedicated breadcrumb JSON-LD block, remove only duplicate copies nested
    # in an @graph. Never delete the only BreadcrumbList from a page.
    standalone = has_standalone_breadcrumb(text)
    if not standalone:
        return text

    def repl(match):
        raw = match.group(2).strip()
        try:
            data = json.loads(raw)
        except Exception:
            return match.group(0)
        if isinstance(data, dict) and isinstance(data.get('@graph'), list):
            filtered = [item for item in data['@graph'] if not (isinstance(item, dict) and item.get('@type') == 'BreadcrumbList')]
            if len(filtered) == len(data['@graph']):
                return match.group(0)
            data['@graph'] = filtered
            return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)
        return match.group(0)

    return JSONLD.sub(repl, text)


changed = 0
for path in ROOT.rglob('*.html'):
    if '.git' in path.parts:
        continue
    text = path.read_text(encoding='utf-8', errors='replace')
    original = text
    text = clean_jsonld(text)
    text = text.replace('href="/en-blog/"', 'href="/en-blog.html"')
    text = text.replace('href="/en-vintech/"', 'href="/en-vintech.html"')
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed += 1

print(f'Site integrity normalization updated {changed} HTML pages.')
