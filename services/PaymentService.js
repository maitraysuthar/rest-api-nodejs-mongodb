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
const { getMessage } = require("../helpers/momo");
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

exports.ipn = async (body, cb) => {
	var params = body;
	var secureHash = params.signature;
	var accessKey = process.env.MOMO_ACCESS_KEY;
	var secretkey = process.env.MOMO_SECRET_KEY;
	var orderId = params.orderId
	var resultCode = params.resultCode
	var transId = params.transId
	delete params['signature']

	var rawSignature = `accessKey=${accessKey}&amount=${params.amount}&extraData=${params.extraData}&message=${params.message}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&orderType=${params.orderType}&partnerCode=${params.partnerCode}&payType=${params.payType}&requestId=${params.requestId}&responseTime=${params.responseTime}&resultCode=${params.resultCode}&transId=${params.transId}`;

	var signature = crypto.createHmac("sha256", secretkey)
		.update(rawSignature)
		.digest("hex");
	if (secureHash != signature) return cb("Checksum fail.");

	// Handle payment fail
	if (resultCode != "0") {
		// Payment fail then update status reservation to rejected
		return ReservationService.update(orderId, {
			status: RESERVATION_STATUS.REJECTED,
			reason: getMessage(resultCode),
			'invoice.transId': transId
		}).then(_ => {
			return cb(getMessage(resultCode))
		}, (error) => {
			return cb(error)
		})
	}
	// Handle payment sucessfull
	let reservation = await Reservation.findOne({ orderId })
	if (!reservation) return cb(`Order id: ${orderId} not exist.`);
	// Verify rooms of reservation
	ReservationService.isReservationValid(reservation).then(async () => {
		await ReservationService.update(orderId, {
			status: RESERVATION_STATUS.PENDING_COMPLETED,
			'invoice.transId': transId
		})
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
	}).catch(async () => {
		// Handle refund and Update status reservation to refunded
		await ReservationService.update(orderId, {
			status: RESERVATION_STATUS.REFUNDED,
			'invoice.transId': transId,
			reason: 'Rất tiếc phòng hiện tại đã hết. Chúng tối sẽ trả lại tiền cho bạn. Trong vòng 5p nếu không nhận được tiền vui lòng liên hệ 000000000 để được hỗ trợ.'
		})
		return cb('Rất tiếc phòng hiện tại đã hết. Chúng tối sẽ trả lại tiền cho bạn. Trong vòng 5p nếu không nhận được tiền vui lòng liên hệ 000000000 để được hỗ trợ.');
	})
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
/**
 * 
 * @param {*} reservation 
 * @param {*} amount refund amount
 */
exports.refund = async (reservation, amount) => {

	var accessKey = process.env.MOMO_ACCESS_KEY;
	var secretkey = process.env.MOMO_SECRET_KEY;
	var partnerCode = process.env.MOMO_PARTNER_CODE;

	let orderId = new Date().getTime()
	const transId = reservation.invoice.transId;
	const rawSignature = `accessKey=${accessKey}&amount=${amount}&description=${''}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${orderId}&transId=${transId}`

	var signature = crypto.createHmac("sha256", secretkey)
		.update(rawSignature)
		.digest("hex");

	const requestBody = {
		partnerCode,
		orderId: orderId,
		requestId: orderId,
		amount,
		transId,
		lang: "vi",
		description: '',
		signature: signature
	}
	try {
		const res = await axios.post(process.env.MOMO_REFUND_URL, requestBody)
		return res.data
	} catch (error) {
		let data = error?.response?.data
		if (data && data.resultCode == 11) {
			return Promise.resolve(data)
		}
		return Promise.reject(error)
	}
}
