const router = require('express').Router();
const promotions = require('../src/controllers/promotions');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

router.use(authenticate);

router.route('/')
    .get(promotions.getAll)
    .post(authorized, promotions.create);

router.route('/:id')
    .get(promotions.get)
    .put(authorized, promotions.update)
    .delete(authorized, promotions.delete);

module.exports = router;