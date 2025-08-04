const Complaint = require('../../models').complaints;
const Participant = require('../../models').participants;
const User = require('../../models').users;
const Province = require('../../models').provinces;
const Regency = require('../../models').regencies;
const { errorResponse, successResponse } = require('../../helpers/response');
const { sort, sum } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const sequelize = require('../../models/index').sequelize;
const COMPLAINT_STATUS = require('../../constants/complaintStatus');

exports.getAll = async (req, res) => {
    try {
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            keyword: req.query.keyword || '',
            sort: await sort(req.query.sort),
            by_user: req.query.by_user || null,
            by_participant: req.query.by_participant || null
        };

        const query = {
            where: {}
        }
        if (params.by_user) {
            query.where.user_id = params.by_user
        }
        if (params.by_participant) {
            query.where.participant_id = params.by_participant
        }

        const count = await serviceCrud.count(Complaint, query);
        const paginate = await pagination(params.size, params.page, count, `/complaints?`);

        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;

        const rows = await serviceCrud.findAll(Complaint, query);
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
        const data = await serviceCrud.findOne(Complaint, {
            where: {
                id: id
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email', 'path_photo', 'gender'],
                    required: true,
                    include: [Province, Regency]
                },
                {
                    model: Participant,
                    required: true
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

exports.create = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const user_id = user.id;
        const { participant_id, photo, description, duration, distance } = req.body;

        // res.json(req.body)

        const data = await serviceCrud.create(Complaint, {
            photo, description, user_id, participant_id, duration, distance
        });

        await serviceCrud.update(Participant, {
            is_complaint: 1
        }, {
            where: { id: participant_id }
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
        const { photo, description } = req.body;

        await serviceCrud.update(Complaint, {
            photo, description
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

        await serviceCrud.delete(Complaint, {
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

exports.confirm = async (req, res) => {
    try {
        const { complaint_id, status, duration, distance, participant_id } = req.body;

        await serviceCrud.update(Complaint, {
            complaint_id, status
        }, {
            where: { id: complaint_id }
        });

        await serviceCrud.update(Participant, {
            duration, distance
        }, {
            where: { id: participant_id }
        });

        res.json(successResponse('Success.', {}));
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}