from pathlib import Path
import re
BASE='https://mowhmmdh.github.io'; root=Path('.')
pairs={'index.html':'en.html','about.html':'en-about.html','services.html':'en-services.html','projects.html':'en-projects.html','linkedin.html':'en-linkedin.html','vintech.html':'en-vintech.html','blog/index.html':'en-blog.html'}
for fa in sorted((root/'blog').glob('*.html')):
    if fa.name!='index.html':
        en=root/'en-blog'/fa.name
        if en.exists(): pairs[fa.as_posix()]=en.as_posix(); pairs[en.as_posix()]=fa.as_posix()
for fa in sorted((root/'vintech').rglob('*.html')):
    en=root/'en-vintech'/fa.relative_to(root/'vintech')
    if en.exists(): pairs[fa.as_posix()]=en.as_posix(); pairs[en.as_posix()]=fa.as_posix()
pairs.update({v:k for k,v in list(pairs.items())})
def canonical(path):
    if path=='index.html': return BASE+'/'
    if path=='blog/index.html': return BASE+'/blog/'
    return BASE+'/'+path
def is_en(path): return path=='en.html' or path.startswith(('en-','en-blog/','en-vintech/'))
def remove_external_fonts(text):
    text=re.sub(r'\s*<link\s+[^>]*href=["\']https://fonts\.googleapis\.com[^"\']*["\'][^>]*>','',text,flags=re.I)
    return re.sub(r'\s*<link\s+[^>]*href=["\']https://fonts\.gstatic\.com[^"\']*["\'][^>]*>','',text,flags=re.I)
def normalize(path):
    p=root/path; original=p.read_text(encoding='utf-8'); text=remove_external_fonts(original); other=pairs.get(path)
    if not other or not (root/other).exists():
        if text!=original:p.write_text(text,encoding='utf-8')
        return
    en=is_en(path); lang='en' if en else 'fa-IR'; other_lang='fa-IR' if en else 'en'; own=canonical(path); other_url=canonical(other); x_default=BASE+'/'
    links=f'<link rel="alternate" hreflang="{lang}" href="{own}">\n<link rel="alternate" hreflang="{other_lang}" href="{other_url}">\n<link rel="alternate" hreflang="x-default" href="{x_default}">\n'
    pattern=r'\s*<link\s+[^>]*rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>\s*'
    new=re.sub(pattern,'\n',text,flags=re.I)
    if '</head>' not in new.lower(): return
    new=re.sub(r'\n{3,}','\n\n',new).replace('</head>',links+'</head>',1)
    if new!=original:p.write_text(new,encoding='utf-8')
for path in sorted(root.rglob('*.html')):
    if '.git' not in path.parts and path.name!='404.html': normalize(path.relative_to(root).as_posix())
print(f'SEO metadata synchronized: {len(pairs)//2} language pairs; external font requests removed')
