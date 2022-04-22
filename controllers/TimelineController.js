const { createTimeline, updateTimeline, createTimelineEvent, updateTimelineEvent } = require("../services/Timeline");
const apiResponse = require("../helpers/apiResponse");

const { authAdmin } = require("../middlewares/role");
const auth = require("../middlewares/jwt");
const { omitNullishObject } = require("../helpers/utility");

const { TIMELINE_EVENT } = require("../constants/index");
/**
 * get type of timeline loop
 */
exports.getTimelineEvent = [
	auth,
	authAdmin,
	(req, res) => {
		return apiResponse.successResponseWithData(res, "Operation success", Object.keys(TIMELINE_EVENT));
	}
];

/**
 * create timeline by specific time range
 */
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
/**
 * Create timeline loop
 */
exports.createTimelineEvent = [
	auth,
	authAdmin,
	(req, res) => {
		const params = omitNullishObject(req.body);
		createTimelineEvent(params, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Operation success");
		});
	}
];
/**
 * Update timeline 
 */
exports.updateTimeline = [
	auth,
	authAdmin,
	(req, res) => {
		const params = omitNullishObject(req.body);
		const id = req.params.id;
		updateTimeline(id, params, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Operation success");
		});
	}
];
/**
 * update timeline loop
 */
exports.updateTimelineEvent = [
	auth,
	authAdmin,
	(req, res) => {
		const params = omitNullishObject(req.body);
		const id = req.params.id;
		updateTimelineEvent(id, params, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Operation success");
		});
	}
];