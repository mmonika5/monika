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

    // 2. Scroll Reveal Observer
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

    // 4. Mobile Menu Toggle
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

    // 5. Image Fallback Handling 
    const profileImg = document.getElementById('astrologerImg');
    if (profileImg) {
        const paths = ['monika.jpg', 'monika.png', 'Monika.jpg', 'Monika.png'];
        let attempt = 0;
        profileImg.addEventListener('error', function() {
            attempt++;
            if (attempt < paths.length) {
                this.src = paths[attempt];
            } else {
                // Generates an elegant placeholder if image is completely missing
                this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="%23fdfbf7"/><circle cx="200" cy="250" r="100" stroke="%23c5a059" stroke-width="2" fill="none"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Cinzel, serif" font-size="20" fill="%231a1e29">Portrait Missing</text></svg>';
            }
        });
    }

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
