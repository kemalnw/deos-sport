const path = require("path");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const Sentry = require('@sentry/node');

exports.sendEmail = async (payload) => {
    try {
        const smtpConfig = {
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
              user: process.env.MAIL_USERNAME,
              pass: process.env.MAIL_PASSWORD
            }
        };
        
        let handlebarsOption = {
            viewEngine: {
              extName: ".ejs",
              partialsDir: path.resolve("./views/emails"),
              layoutsDir: path.resolve("./views/emails"),
              defaultLayout: payload.defaultLayout
            },
            viewPath: path.resolve("./views/emails"),
            extName: ".ejs"
        };
        
        let mailConfig = {
            from: payload.from,
            to: payload.to,
            subject: payload.subject,
            template: payload.template,
            context: payload.context
        };
        
        let transporter = await nodemailer
            .createTransport(smtpConfig)
            .use("compile", hbs(handlebarsOption));
        
        await transporter.sendMail(mailConfig);
    }
    catch (err) {
        Sentry.captureException(err);
    }
}