'use strict';

var app = angular.module('timeConsole',['ui.router','ngFileUpload','angular-crypto'], function($httpProvider) {
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
    $httpProvider.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
});
app.run(//
    ['$rootScope', '$state', '$stateParams',
        function ($rootScope, $state, $stateParams) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
        }
    ]
);

app.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/upload');
    $stateProvider
        .state('upload', {
            url: '/upload',
            templateUrl: 'partials/upload.html',
            controller: 'UploadController'
        })
});


app.service('S3Upload',function ($http,$q,Upload,$rootScope,$timeout) {
    var self = this;
    var evaporate_all = null;

    this.singleUpload = function (options,file) {
        let bucket = options.bucket || "timeinc-test3";
        //let file = files;
        let brand = options.brand || "ti-images";
        $http.post('/upload/getS3Policy',{'bucket':bucket})
            .then(function (response) {
                let s3Params = response.data;
                Upload.upload({
                    url:'https://' + bucket + '.s3.amazonaws.com/',
                    method: 'POST',
                    headers:{
                        'Content-Type':undefined,
                        'Authorization':"",
                        "Access-Control-Allow-Origin":"*"
                    },
                    transformRequest: function (data, headersGetter) {
                        //Headers change here
                        var headers = headersGetter();
                        delete headers['Authorization'];
                        return data;
                    },
                    data: {
                        'key' : brand + '/' + file.name,
                        'acl' : 'public-read',
                        'Content-Type' : file.type,
                        'AWSAccessKeyId': s3Params.AWSAccessKeyId,
                        'success_action_status' : '201',
                        'Policy' : s3Params.s3Policy,
                        'Signature' : s3Params.s3Signature
                    },
                    file: file
                }).then(
                    function (response) {
                        console.log("response:"+response);
                        // $scope.progress.progress = 100;
                        if(response.status==201){
                            console.log("Upload to AWS S3 successfully.");
                        }
                        else{
                            console.log("Upload to AWS S3 failed!");
                        }
                    },function () {
                        console.log("Upload to AWS S3 failed.");
                    },function (evt) {
                        file.progress =  parseInt(100.0 * evt.loaded / evt.total);
                    }
                )
            })
    };
    
    this.getS3Policy = function (bucket) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        $http.post('/upload/getS3Policy',{'bucket':bucket})
            .then(function (response) {
                deferred.resolve(response)
            },function (err) {
                console.log("An error happened",err);
                deferred.reject();
                }
            );
        return promise;
    }

    function readableFileSize(size) {
        if(typeof  size =='undefined'){
            return 0;
        }else{
            var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = 0;

            while(size >= 1024)
            {
                size /= 1024;
                ++i;
            }

            return size.toFixed(2).replace('.00','')+ ' ' + units[i]+'/s';
        }

    }

    this.multiUpload = function (multiOptions,file) {
        //let file = file;
        let bucket = multiOptions.bucket;
        let fileName = multiOptions.brand + '/'+file.name;
        let config = {
            signerUrl: multiOptions.signerUrl,
            aws_key: multiOptions.aws_key,
            awsRegion: multiOptions.aws_region,
            bucket: bucket,
            aws_url: 'https://s3.amazonaws.com',
            partSize: multiOptions.partSize,
            maxConcurrentParts: multiOptions.maxConcurrentParts,
            awsSignatureVersion: '4',
            computeContentMd5: true,
            cryptoMd5Method: function (data) { return AWS.util.crypto.md5(data, 'base64'); },
            cryptoHexEncodedHash256: function (data) {return AWS.util.crypto.sha256(data, 'hex'); }
        };

        return Evaporate.create(config)
            .then(function (evaporate) {
                evaporate_all=evaporate;
                let addConfig = {
                    name: fileName,
                    file: file,
                    contentType: file.type,
                    xAmzHeadersAtInitiate: {
                        'x-amz-acl': 'public-read'
                    },
                    progress: function (progressValue,stats) {
                        file.progress =  (Math.round((progressValue * 100) * 100) / 100);
                        var currentTime            = Date.now();
                        var progressRemaining      = (100 - file.progress);
                        var progressionRate        = (progressRemaining / file.progress);
                        var timeToCurrentPosition  = (currentTime - timeStarted);
                        $rootScope.remainTime = Math.round((progressionRate * timeToCurrentPosition) / 1000);
                        if(stats.speed!=undefined&&stats.speed<2*1024*1024*1024){
                            $rootScope.speed = readableFileSize(stats.speed);
                            $timeout();
                        }
                    },

                    complete: function (_xhr, awsKey) {
                        $rootScope.remainTime=0;
                        file.progress=100;
                        $timeout.cancel();
                        console.log('Complete!');
                    },
                    error: function (msg) {console.log("an error happened!",msg)},
                    cancelled: function () {
                        file.progress=0;
                        console.log("Cancel successfully!")
                    },
                    paused: function () {
                        console.log("Pause successfully!")
                    }
                };
                let overrides = {
                    bucket:multiOptions.bucket
                };
                var timeStarted = Date.now();
                evaporate.add(addConfig,overrides)
                    .then(function (awsObjectKey) {
                            file.progress=100;
                            console.log('File successfully uploaded to:', awsObjectKey);
                        },
                        function (reason) {
                            console.log('File did not upload sucessfully:', reason)
                        })
            })

    };

    this.abortMulti = function () {
        evaporate_all.cancel();
    };

    this.pauseMulti = function(multiOptions,file){
        evaporate_all.pause(multiOptions.bucket+'/'+multiOptions.brand + '/'+file.name,{force:true});
    };

    this.resumeMulti = function () {
        evaporate_all.resume();
    }
});