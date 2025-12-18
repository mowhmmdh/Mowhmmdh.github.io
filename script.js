document.addEventListener('DOMContentLoaded', function() {
    
    // =========================================================
    // ۱. منطق نوار پیشرفت (Skill Progress Bars) - پویا
    // =========================================================
    
    const skillItems = document.querySelectorAll('.skill-level-item');

    const skillObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBar = entry.target.querySelector('.skill-bar');
                if (skillBar) {
                    const percent = entry.target.querySelector('.skill-percent').textContent;
                    skillBar.style.width = percent; 
                    entry.target.classList.add('show');
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 }); 

    skillItems.forEach(item => {
        skillObserver.observe(item);
    });
    
    // =========================================================
    // ۲. انیمیشن ورود بخش‌ها (Section Fade-In) - جدید
    // =========================================================
    const sections = document.querySelectorAll('.section');

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1, // وقتی 10% از بخش قابل مشاهده شد، انیمیشن اجرا شود
        rootMargin: '0px 0px -100px 0px' // شروع کمی زودتر از پایین صفحه
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });


    // =========================================================
    // ۳. منطق ناوبری (Navbar) - فعال‌سازی لینک‌ها
    // (حالت فعال با کلیک و همچنین فعال‌سازی بر اساس اسکرول برای حالت پویا)
    // =========================================================
    
    const navLinks = document.querySelectorAll('#navbar a');
    
    // تابع برای فعال کردن لینک navbar بر اساس بخش قابل مشاهده
    function setActiveNavLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // 200px برای Offset از بالای صفحه
            if (window.scrollY >= sectionTop - 200) { 
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    }

    // فعال کردن لینک هنگام اسکرول
    window.addEventListener('scroll', setActiveNavLink);
    
    // فعال کردن لینک هنگام بارگذاری اولیه
    setActiveNavLink();
    
    // فعال کردن لینک هنگام کلیک
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // اجازه دهید اسکرول نرم اتفاق بیفتد، سپس کلاس active را تنظیم کنید
            setTimeout(() => {
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }, 600); // زمان تأخیر متناسب با scroll-behavior: smooth
        });
    });

    // =========================================================
    // ۴. دکمه بازگشت به بالا (Back to Top)
    // =========================================================
    const backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

});
