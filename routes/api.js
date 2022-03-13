var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var resortRouter = require("./resort");
var userRouter = require("./user");
var roomTypeRouter = require("./roomType");
var room = require("./room");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/resort/", resortRouter);
app.use("/user/", userRouter);
app.use("/roomType/", roomTypeRouter);
app.use("/room/", room);

module.exports = app;