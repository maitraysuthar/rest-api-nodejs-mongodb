const moment = require("moment");
const querystring = require("qs");
const crypto = require("crypto");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");


const { getMessage } = require("../helpers/vnpay");
const Reservation = require("../models/ReservationModel");

exports.getUrl = (req) => {
	const amount = req.body.amount;
	var ipAddr = req.headers["x-forwarded-for"] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;

	var tmnCode = process.env.VNP_TMNCODE;
	var secretKey = process.env.VNP_HASHSECRET;
	var vnpUrl = process.env.VNP_URL;
	var orderType = process.env.VNP_ORDER_TYPE;
	var returnUrl = process.env.VNP_RETURN_URL;

	var date = new Date();

	var createDate = moment(date).format("YYYYMMDDHHmmss");
	var orderId = moment(date).format("YYYYMMDDHHmmss");

	var bankCode = req.body.bankCode;

	var orderInfo = req.body.orderDescription;
	var locale = null;
	if (locale == null || locale == "") {
		locale = "vn";
	}
	var currCode = "VND";
	var vnp_Params = {};
	vnp_Params["vnp_Version"] = "2.1.0";
	vnp_Params["vnp_Command"] = "pay";
	vnp_Params["vnp_TmnCode"] = tmnCode;
	vnp_Params["vnp_Locale"] = locale;
	vnp_Params["vnp_CurrCode"] = currCode;
	vnp_Params["vnp_TxnRef"] = orderId;
	vnp_Params["vnp_OrderInfo"] = orderInfo;
	vnp_Params["vnp_OrderType"] = orderType;
	vnp_Params["vnp_Amount"] = amount * 100;
	vnp_Params["vnp_ReturnUrl"] = returnUrl;
	vnp_Params["vnp_IpAddr"] = ipAddr;
	vnp_Params["vnp_CreateDate"] = createDate;
	if (bankCode != null && bankCode != "") {
		vnp_Params["vnp_BankCode"] = bankCode;
	}

	vnp_Params = sortObject(vnp_Params);

	var signData = querystring.stringify(vnp_Params, { encode: false });
	var hmac = crypto.createHmac("sha512", secretKey);
	var signed = hmac.update(signData).digest("hex");

	vnp_Params["vnp_SecureHash"] = signed;

	vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

	return vnpUrl;
};

exports.updatePayment = (req, cb) => {
	var vnp_Params = req.body;

	var secureHash = vnp_Params["vnp_SecureHash"];

	delete vnp_Params["vnp_SecureHash"];
	delete vnp_Params["vnp_SecureHashType"];

	vnp_Params = sortObject(vnp_Params);

	var secretKey = process.env.VNP_HASHSECRET;

	var signData = querystring.stringify(vnp_Params, { encode: false });
	var hmac = crypto.createHmac("sha512", secretKey);
	var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

	if (secureHash === signed) {
		// Verify payment status code
		if (vnp_Params["vnp_ResponseCode"] !== "00") {
			return cb(getMessage(vnp_Params["vnp_ResponseCode"]));
		}
		// Update status reservation
		Reservation.findOne({
			orderId: vnp_Params["vnp_TxnRef"]
		}).then(reservation => {
			if (!reservation) {
				return cb("Order not exist.");
			}

			Reservation.findOneAndUpdate({
				orderId: vnp_Params["vnp_TxnRef"]
			}, {
				status: 1
			}).then(() => {
				const html = nunjucks.render(
					path.resolve("template", "payement_success.html"),
					{
						full_name: reservation?.invoice?.fullname,
						phone: reservation?.invoice?.phone,
						email: reservation?.invoice?.email,
						order_id: vnp_Params["vnp_TxnRef"],
						checkIn: `Check in sau 3 giờ ${moment(reservation.checkIn).format('DD-MM-YYY')}`,
						checkOut: `Check out trước 12 giờ ${moment(reservation.checkOut).format('DD-MM-YYY')}`,
						totalPrice: `${reservation.totalPrice} VNĐ`
					}
				);
				mailer.send(constants.confirmEmails.from, reservation?.invoice?.email, "Booking sucessfull", html);

				cb(null, "Payment success.", reservation);
			});
		});
	} else {
		cb("Signed not matched");
	}
};

function sortObject(obj) {
	var sorted = {};
	var str = [];
	var key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) {
			str.push(encodeURIComponent(key));
		}
	}
	str.sort();
	for (key = 0; key < str.length; key++) {
		sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
	}
	return sorted;
}
