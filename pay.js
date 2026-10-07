(() => {
    const $ = id => document.getElementById(id), A = () => window.Auth || {};
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
        A().toast(s === 'COMPLETED' ? '✅ Payment received! Now fill in your birth details in the booking form.' : s === 'PENDING' ? '⏳ Payment is still processing. Please check again in a minute.' : '❌ Payment failed. Please try again.');
        history.replaceState(null, '', location.pathname + '#pay');
    });
})();
