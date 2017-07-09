var express = require('express');
var router = express.Router();
var config = require('../config/config');
var multer = require('multer');
var request = require('request');
var common = require('../routes/common');


var urlStorage = common.getStorageUrl();

var upload = multer({
    inMemory: config.storage.inMemoryFileUpload
});

module.exports = router;

/**
 * File image upload
 *
 * This route is used to handle <b>multipart</b> single file upload request.
 * It sends the file to storage server and saves message with url to message collection.
 *
 * It expects to have body of image message without url in it's content.
 */
router.post("/", upload.single('image'), function (httpRequest, httpResponse, next) {
    var file = httpRequest.file;
    var msg = JSON.parse(httpRequest.body.message);
    var error = validateInput(msg, file);

    if(error) {
        return next(error);
    }

    uploadImageToStorage(msg, file);

    // *******************
    //      Functions
    // *******************

    function validateHttpRequest(msg) {
        var error = common.validateMessage(msg);

        if (error) {
            // Bad Request
            error.status = 400;
            console.error(error);

            return error;
        }
    }

    function validateInput(msg, file) {
        var fileError = common.validateFile(file);
        var requestError = validateHttpRequest(msg);

        return fileError || requestError;
    }

    function uploadImageToStorage(msg, file) {
        var options = createRequestOptions(file);

        request(options, function (error, response, body) {
            if (error)
                return next(new Error(error));

            var fileStorage = JSON.parse(body);
            var id = fileStorage._id;

            msg.content.url = urlStorage + '/' + id;

            console.log("file uploaded to storage with url: " + msg.content.url);

            common.saveNewMessageToMongoDB(msg,
                function (err) {
                    next(err);
                }, function (message) {
                    httpResponse.send(message);
                });
        });
    }

    function createRequestOptions(file) {
        // Random string for multi-part upload
        var boundaryKey = Math.random().toString(16);
        var options = {
            method: 'POST',
            url: urlStorage,
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'multipart/form-data; boundary=---' + boundaryKey
            },
            formData: {
                image: {
                    value: file.buffer,
                    options: {filename: file.originalname, contentType: null}
                }
            }
        };
        return options;
    }
});