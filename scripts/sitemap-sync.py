from pathlib import Path
from datetime import datetime
import subprocess
BASE='https://mowhmmdh.github.io'
files=sorted(p for p in Path('.').rglob('*.html') if '.git' not in p.parts and p.name!='404.html' and p.as_posix()!='sitemap.html')
def canonical(p):
    return BASE+'/' if p.as_posix()=='index.html' else BASE+'/'+p.as_posix()
def lastmod(p):
    try:
        x=subprocess.check_output(['git','log','-1','--format=%cI','--',str(p)],text=True,stderr=subprocess.DEVNULL).strip()
        return x[:10] if x else datetime.utcnow().date().isoformat()
    except Exception: return datetime.utcnow().date().isoformat()
urls=sorted((canonical(p),lastmod(p)) for p in files)
xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u,d in urls: xml.append(f'  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>')
xml.append('</urlset>')
Path('sitemap.xml').write_text('\n'.join(xml)+'\n',encoding='utf-8')
print('Sitemap synced:',len(urls),'indexable HTML URLs')
