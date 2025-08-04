const Sentry = require('@sentry/node');
const { uploadFile, randomName, getValidExtension } = require('../../helpers/upload');

exports.aws = async (req, res) => {
    try {
        if ( ! req.file) {
            return res.status(422).json({
                message: `Parameter file not found.`
            });
        }
        const path = req.body.path;
        const extension = await getValidExtension(req);
        const filename = await randomName(16);
        const source = req.file.path;
        const destination = `${path}/${filename}.${extension}`;
        await uploadFile(source, destination);

        res.json({
            path: destination,
            url: process.env.AWS_URL + destination
        })
    }
    catch (err) {
	Sentry.captureException(err);
        res.status(500).json(errorResponse(err));
    }
}
