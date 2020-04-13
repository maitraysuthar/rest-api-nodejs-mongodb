var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var deviceRouter = require("./device");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/device/", deviceRouter);

module.exports = app;