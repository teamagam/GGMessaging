var express = require('express');
var router = express.Router();

var config = require('../config/config');
var common = require('../routes/common');
var messageCollectionEmitter = require('../EventEmitters/mongoEventsEmitter');


/**
 * Registers a listener for the system's newMessage event to allow long-polling on said event for incoming requests.
 * If maxIdleTimeMs is reached, the listener is removed and an empty response is dispatched
 *
 * @param callback - the request handler to rerun on system's newMessage event
 * @param res - express' routing response object
 * @param maxIdleTimeMs - the maximum time to idle before returning empty response
 */
function longPoll(callback, res, maxIdleTimeMs) {
    messageCollectionEmitter.on('newMessage', callback);

    setTimeout(function () {
        messageCollectionEmitter.removeListener('newMessage', callback);

        //return empty response if none was returned until now
        if (!res.headersSent) {
            res.send([]);
        }

    }, maxIdleTimeMs);
}
/**
 * GET all messages
 * limits to K results
 */
router.get('/', function (req, res, next) {
    common.getAllMessages(function (err) {
        next(err)
    }, function (messages) {
        if (messages.length == 0) {
            //long-poll
            var callback = function () {
                common.handleGetAllMessagesRequest(req, res, next)
            };

            messageCollectionEmitter.once('newMessage', callback);

            setTimeout(function () {
                messageCollectionEmitter.removeListener('newMessage', callback)
            }, config.default_long_polling_timeout_ms);

        } else {
            res.send(messages);
        }
    });
});

/**
 * GET all messages with date later than given parameter
 * limits to K results
 */
router.get('/fromDate/:date', function (req, res, next) {

    common.getMessagesFromDate(req, function (err) {
        next(err);
    }, function (messages) {
        if (messages.length == 0) {
            //long-poll
            var callback = function () {
                common.handleGetMessageFromDateRequest(req, res, next)
            };

            messageCollectionEmitter.once('newMessage', callback);

            setTimeout(function () {
                messageCollectionEmitter.removeListener('newMessage', callback)
            }, config.default_long_polling_timeout_ms);
        } else {
            res.send(messages);
        }
    });
});


module.exports = router;
