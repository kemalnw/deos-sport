const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const doku = require('../src/controllers/doku');

// router.use(authenticate);
router.post('/payment_request', authenticate, doku.paymentRequest);
router.post('/notify', doku.notify);
router.post('/redirect', doku.redirect);
router.post('/identify', doku.identify);

module.exports = router;