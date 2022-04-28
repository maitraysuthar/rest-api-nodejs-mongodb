var mongoose = require("mongoose");
var moment = require("moment");

var { RESERVATION_STATUS } = require("../constants/index");

var Schema = mongoose.Schema;

var InvoiceSchame = mongoose.Schema({
	fullname: { type: String, required: true },
	email: { type: String, required: true },
	phone: { type: String, required: true },
	message: { type: String },
	transId: { type: String }
});
var History = mongoose.Schema({
	rejectedTime: { type: Schema.Types.Mixed },
	refundedTime: { type: Schema.Types.Mixed },
	completedTime: { type: Schema.Types.Mixed },
	canceledTime: { type: Schema.Types.Mixed },
	penddingCanceledTime: { type: Schema.Types.Mixed },
	penddingCompletedTime: { type: Schema.Types.Mixed },
	pendingRefundedTime: { type: Schema.Types.Mixed },
	pendingPayment: { type: Schema.Types.Mixed }
});

var Note = mongoose.Schema({
	message: { type: String }
});

var Room = mongoose.Schema({
	roomId: { type: Schema.ObjectId, ref: "RoomType", required: true },
	amount: { type: Number, required: true, default: 1 }
});

var ReservationSchema = new Schema({
	rooms: [Room],
	checkIn: { type: Date, required: true },
	checkOut: { type: Date, required: true },
	totalPrice: { type: Number, required: true },
	status: { type: Number, enum: Object.values(RESERVATION_STATUS), default: RESERVATION_STATUS.PENDING_PAYMENT },
	invoice: { type: InvoiceSchame, required: true },
	orderId: { type: String, required: true, unique: true },
	history: { type: History, default: {} },
	note: Note
}, { timestamps: true });

ReservationSchema.pre("save", function (next) {
	this.history = {
		pendingPayment: {
			time: moment(moment.now()).toDate(),
			reason: ""
		}
	};
	return next();
});

ReservationSchema.pre("findOneAndUpdate", async function (next) {
	const status = this.getUpdate().status;
	const reason = this.getUpdate().reason || "";
	const now = moment(moment.now()).toDate();

	if (status == null) return next();

	if (status == RESERVATION_STATUS.REJECTED) {
		this.set("history.rejectedTime", {
			time: now,
			reason
		});
	}
	if (status == RESERVATION_STATUS.REFUNDED) {
		this.set("history.refundedTime", {
			time: now,
			reason
		});
	}
	if (status == RESERVATION_STATUS.COMPLETED) {
		this.set("history.completedTime", {
			time: now,
			reason
		});
	}
	if (status == RESERVATION_STATUS.CANCELED) {
		this.set("history.canceledTime", {
			time: now,
			reason
		});
	}
	if (status == RESERVATION_STATUS.PENDING_CANCELED) {
		this.set("history.penddingCanceledTime", {
			time: now,
			reason
		});
	}
	if (status == RESERVATION_STATUS.PENDING_REFUNDED) {
		this.set("history.pendingRefundedTime", {
			time: now,
			reason
		});
	}
	if (status == RESERVATION_STATUS.PENDING_COMPLETED) {
		this.set("history.penddingCompletedTime", {
			time: now,
			reason
		});
	}

	return next();
});

module.exports = mongoose.model("Reservation", ReservationSchema);