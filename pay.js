const { randomBytes } = require('crypto');
const { PLANS, pp, uid } = require('../lib/pp');
module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
        const u = await uid(req);
        if (!u) return res.status(401).json({ error: 'Please sign in first' });
        const k = req.body && req.body.plan, plan = PLANS[k];
        if (!plan) return res.status(400).json({ error: 'Unknown plan' });
        const id = u + '-' + randomBytes(5).toString('hex'), site = (req.headers['x-forwarded-proto'] || 'https') + '://' + (req.headers['x-forwarded-host'] || req.headers.host);
        const j = await pp('/pay', {
            merchantOrderId: id, amount: plan.p, expireAfter: 1800, metaInfo: { udf1: k },
            paymentFlow: { type: 'PG_CHECKOUT', message: plan.n, merchantUrls: { redirectUrl: site + '/?order=' + id } }
        });
        res.json({ url: j.redirectUrl });
    } catch (e) { console.error(e.message); res.status(500).json({ error: 'Payment error. Please try again.' }); }
};
