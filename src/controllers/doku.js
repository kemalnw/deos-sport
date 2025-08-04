const User = require('../../models').users;
const Cart = require('../../models').carts;
const Sponsor = require('../../models').sponsors;
const Provinces = require('../../models').provinces;
const Regencies = require('../../models').regencies;
const Invoice = require('../../models').invoices;
const InvoiceItem = require('../../models').invoice_items;
const Participant = require('../../models').participants;
const Event = require('../../models').events;
const EventGroup = require('../../models').event_groups;

const { errorResponse } = require('../../helpers/response');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const doku = require('../../helpers/doku');
const sequelize = require('sequelize');
const generateInvoice = require('../../helpers/invoice').generate;
const INVOICE_PAYMENT_FOR = require('../../constants/invoicePaymentForConstant');
const DOKU_PAYMENT_CHANNEL = require('../../constants/dokuPaymentChannelConstant');

exports.paymentRequest = async (req, res) => {
    try {
        const date = new Date();
        const { sponsor_id, delivery_name, delivery_phone, delivery_address, delivery_fee, courier } = req.body;

        const user = await serviceCrud.findOne(User, {
            where: {
                id: req.loggedInUser.id
            },
            include: ['province', 'regency']
        });

        const sponsor = await serviceCrud.findOne(Sponsor, {
            where: {
                id: sponsor_id
            },
            include: [
                {
                    model: Cart,
                    where: {
                        user_id: user.id
                    },
                    required: true
                },
            ]
        });

        let total = await serviceCrud.findAll(Cart, {
            attributes: [[sequelize.literal('SUM(price * qty)'), 'result_price']],
            where: {
                user_id: user.id,
                sponsor_id: sponsor.id
            }
        });
        total = parseInt(total[0].dataValues.result_price);

        const invoiceCode = await generateInvoice(date);
        const payloadInvoice = {
            invoice_no: invoiceCode,
            delivery_name: delivery_name,
            delivery_phone: delivery_phone,
            delivery_address: delivery_address,
            delivery_fee: delivery_fee,
            sub_total: total,
            total_price: total + delivery_fee,
            status: 0,
            courier: courier,
            user_id: user.id,
            company_id: sponsor.company_id
        };
        const invoice = await serviceCrud.create(Invoice, payloadInvoice);

        const payloadInvoiceItem = []
        const baskets = [];
        for (const cart of sponsor.carts) {
            const invoiceItem = {
                name: cart.name,
                price: cart.price,
                qty: cart.qty,
                invoice_id: invoice.id,
                sponsor_id: cart.sponsor_id,
                sponsor_item_id: cart.sponsor_item_id
            }
            const basket = {
                name: cart.name,
                price: cart.price.toFixed(2),
                qty: cart.qty,
                total: cart.total.toFixed(2)
            }
            payloadInvoiceItem.push(invoiceItem);
            baskets.push(basket);
        }
        const basket = baskets.map(d => {
            return Object.values(d).toString()
        }).join(';');
        await serviceCrud.bulkCreate(InvoiceItem, payloadInvoiceItem);

        await serviceCrud.delete(Cart, {
            where: {
                user_id: user.id,
                sponsor_id: sponsor.id
            }
        });

        const amount = total + delivery_fee;
        const payload = {
            user: user,
            transaction: {
                TRANSIDMERCHANT: invoice.invoice_no,
                AMOUNT: amount.toFixed(2),
                PURCHASEAMOUNT: amount.toFixed(2),
                BASKET: basket
            }
        }
        const payloadRequest = await doku.paymentRequest(payload);

        return res.render('doku/payment-request', payloadRequest);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.notify = async (req, res) => {
    try {
        const { RESPONSECODE, RESULTMSG, TRANSIDMERCHANT, PAYMENTCODE, PAYMENTCHANNEL } = req.body;

        // Get Invoice
        const invoice = await serviceCrud.findOne(Invoice, {
            where: { invoice_no: TRANSIDMERCHANT }
        });

        if (invoice) {
            // Update Invoice (res_doku_notify)
            if (req.body) {
                const payload = {
                    res_doku_notify: req.body
                }
                if (PAYMENTCODE && PAYMENTCHANNEL) {
                    payload.doku_payment_code = PAYMENTCODE
                    payload.doku_payment_bank = DOKU_PAYMENT_CHANNEL[PAYMENTCHANNEL]
                }

                await serviceCrud.update(Invoice, payload, {
                    where: {
                        invoice_no: TRANSIDMERCHANT
                    }
                });
            }

            if (RESPONSECODE === '0000' && RESULTMSG === 'SUCCESS') {
                if (invoice.payment_for === INVOICE_PAYMENT_FOR.EVENT) {
                    // is Already Join (because like watch)
                    const userJoined = await serviceCrud.findOne(Participant, {
                        where: {
                            user_id: invoice.user_id,
                            event_id: invoice.join_payload.event_group_id
                        }
                    });

                    if (userJoined == null) {
                        // Get Event Group
                        const eventGroup = await serviceCrud.findOne(EventGroup, {
                            where: {
                                id: invoice.join_payload.event_group_id
                            }
                        });

                        // Init Participant
                        const lastParticipant = await serviceCrud.findOne(Participant, {
                            attributes: ['participant_no'],
                            where: {
                                event_id: invoice.join_payload.event_id
                            },
                            order: [['createdAt', 'DESC']],
                        });

                        let participantNo;
                        if (lastParticipant) {
                            const numberPattern = /[0-9]+/g;
                            participantNo = lastParticipant.participant_no.match(numberPattern);
                        }
                        else {
                            participantNo = 0;
                        }

                        const quota = parseInt(participantNo, 10) + 1;
                        const quotaLength = quota.toString().length;
                        let participantNumber;
                        switch (quotaLength) {
                            case 1:
                                participantNumber = '000' + quota.toString();
                                break;
                            case 2:
                                participantNumber = '00' + quota.toString();
                                break;
                            case 3:
                                participantNumber = '0' + quota.toString();
                                break;
                            default:
                                participantNumber = quota.toString();
                                break;
                        }

                        // Create Participant
                        const participant = await serviceCrud.create(Participant, {
                            participant_no: participantNumber,
                            payment_status: 1,
                            distance: 0,
                            duration: 0,
                            user_id: invoice.user_id,
                            event_id: invoice.join_payload.event_id,
                            event_group_id: invoice.join_payload.event_group_id,
                        });

                        // Update Event Group
                        await serviceCrud.update(EventGroup,
                            {
                                remaining_quota: eventGroup.remaining_quota - 1
                            },
                            {
                                where: {
                                    id: invoice.join_payload.event_group_id
                                }
                            });

                        // Update Invoice (status, participant_id)
                        await serviceCrud.update(Invoice, {
                            status: 1,
                            participant_id: participant.id
                        }, {
                            where: {
                                invoice_no: TRANSIDMERCHANT,
                            }
                        });
                    } else {
                        // Update Invoice (status)
                        await serviceCrud.update(Invoice, {
                            status: 1
                        }, {
                            where: {
                                invoice_no: TRANSIDMERCHANT
                            }
                        });
                    }
                }
                else {
                    // Update Invoice (status)
                    await serviceCrud.update(Invoice, {
                        status: 1
                    }, {
                        where: {
                            invoice_no: TRANSIDMERCHANT
                        }
                    });
                }
            }
        }
        res.send('CONTINUE');
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.identify = async (req, res) => {
    try {
        const { AMOUNT, TRANSIDMERCHANT, PAYMENTCHANNEL, SESSIONID } = req.body;

        if (req.body && TRANSIDMERCHANT) {
            await serviceCrud.update(Invoice,
                { res_doku_identify: req.body },
                {
                    where: {
                        invoice_no: TRANSIDMERCHANT
                    }
                })
        }
        
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

exports.redirect = async (req, res) => {
    try {
        const { RESPONSECODE, RESULTMSG, TRANSIDMERCHANT, PAYMENTCODE, PAYMENTCHANNEL } = req.body;

        // Get Invoice
        const invoice = await serviceCrud.findOne(Invoice, {
            where: { invoice_no: TRANSIDMERCHANT }
        });

        if (invoice) {
            // Update Invoice (res_doku_redirect)
            if (req.body) {
                const payload = {
                    res_doku_redirect: req.body
                }
                if ((!invoice.doku_payment_code || !invoice.doku_payment_bank) && (PAYMENTCODE && PAYMENTCHANNEL)) {
                    payload.doku_payment_code = PAYMENTCODE
                    payload.doku_payment_bank = DOKU_PAYMENT_CHANNEL[PAYMENTCHANNEL]
                }

                await serviceCrud.update(Invoice, payload, {
                    where: {
                        invoice_no: TRANSIDMERCHANT
                    }
                });
            }

            if (RESPONSECODE === '0000' && RESULTMSG === 'SUCCESS') {
                if (invoice.payment_for === INVOICE_PAYMENT_FOR.EVENT) {
                    // is Already Join (because like watch)
                    const userJoined = await serviceCrud.findOne(Participant, {
                        where: {
                            user_id: invoice.user_id,
                            event_id: invoice.join_payload.event_group_id
                        }
                    });

                    if (userJoined == null) {
                        // Get Event Group
                        const eventGroup = await serviceCrud.findOne(EventGroup, {
                            where: {
                                id: invoice.join_payload.event_group_id
                            }
                        });

                        // Init Participant
                        const lastParticipant = await serviceCrud.findOne(Participant, {
                            attributes: ['participant_no'],
                            where: {
                                event_id: invoice.join_payload.event_id
                            },
                            order: [['createdAt', 'DESC']],
                        });

                        let participantNo;
                        if (lastParticipant) {
                            const numberPattern = /[0-9]+/g;
                            participantNo = lastParticipant.participant_no.match(numberPattern);
                        }
                        else {
                            participantNo = 0;
                        }

                        const quota = parseInt(participantNo, 10) + 1;
                        const quotaLength = quota.toString().length;
                        let participantNumber;
                        switch (quotaLength) {
                            case 1:
                                participantNumber = '000' + quota.toString();
                                break;
                            case 2:
                                participantNumber = '00' + quota.toString();
                                break;
                            case 3:
                                participantNumber = '0' + quota.toString();
                                break;
                            default:
                                participantNumber = quota.toString();
                                break;
                        }

                        // Create Participant
                        const participant = await serviceCrud.create(Participant, {
                            participant_no: participantNumber,
                            payment_status: 1,
                            distance: 0,
                            duration: 0,
                            user_id: invoice.user_id,
                            event_id: invoice.join_payload.event_id,
                            event_group_id: invoice.join_payload.event_group_id,
                        });

                        // Update Event Group
                        await serviceCrud.update(EventGroup,
                            {
                                remaining_quota: eventGroup.remaining_quota - 1
                            },
                            {
                                where: {
                                    id: invoice.join_payload.event_group_id
                                }
                            });

                        // Update Invoice (status, participant_id)
                        await serviceCrud.update(Invoice, {
                            status: 1,
                            participant_id: participant.id
                        }, {
                            where: {
                                invoice_no: TRANSIDMERCHANT,
                            }
                        });
                    } else {
                        // Update Invoice (status)
                        await serviceCrud.update(Invoice, {
                            status: 1
                        }, {
                            where: {
                                invoice_no: TRANSIDMERCHANT
                            }
                        });
                    }
                }
                else {
                    // Update Invoice (status)
                    await serviceCrud.update(Invoice, {
                        status: 1
                    }, {
                        where: {
                            invoice_no: TRANSIDMERCHANT
                        }
                    });
                }
            }
        }
        res.send('Tutup Browser Anda untuk kembali ke Aplikasi');
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}