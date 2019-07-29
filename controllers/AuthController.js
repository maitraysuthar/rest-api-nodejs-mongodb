const UserModel = require("../models/UserModel");
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var apiResponse = require('../helpers/apiResponse');

exports.register = [
    // Validate fields.
    body('firstName').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('lastName').isLength({ min: 1 }).trim().withMessage('Last name must be specified.')
        .isAlphanumeric().withMessage('Last name has non-alphanumeric characters.'),
    body('email').isLength({ min: 1 }).trim().withMessage('Email must be specified.')
        .isEmail().withMessage('Email must be a valid email address.'),
    body('password').isLength({ min: 6 }).trim().withMessage('Password must be 6 characters or greater.'),
    // Sanitize fields.
    sanitizeBody('firstName').escape(),
    sanitizeBody('lastName').escape(),
    sanitizeBody('email').escape(),
    sanitizeBody('password').escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
    try {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create User object with escaped and trimmed data
        var user = new UserModel(
            {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password,
            }
        );
        if (!errors.isEmpty()) {
            // Display sanitized values/errors messages.
            return apiResponse.validationErrorWithData(res, 'Validation Error.', errors.array());
        }else {
            // Save user.
            user.save(function (err) {
                if (err) { return apiResponse.ErrorResponse(res, err); }
                return apiResponse.successResponseWithData(res,'Registration Success.', user);
            });            
            return;
        }
    } catch (err) {
        return apiResponse.ErrorResponse(res, err);
    }      
}];