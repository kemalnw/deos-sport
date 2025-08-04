const { createHash } = require("crypto");
const Sentry = require('@sentry/node');

const storeId = process.env.DOKU_STORE_ID;
const sharedKey = process.env.DOKU_SHARED_KEY;
const urlDev = process.env.DOKU_URL_DEV || 'https://staging.doku.com';
const urlProd = process.env.DOKU_URL_PROD || 'https://pay.doku.com';
const isProd = process.env.DOKU_IS_PROD || false;
const url = isProd == true ? urlProd : urlDev;
const dayjs = require('dayjs');

exports.sha1 = function(data) {
    var generator = createHash("sha1");
    generator.update(data);
    return generator.digest("hex");
};

exports.randomString = (STRlen) => {
	const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	const string_length = STRlen;
	let randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}

	return randomstring;
}

exports.genInvoice = () => {	
	return this.randomString(12);
}

exports.genSessionID = () => {	
	return this.randomString(20);
}

exports.genBookingCode = () => {	
	return this.randomString(6);
}

exports.getWords = (amount, transId) => {
    // WORDS = sha1 (AMOUNT + MALLID + Shared Key + TRANSIDMERCHANT)
    const msg = amount + storeId + sharedKey + transId;
	return this.sha1(msg);
}

exports.paymentRequest = async (payload) => {
    try {
        const endpoint = '/Suite/Receive';
        const sessionId = this.genSessionID();
        // const invoiceId = this.genInvoice();
        const words = this.getWords(payload.transaction.AMOUNT, payload.transaction.TRANSIDMERCHANT)
        const now = dayjs().format('YYYYMMDDHHmmss');
        const userBirthdate = dayjs(payload.user.birth_date).format('YYYYMMDD');
        const payloadRequest = {
            MALLID: storeId, // required
            CHAINMERCHANT: 'NA', // required
            AMOUNT: payload.transaction.AMOUNT, // required
            PURCHASEAMOUNT: payload.transaction.PURCHASEAMOUNT, // required
            TRANSIDMERCHANT: payload.transaction.TRANSIDMERCHANT, // required
            WORDS: words, // required
            REQUESTDATETIME: now, // required
            CURRENCY: '360', // required
            PURCHASECURRENCY: '360', // required
            SESSIONID: sessionId, // required
            NAME: payload.user.name, // required
            EMAIL: payload.user.email, // required
            // BASKET = name, price, qty, sub_total;
            BASKET: payload.transaction.BASKET, // required
            ADDRESS: payload.user.address,
            CITY: payload.user.regency ? payload.user.regency.city : '',
            STATE: payload.user.province ? payload.user.province.province : '',
            COUNTRY: '360',
            PROVINCE: payload.user.province ? payload.user.province.province : '',
            MOBILEPHONE: payload.user.phone,
            BIRTHDATE: userBirthdate,
            URL: url + endpoint
            // PAYMENTTYPE: '',
            // SHIPPING_ADDRESS: '',
            // SHIPPING_CITY: '',
            // SHIPPING_STATE: '',
            // SHIPPING_COUNTRY: '',
            // SHIPPING_ZIPCODE: '',
            // PAYMENTCHANNEL: '',
            // ADDITIONALDATA: '',
            // ZIPCODE: '67153',
            // HOMEPHONE: '02123232323',
            // WORKPHONE: '0215150555',
        }

        return payloadRequest;
    }
    catch (err) {
        Sentry.captureException(err);
        return err;
    }
}

// belum kepake
exports.identify = async (payload) => {
    try {
        const payloadRequest = {
            AMOUNT: '',
            TRANSIDMERCHANT: '',
            PAYMENTCHANNEL: '',
            SESSIONID: '',
        }

        return payloadRequest;
    }
    catch (err) {
        Sentry.captureException(err);
        return err;
    }
}

// belum kepake
exports.notify = async (payload) => {
    try {
        if (payload.RESULTMSG === 'SUCCESS') {

        }
        const payloadRequest = {
            AMOUNT: '',
            TRANSIDMERCHANT: '',
            WORDS: '',
            STATUSTYPE: '',
            RESPONSECODE: '',
            APPROVALCODE: '',
            RESULTMSG: '',
            PAYMENTCHANNEL: '',
            PAYMENTCODE: '',
            SESSIONID: '',
            BANK: '',
            MCN: '',
            PAYMENTDATEANDTIME: '',
            VERIFYID: '',
            VERIFYSCORE: '',
            VERIFYSTATUS: '',
            CURRENCY: '',
            PURCHASECURRENCY: '',
            BRAND: '',
            CHNAME: '',
            THREEDSECURESTATUS: '',
            LIABILITY: '',
            EDUSTATUS: '',
            CUSTOMERID: '',
            TOKENID: ''
        }

        return 'CONTINUE';
    }
    catch (err) {
        Sentry.captureException(err);
        return err;
    }
}