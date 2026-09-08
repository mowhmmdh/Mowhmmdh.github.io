from pathlib import Path
import re

BASE = "https://mowhmmdh.github.io"
root = Path('.')

pairs = {
    'index.html': 'en.html',
    'about.html': 'en-about.html',
    'services.html': 'en-services.html',
    'projects.html': 'en-projects.html',
    'linkedin.html': 'en-linkedin.html',
    'vintech.html': 'en-vintech.html',
    'blog/index.html': 'en-blog.html',
}
for fa in sorted((root / 'blog').glob('*.html')):
    if fa.name == 'index.html':
        continue
    en = root / 'en-blog' / fa.name
    if en.exists():
        pairs[fa.as_posix()] = en.as_posix()
        pairs[en.as_posix()] = fa.as_posix()
for fa in sorted((root / 'vintech').glob('*.html')):
    en = root / 'en-vintech' / fa.name
    if en.exists():
        pairs[fa.as_posix()] = en.as_posix()
        pairs[en.as_posix()] = fa.as_posix()

pairs.update({v: k for k, v in list(pairs.items())})

def canonical(path: str) -> str:
    if path == 'index.html':
        return BASE + '/'
    if path == 'blog/index.html':
        return BASE + '/blog/'
    return BASE + '/' + path

def normalize(path: str) -> None:
    p = root / path
    text = p.read_text(encoding='utf-8')
    other = pairs.get(path)
    if not other or not (root / other).exists():
        return
    fa = not path.startswith(('en-', 'en-blog/', 'en-vintech/'))
    lang = 'fa-IR' if fa else 'en-US'
    other_lang = 'en' if fa else 'fa-IR'
    own = canonical(path)
    other_url = canonical(other)
    links = (
        f'<link rel="alternate" hreflang="{lang}" href="{own}">\n'
        f'<link rel="alternate" hreflang="{other_lang}" href="{other_url}">\n'
    )
    if path in ('index.html', 'en.html'):
        links += f'<link rel="alternate" hreflang="x-default" href="{BASE}/">\n'
    pattern = r'\s*<link\s+[^>]*rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>\s*'
    new = re.sub(pattern, '\n', text, flags=re.I)
    if '</head>' not in new.lower():
        return
    new = re.sub(r'\n{3,}', '\n\n', new)
    new = new.replace('</head>', links + '</head>', 1)
    if new != text:
        p.write_text(new, encoding='utf-8')

for path in sorted(pairs):
    if (root / path).exists():
        normalize(path)
print(f"SEO language pairs synchronized: {len(pairs)//2}")
