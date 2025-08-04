require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const cors = require('cors')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const Sentry = require('@sentry/node');

const schedule = require('./helpers/cronJob');
schedule()

const indexRouter = require('./routes/index');
const mapsRouter = require('./routes/maps');
const userRouter = require('./routes/users');
const organizationRouter = require('./routes/organizations');
const eventRouter = require('./routes/events');
const eventGroupRouter = require('./routes/event_groups');
const addressRouter = require('./routes/address');
const participantRouter = require('./routes/participants');
const companyRouter = require('./routes/companies');
const cartRouter = require('./routes/carts');
const sponsorRouter = require('./routes/sponsors');
const transactionRouter = require('./routes/transactions');
const promotionRouter = require('./routes/promotions');
const dokuRouter = require('./routes/doku');
const complaintRouter = require('./routes/complaints');
const notificationRouter = require('./routes/notifications');
const callbackPaymentRouter = require('./routes/callback_payment');
const app = express();

app.use(cors());

Sentry.init({ dsn: 'https://9066bc0d4e5e4dc183b3beb574520dfb@o398802.ingest.sentry.io/5255001' });

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/maps', mapsRouter);
app.use('/users', userRouter);
app.use('/organizations', organizationRouter);
app.use('/events', eventRouter);
app.use('/event_groups', eventGroupRouter);
app.use('/address', addressRouter);
app.use('/participants', participantRouter);
app.use('/companies', companyRouter);
app.use('/carts', cartRouter);
app.use('/sponsors', sponsorRouter);
app.use('/transactions', transactionRouter);
app.use('/promotions', promotionRouter);
app.use('/doku', dokuRouter);
app.use('/complaints', complaintRouter);
app.use('/notifications', notificationRouter);
app.use('/receptor/callback/payment', callbackPaymentRouter);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

// catch 404 and forward to error controllers
app.use(function (req, res, next) {
  // next(createError(404));
  res.status(404).json({ message: 'route not found.' });
});

// error controllers
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

module.exports = app;
