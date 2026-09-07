(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const isFaVinTech = /\/vintech\.html$/.test(location.pathname);
  const isEnVinTech = /\/en-vintech\.html$/.test(location.pathname);

  const faVinTechMarkup = `
  <div class="vt-bg" aria-hidden="true"></div>
  <header class="vt-nav"><div class="vt-container vt-nav-inner"><a class="vt-logo" href="/vintech.html" aria-label="صفحه اصلی وین‌تک">Vin<span>Tech</span></a><nav class="vt-links" aria-label="ناوبری اصلی"><a class="active" href="/vintech.html">خانه</a><a href="#services">خدمات</a><a href="#approach">رویکرد</a><a href="#contact">تماس</a><a href="/about.html">درباره ما</a><a class="lang" href="/en-vintech.html" lang="en" dir="ltr">EN</a></nav></div></header>
  <main><section class="vt-hero"><div class="vt-container"><div class="vt-kicker">شبکه · زیرساخت · امنیت · فناوری اطلاعات</div><h1>فناوری را <span>مهندسی</span> می‌کنیم، نه فقط اجرا.</h1><p class="vt-lead">وین‌تک روی طراحی، پیاده‌سازی و پشتیبانی راهکارهای واقعی IT تمرکز دارد؛ از شبکه و زیرساخت سازمانی تا امنیت سایبری، سرور، دوربین مداربسته و وب.</p><div class="vt-actions"><a class="vt-btn primary" href="#services">مشاهده خدمات</a><a class="vt-btn" href="/about.html">درباره ما</a></div></div></section>
  <section class="vt-section" id="services"><div class="vt-container"><div class="vt-section-head"><div class="eyebrow">خدمات تخصصی</div><h2>راهکارهای فنی، قابل اتکا و قابل توسعه</h2><p>هر خدمت با نگاه به پایداری، امنیت، مستندسازی و امکان توسعه آینده طراحی می‌شود.</p></div><div class="vt-grid">
  <article class="vt-card"><div class="vt-icon">01</div><h3>شبکه و زیرساخت</h3><p>طراحی و عیب‌یابی شبکه، سوئیچینگ و روتینگ، VLAN، DNS/DHCP، کابل‌کشی ساخت‌یافته، رک و زیرساخت سازمانی.</p></article>
  <article class="vt-card"><div class="vt-icon">02</div><h3>امنیت سایبری</h3><p>سخت‌سازی سرویس‌ها، کنترل دسترسی، تفکیک شبکه، لاگ و پایش و کاهش ریسک‌های عملیاتی.</p></article>
  <article class="vt-card"><div class="vt-icon">03</div><h3>سرور و سیستم</h3><p>Windows Server، Active Directory، Linux، سرویس‌های وب، پایگاه داده و نگهداری زیرساخت.</p></article>
  <article class="vt-card"><div class="vt-icon">04</div><h3>دوربین مداربسته</h3><p>راه‌اندازی CCTV تحت شبکه، NVR، PoE، ذخیره‌سازی، دسترسی از راه دور و زیرساخت ارتباطی.</p></article>
  <article class="vt-card"><div class="vt-icon">05</div><h3>پشتیبانی IT</h3><p>Help Desk، رفع خرابی، نگهداری پیشگیرانه، مستندسازی تجهیزات و بهبود فرآیندهای فنی.</p></article>
  <article class="vt-card"><div class="vt-icon">06</div><h3>طراحی وب و سئو فنی</h3><p>وب‌سایت‌های سریع و واکنش‌گرا با ساختار مناسب، دسترس‌پذیری، Performance و SEO فنی.</p></article>
  </div></div></section>
  <section class="vt-section" id="approach"><div class="vt-container"><div class="vt-section-head"><div class="eyebrow">رویکرد مهندسی</div><h2>اول مسئله، بعد راهکار</h2><p>قبل از انتخاب ابزار، محدودیت‌ها و نیاز واقعی بررسی می‌شوند تا نتیجه فقط زیبا نباشد؛ پایدار و قابل نگهداری هم باشد.</p></div><div class="vt-proof"><div><h3>از تحلیل تا اجرا</h3><ul class="vt-list"><li>شناخت نیاز و وضعیت موجود</li><li>طراحی معماری و انتخاب فناوری</li><li>پیاده‌سازی و تست</li><li>مستندسازی و تحویل</li></ul></div><div><h3>تمرکز روی نتیجه</h3><ul class="vt-list"><li>امنیت از ابتدا، نه در انتهای پروژه</li><li>Performance و پایداری</li><li>قابلیت توسعه در آینده</li><li>پشتیبانی و عیب‌یابی اصولی</li></ul></div></div></div></section>
  <section class="vt-container" id="contact"><div class="vt-cta"><div><h2>برای یک راهکار فنی درست آماده‌ایم.</h2><p>برای بررسی نیاز شبکه، زیرساخت، امنیت یا خدمات IT با ما در ارتباط باشید.</p></div><a class="vt-btn primary" href="mailto:info@vintech.ir">تماس با وین‌تک</a></div></section></main>
  <footer class="vt-footer"><div class="vt-container vt-footer-inner"><span>© VinTech — راهکارهای شبکه و فناوری اطلاعات</span><a href="/en-vintech.html" lang="en">English</a></div></footer>`;

  const enhanceVinTech = () => {
    if (!isFaVinTech && !isEnVinTech) return;
    document.querySelectorAll('.nav-main-link').forEach(el => el.remove());
    if (isFaVinTech) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet'; stylesheet.href = '/assets/vintech.css';
      document.head.appendChild(stylesheet);
      document.title = 'وین‌تک | خدمات شبکه، زیرساخت، امنیت و فناوری اطلاعات';
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.content = 'وین‌تک ارائه‌دهنده خدمات حرفه‌ای شبکه و زیرساخت، امنیت سایبری، سرور و سیستم، دوربین مداربسته، پشتیبانی IT و طراحی وب است.';
      document.body.classList.add('vintech-modern');
      document.body.innerHTML = faVinTechMarkup;
    }
  };

  const addVinTechAbout = () => {
    if (!isFaVinTech && !isEnVinTech) return;
    document.querySelectorAll('.nav-links,.links').forEach(nav => {
      if (nav.querySelector('[data-personal-about]')) return;
      const a = document.createElement('a');
      a.href = isFaVinTech ? '/about.html' : '/en-about.html';
      a.textContent = isFaVinTech ? 'درباره ما' : 'About Us';
      a.setAttribute('data-personal-about','true');
      a.className = 'vintech-about-link';
      nav.appendChild(a);
    });
  };

  const mount = () => {
    enhanceVinTech();
    addVinTechAbout();
    document.querySelectorAll('.card,.service-card,.project-card,.timeline-item,.skill-category,.faq-item,.portrait,.profile-card,.cta,.metric,.vt-card').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--card-x', `${e.clientX-r.left}px`);
        el.style.setProperty('--card-y', `${e.clientY-r.top}px`);
      }, {passive:true});
    });
  };

  let raf = 0;
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    root.style.setProperty('--scroll-progress', (scrollY / max).toFixed(4));
    raf = 0;
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(updateScroll); }, {passive:true});
  updateScroll();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  if (reduce) return;
  addEventListener('pointermove', e => {
    root.style.setProperty('--ui-pointer-x', `${e.clientX}px`);
    root.style.setProperty('--ui-pointer-y', `${e.clientY}px`);
  }, {passive:true});
})();