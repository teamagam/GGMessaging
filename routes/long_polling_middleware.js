var express = require('express');
var router = express.Router();

var config = require('../config/config');

router.all('/', function (req, res, next) {
    console.log('long-polling middleware ' + req);
    req.setTimeout(config.default_long_polling_timeout_ms, function () {
        console.log('timeout reached for request' + req);
    });
    next();
});

module.exports = router;
