document.addEventListener('DOMContentLoaded', function() {

    // ===============================================
    // ابزار Debounce برای بهینه‌سازی
    // ===============================================
    function debounce(func, delay) {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, arguments), delay);
        };
    }

    // ===============================================
    // افکت پس‌زمینه با ذرات (Particles)
    // ===============================================
    function initParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        document.body.prepend(canvas);
        
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 50;

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
                this.opacity = Math.random() * 0.5 + 0.2;
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
                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(37, 99, 235, ${0.1 * (1 - distance / 150)})`;
                        ctx.lineWidth = 0.5;
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

    if (window.innerWidth > 992) {
        initParticles();
    }

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
    // محاسبه مدت زمان شغل
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
            const percent = item.querySelector('.skill-percent');
            if (bar && percent) {
                // استخراج عدد از درصد (مثلاً "70%" → 70)
                const val = parseInt(percent.textContent);
                // تنظیم متغیر CSS برای انیمیشن
                item.style.setProperty('--skill-width', val + '%');
                // افزودن کلاس show برای اجرای انیمیشن
                item.classList.add('show');
                // اطمینان از اعمال عرض به نوار
                bar.style.width = val + '%';
            }
        });
    }

    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkills();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        observer.observe(skillsSection);
    } else {
        animateSkills();
    }

    // ===============================================
    // افکت محو شدن بخش‌ها
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
    // منو فعال
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
    // نمایش تاریخ به‌روزرسانی خودکار
    // ===============================================
    function updateDate() {
        const now = new Date();
        
        const updateFa = document.getElementById('update-date-fa');
        if (updateFa) {
            const persianDate = new Intl.DateTimeFormat('fa-IR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }).format(now);
            updateFa.textContent = `آخرین به‌روزرسانی: ${persianDate}`;
        }
        
        const updateEn = document.getElementById('update-date-en');
        if (updateEn) {
            const englishDate = new Intl.DateTimeFormat('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }).format(now);
            updateEn.textContent = `Last Updated: ${englishDate}`;
        }
    }
    updateDate();

    // ===============================================
    // دارک مود
    // ===============================================
    const darkToggle = document.getElementById('dark-toggle');
    const body = document.body;
    if (localStorage.getItem('dark-mode') === 'true') {
        body.classList.add('dark-mode');
        darkToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    darkToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDark);
        this.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

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
    // دکمه‌های اشتراک‌گذاری
    // ===============================================
    const shareButtons = document.querySelectorAll('.share-btn');
    const currentURL = window.location.href;
    const currentTitle = document.title;

    shareButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const shareType = this.getAttribute('data-share');
            let shareURL = '';
            
            switch(shareType) {
                case 'linkedin':
                    shareURL = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentURL)}`;
                    break;
                case 'twitter':
                    shareURL = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentURL)}&text=${encodeURIComponent(currentTitle)}`;
                    break;
                case 'whatsapp':
                    shareURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(currentTitle + ' - ' + currentURL)}`;
                    break;
                case 'email':
                    shareURL = `mailto:?subject=${encodeURIComponent(currentTitle)}&body=${encodeURIComponent('من این رزومه حرفه‌ای را دیدم. لینک: ' + currentURL)}`;
                    break;
                case 'copy':
                    navigator.clipboard.writeText(currentURL).then(() => {
                        const originalText = this.innerHTML;
                        this.innerHTML = '<i class="fas fa-check"></i>';
                        this.style.background = '#28a745';
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.style.background = '#6c757d';
                        }, 2000);
                    }).catch(() => {
                        alert('لینک کپی نشد. لطفاً دستی کپی کنید.');
                    });
                    return;
            }
            
            if (shareURL) {
                window.open(shareURL, '_blank', 'width=600,height=500');
            }
        });
    });
});
