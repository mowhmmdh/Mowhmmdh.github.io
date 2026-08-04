document.addEventListener('DOMContentLoaded', function() {

    // ===============================================
    // ابزار Debounce برای بهینه‌سازی عملکرد
    // ===============================================
    function debounce(func, delay) {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, arguments), delay);
        };
    }

    // ===============================================
    // تبدیل تاریخ میلادی به شمسی (الگوریتم دقیق)
    // ===============================================
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

    // ===============================================
    // تبدیل تاریخ میلادی به رشته شمسی با نام ماه
    // ===============================================
    function toPersianDate(date) {
        const [year, month, day] = gregorianToJalali(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
        const persianMonths = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد',
            'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        return `${year} ${persianMonths[month - 1]} ${day}`;
    }

    // ===============================================
    // تبدیل تاریخ میلادی به رشته میلادی با نام ماه
    // ===============================================
    function toEnglishDate(date) {
        const englishMonths = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${englishMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    // ===============================================
    // افکت پس‌زمینه با ذرات (فعال در همه دستگاه‌ها با تعداد متغیر)
    // ===============================================
    function initParticles() {
        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 25 : 50;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        document.body.prepend(canvas);
        
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = isMobile ? (Math.random() * 0.3 + 0.1) : (Math.random() * 0.5 + 0.2);
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

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = isMobile ? 100 : 150;
                    if (distance < maxDist) {
                        ctx.beginPath();
                        const opacity = isMobile ? 0.05 * (1 - distance / maxDist) : 0.1 * (1 - distance / maxDist);
                        ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
                        ctx.lineWidth = isMobile ? 0.3 : 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // اجرای ذرات در همه دستگاه‌ها
    initParticles();

    // ===============================================
    // نوار پیشرفت مطالعه
    // ===============================================
    function updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = scrollPercent + '%';
        }
    }
    window.addEventListener('scroll', debounce(updateProgressBar, 10), { passive: true });
    updateProgressBar();

    // ===============================================
    // محاسبه مدت زمان اشتغال در شغل فعلی
    // ===============================================
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

    // ===============================================
    // انیمیشن نوارهای مهارت
    // ===============================================
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
        }, { 
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });
        skillsObserver.observe(skillsSection);
        
        setTimeout(() => {
            const anyShown = document.querySelector('.skill-level-item.show');
            if (!anyShown) {
                animateSkills();
            }
        }, 3000);
    } else {
        animateSkills();
    }

    // ===============================================
    // افکت محو شدن بخش‌ها هنگام اسکرول
    // ===============================================
    const sections = document.querySelectorAll('.section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08 });
    sections.forEach(section => sectionObserver.observe(section));

    // ===============================================
    // انیمیشن کارت‌های خدمات
    // ===============================================
    const serviceCards = document.querySelectorAll('.service-card');
    const serviceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                serviceObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    serviceCards.forEach(card => serviceObserver.observe(card));

    // ===============================================
    // دکمه بازگشت به بالا
    // ===============================================
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
        window.addEventListener('scroll', debounce(toggleBackBtn, 50), { passive: true });
        toggleBackBtn();
    }

    // ===============================================
    // برجسته‌سازی آیتم منوی فعال
    // ===============================================
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
    window.addEventListener('scroll', debounce(updateActiveNav, 50), { passive: true });
    updateActiveNav();

    // ===============================================
    // انیمیشن کارت‌های شغلی
    // ===============================================
    const jobItems = document.querySelectorAll('.job-item');
    const jobObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 80);
                jobObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });
    jobItems.forEach((item) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        jobObserver.observe(item);
    });

    // ===============================================
    // تایپ‌رایتر پیشرفته
    // ===============================================
    function initAdvancedTyping() {
        const typingElement = document.querySelector('.typing-text');
        if (!typingElement) return;
        
        const words = JSON.parse(typingElement.getAttribute('data-words') || '["IT Specialist"]');
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let speed = 80;
        let isTypingPaused = false;
        
        function typeEffect() {
            if (isTypingPaused) {
                setTimeout(typeEffect, 100);
                return;
            }
            
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
                isTypingPaused = true;
                setTimeout(() => {
                    isTypingPaused = false;
                    isDeleting = true;
                    setTimeout(typeEffect, 100);
                }, 2000);
                return;
            }
            
            if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                isTypingPaused = true;
                setTimeout(() => {
                    isTypingPaused = false;
                    setTimeout(typeEffect, 100);
                }, 300);
                return;
            }
            
            setTimeout(typeEffect, speed);
        }
        
        setTimeout(typeEffect, 500);
    }
    initAdvancedTyping();

    // ===============================================
    // دارک مود (ذخیره‌سازی در localStorage)
    // ===============================================
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
        this.innerHTML = isDark ? '<i class="fas fa-sun" aria-hidden="true"></i>' : '<i class="fas fa-moon" aria-hidden="true"></i>';
    });

    // ===============================================
    // کلید تغییر زبان (دکمه) - حرفه‌ای
    // ===============================================
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const currentPath = window.location.pathname;
            if (currentPath.includes('en.html')) {
                window.location.href = '/index.html';
            } else {
                window.location.href = '/en.html';
            }
        });
    }

    // ===============================================
    // بخش خدمات - نمایش فرم و انتخاب نوع خدمت
    // ===============================================
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

    // ===============================================
    // بستن فرم با دکمه لغو
    // ===============================================
    const cancelBtn = document.querySelector('#service-request-form .cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const form = document.getElementById('service-request-form');
            if (form) {
                form.style.display = 'none';
                const formElement = document.getElementById('service-form');
                if (formElement) {
                    formElement.reset();
                }
            }
        });
    }

    // ===============================================
    // ارسال فرم خدمات - اضافه کردن نوع خدمت به توضیحات
    // ===============================================
    const serviceRequestForm = document.getElementById('service-form');
    if (serviceRequestForm) {
        serviceRequestForm.addEventListener('submit', function(e) {
            const service = selectedServiceInput.value;
            if (service) {
                const descField = document.getElementById('client-description');
                if (descField) {
                    const currentValue = descField.value;
                    descField.value = `نوع خدمت درخواستی: ${service}\n\n${currentValue}`;
                }
            }
        });
    }

    // ===============================================
    // افکت ریپل روی دکمه‌ها (Ripple Effect)
    // ===============================================
    document.querySelectorAll('.cta-button, .service-select-btn, .contact-form button[type="submit"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.type === 'reset') return;
            
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ================================================================
    // دکمه‌های اشتراک‌گذاری (Share Buttons)
    // ================================================================
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
                            const tooltip = this.querySelector('.tooltip');
                            if (tooltip) {
                                const originalText = tooltip.textContent;
                                tooltip.textContent = '✅ کپی شد!';
                                setTimeout(() => {
                                    tooltip.textContent = originalText;
                                }, 2000);
                            } else {
                                alert('✅ لینک کپی شد!');
                            }
                        }).catch(() => {
                            alert('لینک: ' + window.location.href);
                        });
                    } else {
                        const textArea = document.createElement('textarea');
                        textArea.value = window.location.href;
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                            document.execCommand('copy');
                            alert('✅ لینک کپی شد!');
                        } catch (err) {
                            alert('لینک: ' + window.location.href);
                        }
                        document.body.removeChild(textArea);
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

    // ================================================================
    // به‌روزرسانی خودکار تاریخ در فوتر (شمسی در فارسی، میلادی در انگلیسی)
    // ================================================================
    const updateDateFa = document.getElementById('update-date-fa');
    const updateDateEn = document.getElementById('update-date-en');
    const now = new Date();
    
    if (updateDateFa) {
        const persianDate = toPersianDate(now);
        updateDateFa.textContent = `به‌روزرسانی: ${persianDate}`;
    }
    
    if (updateDateEn) {
        const englishDate = toEnglishDate(now);
        updateDateEn.textContent = `Last Updated: ${englishDate}`;
    }

});
