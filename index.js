document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });
    }

    // 2. Active Link Highlight on Scroll
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // 3. Multi-Attempt Image Loader & Fallback Path Handler
    const profileImg = document.getElementById('astrologerImg');
    if (profileImg) {
        const potentialSources = [
            'monika.jpg',
            'monika.png',
            'Monika.jpg',
            'Monika.png',
            'assets/monika.jpg',
            'assets/monika.png'
        ];
        
        let attemptIndex = 0;

        profileImg.addEventListener('error', function handleImageError() {
            attemptIndex++;
            if (attemptIndex < potentialSources.length) {
                console.warn(`Image load failed. Trying alternative path: ${potentialSources[attemptIndex]}`);
                this.src = potentialSources[attemptIndex];
            } else {
                console.error('All image paths failed. Generating high-quality SVG fallback placeholder...');
                // Clean SVG fallback so the layout never breaks
                this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="%23f7eed8"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Cinzel, serif" font-size="28" fill="%23c59b27">Astrologer Monika</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2364748b">Vedic Guidance</text></svg>';
            }
        });
    }

    // 4. Subtle Mouse Movement Effect on Holy Leaves
    const photoWrapper = document.querySelector('.about-photo-wrapper');
    const leaves = document.querySelectorAll('.holy-leaf');

    if (photoWrapper && leaves.length > 0) {
        photoWrapper.addEventListener('mousemove', (e) => {
            const rect = photoWrapper.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            leaves.forEach((leaf, idx) => {
                const depth = (idx + 1) * 12;
                leaf.style.transform = `translate(${x * depth}px, ${y * depth}px) rotate(${x * 20}deg)`;
            });
        });

        photoWrapper.addEventListener('mouseleave', () => {
            leaves.forEach((leaf) => {
                leaf.style.transform = '';
            });
        });
    }

    // 5. Booking Form Handler
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const service = document.getElementById('serviceSelect').value;

            if (!fullName || !service) {
                alert('Please fill out all required fields.');
                return;
            }

            alert(`Thank you, ${fullName}! Your consultation request for "${service}" has been successfully submitted.`);
            bookingForm.reset();
        });
    }
});
