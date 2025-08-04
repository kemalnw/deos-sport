// Versi Original - Firebase Admin (From firebase gcp)
const admin = require('firebase-admin');
const config = require('../config/firebase').CONFIG

const app = admin.initializeApp({
    credential: admin.credential.cert(config),
});
const messaging = app.messaging();


exports.singleReceiver = async (message) => {
    try {
        // Example Message
        // const message = {
        //     token: 'ecEKgPV2Q7g:APA91bFMzbJ37KAW-9GpH3ybbl9hrqMcDFPjeC7dEVtPA_SQJauWnabLlQhCoJhmHBUh0gGkwCpEdslNaV-kmkFsteXlDmmaiYZxdhJcJDTEJuzvUMwnsHTrp89GQUS2aGCdWkIeupn4',
        //     notification: {
        //         title: "Hallo adip",
        //         body: "Single Receive"
        //     }
        // };
        const response = await messaging.send(message)

        console.log('SingleReceiver - Successfully sent message:');
        console.log(response)
    } catch (error) {
        console.log('SingleReceiver - Error sending message:');
        console.log(error)
    }
}

exports.multiReceiver = async (message) => {
    try {
        // Example Message
        // const message = {
        //     tokens: [
        //         'ecEKgPV2Q7g:APA91bFMzbJ37KAW-9GpH3ybbl9hrqMcDFPjeC7dEVtPA_SQJauWnabLlQhCoJhmHBUh0gGkwCpEdslNaV-kmkFsteXlDmmaiYZxdhJcJDTEJuzvUMwnsHTrp89GQUS2aGCdWkIeupn4',
        //         'ecEKgPV2Q7g:APA91bFMzbJ37KAW-9GpH3ybbl9hrqMcDFPjeC7dEVtPA_SQJauWnabLlQhCoJhmHBUh0gGkwCpEdslNaV-kmkFsteXlDmmaiYZxdhJcJDTEJuzvUMwnsHTrp89GQUS2aGCdWkIeupn4'
        //     ],
        //     notification: {
        //         title: "Hallo adip",
        //         body: "Multiple Receive"
        //     }
        // };
        const response = await messaging.sendMulticast(message)

        console.log('MultipleReceiver - Successfully sent message:');
        console.log(response)
    } catch (error) {
        console.log('MultipleReceiver - Error sending message:');
        console.log(error)
    }
}