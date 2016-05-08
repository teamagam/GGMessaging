var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config/config');
var messagesRoute = require('./routes/messages');
var longPollingMessagesRoute = require('./routes/long_polling_messages');

var mongoose = require('mongoose');

//Connect mongoose to MongoDB
var devConnectionString = 'mongodb://' + config.mongodb.host + ":" + config.mongodb.port;
var connectionString = process.env.MONGO_CON_STRING || devConnectionString;
var mongooseConStr = connectionString + "/messages";
mongoose.connect(mongooseConStr);

// on connection success/failure
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error with ' + mongooseConStr + " :"));
db.once('open', function () {
    console.log("Successfully connected to MongoDB service with " + mongooseConStr);
});

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/messages', messagesRoute);
app.use('/messages', longPollingMessagesRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send(String(err));
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send("Internal error");
});


module.exports = app;
