(()=>{
  const root=document.documentElement;
  const icons={
    github:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.48 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/></svg>',
    linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2 2 0 1 0 5.25 7a2 2 0 0 0 0-4ZM20.44 13.42c0-3.47-1.85-5.08-4.32-5.08-1.99 0-2.88 1.09-3.38 1.85V8.5H9.36V20h3.38v-6.39c0-1.68.32-3.31 2.4-3.31 2.05 0 2.08 1.92 2.08 3.42V20h3.38l-.16-6.58Z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M7 2.9h10A4.1 4.1 0 0 1 21.1 7v10a4.1 4.1 0 0 1-4.1 4.1H7A4.1 4.1 0 0 1 2.9 17V7A4.1 4.1 0 0 1 7 2.9Z"/><circle cx="12" cy="12" r="3.7" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.55" cy="6.55" r="1"/></svg>',
    mail:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3 5.5h18v13H3z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="m4 7 8 6 8-6"/></svg>'
  };
  const social=[
    ['GitHub','https://github.com/mowhmmdh','github'],
    ['LinkedIn','https://www.linkedin.com/in/mohammadhosseinasgari/','linkedin'],
    ['Instagram','https://instagram.com/mowhmmdh','instagram']
  ];
  const addFont=()=>{
    if(document.querySelector('link[data-2026-fonts]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap';l.dataset['2026Fonts']='true';document.head.appendChild(l);
  };
  const makeSocial=(label,url,key)=>{
    const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',label);a.title=label;a.innerHTML=icons[key];return a;
  };
  const decorateSocials=()=>{
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.href.toLowerCase();
      const key=href.includes('github.com')?'github':href.includes('linkedin.com')?'linkedin':href.includes('instagram.com')?'instagram':null;
      if(!key)return;
      if(a.closest('script'))return;
      a.classList.add('social-icon-link');
      a.setAttribute('aria-label',a.getAttribute('aria-label')||a.textContent.trim()||key);
      a.title=a.getAttribute('title')||a.getAttribute('aria-label');
      a.innerHTML=icons[key];
    });
  };
  const addFooterSocials=()=>{
    document.querySelectorAll('footer').forEach(footer=>{
      if(footer.querySelector('.footer-socials'))return;
      const inner=footer.firstElementChild||footer;
      const wrap=document.createElement('div');wrap.className='footer-socials';
      const label=document.createElement('span');label.className='footer-socials-label';label.textContent=root.lang?.startsWith('en')?'Connect':'ارتباط حرفه‌ای';wrap.appendChild(label);
      social.forEach(([name,url,key])=>wrap.appendChild(makeSocial(name,url,key)));
      inner.appendChild(wrap);
    });
  };
  const improveButtons=()=>{
    document.querySelectorAll('.btn,.button,.vt-btn').forEach(a=>{
      if(a.matches('.theme-toggle,.mobile-menu,.vt-menu,.lang-link,.lang'))return;
      if(a.querySelector('.ds-arrow'))return;
      const arrow=document.createElement('span');arrow.className='ds-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent=root.dir==='rtl'?'←':'→';a.appendChild(arrow);
    });
  };
  const reveal=()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const els=[...document.querySelectorAll('.card,.post-card,.service-card,.project-card,.timeline-item,.metric,.stat,.vt-card,.vt-expertise>div,.vt-steps>div')].slice(0,120);
    els.forEach((el,i)=>{el.classList.add('ds-reveal');el.style.setProperty('--ds-delay',Math.min(i%6,5)*45+'ms')});
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('ds-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -30px'});
    els.forEach(el=>io.observe(el));
  };
  const init=()=>{addFont();decorateSocials();addFooterSocials();improveButtons();reveal();document.body.classList.add('design-2026');};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();