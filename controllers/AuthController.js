const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const UserModel = require("../models/UserModel");
const RefreshToken = require("../models/RefreshTokenModel");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const auth = require("../middlewares/jwt");
const { generatePassword } = require("../helpers/user");

/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
	// Validate fields.
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
			return UserModel.findOne({ email: value }).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				//hash input password
				bcrypt.hash(req.body.password, 10, function (err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							email: req.body.email,
							password: hash,
							confirmOTP: otp
						}
					);
					// Html email body
					let url = `http://localhost:3000/api/auth/verify-otp?email=${req.body.email}&otp=${otp}`;
					let html = "<p>To confirm that you are the owner of this email address and to continue the registration process, please click the following link:</p><a>" + url + "</a>";
					// Send confirmation email
					mailer.send(
						constants.confirmEmails.from,
						req.body.email,
						"Confirm Account",
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
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				UserModel.findOne({ email: req.body.email }).then(user => {
					if (user) {
						//Compare given password with db's hash.
						bcrypt.compare(req.body.password, user.password, function (err, same) {
							if (!same) return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
							if (user.isConfirmed) {
								// Check User's account active or not.
								if (user.status) {
									let userData = {
										email: user.email,
										role: user.role,
									};
									//Prepare JWT token for authentication
									const jwtPayload = { ...userData };
									jwtPayload._id = user._id;
									jwtPayload.resort = user.resort;
									const jwtData = {
										expiresIn: Number(process.env.ACCESS_TOKEN_LIFE),
									};
									const secret = process.env.ACCESS_TOKEN_SECRET;
									//Generated JWT token with Payload and secret.
									userData.accessToken = jwt.sign(jwtPayload, secret, jwtData);
									userData.refreshToken = jwt.sign(jwtPayload, secret, {
										expiresIn: Number(process.env.REFRESH_TOKEN_LIFE),
									});
									RefreshToken.findOneAndUpdate({
										user: user._id
									}, {
										token: userData.refreshToken
									}, {
										upsert: true,
										new: true
									}).then(() => {
										return apiResponse.successResponseWithData(res, "Login Success.", userData);
									}, (error) => {
										return apiResponse.ErrorResponse(res, error);
									});
								} else {
									return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.");
								}
							} else {
								return apiResponse.unauthorizedResponse(res, "Account is not confirmed. Please confirm your account.");
							}
						});
					} else {
						return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
	// body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
	// 	.isEmail().withMessage("Email must be a valid email address."),
	// body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
	// sanitizeBody("email").escape(),
	// sanitizeBody("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				var query = { email: req.query.email };
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if (!user.isConfirmed) {
							//Check account confirmation.
							if (user.confirmOTP == req.query.otp) {
								//Update user as confirmed
								UserModel.findOneAndUpdate(query, {
									isConfirmed: 1,
									confirmOTP: null
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});
								return apiResponse.successResponse(res, "Account confirmed success.");
							} else {
								return apiResponse.unauthorizedResponse(res, "Otp does not match");
							}
						} else {
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					} else {
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				var query = { email: req.body.email };
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if (!user.isConfirmed) {
							// Generate otp
							let otp = utility.randomNumber(4);
							// Html email body
							let html = "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>";
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from,
								req.body.email,
								"Confirm Account",
								html
							).then(function () {
								user.isConfirmed = 0;
								user.confirmOTP = otp;
								// Save user.
								user.save(function (err) {
									if (err) { return apiResponse.ErrorResponse(res, err); }
									return apiResponse.successResponse(res, "Confirm otp sent.");
								});
							});
						} else {
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					} else {
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

exports.logout = [
	auth,
	(req, res) => {
		RefreshToken.findOneAndDelete({ user: req.user._id }).then(() => {
			return apiResponse.successResponse(res, "Logout success.");
		},(error)=>{
			return apiResponse.ErrorResponse(res, error);
		});
	}
];

exports.refreshToken = [
	auth,
	(req, res) => {
		const jwtPayload = req.user;
		let refreshToken = jwt.sign(
			jwtPayload,
			process.env.REFRESH_TOKEN_SECRET,
			{
				algorithm: "HS256",
				expiresIn: Number(process.env.REFRESH_TOKEN_LIFE)
			}
		);
		RefreshToken.findOne({ user: req.user._id }).then((foundRefreshToken) => {
			RefreshToken.findByIdAndUpdate(foundRefreshToken._id, {
				token: refreshToken
			}).then(() => {
				return apiResponse.successResponse(res, "Refresh token success.");
			});
		}, ((err) => {
			return apiResponse.ErrorResponse(res, err);
		}));
	}
];

exports.forgotPassword = [
	(req, res) => {
		UserModel.findOne({ email: req.body.email }).then(foundUser => {
			if (!foundUser) {
				return apiResponse.unauthorizedResponse(res, "Email not exist.");
			}
			const password = generatePassword(6);
			bcrypt.hash(password, 10, function (err, hash) {
				let html = `<p>Your new password is: ${password}</p>`;
				mailer.send(
					constants.confirmEmails.from,
					req.body.email,
					"Your New Password",
					html
				).then(function () {
					// Save user.
					UserModel.findOneAndUpdate(
						{
							_id: foundUser._id,
						},
						{
							password: hash
						}
					).then(() => {
						return apiResponse.successResponseWithData(res, "Change password Success.");
					}, (err) => {
						return apiResponse.ErrorResponse(res, err);
					});
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res, err);
				});
			});
		}, (err) => {
			return apiResponse.ErrorResponse(res, err);
		});
	}
];
