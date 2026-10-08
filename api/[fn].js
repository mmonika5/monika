/* One Vercel serverless function: /api/plans /api/pay /api/status
   Secrets live in Vercel Environment Variables, never in the repo. */
const FIREBASE_API_KEY = 'AIzaSyCHWrBA5nuYOopFo8BmnkKLQMXCCOXfMdI'; // public web key, same as auth.js
const E = process.env;
const H = E.PHONEPE_LIVE === 'true'
    ? { auth: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token', api: 'https://api.phonepe.com/apis/pg/checkout/v2' }
    : { auth: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token', api: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2' };

// EDIT PRICES HERE. p = price in paise (5100 = Rs 51.00). Prices are enforced on the server only.
// If you change a price here, change the same number in firestore.rules (function price) too.
const PLANS = {
    ask: { n: 'Ask Any 1 Question', p: 5100, q: 1 }, // q: 1 = the buyer must type a question before paying
    kundli: { n: 'Kundli Reading', p: 110000 }
};
const fail = (res, code, msg) => res.status(code).json({ error: msg });

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
    plans: (req, res) => res.json(Object.entries(PLANS).map(([k, v]) => ({ k, n: v.n, p: v.p, q: v.q ? 1 : 0 }))),

    // The site creates the order record first (o/{id}) and sends its id here. The id must start with the buyer's uid.
    async pay(req, res) {
        if (req.method !== 'POST') return fail(res, 405, 'POST only');
        const u = await uid(req);
        if (!u) return fail(res, 401, 'Please sign in first');
        const k = req.body && req.body.plan, plan = PLANS[k], id = req.body && req.body.id;
        if (!plan) return fail(res, 400, 'Unknown plan');
        if (typeof id !== 'string' || !id.startsWith(u + '-') || !/^[\w-]{6,63}$/.test(id)) return fail(res, 400, 'Bad order id');
        const site = (req.headers['x-forwarded-proto'] || 'https') + '://' + (req.headers['x-forwarded-host'] || req.headers.host);
        const j = await pp('/pay', {
            merchantOrderId: id, amount: plan.p, expireAfter: 1800, metaInfo: { udf1: k },
            paymentFlow: { type: 'PG_CHECKOUT', message: plan.n, merchantUrls: { redirectUrl: site + '/pay.html?order=' + id } }
        });
        res.json({ url: j.redirectUrl });
    },

    // Real payment state straight from PhonePe (only for your own orders)
    async status(req, res) {
        const u = await uid(req), id = req.body && req.body.order;
        if (!u || typeof id !== 'string' || !id.startsWith(u + '-')) return fail(res, 403, 'Not your order');
        res.json({ state: (await pp('/order/' + encodeURIComponent(id) + '/status')).state });
    }
};
const errors = { pay: 'Payment error. Please try again.', status: 'Could not check payment' };

module.exports = async (req, res) => {
    const name = req.query.fn, fn = routes[name];
    if (!fn) return fail(res, 404, 'Not found');
    try { await fn(req, res); }
    catch (e) { console.error(e.message); if (!res.headersSent) fail(res, 500, errors[name] || 'Server error'); }
};
