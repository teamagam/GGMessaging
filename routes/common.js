/**
 * Common methods used by routers
 */

var message = require('../models/message');
var Icon = require('../models/icon');
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

    //Query mongo for all messages

    getLastUserLocations(dateObj, onFailure, function (lastUsersLocations) {
        var query = createGetMessagesQuery(dateObj);
        query.exec(
            function (err, matchingMessages) {
                if (err) {
                    onFailure(err);
                } else {
                    var allMessages = matchingMessages.concat(lastUsersLocations);
                    onSuccess(allMessages);
                }
            });
    });

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
        createdAt: { $gt: dateObj }
    });

    query.where('type').ne('UserLocation');

    query.sort({ 'createdAt': 1 });    //sort by creation date ASC so we won't miss messages.

    if (config.shouldLimitResults) { //limit to K results
        query.limit(config.limitKResults);
    }
    return query;
}

function getLastUserLocations(dateObj, onFailure, onSuccess) {
    message.aggregate([
        // Matching pipeline, similar to find
        {
            "$match": {
                createdAt: { $gt: dateObj },
                "type": 'UserLocation'
            }
        },
        // Sorting pipeline
        {
            "$sort": {
                "createdAt": -1
            }
        },
        // Grouping pipeline
        {
            "$group": {
                "_id": "$senderId",
                "createdAt": { "$first": "$createdAt" },
                "_idd": { "$first": "$_id" },
                "type": { "$first": "$type" },
                "content": { "$first": "$content" }
            }
        },
        // Project pipeline, similar to select
        {
            "$project": {
                "_id": "$_idd",
                "senderId": "$_id",
                "createdAt": 1,
                "type": 1,
                "content": 1
            }
        }
    ],
        function (err, messages) {
            // Result is an array of documents
            if (err) {
                onFailure(err);
            } else {
                onSuccess(messages);
            }
        }
    );
}

function saveIcon(icon, onFailure, onSuccess) {
    var mongooseIcon = new Icon(icon);

    mongooseIcon.save(function (err, doc) {
        if (err) {
            onFailure(err);
        } else {
            onSuccess(doc);
        }
    });
}

function updateIcon(id, icon, onFailure, onSuccess) {
    Icon.findOneAndUpdate({ "_id": id }, icon, { upsert: true }, function (err, oldDoc) {
        if (err) {
            return onFailure(err);
        }
        return onSuccess(oldDoc);
    });
}

function validateFile(file) {
    if (file == undefined || file == null) {
        var err = new Error('File is requried');
        err.status = 400;

        return err;
    }

    return validateFileType(file);
}

function validateFileType(file) {
    var splittedFileName = file.originalname.split(".")
    var fileExtension = "";

    if (splittedFileName.length > 1) {
        fileExtension = splittedFileName[splittedFileName.length - 1];
    }

    if (config.uploadConfig.acceptedMimeTypes.indexOf(file.mimetype) == -1 &&
        config.uploadConfig.acceptedExtensions.indexOf(fileExtension) == -1) {

        var err = new Error('Unsupported file');
        err.status = 400;

        return err;
    }
}

function getStorageUrl() {
    var devConnectionStorage = "http://" + config.storage.host + ":" + config.storage.port;
    var connectionStorage = process.env.STORAGE_CON_STRING || devConnectionStorage;
    connectionStorage = stripTrailingSlash(connectionStorage);

    return connectionStorage + "/storage";
}

module.exports.validateMessage = validateMessage;
module.exports.saveNewMessageToMongoDB = saveNewMessageToMongoDB;
module.exports.saveIcon = saveIcon;
module.exports.updateIcon = updateIcon;
module.exports.getAllMessages = getAllMessages;
module.exports.handleGetAllMessagesRequest = handleGetAllMessagesRequest;
module.exports.getMessagesFromDate = getMessagesFromDate;
module.exports.handleGetMessageFromDateRequest = handleGetMessageFromDateRequest;
module.exports.stripTrailingSlash = stripTrailingSlash;
module.exports.validateFile = validateFile;
module.exports.getStorageUrl = getStorageUrl;