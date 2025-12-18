document.addEventListener('DOMContentLoaded', function() {

    // =========================================================
    // ۱. منطق نوار پیشرفت (Skill Progress Bars)
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
    // ۲. انیمیشن ورود بخش‌ها (Section Fade-In)
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
        threshold: 0.1, 
        rootMargin: '0px 0px -100px 0px' 
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });


    // =========================================================
    // ۳. منطق ناوبری (Navbar) - مدیریت هر دو منو
    // =========================================================
    
    // انتخاب لینک‌ها از هر دو Navbar
    const navLinks = document.querySelectorAll('#navbar a, #navbar-mobile a');
    
    function setActiveNavLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            
            // 200px برای Offset از بالای صفحه
            if (window.scrollY >= sectionTop - 200) { 
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            // فعال کردن لینک‌هایی که شامل ID بخش فعلی هستند
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', setActiveNavLink);
    setActiveNavLink();
    
    // فعال کردن لینک هنگام کلیک و اجرای اسکرول نرم
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Wait for smooth scroll to finish, then set active class
            setTimeout(() => {
                // حذف کلاس active از همه لینک‌ها قبل از اضافه کردن به لینک فعلی
                document.querySelectorAll('#navbar a, #navbar-mobile a').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }, 600); 
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
