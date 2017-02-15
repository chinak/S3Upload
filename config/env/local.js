
module.exports = {
    log4js:{
        "appenders": [
            {
                "type": "dateFile",
                "filename":__dirname + "/../../logs/storage.log",
                "pattern":"-yyyy-MM-dd",
                "alwaysIncludePattern":false,
                "category" : "storage"
            },
            {
                "type": "console"
            }
        ],
        "replaceConsole": true,
        "levels": {
            "dateFileLog": "INFO"
        }
    }
}