const _ = require('lodash');
const Event = require('../../models').events;
const EventGroup = require('../../models').event_groups;
const Participant = require('../../models').participants;
const Sponsor = require('../../models').sponsors;
const SponsorItem = require('../../models').sponsor_items;
const ParticipantRoute = require('../../models').participant_routes;
const User = require('../../models').users;
const Province = require('../../models').provinces;
const Regency = require('../../models').regencies;
const Invoice = require('../../models').invoices;
const InvoiceItem = require('../../models').invoice_items;

const generateInvoice = require('../../helpers/invoice').generate;
const doku = require('../../helpers/doku');
const calcPace = require('../../helpers/calcPace');
const { errorResponse, successResponse } = require('../../helpers/response');
const { sort } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const Xendit = require('../services/payment/xendit');
const Op = require('sequelize').Op;
const sequelize = require('../../models/index').sequelize;
const { uploadFile, randomName, getValidExtension } = require('../../helpers/upload');
const dayjs = require('dayjs');
const ROLE_CONSTANT = require('../../constants/roleConstant');
const EVENT_GROUP_CONSTANT = require('../../constants/eventGroupTypeConstant');
const EVENT_TYPE = require('../../constants/eventTypeConstant');
const SPONSOR_TYPE = require('../../constants/sponsorTypeConstant');
const INVOICE_PAYMENT_FOR = require('../../constants/invoicePaymentForConstant');
const { formatCurrency, getRandomInt} = require('../../helpers/filter');
const { sendEmail } = require('../../helpers/sendEmail');
// CONSTANT VARIABLE
const SPEED_MAX = 3.00;
const CHEAT_COUNTER_MAX = 50;
const DISTANCE_DISCOUNT = 5;

exports.getAll = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            sort: await sort(req.query.sort)
        };
        const by_organization = req.query.by_organization ? +req.query.by_organization : null;
        const keyword = req.query.keyword ? req.query.keyword : '';
        const query = {
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { description: { [Op.like]: `%${keyword}%` } },
                    { reward: { [Op.like]: `%${keyword}%` } },
                    { registration_fee: { [Op.like]: `%${keyword}%` } }
                ]
            },
        }
        if (by_organization) {
            query.where.organization_id = by_organization;
        }
        const count = await serviceCrud.count(Event, query);
        const paginate = await pagination(params.size, params.page, count, `/events?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        const rows = await serviceCrud.findAll(Event, query);
        // jika yang request user biasa tampilkan berdasar id user
        if (user.role_id === ROLE_CONSTANT.MEMBER) {
            for (const row of rows) {
                let participant = await serviceCrud.findOne(Participant, {
                    attributes: ['id', 'is_finish'],
                    where: {
                        user_id: user.id,
                        event_id: row.id
                    }
                });

                let isParticipate, isFinish, participantId;
                if (participant !== null) {
                    participantId = participant.id;
                    isParticipate = 1;
                    isFinish = participant.is_finish;
                }
                else {
                    participantId = 0;
                    isParticipate = 0;
                    isFinish = 0;
                }

                row.setDataValue('participant_id', participantId);
                row.setDataValue('is_participate', isParticipate);
                row.setDataValue('is_finish', isFinish);

                const invoice = await serviceCrud.findOne(Invoice, {
                    where: {
                        user_id: user.id,
                        'join_payload.event_id': row.id,
                    }
                });

                if (!invoice) {
                    row.setDataValue('invoice', null)
                } else {
                    row.setDataValue('invoice', {
                        invoice_no: invoice.invoice_no,
                        status: invoice.status,
                        invoice_url: invoice.gateway_req_payload.invoice_url,
                        amount: invoice.gateway_req_payload.amount,
                        currency: invoice.gateway_req_payload.currency
                    });
                }
            }
        }

        const data = await paginationResponse(count, paginate, rows);
        const eventsID = _.map(data.rows, 'id')
        const warnEvents = await serviceCrud.findAll(Event, {
            where: {
                id: {
                    [Op.in]: eventsID
                }
            },
            include: [
                {
                    model: EventGroup,
                    where: { warning: 1 }
                }
            ]
        })
        const warnEventsID = _.map(warnEvents, 'id');
        let flagWarning = false;
        data.rows = data.rows.map(el => {
            const idx = warnEventsID.findIndex(id => id === el.id);
            const data = JSON.parse(JSON.stringify(el))
            data.warning = 0;
            if (idx !== -1) {
                data.warning = 1;
                flagWarning = true
            }
            return data;
        })
        data.warning = flagWarning;
        data.message = flagWarning ? 'Terdapat event yang memiliki section overlap waktu dengan section lain' : ''
        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.get = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const id = req.params.id;
        const show_winners = req.query.show_winners;

        const data = await serviceCrud.findOne(Event, {
            where: {
                id: id
            },
            // include: ['user'] Error, not needed
        });

        const totalSponsor = await serviceCrud.count(Sponsor, {
            where: {
                event_id: id
            }
        });

        const sponsorId = await serviceCrud.findAll(Sponsor, {
            where: {
                event_id: id
            },
            attributes: ['id']
        });

        const listIdSponsor = [];

        for (const sponsor of sponsorId) {
            listIdSponsor.push(sponsor.dataValues.id)
        }

        const totalSponsorItem = await serviceCrud.count(SponsorItem, {
            where: {
                sponsor_id: {
                    [Op.in]: listIdSponsor
                }
            }
        });

        const totalNewParticipant = await serviceCrud.count(Participant, {
            where: {
                [Op.and]: [
                    { event_id: id },
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('createdAt')),
                        sequelize.literal('CURRENT_DATE')
                    )
                ]
            }
        });

        const totalParticipant = await serviceCrud.count(Participant, {
            where: {
                event_id: id
            }
        });

        const approvedParticipant = await serviceCrud.count(Participant, {
            where: {
                event_id: id,
                payment_status: "1",
            }
        });

        const notApprovedParticipant = await serviceCrud.count(Participant, {
            where: {
                event_id: id,
                payment_status: "0",
                sender_name: { [Op.not]: null, [Op.not]: "" }
            }
        });

        const notConfirmParticipant = await serviceCrud.count(Participant, {
            where: {
                event_id: id,
                payment_status: "0",
                sender_name: { [Op.is]: null }
            }
        });

        const rejectedParticipant = await serviceCrud.count(Participant, {
            where: {
                event_id: id,
                payment_status: "2"
            }
        });

        let winners = []
        if (show_winners) {
            winners = await serviceCrud.findAll(Participant, {
                where: {
                    event_id: id,
                    ranking: { [Op.not]: null, [Op.not]: 0 }
                },
                order: [
                    ['ranking', 'ASC']
                ],
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email', 'path_photo', 'gender'],
                        required: true,
                        include: [Province, Regency]
                    },
                ],
                limit: 3
            });
        }

        const eventGroupStart = await serviceCrud.findOne(EventGroup, {
            attributes: ['start_time'],
            where: { event_id: id },
            order: [
                ['id', 'ASC']
            ]
        });
        const eventGroupEnd = await serviceCrud.findOne(EventGroup, {
            attributes: ['end_time'],
            where: { event_id: id },
            order: [
                ['id', 'DESC']
            ]
        });

        let invoice = await serviceCrud.findOne(Invoice, {
            where: {
                user_id: req.loggedInUser.id,
                'join_payload.event_id': id,
            }
        });

        if (invoice) {
            invoice = {
                invoice_no: invoice.invoice_no,
                status: invoice.status,
                invoice_url: invoice.gateway_req_payload.invoice_url,
                amount: invoice.gateway_req_payload.amount,
                currency: invoice.gateway_req_payload.currency
            };
        }

        const participant = await serviceCrud.findOne(Participant, {
            attributes: ['id', 'is_finish', 'finished_at', 'ranking'],
            where: {
                user_id: user.id,
                event_id: id
            }
        });

        const officialSponsor = await serviceCrud.findOne(Sponsor, {
            attributes: {
                    exclude: ['createdAt', 'updatedAt']
            },
            where: {
                event_id: id,
                type: SPONSOR_TYPE.OFFICIAL_SPONSOR
            }
        });

        if (officialSponsor) {
            const catalog = await serviceCrud.findAll(SponsorItem, {
                attributes: ['id', 'name', 'price', 'weight', 'description', 'image'],
                where: {
                    sponsor_id: officialSponsor.id
                }
            });

            officialSponsor.setDataValue('sponsor_items', catalog);
        }

        const payload = data.toJSON();
        payload.total_sponsor = totalSponsor;
        payload.total_catalog = totalSponsorItem;
        payload.total_participant = totalParticipant;
        payload.total_approved_participant = approvedParticipant;
        payload.total_not_approved_participant = notApprovedParticipant;
        payload.total_new_participant = totalNewParticipant;
        payload.total_not_confirm_participant = notConfirmParticipant;
        payload.total_rejected_participant = rejectedParticipant;
        payload.start_time = eventGroupStart ? eventGroupStart.start_time : null;
        payload.end_time = eventGroupEnd ? eventGroupEnd.end_time : null;
        if (show_winners) payload.winners = winners;
        payload.invoice = invoice;
        payload.participant = participant;
        payload.official_sponsor = officialSponsor;

        res.json(payload);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.getRanking = async (req, res) => {
    try {
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            sort: await sort(req.query.sort),
            event_id: req.query.event_id,
            event_group_id: req.query.event_group_id || null,
            user_id: req.query.user_id || null
        };

        const query = {
            event_id: params.event_id,
        }

        if (params.event_group_id) {
            query.event_group_id = params.event_group_id
        }

        if (params.user_id) {
            query.user_id = params.user_id;
        }

        query.ranking = {
            [Op.not]: null, [Op.not]: ""
        }

        let limit = params.size;
        let offset = params.page;

        if (params.size && params.page && params.sort) {
            const count = await serviceCrud.count(Participant, query);
            const paginate = await pagination(params.size, params.page, count, `/ranking?`);
            limit = paginate.size;
            offset = paginate.skip;
        }

        const participants = await serviceCrud.findAll(Participant, {
            where: query,
            order: [
                ['ranking', 'ASC'],
            ],
            offset: offset,
            limit: limit,
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email', 'path_photo', 'gender'],
                    required: true,
                    include: ['province', 'regency']
                },
            ]
        });

        res.json({participants})
       
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.create = async (req, res) => {
    try {
        let photo = req.body.photo;

        if (req.file) {
            const extension = await getValidExtension(req);
            const filename = await randomName(16);
            const source = req.file.path;
            const destination = `events/${filename}.${extension}`;
            photo = destination;

            await uploadFile(source, destination);
        }

        const { name, description, registration_fee, reward, distance, duration, type, speed_limit, cheat_counter_max, organization_id } = req.body;

        const data = await serviceCrud.create(Event, {
            name, description, photo, registration_fee, reward, distance, duration, type, speed_limit, cheat_counter_max, organization_id
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
        const { name, photo, description, registration_fee, reward, distance, duration, type, speed_limit, cheat_counter_max, organization_id } = req.body;

        await serviceCrud.update(Event, {
            name, photo, description, registration_fee, reward, distance, duration, type, speed_limit, cheat_counter_max, organization_id
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

        await serviceCrud.delete(Event, {
            where: {
                id: id
            }
        })
        // 
        // where model have field event_id = null
        // 

        res.json({ message: 'Success.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.joinBak = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const { event_id } = req.body;

        const userJoined = await serviceCrud.findOne(Participant, {
            where: {
                user_id: user.id,
                event_id
            }
        });

        if (userJoined) {
            return res.status(403).json({
                message: 'Anda sudah terdaftar.',
                data: userJoined
            });
        }

        const eventGroup = await serviceCrud.findAll(EventGroup, {
            where: {
                event_id: event_id
            }
        });

        if (eventGroup.length < 1) {
            return res.status(403).json({ message: 'Event group not found.' });
        }

        const participant = await serviceCrud.findOne(Participant, {
            attributes: ['participant_no'],
            where: {
                event_id: event_id
            },
            order: [['createdAt', 'DESC']],
        });

        let participantNo;
        if (participant) {
            const numberPattern = /[1-9]+/g;
            participantNo = participant.participant_no.match(numberPattern);
        }
        else {
            participantNo = 0;
        }

        for (let index = 0; index < eventGroup.length; index++) {
            const group = eventGroup[index];

            if (group.remaining_quota > 0) {

                // generate participant_no
                // const quota = group.max_quota - group.remaining_quota + 1;
                const quota = parseInt(participantNo) + 1;
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
                // end generate participant no

                // Insert participant
                const payloadParticipant = {
                    participant_no: participantNumber,
                    payment_status: 1,
                    distance: 0,
                    duration: 0,
                    // path_proof_of_payment: 0,
                    user_id: user.id,
                    event_id: group.event_id,
                    event_group_id: group.id
                };

                await serviceCrud.create(Participant, payloadParticipant);
                // end insert participant

                // Insert event group
                const payloadEventGroup = {
                    remaining_quota: group.remaining_quota - 1
                };

                const queryEventGroup = {
                    where: {
                        id: group.id
                    }
                };

                await serviceCrud.update(EventGroup, payloadEventGroup, queryEventGroup);
                // end Insert event group

                break;

            }

            if (index === eventGroup.length - 1) {
                return res.status(422).json({ message: 'Kuota event sudah terpenuhi.' });
            }
        }

        res.json({ message: 'Pendaftaran berhasil.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.join = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const { event_id, event_group_id, merchandise } = req.body;

        const userJoined = await serviceCrud.findOne(Participant, {
            where: {
                user_id: user.id,
                event_id
            }
        });

        if (userJoined) {
            let inv = await serviceCrud.findOne(Invoice, {
                where: {
                    user_id: user.id,
                    'join_payload.event_id': event_id,
                    'join_payload.event_group_id': event_group_id
                }
            });

            if (inv) {
                inv = {
                    invoice_no: inv.invoice_no,
                    invoice_url: inv.gateway_req_payload.invoice_url,
                    amount: inv.gateway_req_payload.amount,
                    currency: inv.gateway_req_payload.currency
                };
            }

            return res.status(403).json({
                message: 'Anda sudah terdaftar.',
                data: {
                    participant: userJoined,
                    invoice: inv
                }
            });
        }

        const eventGroup = await serviceCrud.findOne(EventGroup, {
            where: {
                id: event_group_id
            }
        });

        if (!eventGroup) {
            return res.status(403).json({ message: 'Event group not found.' });
        }

        const event = await serviceCrud.findOne(Event, {
            where: {
                id: event_id
            }
        });

        if (!event) {
            return res.status(403).json({ message: 'Event not found.' });
        }

        const isFreeEvent = event.registration_fee == 0 ? true:false;
        const invoiceJoined = await serviceCrud.findOne(Invoice, {
            where: {
                payment_for: INVOICE_PAYMENT_FOR.EVENT,
                user_id: user.id,
                'join_payload.event_id': event_id,
                'join_payload.event_group_id': event_group_id
            }
        });

        if (invoiceJoined && !isFreeEvent) {
            if (invoiceJoined.gateway_reference_id && invoiceJoined.status != 1) {
                return res.status(403).json({
                    message: 'Anda sudah terdaftar di event ini. Segera lakukan pembayaran.',
                    data: {
                        invoice_no: invoiceJoined.invoice_no,
                        invoice_url: invoiceJoined.gateway_req_payload.invoice_url,
                        amount: invoiceJoined.gateway_req_payload.amount,
                        currency: invoiceJoined.gateway_req_payload.currency
                    }
                });
            }

            if (!invoiceJoined.gateway_reference_id) {
                await serviceCrud.delete(Invoice, {
                    where: {
                        id: invoiceJoined.id
                    }
                });
            }
        }

        if (eventGroup.remaining_quota <= 0) {
            return res.status(422).json({ message: 'Kuota event sudah terpenuhi.' });
        }

        const today = new Date();
        let eventInvoice = null;
        if (!isFreeEvent) {
            eventInvoice = await serviceCrud.create(Invoice, {
                invoice_no: generateInvoice(today),
                payment_for: INVOICE_PAYMENT_FOR.EVENT,
                user_id: user.id,
                delivery_name: user.name,
                delivery_phone: user.phone,
                delivery_fee: 0,
                sub_total: event.registration_fee,
                total_price: event.registration_fee,
                join_payload: {
                    event_id,
                    event_group_id
                }
            });

            if (!merchandise) {
                const xendit = await Xendit.createInvoice({
                    invoiceID: eventInvoice.invoice_no,
                    email: user.email,
                    amount: eventInvoice.total_price.toString()
                });
                
                eventInvoice.gateway_reference_id = xendit.id;
                eventInvoice.gateway_req_payload = xendit;
                eventInvoice.save();

                return res.json({ 
                    message: 'Pendaftaran berhasil.',
                    data: {
                        invoice: {
                            invoice_no: eventInvoice.invoice_no,
                            invoice_url: xendit.invoice_url,
                            amount: xendit.amount,
                            currency: xendit.currency
                        }
                    }
                });
            }
        } else {
            let participant = await serviceCrud.findOne(Participant, {
                attributes: ['participant_no'],
                where: {
                    event_id: event_id
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
                user_id: user.id,
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

            if (!merchandise) {
                return res.json({ 
                    message: 'Pendaftaran berhasil.',
                    data: {}
                }); 
            }

            // START - Send email to user
            // const lastParticipantNow = await serviceCrud.findOne(Participant, {
            //     attributes: ['id','participant_no','user_id','nominal_unique','nominal_user_transfer','createdAt', 'will_buy_merchandise'],
            //     where: {
            //         participant_no: participantNumber,
            //         event_id: eventGroup.event_id,
            //         event_group_id: eventGroup.id
            //     },
            //     order: [
            //         ['id', 'DESC']
            //     ]
            // });

            // let nominal_unique = 0
            // const defaultNominal = 135000
            // if (lastParticipantNow) {
            //     nominal_unique = defaultNominal + getRandomInt(1, 999)
            // } else {
            //     nominal_unique = defaultNominal
            // }
            // const nominalFormatted = formatCurrency(nominal_unique)

            // code update special
            // const paramEmail = {
            //     from: "no-reply@deossport.com",
            //     to: user.email,
            //     subject: "Account Joint Event Pomad Virtual Run 2021",
            //     template: lastParticipantNow.will_buy_merchandise == 1 ? "join-event" : "join-event-special",
            //     context: {
            //         name: user.name,
            //         link: "https://pomad2021.deossport.com/konfirmasi.html",
            //         nominal_unique: nominalFormatted
            //     },
            //     defaultLayout: lastParticipantNow.will_buy_merchandise == 1 ? "join-event.ejs" : "join-event-special.ejs"
            // };

            // await sendEmail(paramEmail);
            // END - Send email to user
        }

        const {shipping, items} = merchandise;

        let totalInvoice = shipping.delivery_fee;
        if (eventInvoice) {
            totalInvoice += eventInvoice.total_price;
        }

        let sponsor = null;
        let _items = [];
        for (const item of items) {
            const _item = await serviceCrud.findOne(SponsorItem, {
                where: {
                    id: item.sponsor_item_id,
                }
            });
            if (!_item) {
                continue;
            }
            totalInvoice += _item.price * item.qty
            _items.push({
                sponsor_item_id: _item.id,
                name: _item.name,
                sponsor_id: _item.sponsor_id,
                qty: item.qty,
                price: _item.price,
            });

            if (!sponsor) {
                sponsor = await serviceCrud.findOne(Sponsor, {
                    where: {
                        id: _item.sponsor_id
                    }
                });
            }
        }

        const merchandiseInvoice = await serviceCrud.create(Invoice, {
            invoice_no: generateInvoice(today),
            user_id: user.id,
            delivery_name: shipping.delivery_name,
            delivery_phone: shipping.delivery_phone,
            delivery_address: shipping.delivery_address,
            delivery_fee: shipping.delivery_fee,
            sub_total: totalInvoice - shipping.delivery_fee  - event.registration_fee,
            total_price: totalInvoice - event.registration_fee,
            join_payload: {
                event_id,
                event_group_id
            },
            company_id: sponsor.company_id,
            courier: shipping.courier_code + ' - ' + shipping.courier_service,
        });

        _items = _items.map(item => {
            item.invoice_id = merchandiseInvoice.id;
            return item;
        });
        await serviceCrud.bulkCreate(InvoiceItem, _items);

        const xendit = await Xendit.createInvoice({
            invoiceID: merchandiseInvoice.invoice_no,
            email: user.email,
            amount: totalInvoice.toString()
        });

        if (eventInvoice) {
            eventInvoice.gateway_reference_id = xendit.id;
            eventInvoice.gateway_req_payload = xendit;
            eventInvoice.save();
        }
        merchandiseInvoice.gateway_reference_id = xendit.id;
        merchandiseInvoice.gateway_req_payload = xendit;
        merchandiseInvoice.save();

        return res.json({ 
            message: 'Pendaftaran berhasil.',
            data: {
                invoice: {
                    invoice_no: merchandiseInvoice.invoice_no,
                    invoice_url: xendit.invoice_url,
                    amount: xendit.amount,
                    currency: xendit.currency
                }
            }
        });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.joinPaidEvent = async (req, res) => {
    try {
        const date = new Date();
        const user = await serviceCrud.findOne(User, {
            where: {
                id: req.loggedInUser.id
            },
            include: ['province', 'regency']
        });
        const { event_id, event_group_id } = req.body;

        const userJoined = await serviceCrud.findOne(Participant, {
            where: {
                user_id: user.id,
                event_id,
                event_group_id
            }
        });

        if (userJoined) {
            return res.status(403).json({
                message: 'Anda sudah terdaftar.',
                data: userJoined
            });
        }

        const invoiceJoined = await serviceCrud.findOne(Invoice, {
            where: {
                payment_for: INVOICE_PAYMENT_FOR.EVENT,
                user_id: user.id,
                'join_payload.event_id': event_id,
                'join_payload.event_group_id': event_group_id
            }
        });

        if (invoiceJoined) {
            if (invoiceJoined.gateway_reference_id) {
                return res.status(403).json({
                    message: 'Anda sudah terdaftar di event ini. Segera lakukan pembayaran.',
                    data: {
                        invoice_no: invoiceJoined.invoice_no,
                        invoice_url: invoiceJoined.gateway_req_payload.invoice_url,
                        amount: invoiceJoined.gateway_req_payload.amount,
                        currency: invoiceJoined.gateway_req_payload.currency
                    }
                });
            }

            await serviceCrud.delete(Invoice, {
                where: {
                    id: invoiceJoined.id
                }
            });
        }

        // Event Group Not Found
        const eventGroup = await serviceCrud.findOne(EventGroup, {
            where: {
                id: event_group_id
            }
        });

        if (!eventGroup) {
            return res.status(403).json({ message: 'Event group not found.' });
        }

        if (eventGroup.remaining_quota <= 0) {
            return res.status(422).json({ message: 'Kuota event sudah terpenuhi.' });
        }

        const event = await serviceCrud.findOne(Event, {
            where: {
                id: event_id,
                registration_fee: {
                    [Op.ne]: 0
                }
            }
        });

        if (!event) {
            return res.status(403).json({ message: 'Event not found.' });
        }

        const invoiceNumber = generateInvoice(date);
        const invoice = await serviceCrud.create(Invoice, {
            invoice_no: invoiceNumber,
            payment_for: INVOICE_PAYMENT_FOR.EVENT,
            user_id: user.id,
            delivery_name: user.name,
            delivery_phone: user.phone,
            delivery_fee: 0,
            sub_total: event.registration_fee,
            total_price: event.registration_fee,
            join_payload: {
                event_id,
                event_group_id
            }
        });


        const xendit = await Xendit.createInvoice({
            invoiceID: invoice.invoice_no,
            email: user.email,
            amount: invoice.total_price.toString()
        });
        
        invoice.gateway_reference_id = xendit.id;
        invoice.gateway_req_payload = xendit;
        invoice.save();

        return res.json({ 
            message: 'Pendaftaran berhasil.',
            data: {
                invoice_no: invoice.invoice_no,
                invoice_url: xendit.invoice_url,
                amount: xendit.amount,
                currency: xendit.currency
            }
        });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.ranking = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const { event_id, event_group_id, event_group_type, distance, duration, speed, lat, lng, accuracy } = req.body;
        const event = await serviceCrud.findOne(Event, {
            where: {
                id: event_id
            },
        });

        // jika event group type tidak ada return error
        if (!event_group_type === EVENT_GROUP_CONSTANT.MASS || !event_group_type === EVENT_GROUP_CONSTANT.INDIVIDUAL) {
            return res.status(422).json({ message: 'Event group type not found.' });
        }

        // update distance sama duration peserta
        await serviceCrud.update(Participant, {
            distance, duration
        }, {
            where: {
                user_id: user.id,
                event_id: event_id,
                event_group_id: event_group_id
            }
        });

        // jika event group type nya massal (0)
        if (event_group_type === EVENT_GROUP_CONSTANT.MASS) {
            let participants = await serviceCrud.findAll(Participant, {
                where: {
                    event_id: event_id,
                    event_group_id: event_group_id
                },
                attributes: ['user_id', 'is_finish'],
                order: [
                    ['distance', 'DESC']
                ]
            });

            const index = participants.findIndex(participant => participant.user_id === user.id);
            const ranking = index + 1;

            await serviceCrud.update(Participant, {
                ranking
            }, {
                where: {
                    user_id: user.id,
                    event_id: event_id,
                    event_group_id: event_group_id
                }
            });
        }
        else if (event_group_type === EVENT_GROUP_CONSTANT.INDIVIDUAL) {
            let participants = await serviceCrud.findAll(Participant, {
                where: {
                    event_id: event_id,
                    event_group_id: event_group_id,
                    duration: {
                        [Op.ne]: 0
                    }
                },
                attributes: ['user_id', 'is_finish'],
                order: [
                    ['duration', 'ASC']
                ]
            });

            // for (const userParticipant of participants) {
            //     const index = participants.findIndex(participant => participant.user_id === userParticipant.user_id);
            //     const ranking = index + 1;

            //     await serviceCrud.update(Participant, {
            //         ranking
            //     }, {
            //         where: {
            //             user_id: userParticipant.user_id,
            //             event_id: event_id,
            //             event_group_id: event_group_id
            //         }
            //     });
            // }
            const index = participants.findIndex(participant => participant.user_id === user.id);
            const ranking = index + 1;

            await serviceCrud.update(Participant, {
                ranking
            }, {
                where: {
                    user_id: user.id,
                    event_id: event_id,
                    event_group_id: event_group_id
                }
            });
        }

        // get data participant
        let participant = await serviceCrud.findOne(Participant, {
            where: {
                user_id: user.id,
                event_id: event_id,
                event_group_id: event_group_id
            }
        });

        // hitung kecurangan (SPEED_MAX, CHEAT_COUNTER_MAX)
        let cheat_counter, is_cheat = 0;
        // Tipe Event Race Only
        if (+event.type === EVENT_TYPE.RACE) {
            if (speed > event.speed_limit) {
                cheat_counter = participant.cheat_counter + 1;
                if (cheat_counter > event.cheat_counter_max) {
                    is_cheat = 1
                }
                participant.setDataValue('cheat_counter', cheat_counter);
                participant.setDataValue('is_cheat', is_cheat);
            }
            else {
                if (participant.is_cheat > 0) {
                    cheat_counter = participant.cheat_counter
                    is_cheat = 1
                }
                else {
                    cheat_counter = 0;
                }
                participant.setDataValue('cheat_counter', cheat_counter);
            }
        }

        // update data kecurangan
        await serviceCrud.update(Participant, {
            cheat_counter, is_cheat
        }, {
            where: {
                user_id: user.id,
                event_id: event_id,
                event_group_id: event_group_id
            }
        });

        // create new participant route
        await serviceCrud.create(ParticipantRoute, {
            participant_id: participant.dataValues.id,
            speed: speed,
            accuracy: accuracy,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        });

        res.json(participant);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.finish = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const { participant_id, event_id, event_group_id, event_group_type, distance, duration, speed, lat, lng, accuracy } = req.body;

        // jika event group type tidak ada return error
        if (!event_group_type === EVENT_GROUP_CONSTANT.MASS || !event_group_type === EVENT_GROUP_CONSTANT.INDIVIDUAL) {
            return res.status(422).json({ message: 'Event group type not found.' });
        }

        // Calculate Pace
        const pace = calcPace(distance, duration);

        // update jarak, durasi, & pace(km) peserta
        await serviceCrud.update(Participant, {
            distance, duration, pace
        }, {
            where: {
                id: participant_id
            }
        });

        // create new participant route
        await serviceCrud.create(ParticipantRoute, {
            participant_id,
            speed: speed,
            accuracy: accuracy,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        });

        // cari event jarak dan reward nya
        const event = await serviceCrud.findOne(Event, {
            attributes: ['distance', 'reward'],
            where: {
                id: event_id
            }
        });

        const today = new Date();
        today.setHours(today.getHours() + 7);
        let payloadParticipant = {
            is_finish: 1,
            finished_at: today
        };

        if (distance >= event.distance) {
            if (event_group_type === EVENT_GROUP_CONSTANT.MASS) {
                // cari yang finish terakhir dan ranking berapa
                const contestant = await serviceCrud.findOne(Participant, {
                    attributes: ['ranking'],
                    where: {
                        event_id, event_group_id,
                        is_finish: 1,
                        ranking: {
                            [Op.ne]: null
                        },
                        id: {
                            [Op.ne]: participant_id
                        }
                    },
                    order: [
                        ['distance', 'DESC']
                    ]
                });

                if (!contestant) {
                    payloadParticipant.ranking = 1;
                }
                else {
                    payloadParticipant.ranking = contestant.ranking + 1;
                }
            }
            else if (event_group_type === EVENT_GROUP_CONSTANT.INDIVIDUAL) {
                participants = await serviceCrud.findAll(Participant, {
                    where: {
                        event_id: event_id,
                        event_group_id: event_group_id,
                        distance: {
                            [Op.gte]: event.distance
                        }
                    },
                    attributes: ['user_id', 'is_finish'],
                    order: [
                        ['duration', 'ASC']
                    ]
                });

                for (const userParticipant of participants) {
                    const index = participants.findIndex(participant => participant.user_id === userParticipant.user_id);
                    const ranking = index + 1;

                    await serviceCrud.update(Participant, {
                        ranking
                    }, {
                        where: {
                            user_id: userParticipant.user_id,
                            event_id: event_id,
                            event_group_id: event_group_id
                        }
                    });
                }
            }
        }
        else {
            payloadParticipant.ranking = null;
        }

        await serviceCrud.update(Participant, payloadParticipant, {
            where: {
                id: participant_id
            }
        });

        await serviceCrud.update(User, {
            point_reward: sequelize.literal(`point_reward + ${event.reward}`)
        }, {
            where: {
                id: user.id
            }
        });

        const participant = await serviceCrud.findOne(Participant, {
            where: {
                id: participant_id
            }
        });

        res.json(participant);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.publishRanking = async (req, res) => {
    try {
        const { event_id } = req.body;
        await serviceCrud.update(Event, { is_final: 1 }, {
            where: {
                id: event_id
            }
        })
        res.json({ message: 'Success.' });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.resetRanking = async (req, res) => {
    try {
        const { event_id } = req.body;
        await serviceCrud.update(Participant, { ranking: null }, {
            where: { event_id }
        })
        res.json({ message: 'Success.' });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.rankingCount = async (req, res) => {
    try {
        const { event_id, event_group_id, event_group_type } = req.body;
        const event = await serviceCrud.findOne(Event, {
            attributes: ['distance', 'duration'],
            where: {
                id: event_id
            }
        });

        // Normalisasi peserta (set is_finish to 1)
        const participantsN = await serviceCrud.update(Participant, {
            is_finish: 1
        }, {
            where: {
                is_finish: 0,
                distance: {
                    [Op.gte]: event.distance
                }
            }
        })

        // Set Ranking 1, 2, 3, ...
        const criteria = {
            is_cheat: 0,
            is_finish: 1,
            duration: 12 * 60, // Duration Virtual (detik)
            avg_accuracy: 100,
            distance: 4750
        }

        let query = {
            where: {
                event_id,
                is_finish: criteria.is_finish,
                is_cheat: criteria.is_cheat,
                distance: {
                    [Op.gte]: criteria.distance
                }
            }
        };
        if (event_group_type == EVENT_GROUP_CONSTANT.MASS) {
            query.order = [
                ['finished_at', 'ASC']
            ];
        }
        else if (event_group_type == EVENT_GROUP_CONSTANT.INDIVIDUAL) {
            // Nothing
        }
        else {
            // Nothing
        }

        if (event_group_id) {
            query.where.event_group_id = event_group_id;
        }
        else {
            // jika tidak ada event_group id di anggap sudah final
            // await serviceCrud.update(Event, { is_final: 1 },
            //     {
            //         where: { id: event_id }
            //     });
        }

        // Filter Duration
        let participants = await serviceCrud.findAll(Participant, query);
        participants = participants.filter(el => {
            return el.duration_virtual >= criteria.duration;
        })
        // return res.json({ count: participants.length, participants })

        // Filter avg_accuracy
        let participantsWithAccuracy = [];
        for (let i = 0; i < participants.length; i++) {
            let averageAccuracy = await serviceCrud.findAll(ParticipantRoute, {
                attributes: [[sequelize.fn('AVG', sequelize.col('accuracy')), 'average_accuracy']],
                where: { participant_id: participants[i].id }
            });

            let avg = JSON.parse(JSON.stringify(averageAccuracy[0]));
            if (avg.average_accuracy <= criteria.avg_accuracy) {
                let data = JSON.parse(JSON.stringify(participants[i]));
                data.averageAccuracy = avg.average_accuracy;
                participantsWithAccuracy.push(data);
            }
        }
        // return res.json({ count: participantsWithAccuracy.length, participantsWithAccuracy })

        // Sorting
        let FLAG_DURATION_ASC = false
        if (event_group_type == EVENT_GROUP_CONSTANT.MASS) {
            // Nothing
        }
        else if (event_group_type == EVENT_GROUP_CONSTANT.INDIVIDUAL) {
            FLAG_DURATION_ASC = true;
        }
        else {
            FLAG_DURATION_ASC = true;
        }
        if (FLAG_DURATION_ASC) {
            participantsWithAccuracy = _.sortBy(participantsWithAccuracy, ['duration_virtual'], ['asc']);
        }

        const participantsIDHasRanking = [];
        for (const [index, userParticipant] of participantsWithAccuracy.entries()) {
            participantsIDHasRanking.push(userParticipant.id);
            let ranking = index + 1;
            let query = {
                where: {
                    user_id: userParticipant.user_id,
                    event_id: event_id
                }
            };

            if (event_group_id) {
                query.where.event_group_id = event_group_id
            }

            // Calculate Pace
            const pace = calcPace(userParticipant.distance, userParticipant.duration);

            await serviceCrud.update(Participant, {
                ranking, pace
            }, query);
        }

        // Set ranking to null
        const queryParticipant = {
            where: {
                event_id,
                id: { [Op.notIn]: participantsIDHasRanking }
            }
        }

        if (event_group_id) {
            queryParticipant.where.event_group_id = event_group_id
        }

        const otherParticipants = await serviceCrud.findAll(Participant, queryParticipant);
        for (const userParticipant of otherParticipants) {
            // Calculate Pace
            const pace = calcPace(userParticipant.distance, userParticipant.duration);
            await serviceCrud.update(Participant, {
                ranking: null, pace
            }, {
                where: {
                    id: userParticipant.id
                }
            });
        }

        res.json(successResponse('Success.', {}));
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.rankingCountNonCriteria = async (req, res) => {
    try {
        const { event_id, event_group_id, event_group_type } = req.body;
        const event = await serviceCrud.findOne(Event, {
            attributes: ['distance', 'duration'],
            where: {
                id: event_id
            }
        });

        // Normalisasi peserta (set is_finish to 1)
        const participantsN = await serviceCrud.update(Participant, {
            is_finish: 1
        }, {
            where: {
                is_finish: 0,
                distance: {
                    [Op.gte]: event.distance
                }
            }
        })

        const discountDistance = DISTANCE_DISCOUNT * event.distance / 100;
        const minDistance = event.distance - discountDistance;

        let query = {
            where: {
                event_id: event_id,
                distance: {
                    [Op.gte]: minDistance
                },
                is_cheat: 0
            }
        };
        if (event_group_type == EVENT_GROUP_CONSTANT.MASS) {
            query.order = [
                ['finished_at', 'ASC']
            ];
        }
        else if (event_group_type == EVENT_GROUP_CONSTANT.INDIVIDUAL) {
            query.order = [
                ['duration', 'ASC']
            ];
        }
        else {
            query.order = [
                ['duration', 'ASC']
            ];
        }

        if (event_group_id) {
            query.where.event_group_id = event_group_id;
        }
        else {
            // jika tidak ada event_group id di anggap sudah final
            await serviceCrud.update(Event, {
                is_final: 1
            }, {
                where: {
                    id: event_id
                }
            });
        }

        const participants = await serviceCrud.findAll(Participant, query);

        for (const userParticipant of participants) {
            let index = participants.findIndex(participant => participant.user_id === userParticipant.user_id);
            let ranking = index + 1;
            let query = {
                where: {
                    user_id: userParticipant.user_id,
                    event_id: event_id
                }
            };

            if (event_group_id) {
                query.where.event_group_id = event_group_id
            }

            // Calculate Pace
            const pace = calcPace(userParticipant.distance, userParticipant.duration);

            await serviceCrud.update(Participant, {
                ranking, pace
            }, query);
        }

        const queryParticipant = {
            where: {
                event_id,
                [Op.or]: [
                    {
                        distance: {
                            [Op.lt]: minDistance
                        },
                    },
                    {
                        is_cheat: 1
                    },
                    {
                        is_finish: 0
                    }
                ],
            }
        }

        if (event_group_id) {
            queryParticipant.where.event_group_id = event_group_id
        }

        // OLD
        // await serviceCrud.update(Participant, {
        //     ranking: null
        // }, queryParticipant);

        // NEW
        const otherParticipants = await serviceCrud.findAll(Participant, queryParticipant);
        for (const userParticipant of otherParticipants) {
            // Calculate Pace
            const pace = calcPace(userParticipant.distance, userParticipant.duration);
            await serviceCrud.update(Participant, {
                ranking: null, pace
            }, {
                where: {
                    id: userParticipant.id
                }
            });
        }

        res.json(successResponse('Success.', {}));
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.fixParticipantNo = async (req, res) => {
    try {
        const { event_id } = req.body;
        const participants = await serviceCrud.findAll(Participant, {
            where: { event_id }
        });

        let index = 0;
        for (let i = 0; i < participants.length; i++) {
            index += 1;
            const participant = participants[i];
            const quotaLength = index.toString().length;
            let participantNumber;
            switch (quotaLength) {
                case 1:
                    participantNumber = '000' + index.toString();
                    break;
                case 2:
                    participantNumber = '00' + index.toString();
                    break;
                case 3:
                    participantNumber = '0' + index.toString();
                    break;
                default:
                    participantNumber = index.toString();
                    break;
            }

            await serviceCrud.update(Participant, {
                participant_no: participantNumber
            }, {
                where: { id: participant.id }
            });
        }

        res.json({ message: 'success!' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.distanceCount = async (req, res) => {
    try {
        const { participant_id } = req.body;

        if (!participant_id) {
            return res.status(422).json({ message: 'Participant Id not found.' });
        }

        // Cari history route tiap participant
        const participantRoutes = await serviceCrud.findAll(ParticipantRoute, {
            attributes: ['location', 'createdAt'],
            where: { participant_id },
            order: [
                ['id', 'ASC']
            ]
        });

        // Hitung jarak dari baris ke baris selanjutnya
        let distance = 0;
        const createdAt = [];
        for (let index = 0; index < participantRoutes.length; index++) {
            // get duration from first and last index
            if (index === 0 || index === participantRoutes.length - 1) {
                createdAt.push(participantRoutes[index].createdAt);
            }

            let from = {
                latitude: participantRoutes[index].location.coordinates[1],
                longitude: participantRoutes[index].location.coordinates[0],
            }

            let to
            if (participantRoutes[index + 1]) {
                to = {
                    latitude: participantRoutes[index + 1].location.coordinates[1],
                    longitude: participantRoutes[index + 1].location.coordinates[0],
                }
            }
            else {
                break;
            }

            const [results] = await sequelize.query(`SELECT ST_Distance_Sphere(
                point(${parseFloat(from.longitude)}, ${parseFloat(from.latitude)}),
                point(${parseFloat(to.longitude)}, ${parseFloat(to.latitude)})
            ) AS distance`);

            distance += results[0].distance;
        }

        const dateFirst = dayjs(createdAt[0]);
        const dateLast = dayjs(createdAt[1]);
        const miliseconds = dateLast.diff(dateFirst, "miliseconds", true);
        const minutes = (miliseconds / 1000) / 60;
        const seconds = (miliseconds / 1000) % 60;
        const duration = `${Math.round(minutes)}:${seconds}`;

        // Calculate Pace
        const pace = calcPace(distance, duration);

        // update jarak participant
        await serviceCrud.update(Participant, {
            distance: Math.round(distance),
            duration, pace
        }, {
            where: { id: participant_id }
        });

        res.json(successResponse('Success.', {
            distance: Math.round(distance),
            duration: duration
        }));
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}