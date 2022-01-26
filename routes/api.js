var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var mailRouter = require("./mail");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/mail/", mailRouter);

module.exports = app;