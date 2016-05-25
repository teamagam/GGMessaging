var express = require('express');
var router = express.Router();
var config = require('../config/config');
var multer = require('multer');
var request = require('request');
var common = require('../routes/common');


//path to storageDB
var devConnectionStorage = "http://" + config.storage.host_name + ":" + config.storage.port;
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

    var boundaryKey = Math.random().toString(16); // random string for multi-part upload

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

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log("file uploaded to storage");

        var fileStorage = JSON.parse(body);
        var id = fileStorage._id;

        msg = JSON.parse(httpRequest.body.message);
        msg.content.url = urlStorage + '/' + id;

        common.saveNewMessageToMongoDB(msg,
            function (err) {
                next(err);
            }, function (message) {
                httpResponse.send(message);
            });
    });
});
