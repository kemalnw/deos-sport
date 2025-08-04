const router = require('express').Router();
const organizations = require('../src/controllers/organizations');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

router.use(authenticate);

router.route('/')
    .get(organizations.getAll)
    .post(authorized, organizations.create);

router.route('/:id')
    .get(organizations.get)
    .put(authorized, organizations.update)
    .delete(authorized, organizations.delete);

module.exports = router;