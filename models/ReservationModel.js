var mongoose = require("mongoose");
var moment = require("moment");

var { RESERVATION_STATUS } = require("../constants/index");

var Schema = mongoose.Schema;

var InvoiceSchame = mongoose.Schema({
	fullname: { type: String, required: true },
	email: { type: String, required: true },
	phone: { type: String, required: true },
	message: { type: String }
});
var History = mongoose.Schema({
	rejectedTime: { type: Date },
	refundedTime: { type: Date },
	completedTime: { type: Date },
	canceledTime: { type: Date },
	penddingCanceledTime: { type: Date },
	penddingCompletedTime: { type: Date },
	pendingRefundedTime: { type: Date },
	pendingPayment: { type: Date }
});

var Room = mongoose.Schema({
	roomId: { type: Schema.ObjectId, ref: "RoomType", required: true },
	amount: { type: Number, required: true, default: 1 }
});

var ReservationSchema = new Schema({
	rooms: [Room],
	checkIn: { type: Date, required: true },
	checkOut: { type: Date, required: true },
	amount: { type: Number, required: true, default: 1 },
	totalPrice: { type: Number, required: true },
	status: { type: Number, enum: Object.values(RESERVATION_STATUS), default: RESERVATION_STATUS.PENDING_PAYMENT },
	invoice: { type: InvoiceSchame, required: true },
	orderId: { type: String, required: true, unique: true },
	history: { type: History, default: {} }
}, { timestamps: true });

ReservationSchema.pre("save", function (next) {
	this.history = {
		pendingPayment: moment(moment.now()).toDate()
	};
	return next();
});

ReservationSchema.pre("findOneAndUpdate", async function (next) {
	const status = this.getUpdate().status;
	const now = moment(moment.now()).toDate();

	if (status == null) return next();

	if (status == RESERVATION_STATUS.REJECTED) {
		this.set("history.rejectedTime", now);
	}
	if (status == RESERVATION_STATUS.REFUNDED) {
		this.set("history.refundedTime", now);
	}
	if (status == RESERVATION_STATUS.COMPLETED) {
		this.set("history.completedTime", now);
	}
	if (status == RESERVATION_STATUS.CANCELED) {
		this.set("history.canceledTime", now);
	}
	if (status == RESERVATION_STATUS.PENDING_CANCELED) {
		this.set("history.penddingCanceledTime", now);
	}
	if (status == RESERVATION_STATUS.PENDING_REFUNDED) {
		this.set("history.pendingRefundedTime", now);
	}
	if (status == RESERVATION_STATUS.PENDING_COMPLETED) {
		this.set("history.penddingCompletedTime", now);
	}

	return next();
});

module.exports = mongoose.model("Reservation", ReservationSchema);