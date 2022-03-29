var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var InvoiceSchame = mongoose.Schema({
	fullname: { type: String, required: true },
	email: { type: String, required: true },
	phone: { type: String, required: true },
	message: { type: String }
});

var STATUS = {
	PENDING: 0,
	BOOKED: 1,
	COMPLETED: 2,
	CANCELED: 3,
	REJECTED: 4,
	REFUNDED: 5
};

var ReservationSchema = new Schema({
	roomtype: { type: Schema.ObjectId, ref: "RoomType", required: true },
	checkIn: { type: Date, required: true },
	checkOut: { type: Date, required: true },
	amount: { type: Number, required: true, default: 1 },
	totalPrice: { type: Number, required: true },
	status: { type: Number, enum: Object.values(STATUS), default: 0 },
	invoice: { type: InvoiceSchame, required: true },
	orderId: { type: String, required: true, unique: true }
}, { timestamps: true });


module.exports = mongoose.model("Reservation", ReservationSchema);