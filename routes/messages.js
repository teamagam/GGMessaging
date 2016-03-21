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

    //Validate parameter
    if (typeof requestedId !== "string") {
        res.status(err.status || 500);
        res.send("Invalid parameter " + requestedId);
    }

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

router.post('/', function (req, res, next) {
    var reqMessage = req.body;
    //TODO: validate message

    //assign current date to message object
    reqMessage.createdAt = Date.now();

    //save object with mongoose
    var mongooseMessage = new message(reqMessage);
    mongooseMessage.save(function (err, msg) {
        if (err) {
            //forward to error handling
            next(err);
        } else {
            //TODO: send HTTP 200 OK status
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
    if (isNaN(dateObj.valueof) ){ //if the date in format of int
        dateObj = new Date(parseInt(stringDate));
    }
    //Query mongo for all messages
    var query = message.find({
            createdAt: {
                $gt: dateObj
            }
        })
        .sort({'createdAt': 1});    //sort by creation date so we won't miss messages.

    if(config.limitResults) { //limit to K results
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


module.exports = router;
