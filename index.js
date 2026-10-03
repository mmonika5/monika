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

/* ===== UPGRADE ===== */
document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const fine = matchMedia('(pointer:fine)').matches;

    // Floating emojis in hero
    const fe = $('.float-emojis');
    if (fe) fe.dataset.emojis.split(' ').forEach((e, i) => {
        const s = document.createElement('span');
        s.className = 'fe'; s.textContent = e;
        s.style.left = (4 + i * 8) + '%';
        s.style.fontSize = (1.2 + Math.random() * 1.4) + 'rem';
        s.style.animationDuration = (14 + Math.random() * 12) + 's';
        s.style.animationDelay = (-Math.random() * 20) + 's';
        fe.appendChild(s);
    });

    // Scroll progress, back-to-top, active nav
    const bar = $('#progress'), top = $('#to-top');
    const links = $$('.nav-link'), secs = links.map(l => $(l.getAttribute('href')));
    addEventListener('scroll', () => {
        const h = document.documentElement;
        bar.style.width = (h.scrollTop / (h.scrollHeight - innerHeight) * 100) + '%';
        top.classList.toggle('show', scrollY > 600);
        let cur = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
        links.forEach((l, i) => l.classList.toggle('active', i === cur));
    }, { passive: true });

    // Cursor glow + sparkle trail
    if (fine) {
        const g = $('#glow'); let last = 0;
        addEventListener('mousemove', e => {
            g.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
            if (Date.now() - last > 70) {
                last = Date.now();
                const s = document.createElement('span'); s.className = 'spark';
                s.textContent = ['✨', '⭐', '✦', '🌙', '💫'][Math.random() * 5 | 0];
                s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
                s.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
                s.style.setProperty('--dy', (Math.random() * 60 + 10) + 'px');
                document.body.appendChild(s); setTimeout(() => s.remove(), 1600);
            }
        });
        // 3D tilt on photo + spotlight on service cards
        $$('.tilt').forEach(t => {
            t.addEventListener('mousemove', e => {
                const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
                t.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`;
            });
            t.addEventListener('mouseleave', () => t.style.transform = '');
        });
        $$('.service-card').forEach(c => c.addEventListener('mousemove', e => {
            const r = c.getBoundingClientRect();
            c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            c.style.transform = `translateY(-6px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
        }));
        $$('.service-card').forEach(c => c.addEventListener('mouseleave', () => c.style.transform = ''));
    }

    // Tarot
    const deck = [
        ['0', 'The Fool', '🃏', 'A fresh start calls. Leap with trust, not fear.'],
        ['I', 'The Magician', '🪄', 'You already hold every tool you need. Begin.'],
        ['II', 'High Priestess', '🌙', 'Listen inward. Your intuition knows the answer.'],
        ['III', 'The Empress', '🌸', 'Abundance and creativity bloom. Nurture yourself.'],
        ['VI', 'The Lovers', '💞', 'A heartfelt choice aligns you with your values.'],
        ['X', 'Wheel of Fortune', '🎡', 'Luck turns in your favour. Embrace the change.'],
        ['XI', 'Strength', '🦁', 'Quiet courage and patience will carry you through.'],
        ['XVII', 'The Star', '⭐', 'Hope returns. Healing and guidance light your way.'],
        ['XIX', 'The Sun', '☀️', 'Joy, success and clarity. A radiant chapter begins.'],
        ['XXI', 'The World', '🌍', 'Completion and fulfilment. A cycle ends beautifully.']
    ];
    const table = $('#tarot-table'), msg = $('#tarot-msg'), shuffleBtn = $('#shuffle-btn');
    let cards = [];
    const build = () => {
        table.innerHTML = ''; cards = [];
        [...deck].sort(() => Math.random() - .5).slice(0, 5).forEach((d, i) => {
            const c = document.createElement('div');
            c.className = 'tcard'; c.style.setProperty('--r', (i - 2) * 5 + 'deg');
            c.innerHTML = `<div class="tface tback"><span>🔮</span></div><div class="tface tfront"><div class="num">${d[0]}</div><div class="sym">${d[2]}</div><h4>${d[1]}</h4><small>${d[3]}</small></div>`;
            c.addEventListener('click', () => {
                cards.forEach(x => x.classList.remove('picked'));
                c.classList.add('flipped', 'picked');
                msg.textContent = `${d[2]} ${d[1]}: ${d[3]}`;
            });
            table.appendChild(c); cards.push(c);
        });
    };
    build();
    shuffleBtn.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('flipped', 'picked'));
        msg.textContent = '🔀 The cards are mingling with the stars...';
        shuffleBtn.disabled = true;
        setTimeout(() => {
            build(); shuffleBtn.disabled = false;
            const pick = cards[Math.random() * cards.length | 0];
            setTimeout(() => pick.click(), 500);
        }, 900);
    });
});

// Moon phase chip
(() => {
    const el = document.getElementById('moon'); if (!el) return;
    const age = ((Date.now() / 864e5 - 10.6) % 29.53 + 29.53) % 29.53;
    const i = Math.round(age / 29.53 * 8) % 8;
    el.parentElement.innerHTML = ['🌑 New Moon', '🌒 Waxing Crescent', '🌓 First Quarter', '🌔 Waxing Gibbous', '🌕 Full Moon', '🌖 Waning Gibbous', '🌗 Last Quarter', '🌘 Waning Crescent'][i] + ' tonight';
})();
