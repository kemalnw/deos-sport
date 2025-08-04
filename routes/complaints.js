const router = require('express').Router();
const complaints = require('../src/controllers/complaints');
const authenticate = require('../middlewares/authenticate');

router.use(authenticate);

router.route('/')
    .get(complaints.getAll)
    .post(complaints.create);

router.post('/confirm', complaints.confirm);

router.route('/:id')
    .get(complaints.get)
    .put(complaints.update)
    .delete(complaints.delete);

module.exports = router;