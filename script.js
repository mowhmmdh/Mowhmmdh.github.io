document.addEventListener('DOMContentLoaded', function() {
    
    // =========================================================
    // ۱. منطق نوار پیشرفت (Skill Progress Bars) - پویا
    // =========================================================
    
    const skillItems = document.querySelectorAll('.skill-level-item');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBar = entry.target.querySelector('.skill-bar');
                if (skillBar) {
                    // گرفتن درصد از ویژگی استایل HTML
                    const percent = skillBar.style.width; 
                    
                    // تنظیم مجدد width برای تریگر انیمیشن CSS
                    // این اطمینان می‌دهد که انیمیشن (transition) اجرا می‌شود.
                    skillBar.style.width = percent; 

                    // اضافه کردن کلاس show برای نمایش کامل آیتم (اگر نیاز بود)
                    entry.target.classList.add('show');
                }
                // بعد از فعال شدن، مشاهده را متوقف کن تا انیمیشن فقط یکبار اجرا شود
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 }); // تریگر زمانی که ۵۰٪ از المان دیده شد

    // شروع مشاهده برای تمام آیتم‌های مهارت
    skillItems.forEach(item => {
        observer.observe(item);
    });

    // =========================================================
    // ۲. منطق ناوبری (Navbar) - فقط کلیک
    // =========================================================
    
    const navLinks = document.querySelectorAll('#navbar a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            
            // حذف کلاس active از تمام لینک‌ها
            navLinks.forEach(l => l.classList.remove('active'));
            
            // اضافه کردن کلاس active به لینک کلیک شده
            this.classList.add('active');
            
            // مدیریت اسکرول دستی برای حالت موبایل (در دسکتاپ به دلیل sticky بودن sidebar نیاز نیست)
            // اگر از href="#sectionID" استفاده شود، مرورگر خودش اسکرول می‌کند.
        });
    });

    // =========================================================
    // ۳. دکمه بازگشت به بالا (Back to Top)
    // =========================================================
    const backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        // نمایش دکمه زمانی که کاربر به اندازه یک صفحه کامل اسکرول کرده است
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
