const Sentry = require('@sentry/node');
const Op = require('sequelize').Op;
const _ = require('lodash');
const User = require('../../models').users;
const serviceCrud = require('../services/crud');
const fcm = require('../../helpers/fcm');

// FCM NODE Version (deprecated)
// const message = {
//     to: 'ecEKgPV2Q7g:APA91bFMzbJ37KAW-9GpH3ybbl9hrqMcDFPjeC7dEVtPA_SQJauWnabLlQhCoJhmHBUh0gGkwCpEdslNaV-kmkFsteXlDmmaiYZxdhJcJDTEJuzvUMwnsHTrp89GQUS2aGCdWkIeupn4',
//     // to: [
//     //     'ecEKgPV2Q7g:APA91bFMzbJ37KAW-9GpH3ybbl9hrqMcDFPjeC7dEVtPA_SQJauWnabLlQhCoJhmHBUh0gGkwCpEdslNaV-kmkFsteXlDmmaiYZxdhJcJDTEJuzvUMwnsHTrp89GQUS2aGCdWkIeupn4',
//     //     'ecEKgPV2Q7g:APA91bFMzbJ37KAW-9GpH3ybbl9hrqMcDFPjeC7dEVtPA_SQJauWnabLlQhCoJhmHBUh0gGkwCpEdslNaV-kmkFsteXlDmmaiYZxdhJcJDTEJuzvUMwnsHTrp89GQUS2aGCdWkIeupn4'
//     // ],
//     notification: {
//         title: 'tes olala',
//         body: 'test ing'
//     }
// };
// await fcmNode(message);
// res.json({ message: 'Success.' });

exports.singleReceiver = async (req, res) => {
    try {
        const { email, title, body } = req.body;
        const token = await serviceCrud.findOne(User, {
            attributes: ['token_fcm'],
            where: {
                token_fcm: { [Op.ne]: null },
                email
            }
        })

        if (!token) {
            return res.status(403).json({
                message: 'token_fcm not yet registered',
                data: { email, title, body }
            });
        }

        const message = {
            token: token.token_fcm,
            notification: {
                title: title ? title : 'untitle',
                body: body ? body : 'nothing'
            }
        }
        await fcm.singleReceiver(message);
        return res.json({ message: 'Success.' });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}

exports.multiReceiver = async (req, res) => {
    try {
        const { emails, title, body } = req.body;
        let tokens = await serviceCrud.findAll(User, {
            attributes: ['token_fcm'],
            where: {
                token_fcm: { [Op.ne]: null },
                email: {
                    [Op.in]: emails
                }
            }
        })


        if (!tokens.length) {
            return res.status(403).json({
                message: 'token_fcm not yet registered',
                data: { emails, title, body }
            });
        }

        tokens = _.map(tokens, 'token_fcm');
        const message = {
            tokens,
            notification: {
                title: title ? title : 'untitle',
                body: body ? body : 'nothing'
            }
        }
        await fcm.multiReceiver(message);
        return res.json({ message: 'Success.' });
    } catch (err) {
        Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}