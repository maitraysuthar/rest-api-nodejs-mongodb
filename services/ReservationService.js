const moment = require("moment");
const RoomTypeService = require("../services/RoomTypeService");
const { max } = require('lodash')
exports.create = (reservation, cb) => {
    RoomTypeService.roomTypeDetail({
        roomtype: reservation.roomtype,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut
    }, (error, room) => {
        if (error) return cb(error);
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