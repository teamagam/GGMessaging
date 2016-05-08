/**
 * Common methods used by routers
 */

var mongoose = require('mongoose');
var message = require('../models/message');
var config = require('../config/config');



function handleGetAllMessages(next, res) {
    message.find(function (err, messages) {
        if (err) {
            //forward to error handling
            next(err);
        }

        if(messages.length == 0){
            return next();

        }

        res.send(messages);
    });
}


function handleGetMessageById(req, next, res) {
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
}

function handleGetMessagesFromDate(req, next, res) {
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

                if(matchingMessages.length == 0){
                    return next();
                }
                //return results
                return res.send(matchingMessages);
            }
        });
}

module.exports.handleGetAllMessages = handleGetAllMessages;
module.exports.handleGetMessageById = handleGetMessageById;
module.exports.handleGetMessagesFromDate = handleGetMessagesFromDate;