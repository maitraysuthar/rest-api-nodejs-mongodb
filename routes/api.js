var express = require('express');
var usersRouter = require('./users');
var authRouter = require('./auth');

var app = express();

app.use('/users/', usersRouter);
app.use('/auth/', authRouter);

module.exports = app;