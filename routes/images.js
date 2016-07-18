var express = require('express');
var router = express.Router();
var config = require('../config/config');
var multer = require('multer');
var request = require('request');
var common = require('../routes/common');


//path to storageDB
var devConnectionStorage = "http://" + config.storage.host + ":" + config.storage.port;
var connectionStorage = process.env.STORAGE_CON_STRING || devConnectionStorage;
var urlStorage = connectionStorage + "/storage";

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

    function validateFile(file) {
        // If the file doesn't exist, throw an error
        if (file == undefined || file == null) {
            var err = new Error('File is requried');
            err.status = 400;

            return err;
        }

        // Get the file extension to validate the file
        var splittedFileName = file.originalname.split(".")
        var fileExtension = "";

        if (splittedFileName.length > 1) {
            fileExtension = splittedFileName[splittedFileName.length - 1];
        }

        // Throw an error if we can't find both mimetype and file extension
        if (config.uploadConfig.acceptedMimeTypes.indexOf(file.mimetype) == -1 &&
            config.uploadConfig.acceptedExtensions.indexOf(fileExtension) == -1) {

            var err = new Error('Unsupported file');
            err.status = 400;

            return err;
        }
    }

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
        var fileError = validateFile(file);
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
