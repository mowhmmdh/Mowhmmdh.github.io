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
    // 1. فعال‌سازی نوارهای مهارت (Skill Bars) - بهبودیافته
    // ===============================================
    
    const skillItems = document.querySelectorAll('.skill-level-item');

    function animateSkillBars() {
        skillItems.forEach(item => {
            const bar = item.querySelector('.skill-bar');
            const percentSpan = item.querySelector('.skill-percent');
            
            if (bar && percentSpan) {
                const percentValue = percentSpan.textContent; // "85%"
                const numericValue = parseInt(percentValue); // 85
                
                // تنظیم متغیر CSS
                item.style.setProperty('--skill-width', percentValue);
                
                // تنظیم عرض نوار با داده‌های موجود
                bar.style.width = numericValue + '%';
                
                // افزودن کلاس 'show'
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
