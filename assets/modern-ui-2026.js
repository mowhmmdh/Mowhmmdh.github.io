(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const themeKey = 'site-theme';
  const isVinTech = () => !!document.querySelector('.vt-nav');

  const initTheme = () => {
    if (!isVinTech()) return;
    const legacy = localStorage.getItem('vt-theme');
    const saved = localStorage.getItem(themeKey) || legacy;
    const theme = saved === 'light' || saved === 'dark'
      ? saved
      : (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark');
    root.dataset.theme = theme;
    root.classList.toggle('light', theme === 'light');

    let toggle = document.querySelector('.vt-theme-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'vt-theme-toggle';
      toggle.type = 'button';
      toggle.innerHTML = '<span class="vt-theme-sun" aria-hidden="true">☀</span><span class="vt-theme-moon" aria-hidden="true">☾</span>';
      const tools = document.querySelector('.vt-nav-tools');
      const menu = document.querySelector('.vt-menu');
      if (tools) tools.insertBefore(toggle, menu || null);
      else if (menu && menu.parentNode) {
        const wrapper = document.createElement('div');
        wrapper.className = 'vt-nav-tools';
        menu.parentNode.insertBefore(wrapper, menu);
        wrapper.appendChild(toggle);
        wrapper.appendChild(menu);
      }
    }

    const fa = root.lang && root.lang.toLowerCase().startsWith('fa');
    const sync = () => {
      const light = root.dataset.theme === 'light';
      toggle.setAttribute('aria-label', fa ? (light ? 'تغییر به حالت تاریک' : 'تغییر به حالت روشن') : (light ? 'Switch to dark mode' : 'Switch to light mode'));
      toggle.setAttribute('title', fa ? (light ? 'حالت تاریک' : 'حالت روشن') : (light ? 'Dark mode' : 'Light mode'));
      toggle.setAttribute('aria-pressed', String(light));
    };
    sync();
    toggle.onclick = () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      root.classList.toggle('light', next === 'light');
      localStorage.setItem(themeKey, next);
      localStorage.setItem('vt-theme', next);
      sync();
    };
  };

  const initVinTechNav = () => {
    if (!isVinTech()) return;
    const header = document.querySelector('.vt-nav');
    const menu = document.querySelector('.vt-menu');
    const nav = document.querySelector('.vt-links');
    if (!header || !menu || !nav) return;
    const close = (restoreFocus = false) => { menu.setAttribute('aria-expanded','false'); header.classList.remove('is-open'); document.body.classList.remove('vt-menu-open'); if (restoreFocus) menu.focus(); };
    const open = () => { menu.setAttribute('aria-expanded','true'); header.classList.add('is-open'); document.body.classList.add('vt-menu-open'); const firstLink=nav.querySelector('a'); if(firstLink&&matchMedia('(max-width:760px)').matches) firstLink.focus(); };
    menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-controls','vt-main-nav'); nav.id='vt-main-nav';
    menu.addEventListener('click',()=>menu.getAttribute('aria-expanded')==='true'?close(true):open());
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>close(false)));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true')close(true);});
    document.addEventListener('click',e=>{if(menu.getAttribute('aria-expanded')==='true'&&!header.contains(e.target))close(false);});
    addEventListener('resize',()=>{if(!matchMedia('(max-width:760px)').matches)close(false);});
  };

  const initSocial = () => {
    if (!isVinTech()) return;
    const footer = document.querySelector('.vt-footer');
    if (!footer || footer.querySelector('[data-instagram-link]')) return;
    const link = document.createElement('a');
    link.href = 'https://instagram.com/mowhmmdh';
    link.target = '_blank';
    link.rel = 'me noopener';
    link.dataset.instagramLink = 'true';
    link.textContent = 'Instagram · @mowhmmdh';
    const inner = footer.querySelector('.vt-footer-inner') || footer;
    inner.appendChild(link);
  };

  const initReveal=()=>{if(!isVinTech())return;const items=document.querySelectorAll('[data-reveal]');if(!items.length||reduce||!('IntersectionObserver'in window))return;items.forEach(el=>el.classList.add('vt-ready'));const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}}),{threshold:.12,rootMargin:'0px 0px -8% 0px'});items.forEach(el=>io.observe(el));};
  const initCards=()=>{document.querySelectorAll('.card,.service-card,.project-card,.timeline-item,.skill-category,.faq-item,.portrait,.profile-card,.cta,.metric,.vt-card').forEach(el=>{if(reduce)return;el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--card-x',`${e.clientX-r.left}px`);el.style.setProperty('--card-y',`${e.clientY-r.top}px`);},{passive:true});});};
  let raf=0;const updateScroll=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);root.style.setProperty('--scroll-progress',(scrollY/max).toFixed(4));raf=0;};addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(updateScroll);},{passive:true});updateScroll();
  const mount=()=>{initTheme();initVinTechNav();initSocial();initReveal();initCards();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  if(!reduce)addEventListener('pointermove',e=>{root.style.setProperty('--ui-pointer-x',`${e.clientX}px`);root.style.setProperty('--ui-pointer-y',`${e.clientY}px`);},{passive:true});
})();