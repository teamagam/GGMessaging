var express = require('express');
var router = express.Router();

var config = require('../config/config');
var common = require('../routes/common');
var messageCollectionEmitter = require('../EventEmitters/mongoEventsEmitter');

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
                console.log('timeout reached. removing listener');
                messageCollectionEmitter.removeListener('newMessage', callback);
                res.timeout = true;
                next();
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
                messageCollectionEmitter.removeListener('newMessage', callback);
                console.log('timeout reached, listener removed');
            }, config.default_long_polling_timeout_ms);
        } else {
            res.send(messages);
        }
    });
});


module.exports = router;
