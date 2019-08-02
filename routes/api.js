var express = require('express');
var usersRouter = require('./users');
var authRouter = require('./auth');
var bookRouter = require('./book');

var app = express();

app.use('/users/', usersRouter);
app.use('/auth/', authRouter);
app.use('/book/', bookRouter);

module.exports = app;