(()=>{'use strict';
const root=document.documentElement;
const KEY='mha-theme';
const normalize=value=>value==='light'?'light':'dark';
const isEnglish=/^en(?:-|$)/i.test(root.lang||'');
const labels=isEnglish
  ? {switchToLight:'Switch to light mode',switchToDark:'Switch to dark mode',openMenu:'Open menu',closeMenu:'Close menu'}
  : {switchToLight:'فعال‌کردن حالت روشن',switchToDark:'فعال‌کردن حالت تیره',openMenu:'باز کردن منو',closeMenu:'بستن منو'};
function apply(mode){
  const selected=normalize(mode),light=selected==='light';
  root.dataset.theme=selected;
  root.classList.toggle('theme-light',light);
  root.style.colorScheme=selected;
  document.querySelectorAll('.theme-toggle').forEach(button=>{
    button.textContent=light?'☀':'☾';
    button.setAttribute('aria-label',light?labels.switchToDark:labels.switchToLight);
    button.setAttribute('aria-pressed',String(light));
    button.setAttribute('title',light?labels.switchToDark:labels.switchToLight);
  });
}
function persist(mode){try{localStorage.setItem(KEY,normalize(mode))}catch(_){}}
function bindTheme(){
  document.querySelectorAll('.theme-toggle').forEach(button=>{
    if(button.dataset.themeBound==='1')return;
    button.dataset.themeBound='1';
    button.addEventListener('click',()=>{
      const next=root.dataset.theme==='light'?'dark':'light';
      apply(next);persist(next);
    });
  });
}
let saved='dark';
try{saved=localStorage.getItem(KEY)||'dark'}catch(_){}
apply(saved);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindTheme,{once:true});else bindTheme();
window.addEventListener('storage',event=>{if(event.key===KEY)apply(event.newValue||'dark')});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')document.querySelectorAll('.menu-open').forEach(nav=>{
    nav.classList.remove('menu-open');
    const button=nav.querySelector('.mobile-menu');
    if(button){button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',labels.openMenu);button.textContent='☰'}
  });
});
document.addEventListener('click',event=>{
  if(event.target.closest('.menu-open'))return;
  document.querySelectorAll('.menu-open').forEach(nav=>{
    nav.classList.remove('menu-open');
    const button=nav.querySelector('.mobile-menu');
    if(button){button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',labels.openMenu);button.textContent='☰'}
  });
});
document.querySelectorAll('.site-nav,.about-nav,.en-nav,.nav,.vt-nav').forEach(nav=>{
  const button=nav.querySelector('.mobile-menu');
  const links=nav.querySelector('.nav-links,.about-nav-links,.en-nav-links');
  if(!button||!links||button.dataset.menuBound==='1')return;
  button.dataset.menuBound='1';
  button.setAttribute('aria-label',labels.openMenu);
  const close=()=>{nav.classList.remove('menu-open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',labels.openMenu);button.textContent='☰'};
  button.addEventListener('click',event=>{
    event.stopPropagation();
    const open=!nav.classList.contains('menu-open');
    nav.classList.toggle('menu-open',open);
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-label',open?labels.closeMenu:labels.openMenu);
    button.textContent=open?'×':'☰';
  });
  links.addEventListener('click',event=>{if(event.target.closest('a'))close()});
});
})();