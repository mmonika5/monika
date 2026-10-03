document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate Dynamic Twinkling Stars Background
    const starContainer = document.getElementById('star-container');
    const starCount = window.innerWidth < 768 ? 50 : 150; // Fewer stars on mobile

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        // Randomize position, size, and animation duration
        const size = Math.random() * 2.5 + 0.5;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;
        star.style.animationDuration = `${Math.random() * 3 + 1}s`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        starContainer.appendChild(star);
    }

    // 2. Scroll Reveal Observer (Makes elements fade/slide in as you scroll down)
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealOnScroll.observe(el));

    // 3. Parallax Scroll Effect for Celestial Elements
    const parallaxElements = document.querySelectorAll('.parallax');
    window.addEventListener('scroll', () => {
        let scrollY = window.scrollY;
        parallaxElements.forEach(el => {
            let speed = el.getAttribute('data-speed');
            // Move elements at different speeds based on scroll
            el.style.transform = `translateY(${scrollY * speed}px)`;
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

    // 5. Image Fallback (Ensures Photo loads regardless of extension)
    const profileImg = document.getElementById('astrologerImg');
    if (profileImg) {
        const paths = ['monika.jpg', 'monika.png', 'Monika.jpg', 'Monika.png'];
        let attempt = 0;
        profileImg.addEventListener('error', function() {
            attempt++;
            if (attempt < paths.length) {
                this.src = paths[attempt];
            } else {
                // If totally broken, create an astrological SVG placeholder
                this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="%230a0f1d"/><circle cx="200" cy="250" r="100" stroke="%23d4af37" stroke-width="2" fill="none"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Cinzel, serif" font-size="20" fill="%23d4af37">Astrologer Monika</text></svg>';
                this.style.webkitMaskImage = 'none'; // Remove mask on placeholder
                this.style.mixBlendMode = 'normal';
            }
        });
    }

    // 6. Booking Form Submission
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
            }, 1500);
        });
    }
});
