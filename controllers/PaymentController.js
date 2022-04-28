const apiResponse = require("../helpers/apiResponse");
const PaymentService = require("../services/PaymentService");
const auth = require("../middlewares/jwt");
const { authAdmin } = require("../middlewares/role");
exports.getUrl = [
	(req, res) => {
		const url = PaymentService.getUrl(req);
		return apiResponse.successResponseWithData(res, "Success", url);
	}
];

exports.vnpReturn = [
	(req, res) => {
		PaymentService.paymentReturn(req.body, (error) => {
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

exports.requestCancel = [
	auth,
	authAdmin,
	(req, res) => {
		PaymentService.cancelPayment(req, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Payment cancel successful.");
		});
	}
];
exports.refund = [
	auth,
	authAdmin,
	(req, res) => {
		PaymentService.refund(req, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			return apiResponse.successResponse(res, "Payment cancel successful.");
		});
	}
];
