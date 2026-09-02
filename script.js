/* ============================================================
   script.js - جاوااسکریپت کامل
   محمدحسین عسگری ثمرین | متخصص شبکه و زیرساخت
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {

    /* ==========================================================
       مقداردهی اولیه بعد از بارگذاری کامل صفحه
       ========================================================== */
    window.addEventListener('load', function() {
        document.getElementById('preloader').classList.add('hidden');
        initAll();
    });

    /* ==========================================================
       تابع اصلی - همه امکانات
       ========================================================== */
    function initAll() {

        /* ==========================================================
           1. پس‌زمینه شبکه عصبی (Neural Network Background)
           ========================================================== */
        (function neuralNetwork() {
            const canvas = document.getElementById('neural-bg');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let width = window.innerWidth,
                height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            const neurons = [];
            const count = 40;

            for (let i = 0; i < count; i++) {
                neurons.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.08,
                    vy: (Math.random() - 0.5) * 0.08,
                    radius: 1 + Math.random() * 2,
                    color: `rgba(201, 168, 76, ${0.005 + Math.random() * 0.01})`
                });
            }

            function animateNeural() {
                ctx.clearRect(0, 0, width, height);

                for (const n of neurons) {
                    // حرکت ذرات
                    n.x += n.vx;
                    n.y += n.vy;
                    if (n.x < 0 || n.x > width) n.vx *= -1;
                    if (n.y < 0 || n.y > height) n.vy *= -1;

                    // رسم ذره
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                    ctx.fillStyle = n.color;
                    ctx.fill();

                    // رسم خطوط بین ذرات نزدیک
                    for (const n2 of neurons) {
                        const dx = n.x - n2.x,
                            dy = n.y - n2.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 80) {
                            ctx.beginPath();
                            ctx.moveTo(n.x, n.y);
                            ctx.lineTo(n2.x, n2.y);
                            ctx.strokeStyle = `rgba(201, 168, 76, ${0.0005 * (1 - dist / 80)})`;
                            ctx.lineWidth = 0.3;
                            ctx.stroke();
                        }
                    }
                }
                requestAnimationFrame(animateNeural);
            }
            animateNeural();

            // تنظیم مجدد در تغییر اندازه پنجره
            window.addEventListener('resize', () => {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            });
        })();

        /* ==========================================================
           2. کرسر سفارشی (Custom Cursor)
           ========================================================== */
        const dot = document.getElementById('cursorDot');
        const ring = document.getElementById('cursorRing');
        let mx = 0,
            my = 0,
            rx = 0,
            ry = 0;

        document.addEventListener('mousemove', (e) => {
            mx = e.clientX;
            my = e.clientY;
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
        });

        function animRing() {
            rx += (mx - rx) * 0.08;
            ry += (my - ry) * 0.08;
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            requestAnimationFrame(animRing);
        }
        animRing();

        // تغییر حالت حلقه هنگام هاور روی المان‌های قابل کلیک
        document.querySelectorAll('a, button, .service-card, .project-card, .faq-item, .timeline-item')
            .forEach(el => {
                el.addEventListener('mouseenter', () => ring.classList.add('hover'));
                el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
            });

        /* ==========================================================
           3. نمایش بخش‌ها با اسکرول (Intersection Observer)
           ========================================================== */
        const sections = document.querySelectorAll('.section');
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.08 });

        sections.forEach(s => sectionObserver.observe(s));

        /* ==========================================================
           4. انیمیشن نوارهای مهارت (Skills)
           ========================================================== */
        document.querySelectorAll('.skill-item').forEach(item => {
            new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    entries[0].target.classList.add('visible');
                }
            }, { threshold: 0.2 }).observe(item);
        });

        /* ==========================================================
           5. باز و بسته شدن FAQ
           ========================================================== */
        document.querySelectorAll('.faq-item').forEach(item => {
            item.addEventListener('click', function() {
                this.classList.toggle('open');
            });
        });

        /* ==========================================================
           6. نوار ناوبری (Navbar)
           ========================================================== */
        const navbar = document.getElementById('navbar');
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        const navItems = document.querySelectorAll('.nav-links a');
        const allSections = document.querySelectorAll('.section, .hero');

        // منوی موبایل
        if (menuToggle) {
            menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        }

        // کلیک روی لینک‌های ناوبری
        navItems.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    navLinks.classList.remove('open');
                    navItems.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // هایلایت لینک فعال هنگام اسکرول
        window.addEventListener('scroll', function() {
            let current = '';
            allSections.forEach(section => {
                const top = section.offsetTop - 150;
                if (window.scrollY >= top) {
                    current = section.getAttribute('id') || 'hero';
                }
            });
            navItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });

            // افکت اسکرول روی نوار
            navbar.classList.toggle('scrolled', window.scrollY > 50);

            // نمایش دکمه بازگشت به بالا
            document.getElementById('scrollTop').style.display = window.scrollY > 300 ? 'flex' : 'none';
        });

        /* ==========================================================
           7. تغییر تم (Dark/Light Mode)
           ========================================================== */
        const themeToggle = document.getElementById('themeToggle');
        const body = document.body;

        // بازیابی تم ذخیره‌شده
        if (localStorage.getItem('theme') === 'light') {
            body.classList.add('light');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        themeToggle.addEventListener('click', function() {
            const isLight = body.classList.toggle('light');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            this.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });

        /* ==========================================================
           8. تغییر زبان (Language Toggle)
           ========================================================== */
        document.getElementById('langToggle').addEventListener('click', function() {
            const current = window.location.pathname;
            if (current.includes('en')) {
                window.location.href = '/index.html';
            } else {
                window.location.href = '/en.html';
            }
        });

        /* ==========================================================
           9. چت‌بات هوش مصنوعی (Chat)
           ========================================================== */
        const chatToggle = document.getElementById('chatToggle');
        const chatWindow = document.getElementById('chatWindow');
        const chatClose = document.getElementById('chatClose');
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        const chatMessages = document.getElementById('chatMessages');
        let chatOpen = false;

        // باز/بسته کردن چت
        if (chatToggle) {
            chatToggle.addEventListener('click', () => {
                chatOpen = !chatOpen;
                chatWindow.classList.toggle('open', chatOpen);
            });
        }

        if (chatClose) {
            chatClose.addEventListener('click', () => {
                chatOpen = false;
                chatWindow.classList.remove('open');
            });
        }

        // افزودن پیام به چت
        function addMsg(text, sender) {
            const msg = document.createElement('div');
            msg.className = `chat-msg ${sender}`;
            msg.textContent = text;
            chatMessages.appendChild(msg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // دانش پایه هوش مصنوعی
        const knowledge = {
            'تخصص': 'من محمدحسین عسگری ثمرین، متخصص شبکه و زیرساخت هستم.',
            'خدمات': 'خدمات من: طراحی شبکه، CCTV، تعمیرات سخت‌افزار و نرم‌افزار، امنیت شبکه',
            'تماس': 'ایمیل: mohammedhasgari@gmail.com',
            'سلام': 'سلام! چطور می‌توانم به شما کمک کنم؟',
            'expertise': 'I am Mohammad Hossein Asgari Somarin, a Network & Infrastructure Specialist.',
            'services': 'My services: Network Design, CCTV, Hardware Repair, Software Repair, Network Security',
            'contact': 'Email: mohammedhasgari@gmail.com',
            'hello': 'Hello! How can I help you?'
        };

        // پاسخ‌دهی هوش مصنوعی
        function getAIResponse(query) {
            const lower = query.toLowerCase();
            for (const [key, value] of Object.entries(knowledge)) {
                if (lower.includes(key)) return value;
            }
            return 'سوال خوبی است! لطفاً از بخش "تماس با من" استفاده کنید. / Good question! Please use the "Contact" section.';
        }

        // ارسال پیام
        function sendChat() {
            const text = chatInput.value.trim();
            if (!text) return;

            addMsg(text, 'user');
            chatInput.value = '';

            // نمایش علامت تایپ
            const typing = document.createElement('div');
            typing.className = 'chat-msg bot';
            typing.innerHTML = `
                <span style="display:inline-flex;gap:4px;">
                    <span style="width:6px;height:6px;background:var(--text3);border-radius:50%;animation:typing 1.2s infinite;"></span>
                    <span style="width:6px;height:6px;background:var(--text3);border-radius:50%;animation:typing 1.2s infinite 0.2s;"></span>
                    <span style="width:6px;height:6px;background:var(--text3);border-radius:50%;animation:typing 1.2s infinite 0.4s;"></span>
                </span>
            `;
            chatMessages.appendChild(typing);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            setTimeout(() => {
                chatMessages.removeChild(typing);
                const response = getAIResponse(text);
                addMsg(response, 'bot');
            }, 500);
        }

        if (chatSend) chatSend.addEventListener('click', sendChat);
        if (chatInput) chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendChat();
        });

        /* ==========================================================
           10. فرم تماس (Contact Form)
           ========================================================== */
        document.getElementById('contactForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const btn = this.querySelector('.btn-primary');
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ارسال... / Sending...';
            btn.disabled = true;

            try {
                const fd = new FormData(this);
                const res = await fetch(this.action, {
                    method: 'POST',
                    body: fd,
                    headers: { 'Accept': 'application/json' }
                });

                if (res.ok) {
                    this.reset();
                    btn.innerHTML = '✅ ارسال شد! / Sent!';

                    const msg = document.createElement('div');
                    msg.style.cssText = `
                        padding:12px;
                        background:var(--gold-glow);
                        border-radius:8px;
                        color:var(--gold);
                        text-align:center;
                        margin-top:8px;
                        border:1px solid var(--gold-glow);
                    `;
                    msg.textContent = '✅ پیام با موفقیت ارسال شد. / Message sent successfully.';
                    this.appendChild(msg);
                    setTimeout(() => msg.remove(), 5000);

                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'contact_form_submit', { event_category: 'conversion' });
                    }
                } else {
                    throw new Error('خطا / Error');
                }
            } catch (e) {
                btn.innerHTML = '❌ خطا / Error';
                const msg = document.createElement('div');
                msg.style.cssText = `
                    padding:12px;
                    background:rgba(239,68,68,0.04);
                    border-radius:8px;
                    color:#ef4444;
                    text-align:center;
                    margin-top:8px;
                    border:1px solid rgba(239,68,68,0.1);
                `;
                msg.textContent = '❌ خطا در ارسال. لطفاً دوباره تلاش کنید. / Error sending. Please try again.';
                this.appendChild(msg);
                setTimeout(() => msg.remove(), 4000);
            } finally {
                btn.disabled = false;
                setTimeout(() => { btn.innerHTML = orig; }, 3000);
            }
        });

        /* ==========================================================
           11. دکمه‌های اشتراک‌گذاری (Share)
           ========================================================== */
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.share;
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);
                let shareUrl = '';

                switch (type) {
                    case 'linkedin':
                        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                        break;
                    case 'email':
                        shareUrl = `mailto:?subject=${title}&body=${decodeURIComponent(url)}`;
                        break;
                    case 'copy':
                        navigator.clipboard.writeText(window.location.href).then(() => {
                            alert('✅ لینک کپی شد! / Link copied!');
                        });
                        return;
                }

                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=500');
                }
            });
        });

        /* ==========================================================
           12. آمار بازدید و امتیاز (Views & Rating)
           ========================================================== */
        // شمارش بازدید
        let count = parseInt(localStorage.getItem('viewCount') || '0');
        if (!sessionStorage.getItem('viewed')) {
            count++;
            localStorage.setItem('viewCount', count);
            sessionStorage.setItem('viewed', 'true');
        }
        document.getElementById('viewCount').textContent = count.toLocaleString('fa-IR');

        // نمایش امتیاز
        const rating = localStorage.getItem('siteRating');
        document.getElementById('ratingDisplay').textContent = rating ? '⭐ ' + rating + '/5' : '--';

        /* ==========================================================
           13. بنر کوکی (Cookie Consent)
           ========================================================== */
        const cookieBanner = document.getElementById('cookieBanner');
        if (cookieBanner) {
            const consent = localStorage.getItem('cookie-consent');
            if (consent === 'accepted' || consent === 'rejected') {
                cookieBanner.style.display = 'none';
            } else {
                setTimeout(() => cookieBanner.classList.add('show'), 500);
            }

            window.acceptCookies = function() {
                localStorage.setItem('cookie-consent', 'accepted');
                cookieBanner.classList.remove('show');
                if (typeof gtag !== 'undefined') {
                    gtag('consent', 'update', { 'analytics_storage': 'granted' });
                }
            };

            window.rejectCookies = function() {
                localStorage.setItem('cookie-consent', 'rejected');
                cookieBanner.classList.remove('show');
                if (typeof gtag !== 'undefined') {
                    gtag('consent', 'update', { 'analytics_storage': 'denied' });
                }
            };
        }

        /* ==========================================================
           14. به‌روزرسانی تاریخ (Date)
           ========================================================== */
        const now = new Date();

        // تاریخ شمسی
        const updateFa = document.getElementById('update-date-fa');
        if (updateFa) {
            const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            updateFa.textContent =
                `به‌روزرسانی: ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear() - 621}`;
        }

        // تاریخ میلادی
        const updateEn = document.getElementById('update-date-en');
        if (updateEn) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            updateEn.textContent = `Last Updated: ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        }

        /* ==========================================================
           15. دکمه بازگشت به بالا (Scroll Top)
           ========================================================== */
        document.getElementById('scrollTop').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        /* ==========================================================
           16. سرویس‌ورکر (Service Worker - PWA)
           ========================================================== */
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }

        /* ==========================================================
           17. افکت سه‌بعدی پروفایل (3D Tilt)
           ========================================================== */
        const profileCard = document.getElementById('profileCard');
        if (profileCard) {
            profileCard.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                this.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
            });

            profileCard.addEventListener('mouseleave', function() {
                this.style.transform = 'rotateY(0deg) rotateX(0deg)';
            });
        }

    } // end initAll

}); // end DOMContentLoaded
