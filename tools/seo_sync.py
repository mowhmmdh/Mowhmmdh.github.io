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
for fa in sorted((root / 'vintech').rglob('*.html')):
    en = root / 'en-vintech' / fa.relative_to(root / 'vintech')
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

def default_url(path: str, other: str) -> str:
    fa_path = path if not path.startswith(('en-', 'en-blog/', 'en-vintech/')) else other
    return canonical(fa_path)

def remove_external_fonts(text: str) -> str:
    text = re.sub(r'\s*<link\s+[^>]*href=["\']https://fonts\.googleapis\.com[^"\']*["\'][^>]*>', '', text, flags=re.I)
    text = re.sub(r'\s*<link\s+[^>]*href=["\']https://fonts\.gstatic\.com[^"\']*["\'][^>]*>', '', text, flags=re.I)
    return text

def normalize(path: str) -> None:
    p = root / path
    text = remove_external_fonts(p.read_text(encoding='utf-8'))
    other = pairs.get(path)
    if not other or not (root / other).exists():
        if text != p.read_text(encoding='utf-8'):
            p.write_text(text, encoding='utf-8')
        return

    fa = not path.startswith(('en-', 'en-blog/', 'en-vintech/'))
    lang = 'fa-IR' if fa else 'en'
    other_lang = 'en' if fa else 'fa-IR'
    own = canonical(path)
    other_url = canonical(other)
    x_default = default_url(path, other)
    links = (
        f'<link rel="alternate" hreflang="{lang}" href="{own}">\n'
        f'<link rel="alternate" hreflang="{other_lang}" href="{other_url}">\n'
        f'<link rel="alternate" hreflang="x-default" href="{x_default}">\n'
    )
    pattern = r'\s*<link\s+[^>]*rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>\s*'
    new = re.sub(pattern, '\n', text, flags=re.I)
    if '</head>' not in new.lower():
        return
    new = re.sub(r'\n{3,}', '\n\n', new)
    new = new.replace('</head>', links + '</head>', 1)
    if new != p.read_text(encoding='utf-8'):
        p.write_text(new, encoding='utf-8')

for path in sorted(root.rglob('*.html')):
    if '.git' in path.parts or path.name == '404.html':
        continue
    normalize(path.relative_to(root).as_posix())
print(f"SEO metadata synchronized: {len(pairs)//2} language pairs; external font requests removed")
