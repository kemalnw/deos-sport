const Company = require('../../models').company;
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
            keyword: req.query.keyword || '',
            sort: await sort(req.query.sort)
        };
        const query = {
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${params.keyword}%` } },
                    { pic: { [Op.like]: `%${params.keyword}%` } },
                    { phone: { [Op.like]: `%${params.keyword}%` } },
                    { email: { [Op.like]: `%${params.keyword}%` } },
                ]
            },
            include: ['province', 'regency']
        }

        const count = await serviceCrud.count(Company, query);
        const paginate = await pagination(params.size, params.page, count, `/companies?`);

        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        const rows = await serviceCrud.findAll(Company, query);
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
        const data = await serviceCrud.findOne(Company, {
            where: {
                id: id
            },
            include: ['province', 'regency']
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
        const {
            name, pic, phone, email, logo, province_id, regency_id,
            is_expedition, local_delivery_fee,
            bank_acc, bank_acc_no, bank_acc_name
        } = req.body;

        const data = await serviceCrud.create(Company, {
            name, pic, phone, email, logo, province_id, regency_id,
            is_expedition, local_delivery_fee,
            bank_acc, bank_acc_no, bank_acc_name
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
        const {
            name, pic, phone, email, logo, province_id, regency_id,
            is_expedition, local_delivery_fee,
            bank_acc, bank_acc_no, bank_acc_name
        } = req.body;

        await serviceCrud.update(Company, {
            name, pic, phone, email, logo, province_id, regency_id,
            is_expedition, local_delivery_fee,
            bank_acc, bank_acc_no, bank_acc_name
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
                company_id: id
            }
        });

        if (admins.length > 0) {
            return res.status(422).json({
                message: `Can't delete company.`
            });
        }

        await serviceCrud.delete(Company, {
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