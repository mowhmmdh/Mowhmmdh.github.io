document.addEventListener('DOMContentLoaded', function() {

    // ===== ناوبری =====
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navItems = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.section');

    // منوی موبایل
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // بستن منو با کلیک روی لینک
    navItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navItems.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // اسکرول برای هایلایت نوار
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 150;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        navItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });

        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // ===== دارک‌مود =====
    const darkToggle = document.getElementById('darkToggle');
    const body = document.body;

    if (localStorage.getItem('dark-mode') === 'false') {
        body.classList.add('light-mode');
        if (darkToggle) darkToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    if (darkToggle) {
        darkToggle.addEventListener('click', function() {
            const isLight = body.classList.toggle('light-mode');
            localStorage.setItem('dark-mode', isLight ? 'false' : 'true');
            this.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }

    // ===== تغییر زبان =====
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', function() {
            const current = window.location.pathname;
            if (current.includes('en')) {
                window.location.href = '/index.html';
            } else {
                window.location.href = '/en.html';
            }
        });
    }

    // ===== مهارت‌ها (انیمیشن بار) =====
    const skillItems = document.querySelectorAll('.skill-item');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    skillItems.forEach(item => skillObserver.observe(item));

    // ===== FAQ =====
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('open');
        });
    });

    // ===== چت‌بات هوش مصنوعی =====
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    let isChatOpen = false;

    if (chatToggle) {
        chatToggle.addEventListener('click', () => {
            isChatOpen = !isChatOpen;
            chatWindow.classList.toggle('open', isChatOpen);
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            isChatOpen = false;
            chatWindow.classList.remove('open');
        });
    }

    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `msg ${sender}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // دانش پایه هوش مصنوعی (کامل)
    const knowledgeBase = {
        'تخصص': 'من محمدحسین عسگری ثمرین، متخصص ارشد شبکه و زیرساخت هستم. تخصص من شامل طراحی شبکه، کابل‌کشی، دوربین مداربسته، تعمیرات سخت‌افزار و نرم‌افزار است.',
        'خدمات': 'خدمات من شامل: ۱- طراحی و پیاده‌سازی شبکه ۲- نصب و پشتیبانی CCTV ۳- تعمیرات نرم‌افزاری ۴- تعمیرات سخت‌افزاری ۵- امنیت شبکه',
        'تماس': 'برای تماس با من می‌توانید از فرم تماس در سایت، ایمیل mohammedhasgari@gmail.com، یا لینکدین و اینستاگرام استفاده کنید.',
        'همکاری': 'برای همکاری کافی است از بخش خدمات، خدمت مورد نظر را انتخاب کرده و فرم درخواست را پر کنید. در اسرع وقت با شما تماس می‌گیرم.',
        'سابقه': 'من سابقه همکاری با وزارت کشور، مؤسسه صمت، کیمیا مهر اسپادانا و در حال حاضر شرکت ماهکس را دارم.',
        'مدارک': 'من دارای گواهینامه‌های CCNA، Network+ و CEH هستم.',
        'سلام': 'سلام! وقت بخیر. چطور می‌توانم به شما کمک کنم؟',
        'network': 'I specialize in network design, structured cabling, switch/router configuration, and troubleshooting.',
        'service': 'My services include: 1- Network Design 2- CCTV Installation 3- Software Repair 4- Hardware Repair 5- Network Security',
        'contact': 'You can contact me via the contact form, email mohammedhasgari@gmail.com, or LinkedIn/Instagram.',
        'experience': 'I have experience with the Ministry of Interior, Samat Institute, Kimia Mehr Espadana, and currently Mahex Air Cargo Services.',
        'certificate': 'I hold CCNA, Network+, and CEH certifications.',
        'who': 'Mohammad Hossein Asgari Somarin is a Senior Network & Infrastructure specialist with 2+ years of experience.',
        'expertise': 'My expertise includes network design, structured cabling, CCTV, hardware repair, software repair, and network security.'
    };

    function getAIResponse(query) {
        const lower = query.toLowerCase();
        for (const [key, value] of Object.entries(knowledgeBase)) {
            if (lower.includes(key)) return value;
        }
        if (lower.includes('؟') || lower.includes('?')) {
            return 'سوال خوبی پرسیدید! برای پاسخ دقیق‌تر، لطفاً سوال خود را واضح‌تر بپرسید یا از بخش "تماس با من" استفاده کنید.';
        }
        return 'متأسفم، پاسخ دقیقی برای این سوال ندارم. لطفاً سوال خود را واضح‌تر بپرسید یا از بخش تماس با من استفاده کنید.';
    }

    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        chatInput.value = '';

        const typingMsg = document.createElement('div');
        typingMsg.className = 'msg bot';
        typingMsg.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        chatMessages.appendChild(typingMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            chatMessages.removeChild(typingMsg);
            const response = getAIResponse(text);
            addMessage(response, 'bot');
        }, 800 + Math.random() * 400);
    }

    if (chatSend) {
        chatSend.addEventListener('click', sendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // ===== بنر کوکی =====
    const cookieBanner = document.getElementById('cookieBanner');
    if (cookieBanner) {
        const consent = localStorage.getItem('cookie-consent');
        if (consent === 'accepted' || consent === 'rejected') {
            cookieBanner.classList.remove('show');
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

    // ===== به‌روزرسانی تاریخ =====
    const now = new Date();
    const updateFa = document.getElementById('update-date-fa');
    const updateEn = document.getElementById('update-date-en');

    if (updateFa) {
        const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        const year = now.getFullYear() - 621;
        updateFa.textContent = `به‌روزرسانی: ${now.getDate()} ${persianMonths[now.getMonth()]} ${year}`;
    }

    if (updateEn) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        updateEn.textContent = `Last Updated: ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }

    // ===== فرم تماس (AJAX) =====
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const submitBtn = this.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ارسال...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    submitBtn.innerHTML = '✅ ارسال شد!';
                    this.reset();
                    const msg = document.createElement('div');
                    msg.style.cssText = 'padding:16px;background:rgba(0,212,255,0.08);border-radius:16px;color:var(--accent-1);text-align:center;margin-top:16px;border:1px solid rgba(0,212,255,0.1);font-weight:600;';
                    msg.textContent = '✅ پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهم گرفت.';
                    this.appendChild(msg);
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'contact_form_submit', { 'event_category': 'conversion' });
                    }
                } else {
                    throw new Error('خطا در ارسال');
                }
            } catch (error) {
                submitBtn.innerHTML = '❌ خطا!';
                const msg = document.createElement('div');
                msg.style.cssText = 'padding:16px;background:rgba(244,63,94,0.08);border-radius:16px;color:#f43f5e;text-align:center;margin-top:16px;border:1px solid rgba(244,63,94,0.1);font-weight:600;';
                msg.textContent = '❌ متأسفانه ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
                this.appendChild(msg);
            } finally {
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }

});
