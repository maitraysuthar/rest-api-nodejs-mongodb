const Resort = require("../models/ResortModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
var mongoose = require("mongoose");

const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { authSuperAdmin } = require("../middlewares/superAdmin");

// Book Schema
function ResortData(data) {
    this.id = data._id;
    this.name = data.name;
    this.description = data.description;
}

/**
 * Resort List by user.
 * 
 * @returns {Object}
 */
exports.resortList = [
    auth,
    function (req, res) {
        try {
            let isSuperAdmin = req.user == 0;
            Resort.find(isSuperAdmin ? {} : { _id: { $in: req.user.resortId } }, "_id title description isbn createdAt").then((books) => {
                if (books.length > 0) {
                    return apiResponse.successResponseWithData(res, "Operation success", books);
                } else {
                    return apiResponse.successResponseWithData(res, "Operation success", []);
                }
            });
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
]

exports.resortStore = [
    auth,
    authSuperAdmin,
    function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            }

            var resort = new Resort(
                {
                    name: req.body.name,
                    description: req.body.description,
                });

            resort.save(function (err) {
                if (err) { return apiResponse.ErrorResponse(res, err); }
                let bookData = new ResortData(resort);
                return apiResponse.successResponseWithData(res, "Resort add Success.", bookData);
            });

        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
]