const Sponsor = require('../../models').sponsors;
const SponsorItem = require('../../models').sponsor_items;
const Event = require('../../models').events;
const Company = require('../../models').company;
const { errorResponse } = require('../../helpers/response');
const { sort } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const Op = require('sequelize').Op;

exports.getAll = async (req, res) => {
    try {
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            keyword: req.query.keyword || '',
            sort: await sort(req.query.sort)
        };
        const by_event = req.query.by_event ? +req.query.by_event : null;
        const by_company = req.query.by_company ? +req.query.by_company : null;
        const by_type = req.query.by_type ? req.query.by_type : null;
        const query = {
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${params.keyword}%` } },
                    { description: { [Op.like]: `%${params.keyword}%` } },
                ]
            },
            include: [
                {
                    model: Event,
                    required: true
                }
            ],
        }

        if (by_event) {
            query.where.event_id = by_event;
        } else if (by_company) {
            query.where.company_id = by_company;
        }

        if (by_type !== null) {
            query.where.type = by_type;
        }
        const count = await serviceCrud.count(Sponsor, query);

        const paginate = await pagination(params.size, params.page, count, `/sponsors?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        const rows = await serviceCrud.findAll(Sponsor, query);
        for (const row of rows) {
            const item = await serviceCrud.count(SponsorItem, {
                where: {
                    sponsor_id: row.id
                }
            });
            row.setDataValue('has_product', item > 0 ? 1:0);
        }

        const data = await paginationResponse(count, paginate, rows);

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(err);
    }
}

exports.get = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await serviceCrud.findOne(Sponsor, {
            where: {
                id: id
            },
            include: [
                {
                    model: Event,
                    attributes: ['id', 'name'],
                    required: true
                },
                {
                    model: Company,
                    attributes: ['id', 'name'],
                    required: true,
                    include: ['province', 'regency']
                }
            ]
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
        const { name, description, type, banner, event_id, company_id } = req.body;

        const data = await serviceCrud.create(Sponsor, {
            name, description, type, banner, event_id, company_id
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
        const { name, description, type, banner, event_id, company_id } = req.body;

        await serviceCrud.update(Sponsor, {
            name, description, type, banner, event_id, company_id
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

        await serviceCrud.delete(Sponsor, {
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