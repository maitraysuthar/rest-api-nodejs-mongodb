const { body, validationResult } = require("express-validator");

const { omitNullishObject } = require("../helpers/utility");
const Reservation = require("../models/ReservationModel");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { isSuperAdmin } = require("../helpers/user");
const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");
const ReservationService = require("../services/ReservationService");
const { authAdmin } = require("../middlewares/role");
const { sign } = require("../helpers/crypto");
/**
 * Sign body
 */
exports.sign = [
	(req, res) => {
		let signed = sign(req.body);
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
		let params = { ...req.body };
		let secureHash = req.body.secureHash;
		delete params["secureHash"];
		params = omitNullishObject(params);
		// params = sortObject(params);
		let signed = sign(params);
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
				reservations = reservations.filter(e => e.rooms.find(r => {
					return resortIndex[r?.roomId?.resort?._id];
				}));
				return apiResponse.successResponseWithData(res, "Operation success", reservations);
			} else {
				return apiResponse.successResponseWithData(res, "Operation success", []);
			}
		});
	}
];
/**
 * Checkout reservation by admin
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

exports.cancel = [
	auth,
	authAdmin,
	async (req, res) => {
		try {
			await ReservationService.cancel(req.body);
			return apiResponse.successResponse(res, "Operation success");
		} catch (error) {
			return apiResponse.ErrorResponse(res, error.message || error);
		}
	}
];