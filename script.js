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
                    // اطمینان از خواندن مقدار width از صفت style در HTML
                    const percent = entry.target.querySelector('.skill-percent').textContent;
                    skillBar.style.width = percent; 
                    entry.target.classList.add('show');
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 }); 

    skillItems.forEach(item => {
        observer.observe(item);
    });

    // =========================================================
    // ۲. منطق ناوبری (Navbar) - فقط کلیک
    // =========================================================
    
    const navLinks = document.querySelectorAll('#navbar a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
        });
    });

    // =========================================================
    // ۳. دکمه بازگشت به بالا (Back to Top)
    // =========================================================
    const backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        // دکمه زمانی ظاهر می‌شود که اسکرول از یک ارتفاع مشخص بگذرد (مثلاً ارتفاع کل پنجره)
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
