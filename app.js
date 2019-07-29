var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');
var apiResponse = require('./helpers/apiResponse');

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require('mongoose');
mongoose.connect(MONGODB_URL, { useNewUrlParser: true }).then(() => {
    console.log("Connected to %s", MONGODB_URL);
    console.log("App is running ... \n");
    console.log("Press CTRL + C to stop the process. \n");
  })
  .catch(err => {
    console.error("App starting error:", err.message);
    process.exit(1);
  });
var db = mongoose.connection;

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Route Prefixes
app.use('/', indexRouter);
app.use('/api/', apiRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
    return apiResponse.notFoundResponse(res, 'Page not found');
});

module.exports = app;
