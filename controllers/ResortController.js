const Resort = require("../models/ResortModel");
const { validationResult } = require("express-validator");

const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { authSuperAdmin } = require("../middlewares/role");
const { omitNullishObject } = require("../helpers/utility");

// Book Schema
function ResortData(data) {
    this.id = data._id;
    this.name = data.name;
    this.description = data.description;
    this.status = data.status;
}
/**
 * Resort List All.
 * 
 * @returns {Object}
 */
 exports.resortAll = [
    function (req, res) {
        try {
            Resort.find({
                status:{
                    $ne:0
                }
            }).then((resorts) => {
                if (resorts.length > 0) {
                    return apiResponse.successResponseWithData(res, "Operation success", resorts);
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

/**
 * Resort List by user.
 * 
 * @returns {Object}
 */
exports.resortList = [
    auth,
    function (req, res) {
        try {
            let isSuperAdmin = req.user?.role == 0;
            Resort.find(isSuperAdmin ? {} : { _id: { $in: req.user.resort } }).then((resorts) => {
                if (resorts.length > 0) {
                    return apiResponse.successResponseWithData(res, "Operation success", resorts);
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
                omitNullishObject(
                    {
                        name: req.body.name,
                        address: req.body.address,
                        description: req.body.description,
                        phone: req.body.phone,
                        rate: req.body.rate,
                        status: req.body.status,
                    }
                )
            );

            resort.save(function (err) {
                if (err) { return apiResponse.ErrorResponse(res, err?.message); }
                let bookData = new ResortData(resort);
                return apiResponse.successResponseWithData(res, "Resort add Success.", bookData);
            });

        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
]

exports.resortDelete = [
    auth,
    authSuperAdmin,
    function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            }
            Resort.findById(req.params.id, (err, resort) => {
                if (err) {
                    return apiResponse.ErrorResponse(res, err);
                }
                if (!resort) {
                    return apiResponse.notFoundResponse(res, "Resort not exists with this id");
                }
                Resort.findByIdAndUpdate(req.params.id, {
                    status: 0
                }, (error) => {
                    if (error) {
                        return apiResponse.ErrorResponse(res, error);
                    }
                    return apiResponse.successResponseWithData(res, "Resort delete Success.");
                })
            })
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
]

exports.resortUpdate = [
    auth,
    authSuperAdmin,
    function (req, res) {
        try {
            const resort = new Resort({
                _id: req.params.id,
                name: req.body.name,
                address: req.body.address,
                description: req.body.description,
                phone: req.body.phone,
                rate: req.body.rate,
                status: req.body.status,
            })

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
            }

            Resort.findById(req.params.id, (err, foundResort) => {
                if (err) {
                    return apiResponse.ErrorResponse(res, err);
                }
                if (!foundResort) {
                    return apiResponse.notFoundResponse(res, "Resort not exists with this id");
                }

                Resort.findByIdAndUpdate(req.params.id, resort, {}, (error) => {
                    if (error) {
                        return apiResponse.ErrorResponse(res, error);
                    }
                    return apiResponse.successResponseWithData(res, "Resort update Success.");
                })
            })
        } catch (err) {
            //throw error in json response with status 500. 
            return apiResponse.ErrorResponse(res, err);
        }
    }
]