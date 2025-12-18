document.addEventListener('DOMContentLoaded', function() {
    
    // =========================================================
    // ۱. منطق نوار پیشرفت (Skill Progress Bars)
    // =========================================================
    
    // تابعی برای مشاهده تقاطع المان‌ها (Intersection Observer)
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // المان در حال مشاهده است، انیمیشن را فعال کن
                const skillBar = entry.target.querySelector('.skill-bar');
                if (skillBar) {
                    // گرفتن مقدار width از HTML و تنظیم مجدد آن برای تریگر انیمیشن
                    const percent = skillBar.style.width; 
                    skillBar.style.width = percent; 
                }
                // بعد از فعال شدن، مشاهده را متوقف کن
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 }); // تریگر زمانی که ۱۰٪ از المان دیده شد

    // انتخاب تمام آیتم‌های مهارت و شروع مشاهده
    document.querySelectorAll('.skill-level-item').forEach(item => {
        observer.observe(item);
    });

    // =========================================================
    // ۲. منطق ناوبری (Navbar) - تنظیم برای حالت "فقط کلیک"
    // =========================================================
    
    const navLinks = document.querySelectorAll('#navbar a');
    
    // منطق جدید: فقط با کلیک کلاس Active اضافه شود
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            
            // ۱. حذف کلاس active از تمام لینک‌ها
            navLinks.forEach(l => l.classList.remove('active'));
            
            // ۲. اضافه کردن کلاس active به لینک کلیک شده
            this.classList.add('active');
            
        });
    });

    // در این نسخه، ما منطق اسکرول را حذف کرده‌ایم.
    // اگر می‌خواهید هنگام لود شدن صفحه، هیچ لینکی فعال نباشد،
    // باید کلاس 'active' را از index.html و en.html حذف کنید. 
    // (اما فعلاً در HTML برای "معرفی/About" نگه داشته شده است.)

});
