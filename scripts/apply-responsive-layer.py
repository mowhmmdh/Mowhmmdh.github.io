from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
needle = '<link rel="stylesheet" href="/assets/responsive-fix-2026.css">'
changed = []
for path in ROOT.rglob('*.html'):
    if '.git' in path.parts:
        continue
    text = path.read_text(encoding='utf-8')
    if needle in text:
        continue
    marker = '</head>'
    if marker not in text:
        continue
    text = text.replace(marker, f'  {needle}</head>', 1)
    path.write_text(text, encoding='utf-8')
    changed.append(str(path.relative_to(ROOT)))
print(f'Updated {len(changed)} HTML files')
for item in changed:
    print(item)
