document.addEventListener('DOMContentLoaded', function() {

    // ===== PRELOADER =====
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => preloader.classList.add('hide'), 600);
    }

    // ===== PROGRESS BAR =====
    const progressBar = document.getElementById('progress-bar');
    window.addEventListener('scroll', () => {
        const scroll = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const percent = height > 0 ? (scroll / height) * 100 : 0;
        progressBar.style.width = percent + '%';
    }, { passive: true });

    // ===== DARK MODE =====
    const toggle = document.getElementById('dark-toggle');
    const body = document.body;
    if (localStorage.getItem('dark-mode') === 'true') {
        body.classList.add('dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    toggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDark);
        toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // ===== JOB DURATION =====
    function updateDuration() {
        const now = new Date();
        const startFa = document.getElementById('start-date-fa');
        const displayFa = document.getElementById('duration-display-fa');
        if (startFa && displayFa) {
            const start = new Date(startFa.dataset.start);
            let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
            if (now.getDate() < start.getDate()) months--;
            if (months >= 12) {
                const y = Math.floor(months / 12);
                const m = months % 12;
                displayFa.textContent = m === 0 ? y + ' سال' : y + ' سال و ' + m + ' ماه';
            } else {
                displayFa.textContent = months + ' ماه';
            }
        }
    }
    updateDuration();

    // ===== TYPING EFFECT =====
    const typingEl = document.querySelector('.typing-text');
    if (typingEl) {
        const words = JSON.parse(typingEl.dataset.words || '["IT Specialist"]');
        let idx = 0, charIdx = 0, deleting = false;
        let speed = 80;

        function type() {
            const current = words[idx];
            if (deleting) {
                typingEl.textContent = current.substring(0, charIdx - 1);
                charIdx--;
                speed = 40;
            } else {
                typingEl.textContent = current.substring(0, charIdx + 1);
                charIdx++;
                speed = 80 + Math.random() * 40;
            }

            if (!deleting && charIdx === current.length) {
                deleting = true;
                setTimeout(type, 2000);
                return;
            }
            if (deleting && charIdx === 0) {
                deleting = false;
                idx = (idx + 1) % words.length;
                setTimeout(type, 300);
                return;
            }
            setTimeout(type, speed);
        }
        setTimeout(type, 500);
    }

    // ===== SECTION VISIBILITY =====
    const sections = document.querySelectorAll('.section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08 });
    sections.forEach(s => sectionObserver.observe(s));

    // ===== SERVICE CARDS ANIMATION =====
    const cards = document.querySelectorAll('.service-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    cards.forEach(c => cardObserver.observe(c));

    // ===== SERVICE REQUEST FORM =====
    const serviceBtns = document.querySelectorAll('.service-select-btn');
    const formContainer = document.getElementById('service-request-form');
    const selectedService = document.getElementById('selected-service');

    serviceBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            selectedService.value = this.dataset.service;
            if (formContainer) {
                formContainer.style.display = 'block';
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            formContainer.style.display = 'none';
            document.getElementById('service-form').reset();
        });
    }

    // ===== NAV ACTIVE LINK =====
    const navLinks = document.querySelectorAll('#navbar a');
    function updateNav() {
        let current = '';
        sections.forEach(s => {
            const top = s.offsetTop - 200;
            if (window.scrollY >= top) current = s.id;
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    // ===== BACK TO TOP =====
    const backBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        backBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    }, { passive: true });
    backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== SKILL BARS (trigger on visible) =====
    const skillItems = document.querySelectorAll('.skill-item');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fill = entry.target.querySelector('.skill-fill');
                if (fill) {
                    const width = fill.style.width;
                    fill.style.width = '0%';
                    setTimeout(() => { fill.style.width = width; }, 100);
                }
                skillObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    skillItems.forEach(item => skillObserver.observe(item));
});
