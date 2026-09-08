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
  const site={'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:isEn?'Mohammad Hossein Asgari Somarin':'محمدحسین عسگری ثمرین',alternateName:'VinTech',publisher:{'@id':origin+'/#person'},inLanguage:isEn?'en':'fa'};
  graph.push(site);
  graph.push({'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description:description||title,isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#person'},inLanguage:isEn?'en':'fa'});

  const parts=path.split('/').filter(Boolean);
  const isBlog=parts[0]==='blog'||parts[0]==='en-blog';
  const isBlogIndex=path==='/blog'||path==='/en-blog';
  const isVinTech=parts[0]==='vintech'||parts[0]==='en-vintech';
  const isVinTechHub=path==='/vintech'||path==='/en-vintech';
  const isRequest=path.endsWith('/request.html');

  if(parts.length){
    const crumbs=[{'@type':'ListItem',position:1,name:isEn?'Home':'خانه',item:origin+(isEn?'/en.html':'/')}];
    if(isBlog) crumbs.push({'@type':'ListItem',position:2,name:isEn?'Articles':'مقالات',item:origin+(isEn?'/en-blog.html':'/blog/')});
    else if(isVinTech) crumbs.push({'@type':'ListItem',position:2,name:'VinTech',item:origin+(isEn?'/en-vintech.html':'/vintech.html')});
    crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:h1||title||parts.at(-1),item:canonical});
    graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbs});
  }

  if(isBlog && !isBlogIndex){
    const date=document.querySelector('time[datetime]')?.getAttribute('datetime');
    const article={'@type':'Article','@id':canonical+'#article',headline:h1||title,description:description||h1||title,url:canonical,author:{'@id':origin+'/#person'},publisher:{'@id':origin+'/#person'},mainEntityOfPage:{'@id':canonical+'#webpage'},inLanguage:isEn?'en':'fa'};
    if(date){article.datePublished=date;article.dateModified=date;}
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
