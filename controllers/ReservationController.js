const _ = require("lodash");

const { omitNullishObject } = require("../helpers/utility");
const Reservation = require("../models/ReservationModel");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { isSuperAdmin } = require("../helpers/user");
const {contains} = require("../helpers/utility")
exports.reservationStore = [
	(req, res) => {
		const reservation = new Reservation(
			omitNullishObject(
				{
					checkIn: req.body.checkIn,
					checkOut: req.body.checkOut,
					amount: req.body.amount,
					roomtype: req.body.roomtype,
					invoice: req.body.invoice,
					totalPrice:req.body.totalPrice
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
		Reservation.aggregate([
			// {$match:{"email":req.user.email}},

		]);
		Reservation.find(query).populate("roomtype").then(reservations => {
			if (reservations.length > 0) {
				if(isSuperAdmin(req.user)) return apiResponse.successResponseWithData(res, "Operation success", reservations);

				const resortIndex = Object.fromEntries(req.user.resort.map(key => [key, true]));
				
				reservations = reservations.filter(e=>contains(e.roomtype.resort,resortIndex));
				return apiResponse.successResponseWithData(res, "Operation success", reservations);
			} else {
				return apiResponse.successResponseWithData(res, "Operation success", []);
			}
		});
	}
];
