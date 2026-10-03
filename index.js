document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate Ambient Dust Particles
    const dustContainer = document.getElementById('dust-container');
    const dustCount = window.innerWidth < 768 ? 15 : 30; 
    for (let i = 0; i < dustCount; i++) {
        const dust = document.createElement('div');
        dust.classList.add('dust');
        const size = Math.random() * 3 + 1;
        dust.style.width = `${size}px`;
        dust.style.height = `${size}px`;
        dust.style.left = `${Math.random() * 100}vw`;
        dust.style.top = `${Math.random() * 100}vh`;
        dust.style.animationDuration = `${Math.random() * 15 + 10}s`;
        dust.style.animationDelay = `${Math.random() * 5}s`;
        dustContainer.appendChild(dust);
    }

    // 2. Scroll Reveal Observer (For standard sections)
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -30px 0px" };
    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); 
            }
        });
    }, revealOptions);
    revealElements.forEach(el => revealOnScroll.observe(el));

    // 3. Parallax Effect
    const parallaxElements = document.querySelectorAll('.parallax');
    window.addEventListener('scroll', () => {
        window.requestAnimationFrame(() => {
            let scrollY = window.scrollY;
            parallaxElements.forEach(el => {
                let speed = el.getAttribute('data-speed');
                el.style.transform = `translateY(${scrollY * speed}px)`;
            });
        });
    });

    // 4. Mobile Menu
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-xmark');
        });
    }

    // 5. Scrollytelling Interactive Solar System Engine
    const steps = document.querySelectorAll('.step');
    const solarSystem = document.getElementById('interactive-solar-system');
    const planetTargets = document.querySelectorAll('.planet-target');

    // Observer to detect which text card is currently on screen
    const stepObserverOptions = {
        root: null,
        rootMargin: "-40% 0px -40% 0px", // Trigger when the text card is right in the middle
        threshold: 0
    };

    const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Manage active step text animations
                steps.forEach(s => s.classList.remove('is-active'));
                entry.target.classList.add('is-active');

                // Get the target planet from the data attribute
                const targetPlanet = entry.target.getAttribute('data-planet');
                
                // Update Solar System zoom/focus classes
                solarSystem.className = 'solar-system'; // Reset
                solarSystem.classList.add(`focus-${targetPlanet}`);
                
                // Handle planet highlighting and dimming
                if (targetPlanet !== 'all') {
                    solarSystem.classList.add('dim-others');
                    planetTargets.forEach(pt => {
                        if (pt.getAttribute('data-target') === targetPlanet) {
                            pt.classList.add('active-target');
                        } else {
                            pt.classList.remove('active-target');
                        }
                    });
                } else {
                    solarSystem.classList.remove('dim-others');
                    planetTargets.forEach(pt => pt.classList.remove('active-target'));
                }
            }
        });
    }, stepObserverOptions);

    steps.forEach(step => stepObserver.observe(step));

    // 6. Form Submission Logic
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = bookingForm.querySelector('.submit-btn');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Aligning Stars...';
            setTimeout(() => {
                alert("The cosmos have received your request! Astrologer Monika's team will contact you shortly.");
                btn.innerHTML = 'Unlock My Destiny';
                bookingForm.reset();
            }, 1200);
        });
    }
});
