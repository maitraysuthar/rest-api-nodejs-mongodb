const moment = require("moment");

exports.getCheckInTimeToDate = (time) => {
	return moment(Number(time)).set({ "hour": 15, "minute": 0, "second": 0 }).toDate();
};
exports.getCheckOutTimeToDate = (time) => {
	return moment(Number(time)).set({ "hour": 12, "minute": 0, "second": 0 }).toDate();
};