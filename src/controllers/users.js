const User = require('../../models').users;
const Participant = require('../../models').participants;
const EventGroup = require('../../models').event_groups;

const Province = require('../../models').provinces;
const Regency = require('../../models').regencies;
const compareHash = require('../../helpers/comparePassword');
const { errorResponse } = require('../../helpers/response');
const { pagination, paginationResponse } = require('../../helpers/pagination');
const { formatCurrency, getRandomInt, sort , getWidthLength} = require('../../helpers/filter');
const { sendEmail } = require('../../helpers/sendEmail');
const Op = require('sequelize').Op;
const Sentry = require('@sentry/node');
const ROLE_CONSTANT = require('../../constants/roleConstant');
const jwt = require('jsonwebtoken');
const serviceCrud = require('../services/crud');
const { uploadFile, randomName, getValidExtension } = require('../../helpers/upload');
const bcrypt = require('bcrypt');
const sequelize = require('../../models/index').sequelize;

const { formatDayMysql } = require('../../helpers/date');

exports.testUniqueCode = async (req, res) => {
    try {
        // START - set unique code here
        /*
        0. Find current date
        1. cari participant hari ini, jika tidak ada, buat nominal_unique = nominal_unique (terakhir) +1
        2. cari participant hari ini, jika ada 1, buat nominal_unique = nominal_unique (current participant) + 1
        */
        // const currentDate = formatMysql(new Date());
        const currentDate = formatDayMysql(new Date());

        const salt = bcrypt.genSaltSync(10);
        var randomString = 'admin123';
        let password = bcrypt.hashSync(randomString, salt);

        res.json({result : 'success', 'password' : password})
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.importParticipant = async (req, res) => {
    try {
        const data = req.body

        if (data.count == 0) {
            res.status(500).json({
                'success' : false,
                'message' : 'Input data kosong.'
            });
        } else {
            const firstData = data[0]
            let columns = Object.keys(firstData)
            let defaultColumns = [
                "Nama",
                "Jenis Kelamin",
                "Alamat",
                "Tgl Lahir",
                "Email",
                "Phone",
                "Profesi",
                "Peringkat",
                "Jarak",
                "Durasi",
                "Keterangan",
                "Ukuran TShirt"
            ]

            let defaultGenders = [
                "laki-laki",
                "perempuan",
                "male",
                "female",
                "man",
                "woman",
                "l",
                "p"
            ]

            let valueGenders = {
                "laki-laki": "man",
                "perempuan": "woman",
                "male": "man",
                "female": "woman",
                "man": "man",
                "woman": "woman",
                "l": "man",
                "p": "woman"
            }

            let validGender = true
            let validIsCheat = true

            let checker = (arr, target) => target.every(v => arr.includes(v));

            if (!checker(columns, defaultColumns)) {
                res.status(500).json({
                    'success' : false,
                    'message' : 'Kolom tidak lengkap atau tidak sesuai dengan format.'
                });
            }
            else {
                let paramsUser = []
                // Statusnya : approved semua 
                // Merchandise : Yes semua

                data.forEach(el => {
                    let jk = el["Jenis Kelamin"]
                    jk = jk.toLowerCase()
                    jk = jk.replace(/\s/g, '');

                    let keterangan = el["Keterangan"]

                    if (!defaultGenders.includes(jk)) {
                        validGender = false
                    } else if (keterangan != 'Tidak Terindikasi Curang' && keterangan != 'Terindikasi Curang') (
                        validIsCheat = false
                    )

                    paramsUser.push({
                        role_id: 1,
                        name: el["Nama"],
                        email: el["Email"],
                        phone: el["Phone"],
                        password: "pomad2021",
                        birth_date: el["Tgl Lahir"],
                        gender: validGender == true ? valueGenders[jk] : "",
                        nationality: "Indonesia",
                        address: el["Alamat"],
                        agreement: 1,
                        profession: el["Profesi"],
                        cloth_size: el["Ukuran TShirt"],
                        is_desktop: true,
                        participant_no: "",
                        distance: el["Jarak"] == "" ? 0 : parseInt(el["Jarak"]),
                        duration: el["Durasi"] == "" ? "00:00" : el["Durasi"],
                        ranking: el["Peringkat"] == "" ? parseInt(0) : parseInt(el["Peringkat"]),
                        will_buy_merchandise: 1,
                        payment_status: 1,
                        approved_by: 1,
                        is_cheat: el["Keterangan"] ? (el["Keterangan"] == "Tidak Terindikasi Curang" ? 0 : 1) : 0 
                    })
                })

                if (!validGender) {
                    res.status(500).json({
                        'success' : false,
                        'message' : 'Format data gender salah.'
                    });
                } else if (!validIsCheat) {
                    res.status(500).json({
                        'success' : false,
                        'message' : 'Format data keterangan salah.'
                    });
                } else {
                    paramsUser.forEach(elUser => {
                        this.importData({
                            body: elUser
                        }, res)
                    })
                }
            }
        }
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.importData = async (req, res) => {
    try {
        const emailExist = await serviceCrud.findOne(User, {
            where: { email: req.body.email }
        })

        // Code Ori
        if (emailExist) {
            // res.json({ success:true , email: req.body.email,  error : "registered_email" , message: 'Email sudah terdaftar (skipped data). Success import.' });
        }

        let path_photo = req.body.path_photo;

        if (req.file) {
            const extension = await getValidExtension(req);
            const filename = await randomName(16);
            const source = req.file.path;
            const destination = `users/${filename}.${extension}`;
            path_photo = destination;

            await uploadFile(source, destination);
        }

        let { role_id, name, email, phone, password } = req.body;
        const { birth_date, gender, nationality, province_id, regency_id, address } = req.body;
        const { profession, school_major, event_reason, event_referrer, agreement } = req.body;
        const { organization_id, company_id } = req.body;
        const { cloth_size, is_desktop } = req.body;
        const { will_buy_merchandise, payment_status, distance, duration, ranking, approved_by, is_cheat } = req.body;

        const cloth_width = getWidthLength(cloth_size).cloth_width
        const cloth_length = getWidthLength(cloth_size).cloth_length

        const salt = bcrypt.genSaltSync(10);

        if (password) {
            var randomString = password;
            password = bcrypt.hashSync(password, salt);
        }
        else {
            var randomString = Math.random().toString(36).slice(-8);
            password = bcrypt.hashSync(randomString, salt);
        }

        if (!role_id) role_id = ROLE_CONSTANT.MEMBER;

        // START - set unique code here
        const currentDate = formatDayMysql(new Date());
        const lastParticipantNow = await serviceCrud.findOne(Participant, {
            attributes: ['id','user_id','nominal_unique','nominal_user_transfer','createdAt'],
            where: {
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('createdAt')),
                        '>=', currentDate + ' 00:00:00'
                    ),
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('createdAt')),
                        '<=', currentDate + ' 23:59:59'
                    )
                ]
            },
            order: [
                ['id', 'DESC']
            ]
        });

        let nominal_unique = 0
        const defaultNominal = 135000
        if (lastParticipantNow) {
            nominal_unique = parseInt(defaultNominal) + getRandomInt(1, 999)
        } else {
            nominal_unique = defaultNominal
        }
        const nominalFormatted = formatCurrency(nominal_unique)
        // END - set unique code here

        let user;

        if (!emailExist) {
            user = await serviceCrud.create(User, {
                role_id, name, email, phone, password, province_id, regency_id,
                birth_date, gender, nationality, address, path_photo,
                profession, school_major, event_reason, event_referrer, agreement,
                organization_id, company_id,
                cloth_size, cloth_width, cloth_length
            });
        }

        if (!is_desktop) { // jika di mobile
            res.json(user);
        }  else if (is_desktop) {
            
            // jika di desktop (landing-page)
            // Only on : https://pomad2021.deossport.com/
            // START - Create New Participant
            if (emailExist) {
                // no process
                res.json({ success:true , email: req.body.email,  error : "registered_email" , message: 'Email sudah terdaftar (skipped data). Success import.' });
            } else {
                let event_id = 4
                let event_group_id = 4
                const participantExist = await serviceCrud.findOne(Participant, {
                    attributes: ['participant_no'],
                    where: {
                        event_id: event_id,
                        user_id: user.id
                    },
                    order: [['createdAt', 'DESC']],
                });

                if (participantExist) {
                    res.json({ success:true , email: req.body.email,  error : "registered_email" , message: 'Email sudah terdaftar (skipped data). Success import.' });
                } else {
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
                        // Nunggu informasi dari pak Irwan untuk menjalankan API ini
                        // Ketika pertama x register, langsung di-set payment_status = 1
                        const payloadParticipant = {
                            participant_no: participantNumber,
                            distance: distance == '' || !distance ? 0 : distance,
                            duration: duration == '' || !duration ? null : duration,
                            ranking: ranking == '' || !ranking ? 0 : ranking,
                            user_id: user.id,
                            event_id,
                            event_group_id,
                            nominal_unique,
                            will_buy_merchandise,
                            payment_status,
                            approved_by,
                            is_cheat
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
                    }
                    // END - Create New Participant

                    user.nominal_unique = nominal_unique
                    user.nominal_unique_formatted = nominalFormatted

                    let dataNominal = {}
                    dataNominal["nominal_unique"] = nominal_unique
                    dataNominal["nominal_unique_formatted"] = nominalFormatted

                    res.json({user:user, nominal:dataNominal, id:user.id});
                }
            }
        }
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

// original
// exports.signUp = async (req, res) => {
//     try {
//         const emailExist = await serviceCrud.findOne(User, {
//             where: { email: req.body.email }
//         })

//         // Code Ori
//         if (emailExist) {
//             return res.status(401).json({ success:false , error : "registered_email" , message: 'Email sudah terdaftar.' });
//         }

//         let path_photo = req.body.path_photo;

//         if (req.file) {
//             const extension = await getValidExtension(req);
//             const filename = await randomName(16);
//             const source = req.file.path;
//             const destination = `users/${filename}.${extension}`;
//             path_photo = destination;

//             await uploadFile(source, destination);
//         }

//         let { role_id, name, email, phone, password } = req.body;
//         const { birth_date, gender, nationality, province_id, regency_id, address } = req.body;
//         const { profession, school_major, event_reason, event_referrer, agreement } = req.body;
//         const { organization_id, company_id } = req.body;
//         const { cloth_size, is_desktop } = req.body;

//         const cloth_width = getWidthLength(cloth_size).cloth_width
//         const cloth_length = getWidthLength(cloth_size).cloth_length

//         const salt = bcrypt.genSaltSync(10);

//         if (password) {
//             var randomString = password;
//             password = bcrypt.hashSync(password, salt);
//         }
//         else {
//             var randomString = Math.random().toString(36).slice(-8);
//             password = bcrypt.hashSync(randomString, salt);
//         }

//         if (!role_id) role_id = ROLE_CONSTANT.MEMBER;

//         // Update user jika email sudah ada
//         // if (emailExist) {
//         //     let userUpdated = await serviceCrud.update(User, {
//         //         name, password,role_id, name, phone, password, province_id, regency_id, address,
//         //         profession, school_major, event_reason, event_referrer, agreement,
//         //         cloth_size, cloth_width, cloth_length
//         //     }, {
//         //         where: {
//         //             id: emailExist.id
//         //         }
//         //     });
//         //     let paramEmail = {
//         //         from: "no-reply@deossport.com",
//         //         to: email,
//         //         subject: "Account Registration Pomad Virtual Run 2021",
//         //         template: "success-signup",
//         //         context: {
//         //             name: name,
//         //             password: randomString,
//         //             link: "https://pomad2021.deossport.com/konfirmasi.html",
//         //             nominal_unique: formatCurrency(nominal_unique)
//         //         },
//         //         defaultLayout: "success-signup.ejs"
//         //     };
//         //     await sendEmail(paramEmail);
//         //     res.json(emailExist);
//         // }
        
//         // START - set unique code here
//         const currentDate = formatDayMysql(new Date());
//         const lastParticipantNow = await serviceCrud.findOne(Participant, {
//             attributes: ['id','user_id','nominal_unique','nominal_user_transfer','createdAt'],
//             where: {
//                 [Op.and]: [
//                     sequelize.where(
//                         sequelize.fn('DATE', sequelize.col('createdAt')),
//                         '>=', currentDate + ' 00:00:00'
//                     ),
//                     sequelize.where(
//                         sequelize.fn('DATE', sequelize.col('createdAt')),
//                         '<=', currentDate + ' 23:59:59'
//                     )
//                 ]
//             },
//             order: [
//                 ['id', 'DESC']
//             ]
//         });

//         let nominal_unique = 0
//         const defaultNominal = 135000
//         if (lastParticipantNow) {
//             nominal_unique = parseInt(defaultNominal) + getRandomInt(1, 999)
//         } else {
//             nominal_unique = defaultNominal
//         }
//         const nominalFormatted = formatCurrency(nominal_unique)
//         // END - set unique code here

//         const user = await serviceCrud.create(User, {
//             role_id, name, email, phone, password, province_id, regency_id,
//             birth_date, gender, nationality, address, path_photo,
//             profession, school_major, event_reason, event_referrer, agreement,
//             organization_id, company_id,
//             cloth_size, cloth_width, cloth_length
//         });

        
//         if (!is_desktop) { // jika di mobile
//             const paramEmailMobile = {
//                 from: "no-reply@deossport.com",
//                 to: email,
//                 subject: "Account Registration Pomad Virtual Run 2021",
//                 template: "success-signup-mobile",
//                 context: {
//                     name: name,
//                     email: email,
//                     password: randomString,
//                     link: "https://pomad2021.deossport.com/konfirmasi.html",
//                     nominal_unique: nominalFormatted
//                 },
//                 defaultLayout: "success-signup-mobile.ejs"
//             };
    
//             await sendEmail(paramEmailMobile);
//             res.json(user);
//         } else if (is_desktop) { 
//             const paramEmail = {
//                 from: "no-reply@deossport.com",
//                 to: email,
//                 subject: "Account Registration Pomad Virtual Run 2021",
//                 template: "success-signup",
//                 context: {
//                     name: name,
//                     email: email,
//                     password: randomString,
//                     link: "https://pomad2021.deossport.com/konfirmasi.html",
//                     nominal_unique: nominalFormatted
//                 },
//                 defaultLayout: "success-signup.ejs"
//             };
    
//             await sendEmail(paramEmail);
    
//             // jika di desktop (landing-page)
//             // Only on : https://pomad2021.deossport.com/
//             // START - Create New Participant
//             let distance = 0

//             let event_id = 4
//             let event_group_id = 4

//             const eventGroup = await serviceCrud.findOne(EventGroup, {
//                 where: {
//                     id: event_group_id
//                 }
//             });

//             if (!eventGroup) {
//                 return res.status(403).json({ message: 'Event group not found.' });
//             }

//             const participant = await serviceCrud.findOne(Participant, {
//                 attributes: ['participant_no'],
//                 where: {
//                     event_id: event_id
//                 },
//                 order: [['createdAt', 'DESC']],
//             });

//             let participantNo;
//             if (participant) {
//                 const numberPattern = /[0-9]+/g;
//                 participantNo = participant.participant_no.match(numberPattern);
//             }
//             else {
//                 participantNo = 0;
//             }

//             if (eventGroup.remaining_quota > 0) {
//                 // generate participant_no
//                 // const quota = eventGroup.max_quota - eventGroup.remaining_quota + 1;
//                 const quota = parseInt(participantNo, 10) + 1;
//                 const quotaLength = quota.toString().length;
//                 let participantNumber;
//                 switch (quotaLength) {
//                     case 1:
//                         participantNumber = '000' + quota.toString();
//                         break;
//                     case 2:
//                         participantNumber = '00' + quota.toString();
//                         break;
//                     case 3:
//                         participantNumber = '0' + quota.toString();
//                         break;
//                     default:
//                         participantNumber = quota.toString();
//                         break;
//                 }
//                 // end generate participant no

//                 // Insert participant
//                 const payloadParticipant = {
//                     participant_no: participantNumber,
//                     distance: distance,
//                     user_id: user.id,
//                     event_id: event_id,
//                     event_group_id: event_group_id,
//                     nominal_unique: nominal_unique
//                 };

//                 await serviceCrud.create(Participant, payloadParticipant);
//             }
//             // END - Create New Participant

//             user.nominal_unique = nominal_unique
//             user.nominal_unique_formatted = nominalFormatted

//             let dataNominal = {}
//             dataNominal["nominal_unique"] = nominal_unique
//             dataNominal["nominal_unique_formatted"] = nominalFormatted

//             res.json({user:user, nominal:dataNominal, id:user.id});
//         }
//     }
//     catch (err) {
//         Sentry.captureException(err);
//         res.status(500).json(errorResponse(err));
//     }
// }


// update code special
exports.signUp = async (req, res) => {
    try {
        const emailExist = await serviceCrud.findOne(User, {
            where: { email: req.body.email }
        })

        // Code Ori
        if (emailExist) {
            return res.status(401).json({ success:false , error : "registered_email" , message: 'Email sudah terdaftar.' });
        }

        let path_photo = req.body.path_photo;

        if (req.file) {
            const extension = await getValidExtension(req);
            const filename = await randomName(16);
            const source = req.file.path;
            const destination = `users/${filename}.${extension}`;
            path_photo = destination;

            await uploadFile(source, destination);
        }

        let { role_id, name, email, phone, password } = req.body;
        const { birth_date, gender, nationality, province_id, regency_id, address } = req.body;
        const { profession, school_major, event_reason, event_referrer, agreement } = req.body;
        const { organization_id, company_id } = req.body;
        const { cloth_size, is_desktop } = req.body;
        const { will_buy_merchandise, payment_status, distance, duration, ranking, approved_by, is_cheat } = req.body;

        const cloth_width = getWidthLength(cloth_size).cloth_width
        const cloth_length = getWidthLength(cloth_size).cloth_length

        const salt = bcrypt.genSaltSync(10);

        if (password) {
            var randomString = password;
            password = bcrypt.hashSync(password, salt);
        }
        else {
            var randomString = Math.random().toString(36).slice(-8);
            password = bcrypt.hashSync(randomString, salt);
        }

        if (!role_id) role_id = ROLE_CONSTANT.MEMBER;

        // START - set unique code here
        const currentDate = formatDayMysql(new Date());
        const lastParticipantNow = await serviceCrud.findOne(Participant, {
            attributes: ['id','user_id','nominal_unique','nominal_user_transfer','createdAt'],
            where: {
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('createdAt')),
                        '>=', currentDate + ' 00:00:00'
                    ),
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('createdAt')),
                        '<=', currentDate + ' 23:59:59'
                    )
                ]
            },
            order: [
                ['id', 'DESC']
            ]
        });

        let nominal_unique = 0
        const defaultNominal = 135000
        if (lastParticipantNow) {
            nominal_unique = parseInt(defaultNominal) + getRandomInt(1, 999)
        } else {
            nominal_unique = defaultNominal
        }
        const nominalFormatted = formatCurrency(nominal_unique)
        // END - set unique code here

        const user = await serviceCrud.create(User, {
            role_id, name, email, phone, password, province_id, regency_id,
            birth_date, gender, nationality, address, path_photo,
            profession, school_major, event_reason, event_referrer, agreement,
            organization_id, company_id,
            cloth_size, cloth_width, cloth_length
        });

        if (!is_desktop) { // jika di mobile
            const paramEmailMobile = {
                from: "no-reply@deossport.com",
                to: email,
                subject: "Account Registration Pomad Virtual Run 2021",
                template: "success-signup-mobile",
                context: {
                    name: name,
                    email: email,
                    password: randomString,
                    link: "https://pomad2021.deossport.com/konfirmasi.html",
                    nominal_unique: nominalFormatted
                },
                defaultLayout: "success-signup-mobile.ejs"
            };
    
            await sendEmail(paramEmailMobile);
            res.json(user);
        }  else if (is_desktop) {
            const paramEmail = {
                from: "no-reply@deossport.com",
                to: email,
                subject: "Account Registration Pomad Virtual Run 2021",
                template: will_buy_merchandise == 1 ? "success-signup" : "success-signup-special",
                context: {
                    name: name,
                    email: email,
                    password: randomString,
                    link: "https://pomad2021.deossport.com/konfirmasi.html",
                    nominal_unique: nominalFormatted
                },
                defaultLayout: will_buy_merchandise == 1 ? "success-signup.ejs" : "success-signup-special.ejs"
            };
    
            await sendEmail(paramEmail);
    
            // jika di desktop (landing-page)
            // Only on : https://pomad2021.deossport.com/
            // START - Create New Participant

            let event_id = 4
            let event_group_id = 4

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
                // Nunggu informasi dari pak Irwan untuk menjalankan API ini
                // Ketika pertama x register, langsung di-set payment_status = 1
                const payloadParticipant = {
                    participant_no: participantNumber,
                    distance: distance == '' || !distance ? 0 : distance,
                    duration: duration == '' || !duration ? null : duration,
                    ranking: ranking == '' || !ranking ? 0 : ranking,
                    user_id: user.id,
                    event_id,
                    event_group_id,
                    nominal_unique,
                    will_buy_merchandise,
                    payment_status,
                    approved_by,
                    is_cheat
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
            }
            // END - Create New Participant

            user.nominal_unique = nominal_unique
            user.nominal_unique_formatted = nominalFormatted

            let dataNominal = {}
            dataNominal["nominal_unique"] = nominal_unique
            dataNominal["nominal_unique_formatted"] = nominalFormatted

            res.json({user:user, nominal:dataNominal, id:user.id});
        }
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await serviceCrud.findOne(User, {
            where: { email }
        });

        if (user) {
            if (compareHash(password, user.password)) {
                if (!req.allowedRoles.includes(user.role_id)) {
                    return res.status(401)
                        .json({ message: `you not authorized` })
                }

                const payload = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role_id: user.role_id
                }
                const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
                const cloneUser = JSON.parse(JSON.stringify(user))
                delete cloneUser.password;
                return res.json({ user: cloneUser, token })
            }
        }

        res.status(401)
            .json({ message: `email / password salah !` });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.me = async (req, res) => {
    try {
        const user = await User.findByPk(req.loggedInUser.id, {
            attributes: {
                exclude: ['password']
            },
            include: ['province', 'regency', 'organization', 'company']
        });

        // const query = {
        //     user_id: user.id
        // }

        // const distance = await serviceCrud.findAll(Participant, {
        //     attributes: [[sequelize.fn('sum', sequelize.col('distance')), 'total']],
        //     where: query
        // });
        // const distanceKilometer = distance[0].dataValues.total / 1000;
        // const totalDistance = distanceKilometer.toFixed(2);

        // const participants = await serviceCrud.findAll(Participant, {
        //     attributes: ['duration'],
        //     where: query
        // });

        // let totalMinute = 0, totalSecond = 0;
        // for (participant of participants) {
        //     const duration = participant.duration.split(':');
        //     const minutes = parseInt(duration[0]);
        //     const seconds = parseInt(duration[1]);
        //     totalMinute += minutes;
        //     totalSecond += seconds;
        //     if (totalSecond > 60) {
        //         totalMinute += 1;
        //         totalSecond -= 60;
        //     }
        // }
        // const totalDuration = totalMinute + ':' + totalSecond;

        // user.setDataValue('total_duration', totalDuration);
        // user.setDataValue('total_distance', totalDistance);

        res.json(user);
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.getAll = async (req, res) => {
    try {
        const params = {
            size: req.query.size || 10,
            page: req.query.page || 1,
            sort: await sort(req.query.sort)
        };
        const by_role = req.query.by_role ? +req.query.by_role : null;
        const by_organization = req.query.by_organization ? +req.query.by_organization : null;
        const by_company = req.query.by_company ? +req.query.by_company : null;
        const by_province_id = req.query.by_province_id ? +req.query.by_province_id : null;
        const by_regency_id = req.query.by_regency_id ? +req.query.by_regency_id : null;
        const keyword = req.query.keyword ? req.query.keyword : '';
        const query = {
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${keyword}%` } },
                    { phone: { [Op.like]: `%${keyword}%` } },
                    { email: { [Op.like]: `%${keyword}%` } },
                    { gender: { [Op.like]: `%${keyword}%` } },
                    { nationality: { [Op.like]: `%${keyword}%` } },
                    { address: { [Op.like]: `%${keyword}%` } },
                ]
            },
            include: [
                {
                    model: Province,
                },
                {
                    model: Regency,
                }
            ]
        }
        if (by_organization) {
            query.where.organization_id = by_organization;
        }
        else if (by_company) {
            query.where.company_id = by_company;
        }

        if (by_role) {
            query.where.role_id = by_role;
        }
        if (by_province_id) {
            query.where.province_id = by_province_id;
        }
        if (by_regency_id) {
            query.where.regency_id = by_regency_id;
        }
        const count = await serviceCrud.count(User, query);

        const paginate = await pagination(params.size, params.page, count, `/users?`);
        query.limit = paginate.size;
        query.offset = paginate.skip;
        query.order = params.sort;
        query.attributes = {
            exclude: ['password']
        }

        const rows = await serviceCrud.findAll(User, query);
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
        const user = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password']
            }
        });
        res.json(user);
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.update = async (req, res) => {
    try {
        const user = req.loggedInUser;
        let idUser = req.params.id || null;
        if (!idUser) {
            idUser = user.id
        }
        const { role_id, name, email, phone, password } = req.body;
        const { birth_date, gender, nationality, province_id, regency_id, address } = req.body;
        const { profession, school_major, path_photo } = req.body;
        const { cloth_size } = req.body;

        let cloth_width = user.cloth_width
        let cloth_length = user.cloth_length

        if (cloth_size && cloth_size != null && cloth_size != undefined) {
            cloth_width = getWidthLength(cloth_size).cloth_width
            cloth_length = getWidthLength(cloth_size).cloth_length
        }

        await User.update({
            role_id, name, email, phone, password,
            birth_date, gender, nationality, province_id, regency_id, address,
            profession, school_major, path_photo, cloth_size, cloth_width, cloth_length
        }, {
            where: {
                id: idUser
            }
        });

        let userUpdated = await serviceCrud.findOne(User, {
            where: {
                id: idUser
            }
        });
        userUpdated = userUpdated.toJSON();
        delete userUpdated.password;

        res.json({
            success: true,
            data: userUpdated,
            message: "Success update data user."
        });
    }
    catch (err) {
        Sentry.captureException(err);
        // res.status(500).json(errorResponse(err));
        let message = err.errors[0].message
        var uppercaseFirstLetter = message.charAt(0).toUpperCase() + message.slice(1);
        res.json({
            success: false,
            data: null,
            message: "Member / user gagal disimpan. " + uppercaseFirstLetter
        });
    }
}

exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        const user = await serviceCrud.findOne(User, {
            where: { id: req.loggedInUser.id }
        });

        if (compareHash(current_password, user.password)) {
            if (new_password !== confirm_password) {
                return res.status(422).json({ message: 'Konfirmasi kata sandi tidak sesuai.' });
            }

            const salt = bcrypt.genSaltSync(10);
            const password = bcrypt.hashSync(new_password, salt);

            await serviceCrud.update(User, {
                password
            }, {
                where: {
                    id: user.id
                }
            });
        }
        else {
            return res.status(422).json({ message: 'Kata sandi terakhir tidak sesuai.' });
        }

        res.json({ message: 'Kata sandi berhasil diubah.' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.forgetPassword = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({
            where: { email }
        })

        if (user) {
            const salt = bcrypt.genSaltSync(10);
            const randomString = Math.random().toString(36).slice(-8);
            const password = bcrypt.hashSync(randomString, salt);

            const response =
                await User.update({ password }, {
                    where: { id: user.id }
                });

            if (response[0]) {
                // SEND EMAIL
                const paramEmail = {
                    from: "no-reply@deossport.com",
                    to: email,
                    subject: "Forget Password",
                    template: "forget-password",
                    context: {
                        name: user.name,
                        email,
                        password: randomString
                    },
                    defaultLayout: "forget-password.ejs"
                };
                await sendEmail(paramEmail);

                return res.json({ message: 'Silahkan cek email Anda' });
            }
            return res.status(422).json({ message: 'Akun tidak ditemukan' });
        }
        res.status(422).json({ message: 'Akun tidak ditemukan' });
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.delete = async (req, res) => {
    try {
        const id = req.params.id;

        await serviceCrud.delete(User, {
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

exports.registerTokenFcm = async (req, res) => {
    try {
        const user = req.loggedInUser;
        const { token } = req.body;
        if (!token) {
            return res.status(403).json({
                message: 'token is required',
            });
        }

        await serviceCrud.update(User,
            {
                token_fcm: token
            },
            {
                where: { id: user.id }
            })

        res.json({ message: 'Success.' });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}