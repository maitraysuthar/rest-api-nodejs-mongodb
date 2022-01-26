const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");

exports.sendMail = [
	// Validate fields.
	body("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("email").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				let html = "<p>New email.</p><p>name: "+ req.body.firstName + req.body.lastName +"</p>";
				mailer.send(
					constants.confirmEmails.from, 
					req.body.email,
					"Confirm Account",
					html
				).then((foo) => {
					console.log(foo);
					return apiResponse.successResponseWithData(res,"Email sent", foo);
					
				}).catch(err => {
					console.log(err);
					return apiResponse.ErrorResponse(res,err);
				});
			}

		}catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];
