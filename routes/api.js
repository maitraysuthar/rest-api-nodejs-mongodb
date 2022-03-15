var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var resortRouter = require("./resort");
var userRouter = require("./user");
var roomTypeRouter = require("./roomType");
var uploadController = require("./upload");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/resort/", resortRouter);
app.use("/user/", userRouter);
app.use("/roomType/", roomTypeRouter);
app.use("/upload/", uploadController);

module.exports = app;