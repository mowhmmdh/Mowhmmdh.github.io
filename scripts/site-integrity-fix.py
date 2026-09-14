from pathlib import Path
import json
import re

ROOT = Path('.')


def clean_jsonld(text: str) -> str:
    pattern = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)

    def repl(match):
        raw = match.group(2).strip()
        try:
            data = json.loads(raw)
        except Exception:
            return match.group(0)
        changed = False
        if isinstance(data, dict) and isinstance(data.get('@graph'), list):
            before = len(data['@graph'])
            data['@graph'] = [item for item in data['@graph'] if not (isinstance(item, dict) and item.get('@type') == 'BreadcrumbList')]
            changed = len(data['@graph']) != before
        elif isinstance(data, dict) and data.get('@type') == 'BreadcrumbList':
            return ''
        if not changed:
            return match.group(0)
        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)

    return pattern.sub(repl, text)


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
