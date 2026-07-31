/**
 * ============================================================
 *  script.js — Professional Version
 *  All functionality is organized in self-contained modules.
 *  No global pollution, clean ES6+ syntax.
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    //  1.  DEBOUNCE / THROTTLE HELPERS
    // ============================================================
    const debounce = (fn, delay = 100) => {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    const throttle = (fn, limit = 100) => {
        let inThrottle = false;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    };

    // ============================================================
    //  2.  PRELOADER
    // ============================================================
    const Preloader = {
        el: null,

        init() {
            this.el = document.getElementById('preloader');
            if (!this.el) return;
            // Hide preloader after page is fully loaded
            window.addEventListener('load', () => this.hide());
            // Fallback: hide after 2.5s if load event is slow
            setTimeout(() => this.hide(), 2500);
        },

        hide() {
            if (!this.el) return;
            this.el.classList.add('hide');
            // Remove from DOM after transition
            setTimeout(() => {
                if (this.el && this.el.parentNode) {
                    this.el.parentNode.removeChild(this.el);
                }
            }, 600);
        }
    };

    // ============================================================
    //  3.  PROGRESS BAR
    // ============================================================
    const ProgressBar = {
        el: null,

        init() {
            this.el = document.getElementById('progress-bar');
            if (!this.el) return;
            window.addEventListener('scroll', throttle(() => this.update(), 20), { passive: true });
            this.update();
        },

        update() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            this.el.style.width = percent + '%';
        }
    };

    // ============================================================
    //  4.  DARK MODE
    // ============================================================
    const DarkMode = {
        toggleBtn: null,
        body: null,
        storageKey: 'dark-mode',

        init() {
            this.toggleBtn = document.getElementById('dark-toggle');
            this.body = document.body;
            if (!this.toggleBtn) return;

            // Load saved preference
            const saved = localStorage.getItem(this.storageKey);
            if (saved === 'true') {
                this.enable();
            }

            this.toggleBtn.addEventListener('click', () => this.toggle());
        },

        enable() {
            this.body.classList.add('dark-mode');
            if (this.toggleBtn) {
                this.toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
            localStorage.setItem(this.storageKey, 'true');
        },

        disable() {
            this.body.classList.remove('dark-mode');
            if (this.toggleBtn) {
                this.toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            }
            localStorage.setItem(this.storageKey, 'false');
        },

        toggle() {
            if (this.body.classList.contains('dark-mode')) {
                this.disable();
            } else {
                this.enable();
            }
        }
    };

    // ============================================================
    //  5.  JOB DURATION CALCULATOR
    // ============================================================
    const JobDuration = {
        init() {
            this.updateDuration('start-date-fa', 'duration-display-fa', this.formatFa);
            this.updateDuration('start-date-en', 'duration-display-en', this.formatEn);
        },

        updateDuration(startId, displayId, formatter) {
            const startEl = document.getElementById(startId);
            const displayEl = document.getElementById(displayId);
            if (!startEl || !displayEl) return;

            const startDate = new Date(startEl.getAttribute('data-start'));
            if (isNaN(startDate.getTime())) return;

            const now = new Date();
            let months = (now.getFullYear() - startDate.getFullYear()) * 12 +
                         now.getMonth() - startDate.getMonth();
            if (now.getDate() < startDate.getDate()) months--;

            displayEl.textContent = formatter(months);
        },

        formatFa(months) {
            if (months < 0) return '۰ ماه';
            if (months >= 12) {
                const years = Math.floor(months / 12);
                const rem = months % 12;
                return rem === 0 ? years + ' سال' : years + ' سال و ' + rem + ' ماه';
            }
            return months + ' ماه';
        },

        formatEn(months) {
            if (months < 0) return '0 months';
            if (months >= 12) {
                const years = Math.floor(months / 12);
                const rem = months % 12;
                const yearStr = years + ' year' + (years > 1 ? 's' : '');
                if (rem === 0) return yearStr;
                return yearStr + ' and ' + rem + ' month' + (rem > 1 ? 's' : '');
            }
            return months + ' month' + (months > 1 ? 's' : '');
        }
    };

    // ============================================================
    //  6.  TYPING EFFECT (Advanced)
    // ============================================================
    const TypingEffect = {
        el: null,
        words: [],
        wordIndex: 0,
        charIndex: 0,
        isDeleting: false,
        speed: 80,
        isPaused: false,

        init() {
            this.el = document.querySelector('.typing-text');
            if (!this.el) return;
            try {
                this.words = JSON.parse(this.el.getAttribute('data-words') || '["IT Specialist"]');
            } catch {
                this.words = ['IT Specialist'];
            }
            if (!Array.isArray(this.words) || this.words.length === 0) {
                this.words = ['IT Specialist'];
            }
            setTimeout(() => this.type(), 500);
        },

        type() {
            if (this.isPaused) {
                setTimeout(() => this.type(), 100);
                return;
            }

            const current = this.words[this.wordIndex];
            if (!current) return;

            if (this.isDeleting) {
                this.el.textContent = current.substring(0, this.charIndex - 1);
                this.charIndex--;
                this.speed = 40;
            } else {
                this.el.textContent = current.substring(0, this.charIndex + 1);
                this.charIndex++;
                this.speed = 80 + Math.random() * 40;
            }

            // Finished typing a word
            if (!this.isDeleting && this.charIndex === current.length) {
                this.isPaused = true;
                setTimeout(() => {
                    this.isPaused = false;
                    this.isDeleting = true;
                    setTimeout(() => this.type(), 100);
                }, 2000);
                return;
            }

            // Finished deleting
            if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.wordIndex = (this.wordIndex + 1) % this.words.length;
                this.isPaused = true;
                setTimeout(() => {
                    this.isPaused = false;
                    setTimeout(() => this.type(), 100);
                }, 300);
                return;
            }

            setTimeout(() => this.type(), this.speed);
        }
    };

    // ============================================================
    //  7.  SECTION VISIBILITY (with IntersectionObserver)
    // ============================================================
    const SectionObserver = {
        init() {
            const sections = document.querySelectorAll('.section');
            if (!sections.length) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.08,
                rootMargin: '0px 0px -20px 0px'
            });

            sections.forEach(section => observer.observe(section));
        }
    };

    // ============================================================
    //  8.  SERVICE CARDS ANIMATION
    // ============================================================
    const ServiceCardsObserver = {
        init() {
            const cards = document.querySelectorAll('.service-card');
            if (!cards.length) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -30px 0px'
            });

            cards.forEach(card => observer.observe(card));
        }
    };

    // ============================================================
    //  9.  SKILL BARS ANIMATION
    // ============================================================
    const SkillBars = {
        init() {
            const items = document.querySelectorAll('.skill-level-item');
            if (!items.length) return;

            // If already visible, animate immediately
            if (this.isElementInViewport(document.getElementById('skills'))) {
                this.animate(items);
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animate(items);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            const skillsSection = document.getElementById('skills');
            if (skillsSection) {
                observer.observe(skillsSection);
            } else {
                // Fallback: animate if section not found
                this.animate(items);
            }
        },

        animate(items) {
            items.forEach(item => {
                const bar = item.querySelector('.skill-bar');
                const percentEl = item.querySelector('.skill-percent');
                if (bar && percentEl) {
                    const val = parseInt(percentEl.textContent, 10);
                    if (!isNaN(val)) {
                        // Reset width for smooth animation
                        bar.style.width = '0%';
                        item.style.setProperty('--skill-width', val + '%');
                        // Trigger reflow for animation
                        void bar.offsetWidth;
                        bar.style.width = val + '%';
                        item.classList.add('show');
                    }
                }
            });
        },

        isElementInViewport(el) {
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        }
    };

    // ============================================================
    //  10. JOB ITEMS STAGGERED ANIMATION
    // ============================================================
    const JobItemsObserver = {
        init() {
            const items = document.querySelectorAll('.job-item');
            if (!items.length) return;

            // Set initial state
            items.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            });

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, index * 80);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.05 });

            items.forEach(item => observer.observe(item));
        }
    };

    // ============================================================
    //  11. BACK TO TOP BUTTON
    // ============================================================
    const BackToTop = {
        btn: null,

        init() {
            this.btn = document.getElementById('back-to-top');
            if (!this.btn) return;

            window.addEventListener('scroll', throttle(() => this.toggle(), 50), { passive: true });
            this.btn.addEventListener('click', () => this.scrollToTop());
            this.toggle();
        },

        toggle() {
            const show = window.scrollY > 300;
            this.btn.style.display = show ? 'flex' : 'none';
        },

        scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // ============================================================
    //  12. ACTIVE NAV LINK
    // ============================================================
    const ActiveNav = {
        links: null,
        sections: null,

        init() {
            this.links = document.querySelectorAll('#navbar a');
            this.sections = document.querySelectorAll('.section');
            if (!this.links.length || !this.sections.length) return;

            window.addEventListener('scroll', debounce(() => this.update(), 50), { passive: true });
            this.update();
        },

        update() {
            let current = '';
            const scrollY = window.scrollY;

            this.sections.forEach(section => {
                const top = section.offsetTop - 200;
                if (scrollY >= top) {
                    current = section.getAttribute('id');
                }
            });

            this.links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        }
    };

    // ============================================================
    //  13. SERVICE REQUEST FORM HANDLER
    // ============================================================
    const ServiceFormHandler = {
        buttons: null,
        formContainer: null,
        selectedInput: null,
        cancelBtn: null,
        form: null,

        init() {
            this.buttons = document.querySelectorAll('.service-select-btn');
            this.formContainer = document.getElementById('service-request-form');
            this.selectedInput = document.getElementById('selected-service');
            this.cancelBtn = document.querySelector('#service-request-form .cancel-btn');
            this.form = document.getElementById('service-form');

            if (this.buttons.length) {
                this.buttons.forEach(btn => {
                    btn.addEventListener('click', (e) => this.openForm(e, btn));
                });
            }

            if (this.cancelBtn) {
                this.cancelBtn.addEventListener('click', (e) => this.closeForm(e));
            }

            if (this.form) {
                this.form.addEventListener('submit', (e) => this.prepareSubmit(e));
            }
        },

        openForm(e, btn) {
            e.preventDefault();
            const service = btn.getAttribute('data-service');
            if (this.selectedInput) {
                this.selectedInput.value = service || '';
            }
            if (this.formContainer) {
                this.formContainer.style.display = 'block';
                setTimeout(() => {
                    this.formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        },

        closeForm(e) {
            e.preventDefault();
            if (this.formContainer) {
                this.formContainer.style.display = 'none';
                if (this.form) {
                    this.form.reset();
                }
            }
        },

        prepareSubmit(e) {
            const service = this.selectedInput ? this.selectedInput.value : '';
            if (service) {
                const descField = document.getElementById('client-description');
                if (descField && descField.value.trim()) {
                    const current = descField.value;
                    const lang = document.body.classList.contains('lang-fa') ? 'fa' : 'en';
                    const prefix = lang === 'fa'
                        ? `نوع خدمت درخواستی: ${service}\n\n`
                        : `Requested Service: ${service}\n\n`;
                    descField.value = prefix + current;
                }
            }
        }
    };

    // ============================================================
    //  14. PARTICLES BACKGROUND (Desktop only)
    // ============================================================
    const Particles = {
        canvas: null,
        ctx: null,
        particles: [],
        count: 50,
        isActive: false,

        init() {
            // Only on desktop (width > 992px)
            if (window.innerWidth <= 992) return;

            this.canvas = document.createElement('canvas');
            this.canvas.id = 'particles-canvas';
            document.body.prepend(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.resize();
            window.addEventListener('resize', debounce(() => this.resize(), 200));

            this.particles = [];
            for (let i = 0; i < this.count; i++) {
                this.particles.push(this.createParticle());
            }

            this.isActive = true;
            this.animate();
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },

        createParticle() {
            const w = this.canvas ? this.canvas.width : 1200;
            const h = this.canvas ? this.canvas.height : 800;
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.15
            };
        },

        animate() {
            if (!this.isActive) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);

            // Update and draw particles
            this.particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x > w || p.x < 0) p.speedX *= -1;
                if (p.y > h || p.y < 0) p.speedY *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(37, 99, 235, ${p.opacity})`;
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        const alpha = 0.08 * (1 - dist / 150);
                        ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(() => this.animate());
        },

        destroy() {
            this.isActive = false;
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    };

    // ============================================================
    //  15. INITIALIZE ALL MODULES
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        // Preloader first
        Preloader.init();

        // Core UI
        ProgressBar.init();
        DarkMode.init();
        JobDuration.init();
        TypingEffect.init();

        // Observers
        SectionObserver.init();
        ServiceCardsObserver.init();
        SkillBars.init();
        JobItemsObserver.init();

        // Navigation & Interaction
        BackToTop.init();
        ActiveNav.init();
        ServiceFormHandler.init();

        // Particles (desktop only, after everything else)
        // Small delay to not block rendering
        setTimeout(() => Particles.init(), 300);
    });

})();
