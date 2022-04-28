const moment = require("moment");
const querystring = require("qs");
const crypto = require("crypto");
const axios = require('axios')
const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");
const { customAlphabet } = require('nanoid')

const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const { getMessage } = require("../helpers/vnpay");
const Reservation = require("../models/ReservationModel");
const { RESERVATION_STATUS } = require("../constants/index");
const RoomTypeService = require('../services/RoomTypeService');
const ReservationService = require('../services/ReservationService')
const { isAllowCanceled } = require("../helpers/time");
const nanoIdAlphabet = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 6)

exports.getUrl = async (body) => {
	try {
		let partnerCode = process.env.MOMO_PARTNER_CODE;
		let accessKey = process.env.MOMO_ACCESS_KEY;
		let secretkey = process.env.MOMO_SECRET_KEY;

		let requestId = new Date().getTime()
		let orderId = requestId;
		let orderInfo = body.orderDescription;
		let redirectUrl = process.env.MOMO_REDIRECT_URL;
		let ipnUrl = process.env.MOMO_IPN_URL;
		let amount = body.amount;
		let requestType = "captureWallet";
		let extraData = Buffer.from(JSON.stringify({
			...body,
			orderId
		})).toString("base64"); //pass empty value if your merchant does not have stores

		let rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
		const crypto = require("crypto");
		let signature = crypto.createHmac("sha256", secretkey)
			.update(rawSignature)
			.digest("hex");

		//json object send to MoMo endpoint
		const requestBody = {
			partnerCode: partnerCode,
			accessKey: accessKey,
			requestId: requestId,
			amount: amount,
			orderId: orderId,
			orderInfo: orderInfo,
			redirectUrl: redirectUrl,
			ipnUrl: ipnUrl,
			extraData: extraData,
			requestType: requestType,
			signature: signature,
			lang: "vi"
		}

		//Create the HTTPS objects
		const res = await axios.post(process.env.MOMO_HOST, requestBody)

		return { ...res?.data, url: res?.data?.payUrl }
	} catch (error) {
		return Promise.reject(error?.message || error)
	}
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

exports.paymentReturn = (body, cb) => {
	let vnp_Params = body;

	let secureHash = vnp_Params["vnp_SecureHash"];

	delete vnp_Params["vnp_SecureHash"];
	delete vnp_Params["vnp_SecureHashType"];

	vnp_Params = sortObject(vnp_Params);

	let secretKey = process.env.VNP_HASHSECRET;
	// Sign
	let signData = querystring.stringify(vnp_Params, { encode: false });
	let hmac = crypto.createHmac("sha512", secretKey);
	let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
	let orderId = vnp_Params["vnp_TxnRef"]

	if (secureHash !== signed) return cb("Chữ ký không hợp lệ.");
	// Verify payment status code
	if (vnp_Params["vnp_ResponseCode"] !== "00") {
		// Payment fail then update status reservation to rejected
		return _updatePaymentStatus(orderId, RESERVATION_STATUS.REJECTED, (error) => {
			if (error) return cb(error);
			return cb(getMessage(vnp_Params["vnp_ResponseCode"]));
		})
	}
	// Update status reservation
	Reservation.findOne({
		orderId
	}).then(reservation => {
		if (!reservation) return cb(`Order id: ${orderId} not exist.`);

		ReservationService.isReservationValid(reservation).then(() => {
			return ReservationService.update(orderId, {
				status: RESERVATION_STATUS.PENDING_COMPLETED
			}).then(() => {
				const html = nunjucks.render(
					path.resolve("template", "payement_success.html"),
					{
						full_name: reservation?.invoice?.fullname,
						phone: reservation?.invoice?.phone,
						email: reservation?.invoice?.email,
						order_id: orderId,
						checkIn: `Check in sau ${process.env.CHECKIN} giờ ${moment(reservation.checkIn).format('DD-MM-YYY')}`,
						checkOut: `Check out trước ${process.env.CHECKOUT} giờ ${moment(reservation.checkOut).format('DD-MM-YYY')}`,
						totalPrice: `${reservation.totalPrice} VNĐ`
					}
				);
				mailer.send(constants.confirmEmails.from, reservation?.invoice?.email, "Booking sucessfull.", html);

				return cb(null, "Booking sucessfull.", reservation);
			}, (error) => {
				if (error) return cb(error);
			})
		}).catch(() => {
			// Refund and Update status reservation to refunded
			return ReservationService.update(orderId, {
				status: RESERVATION_STATUS.REFUNDED,
				reason: 'Your room occupy. We will refund your money. Please choose other room.'
			}).then(() => {
				return cb(`Your room occupy. We will refund your money. Please choose other room.`);
			}, (error) => {
				return cb(error);
			})
		})
	});
};

exports.cancelPayment = (req, cb) => {
	let params = req.query;

	let secureHash = params["secureHash"];

	delete params["secureHash"];


	let secretKey = process.env.VNP_HASHSECRET;

	let signData = querystring.stringify(params, { encode: false });
	let hmac = crypto.createHmac("sha512", secretKey);
	let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

	if (secureHash === signed) {
		Reservation.findOne({
			_id: params['id']
		}).then((reservation) => {
			if (!reservation) return cb(`Order ${params["orderId"]} not exist.`)
			if (reservation.status === RESERVATION_STATUS.CANCELED) {
				return cb(`Your request is in progress.`)
			}
			const allowCancel = isAllowCanceled(reservation)
			if (!allowCancel) return cb(`Your request is expired (before checkin day at least ${process.env.RESERVATION_LIFE_CANCELED} days)`)

			_updatePaymentStatus(reservation["orderId"], RESERVATION_STATUS.CANCELED, (error) => {
				if (error) return cb(error)
				return cb(null, 'Reservation pendding canceled.')
			})
		}, (error) => {
			return cb(error?.message)
		})
	} else {
		return cb('Checksum fail.')
	}
}

exports.refund = (req, cb) => {
	ReservationService.changeStatus(req, cb)
}

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
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
