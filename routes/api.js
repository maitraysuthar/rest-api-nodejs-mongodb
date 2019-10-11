var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);

module.exports = app;