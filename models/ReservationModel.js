var mongoose = require("mongoose");
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

var ReservationSchema = new Schema({
	roomtype: { type: Schema.ObjectId, ref: "RoomType", required: true },
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
		pendingPayment: new Date()
	};
	return next();
});

ReservationSchema.pre("findOneAndUpdate", async function (next) {
	const status = this.getUpdate().status;
	if (status == null) return next();

	if (status == RESERVATION_STATUS.REJECTED) {
		this.set("history.rejectedTime", new Date());
	}
	if (status == RESERVATION_STATUS.REFUNDED) {
		this.set("history.refundedTime", new Date());
	}
	if (status == RESERVATION_STATUS.COMPLETED) {
		this.set("history.completedTime", new Date());
	}
	if (status == RESERVATION_STATUS.CANCELED) {
		this.set("history.canceledTime", new Date());
	}
	if (status == RESERVATION_STATUS.PENDING_CANCELED) {
		this.set("history.penddingCanceledTime", new Date());
	}
	if (status == RESERVATION_STATUS.PENDING_REFUNDED) {
		this.set("history.pendingRefundedTime", new Date());
	}
	if (status == RESERVATION_STATUS.PENDING_COMPLETED) {
		this.set("history.penddingCompletedTime", new Date());
	}
	
	return next();
});

module.exports = mongoose.model("Reservation", ReservationSchema);