
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
var mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/UserModel");
const auth = require("../middlewares/jwt");
const { authSuperAdmin } = require("../middlewares/role");
const apiResponse = require("../helpers/apiResponse");
const { generatePassword } = require("../helpers/user");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");

exports.userList = [
	auth,
	authSuperAdmin,
	(req, res) => {
		User.find({ role: { $ne: 0 } }).populate("resort").then((users) => {
			if (users.length > 0) {
				return apiResponse.successResponseWithData(res, "Operation success", users);
			} else {
				return apiResponse.successResponseWithData(res, "Operation success", []);
			}
		});
	}
];

exports.userStore = [
	auth,
	authSuperAdmin,
	(req, res) => {
		console.info(req.body)
		const password = generatePassword(6)

		bcrypt.hash(password, 10, function (err, hash) {
			if (err) return apiResponse.ErrorResponse(res, err);
			User.findOne({ email: req.body.email }).then(foundUser => {
				if (foundUser) {
					return apiResponse.ErrorResponse(res, "User exists with this email");
				}
				const user = new User({
					email: req.body.email,
					password: hash,
					isConfirmed: 1,
					confirmOTP: null,
					resort: req.body?.resort || [],
					role: req.body.role
				})
				// Html email body
				let html = `<p>Your password is: ${password}</p>`;
				// Send password to email
				mailer.send(
					constants.confirmEmails.from,
					req.body.email,
					"Your Password",
					html
				).then(function () {
					// Save user.
					user.save(function (err) {
						if (err) { return apiResponse.ErrorResponse(res, err); }
						let userData = {
							_id: user._id,
							email: user.email
						};
						return apiResponse.successResponseWithData(res, "Registration Success.", userData);
					});
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				});
			});
		})
	}
];

exports.userUpdate = [
	auth,
	authSuperAdmin,
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
				let user = {
					status: req.body.status
				}
				//update resort for user.
				User.findByIdAndUpdate(req.params.id, user, {}, function (err) {
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
