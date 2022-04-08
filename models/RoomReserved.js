var mongoose = require("mongoose");


var Schema = mongoose.Schema;

var RoomReserved = new Schema({
	roomtype: { type: Schema.ObjectId, ref: "RoomType", required: true },
	reservation: { type: Schema.ObjectId, ref: "Reservation", required: true },
	amount: { type: Number, required: true, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("RoomReserved", RoomReserved);