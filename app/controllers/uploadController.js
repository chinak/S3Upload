const crypto = require('crypto')
    ,logger = require('../log/log');

exports.getS3Signature = function (req,res) {
    let bucket = req.body.bucket;
    createS3Policy(bucket,function (creds, err) {
        if (!err) {
            return res.send(200, creds.s3Signature);
        } else {
            return res.send(500, err);
        }
    });
};

exports.getS3Policy = function (req,res) {
    let bucket = req.body.bucket;
    createS3Policy(bucket,function (creds, err) {
        if (!err) {
            return res.send(200, creds);
        } else {
            return res.send(500, err);
        }
    });
};

let createS3Policy = function(bucket,callback){
    let data = new Date();
    let s3Policy = {
        'expiration': getExpiryTime(),
        'conditions': [
            ['starts-with', "$key",""],
            {'bucket': bucket},
            {'acl': 'public-read'},
            ['starts-with', '$Content-Type', ""],
            {'success_action_status' : '201'}
        ]
    };

    //Stringify and encoding the policy
    let stringPolicy = JSON.stringify(s3Policy);
    let base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');

    //fetch aws accessKeyId and secretAccessKey from system environment
    let secretAccessKey = process.env.secretAccessKey;
    let accessKeyId = process.env.accessKeyId;


    if(!secretAccessKey || !accessKeyId) {
        logger.error("aws secretAccessKey and accessKeyId should be set in system env");
    }

    let signature = crypto.createHmac('sha1', secretAccessKey)
        .update(new Buffer(base64Policy, 'utf-8')).digest('base64');

    let s3Credentials = {
        s3Policy: base64Policy,
        s3Signature: signature,
        AWSAccessKeyId: accessKeyId
    };
    callback(s3Credentials);
};

let getExpiryTime = function () {
    let _date = new Date();
    return '' + (_date.getFullYear()) + '-' + (_date.getMonth() + 1) + '-' +
        (_date.getDate() + 1) + 'T' + (_date.getHours() + 3) + ':' + '00:00.000Z';
};

