const moment = require("moment");
const RoomTypeService = require("../services/RoomTypeService");
const Reservation = require("../models/ReservationModel");
const { RESERVATION_STATUS } = require("../constants/index");

const { max } = require('lodash')

/**
 * Validate room of reservation has valid?
 * @param {*} roomtype ObjectID
 * @param {*} reservation 
 * @returns 
 */
const isRoomValid = (roomtype, reservation, amount) => {
	return new Promise((resolve, reject) => {
		RoomTypeService.roomTypeDetail({
			roomtype: roomtype,
			checkIn: reservation.checkIn,
			checkOut: reservation.checkOut
		}, (error, room) => {
			if (error) return reject(error);

			// Validate resort have blocked
			if (!room?.resort?.status) {
				return reject(`The resort ${room?.resort?.name} had blocked`);
			}

			// Validate amount
			const capacity = room.capacity
			if (amount > capacity) {
				return reject("Room amount invalid");
			}
			return resolve();
		});
	})
}
exports.isRoomValid = isRoomValid;
/**
 * Validate reservation has valid
 * @param {*} reservation 
 * @returns 
 */
exports.isReservationValid = (reservation) => {
	// Verify amount per room
	return Promise.all(reservation.rooms.map(r => {
		return isRoomValid(r.roomId, reservation, r.amount)
	}))
}

/**
 * 
 * @param {*} reservation 
 * @param {*} cb 
 */
exports.create = (reservation, cb) => {
	// Check valid rooms
	Promise.all(reservation.rooms.map(r => {
		return isRoomValid(r.roomId, reservation, r.amount)
	})).then(() => {
		reservation.save().then(() => {
			return cb(null, 'Reservation created')
		}, (err) => {
			return cb(err)
		});
	}).catch(error => {
		cb(error)
	})

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
			return cb(error)
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
/**
 * 
 * @param {*} orderId 
 * @param {*} update 
 */
exports.update = async (orderId, update) => {
	try {
		let reservation = await Reservation.findOne({ orderId: orderId })

		if (!reservation) {
			return Promise.reject(new Error(`Order id: ${orderId} not exist.`));
		}

		await Reservation.findOneAndUpdate(
			{
				orderId: orderId
			},
			update
		)
	} catch (error) {
		return Promise.reject(error)
	}
}