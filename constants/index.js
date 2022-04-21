const { moment } = require("../helpers/time");
exports.RESERVATION_STATUS = {
	PENDING_PAYMENT: 0,
	PENDING_COMPLETED: 1,
	COMPLETED: 2,
	CANCELED: 3,
	REJECTED: 4,
	REFUNDED: 5,
	PENDING_REFUNDED: 6,
	PENDING_CANCELED: 7
};


exports.TIMELINE_EVENT = {
	WEEKEND: {
		match: (time) => {
			return moment(time).day() == 0 || moment(time).day() == 6;
		}
	}
};