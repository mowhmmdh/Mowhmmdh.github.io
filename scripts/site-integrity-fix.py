from pathlib import Path
import json
import re

ROOT=Path('.')
FULL_EN='Mohammad Hossein Asgari Somarin'
FULL_FA='محمدحسین عسگری ثمرین'
BASE='https://mowhmmdh.github.io'
TEXT_EXTENSIONS={'.html','.md','.txt','.json','.xml'}
EN_NAME=re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?(?:\s+Somar\w*)+',re.I)
EN_SHORT=re.compile(r'Mohammad\s+Hossein\s+Asgar(?:i)?\b(?!\s+Somar\w*)',re.I)
EN_REPEAT=re.compile(r'(Mohammad\s+Hossein\s+Asgari\s+Somarin)(?:\s+Somarin)+',re.I)
FA_REPEAT=re.compile(r'(محمدحسین\s*عسگری\s*ثمرین)(?:\s*ثمرین)+')
JSONLD=re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',re.I|re.S)
PORTFOLIO_CSS=re.compile(r'\s*<link[^>]+href=["\']/assets/portfolio-command-center-2026\.css["\'][^>]*>',re.I)
MODERN_UI=re.compile(r'\s*<script\b[^>]*src=["\']/assets/modern-ui-2026\.js["\'][^>]*>\s*</script>',re.I)
COMMON_CSS=('/assets/page-experience-2026.css','/assets/site-master-2026.css','/assets/social-fix-2026.css','/assets/site-final-fix-2026.css','/assets/navigation-fix-2026.css')
HOME_CSS='/assets/home-finish-2026.css'
VIN_CSS='/assets/vintech.css'
VIN_MOTION_CSS='/assets/vintech-motion-fix-2026-v2.css'
VIN_JS='/assets/modern-ui-2026.js'

def normalize_identity(text):
    text=EN_NAME.sub(FULL_EN,text); text=EN_SHORT.sub(FULL_EN,text); text=EN_REPEAT.sub(FULL_EN,text); return FA_REPEAT.sub(FULL_FA,text)

def normalize_jsonld(text):
    def repl(m):
        raw=m.group(2).strip()
        try: data=json.loads(raw)
        except Exception: return m.group(1)+normalize_identity(raw)+m.group(3)
        def walk(v):
            if isinstance(v,dict):
                for k,item in list(v.items()):
                    if isinstance(item,str):
                        item=normalize_identity(item)
                        if k=='url': item=item.replace('/en-blog/','/en-blog.html').replace('/en-vintech/','/en-vintech.html')
                        v[k]=item
                    else: walk(item)
            elif isinstance(v,list):
                for item in v: walk(item)
        walk(data); return m.group(1)+json.dumps(data,ensure_ascii=False,separators=(',',':'))+m.group(3)
    return JSONLD.sub(repl,text)

def ensure_stylesheet(text,href):
    if href in text or '</head>' not in text.lower(): return text
    return text.replace('</head>',f'<link rel="stylesheet" href="{href}">\n</head>',1)

def ensure_vin_js(text):
    if VIN_JS in text or '</body>' not in text.lower(): return text
    return text.replace('</body>',f'<script src="{VIN_JS}" defer></script>\n</body>',1)

def ensure_og_defaults(text):
    if '<head' not in text.lower() or '</head>' not in text.lower(): return text
    tm=re.search(r'<title[^>]*>(.*?)</title>',text,re.I|re.S); dm=re.search(r'<meta\s+name=["\']description["\'][^>]*content=["\'](.*?)["\'][^>]*>',text,re.I|re.S); cm=re.search(r'<link\s+rel=["\']canonical["\'][^>]*href=["\'](.*?)["\'][^>]*>',text,re.I|re.S)
    title=re.sub(r'\s+',' ',tm.group(1)).strip() if tm else FULL_EN; desc=re.sub(r'\s+',' ',dm.group(1)).strip() if dm else 'Professional portfolio covering network, infrastructure, security and IT operations.'; url=cm.group(1).strip() if cm else BASE+'/'
    adds=[]; esc_title=title.replace('"','&quot;'); esc_desc=desc.replace('"','&quot;')
    if not re.search(r'<meta\s+property=["\']og:title["\']',text,re.I): adds.append(f'<meta property="og:title" content="{esc_title}">')
    if not re.search(r'<meta\s+property=["\']og:description["\']',text,re.I): adds.append(f'<meta property="og:description" content="{esc_desc}">')
    if not re.search(r'<meta\s+property=["\']og:image["\']',text,re.I): adds.append(f'<meta property="og:image" content="{BASE}/images/profile.webp">')
    if not re.search(r'<meta\s+property=["\']og:url["\']',text,re.I): adds.append(f'<meta property="og:url" content="{url}">')
    if not re.search(r'<meta\s+property=["\']og:type["\']',text,re.I): adds.append('<meta property="og:type" content="website">')
    return text.replace('</head>','\n'.join(adds)+'\n</head>',1) if adds else text

changed=[]
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or '.git' in path.parts or '.github' in path.parts or path.suffix.lower() not in TEXT_EXTENSIONS: continue
    try: original=path.read_text(encoding='utf-8',errors='replace')
    except Exception: continue
    text=normalize_identity(original)
    if path.suffix.lower()=='.html':
        text=PORTFOLIO_CSS.sub('',text); text=normalize_jsonld(text); text=text.replace('href="/en-blog/"','href="/en-blog.html"').replace('href="/en-vintech/"','href="/en-vintech.html"'); text=ensure_og_defaults(text)
        is_vt=path.name in {'vintech.html','en-vintech.html'} or 'vintech' in path.parts
        if not is_vt:
            text=MODERN_UI.sub('',text)
            text= re.sub(r'\s*<link\b[^>]*href=["\']/assets/vintech-motion-fix-2026-v2\.css["\'][^>]*>\s*','',text,flags=re.I)
        else:
            text=ensure_stylesheet(text,VIN_CSS); text=ensure_stylesheet(text,VIN_MOTION_CSS); text=ensure_vin_js(text)
        for href in COMMON_CSS: text=ensure_stylesheet(text,href)
        if 'class="mh-home"' in text: text=ensure_stylesheet(text,HOME_CSS)
    if text!=original: path.write_text(text,encoding='utf-8'); changed.append(path.as_posix())
print(f'Integrity sync: normalized {len(changed)} files')
