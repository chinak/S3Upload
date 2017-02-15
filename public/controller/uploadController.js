app.controller('UploadController',['$scope','Upload','$http','S3Upload',function ($scope,Upload,$http,S3Upload) {

    var options={
        bucket:$scope.bucket||"timeinc-test3",
        brand:$scope.brand||undefined
    };

    $scope.singleUpload = function (file) {
        S3Upload.singleUpload(options,file);

    };


    let multiOptions = {
        brand: $scope.brand || '/multi',
        aws_region: $scope.region || 'us-east-1',
        bucket: $scope.bucket || 'timeinc-test3',
        partSize: $scope.partSize || 6 * 1024 * 1024,
        maxConcurrentParts: $scope.maxConcurrentParts || 5,
        signerUrl: $scope.sign_url || '/signv4_auth',
        aws_key: $scope.aws_key||'AKIAJS76HNNVOXDODMZA'
    };


    $scope.multiUpload = function (file) {
        S3Upload.multiUpload(multiOptions,file)
    };

    $scope.abort = function () {
        S3Upload.abortMulti();
    };

    $scope.pause = function () {
        S3Upload.pauseMulti(multiOptions,$scope.file);
    };

    $scope.resume = function () {
        S3Upload.resumeMulti();
    };





}]);
