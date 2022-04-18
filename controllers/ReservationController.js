const { body, validationResult } = require("express-validator");
const querystring = require("qs");
const crypto = require("crypto");

const { omitNullishObject } = require("../helpers/utility");
const Reservation = require("../models/ReservationModel");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { isSuperAdmin } = require("../helpers/user");
const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");
const ReservationService = require("../services/ReservationService");
const { authAdmin } = require("../middlewares/role");
/**
 * Sign body
 */
exports.sign = [
	body("invoice.fullname", "Email not valid.").isLength({ min: 1 }).trim(),
	body("invoice.email", "Email not valid.").isEmail().trim(),
	body("invoice.phone", "Phone not valid.").isMobilePhone().trim(),
	body("totalPrice", "Total price must be integer").isInt({ min: 1 }).trim(),
	(req, res) => {
		var secretKey = process.env.VNP_HASHSECRET;
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(res, errors.array()[0].msg, errors.array());
		}
		let params = omitNullishObject(req.body);
		// params = sortObject(params);
		var signData = querystring.stringify(params, { encode: false });
		var hmac = crypto.createHmac("sha512", secretKey);
		var signed = hmac.update(signData).digest("hex");
		return apiResponse.successResponseWithData(res, "Sign success!", signed);
	}
];
/**
 * Create reservation with status pendding payment
 */
exports.reservationStore = [
	body("invoice.fullname", "Email not valid.").isLength({ min: 1 }).trim(),
	body("invoice.email", "Email not valid.").isEmail().trim(),
	body("invoice.phone", "Phone not valid.").isMobilePhone().trim(),
	body("totalPrice", "Total price must be integer").isInt({ min: 1 }).trim(),
	(req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(res, errors.array()[0].msg, errors.array());
		}
		// CHECKSUM
		var secretKey = process.env.VNP_HASHSECRET;
		let params = { ...req.body };
		let secureHash = req.body.secureHash;
		delete params["secureHash"];
		params = omitNullishObject(params);
		// params = sortObject(params);
		var signData = querystring.stringify(params, { encode: false });
		var hmac = crypto.createHmac("sha512", secretKey);
		var signed = hmac.update(signData).digest("hex");
		if (signed == secureHash) {
			const reservation = new Reservation(
				omitNullishObject(
					{
						checkIn: getCheckInTimeToDate(req.body.checkIn),
						checkOut: getCheckOutTimeToDate(req.body.checkOut),
						rooms: req.body.rooms,
						invoice: req.body.invoice,
						totalPrice: req.body.totalPrice,
						orderId: req.body.orderId
					}
				)
			);
			ReservationService.create(reservation, (err) => {
				if (err) return apiResponse.ErrorResponse(res, err);
				return apiResponse.successResponse(res, "Reservation create success.");
			});
		} else {
			return apiResponse.ErrorResponse(res, "Checksum fail.");
		}

	}
];
/**
 * Fetch list reservation by admin
 */
exports.reservationList = [
	auth,
	(req, res) => {
		let query = {};
		Reservation.find(query).populate({
			path: "rooms.roomId",
			model: "RoomType",
			populate: {
				path: "resort",
				model: "Resort"
			}
		}).then(reservations => {
			if (reservations.length > 0) {
				if (isSuperAdmin(req.user)) return apiResponse.successResponseWithData(res, "Operation success", reservations);

				const resortIndex = Object.fromEntries(req.user.resort.map(key => [key, true]));
				reservations = reservations.filter(e => resortIndex[e.roomtype.resort._id]);
				return apiResponse.successResponseWithData(res, "Operation success", reservations);
			} else {
				return apiResponse.successResponseWithData(res, "Operation success", []);
			}
		});
	}
];
/**
 * Set status reservation to COMPLETED
 */
exports.checkout = [
	auth,
	authAdmin,
	(req, res) => {
		ReservationService.changeStatus(req, (error) => {
			if (error) return apiResponse.ErrorResponse(res, error);
			apiResponse.successResponse(res, "Operation success");
		});
	}
];
