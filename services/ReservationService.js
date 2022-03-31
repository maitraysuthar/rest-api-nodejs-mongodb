const moment = require("moment");
const RoomTypeService = require("../services/RoomTypeService");
const Reservation = require("../models/ReservationModel");
const { RESERVATION_STATUS } = require("../constants/index");

const { max } = require('lodash')
/**
 * 
 * @param {*} reservation 
 * @param {*} cb 
 */
exports.create = (reservation, cb) => {
	RoomTypeService.roomTypeDetail({
		roomtype: reservation.roomtype,
		checkIn: reservation.checkIn,
		checkOut: reservation.checkOut
	}, (error, room) => {
		if (error) return cb(error);

		// Validate checkin checkout
		if (moment(reservation.checkIn).isBefore(moment.now(), 'day')) {
			return cb(`The checkIn must be greater than or equal now`);
		}

		if (moment(reservation.checkIn).isSame(reservation.checkOut, 'day') || moment(reservation.checkIn).isAfter(reservation.checkOut, 'day')) {
			return cb(`The checkIn must be greater checkOut`);
		}

		// Validate resort have blocked
		if (!room?.resort?.status) {
			return cb(`The resort ${room?.resort?.name} had blocked`);
		}

		// Validate price
		const days = Math.round(Math.abs(moment.duration(moment(reservation.checkIn).diff(moment(reservation.checkOut))).asDays()));
		if (reservation.totalPrice !== (room.price - (room.price * room.sale) / 100) * days * reservation.amount) {
			return cb("Total price invalid");
		}
		// Validate amount
		const capacity = room.capacity
		if (reservation.amount > capacity) {
			return cb("Room amount invalid");
		}
		reservation.save().then(() => {
			return cb(null);
		}, (err) => {
			return cb(err?.message);
		});
	});
};

exports.changeStatus = (req, cb) => {
	const orderId = req.params.id
	Reservation.findOne({
		orderId: orderId
	}).then((foundReservation) => {
		if (!foundReservation) return cb(`Order ${orderId} not exist!`)
		if (foundReservation.status != RESERVATION_STATUS.PENDING_CANCELED && foundReservation.status != RESERVATION_STATUS.PENDING_REFUNDED && foundReservation.status != RESERVATION_STATUS.PENDING_COMPLETED) {
			return cb(`You can't change status of reservation different PENDING_CANCELED, PENDING_REFUNDED, PENDING_COMPLETED`)
		}
		const callbackSuccess = () => {
			return cb(null)
		}
		const callbackFail = (error) => {
			return cb(error?.message)
		}

		if (foundReservation.status == RESERVATION_STATUS.PENDING_COMPLETED) {
			Reservation.findOneAndUpdate({
				orderId: orderId
			}, {
				status: RESERVATION_STATUS.COMPLETED
			}).then(callbackSuccess, callbackFail)
		}

		if (foundReservation.status == RESERVATION_STATUS.PENDING_CANCELED) {
			Reservation.findOneAndUpdate({
				orderId: orderId
			}, {
				status: RESERVATION_STATUS.CANCELED
			}).then(callbackSuccess, callbackFail)
		}

		if (foundReservation.status == RESERVATION_STATUS.PENDING_REFUNDED) {
			Reservation.findOneAndUpdate({
				orderId: orderId
			}, {
				status: RESERVATION_STATUS.REFUNDED
			}).then(callbackSuccess, callbackFail)
		}
	})
}