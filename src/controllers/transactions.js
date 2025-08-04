const { errorResponse, successResponse } = require('../../helpers/response');
const { sort } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const Xendit = require('../services/payment/xendit');
const generateInvoice = require('../../helpers/invoice').generate;
const Invoice = require('../../models').invoices;
const InvoiceItem = require('../../models').invoice_items;
const Cart = require('../../models').carts;
const User = require('../../models').users;
const Province = require('../../models').provinces;
const Regency = require('../../models').regencies;
const Sponsor = require('../../models').sponsors;
const Company = require('../../models').company;
const SponsorItem = require('../../models').sponsor_items;
const sequelize = require('sequelize');
const Axios = require('axios');
const qs = require('querystring');
const Op = require('sequelize').Op;
const ROLE_CONSTANT = require('../../constants/roleConstant');
const INVOICE_PAYMENT_FOR = require('../../constants/invoicePaymentForConstant');

exports.getAll = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            sort: await sort(req.query.sort),
            // search: req.query.search ? JSON.parse(req.query.search) : null,
            keyword: req.query.keyword ? req.query.keyword : ''
        };
        const by_company = req.query.by_company ? +req.query.by_company : null;
        const by_payment_for = req.query.by_payment_for || null;
        let query = {
            attributes: {
                exclude: ['req_doku_receive', 'res_doku_notify', 'res_doku_redirect', 'gateway_res_payload']
            },
            where: {
                [Op.or]: [
                    { invoice_no: { [Op.like]: `%${params.keyword}%` } },
                    { delivery_name: { [Op.like]: `%${params.keyword}%` } },
                    { delivery_address: { [Op.like]: `%${params.keyword}%` } },
                    { status: { [Op.like]: `%${params.keyword}%` } },
                ],
            },
        }

        if (by_company) {
            query.where.company_id = by_company;
        }
        if (by_payment_for !== null) {
            query.where.payment_for = by_payment_for;
        }

        // jika yang request user biasa tampilkan berdasar id user
        if (user.role_id === ROLE_CONSTANT.MEMBER) {
            query.where.user_id = user.id
        }

        const count = await serviceCrud.count(Invoice, query);
        const paginate = await pagination(params.size, params.page, count, `/transactions?`);

        query.include = [
            {
                model: InvoiceItem,
                attributes: ['id', 'name', 'price', 'qty', 'sponsor_id'],
                include: [
                    {
                        model: Sponsor,
                    }
                ]
            },
        ]
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        let rows = await serviceCrud.findAll(Invoice, query);
        // const data = await paginationResponse(count, paginate, rows);

        rows = rows.map(function(item) { 
            item.setDataValue('invoice_url', item.gateway_req_payload.invoice_url);
            item.setDataValue('gateway_req_payload', undefined); 
            return item; 
        });

        res.json(rows);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.get = async (req, res) => {
    try {
        const id = req.params.id;
        const invoice = await serviceCrud.findOne(Invoice, {
            where: { id },
        });

        const data = await serviceCrud.findOne(Invoice, {
            where: { id },
            include: [
                {
                    model: Company,
                    required: invoice.payment_for === INVOICE_PAYMENT_FOR.GOOD ? true : false,
                },
                {
                    model: User,
                    attributes: ['id', 'name', 'email', 'phone', 'path_photo', 'gender'],
                    required: true,
                    include: [Province, Regency]
                },
                {
                    model: InvoiceItem,
                    required: invoice.payment_for === INVOICE_PAYMENT_FOR.GOOD ? true : false,
                    include: [SponsorItem]
                },
            ],
        });

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.checkout = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const {
            sponsors,
            city_id,
            delivery_phone,
            delivery_name,
            delivery_address
        } = req.body;

        const invoices = [];
        let totalPrice = 0;
        for (const merchant of sponsors) {
            const carts = await serviceCrud.findAll(Cart, {
                where: {
                    id: merchant.cart_ids,
                    sponsor_id: merchant.id
                },
                include: [
                    {
                        model: Sponsor,
                        required: true
                    },
                ]
            });
            
            if (!carts.length) {
                continue;
            }

            const subTotal = carts.reduce((_total, {total} ) => _total + total , 0);
            
            // Increase total invoice amount
            totalPrice += subTotal + merchant.delivery_fee;

            const sponsor = await serviceCrud.findOne(Sponsor, {
                attributes: ['company_id'],
                where: {
                    id: merchant.id
                }
            });
            const invoiceNumber = await generateInvoice(new Date());
            const invoice = await serviceCrud.create(Invoice, {
                invoice_no: invoiceNumber,
                delivery_name: delivery_name,
                delivery_phone: delivery_phone,
                delivery_address: delivery_address,
                delivery_fee: merchant.delivery_fee,
                sub_total: subTotal,
                total_price: subTotal + merchant.delivery_fee,
                status: 0,
                courier: merchant.courier_code + ' - ' + merchant.courier_service,
                user_id: user.id,
                company_id: sponsor.company_id,
            });

            const items = [];
            for (const cart of carts) {
                items.push({
                    name: cart.name,
                    price: cart.price,
                    qty: cart.qty,
                    invoice_id: invoice.id,
                    sponsor_id: cart.sponsor_id,
                    sponsor_item_id: cart.sponsor_item_id
                });
            }

            await serviceCrud.bulkCreate(InvoiceItem, items);
            await serviceCrud.delete(Cart, {
                where: {
                    id: merchant.cart_ids
                }
            });
            invoices.push(invoice);
        }

        if (!invoices.length) {
            return res.json(errorResponse({
                message: 'Nothing to pay.'
            }));
        }

        const xendit = await Xendit.createInvoice({
            invoiceID: invoices[invoices.length - 1].invoice_no,
            email: user.email,
            amount: totalPrice.toString()
        });

        const _invoices = [];
        for (const invoice of invoices) {
            invoice.gateway_reference_id = xendit.id;
            invoice.gateway_req_payload = xendit;
            invoice.save();

            _invoices.push({
                id: invoice.id,
                invoice_no: invoice.invoice_no,
                sub_total: invoice.sub_total,
                total_price: invoice.total_price,
                status: invoice.status,
            });
        };

        return res.json(
            successResponse('Successful place an order', {
                invoices: _invoices,
                invoice_url: xendit.invoice_url,
                amount: xendit.amount,
                currency: xendit.currency
            })
        );
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.checkDelivery = async (req, res) => {
    try {
        const { origin, destination, weight, courier } = req.body;
        const config = {
            method: 'post',
            url: `${process.env.RAJAONGKIR_URL}/starter/cost`,
            headers: {
                key: process.env.RAJAONGKIR_KEY,
                'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
            data: qs.stringify({
                origin: origin, // static city_id palembang 
                destination: destination,
                weight: weight,
                courier: courier
            })
        }
        const rajaongkir = await Axios.request(config);

        res.json(rajaongkir.data.rajaongkir);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.confirm = async (req, res) => {
    try {
        const { transaction_id, status } = req.body;

        await serviceCrud.update(Invoice, { status }, {
            where: {
                id: transaction_id
            }
        });

        res.json({ message: 'Pembayaran berhasil dikonfirmasi.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.uploadProofPayment = async (req, res) => {
    try {
        const { transaction_id, proof_payment } = req.body;

        await serviceCrud.update(Invoice, { proof_payment }, {
            where: {
                id: transaction_id
            }
        });

        res.json({ message: 'Menunggu konfirmasi pembayaran.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.updateReceiptNumber = async (req, res) => {
    try {
        const { transaction_id, receipt_number } = req.body;

        await serviceCrud.update(Invoice, { receipt_number }, {
            where: {
                id: transaction_id
            }
        });

        res.json({ message: 'Success.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}