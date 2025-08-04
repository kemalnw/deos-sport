const express = require('express');
const router = express.Router();
const transaction = require('../src/controllers/transactions');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

router.use(authenticate);

router.post('/checkout', transaction.checkout);
router.post('/check_delivery', transaction.checkDelivery);
router.post('/confirm', authorized, transaction.confirm);
router.post('/proof_payment', transaction.uploadProofPayment);
router.post('/receipt', authorized, transaction.updateReceiptNumber);

router.get('/', transaction.getAll);
router.get('/:id', transaction.get);

module.exports = router;
