const moment = require("moment");
const querystring = require("qs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");
const { nanoid } = require('nanoid')

const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const { getMessage } = require("../helpers/vnpay");
const Reservation = require("../models/ReservationModel");
const { RESERVATION_STATUS } = require("../constants/index");
const RoomTypeService = require('../services/RoomTypeService');
const { isAllowCanceled } = require("../helpers/time");

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
	var orderId = nanoid();

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
/**
 * Check order had exist
 * @param {*} orderId 
 * @param {*} status 
 * @param {*} cb 
 */
const _updatePaymentStatus = (orderId, status, cb) => {
	Reservation.findOne({
		orderId: orderId
	}).then(reservation => {
		if (!reservation) {
			return cb(`Order id: ${orderId} not exist.`);
		}

		Reservation.findOneAndUpdate(
			{
				orderId: orderId
			},
			{
				status: status
			}
		).then(() => {
			return cb(null);
		}, (error) => {
			return cb(error?.message);
		})
	})
}

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
			// Payment fail then update status reservation to rejected
			return _updatePaymentStatus(vnp_Params["vnp_TxnRef"], RESERVATION_STATUS.REJECTED, (error) => {
				if (error) return cb(error);
				return cb(getMessage(vnp_Params["vnp_ResponseCode"]));
			})
		}

		// Update status reservation
		Reservation.findOne({
			orderId: vnp_Params["vnp_TxnRef"]
		}).then(reservation => {
			if (!reservation) {
				return cb(`Order id: ${vnp_Params["vnp_TxnRef"]} not exist.`);
			}
			// Check amount room has available
			RoomTypeService.roomTypeDetail({
				roomtype: reservation.roomtype,
				checkIn: reservation.checkIn,
				checkOut: reservation.checkOut
			}, (err, room) => {
				if (err) return cb(err?.message)

				if (reservation.amount > room.capacity) {
					// Update reservation to refund
					return _updatePaymentStatus(vnp_Params["vnp_TxnRef"], RESERVATION_STATUS.PENDING_REFUNDED, (error) => {
						if (error) return cb(error);
						return cb(`Your room occupy. We will refund your money. Please choose other room.`);
					})
				}

				// Update reservation to booked
				return _updatePaymentStatus(vnp_Params["vnp_TxnRef"], RESERVATION_STATUS.PENDING_COMPLETED, (error) => {
					if (error) return cb(error);
					const html = nunjucks.render(
						path.resolve("template", "payement_success.html"),
						{
							full_name: reservation?.invoice?.fullname,
							phone: reservation?.invoice?.phone,
							email: reservation?.invoice?.email,
							order_id: vnp_Params["vnp_TxnRef"],
							checkIn: `Check in sau 3 giờ ${moment(reservation.checkIn).format('DD-MM-YYY')}`,
							checkOut: `Check out trước 12 giờ ${moment(reservation.checkOut).format('DD-MM-YYY')}`,
							totalPrice: `${reservation.totalPrice} VNĐ`,
							cancelLink: process.env.CANCELED_URL + "?" + querystring.stringify({ ...vnp_Params, vnp_SecureHash: secureHash }, { encode: false })
						}
					);
					mailer.send(constants.confirmEmails.from, reservation?.invoice?.email, "Booking sucessfull", html);

					return cb(null, "Payment success.", reservation);
				})

			})
		});
	} else {
		cb("Signed not matched");
	}
};

exports.cancelPayment = (req, cb) => {
	var vnp_Params = req.query;

	var secureHash = vnp_Params["vnp_SecureHash"];

	delete vnp_Params["vnp_SecureHash"];
	delete vnp_Params["vnp_SecureHashType"];

	vnp_Params = sortObject(vnp_Params);

	var secretKey = process.env.VNP_HASHSECRET;

	var signData = querystring.stringify(vnp_Params, { encode: false });
	var hmac = crypto.createHmac("sha512", secretKey);
	var signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
	if (secureHash === signed) {
		Reservation.findOne({
			orderId: vnp_Params["vnp_TxnRef"]
		}).then((reservation) => {
			if (!reservation) return cb(`Order ${vnp_Params["vnp_TxnRef"]} not exist.`)
			if(reservation.status === RESERVATION_STATUS.PENDING_CANCELED) {
				return  cb(`Your request is in progress.`)
			}
			const allowCancel = isAllowCanceled(reservation)
			if (!allowCancel) return cb(`Order not allow cancel.`)

			_updatePaymentStatus(vnp_Params["vnp_TxnRef"], RESERVATION_STATUS.PENDING_CANCELED, (error) => {
				if (error) return cb(error)
				return cb(null, 'Reservation pendding canceled.')
			})
		}, (error) => {
			return cb(error?.message)
		})
	} else {
		return cb('Sign not matched.')
	}
}
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
