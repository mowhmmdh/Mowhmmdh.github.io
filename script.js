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

        // فارسی
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

        // انگلیسی
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
                const val = parseInt(percent.textContent);
                item.style.setProperty('--skill-width', val + '%');
                bar.style.width = val + '%';
                item.classList.add('show');
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
    // انیمیشن کارت‌های شغلی در موبایل
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
});
