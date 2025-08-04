const Cart = require('../../models').carts;
const Sponsor = require('../../models').sponsors;
const Company = require('../../models').company;
const { errorResponse } = require('../../helpers/response');
const { sort, sum } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const sequelize = require('../../models/index').sequelize;

exports.getAll = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            keyword: req.query.keyword || '',
            sort: await sort(req.query.sort),
            by_sponsor: req.query.by_sponsor || null
        };

        const queryCart = {
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('sponsor_id')), 'sponsor_id'],
            ],
            where: {
                user_id: user.id
            },
        }

        if (params.by_sponsor) {
            queryCart.where.sponsor_id = params.by_sponsor;
        }

        const carts = await serviceCrud.findAll(Cart, queryCart);
        const listSponsorId = [];

        for (const cart of carts) {
            listSponsorId.push(cart.sponsor_id);
        }

        const queryCountSponsor = {
            where: {
                id: listSponsorId
            }
        }

        const count = await serviceCrud.count(Sponsor, queryCountSponsor);
        const paginate = await pagination(params.size, params.page, count, `/carts?`);
        const querySponsor = {
            where: {
                id: listSponsorId
            },
            limit: paginate.size,
            offset: paginate.skip,
            order: params.sort,
            include: [
                {
                    model: Company,
                    required: true
                },
                {
                    model: Cart,
                    where: {
                        user_id: user.id
                    },
                    required: true,
                    include: ['sponsor_item']
                },
            ],
        }
        const rows = await serviceCrud.findAll(Sponsor, querySponsor);
        for(const row of rows) {
            const subTotal = await sum(row.carts, 'total');
            row.setDataValue('sub_total', subTotal);
        }
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
        const data = await serviceCrud.findOne(Cart, {
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
        const user = req.loggedInUser;
        const user_id = user.id;
        const { name, price, qty, sponsor_item_id, sponsor_id } = req.body;

        const cart = await serviceCrud.findOne(Cart, {
            where: {
                user_id: user_id,
                sponsor_item_id,
                sponsor_id
            }
        });

        if (cart) {
            await serviceCrud.update(Cart, {
                name: name,
                price: price,
                qty: parseInt(qty) + parseInt(cart.qty)
            }, {
                where: {
                    user_id: user_id,
                    sponsor_item_id,
                    sponsor_id
                }
            });

            var data = await serviceCrud.findOne(Cart, {
                where: {
                    user_id: user_id,
                    sponsor_item_id,
                    sponsor_id
                }
            });
        }
        else {
            var data = await serviceCrud.create(Cart, {
                name, price, qty, sponsor_item_id, sponsor_id, user_id
            });
        }

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.update = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const user_id = user.id;
        const id = req.params.id;
        const { name, price, qty, sponsor_item_id, sponsor_id } = req.body;

        await serviceCrud.update(Cart, {
            name, price, qty, sponsor_item_id, sponsor_id, user_id
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

        await serviceCrud.delete(Cart, {
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

