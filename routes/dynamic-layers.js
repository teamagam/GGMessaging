var express = require('express');
var router = express.Router();
var config = require('../config/config');
var common = require('../routes/common');
var uuid = require('uuid/v4');
var messageModel = require('../models/message');

router.get('/', function (req, res, next) {
    messageModel.find({"type": 'dynamicLayer'}), function (err, layers) {
        if (err) {
            return next(err);
        }
        res.send(layers);
    }
});

router.post('/', function (req, res, next) {
    var layer = req.body;
    var entities = layer.content.entities;

    addIdToObject(layer.content);

    for (var i in entities) {
        addIdToObject(entities[i]);
    }

    common.saveNewMessageToMongoDB(layer,
        function (err) {
            next(err);
        }, function (doc) {
            res.send(doc);
        });
});

router.post('/:id', function (req, res, next) {
    var layerId = req.params.id;
    var entityRequest = req.body;

    addIdToObject(entityRequest);
    findByIdAndSend(layerId, function (layer) {
        layer.content.entities.push(entityRequest);
    }, (layerToSend) => res.send(layerToSend), next);
});

router.delete('/:layerId/:entityId', function (req, res, next) {
    var layerId = req.params.layerId;
    var entityId = req.params.entityId;

    findByIdAndSend(layerId, function (layer) {
        layer.content.entities = layer.content.entities.filter(function (l) {
            return l.id != entityId;
        });
    }, (layerToSend) => res.send(layerToSend), next);
});

function addIdToObject(object) {
    object.id = uuid();

    return object;
}

function findByIdAndSend(layerId, success, error) {
    findByIdAndSend(layerId, undefined, success, error);
}

function findByIdAndSend(layerId, changeLayer, success, error) {
    messageModel.findOne({"content.id": layerId}, null, {"createdAt": -1},
        function (err, layer) {
            if (err) {
                return error(err);
            }

            if (!layer) {
                return error(new Error("Couldn't find layer with id " + layerId));
            }

            if (changeLayer) {
                changeLayer(layer);
            }

            common.saveNewMessageToMongoDB(layer,
                function (err) {
                    error(err);
                }, function (doc) {
                    success(doc);
                });
        });
}

module.exports = router;