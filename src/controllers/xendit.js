const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const Xendit = require('../services/payment/xendit');
const Invoice = require('../../models').invoices;
const Participant = require('../../models').participants;
const EventGroup = require('../../models').event_groups;
const INVOICE_PAYMENT_FOR = require('../../constants/invoicePaymentForConstant');
const { errorResponse, successResponse } = require('../../helpers/response');

exports.callback = async (req, res) => {
    try {
        const requestBody = req.body;
        const { id, status } = requestBody;

        const invoice = await serviceCrud.findOne(Invoice, {
            where: {
                gateway_reference_id: id,
                status: 0
            }
        });

        if (!invoice) {
            return res.status(403).json({
                message: 'Unable to find invoice data.'
            });
        }

        if (status == Xendit.XENDIT_EXPIRED) {
            await serviceCrud.delete(Invoice, {
                where: {
                    id: invoice.id
                }
            })
            return res.status(200).json({
                message: 'OK'
            });
        }

        if (status != Xendit.XENDIT_PAID) {
            return res.status(200).json({
                message: 'OK'
            });
        }
        
        if (invoice.payment_for == INVOICE_PAYMENT_FOR.GOOD &&
            !invoice.join_payload) {
            // Only update invoice status for merchant payment
            await serviceCrud.update(Invoice, {
                status: 1,
                gateway_res_payload: requestBody,
            }, {
                where: {
                    gateway_reference_id: id
                }
            });
            return res.status(200).json({
                message: 'OK'
            });
        }

        const eventGroup = await serviceCrud.findOne(EventGroup, {
            where: {
                id: invoice.join_payload.event_group_id
            }
        });

        if (!eventGroup) {
            return res.status(200).json({
                message: 'OK'
            });
        }

        let participant = await serviceCrud.findOne(Participant, {
            where: {
                user_id: invoice.user_id,
                event_id: invoice.join_payload.event_id,
                event_group_id: invoice.join_payload.event_group_id
            }
        });

        if (participant) {
            invoice.status = 1;
            invoice.gateway_res_payload = requestBody;
            invoice.save();

            return res.status(200).json({
                message: 'OK'
            });
        }

        participant = await serviceCrud.findOne(Participant, {
            attributes: ['participant_no'],
            where: {
                event_id: invoice.join_payload.event_id
            },
            order: [['createdAt', 'DESC']],
        });

        let participantNo = 0;
        if (participant) {
            participantNo = participant.participant_no.match(/[0-9]+/g);
        }

        const quota = parseInt(participantNo, 10) + 1;
        let participantNumber = '';
        switch (quota.toString().length) {
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
        
        participant = await serviceCrud.create(Participant, {
            participant_no: participantNumber,
            payment_status: 1,
            distance: 0,
            duration: 0,
            user_id: invoice.user_id,
            event_id: eventGroup.event_id,
            event_group_id: eventGroup.id
        });

        await serviceCrud.update(EventGroup, {
            remaining_quota: eventGroup.remaining_quota - 1
        }, {
            where: {
                id: eventGroup.id
            }
        });


        await serviceCrud.update(Invoice, {
            status: 1,
            gateway_res_payload: requestBody,
        }, {
            where: {
                gateway_reference_id: id
            }
        });

        return res.status(200).json({
            message: 'OK'
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json(errorResponse(error));
    }
}