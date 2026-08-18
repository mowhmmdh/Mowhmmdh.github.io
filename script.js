document.addEventListener('DOMContentLoaded', function() {

    // ============================================================
    // DEBOUNCE
    // ============================================================
    function debounce(fn, delay) {
        let timer;
        return function() {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, arguments), delay);
        };
    }

    // ============================================================
    // DATE CONVERTERS
    // ============================================================
    function gregorianToJalali(gy, gm, gd) {
        var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var jy, jm, jd;
        var gy2 = (gm > 2) ? (gy + 1) : gy;
        var days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
        jy = -1595 + (33 * ~~(days / 12053));
        days %= 12053;
        jy += 4 * ~~(days / 1461);
        days %= 1461;
        if (days > 365) {
            jy += ~~((days - 1) / 365);
            days = (days - 1) % 365;
        }
        if (days < 0) {
            jy -= 1;
            days += 365;
        }
        jm = (days < 186) ? 1 + ~~(days / 31) : 7 + ~~((days - 186) / 30);
        jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        return [jy, jm, jd];
    }

    function toPersianDate(date) {
        const [year, month, day] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        return `${day} ${months[month - 1]} ${year}`;
    }

    function toEnglishDate(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
            'November', 'December'
        ];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    // ============================================================
    // PARTICLES BACKGROUND
    // ============================================================
    function initParticles() {
        const isMobile = window.innerWidth <= 768;
        const count = isMobile ? 20 : 40;
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        document.body.prepend(canvas);
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = isMobile ? Math.random() * 0.2 + 0.05 : Math.random() * 0.35 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(37, 99, 235, ${this.opacity})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < count; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update();
                p.draw(); });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = isMobile ? 80 : 120;
                    if (dist < maxDist) {
                        ctx.beginPath();
                        const opacity = isMobile ? 0.03 * (1 - dist / maxDist) : 0.06 * (1 - dist / maxDist);
                        ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
                        ctx.lineWidth = isMobile ? 0.3 : 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    }
    initParticles();

    // ============================================================
    // PROGRESS BAR
    // ============================================================
    function updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const bar = document.getElementById('progress-bar');
        if (bar) bar.style.width = percent + '%';
    }
    window.addEventListener('scroll', debounce(updateProgressBar, 10), { passive: true });
    updateProgressBar();

    // ============================================================
    // JOB DURATION
    // ============================================================
    function updateJobDuration() {
        const now = new Date();
        const startFa = document.getElementById('start-date-fa');
        const displayFa = document.getElementById('duration-display-fa');
        if (startFa && displayFa) {
            const start = new Date(startFa.getAttribute('data-start'));
            let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
            if (now.getDate() < start.getDate()) months--;
            if (months >= 12) {
                const years = Math.floor(months / 12);
                const rem = months % 12;
                displayFa.textContent = rem === 0 ? years + ' سال' : years + ' سال و ' + rem + ' ماه';
            } else {
                displayFa.textContent = months + ' ماه';
            }
        }
        const startEn = document.getElementById('start-date-en');
        const displayEn = document.getElementById('duration-display-en');
        if (startEn && displayEn) {
            const start = new Date(startEn.getAttribute('data-start'));
            let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
            if (now.getDate() < start.getDate()) months--;
            if (months >= 12) {
                const years = Math.floor(months / 12);
                const rem = months % 12;
                displayEn.textContent = rem === 0 ? years + ' year' + (years > 1 ? 's' : '') : years + ' year' + (years > 1 ?
                    's' : '') + ' and ' + rem + ' month' + (rem > 1 ? 's' : '');
            } else {
                displayEn.textContent = months + ' month' + (months > 1 ? 's' : '');
            }
        }
    }
    updateJobDuration();

    // ============================================================
    // SKILLS ANIMATION
    // ============================================================
    const skillItems = document.querySelectorAll('.skill-level-item');

    function animateSkills() {
        skillItems.forEach(item => {
            const bar = item.querySelector('.skill-bar');
            if (bar) {
                const val = parseInt(bar.getAttribute('data-width'));
                if (!isNaN(val) && val > 0) {
                    item.style.setProperty('--skill-width', val + '%');
                    bar.style.width = val + '%';
                    item.classList.add('show');
                }
            }
        });
    }
    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(animateSkills, 200);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        observer.observe(skillsSection);
        setTimeout(() => {
            if (!document.querySelector('.skill-level-item.show')) animateSkills();
        }, 3000);
    } else {
        animateSkills();
    }

    // ============================================================
    // SECTIONS VISIBILITY
    // ============================================================
    const sections = document.querySelectorAll('.section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'section_view', {
                        event_category: 'engagement',
                        event_label: entry.target.id || 'section'
                    });
                }
            }
        });
    }, { threshold: 0.06 });
    sections.forEach(s => sectionObserver.observe(s));

    // ============================================================
    // SERVICE CARDS ANIMATION
    // ============================================================
    const serviceCards = document.querySelectorAll('.service-card');
    const serviceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                serviceObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });
    serviceCards.forEach(c => serviceObserver.observe(c));

    // ============================================================
    // BACK TO TOP
    // ============================================================
    const backBtn = document.getElementById('back-to-top');

    function toggleBackBtn() {
        if (backBtn) backBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    }
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (typeof gtag !== 'undefined') gtag('event', 'back_to_top', { event_category: 'engagement' });
        });
        window.addEventListener('scroll', debounce(toggleBackBtn, 50), { passive: true });
        toggleBackBtn();
    }

    // ============================================================
    // ACTIVE NAV
    // ============================================================
    const navLinks = document.querySelectorAll('#navbar a');

    function updateActiveNav() {
        let current = '';
        const scrollY = window.scrollY;
        sections.forEach(section => {
            const top = section.offsetTop - 180;
            if (scrollY >= top) current = section.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) link.classList.add('active');
        });
    }
    window.addEventListener('scroll', debounce(updateActiveNav, 50), { passive: true });
    updateActiveNav();

    // ============================================================
    // JOB ITEMS FADE-IN
    // ============================================================
    const jobItems = document.querySelectorAll('.job-item');
    const jobObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 60);
                jobObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });
    jobItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        jobObserver.observe(item);
    });

    // ============================================================
    // TYPING EFFECT
    // ============================================================
    const typingEl = document.querySelector('.typing-text');
    if (typingEl) {
        const words = JSON.parse(typingEl.getAttribute('data-words') || '["متخصص IT"]');
        let wordIdx = 0,
            charIdx = 0,
            isDeleting = false,
            speed = 80,
            isPaused = false;

        function type() {
            if (isPaused) { setTimeout(type, 100); return; }
            const current = words[wordIdx];
            if (isDeleting) {
                typingEl.textContent = current.substring(0, charIdx - 1);
                charIdx--;
                speed = 35;
            } else {
                typingEl.textContent = current.substring(0, charIdx + 1);
                charIdx++;
                speed = 80 + Math.random() * 40;
            }
            if (!isDeleting && charIdx === current.length) {
                isPaused = true;
                setTimeout(() => { isPaused = false;
                    isDeleting = true;
                    setTimeout(type, 100); }, 2200);
                return;
            }
            if (isDeleting && charIdx === 0) {
                isDeleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                isPaused = true;
                setTimeout(() => { isPaused = false;
                    setTimeout(type, 100); }, 300);
                return;
            }
            setTimeout(type, speed);
        }
        setTimeout(type, 600);
    }

    // ============================================================
    // DARK MODE
    // ============================================================
    const darkToggle = document.getElementById('dark-toggle');
    const body = document.body;
    if (localStorage.getItem('dark-mode') === 'true') {
        body.classList.add('dark-mode');
        darkToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
    }
    darkToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDark);
        this.innerHTML = isDark ? '<i class="fas fa-sun" aria-hidden="true"></i>' :
            '<i class="fas fa-moon" aria-hidden="true"></i>';
        if (typeof gtag !== 'undefined') {
            gtag('event', 'dark_mode_toggle', {
                event_category: 'engagement',
                event_label: isDark ? 'dark' : 'light'
            });
        }
    });

    // ============================================================
    // LANGUAGE TOGGLE
    // ============================================================
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
        langBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const path = window.location.pathname;
            if (path === '/' || path === '/index.html' || path === '') {
                window.location.href = '/en.html';
            } else {
                window.location.href = '/index.html';
            }
        });
    }

    // ============================================================
    // SERVICE REQUEST FORM
    // ============================================================
    const serviceBtns = document.querySelectorAll('.service-select-btn');
    const serviceForm = document.getElementById('service-request-form');
    const selectedService = document.getElementById('selected-service');
    if (serviceBtns.length && serviceForm) {
        serviceBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const service = this.getAttribute('data-service');
                if (selectedService) selectedService.value = service;
                serviceForm.style.display = 'block';
                serviceForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'service_request_open', { event_category: 'conversion', event_label: service });
                }
            });
        });
        const cancelBtn = document.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                serviceForm.style.display = 'none';
                const form = document.getElementById('service-form');
                if (form) form.reset();
                const msg = form.querySelector('.form-message');
                if (msg) msg.remove();
            });
        }
    }

    // ============================================================
    // SHARE BUTTONS
    // ============================================================
    const shareBtns = document.querySelectorAll('.share-btn');
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const type = this.getAttribute('data-share');
            let shareUrl = '';
            switch (type) {
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${title}%20${url}`;
                    break;
                case 'telegram':
                    shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
                    break;
                case 'copy':
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href).then(() => {
                            alert('✅ لینک کپی شد!');
                        }).catch(() => alert('لینک: ' + window.location.href));
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = window.location.href;
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy');
                            alert('✅ لینک کپی شد!'); } catch (e) { alert('لینک: ' + window.location.href); }
                        document.body.removeChild(ta);
                    }
                    if (typeof gtag !== 'undefined') gtag('event', 'share', { event_category: 'engagement',
                        event_label: type });
                    return;
                default:
                    return;
            }
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=500,scrollbars=yes');
                if (typeof gtag !== 'undefined') gtag('event', 'share', { event_category: 'engagement',
                    event_label: type });
            }
        });
    });

    // ============================================================
    // UPDATE DATE
    // ============================================================
    const updateFa = document.getElementById('update-date-fa');
    const updateEn = document.getElementById('update-date-en');
    const now = new Date();
    if (updateFa) updateFa.textContent = 'به‌روزرسانی: ' + toPersianDate(now);
    if (updateEn) updateEn.textContent = 'Last Updated: ' + toEnglishDate(now);

    // ============================================================
    // CONTACT FORM (AJAX)
    // ============================================================
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const btn = this.querySelector('.cta-button');
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> در حال ارسال...';
            btn.disabled = true;
            const oldMsg = this.querySelector('.form-message');
            if (oldMsg) oldMsg.remove();
            try {
                const res = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                const msg = document.createElement('div');
                msg.className = 'form-message';
                if (res.ok) {
                    btn.innerHTML = '✅ ارسال شد!';
                    this.reset();
                    msg.style.cssText =
                        'padding:14px 18px;background:rgba(34,197,94,0.12);border-radius:10px;color:#22c55e;text-align:center;margin-top:16px;border:1px solid rgba(34,197,94,0.2);font-weight:500;';
                    msg.textContent = '✅ پیام شما با موفقیت ارسال شد. به زودی پاسخ می‌دهم.';
                    this.appendChild(msg);
                    if (typeof gtag !== 'undefined') gtag('event', 'contact_form_submit', { event_category: 'conversion' });
                } else {
                    throw new Error('خطا');
                }
            } catch (err) {
                btn.innerHTML = '❌ خطا!';
                const msg = document.createElement('div');
                msg.className = 'form-message';
                msg.style.cssText =
                    'padding:14px 18px;background:rgba(239,68,68,0.12);border-radius:10px;color:#ef4444;text-align:center;margin-top:16px;border:1px solid rgba(239,68,68,0.2);font-weight:500;';
                msg.textContent = '❌ ارسال ناموفق بود. لطفاً دوباره تلاش کنید.';
                this.appendChild(msg);
            } finally {
                setTimeout(() => { btn.innerHTML = orig;
                    btn.disabled = false; }, 3000);
            }
        });
    }

    // ============================================================
    // SERVICE FORM (AJAX)
    // ============================================================
    const serviceFormEl = document.getElementById('service-form');
    if (serviceFormEl) {
        serviceFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const btn = this.querySelector('.cta-button');
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> در حال ارسال...';
            btn.disabled = true;
            const oldMsg = this.querySelector('.form-message');
            if (oldMsg) oldMsg.remove();
            try {
                const res = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                const msg = document.createElement('div');
                msg.className = 'form-message';
                if (res.ok) {
                    btn.innerHTML = '✅ ارسال شد!';
                    this.reset();
                    msg.style.cssText =
                        'padding:14px 18px;background:rgba(34,197,94,0.12);border-radius:10px;color:#22c55e;text-align:center;margin-top:16px;border:1px solid rgba(34,197,94,0.2);font-weight:500;';
                    msg.textContent = '✅ درخواست شما ثبت شد. به زودی تماس می‌گیرم.';
                    this.appendChild(msg);
                    const container = document.getElementById('service-request-form');
                    if (container) setTimeout(() => container.style.display = 'none', 5000);
                    if (typeof gtag !== 'undefined') gtag('event', 'service_form_submit', { event_category: 'conversion' });
                } else {
                    throw new Error('خطا');
                }
            } catch (err) {
                btn.innerHTML = '❌ خطا!';
                const msg = document.createElement('div');
                msg.className = 'form-message';
                msg.style.cssText =
                    'padding:14px 18px;background:rgba(239,68,68,0.12);border-radius:10px;color:#ef4444;text-align:center;margin-top:16px;border:1px solid rgba(239,68,68,0.2);font-weight:500;';
                msg.textContent = '❌ ارسال ناموفق بود. لطفاً دوباره تلاش کنید.';
                this.appendChild(msg);
            } finally {
                setTimeout(() => { btn.innerHTML = orig;
                    btn.disabled = false; }, 3000);
            }
        });
    }

});
