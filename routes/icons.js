var express = require("express");
var router = express.Router();
var multer = require("multer");
var request = require('request');
var config = require('../config/config');
var common = require('../routes/common');
var iconModel = require('../models/icon');

var upload = multer({
    inMemory: config.storage.inMemoryFileUpload
});

var storageUrl = common.getStorageUrl();

router.get('/', function (req, res) {
    iconModel.find({}, function (err, icons) {
        if (err) {
            return next(err);
        }

        res.send(icons);
    });

});

router.post('/', upload.single('icon'), function (req, res, next) {
    var file = req.file;
    var icon = JSON.parse(req.body.properties);
    var err = common.validateFile(file);

    if (err) {
        return createBadRequest(res);
    }

    uploadIconToStorage(file, function (url) {
        icon.url = url;

        common.saveIcon(icon,
            function (err) {
                next(err);
            }, function (savedIcon) {
                res.send(savedIcon);
            });
    }, function (err) {
        next(err);
    });
});

router.post('/update/:id', upload.single('icon'), function (req, res, next) {
    var id = req.params.id;
    var file = req.file;
    var icon = req.body.properties ? JSON.parse(req.body.properties) : {};
    var err = common.validateFile(file);

    if (err) {
        return createBadRequest(res);
    }

    uploadIconToStorage(file, function (url) {
        icon.url = url;

        common.updateIcon(id, icon,
            function (err) {
                next(err);
            }, function (newIcon) {
                res.send(newIcon);
            });
    }, function (err) {
        next(err);
    });
});

router.delete('/:id', upload.single('icon'), function (req, res, next) {
    var id = req.params.id;

    common.removeIconById(id, function (err) {
        next(err);
    }, function (oldIcon) {
        res.send(oldIcon);
    });
});

function createBadRequest(res) {
    return res.status(400).send();
}

function uploadIconToStorage(file, onFileUploaded, onError) {
    var options = createRequestOptions(file);

    request(options, function (error, response, body) {
        if (error)
            return onError(new Error(error));

        var fileStorage = JSON.parse(body);
        var id = fileStorage._id;

        onFileUploaded(storageUrl + '/' + id);
    });
}

function createRequestOptions(file) {
    // Random string for multi-part upload
    var boundaryKey = Math.random().toString(16);
    var options = {
        method: 'POST',
        url: storageUrl,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'multipart/form-data; boundary=---' + boundaryKey
        },
        formData: {
            image: {
                value: file.buffer,
                options: { filename: file.originalname, contentType: null }
            }
        }
    };
    return options;
}

module.exports = router;