var express = require('express');
var router = express.Router();

var config = require('../config/config');
var common = require('../routes/common');
var messageCollectionEmitter = require('../EventEmitters/mongoEventsEmitter');


/**
 * Checks request for long parameter existence
 * Forwards request to next routing if request doesn't contain "long" parameter
 * @param req - the request to check
 * @param next - next routing by the express's routing framework
 */
function forwardIfNotLongPollRequest(req, next) {
    if (req.query.long === undefined) {
        next();
    }
}

/**
 * parses request long query parameter
 * @param req - the request to parse
 * @returns {Number} - the value of the long parameter if it's a valid (positive) number.
 * Otherwise, the default value as specified by the config file
 */
function getPollingTimeMs(req) {
    var pollingTimeMs = parseInt(req.query.long);

    if (isNaN(pollingTimeMs) || pollingTimeMs <= 0) {
        return config.default_long_polling_timeout_ms;
    }

    return pollingTimeMs;
}

/**
 * Registers a listener for the system's newMessage event to allow long-polling on said event for incoming requests.
 * If maxIdleTimeMs is reached, the listener is removed and an empty response is dispatched
 *
 * @param requestHandler - the request handler to rerun on system's newMessage event
 * @param res - express' routing response object
 * @param maxIdleTimeMs - the maximum time to idle before returning empty response
 */
function longPoll(requestHandler, res, maxIdleTimeMs) {
    messageCollectionEmitter.on('newMessage', requestHandler);

    setTimeout(function () {
        messageCollectionEmitter.removeListener('newMessage', requestHandler);

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
    forwardIfNotLongPollRequest(req, next);
    var pollingTime = getPollingTimeMs(req);

    var callback = function () {
        common.handleGetAllMessages(next, res);
    };

    longPoll(callback, res, pollingTime);
});

/**
 * GET all messages with date later than given parameter
 * limits to K results
 */
router.get('/fromDate/:date', function (req, res, next) {
    forwardIfNotLongPollRequest(req, next);
    var pollingTime = getPollingTimeMs(req);


    var requestHandler = function () {
        common.handleGetMessagesFromDate(req, next, res);
    };

    longPoll(requestHandler, res, pollingTime);
});


module.exports = router;
