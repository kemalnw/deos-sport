const router = require('express').Router();
const sponsors = require('../src/controllers/sponsors');
const sponsorItems = require('../src/controllers/sponsor_items');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

router.use(authenticate);

router.route('/')
    .get(sponsors.getAll)
    .post(authorized, sponsors.create);

router.route('/:id')
    .get(sponsors.get)
    .put(authorized, sponsors.update)
    .delete(authorized, sponsors.delete);

router.route('/:sponsor_id/items')
    .get(sponsorItems.getAll)
    .post(authorized, sponsorItems.create);

router.route('/:sponsor_id/items/:id')
    .get(sponsorItems.get)
    .put(authorized, sponsorItems.update)
    .delete(authorized, sponsorItems.delete);

module.exports = router;