const Sentry = require('@sentry/node');
const { errorResponse } = require('../../helpers/response');
const { exportExcel } = require('../../helpers/exporter');
const serviceCrud = require('../services/crud');
const { formatBirthDate } = require('../../helpers/date');
const ROLE_CONSTANT = require('../../constants/roleConstant');
const Op = require('sequelize').Op;
const sequelize = require('../../models/index').sequelize;
const User = require('../../models').users;
const { formatCurrency } = require('../../helpers/filter');

exports.excel = async (req, res) => {
    try {
        let startDate = req.query.start_date;
        let endDate = req.query.end_date;
        let table = req.params.table;
        const Model = require('../../models')[table];

        let columns, rows, filename;
        let number = 0;
        switch (table) {
            case 'users':
                filename = 'Member.xlsx';
                columns = [
                    { header: 'No', key: 'number' },
                    { header: 'Nama', key: 'name' },
                    { header: 'Tgl Lahir', key: 'birth_date', style: { numFmt: 'dd/mm/yyyy' } },
                    { header: 'Email', key: 'email' },
                    { header: 'Phone', key: 'phone' },
                    { header: 'Jenis Kelamin', key: 'gender' },
                    { header: 'Kebangsaan', key: 'nationality' },
                    { header: 'Provinsi', key: 'province' },
                    { header: 'Kabupaten/Kota', key: 'regency' },
                    { header: 'Alamat', key: 'address' },
                    { header: 'Profesi', key: 'profession' },
                    { header: 'Program Studi', key: 'school_major' },
                    { header: 'Dibuat Pada', key: 'createdAt', style: { numFmt: 'dd/mm/yyyy' } },
                    { header: 'Ukuran TShirt', key: 'cloth_size' }
                ];
                rows = await serviceCrud.findAll(Model, {
                    where: {
                        [Op.and]: [
                            { role_id: ROLE_CONSTANT.MEMBER },
                            sequelize.where(
                                sequelize.fn('DATE', sequelize.col('createdAt')),
                                '>=', startDate + ' 00:00:00'
                            ),
                            sequelize.where(
                                sequelize.fn('DATE', sequelize.col('createdAt')),
                                '<=', endDate + ' 00:00:00'
                            )
                        ]
                    },
                    include: ['province', 'regency']
                });
                for (const row of rows) {
                    number += 1;
                    let genderLabel;
                    if (row.gender === 'man') {
                        genderLabel = 'Laki - laki';
                    } else if (row.gender === 'woman') {
                        genderLabel = 'Perempuan';
                    }

                    row.setDataValue('number', number);
                    row.setDataValue('gender', genderLabel);
                    row.setDataValue('birth_date', formatBirthDate(row.birth_date));
                    row.setDataValue('createdAt', formatBirthDate(row.createdAt));
                    if (row.province) {
                        row.setDataValue('province', row.province.province);
                    }
                    if (row.regency) {
                        row.setDataValue('regency', row.regency.city_name);
                    }
                    row.setDataValue('cloth_size', row.cloth_size + ' ( W '+ row.cloth_width +' x L '+row.cloth_length+' )');
                }
                break;
            case 'participants':
                const { event_id, event_group_id, by_approved } = req.query;
                filename = `Participants_${event_id}.xlsx`;
                columns = [
                    { header: 'No', key: 'number' },
                    { header: 'Nomor Peserta', key: 'participant_no' },
                    { header: 'Nama', key: 'name' },
                    { header: 'Jenis Kelamin', key: 'gender' },
                    { header: 'Provinsi', key: 'province' },
                    { header: 'Kabupaten/Kota', key: 'regency' },
                    { header: 'Alamat', key: 'address' },
                    { header: 'Tgl Lahir', key: 'birth_date', style: { numFmt: 'dd/mm/yyyy' } },
                    { header: 'Email', key: 'email' },
                    { header: 'Phone', key: 'phone' },
                    { header: 'Profesi', key: 'profession' },
                    { header: 'Peringkat', key: 'ranking' },
                    { header: 'Jarak', key: 'distance' },
                    { header: 'Durasi', key: 'duration' },
                    { header: 'Keterangan', key: 'is_cheat' },
                    { header: 'Ukuran TShirt', key: 'cloth_size' },
                    { header: 'Sender Bank', key: 'sender_bank' },
                    { header: 'Sender Rekening', key: 'sender_rekening' },
                    { header: 'Sender Name', key: 'sender_name' },
                    { header: 'Nominal Unik', key: 'nominal_unique' },
                    { header: 'Nominal Transfer', key: 'nominal_user_transfer' },
                    { header: 'Approved Status', key: 'approved_by' },
                    { header: 'Buy Merchandise', key: 'will_buy_merchandise' }
                ];

                const queryHasRanking = {
                    attributes: ['participant_no', 'ranking', 'payment_status', 'distance', 'duration', 'is_cheat', 'sender_name', 'sender_bank' , 'sender_rekening' , 'nominal_unique', 'nominal_user_transfer', 'approved_by', 'user_id', 'event_id', 'event_group_id', 'will_buy_merchandise'],
                    where: {
                        event_id,
                        ranking: { [Op.ne]: null }
                    },
                    include: [
                        {
                            model: User,
                            attributes: ['name', 'gender', 'birth_date', 'email', 'phone', 'profession', 'address', 'cloth_size', 'cloth_width', 'cloth_length'],
                            required: true,
                            include: ['province', 'regency']
                        }
                    ],
                    order: [
                        // ['user_id', 'ASC'],
                        ['ranking', 'ASC']
                    ]
                };
                const queryNoRanking = {
                    attributes: ['participant_no', 'ranking', 'payment_status', 'distance', 'duration', 'is_cheat', 'sender_name', 'sender_bank' , 'sender_rekening','nominal_unique', 'nominal_user_transfer', 'approved_by', 'user_id', 'event_id', 'event_group_id', 'will_buy_merchandise'],
                    where: {
                        event_id,
                        ranking: null
                    },
                    include: [
                        {
                            model: User,
                            attributes: ['name', 'gender', 'birth_date', 'email', 'phone', 'profession', 'address', 'cloth_size', 'cloth_width', 'cloth_length'],
                            required: true,
                            include: ['province', 'regency']
                        }
                    ]
                };
                if (event_group_id) {
                    queryHasRanking.where.event_group_id = event_group_id;
                    queryNoRanking.where.event_group_id = event_group_id;

                    filename = `Participants_${event_id}_${event_group_id}.xlsx`;
                }

                if (by_approved && by_approved != null) 
                {
                    if (by_approved == -1 ){ // not confirm
                        queryHasRanking.where.sender_name = {
                            [Op.is]: null
                        }
                        queryHasRanking.where.payment_status = 0
                        // ---------------------------------------------------
                        queryNoRanking.where.sender_name = {
                            [Op.is]: null
                        }
                        queryNoRanking.where.payment_status = 0
                    }
                    else if (by_approved == 0) { // not approved
                        queryHasRanking.where.payment_status = by_approved
                        queryHasRanking.where.sender_name = {
                            [Op.not]: null,
                            [Op.not]: ""
                        }
                        // ----------------------------------------------------
                        queryNoRanking.where.payment_status = by_approved
                        queryNoRanking.where.sender_name = {
                            [Op.not]: null,
                            [Op.not]: ""
                        }
                    }
                    // jika rejected (2) atau approved
                    else {
                        queryHasRanking.where.payment_status = by_approved
                        queryNoRanking.where.payment_status = by_approved
                    }
                }

                const participantsHasRanking = await serviceCrud.findAll(Model, queryHasRanking);
                const participantsNoRanking = await serviceCrud.findAll(Model, queryNoRanking);
                rows = participantsHasRanking.concat(participantsNoRanking);

                for (const row of rows) {
                    number += 1;
                    let isCheat = row.is_cheat ? 'Terindikasi Curang' : 'Tidak Terindikasi Curang';
                    let genderLabel;
                    if (row.user.gender === 'man') {
                        genderLabel = 'Laki - laki';
                    } else if (row.user.gender === 'woman') {
                        genderLabel = 'Perempuan';
                    }

                    let nominal_unique = row.nominal_unique
                    nominal_unique = isNaN(nominal_unique) ? 0 : parseInt(nominal_unique)

                    let nominal_user_transfer = row.nominal_user_transfer
                    nominal_user_transfer = isNaN(nominal_user_transfer) ? 0 : parseInt(nominal_user_transfer)

                    row.setDataValue('number', number);
                    row.setDataValue('name', row.user.name);
                    row.setDataValue('birth_date', formatBirthDate(row.user.birth_date));
                    row.setDataValue('gender', genderLabel);
                    row.setDataValue('email', row.user.email);
                    row.setDataValue('phone', row.user.phone);
                    row.setDataValue('profession', row.user.profession);
                    row.setDataValue('is_cheat', isCheat);
                    // row.setDataValue('createdAt', formatBirthDate(row.createdAt));

                    row.setDataValue('address', row.user.address);
                    if (row.user.province) {
                        row.setDataValue('province', row.user.province.province);
                    }
                    if (row.user.regency) {
                        row.setDataValue('regency', row.user.regency.city_name);
                    }
                    row.setDataValue('cloth_size', row.user.cloth_size + ' ( W '+ row.user.cloth_width +' x L '+row.user.cloth_length+' )');

                    row.setDataValue('sender_name', row.sender_name);
                    row.setDataValue('sender_bank', row.sender_bank);
                    row.setDataValue('sender_rekening', row.sender_rekening);
                    row.setDataValue('nominal_unique', formatCurrency(nominal_unique ));
                    row.setDataValue('nominal_user_transfer',formatCurrency(nominal_user_transfer));

                    if (row.payment_status == "1") {
                        row.setDataValue('approved_by', "Approved");
                    } 
                    else if (row.sender_name && row.payment_status == "0") {
                        row.setDataValue('approved_by', "Not Approved");
                    }
                    else if (row.payment_status == "2") {
                        row.setDataValue('approved_by', "Rejected");
                    }
                    else {
                        row.setDataValue('approved_by', "Not Confirm");
                    }

                    // will_buy_merchandise
                    row.setDataValue('will_buy_merchandise', row.will_buy_merchandise == 1 ? 'Yes' : 'No' );
                }
                break;
            default:
                return res.status(422).json({ message: 'Ada parameter yang kurang.' });
                break;
        }

        rows = JSON.parse(JSON.stringify(rows));
        const workbook = await exportExcel(table, columns, rows);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader("Content-Disposition", "attachment; filename=" + filename);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}