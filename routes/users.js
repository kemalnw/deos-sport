const router = require('express').Router();
const users = require('../src/controllers/users');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');


router.use(authenticate);
router.get('/profile', users.me);
router.post('/profile', users.update);
router.post('/change_password', users.changePassword);
router.post('/register_token_fcm', users.registerTokenFcm);

router.post('/testUniqueCode', users.testUniqueCode);
router.post('/import-participant', users.importParticipant);

router.get('/', authorized, users.getAll);
router.route('/:id')
    .get(users.get)
    .put(users.update)
    .delete(users.delete);

module.exports = router;