var express = require('express');
var router = express.Router();

var config = require('../config/config');
var common = require('../routes/common');
var messageCollectionEmitter = require('../EventEmitters/mongoEventsEmitter');

/**
 * Registers given callback to be fired on 'newMessage' event.
 * Will remove listener (to avoid memory-leak) after timeout is reached and forward request to the next router in
 * the routing chain with a timeout parameter attached to the response
 *
 * @param callback - to be fired on 'newMessage' event
 * @param res - node's routing response object
 * @param next - node's routing next object
 */
function longPoll(callback, res, next) {
    messageCollectionEmitter.once('newMessage', callback);

    setTimeout(function () {
        console.log('timeout reached. removing listener');
        messageCollectionEmitter.removeListener('newMessage', callback);
        if (!res.headersSent) {
            res.timeout = true;
            next();
        }
    }, config.default_long_polling_timeout_ms);
}

/**
 * Long polls for all messages
 * In case there are not messages to return, the server will hold the request until the first to come:
 * 1. 'newMessage' event is emitted and then requires the db for result
 * 2. Timeout is reached, moves the request to next router with timeout parameter attached to the response
 */
router.get('/', function (req, res, next) {
    common.getAllMessages(function (err) {
        next(err)
    }, function (messages) {
        var callback = function () {
            common.handleGetAllMessagesRequest(req, res, next)
        };

        if (messages.length == 0) {
            longPoll(callback, res, next);
        } else {
            res.send(messages);
        }
    });
});

/**
 * Long polls for all messages with date later than given parameter. limits result to config.limitKResults
 * In-case there are not messages to return at request time, the server will hold the request until the first to come:
 * 1. 'newMessage' event is emitted, leading the server to re-query the DB for the result
 * 2. Timeout is reached, moves the request to next router with timeout parameter attached to the response
 */
router.get('/fromDate/:date', function (req, res, next) {

    common.getMessagesFromDate(req, function (err) {
        next(err);
    }, function (messages) {
        var callback = function () {
            common.handleGetMessageFromDateRequest(req, res, next)
        };

        if (messages.length == 0) {
            longPoll(callback, res, next);
        } else {
            res.send(messages);
        }
    });
});


module.exports = router;
