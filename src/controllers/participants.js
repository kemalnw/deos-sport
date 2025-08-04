const Participant = require('../../models').participants;
const ParticipantRoute = require('../../models').participant_routes;
const User = require('../../models').users;
const Complaints = require('../../models').complaints;
const Province = require('../../models').provinces;
const Regency = require('../../models').regencies;
const Event = require('../../models').events;
const EventGroup = require('../../models').event_groups;
const { errorResponse } = require('../../helpers/response');
const { sort } = require('../../helpers/filter');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const Sentry = require('@sentry/node');
const serviceCrud = require('../services/crud');
const sequelize = require('../../models/index').sequelize;
const Op = require('sequelize').Op;
const { sendEmail } = require('../../helpers/sendEmail');
const ROLE_CONSTANT = require('../../constants/roleConstant');
const bcrypt = require('bcrypt');
const { formatDayMysql } = require('../../helpers/date');
const { formatCurrency, getRandomInt} = require('../../helpers/filter');

exports.getAll = async (req, res) => {
    try {
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            sort: await sort(req.query.sort),
            search: req.query.search ? JSON.parse(req.query.search) : null,
            keyword: req.query.keyword,
            sortById: req.query.sort_by_id || false
        };
        const by_cheat = req.query.by_cheat;
        const by_complaint = req.query.by_complaint;
        const by_event = req.query.by_event ? +req.query.by_event : null;
        const by_event_group = req.query.by_event_group ? +req.query.by_event_group : null;
        const by_approved = req.query.by_approved ? req.query.by_approved : null;

        // const queryTest :

        const query = {
            where: {
                [Op.or]: [
                    { distance: { [Op.like]: `%${params.keyword}%` } },
                    { duration: { [Op.like]: `%${params.keyword}%` } },
                    { '$user.name$': { [Op.like]: `%${params.keyword}%` } },
                    { '$user.email$': { [Op.like]: `%${params.keyword}%` } },
                ],
                // [Op.and]: [
                //     { approved_by:  {[Op.not] : } }
                // ] 
            },
            include: [
                {
                    model: User,
                    // as: 'user',
                    attributes: ['id', 'name', 'email', 'path_photo', 'gender', 'cloth_size', 'cloth_width', 'cloth_length'],
                    required: true,
                    include: [Province, Regency]
                },
                {
                    model: Event,
                    attributes: ['id', 'name', 'description', 'photo'],
                    required: true
                },
                {
                    model: EventGroup,
                    attributes: ['id', 'name', 'description'],
                    required: true
                },
                {
                    model: User,
                    as: 'admin_approved',
                    attributes: ['id', 'name', 'email']
                },
            ]
        }

        // comment code di bawah bila error
        if (by_event) {
            query.where.event_id = by_event;
        } else if (by_event_group) {
            query.where.event_group_id = by_event_group;
        }

        if (by_approved) {
            if (by_approved == -1 ){ // not confirm
                // tampilkan participant yang sender_name || sender_bank || sender_rekening || nominal_user_transfer == 0
                query.where.sender_name = {
                    [Op.is]: null
                }
                query.where.payment_status = 0
            } else if (by_approved == 0 ) { // not approved
                query.where.sender_name = {
                    [Op.not]: null,
                    [Op.not]: ""
                }
                query.where.payment_status = 0
            }
            else {
                query.where.payment_status = by_approved
            }
        }

        if (by_cheat) {
            query.where.is_cheat = by_cheat;
        }
        if (by_complaint) {
            query.where.is_complaint = by_complaint;
        }
        // comment code di atas bila error
        const count = await serviceCrud.count(Participant, query);

        const paginate = await pagination(params.size, params.page, count, `/participants?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;

        // res.json({
        //     limit: paginate.size,
        //     offset: paginate.skip,
        //     order: params.sort
        // });

        query.order = params.sort;

        if (by_event) {
            query.where.event_id = by_event;
        } else if (by_event_group) {
            query.where.event_group_id = by_event_group;
        }

        const rows = await serviceCrud.findAll(Participant, query);
        const data = await paginationResponse(count, paginate, rows);

        // tambahkan data approved_by disini
        res.json(data);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.approvedBy = async (req, res) => {
    try {
        // const salt = bcrypt.genSaltSync(10);
        // var randomString = "pomad2021";
        // const password = bcrypt.hashSync(randomString, salt);
        // res.json({ randomString: randomString, password:password})

        await User.update({
            email: 'darrenzie@gmail.com'
        }, {
            where: {
                email: 'dhiar.praditya@yahoo.co.id'
            }
        });
    }
    catch (err) {
        let message = err.errors[0].message
        var uppercaseFirstLetter = message.charAt(0).toUpperCase() + message.slice(1);
        res.json({
            success: false,
            data: null,
            message: "Failed update data user. " + uppercaseFirstLetter
        });
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.get = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await serviceCrud.findOne(Participant, {
            where: {
                id: id
            },
            include: [
                {
                    model: User,
                    attributes: {
                        exclude: ['password']
                    },
                    required: true
                },
                {
                    model: Event,
                    required: true
                },
                {
                    model: EventGroup,
                    required: true
                },
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
        const { participant_no, payment_status, distance, duration, path_proof_of_payment, user_id, event_id, event_group_id } = req.body;
        const { will_buy_merchandise } = req.body;

        const data = await serviceCrud.create(Participant, {
            participant_no, payment_status, distance, duration, path_proof_of_payment, user_id, event_id, event_group_id,
            will_buy_merchandise
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
        const { participant_no, payment_status, distance, duration, path_proof_of_payment, user_id, event_id, event_group_id } = req.body;
        const { nominal_user_transfer, will_buy_merchandise } = req.body;

        await serviceCrud.update(Participant, {
            participant_no, payment_status, distance, duration, path_proof_of_payment, user_id, event_id, event_group_id,
            nominal_user_transfer, will_buy_merchandise
        }, {
            where: {
                id: id
            }
        });

        // untuk table complaint
        const { complaint_id, is_approved } = req.body;

        if (complaint_id) {
            await serviceCrud.update(Complaints, {
                is_approved
            }, {
                where: {
                    id: complaint_id
                }
            });
        }


        const updatedParticipant = await serviceCrud.findOne(Participant, {
            where: { id: id }
        })

        res.json({ message: 'Success.', data: updatedParticipant });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.confirmPayment = async (req, res) => {
    try {
        const { path_proof_of_payment, email, sender_name, sender_bank, sender_rekening, payment_status } = req.body;
        const { nominal_user_transfer } = req.body;

        const emailExist = await serviceCrud.findOne(User, {
            where: { email: email }
        })

        if (emailExist.id) {
            const participantExist = await serviceCrud.findOne(Participant, {
                where: { user_id: emailExist.id }
            })

            // approved by
            const approved_by = req.loggedInUser.id

            // jika gambar belum di-upload
            if (!path_proof_of_payment || path_proof_of_payment == null) {
                if (payment_status != 0 && payment_status != 1  && payment_status != 2) {
                    return res.status(403).json({
                        success: false,
                        message: 'Gambar belum berhasil di-load.',
                        data: null
                    });
                }
            }

            await serviceCrud.update(Participant, {
                path_proof_of_payment, sender_name, sender_bank, sender_rekening, payment_status, approved_by,
                nominal_user_transfer
            }, {
                where: {
                    id: participantExist.id
                }
            });

            const participantUpdated = await serviceCrud.findOne(Participant, {
                where: { id: participantExist.id }
            })

            const paramEmail = {
                from: "no-reply@deossport.com",
                to: email,
                subject: "Pembayaran Event Pomad Virtual Run 2021 Berhasil!",
                template: "confirm-payment",
                context: {
                    name: emailExist.name,
                    email: emailExist.email
                },
                defaultLayout: "confirm-payment.ejs"
            };
            
            if (payment_status == "1"){
                await sendEmail(paramEmail);
            }

            res.json({
                success: true,
                data: participantUpdated,
                message: 'Konfirmasi Bukti Pembayaran Berhasil.'
            });
        } else {
            return res.status(403).json({
                success: false,
                message: 'Pastikan email Anda sudah terdaftar.',
                data: null
            });
        }
        
        res.json(emailExist);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.approvePayment = async (req, res) => {
    try {
        const id = req.params.id;
        const { path_proof_of_payment, email, sender_name, sender_bank, sender_rekening, payment_status } = req.body;
        const { nominal_user_transfer } = req.body;

        const participantExist = await serviceCrud.findOne(Participant, {
            where: { id: id}
        })

        const emailExist = await serviceCrud.findOne(User, {
            where: { id: participantExist.user_id }
        })

        // approved by
        const approved_by = req.loggedInUser.id

        // jika gambar belum di-upload
        if (!path_proof_of_payment || path_proof_of_payment == null) {
            if (payment_status != 0 && payment_status != 1  && payment_status != 2) {
                return res.status(403).json({
                    success: false,
                    message: 'Gambar belum berhasil di-load.',
                    data: null
                });
            }
        }

        await serviceCrud.update(Participant, {
            path_proof_of_payment, sender_name, sender_bank, sender_rekening, payment_status, approved_by,
            nominal_user_transfer
        }, {
            where: {
                id: participantExist.id
            }
        });

        const participantUpdated = await serviceCrud.findOne(Participant, {
            where: { id: participantExist.id }
        })

        const paramEmail = {
            from: "no-reply@deossport.com",
            to: email,
            subject: "Pembayaran Event Pomad Virtual Run 2021 Berhasil!",
            template: "confirm-payment",
            context: {
                name: emailExist.name,
                email: emailExist.email
            },
            defaultLayout: "confirm-payment.ejs"
        };
        
        if (payment_status == "1"){
            await sendEmail(paramEmail);
        }

        res.json({
            success: true,
            data: participantUpdated,
            message: 'Approve Participant Berhasil.'
        });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.updateIsCheat = async (req, res) => {
    try {
        const id = req.params.id;
        const { is_cheat } = req.body;

        await serviceCrud.update(Participant, { is_cheat }, {
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

        await serviceCrud.delete(Participant, {
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

exports.criteria = async (req, res) => {
    try {
        const criteria = {
            is_cheat: 0,
            is_finish: 1,
            duration: 12 * 60, // Duration Virtual (detik)
            avg_accuracy: 100,
            distance: 4750
        }

        const event_id = req.query.event_id;
        const totalParticipants = await serviceCrud.count(Participant, {
            where: { event_id }
        })
        const totalParticipantsFinish = await serviceCrud.count(Participant, {
            where: { event_id, is_finish: 1 }
        })
        const totalParticipantsFinishUncheat = await serviceCrud.count(Participant, {
            where: { event_id, is_finish: 1, is_cheat: 0 }
        })
        const totalParticipantsFinishCheat = totalParticipantsFinish - totalParticipantsFinishUncheat;

        let participants = await serviceCrud.findAll(Participant, {
            where: {
                event_id,
                is_finish: criteria.is_finish,
                is_cheat: criteria.is_cheat,
                distance: {
                    [Op.gte]: criteria.distance
                }
            },
            // include: [
            //     {
            //         model: ParticipantRoute,
            //         attributes: [[sequelize.fn('AVG', sequelize.col('accuracy')), 'average_accuracy']],
            //         required: true,
            //         where: {
            //             accuracy: {
            //                 [Op.gt]: 0
            //             }
            //             // average_accuracy: {
            //             //     [Op.lte]: criteria.avg_accuracy
            //             // }
            //         }
            //     }
            // ],
        })

        participants = participants.filter(el => {
            return el.duration_virtual >= criteria.duration;
        })

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

        return res.json({
            "criteris": criteria,
            "total_peserta_event": totalParticipants,
            "total_peserta_event_finish": totalParticipantsFinish,
            "total_peserta_event_finish_cheat": totalParticipantsFinishCheat,
            "total_peserta_event_finish_uncheat": totalParticipantsFinishUncheat,
            data: [
                {
                    1: `duration >= ${Math.floor(criteria.duration / 60)} menit ${Math.floor(criteria.duration % 60)} detik  | distance >= ${criteria.distance} meter | akurasi <= ${criteria.avg_accuracy}`,
                    count: participantsWithAccuracy.length
                },
                {
                    2: `duration >= ${Math.floor(criteria.duration / 60)} menit ${Math.floor(criteria.duration % 60)} detik  | distance >= ${criteria.distance} meter`,
                    count: participants.length
                }
            ]
        });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.route = async (req, res) => {
    try {
        const { participant_id } = req.query || null;
        if (!participant_id) {
            res.status(422).json({ message: 'Parameter participant_id required.' });
        }

        const averageSpeed = await serviceCrud.findAll(ParticipantRoute, {
            attributes: [[sequelize.fn('AVG', sequelize.col('speed')), 'average_speed']],
            where: { participant_id }
        });
        const listSpeed = await serviceCrud.findAll(ParticipantRoute, {
            attributes: ['accuracy', 'speed', 'location'],
            where: { participant_id },
        });

        const payload = {
            average: averageSpeed[0].dataValues.average_speed ? parseFloat(averageSpeed[0].dataValues.average_speed.toFixed(2)) : 0,
            list: listSpeed
        }

        res.json(payload);
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.reschedule = async (req, res) => {
    try {
        const id = req.params.id;
        const { event_group_id } = req.body

        await serviceCrud.delete(ParticipantRoute, {
            where: {
                participant_id: id
            }
        })

        const eventGroup = await serviceCrud.findOne(EventGroup, {
            where: { id: event_group_id }
        })

        const participant = await serviceCrud.findOne(Participant, {
            where: { id: id },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email', 'path_photo', 'gender'],
                    required: true,
                }
            ]
        })

        const paramEmail = {
            from: "no-reply@deossport.com",
            to: participant.user.email,
            subject: "Reschedule Event",
            template: "reschedule",
            context: {
                event_name: eventGroup.name,
                name: participant.user.name
            },
            defaultLayout: "reschedule.ejs"
        };

        await sendEmail(paramEmail);

        await serviceCrud.update(Complaints, {
            status: 1,
        }, {
            where: {
                participant_id: id
            }
        });

        await serviceCrud.update(Participant, {
            ranking: null,
            distance: 0,
            duration: 0,
            is_finish: 0,
            finish_at: null,
            is_cheat: 0,
            cheat_counter: 0,
            event_group_id
        }, {
            where: {
                id
            }
        });

        res.json({ message: 'Success.' });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}
