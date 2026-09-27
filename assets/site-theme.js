(()=>{'use strict';
const root=document.documentElement;
const KEY='mha-theme';

function theme(mode){
  const light=mode==='light';
  root.dataset.theme=light?'light':'dark';
  root.classList.toggle('theme-light',light);
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

  document.querySelectorAll('.site-nav,.about-nav,.en-nav,.nav,.vt-nav').forEach(nav=>{
    const menu=nav.querySelector('.mobile-menu');
    const links=nav.querySelector('.nav-links,.about-nav-links,.en-nav-links');
    if(!menu||!links||menu.dataset.bound)return;
    menu.dataset.bound='1';
    const close=()=>{
      nav.classList.remove('menu-open');
      menu.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-label','باز کردن منو');
      menu.textContent='☰';
    };
    menu.addEventListener('click',e=>{
      e.stopPropagation();
      const open=!nav.classList.contains('menu-open');
      if(open)nav.classList.add('menu-open');else close();
      menu.setAttribute('aria-expanded',String(open));
      menu.setAttribute('aria-label',open?'بستن منو':'باز کردن منو');
      menu.textContent=open?'×':'☰';
    });
    links.addEventListener('click',e=>{if(e.target.closest('a'))close()});
    nav._mhaClose=close;
  });
}

let saved=null;
try{saved=localStorage.getItem(KEY)}catch(_){}
theme(saved||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
if(!saved){
  const mq=matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener?.('change',e=>theme(e.matches?'light':'dark'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
document.addEventListener('click',e=>{
  if(e.target.closest('.menu-open'))return;
  document.querySelectorAll('.menu-open').forEach(n=>n._mhaClose?.());
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')document.querySelectorAll('.menu-open').forEach(n=>n._mhaClose?.());
});
})();