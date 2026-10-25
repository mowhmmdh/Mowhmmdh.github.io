(()=>{'use strict';
const root=document.documentElement;
const KEY='mha-theme';

function theme(mode){
  const light=mode==='light';
  if(light){
    if(root.dataset.theme!=='light')root.dataset.theme='light';
  }else if(root.hasAttribute('data-theme')){
    root.removeAttribute('data-theme');
  }
  if(root.classList.contains('theme-light')!==light)root.classList.toggle('theme-light',light);
  document.querySelectorAll('.theme-toggle').forEach(b=>{
    b.textContent=light?'☀':'☾';
    b.setAttribute('aria-label',light?'فعال‌کردن حالت تیره':'فعال‌کردن حالت روشن');
    b.setAttribute('aria-pressed',String(light));
  });
}

function bind(){
  document.querySelectorAll('.theme-toggle').forEach(b=>{
    if(b.dataset.bound)return;
    b.dataset.bound='1';
    b.addEventListener('click',()=>{
      const next=root.dataset.theme==='light'?'dark':'light';
      theme(next);
      try{localStorage.setItem(KEY,next)}catch(_){}
    });
  });

  const english=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const menuLabels=english
    ? {open:'Open menu',close:'Close menu'}
    : {open:'باز کردن منو',close:'بستن منو'};

  document.querySelectorAll('.site-nav,.about-nav,.en-nav,.nav,.vt-nav').forEach(nav=>{
    const menu=nav.querySelector('.mobile-menu');
    const links=nav.querySelector('.nav-links,.about-nav-links,.en-nav-links');
    if(!menu||!links||menu.dataset.bound)return;
    menu.dataset.bound='1';
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label',menuLabels.open);

    const close=(restoreFocus=false)=>{
      const wasOpen=nav.classList.contains('menu-open');
      nav.classList.remove('menu-open');
      menu.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-label',menuLabels.open);
      menu.textContent='☰';
      if(restoreFocus&&wasOpen)menu.focus();
    };

    menu.addEventListener('click',e=>{
      e.stopPropagation();
      const open=!nav.classList.contains('menu-open');
      if(open){
        nav.classList.add('menu-open');
        menu.setAttribute('aria-expanded','true');
        menu.setAttribute('aria-label',menuLabels.close);
        menu.textContent='×';
        const focusFirstLink=()=>{
          if(!nav.classList.contains('menu-open'))return;
          const firstLink=links.querySelector('a[href]:not([hidden])');
          if(firstLink)firstLink.focus();
        };
        if(typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(focusFirstLink);
        else window.setTimeout(focusFirstLink,0);
      }else{
        close();
      }
    });
    links.addEventListener('click',e=>{if(e.target.closest('a'))close()});
    nav._mhaClose=close;
  });
}

let saved=null;
try{saved=localStorage.getItem(KEY)}catch(_){}
// Default to the site's dark palette. Several technical articles have dark, page-specific
// surfaces; auto-applying a light OS preference would mix dark backgrounds with light-theme text.
theme(saved||'dark');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
document.addEventListener('click',e=>{
  if(e.target.closest('.menu-open'))return;
  document.querySelectorAll('.menu-open').forEach(n=>n._mhaClose?.());
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')document.querySelectorAll('.menu-open').forEach(n=>n._mhaClose?.(true));
});
})();