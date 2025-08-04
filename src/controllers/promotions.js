const Promotion = require('../../models').promotions;
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

        const by_company = req.query.by_company ? +req.query.by_company : null;
        const query = {
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${params.keyword}%` } },
                    { description: { [Op.like]: `%${params.keyword}%` } },
                ]
            }
        }

        if (by_company) {
            query.where.company_id = by_company;
        }

        const count = await serviceCrud.count(Promotion, query);

        const paginate = await pagination(params.size, params.page, count, `/sponsors?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        const rows = await serviceCrud.findAll(Promotion, query);
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
        const data = await serviceCrud.findOne(Promotion, {
            where: {
                id: id
            },
            include: [
                {
                    model: Company,
                    attributes: ['id', 'name'],
                    required: true
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
        const { title, description, banner, company_id } = req.body;

        const data = await serviceCrud.create(Promotion, {
            title, description, banner, company_id
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
        const { title, description, banner, company_id } = req.body;

        await serviceCrud.update(Promotion, {
            title, description, banner, company_id
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

        await serviceCrud.delete(Promotion, {
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