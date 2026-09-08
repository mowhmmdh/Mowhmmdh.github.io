(()=>{
const root=document.documentElement;
const key='personal-theme';
const preferred=matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';
const css=`
html[data-theme="light"]{color-scheme:light!important}
html[data-theme="dark"]{color-scheme:dark!important}
html[data-theme="light"] body,html[data-theme="light"] body.vintech-modern{background:#f5f7fa!important;color:#17212b!important}
html[data-theme="light"] body:before{opacity:.02!important;background-image:linear-gradient(rgba(23,33,43,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(23,33,43,.35) 1px,transparent 1px)!important}
html[data-theme="light"] .nav,html[data-theme="light"] .site-nav,html[data-theme="light"] .vt-nav,html[data-theme="light"] header{background:rgba(255,255,255,.96)!important;color:#17212b!important;border-color:rgba(23,33,43,.12)!important;box-shadow:0 8px 30px rgba(23,33,43,.07)!important}
html[data-theme="light"] .nav a,html[data-theme="light"] .site-nav a,html[data-theme="light"] .nav-links a,html[data-theme="light"] .vt-links a{color:#526170!important}
html[data-theme="light"] .nav a:first-child,html[data-theme="light"] .brand,html[data-theme="light"] .site-nav .brand{color:#17212b!important}
html[data-theme="light"] .hero,html[data-theme="light"] .page-hero,html[data-theme="light"] .vt-hero{background:linear-gradient(180deg,rgba(154,101,0,.035),transparent)!important;color:#17212b!important}
html[data-theme="light"] h1,html[data-theme="light"] h2,html[data-theme="light"] h3,html[data-theme="light"] h4,html[data-theme="light"] .hero h1,html[data-theme="light"] .page-hero h1,html[data-theme="light"] .vt-hero h1{color:#17212b!important}
html[data-theme="light"] p,html[data-theme="light"] li,html[data-theme="light"] .hero p,html[data-theme="light"] .hero-copy,html[data-theme="light"] .lead,html[data-theme="light"] .muted,html[data-theme="light"] .vt-lead,html[data-theme="light"] .vt-section-head p{color:#526170!important}
html[data-theme="light"] .eyebrow,html[data-theme="light"] .kicker,html[data-theme="light"] .hero-kicker,html[data-theme="light"] .vt-kicker,html[data-theme="light"] .tag,html[data-theme="light"] .vt-icon{color:#8b5b00!important}
html[data-theme="light"] .card,html[data-theme="light"] .post-card,html[data-theme="light"] .stat,html[data-theme="light"] .skill-category,html[data-theme="light"] .service-card,html[data-theme="light"] .project-card,html[data-theme="light"] .feature-card,html[data-theme="light"] .timeline-item,html[data-theme="light"] .experience-item,html[data-theme="light"] .profile-card,html[data-theme="light"] .vt-card,html[data-theme="light"] .vt-expertise>div,html[data-theme="light"] .metric,html[data-theme="light"] .faq-item,html[data-theme="light"] .cta,html[data-theme="light"] .contact-wrapper{background:#fff!important;color:#17212b!important;border-color:rgba(23,33,43,.13)!important;box-shadow:0 12px 35px rgba(23,33,43,.07)!important}
html[data-theme="light"] .card h2,html[data-theme="light"] .card h3,html[data-theme="light"] .post-card h3,html[data-theme="light"] .service-card h2,html[data-theme="light"] .service-card h3,html[data-theme="light"] .project-card h2,html[data-theme="light"] .project-card h3,html[data-theme="light"] .skill-category h3,html[data-theme="light"] .feature-card h2,html[data-theme="light"] .feature-card h3,html[data-theme="light"] .vt-card h3,html[data-theme="light"] .vt-expertise h3{color:#765000!important}
html[data-theme="light"] .links a,html[data-theme="light"] .signal,html[data-theme="light"] .vt-trust span{background:#fff9ed!important;color:#765000!important;border-color:rgba(139,91,0,.2)!important}
html[data-theme="light"] .btn:not(.primary),html[data-theme="light"] .vt-btn:not(.primary),html[data-theme="light"] .theme-toggle,html[data-theme="light"] .mobile-menu{background:#fff!important;color:#263746!important;border-color:rgba(23,33,43,.16)!important}
html[data-theme="light"] .btn.primary,html[data-theme="light"] .vt-btn.primary{background:linear-gradient(135deg,#9a6500,#b97b08)!important;color:#fff!important;border-color:transparent!important}
html[data-theme="light"] form,html[data-theme="light"] .form-card,html[data-theme="light"] .contact-form{background:#fff!important;color:#17212b!important;border-color:rgba(23,33,43,.13)!important;box-shadow:0 18px 50px rgba(23,33,43,.1)!important}
html[data-theme="light"] input,html[data-theme="light"] textarea,html[data-theme="light"] select{background:#fff!important;color:#17212b!important;border-color:rgba(23,33,43,.18)!important}
html[data-theme="light"] input::placeholder,html[data-theme="light"] textarea::placeholder{color:#7a8793!important}
html[data-theme="light"] .article,html[data-theme="light"] .article-content,html[data-theme="light"] .post-content{background:#fff!important;color:#17212b!important;border-color:rgba(23,33,43,.13)!important;box-shadow:0 18px 50px rgba(23,33,43,.09)!important}
html[data-theme="light"] .article h1,html[data-theme="light"] .article-content h1,html[data-theme="light"] .post-content h1{color:#17212b!important}
html[data-theme="light"] .article h2,html[data-theme="light"] .article-content h2,html[data-theme="light"] .post-content h2{color:#765000!important}
html[data-theme="light"] pre,html[data-theme="light"] .terminal{background:#111923!important;color:#dbe4ec!important}
html[data-theme="light"] .vt-orbit i{background:#fff!important;color:#17212b!important;border-color:rgba(23,33,43,.13)!important;box-shadow:0 8px 20px rgba(23,33,43,.1)!important}
html[data-theme="light"] .vt-orbit:before{border-color:rgba(23,33,43,.1)!important}
html[data-theme="light"] .section,html[data-theme="light"] .vt-section{color:#17212b!important}
html[data-theme="light"] a{color:#765000}
html[data-theme="light"] .mobile-panel{background:#fff!important;color:#17212b!important;border-color:rgba(23,33,43,.14)!important}
html[data-theme="light"] .mobile-panel a{color:#526170!important}
`;
const install=()=>{if(document.getElementById('universal-theme-overrides'))return;const s=document.createElement('style');s.id='universal-theme-overrides';s.textContent=css;document.head.appendChild(s)};
const apply=t=>{install();root.dataset.theme=t;root.style.colorScheme=t;localStorage.setItem(key,t);document.querySelectorAll('.theme-toggle,.vt-theme-toggle').forEach(b=>{b.textContent=t==='dark'?'☀':'☾';b.setAttribute('aria-label',t==='dark'?'Switch to light mode':'Switch to dark mode');b.title=t==='dark'?'Light mode':'Dark mode'})};
const mount=()=>{install();document.body.classList.add('personal-site');document.querySelectorAll('.theme-toggle,.vt-theme-toggle').forEach(b=>{b.onclick=()=>apply(root.dataset.theme==='dark'?'light':'dark')});apply(localStorage.getItem(key)||preferred)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();