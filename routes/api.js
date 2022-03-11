var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var resortRouter = require("./resort");
var userRouter = require("./user");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/resort/", resortRouter);
app.use("/user/", userRouter);

module.exports = app;