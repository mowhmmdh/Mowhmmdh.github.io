(()=>{
  const root=document.documentElement;
  const media=matchMedia('(prefers-color-scheme:light)');
  const KEY='personal-theme';
  const store={get(){try{return localStorage.getItem(KEY)}catch{return null}},set(v){try{localStorage.setItem(KEY,v)}catch{}}};
  const isVinTech=()=>!!document.querySelector('.vt-nav');
  const getTheme=()=>{const saved=store.get();return saved==='light'||saved==='dark'?saved:(media.matches?'light':'dark')};
  const apply=theme=>{
    theme=theme==='light'?'light':'dark';
    root.dataset.theme=theme;
    root.style.colorScheme=theme;
    document.body?.setAttribute('data-theme',theme);
    document.querySelectorAll('.theme-toggle').forEach(button=>{
      button.type='button';
      button.textContent=theme==='dark'?'☀':'☾';
      button.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');
      button.setAttribute('aria-pressed',String(theme==='dark'));
      button.title=theme==='dark'?'Light mode':'Dark mode';
    });
    store.set(theme);
  };
  const loadStyle=(href,attr)=>{
    if(document.querySelector(`link[data-${attr}]`))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.setAttribute(`data-${attr}`,'true');document.head.appendChild(link);
  };
  const loadAsset=(href,attr)=>{
    if(document.querySelector(`script[data-${attr}]`))return;
    const script=document.createElement('script');script.src=href;script.defer=true;script.setAttribute(`data-${attr}`,'true');document.head.appendChild(script);
  };
  const pageFor=path=>path==='/'?'home':path.includes('about')?'about':path.includes('projects')?'projects':path.includes('services')?'services':path.includes('/blog')||path.includes('en-blog')?'blog':path.includes('vintech')?(path.includes('/vintech/')||path.includes('/en-vintech/')?'service':'vintech'):'site';
  const init=()=>{
    const vt=isVinTech();
    loadStyle('/assets/design-system-2026.css','design-system-2026');
    loadAsset('/assets/design-system-2026.js','design-system-2026');
    if(!vt){loadStyle('/assets/theme-runtime-2026.css','theme-runtime');loadStyle('/assets/unified-polish-2026.css','unified-polish');loadStyle('/assets/ultra-2026.css','ultra-ui');loadStyle('/assets/visual-recovery-2026.css','visual-recovery');}
    const path=location.pathname.toLowerCase(),page=pageFor(path);
    if(page==='blog'){loadStyle('/assets/topical-authority-2026.css','topical-authority');loadAsset('/assets/topical-authority-2026.js','topical-authority')}
    document.body.classList.add('personal-site','page-'+page);
    document.body.dataset.page=page;
    let skip=document.getElementById('skip-to-content');
    if(!skip){skip=document.createElement('a');skip.id='skip-to-content';skip.href='#main-content';skip.className='skip-link';skip.textContent=root.lang?.startsWith('en')?'Skip to content':'پرش به محتوای اصلی';document.body.prepend(skip)}
    const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
    if(!vt){apply(getTheme());document.querySelectorAll('.theme-toggle').forEach(button=>{button.onclick=()=>apply(root.dataset.theme==='dark'?'light':'dark')});}
    document.querySelectorAll('.mobile-menu').forEach(btn=>{
      const nav=btn.closest('.site-nav')||document.querySelector('.site-nav'),links=nav?.querySelector('.nav-links');if(!nav||!links)return;
      let panel=nav.querySelector('.mobile-panel');
      if(!panel){panel=document.createElement('div');panel.className='mobile-panel';panel.innerHTML=links.innerHTML;nav.appendChild(panel)}
      btn.setAttribute('aria-expanded','false');btn.onclick=()=>{const open=document.body.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(open))};
      panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('menu-open');btn.setAttribute('aria-expanded','false')}));
    });
    document.querySelectorAll('.vt-menu').forEach(btn=>{
      const nav=document.getElementById(btn.getAttribute('aria-controls')||'vt-navigation');if(!nav)return;
      btn.onclick=()=>{const open=document.body.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open)};
      nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('menu-open');btn.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}));
    });
    const current=path.replace(/\/$/,'')||'/';
    document.querySelectorAll('.nav-links a,.mobile-panel a,.vt-links a').forEach(a=>{try{const target=new URL(a.href,location.origin).pathname.toLowerCase().replace(/\/$/,'')||'/';if(target===current)a.setAttribute('aria-current','page')}catch{}});
    let ticking=false;const progress=()=>{const h=document.documentElement.scrollHeight-innerHeight;root.style.setProperty('--scroll-progress',h>0?String(Math.min(1,Math.max(0,scrollY/h))):'0');ticking=false};
    addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(progress);ticking=true}},{passive:true});addEventListener('resize',progress,{passive:true});progress();
    if(!vt)document.querySelectorAll('.card,.service-card,.project-card,.post-card,.metric,.stat').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--card-x',(e.clientX-r.left)+'px');card.style.setProperty('--card-y',(e.clientY-r.top)+'px')},{passive:true}));
  };
  if(media.addEventListener)media.addEventListener('change',()=>{if(!isVinTech()&&!store.get())apply(getTheme())});else media.addListener(()=>{if(!isVinTech()&&!store.get())apply(getTheme())});
  addEventListener('storage',e=>{if(e.key===KEY&&!isVinTech())apply(e.newValue||getTheme())});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
