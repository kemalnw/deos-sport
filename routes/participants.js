const router = require('express').Router();
const participants = require('../src/controllers/participants');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

router.use(authenticate);

router.route('/', authorized)
    .get(participants.getAll)
    .post(participants.create);

router.get('/approved_by', participants.approvedBy);
router.get('/criteria', participants.criteria);
router.get('/route', participants.route);
router.route('/:id/cheat').put(participants.updateIsCheat);
router.route('/:id/reschedule').post(participants.reschedule);
router.route('/:id')
    .get(participants.get)
    .put(participants.update)
    .delete(authorized, participants.delete);

router.post('/confirm_payment', participants.confirmPayment);
router.put('/approve_payment/:id', participants.approvePayment);

module.exports = router;