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

    // 3. Image Fallback for File Extensions
    const profileImg = document.querySelector('.profile-photo');
    if (profileImg) {
        profileImg.addEventListener('error', function() {
            if (this.src.endsWith('.jpg')) {
                this.src = 'monika.png';
            } else if (this.src.endsWith('.png')) {
                this.src = 'Monika.jpg';
            }
        });
    }

    // 4. Booking Form Submit Handler
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
