/* Astrologer Monika: one shared script for every page. Sections run only where their elements exist. */
/* ================= protect ================= */
/* Deterrent only: blocks right-click, view-source/DevTools shortcuts and silences console on the live site. Not real security. */
(() => {
    const stop = e => e.preventDefault();
    document.addEventListener('contextmenu', stop);
    document.addEventListener('dragstart', e => e.target.tagName === 'IMG' && stop(e));
    document.addEventListener('keydown', e => {
        const k = e.key.toLowerCase(), c = e.ctrlKey || e.metaKey;
        if (e.key === 'F12' || (c && e.shiftKey && 'ijc'.includes(k)) || (c && k === 'u') || (e.metaKey && e.altKey && 'iju'.includes(k))) stop(e);
    });
    if (!/^(localhost|127\.|\[::1\])/.test(location.hostname)) ['log', 'info', 'warn', 'error', 'debug', 'table', 'dir', 'trace'].forEach(m => console[m] = () => {});
})();

/* ================= auth (Firebase) ================= */
/* Firebase auth. Only 2 root collections. u/{uid} {u username} | r/{random 20 char id} {a author uid, s stars, t text, c created (unix s), e edited (unix s)} */
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCHWrBA5nuYOopFo8BmnkKLQMXCCOXfMdI",
    authDomain: "monika-15600.firebaseapp.com",
    projectId: "monika-15600",
    storageBucket: "monika-15600.firebasestorage.app",
    messagingSenderId: "1018777441364",
    appId: "1:1018777441364:web:2b0ec711b1fbf1710249c1",
    measurementId: "G-J025QVQ0RX"
};

(() => {
    const $ = id => document.getElementById(id);
    const NAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
    let tt;
    const toast = m => { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 4500); };
    const avatar = (url, name, cls = '') => {
        const s = document.createElement('span'); s.className = ('av ' + cls).trim();
        s.textContent = ((name || '?').replace(/^@/, '')[0] || '?').toUpperCase();
        if (url) { const i = new Image(); i.referrerPolicy = 'no-referrer'; i.alt = ''; i.onload = () => { s.textContent = ''; s.appendChild(i); }; i.src = url; }
        return s;
    };
    const Auth = window.Auth = { db: null, user: null, profile: null, dbMissing: false, avatar, toast, openSignIn() { toast('⚙️ Add your Firebase config in auth.js'); }, openProfile() {} };
    const signinBtn = $('signin-btn'), menu = $('user-menu'), nameModal = $('name-modal'), siModal = $('signin-modal');
    const show = el => { el.hidden = false; document.body.classList.add('modal-open'); };
    const hide = el => { el.hidden = true; if (nameModal.hidden && siModal.hidden) document.body.classList.remove('modal-open'); };
    signinBtn.addEventListener('click', () => Auth.openSignIn());
    if (!window.firebase || FIREBASE_CONFIG.apiKey.includes('YOUR')) return;

    firebase.initializeApp(FIREBASE_CONFIG);
    try { if (firebase.analytics && location.protocol.startsWith('http')) firebase.analytics(); } catch (e) {}
    const auth = firebase.auth(), db = Auth.db = firebase.firestore();
    let user = null, profile = null, dbMissing = false, syncedFor = null, required = false;
    const emit = () => { Object.assign(Auth, { user, profile, dbMissing }); window.dispatchEvent(new CustomEvent('authchange')); };

    function renderHeader() {
        signinBtn.hidden = !!user; menu.hidden = !user;
        if (!user) return;
        const n = (profile && profile.u) || (user.displayName || user.email || 'Seeker').split(/[ @]/)[0];
        $('user-name').textContent = profile && profile.u ? '@' + n : n;
        $('user-av').replaceChildren(avatar(user.photoURL, n));
    }

    async function syncProfile() {
        try {
            profile = { u: ((await db.collection('u').doc(user.uid).get()).data() || {}).u || null };
            dbMissing = false;
            if (profile.u) toast('✨ Welcome back, @' + profile.u + '!');
        } catch (e) {
            dbMissing = true; profile = null;
            toast(e.code === 'permission-denied' ? '⚙️ Publish firestore.rules in Firebase first' : '⚙️ Create the Firestore database first (' + (e.code || e.message) + ')');
        }
    }

    async function onUser(u) {
        user = u;
        if (!user) { profile = null; syncedFor = null; renderHeader(); hide(siModal); hide(nameModal); emit(); return; }
        hide(siModal); renderHeader();
        if (syncedFor !== user.uid) { syncedFor = user.uid; await syncProfile(); }
        renderHeader(); emit();
        if (!dbMissing && profile && !profile.u) Auth.openProfile(true);
    }

    Auth.openSignIn = () => { $('si-msg').textContent = ''; show(siModal); };
    $('g-signin').addEventListener('click', async () => {
        const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
        try { await auth.signInWithPopup(p); }
        catch (e) {
            if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code) && e.code !== 'auth/cancelled-popup-request') return auth.signInWithRedirect(p);
            if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') $('si-msg').textContent = '❌ ' + (e.code === 'auth/unauthorized-domain' ? 'Add this domain in Firebase > Authentication > Settings > Authorized domains' : e.message);
        }
    });
    auth.getRedirectResult().catch(e => e.code && toast('❌ ' + e.message));

    const signOut = async () => { await auth.signOut(); toast('👋 Signed out. See you under the stars!'); };
    $('signout-btn').addEventListener('click', signOut);
    $('pf-signout').addEventListener('click', () => { hide(nameModal); signOut(); });

    const hint = (t, c = '') => { const h = $('nm-hint'); h.textContent = t; h.className = 'nm-hint ' + c; };
    const val = () => $('nm-input').value.trim().replace(/^@/, '');
    let ct;
    const check = () => {
        const v = val();
        if (!v) return hint('');
        if (!NAME_RE.test(v)) return hint('3 to 20 letters, numbers or underscores', 'bad');
        hint('✅ Looks good', 'ok');
    };
    $('nm-input').addEventListener('input', check);
    Auth.openProfile = (req = false) => {
        if (!user) return Auth.openSignIn();
        if (dbMissing) return toast('⚙️ Set up Firestore + rules first');
        required = !!req; const dn = user.displayName || user.email || '';
        $('nm-title').textContent = required ? 'Choose your username' : 'Your profile';
        $('nm-sub').textContent = required ? 'Pick a unique name to show on the site. You can change it anytime.' : 'Change your username below.';
        $('pf-av').replaceChildren(avatar(user.photoURL, (profile && profile.u) || dn, 'lg'));
        $('pf-meta').textContent = (user.email || '') + ' • Member since ' + new Date(user.metadata.creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        $('nm-input').value = (profile && profile.u) || dn.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
        $('nm-err').textContent = ''; $('nm-cancel').hidden = $('nm-x').hidden = required;
        show(nameModal); check(); setTimeout(() => $('nm-input').select(), 60);
    };
    $('user-btn').addEventListener('click', () => Auth.openProfile(false));
    $('name-form').addEventListener('submit', async e => {
        e.preventDefault(); const v = val();
        if (!NAME_RE.test(v)) { $('nm-err').textContent = 'Use 3 to 20 letters, numbers or underscores only.'; return; }
        const b = $('nm-save'); b.disabled = true; b.textContent = 'Saving…';
        try {
            await db.collection('u').doc(user.uid).set({ u: v }, { merge: true });
            profile = { ...profile, u: v }; renderHeader(); hide(nameModal); emit(); toast('✅ Username set to @' + v);
        } catch (err) { $('nm-err').textContent = err.code === 'permission-denied' ? 'Not allowed. Check firestore.rules is published.' : err.message; }
        b.disabled = false; b.textContent = '✨ Save username';
    });
    [['si-x', siModal], ['nm-x', nameModal], ['nm-cancel', nameModal]].forEach(([id, m]) => $(id).addEventListener('click', () => hide(m)));
    siModal.addEventListener('click', e => { if (e.target === siModal) hide(siModal); });
    nameModal.addEventListener('click', e => { if (e.target === nameModal && !required) hide(nameModal); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { hide(siModal); if (!required) hide(nameModal); } });
    auth.onAuthStateChanged(onUser);
})();

/* ================= reviews (reviews.html) ================= */
(() => {
    const $ = id => document.getElementById(id);
    if (!$('rv-list')) return; // reviews page only
    const MOODS = ['', '😞 Not great', '🙁 Could be better', '😐 Good', '😊 Very good', '🤩 Loved it'];
    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    let all = [], shown = 6, status = '', editing = null, last = 0;
    const A = () => window.Auth || {};
    const me = () => A().user;
    
    async function load() {
        const a = A();
        if (!a.db) { status = 'Add your Firebase config in auth.js to enable reviews.'; all = []; }
        else {
            try {
                const s = await a.db.collection('r').orderBy('c', 'desc').limit(200).get();
                const uids = [...new Set(s.docs.map(d => d.data().a))];
                const ps = await Promise.all(uids.map(id => a.db.collection('u').doc(id).get()));
                const who = {}; ps.forEach((p, i) => who[uids[i]] = p.exists ? p.data() : {});
                all = s.docs.map(d => { const x = d.data(), p = who[x.a] || {}; return { ref: d.ref, id: d.id, uid: x.a, u: p.u || 'seeker', av: me() && x.a === me().uid ? me().photoURL : null, rt: x.s, t: x.t, c: new Date(x.c * 1000), ed: x.e || null }; });
                status = '';
            } catch (e) { all = []; status = e.code === 'permission-denied' ? 'Publish firestore.rules in Firebase.' : 'Could not load reviews (is Firestore created?).'; }
        }
        summary(); list(); form();
    }

    function summary() {
        const n = all.length, avg = n ? all.reduce((s, r) => s + r.rt, 0) / n : 0;
        $('rv-avg').textContent = n ? avg.toFixed(1) : '–';
        $('rv-avg-stars').textContent = stars(Math.round(avg));
        $('rv-count').textContent = status || (n ? n + ' review' + (n > 1 ? 's' : '') : 'No reviews yet. Be the first! ✨');
        const bars = $('rv-bars'); bars.replaceChildren();
        for (let s = 5; s >= 1; s--) {
            const c = all.filter(r => r.rt === s).length, row = el('div', 'rv-bar');
            const f = el('i'); f.style.width = (n ? c / n * 100 : 0) + '%';
            const track = el('span', 'track'); track.append(f);
            row.append(el('small', '', s + '★'), track, el('small', '', c));
            bars.append(row);
        }
    }

    function list() {
        const box = $('rv-list'); box.replaceChildren();
        all.slice(0, shown).forEach((r, i) => {
            const c = el('article', 'rv-card'); c.style.animationDelay = (i % 6) * 0.08 + 's';
            const head = el('div', 'rv-head'), who = el('div', 'rv-who');
            who.append(el('b', '', '@' + r.u), el('small', '', r.c.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + (r.ed ? ' · edited' : '')));
            const st = el('div', 'stars', stars(r.rt)); st.setAttribute('aria-label', r.rt + ' out of 5');
            head.append(A().avatar(r.av, r.u), who, st);
            c.append(head, el('p', '', r.t));
            if (me() && r.uid === me().uid) {
                c.classList.add('mine');
                const act = el('div', 'rv-own');
                const ed = el('button', '', 'Edit'), del = el('button', '', 'Delete');
                ed.type = del.type = 'button';
                ed.onclick = () => { editing = r; form(); $('rv-formwrap').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
                del.onclick = async () => { if (!confirm('Delete this review?')) return; try { await r.ref.delete(); A().toast('🗑️ Review deleted'); load(); } catch (e) { A().toast('❌ ' + e.message); } };
                act.append(el('span', 'rv-you', 'Your review'), ed, del); c.append(act);
            }
            box.append(c);
        });
        $('rv-more').hidden = all.length <= shown;
    }
    $('rv-more').addEventListener('click', () => { shown += 6; list(); });

    function form() {
        const w = $('rv-formwrap'); w.replaceChildren();
        const a = A(), box = el('div', 'rv-form');
        const note = (t, label, fn) => { box.append(el('h4', '', t)); if (label) { const b = el('button', 'btn-gold', label); b.type = 'button'; b.onclick = fn; box.append(b); } w.append(box); };
        if (!a.db) return note('🔒 Reviews are not configured yet');
        if (status.startsWith('Publish') || status.startsWith('Could not')) return note('⚙️ Finish the Firebase setup');
        if (!a.user) return note('✍️ Sign in to leave a review', 'Sign in', () => a.openSignIn());
        if (!a.profile || !a.profile.u) return note('Choose a username to review', 'Choose username', () => a.openProfile(true));
        let rating = editing ? editing.rt : 0;
        box.append(el('h4', '', editing ? '✏️ Edit your review' : '✍️ Write a review'));
        const row = el('div', 'star-pick'), mood = el('small', 'mood', MOODS[rating]);
        const paint = n => [...row.children].forEach((b, i) => b.classList.toggle('on', i < n));
        for (let i = 1; i <= 5; i++) {
            const b = el('button', '', '★'); b.type = 'button'; b.setAttribute('aria-label', i + ' stars');
            b.onmouseenter = () => { paint(i); mood.textContent = MOODS[i]; };
            b.onclick = () => { rating = i; paint(i); mood.textContent = MOODS[i]; };
            row.append(b);
        }
        row.onmouseleave = () => { paint(rating); mood.textContent = MOODS[rating]; };
        paint(rating);
        const ta = el('textarea'); ta.maxLength = 600; ta.rows = 4; ta.placeholder = 'Share your experience (10 to 600 characters)…'; ta.value = editing ? editing.t : '';
        const cnt = el('small', 'cnt', ta.value.length + '/600'); ta.oninput = () => cnt.textContent = ta.value.length + '/600';
        const err = el('p', 'rv-err'), acts = el('div', 'rv-acts');
        const send = el('button', 'btn-gold', editing ? 'Update review' : '🚀 Post review'); send.type = 'button';
        const now = () => Math.floor(Date.now() / 1000);
        send.onclick = async () => {
            const t = ta.value.trim();
            if (!rating) return err.textContent = 'Please pick a star rating.';
            if (t.length < 10) return err.textContent = 'Please write at least 10 characters.';
            if (!editing && Date.now() - last < 15000) return err.textContent = 'Please wait a few seconds before posting again.';
            send.disabled = true; err.textContent = '';
            try {
                if (editing) await editing.ref.update({ s: rating, t, e: now() });
                else {
                    await a.db.collection('r').doc().set({ a: a.user.uid, s: rating, t, c: now() });
                    last = Date.now();
                }
                a.toast(editing ? '✅ Review updated' : '🌟 Thank you for your review!'); editing = null; load();
            } catch (e) { err.textContent = e.code === 'permission-denied' ? 'Not allowed. Check firestore.rules is published.' : e.message; }
            send.disabled = false;
        };
        acts.append(send);
        if (editing) { const c = el('button', 'btn-outline', 'Cancel'); c.type = 'button'; c.onclick = () => { editing = null; form(); }; acts.append(c); }
        box.append(row, mood, ta, cnt, err, acts); w.append(box);
    }

    window.addEventListener('authchange', () => { editing = null; load(); });
    load();
})();

/* ================= pay (pay.html) ================= */
(() => {
    const $ = id => document.getElementById(id), A = () => window.Auth || {};
    if (!$('pay-list')) return; // pay page only
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const api = async (path, body) => {
        const u = A().user;
        const r = await fetch('/api/' + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(u ? { Authorization: 'Bearer ' + await u.getIdToken() } : {}) }, body: body && JSON.stringify(body) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Request failed');
        return j;
    };

    api('plans').then(list => {
        const box = $('pay-list'); box.replaceChildren();
        list.forEach(p => {
            const c = el('div', 'pay-card'), b = el('button', 'btn-gold', 'Pay now'); b.type = 'button';
            b.onclick = async () => {
                const a = A(); if (!a.user) return a.openSignIn();
                b.disabled = true; b.textContent = 'Redirecting…';
                try { location.href = (await api('pay', { plan: p.k })).url; }
                catch (e) { a.toast('❌ ' + e.message); b.disabled = false; b.textContent = 'Pay now'; }
            };
            c.append(el('h3', '', p.n), el('div', 'pay-price', '₹' + (p.p / 100).toLocaleString('en-IN')), b);
            box.append(c);
        });
    }).catch(() => $('pay-list').replaceChildren(el('p', 'pay-note', 'Payments are not set up yet.')));

    // back from PhonePe: ?order=... -> ask the server for the real status
    const oid = new URLSearchParams(location.search).get('order');
    let done = false;
    window.addEventListener('authchange', async () => {
        if (!oid || done || !A().user) return; done = true;
        let s = 'PENDING';
        for (let i = 0; i < 5 && s === 'PENDING'; i++) {
            try { s = (await api('status', { order: oid })).state; } catch (e) { break; }
            if (s === 'PENDING') await new Promise(r => setTimeout(r, 3000));
        }
        A().toast(s === 'COMPLETED' ? '✅ Payment received! Now send your birth details on the Contact page.' : s === 'PENDING' ? '⏳ Payment is still processing. Please check again in a minute.' : '❌ Payment failed. Please try again.');
        history.replaceState(null, '', location.pathname);
    });
})();

/* ================= site effects, tarot, journey ================= */
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
    const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
    $$('.nav-link').forEach(l => { const on = l.getAttribute('href').replace(/\.html$/, '') === page; l.classList.toggle('active', on); if (on) l.setAttribute('aria-current', 'page'); });
    addEventListener('scroll', () => {
        const h = document.documentElement;
        bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - innerHeight) * 100) + '%';
        top.classList.toggle('show', scrollY > 600);
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
    if (table) build();
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
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
