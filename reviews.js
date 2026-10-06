(() => {
    const $ = id => document.getElementById(id);
    const MOODS = ['', '😞 Not great', '🙁 Could be better', '😐 Good', '😊 Very good', '🤩 Loved it'];
    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
    const el = (t, c, x) => {
        const e = document.createElement(t);
        if (c) e.className = c;
        if (x != null) e.textContent = x;
        return e;
    };

    let all = [], shown = 6, status = '', editing = null, last = 0;
    const A = () => window.Auth || {};
    const me = () => A().user;

    // Helper to parse Unix timestamps or fallback to legacy Firestore timestamps
    function parseDate(ts) {
        if (!ts) return new Date();
        if (typeof ts === 'number') return new Date(ts);
        if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
        return new Date(ts);
    }

    async function load() {
        const a = A();
        if (!a.db) {
            status = 'Add your Firebase config in auth.js to enable reviews.';
            all = [];
        } else {
            try {
                // Fetch reviews
                const s = await a.db.collection('r').limit(200).get();
                const docs = s.docs.map(d => ({ id: d.id, ref: d.ref, data: d.data() }));

                // Fetch author usernames (no avatar saving needed)
                const uids = [...new Set(docs.map(d => d.data.authorId || d.data.a))].filter(Boolean);
                const ps = await Promise.all(uids.map(id => a.db.collection('u').doc(id).get()));
                const who = {};
                ps.forEach((p, i) => who[uids[i]] = p.exists ? p.data() : {});

                all = docs.map(d => {
                    const x = d.data;
                    const uid = x.authorId || x.a;
                    const profile = who[uid] || {};
                    const createdAt = parseDate(x.createdAt || x.c);
                    const updatedAt = x.updatedAt || x.e ? parseDate(x.updatedAt || x.e) : null;

                    return {
                        ref: d.ref,
                        id: d.id,
                        uid: uid,
                        u: profile.u || 'seeker',
                        rt: x.rating ?? x.s ?? 5,
                        t: x.text || x.t || '',
                        c: createdAt,
                        ed: updatedAt
                    };
                });

                // Sort descending by Unix timestamp
                all.sort((a, b) => b.c - a.c);
                status = '';
            } catch (e) {
                all = [];
                status = e.code === 'permission-denied'
                    ? 'Publish firestore.rules in Firebase.'
                    : 'Could not load reviews (is Firestore created?).';
            }
        }
        summary();
        list();
        form();
    }

    function summary() {
        const n = all.length;
        const avg = n ? all.reduce((s, r) => s + r.rt, 0) / n : 0;
        $('rv-avg').textContent = n ? avg.toFixed(1) : '–';
        $('rv-avg-stars').textContent = stars(Math.round(avg));
        $('rv-count').textContent = status || (n ? n + ' review' + (n > 1 ? 's' : '') : 'No reviews yet. Be the first! ✨');
        
        const bars = $('rv-bars');
        bars.replaceChildren();
        for (let s = 5; s >= 1; s--) {
            const c = all.filter(r => r.rt === s).length;
            const row = el('div', 'rv-bar');
            const f = el('i');
            f.style.width = (n ? (c / n) * 100 : 0) + '%';
            const track = el('span', 'track');
            track.append(f);
            row.append(el('small', '', s + '★'), track, el('small', '', c));
            bars.append(row);
        }
    }

    function list() {
        const box = $('rv-list');
        box.replaceChildren();

        all.slice(0, shown).forEach((r, i) => {
            const c = el('article', 'rv-card');
            c.style.animationDelay = (i % 6) * 0.08 + 's';
            
            const head = el('div', 'rv-head');
            const who = el('div');
            
            who.append(
                el('b', '', '@' + r.u + ' • #' + r.id),
                el('small', '', r.c.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + (r.ed ? ' • edited' : ''))
            );

            // Dynamically load avatar on the fly without saving string in DB
            head.append(A().avatar(null, r.u), who);

            const st = el('div', 'stars', stars(r.rt));
            st.setAttribute('aria-label', r.rt + ' out of 5');
            c.append(head, st, el('p', '', r.t));

            if (me() && r.uid === me().uid) {
                c.classList.add('mine');
                const act = el('div', 'rv-own');
                const ed = el('button', '', '✏️ Edit');
                const del = el('button', '', '🗑️️ Delete');
                ed.type = del.type = 'button';
                
                ed.onclick = () => {
                    editing = r;
                    form();
                    $('rv-formwrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
                };
                
                del.onclick = async () => {
                    if (!confirm('Delete this review?')) return;
                    try {
                        await r.ref.delete();
                        A().toast('🗑️️ Review deleted');
                        load();
                    } catch (e) {
                        A().toast('❌ ' + e.message);
                    }
                };

                act.append(ed, del);
                c.append(act);
            }
            box.append(c);
        });

        $('rv-more').hidden = all.length <= shown;
    }

    $('rv-more').addEventListener('click', () => {
        shown += 6;
        list();
    });

    function form() {
        const w = $('rv-formwrap');
        w.replaceChildren();

        const a = A();
        const box = el('div', 'rv-form');
        
        const note = (t, label, fn) => {
            box.append(el('h4', '', t));
            if (label) {
                const b = el('button', 'btn-gold', label);
                b.type = 'button';
                b.onclick = fn;
                box.append(b);
            }
            w.append(box);
        };

        if (!a.db) return note('🔒 Reviews are not configured yet');
        if (status.startsWith('Publish') || status.startsWith('Could not')) return note('⚙️ Finish the Firebase setup');
        if (!a.user) return note('✍️ Sign in to leave a review', 'Sign in', () => a.openSignIn());
        if (!a.profile || !a.profile.u) return note('Choose a username to review', 'Choose username', () => a.openProfile(true));

        let rating = editing ? editing.rt : 0;
        box.append(el('h4', '', editing ? '✏️ Edit your review #' + editing.id : '✍️ Write a review'));

        const row = el('div', 'star-pick');
        const mood = el('small', 'mood', MOODS[rating]);
        const paint = n => [...row.children].forEach((b, i) => b.classList.toggle('on', i < n));

        for (let i = 1; i <= 5; i++) {
            const b = el('button', '', '★');
            b.type = 'button';
            b.setAttribute('aria-label', i + ' stars');
            b.onmouseenter = () => { paint(i); mood.textContent = MOODS[i]; };
            b.onclick = () => { rating = i; paint(i); mood.textContent = MOODS[i]; };
            row.append(b);
        }

        row.onmouseleave = () => { paint(rating); mood.textContent = MOODS[rating]; };
        paint(rating);

        const ta = el('textarea');
        ta.maxLength = 600;
        ta.rows = 4;
        ta.placeholder = 'Share your experience (10 to 600 characters)…';
        ta.value = editing ? editing.t : '';

        const cnt = el('small', 'cnt', ta.value.length + '/600');
        ta.oninput = () => cnt.textContent = ta.value.length + '/600';

        const err = el('p', 'rv-err');
        const acts = el('div', 'rv-acts');
        const send = el('button', 'btn-gold', editing ? 'Update review' : '🚀 Post review');
        send.type = 'button';

        send.onclick = async () => {
            const t = ta.value.trim();
            if (!rating) return err.textContent = 'Please pick a star rating.';
            if (t.length < 10) return err.textContent = 'Please write at least 10 characters.';
            if (!editing && Date.now() - last < 15000) return err.textContent = 'Please wait a few seconds before posting again.';

            send.disabled = true;
            err.textContent = '';

            try {
                const now = Date.now(); // Saved clean Unix Timestamp integer in milliseconds

                if (editing) {
                    await editing.ref.update({
                        rating: rating,
                        text: t,
                        updatedAt: now
                    });
                } else {
                    const cref = a.db.collection('r').doc('0');
                    await a.db.runTransaction(async tx => {
                        const cs = await tx.get(cref);
                        const n = (cs.exists ? cs.data().n : 0) + 1;
                        tx.set(cref, { n });
                        tx.set(a.db.collection('r').doc(String(n)), {
                            authorId: a.user.uid,
                            rating: rating,
                            text: t,
                            createdAt: now
                        });
                    });
                    last = Date.now();
                }

                a.toast(editing ? '✅ Review updated' : '🌟 Thank you for your review!');
                editing = null;
                load();
            } catch (e) {
                err.textContent = e.code === 'permission-denied'
                    ? 'Not allowed. Check firestore.rules is published.'
                    : e.message;
            }
            send.disabled = false;
        };

        acts.append(send);
        if (editing) {
            const c = el('button', 'btn-outline', 'Cancel');
            c.type = 'button';
            c.onclick = () => { editing = null; form(); };
            acts.append(c);
        }

        box.append(row, mood, ta, cnt, err, acts);
        w.append(box);
    }

    window.addEventListener('authchange', () => { editing = null; load(); });
    load();
})();
