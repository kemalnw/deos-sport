const AWS = require('aws-sdk');
const fs = require('fs');
const Sentry = require('@sentry/node');
const Promise = require('promise');
const crypto = require('crypto');
const mime = require('mime-types');
//AWS.config.update({
//    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//    region: process.env.AWS_DEFAULT_REGION
//});

const spacesEndpoint = new AWS.Endpoint('sfo2.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
});

exports.randomName = (length) => {
    return crypto.randomBytes(length).toString("hex");
}

exports.uploadFile = (source, destination) => {
    return new Promise((resolve, reject) => {
        fs.readFile(source, function (err, filedata) {
            if (!err) {
                const putParams = {
                    Bucket: process.env.AWS_BUCKET,
                    Key: destination,
                    Body: filedata,
		    ACL: 'public-read',
		    ContentType: mime.lookup(source)
                };

                s3.putObject(putParams, async function(err, data){
                    if (err) {
                        Sentry.captureException(err);
                        reject(err);
                    }
                    else {
                        await fs.unlinkSync(source);
                        resolve(data);
                    }
                });
            }
            else {
                Sentry.captureException(err);
                reject(err);
            }
        });  
    })
};

exports.getValidExtension = (req) => {
    const formatAllowed = ["jpg", "jpeg", "png"];
  
    const ext = req.file.originalname
      .substr(req.file.originalname.lastIndexOf(".") + 1)
      .toLowerCase();
  
    if (formatAllowed.indexOf(ext) > -1) {
      return ext;
    } else {
      throw (message = "File format doesn't valid");
    }
};
