const SponsorItem = require('../../models').sponsor_items;
const { errorResponse } = require('../../helpers/response');
const { sort } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const Op = require('sequelize').Op;

exports.getAll = async (req, res) => {
    try {
        const sponsorId = req.params.sponsor_id;
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            keyword: req.query.keyword || '',
            sort: await sort(req.query.sort)
        };
        const query = {
            where: {
                sponsor_id: sponsorId,
                [Op.or]: [
                    { name: { [Op.like]: `%${params.keyword}%` } },
                    { description: { [Op.like]: `%${params.keyword}%` } },
                ]
            },
        }

        const count = await serviceCrud.count(SponsorItem, query);

        const paginate = await pagination(params.size, params.page, count, `/sponsors/${sponsorId}/items?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        const rows = await serviceCrud.findAll(SponsorItem, query);
        const data = await paginationResponse(count, paginate, rows);

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.get = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await serviceCrud.findOne(SponsorItem, {
            where: {
                id: id
            }
        });

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.create = async (req, res) => {
    try {
        const sponsor_id = req.params.sponsor_id;
        const { name, description, price, image, weight } = req.body;

        const data = await serviceCrud.create(SponsorItem, {
            name, description, price, image, sponsor_id, weight
        });

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, price, image, weight } = req.body;

        await serviceCrud.update(SponsorItem, {
            name, description, price, image, weight
        }, {
            where: {
                id: id
            }
        });

        res.json({ message: 'Success.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.delete = async (req, res) => {
    try {
        const id = req.params.id;

        await serviceCrud.delete(SponsorItem, {
            where: {
                id: id
            }
        })
        res.json({ message: 'Success.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}