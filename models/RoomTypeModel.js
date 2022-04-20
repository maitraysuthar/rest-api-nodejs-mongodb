var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var RoomTypeSchema = new Schema({
	name: { type: String, required: true, unique: true },
	description: { type: String, default: "" },
	resort: { type: Schema.ObjectId, ref: "Resort", required: true },
	price: { type: Number, required: true },
	sale: { type: Number, default: 0 },
	maxAdult: { type: Number, required: true },
	maxChildren: { type: Number, required: true },
	cryptoRoom: { type: Number, required: true },
	paymentRoom: { type: Number, required: true },
	avatar: { type: String },
	imgs: [{ type: String }],
	status: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model("RoomType", RoomTypeSchema);