const EventGroup = require('../../models').event_groups;
const Participant = require('../../models').participants;
const Province = require('../../models').provinces;
const Regency = require('../../models').regencies;
const User = require('../../models').users;
const { errorResponse } = require('../../helpers/response');
const { sort, sum } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const Op = require('sequelize').Op;
const sequelize = require('../../models/index').sequelize;
const _ = require('lodash');

exports.getAll = async (req, res) => {
    try {
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            sort: await sort(req.query.sort),
            selectOption: req.query.selectOption || null
        };
        const by_event = req.query.by_event ? +req.query.by_event : null;
        const by_type = req.query.by_type || null;
        const keyword = req.query.keyword ? req.query.keyword : '';
        const query = {
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { description: { [Op.like]: `%${keyword}%` } },
                ]
            }
        }
        if (by_event) {
            query.where.event_id = by_event;
        }
        if (by_type) {
            query.where.type = by_type;
        }

        const count = await serviceCrud.count(EventGroup, query);
        const paginate = await pagination(params.size, params.page, count, `/event_groups?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        if (params.selectOption) {
            query.attributes = ['id', 'name'];
        }

        const rows = await serviceCrud.findAll(EventGroup, query);
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
        const show_winners = req.query.show_winners;

        const data = await serviceCrud.findOne(EventGroup, {
            where: {
                id: id
            }
        });

        const totalParticipantGroup = await serviceCrud.count(Participant, {
            where: {
                event_group_id: id
            }
        });

        const totalNewParticipantGroup = await serviceCrud.count(Participant, {
            where: {
                [Op.and]: [
                    { event_group_id: id },
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('createdAt')),
                        sequelize.literal('CURRENT_DATE')
                    )
                ]
            }
        });

        let winners = []
        if (show_winners) {
            winners = await serviceCrud.findAll(Participant, {
                where: {
                    event_group_id: id,
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


        let payload = data.toJSON();
        payload.total_participant = totalParticipantGroup;
        payload.total_new_participant = totalNewParticipantGroup;
        if (show_winners) payload.winners = winners;

        res.json(payload);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.create = async (req, res) => {
    try {
        const { name, description, start_time, end_time, max_quota, event_id, type, warning, warningGroupsID  } = req.body;
        const remaining_quota = max_quota;
        // warningGroupsID Process
        // if (warningGroupsID.length) {
        //     await serviceCrud.update(EventGroup, { warning: 1 }, {
        //         where: {
        //             id: {
        //                 [Op.in]: warningGroupsID
        //             }
        //         }
        //     })
        // }

        // Create Process
        const data = await serviceCrud.create(EventGroup, {
            name, description, start_time, end_time, max_quota, remaining_quota, event_id, type, warning
        });

        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.warning = async (req, res) => {
    try {
        const { start_time, end_time, event_group_id } = req.body;
        let warningGroupsID = [];
        let warning = 0;

        // Warning Process
        const startDate = start_time.split(' ')[0];
        const endDate = end_time.split(' ')[0];
        const query = {
            where: {
                [Op.or]: [
                    {
                        // eventGrupItem        |               |
                        // eventGroupUpdate         |       |
                        start_time: { [Op.lte]: startDate },
                        end_time: { [Op.gte]: endDate }
                    },
                    {
                        // eventGrupItem            |       |
                        // eventGroupUpdate     |               |
                        start_time: { [Op.gte]: startDate },
                        end_time: { [Op.lte]: endDate }
                    },
                    {
                        // eventGrupItem            |       |
                        // eventGroupUpdate     |       |
                        start_time: {
                            [Op.gte]: startDate,
                            [Op.lte]: endDate
                        },
                        end_time: {
                            [Op.gte]: endDate
                        }
                    },
                    {
                        // eventGrupItem        |       |
                        // eventGroupUpdate         |       |
                        start_time: {
                            [Op.lte]: startDate
                        },
                        end_time: {
                            [Op.gte]: startDate,
                            [Op.lte]: endDate
                        }
                    },
                ]
            }
        }
        if (event_group_id) {
            query.where.id = {
                [Op.ne]: event_group_id
            }
        }
        const warningGroups = await serviceCrud.findAll(EventGroup, query);

        if (warningGroups.length) {
            warning = 1;
            warningGroupsID = _.map(warningGroups, 'id');
        }
        return res.json({ warning, startDate, endDate, warningGroupsID })
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, start_time, end_time, event_id, operator, type, warning, warningGroupsID } = req.body;

        // warningGroupsID Process
        // if (warningGroupsID.length) {
        //     await serviceCrud.update(EventGroup, { warning: 1 }, {
        //         where: {
        //             id: {
        //                 [Op.in]: warningGroupsID
        //             }
        //         }
        //     })
        // }

        // Update Process
        if (!req.body.hasOwnProperty('operator')) {
            return res.status(422).json({ message: 'Field operator is required' });
        }

        const eventGroup = await serviceCrud.findOne(EventGroup, {
            where: {
                id: id
            }
        });

        const new_quota = parseInt(req.body.new_quota);
        let max_quota = eventGroup.dataValues.max_quota;
        let remaining_quota = eventGroup.dataValues.remaining_quota;

        if (operator === 'addition') {
            max_quota = max_quota + new_quota;
            remaining_quota = remaining_quota + new_quota;
        }
        else if (operator === 'subtraction') {
            if (remaining_quota < new_quota) {
                return res.status(422).json({ message: 'Kuota tersisa kurang dari kuota baru.' });
            }
            max_quota = eventGroup.dataValues.max_quota - parseInt(new_quota);
            remaining_quota = eventGroup.dataValues.remaining_quota - parseInt(new_quota);
        }

        await serviceCrud.update(EventGroup, {
            name, description, start_time, end_time, max_quota, remaining_quota, event_id, type, warning
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

        await serviceCrud.delete(EventGroup, {
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

exports.join = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const { event_id, event_group_id } = req.body;

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

        const eventGroup = await serviceCrud.findOne(EventGroup, {
            where: {
                id: event_group_id
            }
        });

        if (!eventGroup) {
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
            const numberPattern = /[0-9]+/g;
            participantNo = participant.participant_no.match(numberPattern);
        }
        else {
            participantNo = 0;
        }

        if (eventGroup.remaining_quota > 0) {

            // generate participant_no
            // const quota = eventGroup.max_quota - eventGroup.remaining_quota + 1;
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
            // end generate participant no

            // Insert participant
            const payloadParticipant = {
                participant_no: participantNumber,
                payment_status: 1,
                distance: 0,
                duration: 0,
                // path_proof_of_payment: 0,
                user_id: user.id,
                event_id: eventGroup.event_id,
                event_group_id: eventGroup.id
            };

            await serviceCrud.create(Participant, payloadParticipant);
            // end insert participant

            // Insert event group
            const payloadEventGroup = {
                remaining_quota: eventGroup.remaining_quota - 1
            };

            const queryEventGroup = {
                where: {
                    id: eventGroup.id
                }
            };

            await serviceCrud.update(EventGroup, payloadEventGroup, queryEventGroup);
            // end Insert event group

        }
        else {
            return res.status(422).json({ message: 'Kuota event sudah terpenuhi.' });
        }

        res.json({ message: 'Pendaftaran berhasil.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}