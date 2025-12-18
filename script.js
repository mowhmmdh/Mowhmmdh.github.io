document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================================
    // ۱. افکت انیمیشن Progress Bar هنگام اسکرول (Intersection Observer)
    // ===================================================
    
    const skillBars = document.querySelectorAll('.skill-bar');
    const skillsSection = document.getElementById('skills');

    // تنظیم اولیه: مطمئن می‌شویم نوارها خالی باشند تا انیمیشن از صفر شروع شود
    skillBars.forEach(bar => {
        bar.dataset.width = bar.style.width; // ذخیره عرض نهایی
        bar.style.width = '0'; // ریست عرض
    });

    // Intersection Observer برای بررسی دیده‌شدن بخش مهارت‌ها
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // اگر بخش مهارت‌ها وارد دید کاربر شد، نوارها را انیمیت کن
                skillBars.forEach(bar => {
                    bar.style.width = bar.dataset.width;
                });
                
                // پس از انیمیشن، Observer را متوقف کن تا دوباره اجرا نشود
                observer.unobserve(entry.target);
            }
        });
    }, {
        // تنظیمات: 10% از بخش باید در دید باشد تا فعال شود
        threshold: 0.1 
    });

    if (skillsSection) {
        observer.observe(skillsSection);
    }


    // ===================================================
    // ۲. هایلایت کردن لینک فعال در Navbar هنگام اسکرول
    // ===================================================
    
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#navbar a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // برای جبران نوار ناوبری ثابت (70px)
            const navbarHeight = 70; 

            if (window.scrollY >= sectionTop - navbarHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

});
