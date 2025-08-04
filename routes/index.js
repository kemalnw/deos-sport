const express = require('express');
const router = express.Router();
const users = require('../src/controllers/users');
const events = require('../src/controllers/events');
const uploader = require('../src/controllers/uploader');
const exporter = require('../src/controllers/exporter.js');
const authenticate = require('../middlewares/authenticate');
const authorized = require('../middlewares/authorized');

// Hanya Set allowedRoles
const memberOnly = require('../middlewares/member-only');
const adminOnly = require('../middlewares/admin-only');


// upload middleware
const multer = require('multer');
const storage = multer.diskStorage({
  destination: 'public/images/',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('index', { title: 'Express' });
  res.json({ message: 'Hello, World!' });
});

router.post('/signup', upload.single('photo'), users.signUp);
// router.post('/signUpSpecial', upload.single('photo'), users.signUpSpecial);
router.post('/signin-admin', adminOnly, users.signIn);
router.post('/signin', memberOnly, users.signIn);
router.post('/forget_password', users.forgetPassword);

router.get('/me', authenticate, users.me);
router.post('/uploader', authenticate, upload.single('file'), uploader.aws);

router.get('/export/excel/:table', authenticate, authorized, exporter.excel);

// router.post('/fix_participant', authenticate, events.fixParticipantNo);

module.exports = router;
