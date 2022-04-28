const apiResponse = require("../helpers/apiResponse");
const PaymentService = require("../services/PaymentService");

exports.getUrl = [
	async (req, res) => {
		const url = await PaymentService.getUrl(req.body);
		return apiResponse.successResponseWithData(res, "Success", url);
	}
];

exports.ipn = [
	(req, res) => {
		PaymentService.ipn(req.body, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Payment update successful.");
		});
	}
];
exports.vnpIpn = [
	(req, res) => {
		PaymentService.paymentReturn(req.body, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Payment update successful.");
		});
	}
];
