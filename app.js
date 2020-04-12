var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");
var apiResponse = require("./helpers/apiResponse");
var cors = require("cors");

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require("mongoose");

mongoose.connect(MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true }).then(() =>{
	console.log("Connection to mongodb has been successful.");
}).catch((err) => {
	console.log("Unable to connect with mongodb");
	console.error(err);
	process.exit(1);
});

var db = mongoose.connection;
var app = express();
//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//To allow cross-origin requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
	if(err.name == "UnauthorizedError"){
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

module.exports = app;
