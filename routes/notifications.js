const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');
const notifications = require('../src/controllers/notifications');

router.use(authenticate);
router.route('/single_receiver').post(notifications.singleReceiver)
router.route('/multi_receiver').post(notifications.multiReceiver)

module.exports = router;