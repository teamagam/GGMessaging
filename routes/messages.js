var express = require('express');
var router = express.Router();
var message = require('../models/message');
var mongoose = require('mongoose');
var config = require('../config/config');


var common = require('../routes/common');
var messageCollectionEmitter = require('../EventEmitters/mongoEventsEmitter');


/**
 * GET all messages
 * limits to K results
 */
router.get('/', function (req, res, next) {
    common.handleGetAllMessagesRequest(req, res, next);
});

/**
 * GET a specific message by id
 */
router.get('/:id', function (req, res, next) {
    var requestedId = req.params.id;

    //ObjectId creation validates requestedId.
    var objectId = mongoose.Types.ObjectId(requestedId);

    message.findById(objectId, function (err, msg) {
        if (err) {
            //forward to error handling
            return next(err);
        } else {
            res.send(msg);
        }
    });

});

/**
 * GET all messages with date later than given parameter
 * limits to K results
 */
router.get('/fromDate/:date', function (req, res, next) {
    common.handleGetMessageFromDateRequest(req, res, next);
});

/**
 * POST a new message.
 *
 */
router.post('/', function (req, res, next) {
    if (req.body.createdAt) {
        var err = new Error("Given message shouldn't contain createdAt path!");
        //return is used to finish function's execution
        return next(err);
    }

    //construct mongoose object by schema.
    var mongooseMessage = new message(req.body);

    //mongoose validates message-object before save
    mongooseMessage.save(function (err, msg) {
        if (err) {
            //forward to error handling
            next(err);
        } else {
            messageCollectionEmitter.emit('newMessage');
            //return newly created object
            res.send(msg);
        }
    });
});

//todo: remove it in operational deploy
router.delete('/removeAll', function (req, res, next) {
    message.remove({}, function (err, result) {
        if (err) {
            return next(err);
        } else {
            res.send("Successfully deleted all messages");
        }
    });

});

module.exports = router;
