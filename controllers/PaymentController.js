const apiResponse = require("../helpers/apiResponse");
const PaymentService = require("../services/PaymentService");
exports.getUrl = [
	(req, res) => {
		const url = PaymentService.getUrl(req);
		return apiResponse.successResponseWithData(res, "Success", url);
	}
];

exports.vnpReturn = [
	(req, res) => {
		PaymentService.updatePayment(req, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Payment update successful.");
		});
	}
];
exports.vnpIpn = [
	(req, res) => {
		PaymentService.updatePayment(req, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Payment update successful.");
		});
	}
];