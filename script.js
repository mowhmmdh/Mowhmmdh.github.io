document.addEventListener('DOMContentLoaded', function() {
    
    // ===============================================
    // 1. فعال‌سازی نوارهای مهارت (Skill Bars)
    // ===============================================
    
    const skillItems = document.querySelectorAll('.skill-level-item');

    // تابع اصلی برای اجرای انیمیشن پر شدن
    function animateSkillBars() {
        skillItems.forEach(item => {
            const percentSpan = item.querySelector('.skill-percent');
            
            if (percentSpan) {
                const percentValue = percentSpan.textContent; // مثلاً "85%"
                
                // تنظیم متغیر CSS در سطح آیتم
                item.style.setProperty('--skill-width', percentValue);
                
                // افزودن کلاس 'show' برای اجرای انیمیشن CSS
                item.classList.add('show');
            }
        });
    }

    // مشاهده‌گر برای اجرای انیمیشن زمانی که بخش مهارت‌ها در دید کاربر قرار می‌گیرد
    const options = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkillBars();
                // تنها یکبار اجرا شود
                observer.unobserve(entry.target);
            }
        });
    }, options);

    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
        observer.observe(skillsSection);
    }


    // ===============================================
    // 2. اسکرول به بالا (Back to Top Button)
    // ===============================================
    
    const backToTopBtn = document.getElementById('back-to-top');

    // نمایش/پنهان کردن دکمه هنگام اسکرول
    window.addEventListener('scroll', () => {
        if (backToTopBtn) {
            // نمایش در صورت اسکرول شدن بیشتر از 300px
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        }
    });

    // عملکرد اسکرول نرم
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
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
            // تنظیم موقعیت فعال بر اساس 200px کمتر از بالای صفحه 
            if (window.scrollY >= sectionTop - 200) { 
                current = section.getAttribute('id');
            }
        });

        const updateLinks = (links) => {
            links.forEach(link => {
                link.classList.remove('active');
                // لینک فعال را پیدا کرده و کلاس active را اضافه می‌کند
                if (link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        };
        
        // به‌روزرسانی نوار دسکتاپ
        updateLinks(navLinksDesktop);
        // به‌روزرسانی نوار موبایل
        updateLinks(navLinksMobile);
    }
    
    // اجرای به‌روزرسانی هنگام بارگذاری و اسکرول
    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav(); 
    
});
