'use strict';

var uploadController = require('../controllers/uploadController');
module.exports = function(uploadRouter){
    uploadRouter.post('/getS3Policy',uploadController.getS3Policy);
    uploadRouter.post('/getS3Signature',uploadController.getS3Signature);
};