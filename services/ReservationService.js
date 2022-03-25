const moment = require("moment");
const RoomTypeService = require("../services/RoomTypeService");
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
        const romNoneAvailable = room?.reservations?.reduce((res, next) => res + next.amount, 0) || 0
        if (reservation.amount > room.quantity - max([romNoneAvailable, 0])) {
            return cb("Room amount invalid");
        }
        reservation.save().then(() => {
            return cb(null);
        }, (err) => {
            return cb(err);
        });
    });
};