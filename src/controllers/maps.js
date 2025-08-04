const {Client, Status} = require("@googlemaps/google-maps-services-js");
const client = new Client({});
const gmapsApiKey = process.env.GMAPS_API_KEY;
const Sentry = require('@sentry/node');
const { errorResponse } = require('../../helpers/response');

exports.geocode = async (req, res) => {
    try {
        const location = await client.geocode({
            params: {
                address: 'Surakarta',
                key: gmapsApiKey
            },
            timeout: 1000
        })

        console.log(location);

        res.json(location.data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}