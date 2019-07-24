var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var apiResponse = require('./helpers/apiResponse');

/* DB connection */
var mongoose = require('mongoose');

var mongoDB = 'mongodb://127.0.0.1/rest-api-nodejs-mongodb';
mongoose.connect(mongoDB, { useNewUrlParser: true }).then(() => {
    console.log("Connected to %s", mongoDB);
  })
  .catch(err => {
    console.error("App starting error:", err.message);
    process.exit(1);
  });
var db = mongoose.connection;
// db.on('error', (error)=>{
//     //console.error('MongoDB connection error:'error);
//     console.error.bind(console, 'MongoDB connection error:')
//     process.exit(0);
// });

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
    return apiResponse.notFoundResponse(res, 'Page not found');
});

module.exports = app;
