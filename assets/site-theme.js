(()=>{
  'use strict';
  const root=document.documentElement;
  const media=matchMedia('(prefers-color-scheme:light)');
  const KEY='personal-theme';
  const store={get(){try{return localStorage.getItem(KEY)}catch{return null}},set(v){try{localStorage.setItem(KEY,v)}catch{}}};
  const isVinTech=()=>!!document.querySelector('.vt-nav');
  const getTheme=()=>{const saved=store.get();return saved==='light'||saved==='dark'?saved:(media.matches?'light':'dark')};
  const applyTheme=theme=>{theme=theme==='light'?'light':'dark';root.dataset.theme=theme;root.style.colorScheme=theme;document.body?.setAttribute('data-theme',theme);store.set(theme)};
  // Apply immediately to prevent light/dark flash before the page paints.
  if(!isVinTech()) applyTheme(getTheme());
  const loadStyle=(href,attr)=>{if(document.querySelector(`link[data-${attr}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.setAttribute(`data-${attr}`,'true');document.head.appendChild(link)};
  const loadAsset=(href,attr)=>{if(document.querySelector(`script[data-${attr}]`))return;const script=document.createElement('script');script.src=href;script.defer=true;script.setAttribute(`data-${attr}`,'true');document.head.appendChild(script)};
  const pageFor=path=>path==='/'?'home':path.includes('about')?'about':path.includes('projects')?'projects':path.includes('services')?'services':path.includes('/blog')||path.includes('en-blog')?'blog':path.includes('vintech')?(path.includes('/vintech/')||path.includes('/en-vintech/')?'service':'vintech'):path.includes('linkedin')?'linkedin':'site';
  const ensureThemeToggle=()=>{
    if(isVinTech()) return;
    let b=document.querySelector('.theme-toggle');
    if(!b){
      const host=document.querySelector('.nav-actions')||document.querySelector('.site-nav')||document.body;
      b=document.createElement('button');b.className='theme-toggle theme-toggle-global';b.type='button';b.setAttribute('aria-controls','site-theme');
      b.innerHTML='<span class="theme-icon" aria-hidden="true"></span><span class="theme-label">Theme</span>';
      host.appendChild(b);
    }
    b.type='button';b.id=b.id||'site-theme';
    const sync=()=>{const dark=root.dataset.theme==='dark';b.classList.toggle('is-dark',dark);b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');b.title=dark?'Light mode':'Dark mode'};
    sync();b.onclick=()=>{applyTheme(root.dataset.theme==='dark'?'light':'dark');sync()};
  };
  const init=()=>{
    const vt=isVinTech();
    loadStyle('/assets/design-system-2026.css','design-system-2026');
    loadStyle('/assets/accessibility-performance-fixes-2026.css','quality-fixes-2026');
    loadStyle('/assets/modern-ui-2026.css','modern-ui-2026');
    loadAsset('/assets/design-system-2026.js','design-system-2026');
    if(!vt){loadStyle('/assets/theme-runtime-2026.css','theme-runtime');loadStyle('/assets/unified-polish-2026.css','unified-polish');loadStyle('/assets/ultra-2026.css','ultra-ui');loadStyle('/assets/visual-recovery-2026.css','visual-recovery');loadStyle('/assets/site-experience-2026.css','site-experience');}
    const path=location.pathname.toLowerCase(),page=pageFor(path);
    if(page==='blog'){loadStyle('/assets/topical-authority-2026.css','topical-authority');loadAsset('/assets/topical-authority-2026.js','topical-authority')}
    document.body.classList.add('personal-site','page-'+page);document.body.dataset.page=page;
    let main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
    let skip=document.getElementById('skip-to-content');if(!skip){skip=document.createElement('a');skip.id='skip-to-content';skip.href='#main-content';skip.className='skip-link';skip.textContent=root.lang?.startsWith('en')?'Skip to content':'پرش به محتوای اصلی';document.body.prepend(skip)}
    if(!vt){applyTheme(getTheme());ensureThemeToggle();document.querySelectorAll('.theme-toggle').forEach(button=>{button.onclick=()=>{applyTheme(root.dataset.theme==='dark'?'light':'dark');ensureThemeToggle()}})}
    document.querySelectorAll('.mobile-menu').forEach(btn=>{const nav=btn.closest('.site-nav')||document.querySelector('.site-nav'),links=nav?.querySelector('.nav-links');if(!nav||!links)return;let panel=nav.querySelector('.mobile-panel');if(!panel){panel=document.createElement('div');panel.className='mobile-panel';panel.innerHTML=links.innerHTML;nav.appendChild(panel)}btn.setAttribute('aria-expanded','false');btn.onclick=()=>{const open=document.body.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(open))};panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('menu-open');btn.setAttribute('aria-expanded','false')}))});
    document.querySelectorAll('.vt-menu').forEach(btn=>{const nav=document.getElementById(btn.getAttribute('aria-controls')||'vt-navigation');if(!nav)return;btn.onclick=()=>{const open=document.body.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open)};nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('menu-open');btn.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}))});
    const current=path.replace(/\/$/,'')||'/';document.querySelectorAll('.nav-links a,.mobile-panel a,.vt-links a').forEach(a=>{try{const target=new URL(a.href,location.origin).pathname.toLowerCase().replace(/\/$/,'')||'/';if(target===current)a.setAttribute('aria-current','page')}catch{}});
    let ticking=false;const progress=()=>{const h=document.documentElement.scrollHeight-innerHeight;root.style.setProperty('--scroll-progress',h>0?String(Math.min(1,Math.max(0,scrollY/h))):'0');ticking=false};addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(progress);ticking=true}},{passive:true});addEventListener('resize',progress,{passive:true});progress();
    if(!vt)document.querySelectorAll('.card,.service-card,.project-card,.post-card,.metric,.stat').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--card-x',(e.clientX-r.left)+'px');card.style.setProperty('--card-y',(e.clientY-r.top)+'px')},{passive:true}));
  };
  const syncSystem=()=>{if(!store.get()&&!isVinTech())applyTheme(media.matches?'light':'dark')};
  if(media.addEventListener)media.addEventListener('change',syncSystem);else media.addListener(syncSystem);
  addEventListener('storage',e=>{if(e.key===KEY&&!isVinTech())applyTheme(e.newValue||getTheme())});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
