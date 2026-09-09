/* Personal-site smart navigation assistant. No tracking, no external requests, no fake AI claims. */
(()=>{'use strict';
const init=()=>{
  if(document.querySelector('.ux-conversation')||document.body.classList.contains('is-404')||!document.body.classList.contains('personal-site'))return;
  const en=(document.documentElement.lang||'').toLowerCase().startsWith('en');
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
    eyebrow:'SMART GUIDE',title:'What are you looking for?',open:'Smart guide',close:'Close',placeholder:'مثلاً شبکه، امنیت، سرور یا مقالات فنی…',note:'این دستیار محلی و بدون ردیابی، بر اساس موضوع انتخابی مسیر مناسب سایت را پیشنهاد می‌دهد.',search:'Find',empty:'مورد مرتبطی پیدا نشد.',suggestions:['network','security','server','support']
  }:{
    eyebrow:'دستیار هوشمند',title:'دنبال چه چیزی هستی؟',open:'چی می‌خوای؟',close:'بستن',placeholder:'مثلاً شبکه، امنیت، سرور یا مقالات فنی…',note:'این دستیار محلی و بدون ردیابی، بر اساس موضوع انتخابی مسیر مناسب سایت را پیشنهاد می‌دهد.',search:'جستجو',empty:'مورد مرتبطی پیدا نشد.',suggestions:['شبکه','امنیت','سرور','پشتیبانی']
  };
  const wrap=document.createElement('aside');wrap.className='ux-conversation';wrap.setAttribute('aria-label',en?'Smart site guide':'دستیار هوشمند سایت');
  const items=links.map(([href,icon,label])=>`<a class="ux-conversation__choice" data-search="${label.toLowerCase()} ${href.toLowerCase()}" href="${href}"><span aria-hidden="true">${icon}</span><span>${label}</span></a>`).join('');
  wrap.innerHTML=`<div class="ux-conversation__panel" hidden><div class="ux-conversation__head"><div><div class="ux-conversation__eyebrow">${text.eyebrow}</div><div class="ux-conversation__title">${text.title}</div></div><button class="ux-conversation__close" type="button" aria-label="${text.close}">×</button></div><form class="ux-conversation__search" role="search"><input type="search" autocomplete="off" placeholder="${text.placeholder}" aria-label="${text.placeholder}"><button type="submit">${text.search}</button></form><div class="ux-conversation__chips">${text.suggestions.map(s=>`<button type="button" data-query="${s}">${s}</button>`).join('')}</div><nav class="ux-conversation__grid" aria-label="${text.title}">${items}</nav><p class="ux-conversation__note">${text.note}</p></div><button class="ux-conversation__toggle" type="button" aria-expanded="false"><span aria-hidden="true">✦</span><span>${text.open}</span></button>`;
  document.body.appendChild(wrap);
  const panel=wrap.querySelector('.ux-conversation__panel'),toggle=wrap.querySelector('.ux-conversation__toggle'),close=wrap.querySelector('.ux-conversation__close'),input=wrap.querySelector('input'),grid=wrap.querySelector('.ux-conversation__grid');
  const choices=[...grid.querySelectorAll('.ux-conversation__choice')];
  const filter=(q)=>{q=q.trim().toLowerCase();let visible=0;choices.forEach(a=>{const hit=!q||a.dataset.search.includes(q)||(q.includes('شبکه')&&a.href.includes('services'))||(q.includes('امنیت')&&a.href.includes('blog'))||(q.includes('سرور')&&a.href.includes('services'))||(q.includes('network')&&a.href.includes('services'))||(q.includes('security')&&a.href.includes('blog'))||(q.includes('server')&&a.href.includes('services'));a.hidden=!hit;if(hit)visible++});let empty=grid.querySelector('.ux-conversation__empty');if(!empty){empty=document.createElement('p');empty.className='ux-conversation__empty';empty.textContent=text.empty;grid.appendChild(empty)}empty.hidden=visible!==0};
  const set=open=>{panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open){input.focus();filter(input.value)}};
  toggle.addEventListener('click',()=>set(panel.hidden));close.addEventListener('click',()=>set(false));
  wrap.querySelector('.ux-conversation__search').addEventListener('submit',e=>{e.preventDefault();filter(input.value)});
  input.addEventListener('input',()=>filter(input.value));
  wrap.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.query;filter(input.value);input.focus()}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){set(false);toggle.focus()}});
  const footer=document.querySelector('footer');
  if(footer&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>wrap.classList.toggle('is-footer-visible',entries.some(x=>x.isIntersecting)),{threshold:.08});io.observe(footer)}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
