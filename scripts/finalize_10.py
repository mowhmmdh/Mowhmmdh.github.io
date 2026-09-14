from pathlib import Path
import re
from html import unescape
import subprocess,sys

ROOT=Path('.')

def replace(path, old, new):
    p=ROOT/path
    s=p.read_text(encoding='utf-8')
    if old not in s:
        return False
    p.write_text(s.replace(old,new),encoding='utf-8')
    return True

# Remove runtime CSS injection; all CSS is already in site-bundle.css.
p=ROOT/'assets/site-theme.js'; s=p.read_text(encoding='utf-8')
s=re.sub(r"const loadStyle=.*?;\n",'',s,count=1,flags=re.S)
s=s.replace("loadStyle('/assets/fonts-2026.css','fonts-2026');loadStyle('/assets/site-final-polish.css','site-final-polish-2026');",'')
p.write_text(s,encoding='utf-8')

p=ROOT/'assets/modern-ui-2026.js'; s=p.read_text(encoding='utf-8')
s=re.sub(r"const loadStyle=.*?;\n",'',s,count=1,flags=re.S)
s=s.replace("loadStyle('/assets/vintech-experience-2026.css','vt-experience-2026');loadStyle('/assets/theme-consistency-2026.css','vt-theme-consistency-2026');",'')
p.write_text(s,encoding='utf-8')

# Fix breadcrumb double-escaping at the source.
p=ROOT/'tools/discovery_sync.py'; s=p.read_text(encoding='utf-8')
s=s.replace('from html import escape','from html import escape, unescape')
s=s.replace("return re.sub(r'\\s+', ' ', m.group(1)).strip()","return unescape(re.sub(r'\\s+', ' ', m.group(1)).strip())")
p.write_text(s,encoding='utf-8')

# Localize generated skip links.
p=ROOT/'scripts/site-refactor.py'; s=p.read_text(encoding='utf-8')
old="if 'class=\"skip-link\"' not in t and re.search(r'<body\\b',t,re.I):t=re.sub(r'<body\\b([^>]*)>',r'<body\\1><a class=\"skip-link\" href=\"#main-content\">پرش به محتوای اصلی</a>',t,count=1,flags=re.I)"
new="skip_text='Skip to content' if lang=='en' else 'پرش به محتوای اصلی'\n if 'class=\"skip-link\"' not in t and re.search(r'<body\\b',t,re.I):t=re.sub(r'<body\\b([^>]*)>',r'<body\\1><a class=\"skip-link\" href=\"#main-content\">'+skip_text+r'</a>',t,count=1,flags=re.I)"
if old in s:s=s.replace(old,new)
p.write_text(s,encoding='utf-8')

# Align the audit with the production identity and bundle architecture.
p=ROOT/'scripts/quality-audit.py'; s=p.read_text(encoding='utf-8')
s=s.replace("PERSIAN_NAME='محمدحسین عسگری ثمرین'\nENGLISH_NAME='Mohammad Hossein Asgari Somarin'","PERSIAN_NAME='محمدحسین عسگری'\nENGLISH_NAME='Mohammad Hossein Asgari'")
s=s.replace("'sitemap.xml','robots.txt','manifest.json','.well-known/security.txt','llms.txt','humans.txt','assets/site-final-polish.css'","'sitemap.xml','robots.txt','manifest.webmanifest','.well-known/security.txt','llms.txt','humans.txt','assets/site-bundle.css'")
s=s.replace("if '/assets/site-final-polish.css' not in ts: ERRORS.append('site-theme.js does not load site-final-polish.css')","if '/assets/site-final-polish.css' in ts or '/assets/fonts-2026.css' in ts: ERRORS.append('site-theme.js contains runtime CSS injection')")
p.write_text(s,encoding='utf-8')

subprocess.run([sys.executable,'tools/discovery_sync.py'],check=True)
subprocess.run([sys.executable,'scripts/site-refactor.py'],check=True)
print('FINALIZE_OK')
