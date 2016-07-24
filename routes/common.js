/**
 * Common methods used by routers
 */

var message = require('../models/message');
var config = require('../config/config');
var messageCollectionEmitter = require('../EventEmitters/mongoEventsEmitter');

/**
 * synced validatiom message schema
 * @param msg
 */
function validateMessage(msg) {
    //construct mongoose object by schema.
    var dbMessage = new message(msg);
    var error = dbMessage.validateSync()
    return error;
}

/**
 * Async save new message to Mongo "Message" collection
 * @param newMsg - new message to be saved in the mongoDB. the message should be constructed to match message Schema.
 * @param onFailure - callback to be used in-case save fails
 * @param onSuccess - callback to be used in-case a successful result is returned
 */
function saveNewMessageToMongoDB(newMsg, onFailure, onSuccess) {
    if (newMsg.createdAt) {
        var err = new Error("Given message shouldn't contain createdAt path!");

        //return is used to finish function's execution
        return onFailure(err);
    }

    //construct mongoose object by schema.
    var mongooseMessage = new message(newMsg);

    //mongoose validates message-object before save
    mongooseMessage.save(function (err, msg) {
        if (err) {
            //forward to error handling
            onFailure(err);
        } else {
            messageCollectionEmitter.emit('newMessage');
            //return newly created object
            onSuccess(msg);
        }
    });
}

/**
 * Async queries Mongo "Message" collection for ALL the messages in it
 * @param onFailure - callback to be used in-case the query fails
 * @param onSuccess - callback to be used in-case a successful (perhaps empty) result is returned
 */
function getAllMessages(onFailure, onSuccess) {
    message.find(function (err, messages) {
        if (err) {
            //forward to error handling
            onFailure(err);
        }

        onSuccess(messages);
    });
}

/**
 * Async default wrapper for get all messages HTTP GET request.
 * Sends back the message collection retrieved from mongo query, even if its empty.
 * Forwards errors to next routing in routing chain
 * @param req - node's routing request object
 * @param res - node's routing response object
 * @param next - node's routing next object
 */
function handleGetAllMessagesRequest(req, res, next) {
    getAllMessages(function (err) {
        next(err);
    }, function (messages) {
        res.send(messages);
    });

}

/**
 * Async queries Mongo "Message" collection for messages from a date contained in request.
 * Limits the returned messages count to config.limitKResults
 * @param req - request to parse for date and process query
 * @param onFailure - callback to be used when query fails
 * @param onSuccess - callback to be used when messages are returned (might be empty)
 */
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

    //var query = createGetMessagesQuery(dateObj);


    var o = {};
    o.map = function () {
        emit(this.senderId, this.createdAt);
    };

    o.reduce = function (keyCustId, dates) {
        return dates.reduce(function (a, b) { return a > b ? a : b; });
    };

    o.query = {type: 'UserLocation'};

    message.mapReduce(o,
        function (err, matchingMessages) {
            if (err) {
                onFailure(err);
            } else {
                onSuccess(matchingMessages);
            }
        }
    );


    //query.exec(
    //    function (err, matchingMessages) {
    //        if (err) {
    //            onFailure(err);
    //        } else {
    //            onSuccess(matchingMessages);
    //        }
    //    });
}

/**
 * Async default wrapper for HTTP GET request for messages from a given date.
 * Limits the returned messages count to config.limitKResults.
 * Sends back the messages returned even if the result is empty.
 * Forwards errors to next router in routing chain
 *
 * @param req - node's routing request object
 * @param res - node's routing response object
 * @param next - node's routing next object
 */
function handleGetMessageFromDateRequest(req, res, next) {
    getMessagesFromDate(req, function (err) {
        next(err);
    }, function (messages) {
        res.send(messages);
    });
}

/**
 *     if site has an end slash (like: www.example.com/),
 *     then remove it and return the site without the end slash
 */
function stripTrailingSlash(string) {
    // Match a forward slash / at the end of the string ($)
    return string.replace(/\/$/, '');
}

function createGetMessagesQuery(dateObj) {
    //Query mongo for all messages
    var query = message.find({
        createdAt: {$gt: dateObj}
    });

    //query.where('type').ne('UserLocation');
    query.where('type').eq('UserLocation');

    //message.aggregate([
    //        // Matching pipeline, similar to find
    //        {
    //            "$match": {
    //                "to": req.user.username
    //            }
    //        },
    //        // Sorting pipeline
    //        {
    //            "$sort": {
    //                "created": -1
    //            }
    //        },
    //        // Grouping pipeline
    //        {
    //            "$group": {
    //                "_id": "$from",
    //                "message": {
    //                    "$first": "$message"
    //                },
    //                "created": {
    //                    "$first": "$created"
    //                }
    //            }
    //        },
    //        // Project pipeline, similar to select
    //        {
    //            "$project": {
    //                "_id": 0,
    //                "from": "$_id",
    //                "message": 1,
    //                "created": 1
    //            }
    //        }
    //    ],
    //    function(err, messages) {
    //        // Result is an array of documents
    //        if (err) {
    //            return res.status(400).send({
    //                message: getErrorMessage(err)
    //            });
    //        } else {
    //            res.json(messages)
    //        }
    //    }
    //);

    query.sort({'createdAt': 1});    //sort by creation date ASC so we won't miss messages.

    if (config.shouldLimitResults) { //limit to K results
        query.limit(config.limitKResults);
    }
    return query;
}

module.exports.validateMessage = validateMessage;
module.exports.saveNewMessageToMongoDB = saveNewMessageToMongoDB;
module.exports.getAllMessages = getAllMessages;
module.exports.handleGetAllMessagesRequest = handleGetAllMessagesRequest;
module.exports.getMessagesFromDate = getMessagesFromDate;
module.exports.handleGetMessageFromDateRequest = handleGetMessageFromDateRequest;
module.exports.stripTrailingSlash = stripTrailingSlash;