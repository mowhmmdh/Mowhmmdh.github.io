/* Site Final Quality 2026 — progressive enhancement only; no dependencies. */
(() => {
  'use strict';
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const bar = document.createElement('div');
    bar.className = 'q-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);
    const progress = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, root.scrollTop / max) : 0})`;
    };
    progress();
    window.addEventListener('scroll', progress, {passive:true});
    window.addEventListener('resize', progress, {passive:true});

    const path = location.pathname.replace(/\/+$/, '') || '/';
    const fa = !/^\/en(?:-|\/|$)/i.test(path);
    const pools = fa ? {
      '/blog': [
        ['/blog/network-security-engineering-playbook.html','مهندسی امنیت شبکه','معماری، Segmentation، کنترل دسترسی و Monitoring.'],
        ['/blog/network-security-assessment-checklist.html','ارزیابی امنیت شبکه','چک‌لیست عملی برای پیدا کردن ضعف‌های رایج.'],
        ['/blog/fortigate-hardening-checklist.html','سخت‌سازی FortiGate','بازبینی Policy، مدیریت و Logging.']
      ],
      '/vintech': [
        ['/vintech/network-infrastructure.html','زیرساخت شبکه','طراحی، عیب‌یابی و پایدارسازی شبکه سازمانی.'],
        ['/vintech/cybersecurity.html','امنیت سایبری','کنترل سطح حمله، Hardening و پایش.'],
        ['/vintech/cctv-nvr.html','CCTV و NVR','طراحی شبکه دوربین و نگهداری سیستم نظارت تصویری.']
      ],
      '/services': [
        ['/vintech/network-infrastructure.html','شبکه و زیرساخت','از طراحی تا رفع اختلال و مستندسازی.'],
        ['/vintech/servers-systems.html','سرور و سیستم‌ها','Windows، Linux و سرویس‌های زیرساختی.'],
        ['/vintech/it-support.html','پشتیبانی IT','عیب‌یابی، نگهداری و عملیات روزمره.']
      ],
      '/projects': [
        ['/case-studies/gitlab-infrastructure.html','مطالعه موردی GitLab','زیرساخت، HTTPS و نگهداری سرویس.'],
        ['/case-studies/network-troubleshooting.html','عیب‌یابی شبکه','از نشانه تا Root Cause و Validation.'],
        ['/case-studies/windows-domain-hardening.html','سخت‌سازی Domain','کنترل دسترسی و Hardening اکتیو دایرکتوری.']
      ]
    } : {
      '/en-blog': [
        ['/en-blog/network-security-engineering-playbook.html','Network Security Engineering','Architecture, segmentation, access control and monitoring.'],
        ['/en-blog/network-security-assessment-checklist.html','Security Assessment','A practical checklist for common network weaknesses.'],
        ['/en-blog/fortigate-firewall-policy-design.html','FortiGate Policy Design','Clear rules, logging and least-privilege access.']
      ],
      '/en-vintech': [
        ['/en-vintech/network-infrastructure.html','Network Infrastructure','Design, troubleshooting and stabilization.'],
        ['/en-vintech/cybersecurity.html','Cybersecurity','Attack-surface reduction, hardening and visibility.'],
        ['/en-vintech/cctv-nvr.html','CCTV & NVR','Network-aware video surveillance design.']
      ],
      '/en-services': [
        ['/en-vintech/network-infrastructure.html','Network Infrastructure','From design to troubleshooting and documentation.'],
        ['/en-vintech/servers-systems.html','Servers & Systems','Windows, Linux and infrastructure services.'],
        ['/en-vintech/it-support.html','IT Support','Troubleshooting, maintenance and operations.']
      ],
      '/en-projects': [
        ['/case-studies/gitlab-infrastructure.html','GitLab Infrastructure','Deployment, HTTPS and service maintenance.'],
        ['/case-studies/network-troubleshooting.html','Network Troubleshooting','From symptoms to root cause and validation.'],
        ['/case-studies/windows-domain-hardening.html','Domain Hardening','Identity, access control and hardening.']
      ]
    };
    const key = Object.keys(pools).find(k => path === k || path.startsWith(k + '/'));
    const links = key ? pools[key] : null;
    const article = main.classList.contains('article') || !!main.querySelector('.content');

    if (links && !document.querySelector('.q-discovery')) {
      const section = document.createElement('section');
      section.className = 'q-discovery';
      section.setAttribute('aria-labelledby','q-discovery-title');
      section.innerHTML = `<div class="q-discovery-head"><div><span class="q-discovery-eyebrow">RELATED TECHNICAL PATHS</span><h2 id="q-discovery-title">${fa ? 'ادامه مسیر تخصصی' : 'Continue the technical path'}</h2><p>${fa ? 'مطالب مرتبط را برای دیدن زنجیره کامل موضوع دنبال کنید؛ از طراحی تا اجرا، بررسی و مستندسازی.' : 'Follow related technical pages to connect design, implementation, assessment and documentation.'}</p></div></div><div class="q-discovery-grid">${links.map(([href,title,desc]) => `<a class="q-discovery-card" href="${href}"><strong>${title}</strong><span>${desc}</span><em>${fa ? 'مشاهده →' : 'Open →'}</em></a>`).join('')}</div></section>`;
      (article ? main : document.body).appendChild(section);
    }

    if (article && !document.querySelector('.q-reading-tools')) {
      const tool = document.createElement('div');
      tool.className = 'q-reading-tools';
      tool.innerHTML = `<div class="q-meter"><span class="q-dot" aria-hidden="true"></span><span>${fa ? 'ساختار مرحله‌ای، لینک‌های مرتبط و مطالعه راحت‌تر' : 'Structured reading with related technical paths'}</span></div><span class="q-last-updated"><strong>VinTech / Technical Knowledge Base</strong></span>`;
      const hero = main.querySelector('.article-hero,.page-hero,.about-hero');
      (hero || main.firstElementChild || main).insertAdjacentElement('afterend', tool);
    }

    /* Conversion layer: turn informational traffic into a clear service next step. */
    if (!document.querySelector('.q-conversion')) {
      const conversion = document.createElement('section');
      conversion.className = 'q-conversion';
      conversion.setAttribute('aria-label', fa ? 'درخواست خدمات' : 'Service request');
      conversion.innerHTML = fa
        ? '<div><span class="q-conversion-eyebrow">VINTECH / SERVICE</span><h2>اگر این موضوع به یک مشکل واقعی در شبکه یا زیرساخت شما مربوط است، از همین‌جا شروع کنید.</h2><p>شرح کوتاه مسئله را بفرستید؛ حوزه نیاز مشخص می‌شود و مسیر بررسی یا اجرای پروژه پیشنهاد خواهد شد.</p></div><div class="q-conversion-actions"><a class="q-conversion-primary" data-conversion="service_request" href="/vintech/request.html">درخواست بررسی / پروژه ↗</a><a class="q-conversion-secondary" data-conversion="email" href="mailto:mohammedhasgari@gmail.com?subject=درخواست%20مشاوره%20یا%20پروژه%20VinTech">ایمیل مستقیم</a></div>'
        : '<div><span class="q-conversion-eyebrow">VINTECH / SERVICE</span><h2>Have a real infrastructure or IT problem?</h2><p>Send a short brief and get a practical path for assessment or implementation.</p></div><div class="q-conversion-actions"><a class="q-conversion-primary" data-conversion="service_request" href="/en-vintech/request.html">Request a project review ↗</a><a class="q-conversion-secondary" data-conversion="email" href="mailto:mohammedhasgari@gmail.com?subject=VinTech%20project%20or%20consulting%20request">Direct email</a></div>';
      if (article) {
        main.appendChild(conversion);
      } else if (path !== '/vintech/request.html' && path !== '/en-vintech/request.html') {
        const target = main.querySelector('footer') ? main : document.body;
        target.appendChild(conversion);
      }
    }

    if (!document.querySelector('.q-mobile-cta') && path !== '/vintech/request.html' && path !== '/en-vintech/request.html') {
      const mobileCta = document.createElement('a');
      mobileCta.className = 'q-mobile-cta';
      mobileCta.href = fa ? '/vintech/request.html' : '/en-vintech/request.html';
      mobileCta.setAttribute('data-conversion','mobile_service_request');
      mobileCta.textContent = fa ? 'درخواست پروژه / مشاوره' : 'Request a project review';
      document.body.appendChild(mobileCta);
    }

    const footer = document.querySelector('footer');
    if (footer && !footer.querySelector('.q-footerline')) {
      const line = document.createElement('div');
      line.className = 'q-footerline';
      footer.prepend(line);
    }
  });
})();
