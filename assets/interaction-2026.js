/* Lightweight conversational navigation. No tracking, no external requests. */
(()=>{'use strict';
const init=()=>{
  if(document.querySelector('.ux-conversation')||document.body.classList.contains('is-404'))return;
  const en=(document.documentElement.lang||'').toLowerCase().startsWith('en');
  const base=en?'/en':'/';
  const links=en?[
    ['/en-services.html','🧰','Services'],
    ['/en-blog.html','📚','Technical articles'],
    ['/en-projects.html','🧩','Projects'],
    ['/en-about.html','👤','About Mohammad']
  ]:[
    ['/services.html','🧰','خدمات'],
    ['/blog/','📚','مقالات فنی'],
    ['/projects.html','🧩','پروژه‌ها'],
    ['/about.html','👤','درباره محمدحسین']
  ];
  const text=en?{
    eyebrow:'QUICK GUIDE',title:'What are you looking for?',open:'What do you need?',close:'Close',note:'از اینجا می‌توانی مستقیم به بخش مناسب بروی.'
  }:{
    eyebrow:'راهنمای سریع',title:'دنبال چی می‌گردی؟',open:'چی لازم داری؟',close:'بستن',note:'اگر نمی‌دانی از کجا شروع کنی، یکی از گزینه‌ها را انتخاب کن.'
  };
  const wrap=document.createElement('aside');wrap.className='ux-conversation';wrap.setAttribute('aria-label',en?'Quick navigation':'راهنمای سریع سایت');
  wrap.innerHTML=`<div class="ux-conversation__panel" hidden><div class="ux-conversation__head"><div><div class="ux-conversation__eyebrow">${text.eyebrow}</div><div class="ux-conversation__title">${text.title}</div></div><button class="ux-conversation__close" type="button" aria-label="${text.close}">×</button></div><nav class="ux-conversation__grid" aria-label="${text.title}">${links.map(([href,icon,label])=>`<a class="ux-conversation__choice" href="${href}"><span aria-hidden="true">${icon}</span><span>${label}</span></a>`).join('')}</nav><p class="ux-conversation__note">${text.note}</p></div><button class="ux-conversation__toggle" type="button" aria-expanded="false"><span aria-hidden="true">✦</span><span>${text.open}</span></button>`;
  document.body.appendChild(wrap);
  const panel=wrap.querySelector('.ux-conversation__panel'),toggle=wrap.querySelector('.ux-conversation__toggle'),close=wrap.querySelector('.ux-conversation__close');
  const set=(open)=>{panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)close.focus()};
  toggle.addEventListener('click',()=>set(panel.hidden));close.addEventListener('click',()=>set(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){set(false);toggle.focus()}});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
