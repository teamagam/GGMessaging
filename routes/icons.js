var express = require("express");
var router = express.Router();
var common = require('../routes/common');
var iconModel = require('../models/icon');

router.get('/', function(req, res) {
    iconModel.find({}, function(err, icons) {
        if(err) {
            return next(err);
        }

        res.send(icons);
    });

});

router.post('/', function(req, res, next) {
    var icon = req.body;

    common.saveIconToMongoDB(icon,
        function (err) {
            next(err);
        }, function (savedIcon) {
            res.send(savedIcon);
        });
});

module.exports = router;