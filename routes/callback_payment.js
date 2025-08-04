const router = require('express').Router();
const xendit = require('../src/controllers/xendit');

router.post('/xendit', (req, res, next) => {
    const token = req.headers['x-callback-token'];

    if (token !== process.env.XENDIT_CALLBACK_TOKEN) {
        return res.status(401).json({ message: "No token provided." });
    }

    return next();
}, xendit.callback);

module.exports = router;