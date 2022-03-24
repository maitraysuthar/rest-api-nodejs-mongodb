const _ = require("lodash");

const { omitNullishObject } = require("../helpers/utility");
const Reservation = require("../models/ReservationModel");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { isSuperAdmin } = require("../helpers/user");
const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");

exports.reservationStore = [
	(req, res) => {
		const reservation = new Reservation(
			omitNullishObject(
				{
					checkIn: getCheckInTimeToDate(req.body.checkIn),
					checkOut: getCheckOutTimeToDate(req.body.checkOut),
					amount: req.body.amount,
					roomtype: req.body.roomtype,
					invoice: req.body.invoice,
					totalPrice: req.body.totalPrice
				}
			)
		);
		reservation.save().then(() => {
			return apiResponse.successResponse(res, "Booking success.");
		}, (err) => {
			return apiResponse.ErrorResponse(res, err);
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
