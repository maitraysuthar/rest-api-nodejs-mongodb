var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var resortRouter = require("./resort");
var userRouter = require("./user");
var roomTypeRouter = require("./roomType");
var uploadRouter = require("./upload");
var reservationRouter = require("./reservation");
var paymentRouter = require("./payment");
var timelineRouter = require("./timeline");

var app = express();

app.use("/auth/", authRouter);
app.use("/book/", bookRouter);
app.use("/resort/", resortRouter);
app.use("/user/", userRouter);
app.use("/roomType/", roomTypeRouter);
app.use("/upload/", uploadRouter);
app.use("/reservation/", reservationRouter);
app.use("/payment/", paymentRouter);
app.use("/timeline/", timelineRouter);

module.exports = app;