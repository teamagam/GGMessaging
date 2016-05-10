/**
 * Common methods used by routers
 */

var message = require('../models/message');
var config = require('../config/config');


function getAllMessages(onFailure, onSuccess) {
    message.find(function (err, messages) {
        if (err) {
            //forward to error handling
            onFailure(err);
        }

        onSuccess(messages);
    });
}

function handleGetAllMessagesRequest(req, res, next) {
    getAllMessages(function (err) {
        next(err);
    }, function (messages) {
        res.send(messages);
    });

}

function getMessagesFromDate(req, onFailure, onSuccess) {

    //Parse date from params
    var stringDate = req.params.date;

    //create date object
    var dateObj = new Date(stringDate); //if the date in format of yyyy-MM-HHThh:mm:ss.xxxZ
    if (isNaN(dateObj.valueOf())) { //if the date in format of int
        dateObj = new Date(parseInt(stringDate));
    }
    if (isNaN(dateObj.valueOf())) { //if the date is not in a known format
        return onFailure(new Error(stringDate + " is of not a valid date format"));
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
                onFailure(err);
            } else {
                onSuccess(matchingMessages);
            }
        });
}

function handleGetMessageFromDateRequest(req, res, next) {
    getMessagesFromDate(req, function (err) {
        next(err);
    }, function (messages) {
        res.send(messages);
    });
}

module.exports.getAllMessages = getAllMessages;
module.exports.handleGetAllMessagesRequest = handleGetAllMessagesRequest;
module.exports.getMessagesFromDate = getMessagesFromDate;
module.exports.handleGetMessageFromDateRequest = handleGetMessageFromDateRequest;