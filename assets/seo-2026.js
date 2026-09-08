(()=>{
  'use strict';
  const origin='https://mowhmmdh.github.io';
  const path=location.pathname.replace(/\/$/,'')||'/';
  const lang=document.documentElement.lang||'fa';
  const isEn=lang.toLowerCase().startsWith('en');
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const text=sel=>clean(document.querySelector(sel)?.textContent||'');
  const title=clean(document.title);
  const description=clean(document.querySelector('meta[name="description"]')?.content||'');
  const canonical=document.querySelector('link[rel="canonical"]')?.href||location.href.split('#')[0];
  const h1=text('h1');
  const name='محمدحسین عسگری ثمرین';
  const person={
    '@type':'Person','@id':origin+'/#person',name,
    alternateName:'Mohammad Hossein Asgari Somarin',
    url:origin+'/',jobTitle:isEn?'Network & Infrastructure Specialist':'متخصص شبکه و زیرساخت IT',
    knowsAbout:['Network Infrastructure','Cybersecurity','Windows Server','Active Directory','CCTV/NVR','Technical SEO','IT Operations'],
    sameAs:['https://github.com/mowhmmdh','https://www.linkedin.com/in/mohammadhosseinasgari/','https://instagram.com/mowhmmdh']
  };
  const graph=[person];
  graph.push({'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:isEn?'Mohammad Hossein Asgari Somarin':'محمدحسین عسگری ثمرین',alternateName:'VinTech',publisher:{'@id':origin+'/#person'},inLanguage:isEn?'en':'fa'});

  const parts=path.split('/').filter(Boolean);
  const isBlog=parts[0]==='blog'||parts[0]==='en-blog';
  const isBlogIndex=path==='/blog'||path==='/en-blog';
  const isVinTech=parts[0]==='vintech'||parts[0]==='en-vintech';
  const isVinTechHub=path==='/vintech'||path==='/en-vintech';
  const isRequest=path.endsWith('/request.html');
  const isAbout=/^\/(en-)?about\.html$/.test(path);
  const pageType=isRequest?'ContactPage':isAbout?'AboutPage':isBlogIndex?'CollectionPage':'WebPage';
  const page={'@type':pageType,'@id':canonical+'#webpage',url:canonical,name:title,description:description||title,isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#person'},inLanguage:isEn?'en':'fa'};
  if(isBlogIndex){
    page.mainEntity={'@type':'ItemList','@id':canonical+'#article-list','name':isEn?'Network, infrastructure and cybersecurity articles':'مقالات شبکه، زیرساخت و امنیت'};
  }
  graph.push(page);

  if(parts.length){
    const crumbs=[{'@type':'ListItem',position:1,name:isEn?'Home':'خانه',item:origin+(isEn?'/en.html':'/')}];
    if(isBlog) crumbs.push({'@type':'ListItem',position:2,name:isEn?'Articles':'مقالات',item:origin+(isEn?'/en-blog.html':'/blog/')});
    else if(isVinTech) crumbs.push({'@type':'ListItem',position:2,name:'VinTech',item:origin+(isEn?'/en-vintech.html':'/vintech.html')});
    crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:h1||title||parts.at(-1),item:canonical});
    graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbs});
  }

  if(isBlogIndex){
    const items=[...document.querySelectorAll('a[href*="blog/"]')].filter(a=>a.textContent.trim()).slice(0,50);
    if(items.length){
      graph.push({'@type':'ItemList','@id':canonical+'#articles','name':isEn?'Articles':'مقالات','itemListElement':items.map((a,i)=>({'@type':'ListItem',position:i+1,name:clean(a.textContent),url:new URL(a.getAttribute('href'),location.href).href}))});
    }
  }

  if(isBlog && !isBlogIndex){
    const date=document.querySelector('time[datetime]')?.getAttribute('datetime');
    const article={'@type':'Article','@id':canonical+'#article',headline:h1||title,description:description||h1||title,url:canonical,author:{'@id':origin+'/#person'},publisher:{'@id':origin+'/#person'},mainEntityOfPage:{'@id':canonical+'#webpage'},inLanguage:isEn?'en':'fa'};
    const image=document.querySelector('meta[property="og:image"]')?.content||document.querySelector('article img')?.src;
    if(image) article.image=new URL(image,location.href).href;
    if(date){article.datePublished=date;article.dateModified=document.querySelector('meta[property="article:modified_time"]')?.content||date;}
    const body=clean(document.querySelector('article')?.textContent||document.querySelector('main')?.textContent||'');
    if(body) article.wordCount=body.split(/\s+/).filter(Boolean).length;
    const keywords=clean(document.querySelector('meta[name="keywords"]')?.content||'');
    if(keywords) article.keywords=keywords.split(',').map(clean).filter(Boolean);
    graph.push(article);
  }

  if(isVinTech && !isVinTechHub && !isRequest){
    const serviceName=h1||title;
    graph.push({'@type':'Service','@id':canonical+'#service',name:serviceName,description:description||serviceName,url:canonical,provider:{'@id':origin+'/#person'},areaServed:{'@type':'Country',name:isEn?'Iran':'ایران'},serviceType:serviceName});
  }

  const script=document.createElement('script');
  script.type='application/ld+json';
  script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});
  document.head.appendChild(script);
})();
