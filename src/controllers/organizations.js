const Organization = require('../../models').organizations;
const User = require('../../models').users;
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
            search: req.query.search ? JSON.parse(req.query.search) : null,
            sort: await sort(req.query.sort)
        };
        const keyword = req.query.keyword ? req.query.keyword : '';
        const query = {
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { phone: { [Op.like]: `%${keyword}%` } },
                    { email: { [Op.like]: `%${keyword}%` } },
                ]
            },
        }

        const count = await serviceCrud.count(Organization, query);
        const paginate = await pagination(params.size, params.page, count, `/organizations?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        const rows = await serviceCrud.findAll(Organization, query);
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
        const data = await serviceCrud.findOne(Organization, {
            where: {
                id: id
            },
            include: ['user']
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
        const { name, email, pic, phone } = req.body;

        const data = await serviceCrud.create(Organization, {
            name, email, pic, phone
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
        const { name, email, pic, phone } = req.body;

        await serviceCrud.update(Organization, {
            name, email, pic, phone
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

        // find admins
        const admins = await serviceCrud.findAll(User, {
            where: {
                organization_id: id
            }
        });

        if (admins.length > 0) {
            return res.status(422).json({
                message: `Can't delete organization.`
            });
        }

        await serviceCrud.delete(Organization, {
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