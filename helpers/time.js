const Moment = require("moment");
const MomentRange = require("moment-range");

const moment = MomentRange.extendMoment(Moment);

exports.getCheckInTimeToDate = (time) => {
	return moment(Number(time)).set({ "hour": 15, "minute": 0, "second": 0, "millisecond": 0 }).toDate();
};
exports.getCheckOutTimeToDate = (time) => {
	return moment(Number(time)).set({ "hour": 12, "minute": 0, "second": 0, "millisecond": 0 }).toDate();
};
/**
 * Check if payment is allowed to cancel
 * 
 * @param {*} createdAt ISO_DATE
 * 
 * return true if payment created not over 1 day and time cancel < timeCheckIn
 */
exports.isAllowCanceled = (reservation) => {
	const timeCheckIn = moment(reservation.checkIn).subtract(process.env.RESERVATION_LIFE_CANCELED, "day");

	return moment(moment.now()).isBefore(timeCheckIn);
};

exports.moment = moment;