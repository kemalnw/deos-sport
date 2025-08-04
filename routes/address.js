const express = require('express');
const router = express.Router();
const address = require('../src/controllers/address');

router.get('/provinces', address.provinces);
router.get('/regencies/:id', address.regencies);

module.exports = router;
