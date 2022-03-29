const { body, validationResult } = require("express-validator");

const { omitNullishObject } = require("../helpers/utility");
const Reservation = require("../models/ReservationModel");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { isSuperAdmin } = require("../helpers/user");
const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");
const ReservationService = require("../services/ReservationService");
exports.reservationStore = [
	body("amount", "Amount must be integer.").isInt({ min: 1 }).trim(),
	body("invoice.fullname", "Email not valid.").isLength({ min: 1 }).trim(),
	body("invoice.email", "Email not valid.").isEmail().trim(),
	body("invoice.phone", "Phone not valid.").isMobilePhone().trim(),
	body("totalPrice", "Total price must be integer").isInt({ min: 1 }).trim(),
	(req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return apiResponse.validationErrorWithData(res, errors.array()[0].msg, errors.array());
		}

		const reservation = new Reservation(
			omitNullishObject(
				{
					checkIn: getCheckInTimeToDate(req.body.checkIn),
					checkOut: getCheckOutTimeToDate(req.body.checkOut),
					amount: req.body.amount,
					roomtype: req.body.roomtype,
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
	}
];
exports.reservationList = [
	auth,
	(req, res) => {
		let query = {};
		Reservation.find(query).populate({
			path: "roomtype",
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
