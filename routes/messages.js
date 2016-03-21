var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var message = require('../models/message');

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
    //Validate stringDate ?


    //create date object
    var dateObj = new Date(stringDate);

    //Query mongo for all messages
    //message.find().where().exec(cb)
    //limit to K results

    //return all results
    res.send(matchingMessage);
});


module.exports = router;
