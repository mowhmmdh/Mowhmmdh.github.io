(() => {
  'use strict';

  const root = document.documentElement;
  const storageKey = 'mha-theme';
  const FULL_NAME = 'محمدحسین عسگری ثمرین';
  const SHORT_NAME = 'محمدحسین عسگری';
  const shortNamePattern = new RegExp(`${SHORT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\s*ثمرین)`, 'g');

  const ensureResponsiveCore = () => {
    if (document.querySelector('link[data-responsive-core]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/responsive-core-2026.css';
    link.dataset.responsiveCore = 'true';
    document.head.appendChild(link);
  };

  const normalizeIdentity = () => {
    const replaceShortName = value => typeof value === 'string' ? value.replace(shortNamePattern, FULL_NAME) : value;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('script,style,noscript,template')) continue;
      nodes.push(node);
    }
    for (const textNode of nodes) textNode.nodeValue = replaceShortName(textNode.nodeValue);
    if (document.title.includes(SHORT_NAME) && !document.title.includes(FULL_NAME)) document.title = replaceShortName(document.title);
    document.querySelectorAll('meta[content], img[alt], a[aria-label], button[aria-label]').forEach(el => {
      const attr = el.hasAttribute('content') ? 'content' : el.hasAttribute('alt') ? 'alt' : 'aria-label';
      const value = el.getAttribute(attr);
      if (value && value.includes(SHORT_NAME) && !value.includes(FULL_NAME)) el.setAttribute(attr, replaceShortName(value));
    });
  };

  const addCctvExperience = () => {
    const path = location.pathname.replace(/\/$/, '') || '/';
    const isHome = path === '' || path === '/index.html' || path === '/';
    const isVinTech = path === '/vintech.html';
    const isServices = path === '/services.html';
    if (!isHome && !isVinTech && !isServices) return;
    if (!document.querySelector('[data-cctv-focus]')) {
      const section = document.createElement('section');
      section.setAttribute('data-cctv-focus', 'true');
      section.className = isVinTech ? 'vt-section vt-cctv-focus' : 'site-wrap mh-section cctv-focus';
      section.innerHTML = isVinTech ? `
        <div class="vt-container"><div class="vt-head"><div class="vt-eyebrow">CCTV · IP CAMERA · NVR</div><h2>دوربین مداربسته را هم به‌صورت تخصصی انجام می‌دهم.</h2><p>در کنار شبکه، زیرساخت و امنیت، طراحی و اجرای زیرساخت نظارت تصویری هم جزو خدمات VinTech است؛ از معماری دوربین و مسیر شبکه تا PoE، NVR، ذخیره‌سازی و دسترسی امن.</p></div><div class="vt-grid"><article class="vt-card"><div class="vt-icon">01</div><h3>طراحی CCTV تحت شبکه</h3><p>جانمایی، IP Plan، ظرفیت لینک، PoE و تفکیک ترافیک دوربین‌ها بر اساس نیاز پروژه.</p></article><article class="vt-card"><div class="vt-icon">02</div><h3>NVR و Storage</h3><p>برآورد فضای ذخیره‌سازی بر مبنای تعداد دوربین، رزولوشن، نرخ فریم و مدت نگهداری.</p></article><article class="vt-card"><div class="vt-icon">03</div><h3>امنیت و نگهداری</h3><p>محدودسازی دسترسی، مدیریت حساب‌ها، به‌روزرسانی، پایش و عیب‌یابی مسیر دوربین تا NVR.</p></article></div><div class="vt-actions" style="margin-top:22px"><a class="vt-btn primary" href="/vintech/cctv-nvr.html">جزئیات خدمات دوربین مداربسته ↗</a><a class="vt-btn" href="/vintech/request.html">درخواست اجرا</a></div></div>` : `
        <div class="mh-section-head"><div><span class="mh-eyebrow">CCTV / IP VIDEO / NVR</span><h2>دوربین مداربسته هم بخشی از خدمات فنی من است.</h2></div><a class="mh-text-link" href="/vintech/cctv-nvr.html">جزئیات خدمت ↗</a></div><p class="mh-section-lead">در پروژه‌های نظارت تصویری، فقط خود دوربین مهم نیست؛ شبکه، کابل‌کشی، PoE، NVR، ذخیره‌سازی، دسترسی و امنیت باید از ابتدا هماهنگ طراحی شوند.</p><div class="mh-cards mh-cards-3"><a class="mh-card" href="/vintech/cctv-nvr.html"><span class="mh-card-tag">IP CCTV</span><h3>طراحی و اجرای دوربین تحت شبکه</h3><p>از مسیر کابل و PoE تا IP Plan و اتصال پایدار تجهیزات.</p></a><a class="mh-card" href="/blog/cctv-ip-camera-network-design.html"><span class="mh-card-tag">TECHNICAL GUIDE</span><h3>راهنمای طراحی CCTV</h3><p>نکات عملی انتخاب توپولوژی، ظرفیت ذخیره‌سازی، امنیت و عیب‌یابی.</p></a><a class="mh-card" href="/services.html"><span class="mh-card-tag">SERVICE</span><h3>خدمات فنی VinTech</h3><p>دوربین، شبکه، زیرساخت، سرور و امنیت در یک مسیر اجرایی.</p></a></div>`;
      if (isServices) { const main = document.querySelector('main'); const hero = main?.querySelector('.hero'); if (hero) hero.insertAdjacentElement('afterend', section); else main?.appendChild(section); }
      else if (isVinTech) { const main = document.querySelector('main'); const firstSection = main?.querySelector('.vt-section'); if (firstSection) firstSection.insertAdjacentElement('afterend', section); else main?.appendChild(section); }
      else document.querySelector('main')?.appendChild(section);
    }
    if (!document.querySelector('script[data-cctv-schema]')) {
      const s = document.createElement('script'); s.type = 'application/ld+json'; s.dataset.cctvSchema = 'true';
      s.textContent = JSON.stringify({'@context':'https://schema.org','@type':'Service','@id':'https://mowhmmdh.github.io/vintech/cctv-nvr.html#service','name':'خدمات دوربین مداربسته و NVR','alternateName':'CCTV & NVR Services','description':'طراحی و اجرای زیرساخت دوربین مداربسته تحت شبکه، PoE، NVR، ذخیره‌سازی و دسترسی امن.','url':'https://mowhmmdh.github.io/vintech/cctv-nvr.html','provider':{'@type':'Organization','name':'VinTech','url':'https://mowhmmdh.github.io/vintech.html'},'areaServed':'Iran','inLanguage':'fa-IR'});
      document.head.appendChild(s);
    }
  };

  const addContentDiscovery = () => {
    const path = location.pathname.replace(/\/$/, '') || '/';
    const config = {
      '/blog': {title:'جدید: طراحی دوربین مداربسته تحت شبکه', text:'راهنمای عملی IP Camera، PoE، VLAN، NVR، Storage و امنیت برای پروژه‌های واقعی.', href:'/blog/cctv-ip-camera-network-design.html', label:'CCTV / NETWORK', fa:true},
      '/en-blog.html': {title:'New: IP CCTV Network Design Guide', text:'A practical guide to IP cameras, PoE, VLANs, NVR storage and security.', href:'/en-blog/cctv-ip-camera-network-design.html', label:'CCTV / NETWORK', fa:false},
      '/vintech/insights': {title:'جدید: امن‌سازی دوربین مداربسته تحت شبکه', text:'VLAN، کنترل دسترسی، Firmware، Logging و Remote Access را از دید عملیاتی بررسی می‌کنیم.', href:'/vintech/insights/cctv-ip-camera-security.html', label:'VINTECH / CCTV SECURITY', fa:true},
      '/en-vintech/insights': {title:'New: Securing IP CCTV Networks', text:'Engineering controls for VLANs, access, firmware, logging and remote access.', href:'/en-vintech/insights/cctv-ip-camera-security.html', label:'VINTECH / CCTV SECURITY', fa:false}
    }[path];
    if (!config || document.querySelector('[data-content-discovery]')) return;
    const main = document.querySelector('main'); if (!main) return;
    const box = document.createElement('aside'); box.dataset.contentDiscovery = 'true'; box.className = 'cctv-discovery';
    box.innerHTML = `<div><span>${config.label}</span><h2>${config.title}</h2><p>${config.text}</p></div><a href="${config.href}">${config.fa ? 'مطالعه مقاله ↗' : 'Read article ↗'}</a>`;
    const anchor = main.querySelector('.grid,.clusters,.vt-grid,.hero');
    if (anchor && anchor.parentElement === main) anchor.insertAdjacentElement('afterend', box); else main.appendChild(box);
  };

  try { if (localStorage.getItem(storageKey) === 'light') root.classList.add('theme-light'); } catch (_) {}
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    const sync = () => { const light = root.classList.contains('theme-light'); btn.textContent = light ? '☀' : '☾'; btn.setAttribute('aria-label', light ? 'فعال‌کردن حالت تیره' : 'فعال‌کردن حالت روشن'); btn.setAttribute('aria-pressed', String(light)); };
    btn.addEventListener('click', () => { root.classList.toggle('theme-light'); try { localStorage.setItem(storageKey, root.classList.contains('theme-light') ? 'light' : 'dark'); } catch (_) {} sync(); }); sync();
  });
  document.querySelectorAll('.site-nav').forEach(nav => {
    const menu = nav.querySelector('.mobile-menu'), links = nav.querySelector('.nav-links'); if (!menu || !links) return;
    menu.setAttribute('aria-expanded','false');
    menu.addEventListener('click', () => { const open = nav.classList.toggle('menu-open'); menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open?'بستن منو':'باز کردن منو'); menu.textContent=open?'×':'☰'; });
    links.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('menu-open'); menu.setAttribute('aria-expanded','false'); menu.textContent='☰'; } });
  });
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; document.querySelectorAll('.site-nav.menu-open').forEach(nav => { nav.classList.remove('menu-open'); const menu=nav.querySelector('.mobile-menu'); if(menu){menu.setAttribute('aria-expanded','false');menu.textContent='☰';} }); });

  const boot = () => { ensureResponsiveCore(); normalizeIdentity(); addCctvExperience(); addContentDiscovery(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
})();
