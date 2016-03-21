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
    //Validate stringDate ?


    //create date object
    var dateObj = new Date(stringDate);

    //Query mongo for all messages
    //message.find().where().exec(cb)
    //limit to K results

    //return all results
    res.send(matchingMessage);
});

router.delete('/removeAll', function (req, res, next) {
    message.remove({}, function(err, result){
        if(err){
            return next(err);
        } else {
            res.send("Successfully deleted all messages");
        }
    });

});


module.exports = router;
