document.addEventListener('DOMContentLoaded', function() {
    
    // ===============================================
    // توابع کمکی (Utility Functions)
    // ===============================================
    
    // تابع Debounce: محدود کردن فراخوانی یک تابع در یک دوره زمانی مشخص
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
    // 1. فعال‌سازی نوارهای مهارت (Skill Bars)
    // ===============================================
    
    const skillItems = document.querySelectorAll('.skill-level-item');

    // تابع اصلی برای اجرای انیمیشن پر شدن
    function animateSkillBars() {
        skillItems.forEach(item => {
            const percentSpan = item.querySelector('.skill-percent');
            
            if (percentSpan) {
                const percentValue = percentSpan.textContent; // مثلاً "85%"
                
                // تنظیم متغیر CSS در سطح آیتم (برای شروع انیمیشن)
                item.style.setProperty('--skill-width', percentValue);
                
                // افزودن کلاس 'show'
                item.classList.add('show');
            }
        });
    }

    const skillsSection = document.getElementById('skills');

    if (skillsSection) {
        // استفاده از IntersectionObserver برای اجرای انیمیشن فقط زمانی که در دید است
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBars();
                    observer.unobserve(entry.target); // تنها یکبار اجرا شود
                }
            });
        }, { 
            root: null, 
            rootMargin: '0px',
            threshold: 0.1 
        });
        
        observer.observe(skillsSection);
    } else {
        // FIX: اگر بخش مهارت‌ها آیدی 'skills' نداشت، بلافاصله اجرا شود
        animateSkillBars();
    }


    // ===============================================
    // 2. اسکرول به بالا (Back to Top Button)
    // ===============================================
    
    const backToTopBtn = document.getElementById('back-to-top');

    function toggleBackToTop() {
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        }
    }
    
    // عملکرد اسکرول نرم
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        // FIX: اجرای اولیه هنگام بارگذاری
        toggleBackToTop(); 
    }


    // ===============================================
    // 3. فعال‌سازی نوار ناوبری (Active Link Management)
    // ===============================================
    
    const sections = document.querySelectorAll('main section');
    const navLinksDesktop = document.querySelectorAll('#navbar a');
    // فرض بر این است که #navbar-mobile هم در HTML وجود دارد
    const navLinksMobile = document.querySelectorAll('#navbar-mobile a'); 
    
    function updateActiveNav() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // تنظیم موقعیت فعال بر اساس 200px کمتر از بالای صفحه (برای بهتر دیده شدن عنوان بخش)
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
        
        // به‌روزرسانی نوار دسکتاپ و موبایل
        updateLinks(navLinksDesktop);
        updateLinks(navLinksMobile);
    }
    
    // ===============================================
    // مدیریت رویدادها (Event Listeners)
    // ===============================================

    // FIX: استفاده از Debounce برای بهینه‌سازی عملکرد هنگام اسکرول
    const debouncedScrollHandler = debounce(function() {
        updateActiveNav();
        toggleBackToTop();
    }, 50); // تأخیر 50 میلی‌ثانیه

    // اجرای به‌روزرسانی هنگام اسکرول
    window.addEventListener('scroll', debouncedScrollHandler);
    
    // اجرای به‌روزرسانی هنگام تغییر اندازه صفحه
    window.addEventListener('resize', debouncedScrollHandler);
    
    // اجرای اولیه برای تنظیم بخش فعال هنگام بارگذاری صفحه
    updateActiveNav(); 
});
