const express = require('express');
const router = express.Router();
const maps = require('../src/controllers/maps');

/* GET users listing. */
router.get('/geocode', maps.geocode);

module.exports = router;
