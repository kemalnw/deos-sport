const router = require('express').Router();
const eventGroups = require('../src/controllers/event_groups');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

router.use(authenticate);

router.route('/')
    .get(eventGroups.getAll)
    .post(authorized, eventGroups.create);

router.route('/warning').post(eventGroups.warning);

router.route('/:id')
    .get(eventGroups.get)
    .put(authorized, eventGroups.update)
    .delete(authorized, eventGroups.delete);

router.post('/join', eventGroups.join);

module.exports = router;