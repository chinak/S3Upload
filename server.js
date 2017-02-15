
var express = require('express');

var bodyParser = require('body-parser');
var crypto = require('crypto');
var http = require('http');

var config = require(__dirname +'/config/config');
var createHmac     = require(__dirname +'/public/lib/createHmac');
var aws_secret_key = process.env.secretAccessKey;
var aws_access_key = process.env.accessKeyId;
var algorithm      = 'sha1';
var encoding       = 'base64';
var app = express();
var uploadRouter = express.Router();

var logger = require(__dirname+'/app/log/log').logger;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
app.set('port',process.env.PORT||config.port);



app.use(config.baseUrl, express.static(__dirname + '/public'));

//set Routes
app.use('/upload',uploadRouter);

app.get('/', function(req, res){
    res.sendFile(__dirname+'/public/index.html');
});

function hmac(key, value) {
    return crypto.createHmac('sha256', key).update(value).digest();
}

function hexhmac(key, value) {
    return crypto.createHmac('sha256', key).update(value).digest('hex');
}

app.use('/signv4_auth', function (req, res) {
    const timestamp = req.query.datetime.substr(0, 8);

    const date = hmac('AWS4' + aws_secret_key, timestamp);
    const region = hmac(date, 'us-east-1');
    const service = hmac(region, 's3');
    const signing = hmac(service, 'aws4_request');

    res.send(hexhmac(signing, req.query.to_sign));
});


var uploadRoute = require("./app/routes/uploadRoute")(uploadRouter);
http.createServer(app).listen(app.get('port'), function(){
    logger.info('Time Inc console server listening on port ' + app.get('port'));
});