from pathlib import Path
import re
from urllib.parse import quote

ROOT=Path('.'); BASE='https://mowhmmdh.github.io'
HTMLS=sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts)
CSS_LINK=re.compile(r'<link\b[^>]*rel=["\']stylesheet["\'][^>]*>',re.I)
IMG_RE=re.compile(r'<img\b([^>]*?)>',re.I)
SCRIPT_RE=re.compile(r'<script\b([^>]*)>',re.I)

def html_url(p):
 r=p.as_posix()
 if r=='index.html': return BASE+'/'
 if r.endswith('/index.html'): return BASE+'/'+r[:-10]
 return BASE+'/'+r

def lang_for(p):
 r=p.as_posix(); return 'en' if p.name.startswith('en-') or r.startswith(('en-blog/','en-vintech/')) or p.name=='en.html' else 'fa'

def equivalent(p):
 r=p.as_posix(); pairs={'index.html':'en.html','en.html':'index.html','about.html':'en-about.html','en-about.html':'about.html','authority.html':'en-authority.html','en-authority.html':'authority.html','projects.html':'en-projects.html','en-projects.html':'projects.html','services.html':'en-services.html','en-services.html':'services.html','press.html':'en-press.html','en-press.html':'press.html','linkedin.html':'en-linkedin.html','en-linkedin.html':'linkedin.html','blog/index.html':'en-blog.html','en-blog.html':'blog/index.html','vintech.html':'en-vintech.html','en-vintech.html':'vintech.html'}
 if r in pairs:return html_url(Path(pairs[r]))
 for a,b in [('blog/','en-blog/'),('en-blog/','blog/'),('vintech/','en-vintech/'),('en-vintech/','vintech/')]:
  if r.startswith(a): return BASE+'/'+b+r[len(a):]
 return None

def rewrite_css(css,src):
 def f(m):
  raw=m.group(1).strip().strip('"\'')
  if not raw or raw.startswith(('data:','http:','https:','//','#','/')): return m.group(0)
  try:
   rel=(src.parent/raw).resolve().relative_to(ROOT.resolve()).as_posix(); return 'url("/'+quote(rel,safe='/:._-()[]')+'")'
  except ValueError:return m.group(0)
 return re.sub(r'url\(\s*([^)]*?)\s*\)',f,css,flags=re.I)

css_paths=sorted(p for p in ROOT.rglob('*.css') if '.git' not in p.parts and p.as_posix() not in {'assets/site-bundle.css','assets/vintech.css'})
parts=['/* Production core CSS bundle. */']
for p in css_paths: parts.append(f'/* --- {p.as_posix()} --- */\n{rewrite_css(p.read_text(encoding="utf-8"),p)}')
(ROOT/'assets/site-bundle.css').write_text('\n\n'.join(parts)+'\n',encoding='utf-8')

def meta(t,n,v):
 pat=re.compile(r'<meta\s+name=["\']'+re.escape(n)+r'["\'][^>]*>',re.I); tag=f'<meta name="{n}" content="{v}">'
 return pat.sub(tag,t,count=1) if pat.search(t) else t.replace('</head>',tag+'</head>',1)

def process(t,p):
 lang=lang_for(p); direction='ltr' if lang=='en' else 'rtl'
 t=re.sub(r'<html\b([^>]*)>',lambda m:'<html'+re.sub(r'\s(?:lang|dir)=["\'][^"\']*["\']','',m.group(1),flags=re.I)+f' lang="{lang}" dir="{direction}">',t,count=1,flags=re.I)
 t=re.sub(r'<link\s+rel=["\']canonical["\'][^>]*>','',t,flags=re.I)
 t=re.sub(r'<link\s+rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>','',t,flags=re.I)
 had_v=bool(re.search(r'href=["\'][^"\']*vintech\.css',t,re.I)) or p.as_posix().startswith(('vintech/','en-vintech/')) or p.name in {'vintech.html','en-vintech.html'}
 t=CSS_LINK.sub('',t)
 t=t.replace('</head>','<link rel="stylesheet" href="/assets/site-bundle.css">'+('\n<link rel="stylesheet" href="/assets/vintech.css">' if had_v else '')+'</head>',1)
 if re.search(r'<meta\s+name=["\']viewport["\']',t,re.I): t=re.sub(r'<meta\s+name=["\']viewport["\'][^>]*>','<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',t,count=1,flags=re.I)
 else:t=t.replace('<head>','<head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',1)
 t=meta(t,'theme-color','#0b1220'); t=meta(t,'referrer','strict-origin-when-cross-origin'); t=meta(t,'robots','noindex,follow' if p.name=='404.html' else 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
 if p.name!='404.html':
  t=t.replace('</head>',f'<link rel="canonical" href="{html_url(p)}"></head>',1)
  alt=equivalent(p); links=[f'<link rel="alternate" hreflang="{("fa-IR" if lang=="fa" else "en")}" href="{html_url(p)}">']
  if alt:links.append(f'<link rel="alternate" hreflang="{("en" if lang=="fa" else "fa-IR")}" href="{alt}">')
  if p.name in {'index.html','en.html'}:links.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}/">')
  t=t.replace('</head>',''.join(links)+'</head>',1)
 t=t.replace('Mohammad Hossein Asgari Somarin','Mohammad Hossein Asgari').replace('محمدحسین عسگری ثمرین','محمدحسین عسگری')
 # Preserve the surname only as a single historical alternate in JSON-LD.
 t=re.sub(r'"alternateName":\s*\[[^\]]*\]', '"alternateName":["Mohammad Hossein Asgari","محمدحسین عسگری ثمرین"]',t,flags=re.I)
 def img(m):
  a=m.group(1)
  if 'alt=' not in a.lower():a+=' alt=""'
  if 'decoding=' not in a.lower():a+=' decoding="async"'
  if 'loading=' not in a.lower() and 'fetchpriority=' not in a.lower():a+=' loading="lazy"'
  return '<img'+a+'>'
 t=IMG_RE.sub(img,t)
 def scr(m):
  a=m.group(1)
  if 'src=' in a.lower() and 'defer' not in a.lower() and 'application/ld+json' not in a.lower():a+=' defer'
  return '<script'+a+'>'
 t=SCRIPT_RE.sub(scr,t)
 skip_text='Skip to content' if lang=='en' else 'پرش به محتوای اصلی'
 if 'class="skip-link"' not in t and re.search(r'<body\b',t,re.I):t=re.sub(r'<body\b([^>]*)>',r'<body\1><a class="skip-link" href="#main-content">'+skip_text+r'</a>',t,count=1,flags=re.I)
 if not re.search(r'<main\b[^>]*\bid=["\']main-content["\']',t,re.I):t=re.sub(r'<main\b','<main id="main-content"',t,count=1,flags=re.I)
 return t

changed=0
for p in HTMLS:
 old=p.read_text(encoding='utf-8'); new=process(old,p)
 if new!=old:p.write_text(new,encoding='utf-8'); changed+=1
print(f'core_css={len(css_paths)} html_changed={changed}')
