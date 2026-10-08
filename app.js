/* Astrologer Monika: one shared script for every page. Sections run only where their elements exist. */
/* ================= protect ================= */
/* Deterrent only: blocks right-click, view-source/DevTools shortcuts and silences console on the live site. Not real security. */
(() => {
    const stop = e => e.preventDefault();
    document.addEventListener('contextmenu', e => { if (!/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) stop(e); });
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
    const Auth = window.Auth = { db: null, user: null, profile: null, dbMissing: false, avatar, toast, openSignIn() { toast('⚙️ Add your Firebase config in app.js'); }, openProfile() {} };
    const signinBtn = $('signin-btn'), menu = $('user-menu'), nameModal = $('name-modal'), siModal = $('signin-modal');
    const show = el => { el.hidden = false; document.body.classList.add('modal-open'); const f = el.querySelector('#g-signin, input'); if (f) setTimeout(() => f.focus(), 50); };
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
            if (profile.u) {
                let seen = false;
                try { seen = sessionStorage.getItem('welcomed') === user.uid; sessionStorage.setItem('welcomed', user.uid); } catch (e) {}
                if (!seen) toast('✨ Welcome back, @' + profile.u + '!');
            }
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
        if (!a.db) { status = 'Add your Firebase config in app.js to enable reviews.'; all = []; }
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

/* ================= QR Code Generator for JavaScript (c) 2009 Kazuhiko Arase, MIT license ================= */
var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1})},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(o*r,n*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}(function(){return qrcode});

/* ================= pay (pay.html): PhonePe + UPI QR + my orders ================= */
(() => {
    const $ = id => document.getElementById(id), A = () => window.Auth || {};
    if (!$('pay-list')) return; // pay page only
    const UPI = { id: '7065921594-2@ybl', name: 'Astrologer Monika', phone: '7065921594' }; // EDIT payment details here
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const rs = p => '₹' + (p / 100).toLocaleString('en-IN');
    const now = () => Math.floor(Date.now() / 1000);
    const hex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
    const api = async (path, body) => {
        const u = A().user;
        const r = await fetch('/api/' + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(u ? { Authorization: 'Bearer ' + await u.getIdToken() } : {}) }, body: body && JSON.stringify(body) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Request failed');
        return j;
    };
    // o/{id}: u buyer uid | e email | n username | p plan | a amount (paise) | q question (Ask 1 Question plan) | m pp or qr | s new/claimed/done/paid/failed | c created | t updated | r UTR
    const orders = () => A().db.collection('o');
    const newOrder = async (k, p, m, id, q) => {
        const a = A(), t = now(), o = { u: a.user.uid, e: a.user.email, n: a.profile.u, p: k, a: p, m, s: 'new', c: t, t };
        if (q) o.q = q;
        await orders().doc(id).set(o);
        return { id, ...o };
    };
    const ready = () => { // must be signed in AND have a username, so every order shows who paid
        const a = A();
        if (!a.user) { a.openSignIn(); return false; }
        if (!a.profile || !a.profile.u) { a.openProfile(true); return false; }
        return true;
    };
    const BADGE = { new: 'Awaiting payment', claimed: 'Verifying', done: 'Paid (PhonePe)', paid: 'Paid', failed: 'Failed' };
    const PAIDLIKE = s => s === 'paid' || s === 'done';
    let plans = {}, mine = [], unQR = null, unList = null, cur = null, waT = null;
    const panel = $('qr-panel');
    $('qr-upi').textContent = UPI.id;
    document.querySelectorAll('.pay-phone').forEach(a => { a.textContent = UPI.phone; a.href = 'tel:+91' + UPI.phone; });

    // WhatsApp hand-off: a ready-made message with the order, question, username and uid
    const waLink = o => 'https://wa.me/91' + UPI.phone + '?text=' + encodeURIComponent(
        '🔮 Hello Astrologer Monika, I have paid.\nOrder: ' + o.id + '\nPlan: ' + (plans[o.p] ? plans[o.p].n : o.p) + ' (' + rs(o.a) + ')\n' +
        (o.q ? 'My question: ' + o.q + '\n' : '') + 'Paid via: ' + (o.m === 'qr' ? 'UPI QR' + (o.r ? ' (UTR ' + o.r + ')' : '') : 'PhonePe') +
        '\nUsername: @' + (o.n || '') + '\nUser ID: ' + o.u);
    function showWA(o, title, sub) {
        const link = waLink(o); clearInterval(waT);
        $('wa-title').textContent = title; $('wa-sub').textContent = sub; $('wa-go').href = link;
        let n = 5;
        const tick = () => {
            if (n <= 0) { clearInterval(waT); $('wa-count').textContent = 'Opening WhatsApp…'; location.href = link; return; }
            $('wa-count').textContent = 'Opening WhatsApp in ' + n + 's…'; n--;
        };
        tick(); waT = setInterval(tick, 1000);
        $('wa-modal').hidden = false; document.body.classList.add('modal-open');
    }
    const closeWA = () => { clearInterval(waT); $('wa-count').textContent = ''; $('wa-modal').hidden = true; document.body.classList.remove('modal-open'); };
    $('wa-stay').addEventListener('click', closeWA); $('wa-x').addEventListener('click', closeWA);

    const upiLink = (id, a) => 'upi://pay?pa=' + UPI.id + '&pn=' + encodeURIComponent(UPI.name) + '&am=' + (a / 100).toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(id);

    function paint(d) {
        if (!d) return; const s = d.s, st = $('qr-status');
        st.className = 'qr-status ' + s;
        st.textContent = PAIDLIKE(s) ? '✅ Payment confirmed! Now send your birth details on the Contact page.' : s === 'claimed' ? '⏳ Payment submitted. We will confirm it shortly.' : s === 'failed' ? '❌ We could not verify this payment. Please call ' + UPI.phone + '.' : 'Waiting for your payment…';
        $('qr-claim').hidden = PAIDLIKE(s);
    }
    function showQR(o) {
        const link = upiLink(o.id, o.a), q = qrcode(0, 'M');
        q.addData(link); q.make();
        $('qr-box').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); // SVG built from our own data
        $('qr-title').textContent = (plans[o.p] ? plans[o.p].n : 'Payment') + ' · ' + rs(o.a) + (o.q ? ' · “' + o.q + '”' : '');
        $('qr-amt').textContent = rs(o.a); $('qr-oid').textContent = o.id; $('qr-open').href = link;
        $('qr-utr').value = ''; $('qr-err').textContent = '';
        cur = o; panel.dataset.id = o.id; panel.hidden = false; paint({ s: o.s || 'new' });
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (unQR) unQR();
        unQR = orders().doc(o.id).onSnapshot(s => paint(s.data()), () => {});
    }
    const closeQR = () => { panel.hidden = true; if (unQR) { unQR(); unQR = null; } };
    $('qr-x').addEventListener('click', closeQR);
    $('qr-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('qr-oid').textContent); A().toast('📋 Order ID copied'); } catch (e) { A().toast($('qr-oid').textContent); } });
    $('qr-claim').addEventListener('submit', async e => {
        e.preventDefault(); const b = $('qr-claim-btn'), utr = $('qr-utr').value.trim(); $('qr-err').textContent = '';
        if (!/^[A-Za-z0-9]{6,30}$/.test(utr)) return $('qr-err').textContent = 'Enter a valid UTR / reference number (letters and numbers only).';
        b.disabled = true;
        try {
            await orders().doc(panel.dataset.id).update({ s: 'claimed', r: utr, t: now() });
            const o = { ...(mine.find(x => x.id === panel.dataset.id) || cur), id: panel.dataset.id, r: utr };
            closeQR(); showWA(o, '✅ Payment submitted!', 'Send your order details to Monika on WhatsApp so she can confirm your payment and start your reading.');
        }
        catch (err) { $('qr-err').textContent = err.code === 'permission-denied' ? 'Could not save. Please call ' + UPI.phone + '.' : err.message; }
        b.disabled = false;
    });

    function renderOrders() {
        const box = $('my-orders'); box.replaceChildren();
        if (!mine.length) return box.append(el('p', 'pay-note', 'No orders yet.'));
        mine.forEach(o => {
            const row = el('div', 'order-row'), info = el('div', 'order-info');
            info.append(el('b', '', (plans[o.p] ? plans[o.p].n : o.p) + ' · ' + rs(o.a)), ...(o.q ? [el('em', 'order-q', '“' + o.q + '”')] : []), el('small', '', (o.m === 'qr' ? 'UPI QR' : 'PhonePe') + ' · ' + new Date(o.c * 1000).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' · #' + o.id));
            row.append(info, el('span', 'badge-s ' + o.s, BADGE[o.s] || o.s));
            if (o.s !== 'new' && o.s !== 'failed') { const w = el('a', 'mini', '💬 WhatsApp'); w.href = waLink(o); w.target = '_blank'; w.rel = 'noopener'; row.append(w); }
            if (o.m === 'qr' && (o.s === 'new' || o.s === 'claimed')) { const b = el('button', 'mini', 'Show QR'); b.type = 'button'; b.onclick = () => showQR(o); row.append(b); }
            box.append(row);
        });
    }
    function watchOrders() {
        if (unList) { unList(); unList = null; }
        const a = A(), box = $('my-orders'); mine = [];
        if (!a.db) return;
        if (!a.user) { closeQR(); return box.replaceChildren(el('p', 'pay-note', 'Sign in to see your orders.')); }
        unList = orders().where('u', '==', a.user.uid).onSnapshot(s => { mine = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => y.c - x.c); renderOrders(); },
            e => box.replaceChildren(el('p', 'pay-note', e.code === 'permission-denied' ? 'Publish firestore.rules to see your orders.' : 'Could not load your orders.')));
    }

    const plansP = api('plans').then(list => {
        const box = $('pay-list'); box.replaceChildren();
        list.forEach(p => {
            plans[p.k] = p;
            const c = el('div', 'pay-card'), b = el('button', 'btn-gold', '💳 Pay with PhonePe'), q = el('button', 'btn-outline', '📱 Pay via UPI QR'); b.type = q.type = 'button';
            let ta = null;
            if (p.q) { ta = el('textarea', 'ask-q'); ta.rows = 3; ta.maxLength = 300; ta.placeholder = 'Type your 1 question here…'; ta.setAttribute('aria-label', 'Your question'); }
            const getQ = () => { // false = stop, null = no question needed
                if (!p.q) return null;
                const v = ta.value.trim();
                if (v.length < 5) { A().toast('✍️ Please type your question first (at least 5 characters)'); ta.focus(); return false; }
                return v;
            };
            b.onclick = async () => {
                if (!ready()) return;
                const qv = getQ(); if (qv === false) return;
                b.disabled = true; b.textContent = 'Redirecting…';
                let id = null;
                try {
                    id = A().user.uid + '-' + hex(5);
                    await newOrder(p.k, p.p, 'pp', id, qv);
                    location.href = (await api('pay', { plan: p.k, id })).url;
                } catch (e) {
                    if (id) orders().doc(id).update({ s: 'failed', t: now() }).catch(() => {});
                    A().toast('❌ ' + (e.code === 'permission-denied' ? 'Could not create the order. Publish firestore.rules.' : e.message));
                    b.disabled = false; b.textContent = '💳 Pay with PhonePe';
                }
            };
            q.onclick = async () => {
                if (!ready()) return;
                const qv = getQ(); if (qv === false) return;
                const old = mine.find(o => o.m === 'qr' && o.p === p.k && o.s === 'new' && (o.q || null) === qv); // reuse an unpaid QR order
                if (old) return showQR(old);
                q.disabled = true; q.textContent = 'Creating order…';
                try { showQR(await newOrder(p.k, p.p, 'qr', 'MK' + hex(4).toUpperCase(), qv)); }
                catch (e) { A().toast('❌ ' + (e.code === 'permission-denied' ? 'Could not create the order. Publish firestore.rules.' : e.message)); }
                q.disabled = false; q.textContent = '📱 Pay via UPI QR';
            };
            c.append(el('h3', '', p.n), el('div', 'pay-price', rs(p.p)), ...(ta ? [ta] : []), b, q);
            box.append(c);
        });
        renderOrders();
    }).catch(() => $('pay-list').replaceChildren(el('p', 'pay-note', 'Payments are not set up yet. Please call ' + UPI.phone + '.')));

    // back from PhonePe: ?order=... -> ask the server for the real status, then record it on the order
    const oid = new URLSearchParams(location.search).get('order');
    let done = false;
    window.addEventListener('authchange', async () => {
        watchOrders();
        if (!oid || done || !A().user) return; done = true;
        let s = 'PENDING';
        for (let i = 0; i < 5 && s === 'PENDING'; i++) {
            try { s = (await api('status', { order: oid })).state; } catch (e) { break; }
            if (s === 'PENDING') await new Promise(r => setTimeout(r, 3000));
        }
        if (s === 'COMPLETED' || s === 'FAILED') await orders().doc(oid).update({ s: s === 'COMPLETED' ? 'done' : 'failed', t: now() }).catch(() => {});
        history.replaceState(null, '', location.pathname);
        if (s !== 'COMPLETED') return A().toast(s === 'PENDING' ? '⏳ Payment is still processing. Please check again in a minute.' : '❌ Payment failed. Please try again.');
        await plansP;
        let o = null;
        try { const d = await orders().doc(oid).get(); if (d.exists) o = { id: d.id, ...d.data() }; } catch (e) {}
        if (o) showWA(o, '✅ Payment received!', 'Continue on WhatsApp so Monika can start your reading. Your order details are filled in for you.');
        else A().toast('✅ Payment received! Please message Monika on WhatsApp ' + UPI.phone + '.');
    });
    watchOrders();
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
    if (parallaxElements.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                parallaxElements.forEach(el => {
                    el.style.transform = `translateY(${window.scrollY * parseFloat(el.dataset.speed || 0)}px)`;
                });
                ticking = false;
            });
        }, { passive: true });
    }

    // 4. Mobile Menu
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        const icon = menuToggle.querySelector('i');
        const setMenu = open => {
            navMenu.classList.toggle('active', open);
            menuToggle.setAttribute('aria-expanded', open);
            if (icon) { icon.classList.toggle('fa-bars', !open); icon.classList.toggle('fa-xmark', open); }
        };
        menuToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('active')));
        navMenu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
        document.addEventListener('click', e => { if (!e.target.closest('#header')) setMenu(false); });
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
            const v = id => bookingForm.querySelector('#' + id).value.trim();
            const say = m => (window.Auth && Auth.toast ? Auth.toast(m) : alert(m));
            if (v('phone').replace(/\D/g, '').length < 10) return say('📞 Please enter a valid phone number.');
            const btn = bookingForm.querySelector('.submit-btn');
            const msg = '🔮 Hello Astrologer Monika, I would like a reading.\n' +
                'Name: ' + v('fullName') + '\nPhone: ' + v('phone') + '\n' +
                'Date of birth: ' + v('dob').split('-').reverse().join('-') + '\n' +
                'Time of birth: ' + v('tob') + '\nPlace of birth: ' + v('pob');
            const url = 'https://wa.me/917065921594?text=' + encodeURIComponent(msg);
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Aligning Stars...';
            const w = window.open(url, '_blank');
            if (w) w.opener = null; else location.href = url;
            say('✨ WhatsApp is opening. Press send to share your birth details with Monika.');
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '🔓 Unlock My Destiny';
                bookingForm.reset();
            }, 1500);
        });
    }
});

/* ===== UPGRADE ===== */
document.addEventListener('DOMContentLoaded', () => {
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer:fine)').matches && !reduce;

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

    // Marquee: duplicate the items once so the -50% loop is seamless
    const mt = $('.marquee-track');
    if (mt && !reduce) [...mt.children].forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); mt.appendChild(c); });

    // Scroll progress, back-to-top, active nav
    const bar = $('#progress'), top = $('#to-top');
    const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
    $$('.nav-link').forEach(l => { const on = l.getAttribute('href').replace(/\.html$/, '') === page; l.classList.toggle('active', on); if (on) l.setAttribute('aria-current', 'page'); });
    addEventListener('scroll', () => {
        const h = document.documentElement;
        if (bar) bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - innerHeight) * 100) + '%';
        if (top) top.classList.toggle('show', scrollY > 600);
    }, { passive: true });

    // Cursor glow + sparkle trail
    if (fine) {
        const g = $('#glow'); let last = 0;
        addEventListener('mousemove', e => {
            g.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
            if (Date.now() - last > 70 && document.querySelectorAll('.spark').length < 25) {
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
    const shuffled = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    if (msg) msg.setAttribute('aria-live', 'polite');
    const build = () => {
        table.innerHTML = ''; cards = [];
        shuffled(deck).slice(0, 5).forEach((d, i) => {
            const c = document.createElement('div');
            c.className = 'tcard'; c.style.setProperty('--r', (i - 2) * 5 + 'deg');
            c.tabIndex = 0; c.setAttribute('role', 'button'); c.setAttribute('aria-label', 'Tarot card ' + (i + 1) + ', face down. Press to reveal.');
            c.innerHTML = `<div class="tface tback"><span>🔮</span></div><div class="tface tfront"><div class="num">${d[0]}</div><div class="sym">${d[2]}</div><h4>${d[1]}</h4><small>${d[3]}</small></div>`;
            c.addEventListener('click', () => {
                cards.forEach(x => x.classList.remove('picked'));
                c.classList.add('flipped', 'picked');
                msg.textContent = `${d[2]} ${d[1]}: ${d[3]}`;
                c.setAttribute('aria-label', `${d[1]}: ${d[3]}`);
            });
            c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } });
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
    const P = 29.530588853; // synodic month; reference new moon 2000-01-06 18:14 UTC
    const age = ((Date.now() / 864e5 - 10962.7597) % P + P) % P;
    const i = Math.round(age / P * 8) % 8;
    el.parentElement.innerHTML = ['🌑 New Moon', '🌒 Waxing Crescent', '🌓 First Quarter', '🌔 Waxing Gibbous', '🌕 Full Moon', '🌖 Waning Gibbous', '🌗 Last Quarter', '🌘 Waning Crescent'][i] + ' tonight';
})();
