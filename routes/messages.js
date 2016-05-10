var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var message = require('../models/message');

var config = require('../config/config');

/**
 * GET all messages
 * limits to K results
 */
router.get('/', function (req, res, next) {
    message.find(function (err, messages) {
        if (err) {
            //forward to error handling
            next(err);
        }
        res.send(messages);
    });
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
            next(err);
        } else {
            res.send(msg);
        }
    });
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
            //return newly created object
            res.send(msg);
        }
    });
});


/**
 * GET all messages with date later than given parameter
 * limits to K results
 */
router.get('/fromDate/:date', function (req, res, next) {
    //Parse date from params
    var stringDate = req.params.date;

    //create date object
    var dateObj = new Date(stringDate); //if the date in format of yyyy-MM-HHThh:mm:ss.xxxZ
    if (isNaN(dateObj.valueOf())) { //if the date in format of int
        dateObj = new Date(parseInt(stringDate));
    }
    if (isNaN(dateObj.valueOf())) { //if the date is not in a known format
        next(new Error(stringDate + " is of not a valid date format"));
    }
    //Query mongo for all messages
    var query = message.find({
            createdAt: {
                $gt: dateObj
            }
        })
        .sort({'createdAt': 1});    //sort by creation date ASC so we won't miss messages.

    if (config.shouldLimitResults) { //limit to K results
        query.limit(config.limitKResults);
    }
    query.exec(
        function (err, matchingMessages) {
            if (err) {
                //forward to error handling
                next(err);
            } else {
                //return results
                res.send(matchingMessages);
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
