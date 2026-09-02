document.addEventListener('DOMContentLoaded', function() {

    // ===== اسپات‌لایت ماوس =====
    const spotlight = document.createElement('div');
    spotlight.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 0;
        background: radial-gradient(circle 250px at var(--x, 50%) var(--y, 50%), rgba(79, 140, 140, 0.07) 0%, transparent 70%);
        transition: background 0.15s ease;
    `;
    document.body.prepend(spotlight);
    document.addEventListener('mousemove', (e) => {
        spotlight.style.setProperty('--x', e.clientX + 'px');
        spotlight.style.setProperty('--y', e.clientY + 'px');
    });

    // ===== تایپوگرافی پویا =====
    const heroText = document.querySelector('h1');
    document.addEventListener('mousemove', (e) => {
        if (!heroText) return;
        const x = (e.clientX / window.innerWidth) * 100;
        heroText.style.fontVariationSettings = `'wght' ${600 + (x/100) * 300}`;
        heroText.style.letterSpacing = (x/100) * 1.5 + 'px';
    });

    // ===== پارالاکس 3D =====
    const profile = document.querySelector('.profile-wrapper');
    const sidebar = document.querySelector('#sidebar-info');
    document.addEventListener('mousemove', (e) => {
        if (!profile || !sidebar) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        profile.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px) scale(1.04)`;
        sidebar.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    // ===== دارک‌مود =====
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
        this.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // ===== چت‌بات هوش مصنوعی =====
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    let isChatOpen = false;

    chatToggle.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        chatWindow.style.display = isChatOpen ? 'flex' : 'none';
    });

    chatClose.addEventListener('click', () => {
        isChatOpen = false;
        chatWindow.style.display = 'none';
    });

    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${sender}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // دانش پایه هوش مصنوعی
    const knowledgeBase = {
        'تخصص': 'من محمدحسین عسگری ثمرین، متخصص شبکه و زیرساخت هستم. تخصص من شامل طراحی شبکه، کابل‌کشی، دوربین مداربسته، تعمیرات سخت‌افزار و نرم‌افزار است.',
        'خدمات': 'خدمات من شامل: ۱- طراحی و پیاده‌سازی شبکه ۲- نصب و پشتیبانی CCTV ۳- تعمیرات نرم‌افزاری ۴- تعمیرات سخت‌افزاری',
        'تماس': 'برای تماس با من می‌توانید از فرم تماس در سایت، ایمیل mohammedhasgari@gmail.com، یا لینکدین و اینستاگرام استفاده کنید.',
        'همکاری': 'برای همکاری کافی است از بخش خدمات، خدمت مورد نظر را انتخاب کرده و فرم درخواست را پر کنید. در اسرع وقت با شما تماس می‌گیرم.',
        'سابقه': 'من سابقه همکاری با وزارت کشور، مؤسسه صمت، کیمیا مهر اسپادانا و در حال حاضر شرکت ماهکس را دارم.',
        'مدارک': 'من دارای گواهینامه‌های CCNA، Network+ و CEH هستم.',
        'سلام': 'سلام! وقت بخیر. چطور می‌توانم به شما کمک کنم؟',
        'network': 'I specialize in network design, structured cabling, switch/router configuration, and troubleshooting.',
        'service': 'My services include: 1- Network Design 2- CCTV Installation 3- Software Repair 4- Hardware Repair',
        'contact': 'You can contact me via the contact form, email mohammedhasgari@gmail.com, or LinkedIn/Instagram.',
        'experience': 'I have experience with the Ministry of Interior, Samat Institute, Kimia Mehr Espadana, and currently Mahex Air Cargo Services.',
        'certificate': 'I hold CCNA, Network+, and CEH certifications.'
    };

    function getAIResponse(query) {
        const lower = query.toLowerCase();
        for (const [key, value] of Object.entries(knowledgeBase)) {
            if (lower.includes(key)) return value;
        }
        return 'متأسفم، پاسخ دقیقی برای این سوال ندارم. لطفاً سوال خود را واضح‌تر بپرسید یا از بخش تماس با من استفاده کنید.';
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        chatInput.value = '';
        setTimeout(() => {
            const response = getAIResponse(text);
            addMessage(response, 'bot');
        }, 400);
    }

    // ===== تایپ‌رایتر =====
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        const words = JSON.parse(typingElement.getAttribute('data-words') || '["متخصص شبکه و زیرساخت"]');
        let wordIndex = 0, charIndex = 0, isDeleting = false, speed = 80;
        function typeEffect() {
            const currentWord = words[wordIndex];
            if (isDeleting) {
                typingElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                speed = 40;
            } else {
                typingElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                speed = 80 + Math.random() * 40;
            }
            if (!isDeleting && charIndex === currentWord.length) {
                setTimeout(() => { isDeleting = true; setTimeout(typeEffect, 100); }, 2000);
                return;
            }
            if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(typeEffect, 300);
                return;
            }
            setTimeout(typeEffect, speed);
        }
        setTimeout(typeEffect, 500);
    }

    // ===== نوار پیشرفت =====
    function updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = scrollPercent + '%';
        }
    }
    window.addEventListener('scroll', updateProgressBar);
    updateProgressBar();

    // ===== نمایان شدن بخش‌ها =====
    const sections = document.querySelectorAll('.section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08 });
    sections.forEach(section => sectionObserver.observe(section));

    // ===== انیمیشن مهارت‌ها =====
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
        const skillsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(animateSkills, 150);
                    skillsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        skillsObserver.observe(skillsSection);
    } else {
        animateSkills();
    }

    // ===== دکمه بازگشت به بالا =====
    const backBtn = document.getElementById('back-to-top');
    function toggleBackBtn() {
        if (backBtn) {
            backBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
        }
    }
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        window.addEventListener('scroll', toggleBackBtn);
        toggleBackBtn();
    }

    // ===== ناوبری فعال =====
    const navLinks = document.querySelectorAll('#navbar a');
    function updateActiveNav() {
        let current = '';
        const scrollY = window.scrollY;
        sections.forEach(section => {
            const top = section.offsetTop - 200;
            if (scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();

    // ===== دکمه‌های خدمات =====
    const serviceButtons = document.querySelectorAll('.service-select-btn');
    const serviceForm = document.getElementById('service-request-form');
    const selectedServiceInput = document.getElementById('selected-service');
    serviceButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const serviceName = this.getAttribute('data-service');
            selectedServiceInput.value = serviceName;
            if (serviceForm) {
                serviceForm.style.display = 'block';
                serviceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ===== اشتراک‌گذاری =====
    const shareButtons = document.querySelectorAll('.share-btn');
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);
    shareButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const type = this.getAttribute('data-share');
            let shareUrl = '';
            switch(type) {
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${pageTitle}%20${pageUrl}`;
                    break;
                case 'telegram':
                    shareUrl = `https://t.me/share/url?url=${pageUrl}&text=${pageTitle}`;
                    break;
                case 'email':
                    shareUrl = `mailto:?subject=${pageTitle}&body=مشاهده این صفحه: ${pageUrl}`;
                    break;
                case 'copy':
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href).then(() => {
                            alert('✅ لینک کپی شد!');
                        });
                    } else {
                        const textArea = document.createElement('textarea');
                        textArea.value = window.location.href;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        alert('✅ لینک کپی شد!');
                    }
                    return;
                default:
                    return;
            }
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=500,scrollbars=yes');
            }
        });
    });

    // ===== به‌روزرسانی تاریخ =====
    const now = new Date();
    const updateFa = document.getElementById('update-date-fa');
    if (updateFa) {
        const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
        const year = now.getFullYear() - 621;
        updateFa.textContent = `به‌روزرسانی: ${now.getDate()} ${persianMonths[now.getMonth()]} ${year}`;
    }
    const updateEn = document.getElementById('update-date-en');
    if (updateEn) {
        const englishMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        updateEn.textContent = `Last Updated: ${englishMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }

    // ===== مدت زمان شغلی =====
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
                displayEn.textContent = rem === 0 ? years + ' year' + (years > 1 ? 's' : '') : years + ' year' + (years > 1 ? 's' : '') + ' and ' + rem + ' month' + (rem > 1 ? 's' : '');
            } else {
                displayEn.textContent = months + ' month' + (months > 1 ? 's' : '');
            }
        }
    }
    updateJobDuration();

});