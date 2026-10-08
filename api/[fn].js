/* One Vercel serverless function for /api/plans, /api/pay and /api/status. Secrets come from Vercel Environment Variables, never from the repo. */
const { randomBytes } = require('crypto');
const FIREBASE_API_KEY = 'AIzaSyCHWrBA5nuYOopFo8BmnkKLQMXCCOXfMdI'; // public web key, same as auth.js
const E = process.env;
const H = E.PHONEPE_LIVE === 'true'
    ? { auth: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token', api: 'https://api.phonepe.com/apis/pg/checkout/v2' }
    : { auth: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token', api: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2' };

// EDIT PRICES HERE. p = price in paise (5100 = Rs 51.00). Prices are enforced on the server only.
const PLANS = {
    tarot: { n: 'Tarot Reading', p: 5100 },
    kundli: { n: 'Kundli Reading', p: 110000 }
};

let tok = { t: '', e: 0 };
async function token() {
    if (tok.e - 60 > Date.now() / 1000) return tok.t;
    const r = await fetch(H.auth, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: E.PHONEPE_CLIENT_ID, client_version: E.PHONEPE_CLIENT_VERSION || '1', client_secret: E.PHONEPE_CLIENT_SECRET, grant_type: 'client_credentials' })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('PhonePe auth failed ' + r.status + ' ' + JSON.stringify(j));
    return (tok = { t: j.access_token, e: j.expires_at }).t;
}
async function pp(path, body) {
    const r = await fetch(H.api + path, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: 'O-Bearer ' + await token() },
        body: body && JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('PhonePe ' + path + ' ' + r.status + ' ' + JSON.stringify(j));
    return j;
}
// Who is calling? Verifies the Firebase login token with Google and returns the uid (or null).
async function uid(req) {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    if (!t) return null;
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: t })
    });
    const j = await r.json().catch(() => ({}));
    return (r.ok && j.users && j.users[0] && j.users[0].localId) || null;
}

const routes = {
    plans: (req, res) => res.json(Object.entries(PLANS).map(([k, v]) => ({ k, n: v.n, p: v.p }))),

    async pay(req, res) {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
        const u = await uid(req);
        if (!u) return res.status(401).json({ error: 'Please sign in first' });
        const k = req.body && req.body.plan, plan = PLANS[k];
        if (!plan) return res.status(400).json({ error: 'Unknown plan' });
        const id = u + '-' + randomBytes(5).toString('hex'), site = (req.headers['x-forwarded-proto'] || 'https') + '://' + (req.headers['x-forwarded-host'] || req.headers.host);
        const j = await pp('/pay', {
            merchantOrderId: id, amount: plan.p, expireAfter: 1800, metaInfo: { udf1: k },
            paymentFlow: { type: 'PG_CHECKOUT', message: plan.n, merchantUrls: { redirectUrl: site + '/pay.html?order=' + id } }
        });
        res.json({ url: j.redirectUrl });
    },

    async status(req, res) {
        const u = await uid(req), id = req.body && req.body.order;
        if (!u || typeof id !== 'string' || !id.startsWith(u + '-')) return res.status(403).json({ error: 'Not your order' });
        res.json({ state: (await pp('/order/' + encodeURIComponent(id) + '/status')).state });
    }
};
const errors = { pay: 'Payment error. Please try again.', status: 'Could not check payment' };

module.exports = async (req, res) => {
    const name = req.query.fn, fn = routes[name];
    if (!fn) return res.status(404).json({ error: 'Not found' });
    try { await fn(req, res); }
    catch (e) { console.error(e.message); res.status(500).json({ error: errors[name] || 'Server error' }); }
};
