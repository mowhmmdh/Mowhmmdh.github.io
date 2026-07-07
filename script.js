document.addEventListener('DOMContentLoaded', function() {
    
    // ===============================================
    // توابع کمکی (Utility Functions)
    // ===============================================
     
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // ===============================================
    // 0. محاسبه خودکار مدت زمان شغل فعلی (Dynamic Duration)
    // ===============================================
    
    function updateJobDuration() {
        const now = new Date();
        
        // ---- نسخه فارسی (تاریخ شمسی) ----
        const startDateFa = document.getElementById('start-date-fa');
        const durationDisplayFa = document.getElementById('duration-display-fa');
        
        if (startDateFa && durationDisplayFa) {
            const startDateStr = startDateFa.getAttribute('data-start');
            const start = new Date(startDateStr);
            
            let months = (now.getFullYear() - start.getFullYear()) * 12;
            months += now.getMonth() - start.getMonth();
            
            if (now.getDate() < start.getDate()) {
                months--;
            }
            
            if (months >= 12) {
                const years = Math.floor(months / 12);
                const remainingMonths = months % 12;
                if (remainingMonths === 0) {
                    durationDisplayFa.textContent = years + ' سال';
                } else {
                    durationDisplayFa.textContent = years + ' سال و ' + remainingMonths + ' ماه';
                }
            } else {
                durationDisplayFa.textContent = months + ' ماه';
            }
        }
        
        // ---- نسخه انگلیسی (تاریخ میلادی) ----
        const startDateEn = document.getElementById('start-date-en');
        const durationDisplayEn = document.getElementById('duration-display-en');
        
        if (startDateEn && durationDisplayEn) {
            const startDateStr = startDateEn.getAttribute('data-start');
            const start = new Date(startDateStr);
            
            let months = (now.getFullYear() - start.getFullYear()) * 12;
            months += now.getMonth() - start.getMonth();
            
            if (now.getDate() < start.getDate()) {
                months--;
            }
            
            if (months >= 12) {
                const years = Math.floor(months / 12);
                const remainingMonths = months % 12;
                if (remainingMonths === 0) {
                    durationDisplayEn.textContent = years + ' year' + (years > 1 ? 's' : '');
                } else {
                    durationDisplayEn.textContent = years + ' year' + (years > 1 ? 's' : '') + ' and ' + remainingMonths + ' month' + (remainingMonths > 1 ? 's' : '');
                }
            } else {
                durationDisplayEn.textContent = months + ' month' + (months > 1 ? 's' : '');
            }
        }
    }
    
    // اجرای تابع در ابتدا
    updateJobDuration();
    
    // ===============================================
    // 1. فعال‌سازی نوارهای مهارت (Skill Bars)
    // ===============================================
    
    const skillItems = document.querySelectorAll('.skill-level-item');

    function animateSkillBars() {
        skillItems.forEach(item => {
            const bar = item.querySelector('.skill-bar');
            const percentSpan = item.querySelector('.skill-percent');
            
            if (bar && percentSpan) {
                const percentValue = percentSpan.textContent;
                const numericValue = parseInt(percentValue);
                
                item.style.setProperty('--skill-width', percentValue);
                bar.style.width = numericValue + '%';
                item.classList.add('show');
            }
        });
    }

    const skillsSection = document.getElementById('skills');

    if (skillsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBars();
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            root: null, 
            rootMargin: '0px',
            threshold: 0.1 
        });
        
        observer.observe(skillsSection);
    } else {
        animateSkillBars();
    }

    // ===============================================
    // 2. اسکرول به بالا (Back to Top Button)
    // ===============================================
    
    const backToTopBtn = document.getElementById('back-to-top');

    function toggleBackToTop() {
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'flex';
            } else {
                backToTopBtn.style.display = 'none';
            }
        }
    }
    
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        toggleBackToTop(); 
    }

    // ===============================================
    // 3. فعال‌سازی نوار ناوبری (Active Link Management)
    // ===============================================
    
    const sections = document.querySelectorAll('main section');
    const navLinksDesktop = document.querySelectorAll('#navbar a');
    const navLinksMobile = document.querySelectorAll('#navbar-mobile a'); 
    
    function updateActiveNav() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 200) { 
                current = section.getAttribute('id');
            }
        });

        const updateLinks = (links) => {
            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        };
        
        updateLinks(navLinksDesktop);
        updateLinks(navLinksMobile);
    }
    
    // ===============================================
    // مدیریت رویدادها (Event Listeners)
    // ===============================================

    const debouncedScrollHandler = debounce(function() {
        updateActiveNav();
        toggleBackToTop();
    }, 50);

    window.addEventListener('scroll', debouncedScrollHandler);
    window.addEventListener('resize', debouncedScrollHandler);
    updateActiveNav(); 
});
