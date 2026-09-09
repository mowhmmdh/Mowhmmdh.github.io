(()=>{'use strict';
const root=document.documentElement;
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const lang=(root.lang||'').toLowerCase().startsWith('en');
const page=document.body?.dataset.page||'site';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

const addScrollUI=()=>{
  if(!$('.so-scroll')){const bar=document.createElement('div');bar.className='so-scroll';bar.setAttribute('aria-hidden','true');document.body.prepend(bar)}
  if(!$('.so-top')){const b=document.createElement('button');b.className='so-top';b.type='button';b.setAttribute('aria-label',lang?'Back to top':'بازگشت به بالا');b.innerHTML='↑';document.body.appendChild(b);b.addEventListener('click',()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'}))}
  const top=$('.so-top');
  let ticking=false;
  const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;root.style.setProperty('--so-progress',max>0?String(Math.min(1,Math.max(0,scrollY/max))):'0');top?.classList.toggle('is-visible',scrollY>520);ticking=false};
  addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});addEventListener('resize',update,{passive:true});update();
};

const enhanceSections=()=>{
  if(page==='home'||page==='vintech')return;
  const sections=$$('main > section').filter(s=>!s.querySelector('form')||s.children.length>1);
  let n=0;
  sections.forEach(s=>{
    if(s.querySelector('.so-section-label'))return;
    const heading=$('h2,h1',s);if(!heading)return;
    n++;
    const label=document.createElement('div');label.className='so-section-label';label.textContent=(lang?'SECTION ':'بخش ')+String(n).padStart(2,'0');
    heading.parentNode.insertBefore(label,heading);
  });
};

const addNextStep=()=>{
  if(page==='home'||page==='vintech')return;
  if($('.so-next'))return;
  const map={
    about:{fa:['مسیر بعدی','اگر می‌خواهی با مسیر فنی و پروژه‌ها بیشتر آشنا شوی، از پروژه‌ها یا مقالات شروع کن.','/projects.html','مشاهده پروژه‌ها'],en:['Next step','Explore the projects or technical articles to see the work in context.','/en-projects.html','Explore projects']},
    services:{fa:['قدم بعدی','اگر سرویس موردنظرت را پیدا کردی، جزئیات VinTech را ببین یا مستقیم درخواستت را بفرست.','/vintech.html','ورود به VinTech'],en:['Next step','See the VinTech service details or move straight to a project request.','/en-vintech.html','Open VinTech']},
    projects:{fa:['از اینجا ادامه بده','برای دیدن پشت‌صحنه و روش حل مسئله، مقالات فنی مرتبط را ببین.','/blog/','رفتن به مقالات'],en:['Continue','Read the technical articles for the reasoning behind the work.','/en-blog.html','Read articles']},
    blog:{fa:['موضوع بعدی','یک مقاله را انتخاب کن و بعد از آن سراغ موضوع مرتبط بعدی برو؛ مسیر مطالعه را مرحله‌به‌مرحله جلو ببر.','/vintech.html','دیدن کاربردها در VinTech'],en:['Next topic','Move from one technical topic to the next, then see how the same thinking maps to VinTech services.','/en-vintech.html','Explore VinTech']},
    linkedin:{fa:['ارتباط با سایت','یادداشت‌های لینکدین اینجا به موضوعات فنی سایت وصل می‌شوند؛ برای مطالعه عمیق‌تر، مقالات را ببین.','/blog/','مطالعه عمیق‌تر'],en:['Connect the site','LinkedIn notes connect to the deeper technical material on this site.','/en-blog.html','Read deeper']},
    service:{fa:['مسیر مرتبط','این سرویس بخشی از اکوسیستم VinTech است؛ سرویس‌های مرتبط و روش همکاری را هم ببین.','/vintech.html','برگشت به VinTech'],en:['Related path','This service is part of the VinTech system. See related services and the working approach.','/en-vintech.html','Back to VinTech']}
  };
  const d=map[page];if(!d)return;const x=lang?d.en:d.fa;
  const box=document.createElement('aside');box.className='so-next';box.innerHTML=`<div><strong>${x[0]}</strong><span>${x[1]}</span></div><a href="${x[2]}">${x[3]} ↗</a>`;
  const main=$('main');if(main)main.appendChild(box);
};

const accessibility=()=>{
  $$('a[target="_blank"]').forEach(a=>{if(!a.rel.includes('noopener'))a.rel=(a.rel+' noopener').trim()});
  $$('img').forEach(img=>{if(!img.hasAttribute('loading')&&!img.hasAttribute('fetchpriority'))img.loading='lazy'});
  $$('a').forEach(a=>{if(a.href&&new URL(a.href,location.href).pathname===location.pathname)a.setAttribute('aria-current','page')});
};

const init=()=>{if(document.body.dataset.siteOverhaul==='1')return;document.body.dataset.siteOverhaul='1';addScrollUI();enhanceSections();addNextStep();accessibility()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
