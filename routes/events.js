const router = require('express').Router();
const events = require('../src/controllers/events');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');
// upload middleware
const multer = require('multer');
const storage = multer.diskStorage({
    destination: 'public/images/',
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

router.use(authenticate);

router.get('/ranking', events.getRanking);
router.post('/join_paid_event', events.joinPaidEvent);
router.post('/join', events.join);
router.post('/ranking', events.ranking);
router.post('/distance_count', events.distanceCount);
router.post('/publish_ranking', events.publishRanking);
router.post('/reset_ranking', events.resetRanking);
router.post('/ranking_count', events.rankingCount);
router.post('/finish', events.finish);

router.route('/')
    .get(events.getAll)
    .post(authorized, upload.single('photo'), events.create);

router.route('/:id')
    .get(events.get)
    .put(authorized, events.update)
    .delete(authorized, events.delete);

module.exports = router;