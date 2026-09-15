from pathlib import Path
from html.parser import HTMLParser
import html, json, re, subprocess

BASE='https://mowhmmdh.github.io'; ROOT=Path('.'); PERSON='Mohammad Hossein Asgari Somarin'
class P(HTMLParser):
    def __init__(self): super().__init__(); self.title=''; self.meta=[]; self.in_title=False; self.jsonld=False
    def handle_starttag(self,t,a):
        d=dict(a)
        if t=='title': self.in_title=True
        if t=='meta': self.meta.append(d)
        if t=='script' and d.get('type','').lower()=='application/ld+json': self.jsonld=True
    def handle_endtag(self,t):
        if t=='title': self.in_title=False
    def handle_data(self,d):
        if self.in_title: self.title+=d

def meta(x,n=None,p=None):
    for a in x.meta:
        if n and a.get('name','').lower()==n: return a.get('content','')
        if p and a.get('property','').lower()==p: return a.get('content','')
    return ''
def url(p): return BASE+'/' if p.as_posix()=='index.html' else BASE+'/'+p.as_posix()
def pair(p):
    r=p.as_posix()
    if r=='index.html': return Path('en.html')
    if r=='en.html': return Path('index.html')
    if r.startswith('blog/'): return Path('en-blog/'+r[5:])
    if r.startswith('en-blog/'): return Path('blog/'+r[8:])
    if r.startswith('vintech/'): return Path('en-vintech/'+r[8:])
    if r.startswith('en-vintech/'): return Path('vintech/'+r[11:])
    if r.startswith('en-'): return Path(r[3:])
    return Path('en-'+r)
def head(s,t): return s.replace('</head>',t+'\n</head>',1)
def gitdate(p,reverse=False):
    try:
        a=['git','log','--follow','--format=%aI']+(['--reverse'] if reverse else [])+['--',str(p)]
        z=subprocess.check_output(a,text=True,stderr=subprocess.DEVNULL).splitlines(); return z[0] if z else None
    except Exception: return None
def fix_hreflang(s,fa,en):
    s=re.sub(r'\s*<link\b[^>]*rel=["\']alternate["\'][^>]*hreflang=["\'][^"\']+["\'][^>]*>','',s,flags=re.I)
    return head(s,f'<link rel="alternate" hreflang="fa-IR" href="{fa}">\n<link rel="alternate" hreflang="en" href="{en}">\n<link rel="alternate" hreflang="x-default" href="{fa}">')
files=sorted(p for p in ROOT.rglob('*.html') if '.git' not in p.parts and p.name!='404.html'); exists={p.as_posix() for p in files}; changed=[]
for p in files:
    s=p.read_text(encoding='utf-8',errors='replace'); old=s; x=P(); x.feed(s); r=p.as_posix(); en=r.startswith('en-') or r.startswith('en-blog/') or r.startswith('en-vintech/')
    title=' '.join(x.title.split()); desc=meta(x,'description') or title; image=meta(x,p='og:image') or meta(x,n='twitter:image')
    if len(title)>65:
        parts=[z.strip() for z in title.split('|') if z.strip()]
        while len(parts)>1 and len(' | '.join(parts))>65: parts.pop()
        title=' | '.join(parts)[:65].rstrip(' |:-'); s=re.sub(r'<title>.*?</title>',f'<title>{html.escape(title)}</title>',s,1,flags=re.I|re.S)
    if len(desc)>170:
        desc=desc[:167].rsplit(' ',1)[0]+'…'; s=re.sub(r'(<meta\b[^>]*name=["\']description["\'][^>]*content=["\'])[^"\']*(["\'])',lambda m:m.group(1)+html.escape(desc,quote=True)+m.group(2),s,1,flags=re.I)
    if not meta(x,p='og:title'): s=head(s,f'<meta property="og:title" content="{html.escape(title,quote=True)}">')
    if not meta(x,p='og:description'): s=head(s,f'<meta property="og:description" content="{html.escape(desc,quote=True)}">')
    if image and not meta(x,p='og:image'): s=head(s,f'<meta property="og:image" content="{html.escape(image,quote=True)}">')
    if image and not meta(x,n='twitter:image'): s=head(s,f'<meta name="twitter:image" content="{html.escape(image,quote=True)}">')
    q=pair(p)
    if q.as_posix() in exists: s=fix_hreflang(s,url(p if not en else q),url(q if not en else p))
    if (r.startswith('blog/') or r.startswith('en-blog/')) and r.count('/')==1 and not re.search(r'"@type"\s*:\s*"(?:Article|BlogPosting|NewsArticle)"',s):
        data={'@context':'https://schema.org','@type':'Article','@id':url(p)+'#article','headline':title,'description':desc,'url':url(p),'inLanguage':'en' if en else 'fa-IR','author':{'@type':'Person','name':PERSON,'url':BASE+('/en-about.html' if en else '/about.html'),'sameAs':['https://github.com/mowhmmdh','https://www.linkedin.com/in/mohammadhosseinasgari/']},'mainEntityOfPage':{'@type':'WebPage','@id':url(p)}}
        a=gitdate(p,True); b=gitdate(p,False)
        if a: data['datePublished']=a
        if b: data['dateModified']=b
        if image: data['image']=image
        s=head(s,'<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'</script>')
    if (r.startswith('blog/') or r.startswith('en-blog/')) and 'seo-conversion-cta' not in s:
        c=('<section class="seo-conversion-cta" aria-label="IT services"><h2>Need help applying this in a real environment?</h2><p>Practical network, infrastructure, security and IT operations support based on the same engineering methods used in these guides.</p><p><a href="/en-services.html">Explore IT services ↗</a> · <a href="/en-vintech/request.html">Request a project or consultation ↗</a></p></section>' if en else '<section class="seo-conversion-cta" aria-label="خدمات فناوری اطلاعات"><h2>این مشکل را در محیط واقعی دارید؟</h2><p>برای شبکه، زیرساخت، امنیت و عملیات IT، خدمات عملی بر پایه همان روش‌های عیب‌یابی، Hardening و مستندسازی ارائه می‌شود.</p><p><a href="/services.html">مشاهده خدمات فناوری اطلاعات ↗</a> · <a href="/vintech/request.html">درخواست پروژه یا مشاوره ↗</a></p></section>')
        s=s.replace('</article>','</article>'+c,1) if '</article>' in s else s.replace('</main>',c+'</main>',1)
    if s!=old: p.write_text(s,encoding='utf-8'); changed.append(r)
print('SEO growth fix changed',len(changed),'pages'); [print(x) for x in changed]
