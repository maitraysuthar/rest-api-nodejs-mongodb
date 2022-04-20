const { createTimeline, updateTimeline } = require("../services/Timeline");
const apiResponse = require("../helpers/apiResponse");

const { authAdmin } = require("../middlewares/role");
const auth = require("../middlewares/jwt");
const { omitNullishObject } = require("../helpers/utility");

exports.createTimeline = [
    auth,
    authAdmin,
    (req, res) => {
        const params = omitNullishObject(req.body);
        createTimeline(params, (error) => {
            if (error) return apiResponse.ErrorResponse(res, error);
            return apiResponse.successResponse(res, "Operation success");
        });
    }
];

exports.updateTimeline = [
    auth,
    authAdmin,
    (req, res) => {
        const params = omitNullishObject(req.body);
        const id = req.params.id;
        updateTimeline(id,params, (error) => {
            if (error) return apiResponse.ErrorResponse(res, error);
            return apiResponse.successResponse(res, "Operation success");
        })
    }
];