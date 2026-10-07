const { PLANS } = require('../lib/pp');
module.exports = (req, res) => res.json(Object.entries(PLANS).map(([k, v]) => ({ k, n: v.n, p: v.p })));
