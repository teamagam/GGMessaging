var express = require('express');
var router = express.Router();
var config = require('../config/config');
var common = require('../routes/common');
var uuid = require('uuid/v4');
var messageModel = require('../models/message');

router.post('/', function (req, res, next) {
    var layer = req.body;
    var entities = layer.content.entities;

    for (var i in entities) {
        addIdToEntity(entities[i]);
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

    addIdToEntity(entityRequest);
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

function findByIdAndSend(layerId, success, error) {
    findByIdAndSend(layerId, undefined, success, error);
}

function findByIdAndSend(layerId, changeLayer, success, error) {
    messageModel.findById(layerId, function (err, layer) {
        if (err) {
            return error(err);
        }

        layer = getAsNewMessage(layer);
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

function addIdToEntity(entity) {
    entity.id = uuid();

    return entity;
}

function getAsNewMessage(layer) {
    layer.createdAt = undefined;

    return layer;
}

module.exports = router;