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

    const footer = document.querySelector('footer');
    if (footer && !footer.querySelector('.q-footerline')) {
      const line = document.createElement('div');
      line.className = 'q-footerline';
      footer.prepend(line);
    }
  });
})();
