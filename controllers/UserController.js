
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
var mongoose = require("mongoose");

const User = require("../models/UserModel");
const auth = require("../middlewares/jwt");
const { authSuperAdmin } = require("../middlewares/superAdmin");
const apiResponse = require("../helpers/apiResponse");

exports.userList = [
	auth,
	authSuperAdmin,
	(req, res) => {
		User.find().populate("resort").then((users) => {
			if (users.length > 0) {
				return apiResponse.successResponseWithData(res, "Operation success", users);
			} else {
				return apiResponse.successResponseWithData(res, "Operation success", []);
			}
		});
	}
];
exports.userUpdate = [
	auth,
	authSuperAdmin,
	body("resort", "Name must not be empty.").isLength({ min: 1 }).trim(),
	sanitizeBody("*").escape(),
	(req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
		}
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}

		User.findById(req.params.id, function (err, foundUser) {
			if (foundUser === null) {
				return apiResponse.notFoundResponse(res, "User not exists with this id");
			} else {
				let resort = req.body.resort.split(",").map(el => ({ _id: el }));
				//update resort for user.
				User.findByIdAndUpdate(req.params.id, {
					resort
				}, function (err) {
					if (err) {
						return apiResponse.ErrorResponse(res, err);
					} else {
						return apiResponse.successResponseWithData(res, "User update Success.");
					}
				});
			}
		});
	}
];

exports.userDelete = [
	auth,
	authSuperAdmin,
	(req, res) => {
		User.findById(req.params.id, function (err, foundUser) {
			if (!foundUser) {
				return apiResponse.notFoundResponse(res, "User not exists with this id");
			}
			User.findByIdAndUpdate(req.params.id, {
				status: false
			}, function (err) {
				if (err) {
					return apiResponse.ErrorResponse(res, err);
				} else {
					return apiResponse.successResponseWithData(res, "User update Success.");
				}
			});
		});
	}
];
