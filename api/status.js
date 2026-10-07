const { pp, uid } = require('../lib/pp');
module.exports = async (req, res) => {
    try {
        const u = await uid(req), id = req.body && req.body.order;
        if (!u || typeof id !== 'string' || !id.startsWith(u + '-')) return res.status(403).json({ error: 'Not your order' });
        res.json({ state: (await pp('/order/' + encodeURIComponent(id) + '/status')).state });
    } catch (e) { console.error(e.message); res.status(500).json({ error: 'Could not check payment' }); }
};
