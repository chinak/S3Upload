var config=require('../../config/config');
var log4js = require('log4js');
var log4jx = require('log4jx');

var log4js = log4jx({
    path : __dirname,
    format: "[@date] [@level][@pid][@memory][@worker] @category -@data (@file:[Method: @method]:@line:@column)"
});

log4js.configure(config.log4js);

var dateFileLog = log4js.getLogger('stroage');

exports.logger = dateFileLog;

exports.use = function(app) {
    app.use(log4js.connectLogger(dateFileLog, {level:'ALL', format:':method :url'}));
};