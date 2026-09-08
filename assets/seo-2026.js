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
  const name='محمدحسین عسگری ثمرین';
  const person={
    '@type':'Person','@id':origin+'/#person',name,
    alternateName:'Mohammad Hossein Asgari Somarin',
    url:origin+'/',jobTitle:isEn?'Network & Infrastructure Specialist':'متخصص شبکه و زیرساخت IT',
    knowsAbout:['Network Infrastructure','Cybersecurity','Windows Server','Active Directory','CCTV/NVR','Technical SEO']
  };
  const graph=[person];
  const site={'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:isEn?'Mohammad Hossein Asgari Somarin':'محمدحسین عسگری ثمرین',publisher:{'@id':origin+'/#person'},inLanguage:isEn?'en':'fa'};
  graph.push(site);
  graph.push({'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description:description||title,isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#person'},inLanguage:isEn?'en':'fa'});
  const parts=path.split('/').filter(Boolean);
  if(parts.length){
    const crumbs=[{'@type':'ListItem',position:1,name:isEn?'Home':'خانه',item:origin+(isEn?'/en.html':'/')}];
    if(parts[0]==='blog'||parts[0]==='en-blog') crumbs.push({'@type':'ListItem',position:2,name:isEn?'Articles':'مقالات',item:origin+(isEn?'/en-blog.html':'/blog/')});
    if(parts[0]==='vintech'||parts[0]==='en-vintech') crumbs.push({'@type':'ListItem',position:2,name:'VinTech',item:origin+(isEn?'/en-vintech.html':'/vintech.html')});
    crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:title||text('h1')||parts.at(-1),item:canonical});
    graph.push({'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbs});
  }
  if(/(^|\/)(blog|en-blog)(\/|$)/.test(path)){
    const h=text('h1')||title;
    const date=document.querySelector('time[datetime]')?.getAttribute('datetime');
    graph.push({'@type':'Article','@id':canonical+'#article',headline:h,description:description||h,url:canonical,author:{'@id':origin+'/#person'},publisher:{'@id':origin+'/#person'},mainEntityOfPage:{'@id':canonical+'#webpage'},inLanguage:isEn?'en':'fa',...(date?{datePublished:date,dateModified:date}:{})});
  }
  if(/(^|\/)(vintech|en-vintech)(\/|$)/.test(path)){
    const h=text('h1')||title;
    graph.push({'@type':'Service','@id':canonical+'#service',name:h,description:description||h,url:canonical,provider:{'@id':origin+'/#person'},areaServed:{'@type':'Country',name:isEn?'Iran':'ایران'},serviceType:h});
  }
  const script=document.createElement('script');
  script.type='application/ld+json';
  script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});
  document.head.appendChild(script);
})();
