/* Firebase auth. Only 2 root collections. u/{uid} {u username, a avatar, c created, l last login} | r/{id} {a author uid, s stars, t text, c, e}; r/0 {n} = review counter */
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
    const TS = () => firebase.firestore.FieldValue.serverTimestamp();
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
        const ref = db.collection('u').doc(user.uid);
        try {
            const s = await ref.get(), x = s.data() || {};
            await ref.set({ a: user.photoURL || null, l: TS(), ...(s.exists && x.c ? {} : { c: TS() }) }, { merge: true });
            profile = { u: x.u || null, c: x.c && x.c.toDate ? x.c.toDate() : new Date() };
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
    $('mail-form').addEventListener('submit', async e => {
        e.preventDefault(); const b = $('mail-btn'), em = $('mail-input').value.trim(); b.disabled = true;
        try { await auth.sendSignInLinkToEmail(em, { url: location.origin + location.pathname, handleCodeInApp: true }); localStorage.setItem('emailForSignIn', em); $('si-msg').textContent = '📬 Check your inbox for the sign-in link.'; }
        catch (err) { $('si-msg').textContent = '❌ ' + (err.code === 'auth/operation-not-allowed' ? 'Enable Email link sign-in in Firebase first' : err.message); }
        b.disabled = false;
    });
    if (auth.isSignInWithEmailLink(location.href)) {
        const em = localStorage.getItem('emailForSignIn') || prompt('Confirm your email to finish signing in');
        if (em) auth.signInWithEmailLink(em, location.href).then(() => { localStorage.removeItem('emailForSignIn'); history.replaceState(null, '', location.pathname + location.hash); }).catch(e => toast('❌ ' + e.message));
    }
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
        $('pf-meta').textContent = (user.email || '') + ' • Member since ' + ((profile && profile.c) || new Date(user.metadata.creationTime)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
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
