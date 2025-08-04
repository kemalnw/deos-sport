const router = require('express').Router();
const companies = require('../src/controllers/companies');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

router.use(authenticate);

router.route('/')
    .get(companies.getAll)
    .post(authorized, companies.create);

router.route('/:id')
    .get(companies.get)
    .put(authorized, companies.update)
    .delete(authorized, companies.delete);

module.exports = router;