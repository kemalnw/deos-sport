const Provinces = require('../../models').provinces;
const Regencies = require('../../models').regencies;
const { errorResponse } = require('../../helpers/response');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');

exports.provinces = async (req, res) => {
    try {
        const data = await serviceCrud.findAll(Provinces, {});

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.regencies = async (req, res) => {
    try {
        const province_id = req.params.id;

        const data = await serviceCrud.findAll(Regencies, {
            where: {
                province_id: province_id
            }
        });

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}