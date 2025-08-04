const router = require('express').Router();
const carts = require('../src/controllers/carts');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);

router.route('/')
    .get(carts.getAll)
    .post(carts.create);

router.route('/:id')
    .get(carts.get)
    .put(carts.update)
    .delete(carts.delete);

module.exports = router;